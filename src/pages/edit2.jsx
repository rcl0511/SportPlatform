import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/Edit.css';

const Edit2 = () => {
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext);

  const [customTitle, setCustomTitle] = useState('');
  const [today, setToday] = useState('');
const recommendedTitles = [
  '두산, 9회말 짜릿한 끝내기! MVP는 정수빈',
  'LG, 에이스 투수 활약으로 리그 선두 수성',
  'SSG 타선 폭발! 키움 상대 10-1 대승'
];
  const [selectedTitle, setSelectedTitle] = useState('');

  useEffect(() => {
    const storedSubject = localStorage.getItem('edit_subject');
    if (storedSubject) setCustomTitle(storedSubject);

    const now = new Date();
    setToday(now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }));
  }, []);

  const handleStart = () => {
    const base64 = localStorage.getItem('edit_file');        // dataURL or CSV text
    const fileName = localStorage.getItem('edit_fileName');  // file name

    navigate('/edit3', {
      state: {
        topic: selectedTitle || customTitle,
        base64,
        fileName,
      }
    });
  };

  const handleSelectTitle = (title) => {
    setSelectedTitle(title);

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
          <div>
            <div className="edit-department">{userInfo?.department || '부서없음'}</div>
            <div className="edit-username">{userInfo ? `${userInfo.firstName} ${userInfo.lastName}` : '이름없음'}</div>
          </div>
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
            placeholder="기사 제목을 직접 입력하거나 추천 제목을 클릭해 주세요."
          />
        </div>

        {/* 작성 날짜 */}
        <div className="form-group">
          <label>기사 작성 날짜</label>
          <div className="readonly-input">{today}</div>
        </div>

        {/* 제목 추천 */}
        <div className="form-group">
          <label>제목 추천</label>
          <div className="title-recommendations">
            {recommendedTitles.map((title, idx) => (
              <div
                key={idx}
                className={`title-item ${selectedTitle === title ? 'selected' : ''}`}
                onClick={() => handleSelectTitle(title)}
              >
                {title}
              </div>
            ))}
          </div>
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
