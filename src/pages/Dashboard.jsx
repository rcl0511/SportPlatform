// src/pages/Dashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../styles/Dashboard.css';
import Rightbar from '../components/Rightbar';
import { useNavigate } from 'react-router-dom';
import ViewsChart from '../components/ViewsChart'; // ✅ 추가

const Dashboard = () => {
  const [reports, setReports] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  // ✅ 차트용 상태
  const [filter, setFilter] = useState('7days');
  const [chartData, setChartData] = useState([]);

  const navigate = useNavigate();

  const baseballTeams = [
    { name: 'LG 트윈스', logo: '/assets/LG.png' },
    { name: '두산 베어스', logo: '/assets/DOOSAN.png' },
    { name: '삼성 라이온즈', logo: '/assets/SAMSUNG.png' },
    { name: '기아 타이거즈', logo: '/assets/KIA.png' },
    { name: 'SSG 랜더스', logo: '/assets/SSG.png' },
    { name: 'NC 다이노스', logo: '/assets/NC.png' },
    { name: '한화 이글스', logo: '/assets/HANWHA.png' },
    { name: '롯데 자이언츠', logo: '/assets/LOTTE.png' },
    { name: '키움 히어로즈', logo: '/assets/KIWOOM.png' },
    { name: 'KT WIZ', logo: '/assets/KT.png' },
  ];

  // (선택) 안 쓰면 워닝 나니 필요 없으면 지워도 됨
  const getLogo = teamName => {
    const team = baseballTeams.find(t => t.name === teamName);
    return team ? team.logo : '';
  };

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('saved_files')) || [];
    const withDates = stored.map(r => ({
      ...r,
      date: r.date
        ? r.date
        : (r.createdAt || r.timestamp)
          ? new Date(r.createdAt || r.timestamp).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
    }));
    setReports(withDates);

    const storedGames = JSON.parse(localStorage.getItem('recentGames')) || [
      { date: '2025-07-14', home: '한화 이글스', homeScore: 4, away: '롯데 자이언츠', awayScore: 2 },
      { date: '2025-07-13', home: 'LG 트윈스', homeScore: 3, away: '키움 히어로즈', awayScore: 5 },
      { date: '2025-07-12', home: '두산 베어스', homeScore: 2, away: '삼성 라이온즈', awayScore: 1 },
    ];
    setRecentGames(storedGames);
  }, []);

  // ✅ reports → 차트 데이터로 변환
  const buildChartData = (list, f) => {
    // views 필드가 있으면 합계, 없으면 "기사 수"로 대체
    const parse = (d) => (typeof d === 'string' ? new Date(d) : d);
    const toYMD = (d) => d.toISOString().slice(0, 10);
    const toYM  = (d) => d.toISOString().slice(0, 7);

    if (f === '7days') {
      // 최근 7일
      const today = new Date();
      const days = [...Array(7)].map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        const key = toYMD(d);
        const dayItems = list.filter(r => toYMD(parse(r.date)) === key);
        const views = dayItems.reduce((sum, r) => sum + (r.views || 1), 0);
        return { date: key, views };
      });
      return days;
    }

    if (f === 'month') {
      // 최근 6개월 월별
      const today = new Date();
      const months = [...Array(6)].map((_, i) => {
        const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
        const key = toYM(d);
        const monthItems = list.filter(r => toYM(parse(r.date)) === key);
        const views = monthItems.reduce((sum, r) => sum + (r.views || 1), 0);
        return { date: key, views };
      });
      return months;
    }

    // all: 전체 기간 일자별 합
    const byDay = {};
    list.forEach(r => {
      const key = toYMD(parse(r.date));
      byDay[key] = (byDay[key] || 0) + (r.views || 1);
    });
    return Object.entries(byDay)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([date, views]) => ({ date, views }));
  };

  // reports/필터 변경시 차트 갱신
  useEffect(() => {
    setChartData(buildChartData(reports, filter));
  }, [reports, filter]);

  const handleDateClick = date => setSelectedDate(date);

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const dateStr = date.toISOString().slice(0, 10);
    const dayReports = reports.filter(r => r.date === dateStr);
    if (!dayReports.length) return null;
    return (
      <div className="calendar-tile-content">
        {dayReports.map((a, i) => (
          <div key={i} className="calendar-article">
            {a.title}
          </div>
        ))}
      </div>
    );
  };

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null;
    const dateStr = date.toISOString().slice(0, 10);
    return reports.some(r => r.date === dateStr) ? 'has-article' : null;
  };

  const selectedDateStr = selectedDate?.toISOString().slice(0, 10);
  const selectedReports = selectedDateStr
    ? reports.filter(r => r.date === selectedDateStr)
    : [];

  return (
    <div className="dashboard-container">
      <div className="dashboard-main">
        <h2>⚾ 오늘의 야구 뉴스 & 경기 일정</h2>
        <div className="calendar-card">
          <Calendar
            value={selectedDate}
            onChange={setSelectedDate}
            onClickDay={handleDateClick}
            locale="ko-KR"
            tileContent={tileContent}
            tileClassName={tileClassName}
          />
          {selectedReports.length > 0 && (
            <div className="date-articles-popup">
              <h3>{selectedDateStr} 작성된 기사</h3>
              <div className="date-articles-list">
                {selectedReports.map((a, i) => (
                  <div
                    key={i}
                    className="date-article-card"
                    onClick={() => {
                      localStorage.setItem('edit_subject', a.title);
                      localStorage.setItem('edit_content', a.content);
                      navigate('/result');
                    }}
                  >
                    <div className="date-article-title">{a.title}</div>
                    <div className="date-article-snippet">
                      {(a.content || '').slice(0, 60).trim()}…
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="teams-card">
          <h3>2025 KBO 야구팀</h3>
          <div className="teams-grid">
            {baseballTeams.map((team, idx) => (
              <div key={idx} className="team-item">
                <img src={team.logo} alt={team.name} className="team-logo" />
                <span>{team.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ✅ Rightbar에 ViewsChart 추가 */}
      <Rightbar>
        <div className="articles-card">
          <h3>📰 최신 기사</h3>
          {reports.slice(0, 3).map((article, idx) => (
            <div
              key={idx}
              className="article"
              onClick={() => {
                localStorage.setItem('edit_subject', article.title);
                localStorage.setItem('edit_content', article.content);
                navigate('/result');
              }}
            >
              <div className="article-title">{article.title}</div>
              <div className="article-date">{article.date}</div>
            </div>
          ))}
        </div>

        {/* 조회수 라인차트 (recharts) */}
        <ViewsChart data={chartData} filter={filter} setFilter={setFilter} />

        {/* (선택) 최근 경기 결과 박스 */}
        <div className="recent-games-card">
          <h3>최근 경기 결과</h3>
          <ul>
            {recentGames.map((g, i) => (
              <li key={`${g.date}-${i}`}>
                <span className="rg-date">{g.date}</span>
                <span className="rg-home">{g.home} {g.homeScore}</span>
                <span className="rg-away">{g.awayScore} {g.away}</span>
              </li>
            ))}
          </ul>
        </div>
      </Rightbar>
    </div>
  );
};

export default Dashboard;
