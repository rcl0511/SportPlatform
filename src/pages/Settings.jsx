// src/pages/Settings.jsx
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { MdLogout, MdDelete, MdEdit, MdLanguage, MdColorLens, MdNotifications, MdLock, MdPolicy } from 'react-icons/md';

const Settings = () => {
  const navigate = useNavigate();
  const { setIsLoggedIn, setUserInfo } = useContext(AuthContext);

  // 로그아웃
  const handleLogout = () => {
    if (window.confirm('정말 로그아웃하시겠습니까?')) {
      localStorage.clear();
      setIsLoggedIn(false);
      setUserInfo(null);
      navigate('/login');
    }
  };

  // 데이터 초기화
  const handleResetData = () => {
    if (window.confirm('모든 데이터를 삭제하고 초기화하시겠습니까?')) {
      localStorage.clear();
      alert('모든 데이터가 삭제되었습니다.');
      navigate('/');
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '700px',
      margin: '80px auto',
      padding: '30px',
      background: 'white',
      borderRadius: 12,
      boxShadow: '0 0 10px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ marginBottom: '30px', fontSize: '24px', fontWeight: 'bold', color: '#092C4C' }}>설정</h2>

      {/* 설정 항목 리스트 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <SettingItem icon={<MdLock size={24} />} label="비밀번호 변경" onClick={() => alert('비밀번호 변경 기능은 준비 중입니다.')} />
        <SettingItem icon={<MdEdit size={24} />} label="프로필 수정" onClick={() => navigate('/editProfile')} />
        <SettingItem icon={<MdColorLens size={24} />} label="테마 설정" onClick={() => alert('테마 설정 기능은 준비 중입니다.')} />
        <SettingItem icon={<MdLanguage size={24} />} label="언어 설정" onClick={() => alert('언어 설정 기능은 준비 중입니다.')} />
        <SettingItem icon={<MdDelete size={24} />} label="데이터 초기화" onClick={handleResetData} />
        <SettingItem icon={<MdNotifications size={24} />} label="알림 설정" onClick={() => alert('알림 설정 기능은 준비 중입니다.')} />
        <SettingItem icon={<MdPolicy size={24} />} label="약관/개인정보처리방침" onClick={() => alert('약관 페이지는 준비 중입니다.')} />
        <SettingItem icon={<MdLogout size={24} />} label="로그아웃" onClick={handleLogout} />
      </div>
    </div>
  );
};

// 개별 설정 아이템 컴포넌트
const SettingItem = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 20px',
      border: '1px solid #EAEEF4',
      borderRadius: 8,
      background: '#F6FAFD',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '500',
      color: '#092C4C',
      textAlign: 'left',
    }}
  >
    {icon}
    {label}
  </button>
);

export default Settings;
