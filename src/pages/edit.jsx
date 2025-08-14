// src/pages/Edit.jsx (일부분만 발췌/교체)
import  { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Rightbar from '../components/Rightbar';
import '../styles/Edit.css';
import * as XLSX from 'xlsx';

const Edit = () => {
  const navigate = useNavigate();

  // ✅ 사이드바 열림/닫힘 상태
  const [isRightbarOpen, setIsRightbarOpen] = useState(true);

  // ✅ 오늘 인기 제목 (hot_topics → 없으면 기본 더미)
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
      // storedTopics가 { text } 형태면 그대로, 아니면 적절히 매핑
      const mapped = storedTopics.map((t, i) => ({ id: t.id || `t${i+1}`, text: t.text || String(t) }));
      setHotTopics(mapped);
    }
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [];
    const newCsvs = [];

    files.forEach((file) => {
      const reader = new FileReader();

      if (file.type.startsWith('image/')) {
        reader.onload = () => {
          newImages.push({ name: file.name, src: reader.result });
          setPreviewImages((prev) => [...prev, ...newImages]);
        };
        reader.readAsDataURL(file);

      } else if (/\.csv$/i.test(file.name)) {
        reader.onload = () => {
          const text = reader.result;
          const rows = text.trim().split(/\r?\n/).map(row => row.split(','));
          newCsvs.push({ name: file.name, rows });
          setPreviewCsvs((prev) => [...prev, ...newCsvs]);
        };
        reader.readAsText(file);

      } else if (/\.xlsx$/i.test(file.name) || /\.xls$/i.test(file.name)) {
        reader.onload = () => {
          const data = new Uint8Array(reader.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheet];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          newCsvs.push({ name: file.name, rows });
          setPreviewCsvs((prev) => [...prev, ...newCsvs]);
        };
        reader.readAsArrayBuffer(file);
      }
    });

    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const toggleCsvExpansion = (fileName) => {
    setExpandedCsvs((prev) => ({ ...prev, [fileName]: !prev[fileName] }));
  };

  const handleNextStep = () => {
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
    localStorage.setItem('edit_files', JSON.stringify(uploadedFiles.map(f => f.name)));
    navigate('/edit2', { state: { uploadedFiles } });
  };

  const handleCancel = () => navigate('/');

  // 🔹 긴 텍스트 자르기 유틸
  const cut = (s, n = 40) => (s?.length > n ? s.slice(0, n) + '…' : s);

  return (
    // ✅ 사이드바 열림/닫힘에 따라 그리드 비율 300:0 적용
    <div className={`edit-container edit-layout ${isRightbarOpen ? 'rb-open' : 'rb-collapsed'}`}>
      <div className="edit-main">
        <div className="edit-header">
          <h2>스포츠 기사 작성 시작하기</h2>

          {/* 🔘 우측 사이드바 토글 버튼 */}
          <div className="edit-actions">


            <div className="edit-close" onClick={handleCancel}>×</div>
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
              {uploadedFiles.length > 0
                ? `${uploadedFiles.length}개 파일 선택됨`
                : '파일을 선택하거나 드래그'}
            </label>
            <input
              id="fileUpload"
              type="file"
              className="file-input"
              onChange={handleFileChange}
              multiple
              required
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
              {hotTopics.slice(0, 6).map(t => (
                <li key={t.id} className="rb-hot-item">
                  <span className="rb-dot" />
                  <span className="rb-hot-text" title={t.text}>{cut(t.text, 36)}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* ——— 파일 미리보기 ——— */}
          <div className="file-preview">
            {previewImages.length > 0 && (
              <div className="image-preview-group">
                <h4>이미지 미리보기</h4>
                {previewImages.map((img, idx) => (
                  <img key={idx} src={img.src} alt={img.name} style={{ width: '100%', marginBottom: '8px' }} />
                ))}
              </div>
            )}

            {previewCsvs.map((csv, idx) => {
              const isExpanded = expandedCsvs[csv.name];
              const visibleRows = isExpanded ? csv.rows : csv.rows.slice(0, 10);

              return (
                <div key={idx} style={{ marginBottom: '1rem' }}>
                  <strong>{csv.name}</strong>
                  <table className="csv-preview"><tbody>
                    {visibleRows.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (<td key={j}>{cell}</td>))}
                      </tr>
                    ))}
                  </tbody></table>
                  {csv.rows.length > 10 && (
                    <button onClick={() => toggleCsvExpansion(csv.name)} className="csv-toggle-btn">
                      {isExpanded ? '간단히 보기 ▲' : '더보기 ▼'}
                    </button>
                  )}
                </div>
              );
            })}

            {previewImages.length === 0 && previewCsvs.length === 0 && (
              <div className="no-preview">이미지 또는 CSV 파일만 미리보기가 가능합니다.</div>
            )}
          </div>
        </Rightbar>
      </div>
    </div>
  );
};

export default Edit;
