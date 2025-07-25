// src/components/Rightbar.jsx
import React, { useState } from 'react';
import '../styles/Rightbar.css';

const Rightbar = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  const sidebarWidth = isOpen ? 300 : 0; // 원하는 너비
  const toggleOffset = 40;
  return (
    <>
       <div className={`rightbar ${isOpen ? 'rightbar--open' : ''}`} style={{ width: sidebarWidth }}>
        {isOpen && children}
      </div>

      <div
        className="rightbar__toggle"
      style={{ right: isOpen ? `${sidebarWidth + toggleOffset}px` : '0px' }}
      onClick={() => setIsOpen(prev => !prev)}
    >
        {isOpen ? '>' : '<'}
      </div>
    </>
  );
};

export default Rightbar;
