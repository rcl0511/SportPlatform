// src/pages/Edit2.jsx
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/Edit.css';

const Edit2 = () => {
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext);

  const [customTitle, setCustomTitle] = useState('');
  const [today, setToday] = useState('');

  useEffect(() => {
    // localStorage 요청사항 불러오기
    const storedSubject = localStorage.getItem('edit_subject') || '';
    if (storedSubject) setCustomTitle(storedSubject);

    // 오늘 날짜
    const now = new Date();
    setToday(
      now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    );
  }, []);

  const handleStart = () => {
    const base64 = localStorage.getItem('edit_file');        // dataURL or CSV text
    const fileName = localStorage.getItem('edit_fileName');  // file name

    navigate('/edit3', {
      state: {
        topic: (customTitle || '').trim(), // Edit3에서 추천제목 다시 받음
        base64,
        fileName,
        reset: true, // Edit3가 페이지/스토리지 리셋하도록 신호
      },
    });
  };

  return (
    <div className="edit-container">
      {/* Header */}
      <div className="edit-header">
        <h2>스포츠 기사 세부 정보 입력</h2>
        <div className="edit-close" onClick={() => navigate('/')}>×</div>
      </div>

      {/* User Info */}
      <div className="edit-userinfo">
        <div className="edit-userinfo-inner">
          <div className="edit-avatar" />
          {/* 필요하다면 사용자명/부서 추가 */}
        </div>
      </div>

      {/* Form */}
      <div className="edit-form">
        {/* 요청사항 */}
        <div className="form-group">
          <label>요청사항</label>
          <input
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="기사 제목을 직접 입력하세요. (추천제목은 다음 단계에서 받아요)"
          />
        </div>

        {/* 작성 날짜 */}
        <div className="form-group">
          <label>기사 작성 날짜</label>
          <div className="readonly-input">{today}</div>
        </div>

        {/* 버튼 */}
        <div className="edit-actions">
          <button className="btn-primary" onClick={handleStart}>
            기사 작성 시작
          </button>
        </div>
      </div>
    </div>
  );
};

export default Edit2;
