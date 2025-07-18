import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../styles/Dashboard.css';
import Rightbar from '../components/Rightbar';

const Dashboard = () => {
  // state 정의
  const [reports, setReports] = useState([]);

  const [recentGames, setRecentGames] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  // 팀 이름–로고 매핑
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

  // 팀 이름으로 로고 찾기
  const getLogo = (teamName) => {
    const team = baseballTeams.find((t) => t.name === teamName);
    return team ? team.logo : '';
  };

  useEffect(() => {
    // 1) 로컬스토리지에서 기사 불러오기
    const storedReports = JSON.parse(localStorage.getItem('saved_files')) || [];
    setReports(storedReports);


    // 3) 최근 경기 결과 예시 (크롤링한 데이터를 여기에 넣으세요)
    const storedGames =
      JSON.parse(localStorage.getItem('recentGames')) || [
        {
          date: '2025-07-14',
          home: '한화 이글스',
          homeScore: 4,
          away: '롯데 자이언츠',
          awayScore: 2,
        },
        {
          date: '2025-07-13',
          home: 'LG 트윈스',
          homeScore: 3,
          away: '키움 히어로즈',
          awayScore: 5,
        },
        {
          date: '2025-07-12',
          home: '두산 베어스',
          homeScore: 2,
          away: '삼성 라이온즈',
          awayScore: 1,
        },
      ];
    setRecentGames(storedGames);
  }, []);

   // 달력에 표시할 기사만
  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const dateStr = date.toISOString().slice(0, 10);
    return (
      <div className="calendar-tile-content">
        {reports
          .filter(r => r.date === dateStr)
          .map((a, i) => (
            <div key={i} className="calendar-article">
              📰 {a.title}
            </div>
          ))
        }
      </div>
    );
  };

  // 캘린더 각 날짜 타일에 일정 표시
  
  return (
    <div className="dashboard-container">
      <div className="dashboard-main">
        <h2>⚾ 오늘의 야구 뉴스 & 경기 일정</h2>

        {/* 캘린더 카드 */}
        <div className="calendar-card">
          <Calendar
            value={selectedDate}
            onChange={setSelectedDate}
            tileContent={tileContent}
            locale="ko-KR"
          />
        </div>

        {/* 팀 목록 */}
        <div className="teams-card">
          <h3>2025 KBO 야구팀</h3>
          <div className="teams-grid">
            {baseballTeams.map((team, idx) => (
              <div key={idx} className="team-item">
                <img
                  src={team.logo}
                  alt={team.name}
                  className="team-logo"
                />
                <span>{team.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 오른쪽 사이드바 */}
      <Rightbar>
        {/* 최신 기사 */}
        <div className="articles-card">
          <h3>📰 최신 기사</h3>
          {reports.map((article, idx) => (
            <div key={idx} className="article">
              <div className="article-title">{article.title}</div>
              <div className="article-summary">{article.summary}</div>
              <div className="article-date">{article.date}</div>
            </div>
          ))}
        </div>

        {/* 최근 경기 결과 */}
        <div className="games-card">
          <h3>⚾ 최근 경기 결과</h3>
          {recentGames.map((game, idx) => (
            <div key={idx} className="game">
              <div className="game-teams">
                <img
                  src={getLogo(game.home)}
                  alt={game.home}
                  className="team-logo-sm"
                />
                <span className="team-name">{game.home}</span>
                <span className="score">{game.homeScore}</span>
                <span className="vs">:</span>
                <span className="score">{game.awayScore}</span>
                <span className="team-name">{game.away}</span>
                <img
                  src={getLogo(game.away)}
                  alt={game.away}
                  className="team-logo-sm"
                />
              </div>
              <div className="game-date">{game.date}</div>
            </div>
          ))}
        </div>
      </Rightbar>
    </div>
  );
};

export default Dashboard;
