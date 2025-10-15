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
    const storedSubject = localStorage.getItem('edit_subject') || '';
    if (storedSubject) setCustomTitle(storedSubject);

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
    const base64 = localStorage.getItem('edit_file');
    const fileName = localStorage.getItem('edit_fileName');

    navigate('/edit3', {
      state: {
        topic: (customTitle || '').trim(),
        base64,
        fileName,
        reset: true,
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
          <div className="edit-username">
            <strong>{userInfo?.name || '작성자'}</strong>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="edit-form">
        <div className="form-group">
          <label>요청사항</label>
          <input
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="기사 제목을 직접 입력하세요. (추천제목은 다음 단계에서 받아요)"
          />
        </div>

        <div className="form-group">
          <label>기사 작성 날짜</label>
          <div className="readonly-input">{today}</div>
        </div>

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
