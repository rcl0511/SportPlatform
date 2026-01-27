// src/pages/Login.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';
const KAKAO_APP_KEY = process.env.REACT_APP_KAKAO_KEY || 'ae6f405402a71e2f12dc093ead8907b5';

const Login = () => {
  const [email, setEmail] = useState('');         // username -> email
  const [password, setPassword] = useState('');
  const { setIsLoggedIn, setUserInfo } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_APP_KEY);
    }
  }, []);

  const handleRegister = () => navigate('/register');

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });

      if (!response.ok) {
        let msg = '로그인 실패';
        try { 
          const err = await response.json(); 
          msg = err?.message || err?.detail || msg; 
        } catch {}
        throw new Error(msg);
      }

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user_info', JSON.stringify(data.user));
      localStorage.setItem('isLoggedIn', 'true');

      const derived = {
        ...data.user,
        firstName: (data.user?.nickname || '').charAt(0) || '',
        lastName: (data.user?.nickname || '').slice(1) || '',
        department: data.user?.department || '',
      };
      setUserInfo(derived);
      setIsLoggedIn(true);
      navigate('/');
    } catch (error) {
      console.error('로그인 실패:', error);
      alert(`로그인 실패: ${error.message}`);
    }
  };

  const handleKakaoLogin = () => {
    if (!window.Kakao) {
      alert('Kakao SDK 로딩 실패');
      return;
    }
    window.Kakao.Auth.login({
      success: (authObj) => {
        console.log('카카오 로그인 성공', authObj);
        window.Kakao.API.request({
          url: '/v2/user/me',
          success: async function (res) {
            try {
              console.log('카카오 사용자 정보', res);

              const kakaoId = res.id?.toString() || '';
              const nickname = res.kakao_account?.profile?.nickname || '카카오유저';
              const emailFromKakao = res.kakao_account?.email || '';

              const kakaoUser = {
                email: emailFromKakao,
                nickname,
                kakaoId,
              };

              const serverRes = await fetch(`${API_BASE}/api/kakao-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(kakaoUser),
              });

              if (!serverRes.ok) {
                let msg = '서버 로그인 실패';
                try { 
                  const err = await serverRes.json(); 
                  msg = err?.message || err?.detail || msg; 
                } catch {}
                throw new Error(msg);
              }

              const data = await serverRes.json();
              console.log('서버 데이터:', data);

              localStorage.setItem('token', data.access_token);
              localStorage.setItem('user_info', JSON.stringify(data.user));
              localStorage.setItem('isLoggedIn', 'true');

              const derived = {
                ...data.user,
                firstName: (data.user?.nickname || '').charAt(0) || '',
                lastName: (data.user?.nickname || '').slice(1) || '',
                department: data.user?.department || '',
              };
              setUserInfo(derived);
              setIsLoggedIn(true);
              navigate('/');
            } catch (error) {
              console.error('카카오 로그인 서버 실패:', error);
              alert(`서버 로그인 실패: ${error.message}`);
            }
          },
          fail: (error) => {
            console.error('사용자 정보 요청 실패', error);
            alert('카카오 사용자 정보 요청 실패');
          },
        });
      },
      fail: (err) => {
        console.error('카카오 로그인 실패', err);
        alert('카카오 로그인 실패');
      },
    });
  };

  return (
    <div style={containerStyle}>
      <form onSubmit={(e) => e.preventDefault()} style={formStyle}>
        <h2 style={{ textAlign: 'center', color: '#092C4C' }}>Login</h2>

        {/* 이메일 입력 */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          style={inputStyle}
        />

        {/* 비밀번호 입력 */}
        <input
          type="password"
          placeholder="PASSWORD"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          style={inputStyle}
        />

        <button
          type="button"
          onClick={handleLogin}
          style={buttonStyle}
          onMouseOver={(e) => (e.currentTarget.style.background = '#3A5DE0')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#4A6CF7')}
        >
          로그인
        </button>

        <button
          type="button"
          onClick={handleRegister}
          style={registerButtonStyle}
        >
          회원가입
        </button>

        <button
          type="button"
          onClick={handleKakaoLogin}
          style={kakaoButtonStyle}
        >
          카카오 로그인
        </button>
      </form>
    </div>
  );
};

const containerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  paddingTop: '60px',
  height: 'calc(100vh - 90px)',
  background: '#F6FAFD',
};

const formStyle = {
  background: 'white',
  padding: 40,
  borderRadius: 12,
  boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  width: '100%',
  maxWidth: 400,
};

const inputStyle = {
  padding: '12px 16px',
  borderRadius: 8,
  border: '1px solid #D6E1E6',
  fontSize: 14,
};

const baseButtonStyle = {
  width: '100%',
  padding: '12px',
  border: 'none',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
};

const buttonStyle = {
  ...baseButtonStyle,
  background: '#4A6CF7',
  color: 'white',
};

const registerButtonStyle = {
  ...baseButtonStyle,
  background: '#4A6CF7',
  color: 'white',
};

const kakaoButtonStyle = {
  ...baseButtonStyle,
  background: '#FEE500',
  color: '#3C1E1E',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
};

export default Login;
