// src/pages/Edit.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Rightbar from '../components/Rightbar';
import FilePreviewPanel from '../components/FilePreviewPanel';
import '../styles/Edit.css';
import * as XLSX from 'xlsx';



const Edit = () => {
  const navigate = useNavigate();

  // 사이드바 열림/닫힘 상태
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
  const [subject, setSubject] = useState('');
  const [tags] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [previewCsvs, setPreviewCsvs] = useState([]);

  useEffect(() => {
    // hot_topics가 있으면 사용
    const storedTopics = JSON.parse(localStorage.getItem('hot_topics') || '[]');
    if (storedTopics.length) {
      const mapped = storedTopics.map((t, i) => ({ id: t.id || `t${i + 1}`, text: t.text || String(t) }));
      setHotTopics(mapped);
    }
  }, []);

  // 파일 선택 핸들러 (안정화: Promise.all + XLSX 파싱)
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newImages = [];
    const newCsvs = [];
    const nextExpanded = { ...expandedCsvs };

    await Promise.all(
      files.map(async (file) => {
        // 이미지
        if (file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          newImages.push({ name: file.name, src: url });
          return;
        }

        // CSV
        if (/\.csv$/i.test(file.name)) {
          const text = await file.text();
          // XLSX로 CSV 파싱 (따옴표/콤마 안전)
          const wb = XLSX.read(text, { type: 'string' });
          const first = wb.SheetNames[0];
          const sheet = wb.Sheets[first];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' });
          newCsvs.push({ name: file.name, rows });
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

        // 기타 파일: 업로드 목록에는 포함되지만 미리보기는 제외
        return;
      })
    );

    // 중복 파일명 제거(원하면 제거하지 않고 쌓이도록 변경 가능)
    const dedupByName = (arr) => {
      const seen = new Set();
      return [...arr].filter((f) => {
        const ok = !seen.has(f.name);
        if (ok) seen.add(f.name);
        return ok;
      });
    };

    setPreviewImages((prev) => dedupByName([...prev, ...newImages]));
    setPreviewCsvs((prev) => dedupByName([...prev, ...newCsvs]));
    setExpandedCsvs(nextExpanded);
    setUploadedFiles((prev) => [...prev, ...files]);
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

    // 🔁 첫 번째 파일을 base64로 변환해서 localStorage에 저장
    if (uploadedFiles.length > 0) {
      const firstFile = uploadedFiles[0];
      try {
        // 파일을 base64로 변환
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(firstFile);
        });
        
        const base64 = await base64Promise;
        localStorage.setItem('edit_file', base64);
        localStorage.setItem('edit_fileName', firstFile.name);
      } catch (error) {
        console.error('파일 변환 실패:', error);
        alert('파일 처리 중 오류가 발생했습니다.');
        return;
      }
    }

    // 🔁 Edit2에서도 같은 미리보기 필요 → 파일 자체를 state로 전달
    navigate('/edit2', {
      state: {
        uploadedFiles, // File[] 전달 → Edit2에서 동일 파싱/미리보기 가능
      },
    });
  };

  const handleCancel = () => navigate('/');

  //  ObjectURL 정리(메모리 누수 방지)
  useEffect(() => {
    return () => {
      previewImages.forEach((img) => {
        if (img?.src?.startsWith('blob:')) {
          URL.revokeObjectURL(img.src);
        }
      });
    };
  }, [previewImages]);

  // 🔹 긴 텍스트 자르기 유틸
  const cut = (s, n = 40) => (s?.length > n ? s.slice(0, n) + '…' : s);

  return (
    // ✅ 사이드바 열림/닫힘에 따라 그리드 비율 300:0 적용
    <div className={`edit-container edit-layout ${isRightbarOpen ? 'rb-open' : 'rb-collapsed'}`}>
      <div className="edit-main">
        <div className="edit-header">
          <h2>스포츠 기사 작성 시작하기</h2>

          {/* 🔘 우측 사이드바 토글 버튼(필요 시 활성화) */}
          <div className="edit-actions">

          </div>
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

      {/* ✅ 300px/0px 애니메이션되는 쉘로 감싸기 */}
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

          {/* ——— 파일 미리보기(재사용 컴포넌트) ——— */}
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

export default Edit;
