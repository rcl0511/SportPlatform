// src/components/Header.jsx
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');

  // 로그아웃 핸들러
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  // 검색 핸들러
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    navigate(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
    setSearchTerm('');
  };

  return (
    <header className="hdr">
      <div className="hdr__inner">

        {/* 🔹 로고 영역 (이미지 로고로 변경) */}
        <div className="hdr__left" onClick={() => navigate('/')} role="button" tabIndex={0}>
          <img 
            src="/assets/fastball.png" 
            alt="FastBall Logo" 
            className="hdr__logo" 
          />
          <h2 className="hdr__title">FastBall</h2>
        </div>

        {/* 🔹 우측 버튼 영역 */}
        <div className="hdr__actions">
          <button className="btn btn--primary" onClick={() => navigate('/edit')}>작성하기</button>
          {isLoggedIn ? (
            <button className="btn btn--outline" onClick={handleLogout}>Logout</button>
          ) : (
            <button className="btn btn--outline" onClick={() => navigate('/login')}>Login</button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
