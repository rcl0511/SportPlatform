import React, { useState } from 'react';

const Rightbar = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const sidebarWidth = 417;

  return (
    <>
      {/* 사이드바 */}
      <div
        style={{
          width: isOpen ? sidebarWidth : 0,
          background: 'rgba(222, 240, 255, 0.9)',
          position: 'fixed',
          top: 90,
          right: 0,
          bottom: 0,
          overflowY: 'auto',
          padding: isOpen ? '24px' : 0,
          borderLeft: isOpen ? '1px solid #EAEEF4' : 'none',
          transition: 'width 0.3s ease, padding 0.3s ease',
          zIndex: 1000,
        }}
      >
        {isOpen && children}
      </div>

      {/* 토글 버튼 */}
      <div
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          position: 'fixed',
          top: '50%',
          right: isOpen ? sidebarWidth +48 : 0,
          width: 32,
          height: 80,
          background: '#D0E6F8',
          borderTopLeftRadius: 8,
          borderBottomLeftRadius: 8,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          zIndex: 2001,
          transform: 'translateY(-50%)',
          transition: 'right 0.3s ease',
        }}
      >
        {isOpen ? '>' : '<'}
      </div>
    </>
  );
};

export default Rightbar;
