import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Rightbar from '../components/Rightbar';
import '../styles/Edit.css';
import * as XLSX from 'xlsx';





const Edit = () => {
  const navigate = useNavigate();
const [expandedCsvs, setExpandedCsvs] = useState({});
  const [subject, setSubject] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [tags, setTags] = useState([]);

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [previewCsvs, setPreviewCsvs] = useState([]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      setTags([...tags, inputValue.trim()]);
      setInputValue('');
    }
  };

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
        reader.onload = (e) => {
          const data = new Uint8Array(reader.result); // ✅ 안전함
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
  setExpandedCsvs((prev) => ({
    ...prev,
    [fileName]: !prev[fileName],
  }));
};


  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
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


  return (
    <div className="edit-container edit-layout">
      <div className="edit-main">
        <div className="edit-header">
          <h2>스포츠 기사 작성 시작하기</h2>
          <div className="edit-close" onClick={handleCancel}>×</div>
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

      <Rightbar>
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
      <table className="csv-preview">
        <tbody>
          {visibleRows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {csv.rows.length > 10 && (
        <button
          onClick={() => toggleCsvExpansion(csv.name)}
          className="csv-toggle-btn"
        >
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
  );
};

export default Edit;
