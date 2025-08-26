// src/components/Header.jsx
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/Header.css';

const LogoSVG = () => {
  return (
    <div className="logo">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <linearGradient id="hdr-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6A66FF"/>
            <stop offset="100%" stopColor="#3E8BFF"/>
          </linearGradient>
        </defs>
        <path d="M18 7.5c0-2.2-1.9-3.5-4.6-3.5C9.7 4 8 5 8 6.8c0 4.2 8 2.2 8 6.2 0 1.9-1.9 3-4.6 3-2.7 0-4.4-1-4.4-2.8"
              stroke="url(#hdr-g)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              fill="none" />
        <circle cx="18.2" cy="7.2" r="1.2" fill="url(#hdr-g)"/>
      </svg>
    </div>
  );
};

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
    <header className="hdr">
      <div className="hdr__inner">
        <div className="hdr__left" onClick={() => navigate('/')} role="button" tabIndex={0}>
          <LogoSVG />
          <h2 className="hdr__title">스포츠기사 AI</h2>
        </div>

        

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
