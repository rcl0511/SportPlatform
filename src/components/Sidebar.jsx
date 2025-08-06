// src/components/Sidebar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

import {
  MdDashboard,
  MdEdit,
  MdInsertDriveFile,
  MdNotifications,
  MdSettings,
  MdWeb,
} from 'react-icons/md';

const Sidebar = () => {
  const navigate = useNavigate();

  const icons = [
    { icon: <MdWeb />, label: 'Platform', route: '/' },
    { icon: <MdEdit />, label: 'Edit', route: '/edit' },
    { icon: <MdInsertDriveFile />, label: 'File', route: '/file' },
    { icon: <MdNotifications />, label: 'Alarm', route: '/alarm' },
    { icon: <MdSettings />, label: 'Settings', route: '/settings' },
    { icon: <MdDashboard />, label: 'Dashboard', route: '/dashboard' },
  ];

  return (
    <div
      style={{
        width: 90,
        height: 'calc(100vh - 90px)',
        background: 'rgba(246, 250, 253, 0.90)',
        borderRight: '1px solid #EAEEF4',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 20,
        gap: 16,
        position: 'fixed',
        top: 90,
        left: 0,
        zIndex: 100,
      }}
    >
      {icons.map((item, idx) => (
        <div key={idx} style={{ position: 'relative' }}>
          <button
            title={item.label}
            onClick={() => {
              navigate(item.route);
              if (item.label === 'Alarm') {
                // 알람 페이지 접근 시 빨간 점 제거
                localStorage.setItem('hasNewAlarm', 'false');
              }
            }}
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: 'white',
              border: '1px solid #EAEEF4',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#7E92A2',
              cursor: 'pointer',
            }}
          >
            {React.cloneElement(item.icon, { size: 20 })}
          </button>

          {/* 🔴 빨간 점 표시 조건 */}
          {item.label === 'Alarm' && localStorage.getItem('hasNewAlarm') === 'true' && (
            <span
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'red',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default Sidebar;
