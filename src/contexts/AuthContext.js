// src/contexts/AuthContext.jsx
import React, { createContext, useEffect, useState } from 'react';
import { authAPI } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 초기 로드 시 토큰 검증
  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('token');
      const savedLoginStatus = localStorage.getItem('isLoggedIn');
      const savedUserInfo = localStorage.getItem('user_info');

      if (token && savedLoginStatus === 'true') {
        try {
          // 백엔드에서 현재 사용자 정보 가져오기 (토큰 검증)
          const user = await authAPI.getCurrentUser();
          setIsLoggedIn(true);
          setUserInfo(user);
        } catch (error) {
          // 토큰이 유효하지 않은 경우 로컬 스토리지 정리
          console.warn('토큰 검증 실패:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user_info');
          localStorage.removeItem('isLoggedIn');
          setIsLoggedIn(false);
          setUserInfo(null);
        }
      } else if (savedUserInfo) {
        // 토큰이 없지만 사용자 정보가 있는 경우 (임시로 사용)
        setIsLoggedIn(savedLoginStatus === 'true');
        setUserInfo(JSON.parse(savedUserInfo));
      }
      
      setIsLoading(false);
    }

    checkAuth();
  }, []);

  // 로그아웃 함수
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
    setUserInfo(null);
  };

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      setIsLoggedIn, 
      userInfo, 
      setUserInfo,
      logout,
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
