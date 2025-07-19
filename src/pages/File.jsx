// src/pages/FileList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdDelete, MdDownload, MdInsertDriveFile } from 'react-icons/md';

const FileList = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const storedFiles = JSON.parse(localStorage.getItem('saved_files')) || [];
    setFiles(storedFiles);
  }, []);

  
  const handleDelete = (fileId) => {
    const confirmDelete = window.confirm('정말 이 파일을 삭제하시겠습니까?');
    if (!confirmDelete) return; // 취소 누르면 아무것도 안 함
  
    const updatedFiles = files.filter(file => file.id !== fileId);
    setFiles(updatedFiles);
    localStorage.setItem('saved_files', JSON.stringify(updatedFiles));
  };

  const handleDownload = (file) => {
    const element = document.createElement('a');
    const fileBlob = new Blob([file.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(fileBlob);
    element.download = `${file.title}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleOpenFile = (file) => {
    localStorage.setItem('edit_subject', file.title);
    localStorage.setItem('edit_content', file.content);
    navigate('/result');
  };

  return (
    <div style={{
        width: 'calc(100% - 90px)',   // 👉 사이드바 제외하고 전체 너비 차지
        marginLeft: '0px',           // 👉 사이드바 오른쪽부터 시작
        marginTop: '80px',            // 👉 헤더 높이 고려
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
        <div style={{ width: '50%' }}>파일 제목</div>
        <div style={{ width: '25%', textAlign: 'center' }}>날짜</div>
        <div style={{ width: '25%', textAlign: 'center' }}>액션</div>
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
            {/* 파일 제목 클릭 */}
            <div
              style={{ 
                width: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                cursor: 'pointer' 
              }}
              onClick={() => handleOpenFile(file)}
            >
              <MdInsertDriveFile size={20} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.title}
              </span>
            </div>

            {/* 날짜 */}
            <div style={{ width: '25%', textAlign: 'center', fontSize: '14px', color: '#7E92A2' }}>
              {file.date}
            </div>

            {/* 액션 버튼 */}
            <div style={{ width: '25%', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button onClick={() => handleDownload(file)} style={iconButtonStyle}><MdDownload size={18} /></button>
              <button onClick={() => handleDelete(file.id)} style={iconButtonStyle}><MdDelete size={18} /></button>
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
