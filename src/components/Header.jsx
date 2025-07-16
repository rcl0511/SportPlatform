import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  return (
    <div
      style={{
        height: 70,
        width: 'calc(100% - 50px)', // 사이드바 너비 제외
        background: '#F6FAFD',
        borderBottom: '1px solid #EAEEF4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        boxSizing: 'border-box',
        position: 'fixed',
        top: 0,
        left: 90,
        zIndex: 100,
      }}
    >
      {/* 좌측: Dashboard */}
      <h2
        onClick={() => navigate('/')}
        style={{
          margin: 0,
          fontSize: 24,
          color: '#092C4C',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        스포츠기사 AI
      </h2>

      {/* 우측: 버튼 영역 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          whiteSpace: 'nowrap',
          paddingRight: 40, 
        }}
      >
        <button
          onClick={() => navigate('/edit')}
          style={{
            padding: '10px 16px',
            background: '#514EF3',
            color: 'white',
            border: 'none',
            borderRadius: 70,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Add New +
        </button>

        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 16px',
              background: 'white',
              borderRadius: 35,
              border: '1px solid #514EF3',
              color: '#514EF3',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '10px 16px',
              background: 'white',
              borderRadius: 35,
              border: '1px solid #514EF3',
              color: '#514EF3',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Login
          </button>
        )}
      </div>
    </div>
  );
};

export default Header;
