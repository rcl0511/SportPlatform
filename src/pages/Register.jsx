// src/pages/Register.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Register = () => {
  const { setIsLoggedIn, setUserInfo } = useContext(AuthContext);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'confirmPassword' || name === 'password') {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
            const response = await fetch('https://api.jolpai-backend.shop/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          phone: form.phone,
          username: form.username,
          password: form.password,
          // department: '마케팅부', // 백엔드에서 부서가 필수일 경우 추가하세요
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        console.error('회원가입 실패 상세:', errData);
        setError(errData.message || '회원가입 실패: 서버 오류');
        return;
      }

      const data = await response.json();
      console.log('회원가입 성공:', data);

      localStorage.setItem('user_info', JSON.stringify(data));
      localStorage.setItem('isLoggedIn', 'true');

      setUserInfo(data);
      setIsLoggedIn(true);
      navigate('/');
    } catch (err) {
      console.error('회원가입 오류:', err);
      setError('네트워크 오류로 회원가입에 실패했습니다.');
    }
  };

  return (
    <div style={{
      marginTop: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: '#F6FAFD',
      minHeight: 'calc(100vh - 90px)',
      padding: '40px 20px',
    }}>
      <form onSubmit={handleSubmit} style={{
        width: '100%',
        maxWidth: 600,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        background: 'white',
        padding: 32,
        borderRadius: 12,
        boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
      }}>
        <h2 style={{ color: '#092C4C', width: '30%' }}>회원가입</h2>

        {/* 이름 입력 */}
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>First Name</label>
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              placeholder="김"
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Last Name</label>
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              placeholder="눈송"
              style={inputStyle}
            />
          </div>
        </div>

        {/* 연락처 입력 */}
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="noonsong@example.com"
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Phone</label>
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="010-1234-5678"
              style={inputStyle}
            />
          </div>
        </div>

        {/* ID, Password 입력 */}
        <div>
          <label style={labelStyle}>ID</label>
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="아이디 입력"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Password</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="비밀번호 입력"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Confirm Password</label>
          <input
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="비밀번호 확인"
            style={inputStyle}
          />
        </div>

        {/* 에러 메시지 표시 */}
        {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}

        <button type="submit" style={submitButtonStyle}>
          회원가입
        </button>
      </form>
    </div>
  );
};

const labelStyle = {
  color: '#092C4C',
  fontSize: 16,
  fontWeight: '700',
  marginBottom: 8,
  display: 'block',
};

const inputStyle = {
  padding: '12px 16px',
  borderRadius: 8,
  border: '1px solid #D6E1E6',
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box',
};

const submitButtonStyle = {
  width: '100%',
  padding: 12,
  background: '#514EF3',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  fontSize: 16,
  fontWeight: 'bold',
  cursor: 'pointer',
  marginTop: 12,
};

export default Register;
