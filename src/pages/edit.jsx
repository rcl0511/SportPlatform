// src/pages/Edit.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Rightbar from '../components/Rightbar';
import '../styles/Edit.css';

const Edit = () => {
  const navigate = useNavigate();

  const [subject, setSubject] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [tags, setTags] = useState([]);
  const [fileName, setFileName] = useState('');
  const [previewSrc, setPreviewSrc] = useState(null);
  const [previewCsv, setPreviewCsv] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      setTags([...tags, inputValue.trim()]);
      setInputValue('');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setUploadedFile(file);
    setPreviewSrc(null);
    setPreviewCsv([]);

    const reader = new FileReader();
    if (file.type.startsWith('image/')) {
      reader.onload = () => {
        const result = reader.result;
        localStorage.setItem('edit_file', result);
        localStorage.setItem('edit_fileName', file.name);
        setPreviewSrc(result);
      };
      reader.readAsDataURL(file);
    } else if (/\.csv$/i.test(file.name)) {
      reader.onload = () => {
        const text = reader.result;
        localStorage.setItem('edit_file', text);
        localStorage.setItem('edit_fileName', file.name);
        // Split on CRLF or LF
        const rows = text.trim().split(/\r?\n/).map(row => row.split(','));
        setPreviewCsv(rows);
      };
      reader.readAsText(file);
    } else {
      // Unsupported file type: no preview
      reader.onload = () => {
        const text = reader.result;
        localStorage.setItem('edit_file', text);
        localStorage.setItem('edit_fileName', file.name);
        setPreviewSrc(null);
      };
      reader.readAsText(file);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleNextStep = () => {
    if (!subject.trim()) {
      alert('기사 제목 또는 주제를 입력해주세요!');
      return;
    }
    localStorage.setItem('edit_subject', subject);
    localStorage.setItem('edit_tags', JSON.stringify(tags));
    localStorage.setItem('edit_fileName', fileName);
    navigate('/edit2');
  };

  const handleCancel = () => navigate('/');
  const handleChat = () => navigate('/chat');

  return (
    <div className="edit-container edit-layout">
      <div className="edit-main">
        <div className="edit-header">
          <h2>스포츠 기사 작성 시작하기</h2>
          <div className="edit-close" onClick={handleCancel}>×</div>
        </div>

        <div className="edit-form">
          <div className="form-group">
            <label>기사 제목/핵심주제 입력</label>
            <textarea
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="예: LG 트윈스, 두산에 역전승!"
            />
          </div>

          <div className="form-group">
            <label>종목/카테고리 설정</label>
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="예: 야구, 축구, 배구"
            />
            <div className="tags-container">
              {tags.map((tag, idx) => (
                <div key={idx} className="tag">
                  {tag}
                  <span className="tag-remove" onClick={() => handleRemoveTag(tag)}>×</span>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>경기 데이터/자료 첨부 (선택)</label>
            <label htmlFor="fileUpload" className="file-upload-label">
              {fileName || '파일을 선택하거나 드래그'}
            </label>
            <input
              id="fileUpload"
              type="file"
              className="file-input"
              onChange={handleFileChange}
            />
          </div>

          <div className="actions">
            <button className="button-white" onClick={handleCancel}>취소</button>
            <button className="button-primary" onClick={handleChat}>AI와 대화하기</button>
            <button className="button-primary" onClick={handleNextStep}>다음단계</button>
          </div>
        </div>
      </div>

      <Rightbar>
        <div className="file-preview">
          {previewSrc ? (
            <img src={previewSrc} alt={fileName} />
          ) : previewCsv.length ? (
            <table className="csv-preview">
              <tbody>
                {previewCsv.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-preview">이미지 또는 CSV 파일만 미리보기가 가능합니다.</div>
          )}
        </div>
      </Rightbar>
    </div>
  );
};

export default Edit;
