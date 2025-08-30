// src/pages/EditVer2.jsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Rightbar from '../components/Rightbar';
import FilePreviewPanel from '../components/FilePreviewPanel';
import '../styles/Edit.css';
import * as XLSX from 'xlsx';

const EditVer2 = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 사이드바 열림/닫힘 상태 (고정 열림)
  const [isRightbarOpen] = useState(true);

  // 오늘 인기 제목 (hot_topics → 없으면 기본 더미)
  const [hotTopics, setHotTopics] = useState([
    { id: 't1', text: '루키 외야수, 데뷔 첫 홈런으로 팀 승리 견인' },
    { id: 't2', text: '8월 MVP 레이스, 불펜 에이스 급부상' },
    { id: 't3', text: '트레이드 마감 임박, 각 팀 보강 시나리오' },
    { id: 't4', text: 'LG 9회말 끝내기, 선두 굳히기' },
    { id: 't5', text: '신인 포수, 수비 안정감으로 주전 경쟁' },
  ]);

  const [expandedCsvs, setExpandedCsvs] = useState({});
  const [subject, setSubject] = useState(location.state?.defaultSubject || '');
  const [tags] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]); // File[]
  const [previewImages, setPreviewImages] = useState([]); // {name, src}[]
  const [previewCsvs, setPreviewCsvs] = useState([]);     // {name, rows}[]

  // hot_topics 로드
  useEffect(() => {
    const storedTopics = JSON.parse(localStorage.getItem('hot_topics') || '[]');
    if (storedTopics.length) {
      const mapped = storedTopics.map((t, i) => ({ id: t.id || `t${i + 1}`, text: t.text || String(t) }));
      setHotTopics(mapped);
    }
  }, []);

  // --- 간단하지만 견고한 CSV 파서(따옴표/콤마 대응) ---
  const parseCsvFallback = (text) => {
    // HTML 감지
    const head = text.slice(0, 512);
    if (/<(html|!doctype)/i.test(head)) {
      throw new Error('CSV 대신 HTML 응답을 수신했습니다(경로 또는 서버 설정 확인).');
    }
    const rows = [];
    let row = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];

      if (inQuotes) {
        if (ch === '"' && next === '"') {
          cur += '"'; i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          cur += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          row.push(cur); cur = '';
        } else if (ch === '\n') {
          row.push(cur); cur = '';
          // CRLF 대응: 직전이 \r면 제거
          if (row.length && /\r$/.test(row[row.length - 1])) {
            row[row.length - 1] = row[row.length - 1].replace(/\r$/, '');
          }
          rows.push(row); row = [];
        } else {
          cur += ch;
        }
      }
    }
    // 마지막 셀/행
    row.push(cur);
    if (row.length === 1 && row[0] === '' && rows.length) {
      // 빈 마지막 줄이면 무시
    } else {
      rows.push(row);
    }
    // 끝 공백 CR 제거
    return rows.map(r => r.map(c => typeof c === 'string' ? c.replace(/\r$/, '') : c));
  };

  // 공용: File[] 받아서 파싱/미리보기 반영
  const addFiles = async (files) => {
    if (!files?.length) return;

    const newImages = [];
    const newCsvs = [];
    const nextExpanded = { ...expandedCsvs };

    await Promise.all(
      files.map(async (file) => {
        // 이미지
        if (file.type?.startsWith?.('image/')) {
          const url = URL.createObjectURL(file);
          newImages.push({ name: file.name, src: url });
          return;
        }

        // CSV
        if (/\.csv$/i.test(file.name)) {
          const text = await file.text();

          // 방어: HTML로 오인될 수 있는 응답 차단
          const head = text.slice(0, 512);
          if (/<(html|!doctype)/i.test(head)) {
            throw new Error(`CSV 대신 HTML을 받았습니다: ${file.name} (경로/서버 확인 필요)`);
          }

          // 1차: XLSX 파서 (CSV 지원)
          try {
            const wb = XLSX.read(text, { type: 'string' });
            const first = wb.SheetNames[0];
            const sheet = wb.Sheets[first];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' });
            newCsvs.push({ name: file.name, rows });
          } catch (e) {
            // 2차: Fallback CSV 파서
            try {
              const rows = parseCsvFallback(text);
              newCsvs.push({ name: file.name, rows });
            } catch (e2) {
              console.error('CSV 파싱 실패:', e2);
              throw new Error(`CSV 파싱 실패 (${file.name}): ${e2.message}`);
            }
          }
          if (!(file.name in nextExpanded)) nextExpanded[file.name] = false;
          return;
        }

        // XLSX/XLS
        if (/\.xlsx?$/i.test(file.name) || /\.xls$/i.test(file.name)) {
          const buf = await file.arrayBuffer();
          const wb = XLSX.read(buf, { type: 'array' });
          const first = wb.SheetNames[0];
          const sheet = wb.Sheets[first];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' });
          newCsvs.push({ name: file.name, rows });
          if (!(file.name in nextExpanded)) nextExpanded[file.name] = false;
          return;
        }

        // 기타 파일은 목록만 유지(미리보기 생략)
      })
    );

    // 미리보기: 이름 기반 중복 제거
    const dedupByName = (arr) => {
      const seen = new Set();
      return [...arr].filter((f) => {
        const key = f.name || f.src; // 이미지/CSV 모두 대응
        const ok = !seen.has(key);
        if (ok) seen.add(key);
        return ok;
      });
    };

    setPreviewImages((prev) => dedupByName([...prev, ...newImages]));
    setPreviewCsvs((prev) => dedupByName([...prev, ...newCsvs]));
    setExpandedCsvs(nextExpanded);

    // 업로드 목록: name + size + lastModified 기준 중복 제거
    setUploadedFiles((prev) => {
      const map = new Map();
      const push = (f) => {
        const key = `${f.name}|${f.size}|${f.lastModified || 0}`;
        if (!map.has(key)) map.set(key, f);
      };
      prev.forEach(push);
      files.forEach(push);
      return Array.from(map.values());
    });
  };

  // 파일 input → addFiles
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    await addFiles(files);
  };

  // StrictMode 2회 실행 가드
  const preloadRanRef = useRef({ ran: false });

  // Platform에서 넘어온 preloadFiles 처리 (정적 경로 또는 API)
  useEffect(() => {
    if (preloadRanRef.current.ran) return;
    preloadRanRef.current.ran = true;

    const preload = location.state?.preloadFiles;
    const defaultSubject = location.state?.defaultSubject;
    if (defaultSubject) setSubject(defaultSubject);
    if (!preload || !preload.length) return;

    (async () => {
      try {
        const fetched = await Promise.all(
          preload.map(async (p) => {
            // 🔑 한글 파일명 안전: URL 인코딩
            const encodedUrl = /%[0-9A-Fa-f]{2}/.test(p.url) ? p.url : encodeURI(p.url);

            const res = await fetch(encodedUrl, { cache: 'no-store' });
            if (!res.ok) throw new Error(`HTTP ${res.status} for ${p.url}`);

            const ctype = (res.headers.get('content-type') || '').toLowerCase();

            // HTML(404 페이지 등) 방어 1차: Content-Type
            if (ctype.includes('text/html')) {
              const sample = (await res.text()).slice(0, 200);
              throw new Error(`CSV/XLSX 대신 HTML 수신 (${p.url}): ${sample}`);
            }

            const blob = await res.blob();

            // HTML(404 페이지 등) 방어 2차: 본문 스니핑
            // (일부 서버가 content-type을 text/plain 으로 내려주는 경우)
            try {
              const sampleText = await blob.text();
              const head = sampleText.slice(0, 512);
              if (/<(html|!doctype)/i.test(head)) {
                throw new Error(`CSV/XLSX 대신 HTML 수신(${p.url}): ${head.substring(0, 120)}...`);
              }
              // blob을 다시 생성 (text()를 한번 호출하면 재사용 어려울 수 있어 재래핑)
              const safeBlob = new Blob([sampleText], { type: p.type || blob.type || 'text/plain' });
              const file = new File(
                [safeBlob],
                p.name || 'file',
                { type: p.type || blob.type || 'application/octet-stream', lastModified: Date.now() }
              );
              return file;
            } catch (inner) {
              // blob.text()에서 실패하면 원본 blob으로 시도
              const file = new File(
                [blob],
                p.name || 'file',
                { type: p.type || blob.type || 'application/octet-stream', lastModified: Date.now() }
              );
              return file;
            }
          })
        );
        await addFiles(fetched);
      } catch (err) {
        console.error('preloadFiles 처리 실패:', err);
        alert('기사 데이터 파일 로드 중 오류가 발생했습니다.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔁 나중에 "파일 세트"를 통째로 교체하고 싶을 때 사용
  const replacePreloadedFiles = async (fileSpecs = [], newSubject) => {
    try {
      // 미리보기/업로드 상태 초기화
      setPreviewImages([]);
      setPreviewCsvs([]);
      setExpandedCsvs({});
      setUploadedFiles([]);
      if (typeof newSubject === 'string') setSubject(newSubject);

      if (!fileSpecs.length) return;
      const fetched = await Promise.all(
        fileSpecs.map(async (p) => {
          const encodedUrl = /%[0-9A-Fa-f]{2}/.test(p.url) ? p.url : encodeURI(p.url);
          const res = await fetch(encodedUrl, { cache: 'no-store' });
          if (!res.ok) throw new Error(`HTTP ${res.status} for ${p.url}`);

          const ctype = (res.headers.get('content-type') || '').toLowerCase();
          if (ctype.includes('text/html')) {
            const sample = (await res.text()).slice(0, 200);
            throw new Error(`CSV/XLSX 대신 HTML 수신 (${p.url}): ${sample}`);
          }

          const blob = await res.blob();
          try {
            const sampleText = await blob.text();
            const head = sampleText.slice(0, 512);
            if (/<(html|!doctype)/i.test(head)) {
              throw new Error(`CSV/XLSX 대신 HTML 수신(${p.url}): ${head.substring(0, 120)}...`);
            }
            const safeBlob = new Blob([sampleText], { type: p.type || blob.type || 'text/plain' });
            return new File([safeBlob], p.name || 'file', { type: p.type || blob.type || 'application/octet-stream', lastModified: Date.now() });
          } catch {
            return new File([blob], p.name || 'file', { type: p.type || blob.type || 'application/octet-stream', lastModified: Date.now() });
          }
        })
      );
      await addFiles(fetched);
    } catch (e) {
      console.error('replacePreloadedFiles 실패:', e);
      alert('파일 세트 교체 중 오류가 발생했습니다.');
    }
  };

  // CSV 펼침/접기
  const toggleCsvExpansion = (fileName) => {
    setExpandedCsvs((prev) => ({ ...prev, [fileName]: !prev[fileName] }));
  };

  // 다음 단계로 이동 (파일/요청사항 검증)
  const handleNextStep = async () => {
    if (!subject.trim()) {
      alert('요청사항을 입력해주세요!');
      return;
    }
    if (uploadedFiles.length === 0) {
      alert('경기 데이터를 반드시 첨부해주세요!');
      return;
    }

    localStorage.setItem('edit_subject', subject);
    localStorage.setItem('edit_tags', JSON.stringify(tags));
    localStorage.setItem('edit_files', JSON.stringify(uploadedFiles.map((f) => f.name)));

    // 첫 파일 Base64 저장 (기존 호환)
    if (uploadedFiles.length > 0) {
      const firstFile = uploadedFiles[0];
      try {
        const reader = new FileReader();
        const base64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(firstFile);
        });
        localStorage.setItem('edit_file', base64);
        localStorage.setItem('edit_fileName', firstFile.name);
      } catch (e) {
        console.error('파일 변환 실패:', e);
        alert('파일 처리 중 오류가 발생했습니다.');
        return;
      }
    }

    navigate('/edit2', { state: { uploadedFiles } });
  };

  const handleCancel = () => navigate('/');

  // ObjectURL 정리
  useEffect(() => {
    return () => {
      previewImages.forEach((img) => {
        if (img?.src?.startsWith('blob:')) URL.revokeObjectURL(img.src);
      });
    };
  }, [previewImages]);

  const cut = (s, n = 40) => (s?.length > n ? s.slice(0, n) + '…' : s);

  return (
    <div className={`edit-container edit-layout ${isRightbarOpen ? 'rb-open' : 'rb-collapsed'}`}>
      <div className="edit-main">
        <div className="edit-header">
          <h2>스포츠 기사 작성 시작하기</h2>

          {/* 프리셋 교체 예시 버튼(원하면 노출) */}
          {/* <div className="edit-actions">
            <button
              className="button-white"
              onClick={() =>
                replacePreloadedFiles(
                  [
                    { url: '/data/%EB%A6%AC%EB%B7%B0.csv', name: '리뷰.csv', type: 'text/csv' },
                    { url: '/data/%EA%B2%B0%EC%9E%A5.csv', name: '결장.csv', type: 'text/csv' },
                    { url: '/data/%EA%B2%BD%EA%B8%B0%EC%A3%BC%EC%9A%94%EA%B8%B0%EB%A1%9D.csv', name: '경기주요기록.csv', type: 'text/csv' },
                  ],
                  '[LG vs KIA] 새 데이터 세트로 다시 작성'
                )
              }
            >
              프리셋 교체
            </button>
          </div> */}
        </div>

        <div className="edit-form">
          <div className="form-group">
            <label>요청사항</label>
            <textarea
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="예: 두산 투수의 관점에서 기사 작성해 주세요"
            />
          </div>

          <div className="form-group">
            <label>경기 데이터/자료 첨부 (필수)</label>
            <label htmlFor="fileUpload" className="file-upload-label">
              {uploadedFiles.length > 0 ? `${uploadedFiles.length}개 파일 선택됨` : '파일을 선택하거나 드래그'}
            </label>
            <input
              id="fileUpload"
              type="file"
              className="file-input"
              onChange={handleFileChange}
              multiple
              required
              accept="image/*,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            />
          </div>

          <div className="actions">
            <button className="button-white" onClick={handleCancel}>취소</button>
            <button className="button-primary" onClick={handleNextStep}>다음단계</button>
          </div>
        </div>
      </div>

      <div className="rightbar-shell">
        <Rightbar>
          {/* ——— 오늘 인기있는 제목 ——— */}
          <section className="rb-card">
            <div className="rb-card-header">
              <h4>오늘 인기있는 제목</h4>
            </div>
            <ul className="rb-hot-list">
              {hotTopics.slice(0, 6).map((t) => (
                <li key={t.id} className="rb-hot-item">
                  <span className="rb-dot" />
                  <span className="rb-hot-text" title={t.text}>
                    {cut(t.text, 36)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* ——— 파일 미리보기 ——— */}
          <FilePreviewPanel
            previewImages={previewImages}
            previewCsvs={previewCsvs}
            expandedCsvs={expandedCsvs}
            onToggle={toggleCsvExpansion}
          />
        </Rightbar>
      </div>
    </div>
  );
};

export default EditVer2;
