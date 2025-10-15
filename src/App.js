// src/App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Edit from './pages/edit';
import Edit2 from './pages/edit2';
import { AuthContext } from './contexts/AuthContext';
import Chat from './pages/Chat';   // 대문자 C
import Edit3 from './pages/Edit3'; // 대문자 E
import Result from './pages/Result';
import File from './pages/File';

import 'react-calendar/dist/Calendar.css';
import './App.css';
import Alarm from './pages/Alarm';
import Platform from './pages/Platform';
import ArticleDetail from './pages/ArticleDetail';
import EditVer2 from './pages/EditVer2';


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null); // ✅ 추가

  // 앱이 시작될 때 localStorage 확인
  useEffect(() => {
    const storedLogin = localStorage.getItem('isLoggedIn');
    const storedUser = localStorage.getItem('user_info');

    if (storedLogin === 'true') {
      setIsLoggedIn(true);
    }

    if (storedUser) {
      setUserInfo(JSON.parse(storedUser));
    }
  }, []);

  // 로그인 상태 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('isLoggedIn', isLoggedIn);
  }, [isLoggedIn]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, userInfo, setUserInfo }}>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Platform />} />
            <Route path="login" element={<Login />} />
            <Route path="file" element={<File />} />
            <Route path="register" element={<Register />} />
            <Route path="edit" element={<Edit />} />
            <Route path="/editver2" element={<EditVer2 />} />

            <Route path="dashboard" element={<Dashboard />} />
            <Route path="/platform/article/:id" element={<ArticleDetail />} />
            <Route path="chat" element={<Chat />} />
            <Route path="edit2" element={<Edit2 />} />
            <Route path="edit3" element={<Edit3 />} />
            <Route path="result" element={<Result />} />
            
            <Route path="/alarm" element={<Alarm />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
