// src/components/Logo.jsx
import React from 'react';

const Logo = () => {
  return (
    <div style={{
      height: 70,
      background: '#F6FAFD',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderBottom: '1px solid #EAEEF4'
    }}>
      <span style={{
        fontWeight: 700,
        fontSize: 70,
        letterSpacing: 0,
        color: '#305078',
        fontFamily: "'Roboto', 'Pretendard', 'Roboto', 'Noto Sans KR', Arial, sans-serif"
      }}>
        ■
      </span>
    </div>
  );
};

export default Logo;
