// src/pages/Alarm.jsx
import React, { useEffect, useState } from 'react';
import { MdNotificationsActive, MdClose } from 'react-icons/md';
import '../styles/Alarm.css';

const Alarm = () => {
  const [alarms, setAlarms] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('alarm_list') || '[]');
    setAlarms(saved);
    localStorage.setItem('hasNewAlarm', 'false');
    localStorage.setItem('hasNewDashboardAlert', 'false');
  }, []);

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

  const handleDelete = (id) => {
    const filtered = alarms.filter((alarm) => alarm.id !== id);
    setAlarms(filtered);
    localStorage.setItem('alarm_list', JSON.stringify(filtered));
  };

  return (
    <section className="alarm-container">
      <h2 className="alarm-title">알림</h2>

      <button className="btn--notice" onClick={handleFakeNotice}>
        📢 관리자 공지 등록
      </button>

      {alarms.length === 0 ? (
        <p className="alarm-empty">알림이 없습니다.</p>
      ) : (
        <div className="alarm-list">
          {alarms.map((alarm) => (
            <article key={alarm.id} className="alarm-item">
              <div className="alarm-item__info">
                <MdNotificationsActive className="alarm-item__icon" />
                <div className="alarm-item__text">
                  <p className="alarm-item__message">{alarm.message}</p>
                  <p className="alarm-item__time">{alarm.time}</p>
                </div>
              </div>

              <button className="alarm-item__delete" onClick={() => handleDelete(alarm.id)}>
                <MdClose size={18} />
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default Alarm;
