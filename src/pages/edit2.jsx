// src/pages/Edit2.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/Edit.css';

const Edit2 = () => {
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext);

  const [customTitle, setCustomTitle] = useState('');
  const [today, setToday] = useState('');

  useEffect(() => {
    const storedSubject = localStorage.getItem('edit_subject');
    if (storedSubject) setCustomTitle(storedSubject);

    const now = new Date();
    const formatted = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    setToday(formatted);
  }, []);

  const handleHome = () => navigate('/');

  return (
    <div className="edit-container">
      {/* Header */}
      <div className="edit-header">
        <h2>스포츠 기사 세부 정보 입력</h2>
        <div className="edit-close" onClick={handleHome}>×</div>
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
        <div className="form-group">
          <label>기사 제목 (수정 가능)</label>
          <input
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>참고 AI/소스 선택</label>
          <select>
            <option>ChatGPT-4.0</option>
            <option>Bing 스포츠</option>
            <option>naver 스포츠AI</option>
            <option>daum 뉴스AI</option>
          </select>
        </div>

        <div className="form-group">
          <label>기사 작성 날짜</label>
          <div className="readonly-input">{today}</div>
        </div>

        <div className="form-group">
          <label>특별 요청사항</label>
          <textarea
            rows={4}
            placeholder="예: 팀명과 선수 이름을 정확하게 표기해 주세요. 기사 스타일은 스포츠 신문처럼 써주세요."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="edit-actions">
        <button
          className="btn-primary"
          onClick={() => navigate('/edit3')}
        >
          기사 작성 시작
        </button>
      </div>
    </div>
  );
};

export default Edit2;