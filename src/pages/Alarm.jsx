// src/pages/Alarm.jsx
import React, { useEffect, useState } from 'react';
import { MdNotificationsActive, MdClose } from 'react-icons/md';

const Alarm = () => {
  const [alarms, setAlarms] = useState([]);

  // 🔄 알람 불러오기 + 빨간 점 제거
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('alarm_list') || '[]');
    setAlarms(saved);
    localStorage.setItem('hasNewAlarm', 'false');
    localStorage.setItem('hasNewDashboardAlert', 'false');
  }, []);
  
  // 📢 관리자 공지 생성
  const handleFakeNotice = () => {
    const newAlarm = {
      id: Date.now(),
      message: '새로운 공지사항이 등록되었습니다.',
      time: new Date().toLocaleString(),
    };
    const updated = [newAlarm, ...alarms];
    setAlarms(updated);
    localStorage.setItem('alarm_list', JSON.stringify(updated));
    localStorage.setItem('hasNewAlarm', 'true');
    localStorage.setItem('hasNewDashboardAlert', 'true');
  };

  // 🗑️ 알람 삭제
  const handleDelete = (id) => {
    const filtered = alarms.filter((alarm) => alarm.id !== id);
    setAlarms(filtered);
    localStorage.setItem('alarm_list', JSON.stringify(filtered));
  };

  return (
    <div style={{ padding: '0px 40px', maxWidth: '800px', margin: '80px auto' }}>
      <h2 style={{ fontSize: 24, marginBottom: 20, color: '#092C4C' }}>알림</h2>

      <button
        onClick={handleFakeNotice}
        style={{
          padding: '10px 16px',
          marginBottom: '24px',
          background: '#6789F7',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
        }}
      >
        📢 관리자 공지 등록
      </button>

      {alarms.length === 0 ? (
        <div style={{ color: '#aaa', fontSize: '16px' }}>알림이 없습니다.</div>
      ) : (
        alarms.map((alarm) => (
          <div
            key={alarm.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F6FAFD',
              border: '1px solid #EAEEF4',
              padding: '15px 20px',
              borderRadius: 12,
              marginBottom: 12,
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <MdNotificationsActive size={20} color="#092C4C" />
              <div>
                <div style={{ fontSize: 16, color: '#092C4C' }}>{alarm.message}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{alarm.time}</div>
              </div>
            </div>

            <button
              onClick={() => handleDelete(alarm.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
              }}
            >
              <MdClose size={18} />
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default Alarm;
