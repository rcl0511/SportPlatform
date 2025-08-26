// src/layout/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

import '../styles/layout.css';

const MainLayout = () => {
  return (
    <div className="layout-container">
      <aside className="sidebar-area">
      
        <Sidebar />
      </aside>
      <div className="main-content-area">
        <Header />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;

