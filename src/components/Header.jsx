// src/components/Header.jsx
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    navigate(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
    setSearchTerm('');
  };

  return (
    <header className="header">
      <div className="header__inner">
        <h2 className="header__logo" onClick={() => navigate('/')}>스포츠기사 AI</h2>

        <form className="header__search" onSubmit={handleSearch} role="search" aria-label="기사 검색">
          <span className="search-icon" aria-hidden="true">
            {/* SVG 아이콘 (돋보기) */}
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M21 21l-3.9-3.9M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </span>
          <input
            type="text"
            placeholder="기사, 팀, 선수 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" aria-label="검색" />
        </form>

        <div className="header__actions">
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
