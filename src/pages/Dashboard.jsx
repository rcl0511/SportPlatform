// src/pages/Dashboard.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../styles/Dashboard.css';
import { useNavigate } from 'react-router-dom';
import ViewsChart from '../components/ViewsChart';

const Dashboard = () => {
  const [reports, setReports] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filter, setFilter] = useState('7days');
  const [chartData, setChartData] = useState([]);
  const [q, setQ] = useState('');
  const [activeTeams, setActiveTeams] = useState([]);
  const [favoriteTeams, setFavoriteTeams] = useState([]);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const handleSearch = (e) => {
    e.preventDefault();
    const v = (q || '').trim();
    setQ(v);
    inputRef.current?.blur();
  };

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

  const getLogo = (teamName) => {
    const team = baseballTeams.find((t) => t.name === teamName);
    return team ? team.logo : '';
  };

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('saved_files') || '[]');
    let mutated = false;
    const normalized = stored.map((a) => {
      if (!a.id) {
        mutated = true;
        return { ...a, id: Date.now() + Math.floor(Math.random() * 1000) };
      }
      return a;
    });
    if (mutated) {
      localStorage.setItem('saved_files', JSON.stringify(normalized));
    }

    const withDates = normalized.map((r) => ({
      ...r,
      date: r.date
        ? r.date
        : (r.createdAt || r.timestamp)
        ? new Date(r.createdAt || r.timestamp).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      views: r.views ?? 1,
      team: r.team || r.tag || '',
    }));
    setReports(withDates);

    const storedGames = JSON.parse(localStorage.getItem('recentGames') || '[]');
    if (storedGames.length) {
      setRecentGames(storedGames);
    }

    setFavoriteTeams(JSON.parse(localStorage.getItem('favoriteTeams') || '[]'));
  }, []);

  const buildChartData = (list, f) => {
    const parse = (d) => (typeof d === 'string' ? new Date(d) : d);
    const toYMD = (d) => d.toISOString().slice(0, 10);
    const toYM = (d) => d.toISOString().slice(0, 7);

    if (f === '7days') {
      const today = new Date();
      const days = [...Array(7)].map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        const key = toYMD(d);
        const dayItems = list.filter((r) => toYMD(parse(r.date)) === key);
        const views = dayItems.reduce((sum, r) => sum + (r.views || 1), 0);
        return { date: key, views };
      });
      return days;
    }

    if (f === 'month') {
      const today = new Date();
      const months = [...Array(6)].map((_, i) => {
        const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
        const key = toYM(d);
        const monthItems = list.filter((r) => toYM(parse(r.date)) === key);
        const views = monthItems.reduce((sum, r) => sum + (r.views || 1), 0);
        return { date: key, views };
      });
      return months;
    }

    const byDay = {};
    list.forEach((r) => {
      const key = toYMD(parse(r.date));
      byDay[key] = (byDay[key] || 0) + (r.views || 1);
    });
    return Object.entries(byDay)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([date, views]) => ({ date, views }));
  };

  const filteredReports = useMemo(() => {
    const byTeam = activeTeams.length
      ? reports.filter((r) => activeTeams.includes(r.team))
      : reports;
    const kw = (q || '').trim().toLowerCase();
    if (!kw) return byTeam;
    return byTeam.filter(
      (r) =>
        (r.title || '').toLowerCase().includes(kw) ||
        (r.content || '').toLowerCase().includes(kw) ||
        (r.team || '').toLowerCase().includes(kw)
    );
  }, [reports, q, activeTeams]);

  useEffect(() => {
    setChartData(buildChartData(filteredReports, filter));
  }, [filteredReports, filter]);

  const kpis = useMemo(() => {
    const total = reports.length;
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const thisWeek = reports.filter(
      (r) => new Date(r.date) >= new Date(startOfWeek.toDateString())
    ).length;

    const last7 = buildChartData(reports, '7days');
    const last7Views = last7.reduce((s, d) => s + d.views, 0);
    const avg = total
      ? Math.round((reports.reduce((s, r) => s + (r.views || 1), 0) / total) * 10) / 10
      : 0;

    return [
      { key: 'total', label: '전체 기사', value: total, icon: '📝' },
      { key: 'week', label: '이번 주 작성', value: thisWeek, icon: '📅' },
      { key: 'views', label: '최근 7일 조회', value: last7Views, icon: '📈' },
      { key: 'avg', label: '평균 조회/기사', value: avg, icon: '⭐' },
    ];
  }, [reports]);

  const handleDateClick = (date) => setSelectedDate(date);

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const dateStr = date.toISOString().slice(0, 10);
    const dayReports = filteredReports.filter((r) => r.date === dateStr);
    if (!dayReports.length) return null;
    return <span className="cal-dot" aria-hidden="true" />;
  };

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null;
    const dateStr = date.toISOString().slice(0, 10);
    return filteredReports.some((r) => r.date === dateStr) ? 'has-article' : null;
  };

  const selectedDateStr = selectedDate?.toISOString().slice(0, 10);
  const selectedReports = selectedDateStr
    ? filteredReports.filter((r) => r.date === selectedDateStr)
    : [];

  const toggleFavorite = (teamName) => {
    let next = favoriteTeams.includes(teamName)
      ? favoriteTeams.filter((t) => t !== teamName)
      : [...favoriteTeams, teamName];
    setFavoriteTeams(next);
    localStorage.setItem('favoriteTeams', JSON.stringify(next));
  };

  const toggleTeamChip = (team) => {
    setActiveTeams((prev) =>
      prev.includes(team) ? prev.filter((t) => t !== team) : [...prev, team]
    );
  };

  const createDraft = (template) => {
    const title =
      template === 'review'
        ? '경기 리뷰 초안'
        : template === 'preview'
        ? '경기 프리뷰 초안'
        : '속보 초안';
    localStorage.setItem('edit_subject', title);
    localStorage.setItem('edit_content', '');
    navigate('/edit');
  };

  const upcomingGames = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return recentGames
      .filter((g) => g.date >= today)
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .slice(0, 5);
  }, [recentGames]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-main">
        <div className="dash-header">
          <div>
            <h2>스포츠 에디터 대시보드</h2>
          </div>

          <div className="actions">
            <div className="search">
              <form onSubmit={handleSearch}>
                <input
                  ref={inputRef}
                  placeholder="기사·팀·키워드 검색..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <button type="submit" className="primary btn-search">검색</button>
                {q && (
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => setQ('')}
                  >
                    지우기
                  </button>
                )}
              </form>
            </div>
            <div className="quick-buttons">
              <button className="primary" onClick={() => createDraft('breaking')}>+ 새 기사</button>
            </div>
          </div>
        </div>

        {/* 팀 필터 */}
        <div className="team-filter-card card">
          <div className="filter-header">
            <h3>팀 필터</h3>
            <div className="filter-actions">
              <button className="ghost" onClick={() => setActiveTeams([])}>모두 해제</button>
              <button
                className="ghost"
                onClick={() => setActiveTeams(favoriteTeams)}
                title="즐겨찾기 적용"
              >
                ★ 즐겨찾기
              </button>
            </div>
          </div>
          <div className="chips">
            {baseballTeams.map((team) => {
              const active = activeTeams.includes(team.name);
              const fav = favoriteTeams.includes(team.name);
              return (
                <button
                  key={team.name}
                  className={`chip ${active ? 'active' : ''}`}
                  onClick={() => toggleTeamChip(team.name)}
                  title={team.name}
                >
                  <img src={team.logo} alt={team.name} />
                  <span>{team.name}</span>
                  <span
                    className={`star ${fav ? 'on' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(team.name);
                    }}
                    title={fav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                  >
                    ★
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* KPI 카드 */}
        <div className="kpi-grid">
          {kpis.map((k) => (
            <div className="kpi-card" key={k.key}>
              <div className="kpi-icon">{k.icon}</div>
              <div className="kpi-meta">
                <div className="kpi-label">{k.label}</div>
                <div className="kpi-value">{k.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 2x2 그리드 */}
        <div className="grid-2x2">
          <div className="card views-chart-card">
            <h3>조회 추이</h3>
            <ViewsChart data={chartData} filter={filter} setFilter={setFilter} />
          </div>

          <div className="card calendar-card">
            <h3>캘린더</h3>
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
                        if (a.id) {
                          navigate(`/platform/article/${a.id}`);
                        } else {
                          localStorage.setItem('edit_subject', a.title || '');
                          localStorage.setItem('edit_content', a.content || '');
                          navigate('/result');
                        }
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

          <div className="card teams-card">
            <h3>2025 KBO 야구팀</h3>
            <div className="teams-grid">
              {baseballTeams.map((team) => (
                <div key={team.name} className="team-item">
                  <img src={team.logo} alt={team.name} className="team-logo" />
                  <span>{team.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {upcomingGames.length > 0 && (
          <div className="upcoming-card">
            <h3>다가오는 경기</h3>
            <ul className="upcoming-list">
              {upcomingGames.map((g, i) => (
                <li key={`${g.date}-${i}`} className="upcoming-item">
                  <span className="u-date">{g.date}</span>
                  <span className="u-teams">
                    <img src={getLogo(g.home)} alt={g.home} className="team-logo-sm" />
                    {g.home} <span className="vs">vs</span>
                    <img src={getLogo(g.away)} alt={g.away} className="team-logo-sm" />
                    {g.away}
                  </span>
                  {(Number.isFinite(g.homeScore) || Number.isFinite(g.awayScore)) && (
                    <span className="u-score">
                      {Number.isFinite(g.homeScore) ? g.homeScore : '-'}
                      {' : '}
                      {Number.isFinite(g.awayScore) ? g.awayScore : '-'}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
