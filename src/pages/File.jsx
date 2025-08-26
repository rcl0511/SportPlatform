// src/pages/FileList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdDelete, MdDownload, MdInsertDriveFile } from 'react-icons/md';

const FileList = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);

  // 최초 로드 + 조회수 필드 정규화
  useEffect(() => {
    const raw = JSON.parse(localStorage.getItem('saved_files')) || [];
    let mutated = false;
    const normalized = raw.map(f => {
      if (typeof f.views !== 'number' || !Number.isFinite(f.views)) {
        mutated = true;
        return { ...f, views: 0 };
      }
      return f;
    });
    setFiles(normalized);
    if (mutated) {
      localStorage.setItem('saved_files', JSON.stringify(normalized));
    }
  }, []);

  const handleDelete = (fileId) => {
    const ok = window.confirm('정말 이 파일을 삭제하시겠습니까?');
    if (!ok) return;
    const updated = files.filter(f => f.id !== fileId);
    setFiles(updated);
    localStorage.setItem('saved_files', JSON.stringify(updated));
  };

  const handleDownload = (file) => {
    const element = document.createElement('a');
    const fileBlob = new Blob([file.content || ''], { type: 'text/plain' });
    element.href = URL.createObjectURL(fileBlob);
    element.download = `${file.title || 'untitled'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // 파일 열기 + 조회수 +1
  const handleOpenFile = (file) => {
    const updated = files.map(f =>
      f.id === file.id ? { ...f, views: (f.views || 0) + 1 } : f
    );
    setFiles(updated);
    localStorage.setItem('saved_files', JSON.stringify(updated));

    localStorage.setItem('edit_subject', file.title || '');
    localStorage.setItem('edit_content', file.content || '');
    navigate('/result');
  };

  return (
    <div style={{
      width: 'calc(100% - 90px)',
      marginLeft: '0px',
      marginTop: '80px',
      padding: '0',
    }}>
      {/* 헤더 */}
      <div style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        background: '#EEF6FB',
        padding: '12px 20px',
        fontWeight: '700',
        fontSize: '16px',
        borderRadius: '8px',
        color: '#092C4C',
      }}>
        <div style={{ width: '60%' }}>기사 제목</div>
        <div style={{ width: '10%', textAlign: 'center' }}>조회수</div>
        <div style={{ width: '10%', textAlign: 'center' }}>날짜</div>
        <div style={{ width: '10%', textAlign: 'center' }}>액션</div>
      </div>

      {/* 파일 리스트 */}
      {files.length === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: '#aaa',
          fontSize: '18px',
          borderBottom: '1px solid #eaeef4',
        }}>
          저장된 파일이 없습니다.
        </div>
      ) : (
        files.map((file) => (
          <div key={file.id} style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #eaeef4',
            fontSize: '15px',
            color: '#092C4C',
            width: '100%',
          }}>
            {/* 제목 */}
            <div
              style={{
                width: '60%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}
              onClick={() => handleOpenFile(file)}
              title="열기"
            >
              <MdInsertDriveFile size={20} />
              <span style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {file.title || '(제목 없음)'}
              </span>
            </div>

            {/* 조회수 */}
            <div style={{ width: '10%', textAlign: 'center', fontSize: '14px', color: '#092C4C' }}>
              {(file.views ?? 0).toLocaleString()}
            </div>

            {/* 날짜 */}
            <div style={{ width: '10%', textAlign: 'center', fontSize: '14px', color: '#7E92A2' }}>
              {file.date || ''}
            </div>

            {/* 액션 */}
            <div style={{
              width: '10%',
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'center',
              gap: '12px'
            }}>
              <button onClick={() => handleDownload(file)} style={iconButtonStyle} title="다운로드">
                <MdDownload size={18} />
              </button>
              <button onClick={() => handleDelete(file.id)} style={iconButtonStyle} title="삭제">
                <MdDelete size={18} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const iconButtonStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#6789F7',
  display: 'flex',
  alignItems: 'center',
};

export default FileList;
