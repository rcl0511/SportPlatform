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

  const handleLeftKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate('/');
    }
  };

  return (
    <header className="hdr">
      <div className="hdr__inner">

        {/* 🔹 로고/타이틀 */}
        <div
          className="hdr__left"
          onClick={() => navigate('/')}
          onKeyDown={handleLeftKeyDown}
          role="button"
          tabIndex={0}
          aria-label="홈으로 이동"
        >
          <img
            src="/assets/fastball.png"
            alt="FastBall Logo"
            className="hdr__logo"
          />
          <h2 className="hdr__title">FastBall</h2>
        </div>

        {/* 🔹 우측 액션 */}
        <div className="hdr__actions">
          {/* (선택) 검색 박스 쓰고 싶으면 아래 주석 해제
          <form className="hdr__search" onSubmit={handleSearch} role="search">
            <input
              type="search"
              placeholder="검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="검색어 입력"
            />
          </form>
          */}
          <button className="btn btn--primary" onClick={() => navigate('/edit')}>
            작성하기
          </button>
          {isLoggedIn ? (
            <button className="btn btn--outline" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <button className="btn btn--outline" onClick={() => navigate('/login')}>
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
