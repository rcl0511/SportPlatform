// src/components/Rightbar.jsx
import React, { useState } from 'react';
import '../styles/Rightbar.css';

const Rightbar = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <aside className={`rightbar ${isOpen ? 'rightbar--open' : ''}`}>
        {isOpen && children}
      </aside>
      <button
        className="rightbar__toggle"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isOpen ? '<' : '>'}
      </button>
    </>
  );
};

export default Rightbar;