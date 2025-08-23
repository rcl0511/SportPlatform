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
