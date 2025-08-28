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

  // 차트 상태
  const [filter, setFilter] = useState('7days');
  const [chartData, setChartData] = useState([]);

  // UI 상태
  const [q, setQ] = useState('');
  const [activeTeams, setActiveTeams] = useState([]); // 칩 필터
  const [favoriteTeams, setFavoriteTeams] = useState([]); // 즐겨찾기

  const navigate = useNavigate();


  const inputRef = useRef(null);
const handleSearch = (e) => {
  e.preventDefault();               // 폼 제출 시 새로고침 방지
  setQ((prev) => prev.trim());      // 공백 제거 확정
  inputRef.current?.blur();         // 모바일 키보드/포커스 내리기
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

  // 초기 로드
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('saved_files') || '[]');

    // id 없는 기사 보정
    let mutated = false;
    const normalized = stored.map(a => {
      if (!a.id) {
        mutated = true;
        return { ...a, id: Date.now() + Math.floor(Math.random() * 1000) };
      }
      return a;
    });
    if (mutated) {
      localStorage.setItem('saved_files', JSON.stringify(normalized));
    }

    // 날짜/조회/팀 필드 정규화
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

    // 최근 경기
    const storedGames = JSON.parse(localStorage.getItem('recentGames') || '[]');
    if (storedGames.length) {
      setRecentGames(storedGames);
    } else {
      setRecentGames([
        { date: '2025-07-14', home: '한화 이글스', homeScore: 4, away: '롯데 자이언츠', awayScore: 2 },
        { date: '2025-07-13', home: 'LG 트윈스', homeScore: 3, away: '키움 히어로즈', awayScore: 5 },
        { date: '2025-07-12', home: '두산 베어스', homeScore: 2, away: '삼성 라이온즈', awayScore: 1 },
      ]);
    }

    // 즐겨찾기 팀
    setFavoriteTeams(JSON.parse(localStorage.getItem('favoriteTeams') || '[]'));
  }, []);

  // 차트 데이터 빌드
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

  // 필터링된 기사 리스트 (검색어 + 팀 칩)
  const filteredReports = useMemo(() => {
    const byTeam = activeTeams.length
      ? reports.filter((r) => activeTeams.includes(r.team))
      : reports;
    if (!q.trim()) return byTeam;
    const keyword = q.trim().toLowerCase();
    return byTeam.filter(
      (r) =>
        (r.title || '').toLowerCase().includes(keyword) ||
        (r.content || '').toLowerCase().includes(keyword) ||
        (r.team || '').toLowerCase().includes(keyword)
    );
  }, [reports, q, activeTeams]);

  // 차트: 필터링된 리스트 기준으로
  useEffect(() => {
    setChartData(buildChartData(filteredReports, filter));
  }, [filteredReports, filter]);

  // KPI 계산
  const kpis = useMemo(() => {
    const total = reports.length;
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // 월요일 시작
    const thisWeek = reports.filter(
      (r) => new Date(r.date) >= new Date(startOfWeek.toDateString())
    ).length;

    const last7 = buildChartData(reports, '7days');
    const last7Views = last7.reduce((s, d) => s + d.views, 0);
    const avg = total ? Math.round((reports.reduce((s, r) => s + (r.views || 1), 0) / total) * 10) / 10 : 0;

    return [
      { key: 'total', label: '전체 기사', value: total, icon: '📝' },
      { key: 'week', label: '이번 주 작성', value: thisWeek, icon: '📅' },
      { key: 'views', label: '최근 7일 조회', value: last7Views, icon: '📈' },
      { key: 'avg', label: '평균 조회/기사', value: avg, icon: '⭐' },
    ];
  }, [reports]);

  // 날짜 선택
  const handleDateClick = (date) => setSelectedDate(date);

  // 캘린더 타일 렌더
  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const dateStr = date.toISOString().slice(0, 10);
    const dayReports = filteredReports.filter((r) => r.date === dateStr);
    if (!dayReports.length) return null;
    // 점만 보여주기
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

  // 즐겨찾기 토글
  const toggleFavorite = (teamName) => {
    let next = favoriteTeams.includes(teamName)
      ? favoriteTeams.filter((t) => t !== teamName)
      : [...favoriteTeams, teamName];
    setFavoriteTeams(next);
    localStorage.setItem('favoriteTeams', JSON.stringify(next));
  };

  // 다가오는 경기 (오늘 이후)
  const upcomingGames = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return recentGames
      .filter((g) => g.date >= today)
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .slice(0, 5);
  }, [recentGames]);

  // 팀 칩 클릭
  const toggleTeamChip = (team) => {
    setActiveTeams((prev) =>
      prev.includes(team) ? prev.filter((t) => t !== team) : [...prev, team]
    );
  };

  // 빠른 템플릿
  const createDraft = (template) => {
    const title = template === 'review' ? '경기 리뷰 초안' : template === 'preview' ? '경기 프리뷰 초안' : '속보 초안';
    localStorage.setItem('edit_subject', title);
    localStorage.setItem('edit_content', '');
    navigate('/edit');
  };

  // =========================
  // 📎 일정 업로드: CSV/XLSX (버튼 + 드롭존)
  // =========================
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleScheduleFile = async (file) => {
    if (!file) return;
    try {
      const XLSX = await import('xlsx');

      let wb;
      if (/\.csv$/i.test(file.name)) {
        const text = await file.text();
        wb = XLSX.read(text, { type: 'string' });
      } else if (/\.(xlsx|xls)$/i.test(file.name)) {
        const buf = await file.arrayBuffer();
        wb = XLSX.read(buf, { type: 'array' });
      } else {
        alert('CSV, XLSX, XLS 파일만 지원합니다.');
        return;
      }

      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (!rows.length) { alert('빈 파일입니다.'); return; }

      const header = rows[0].map((h) => String(h).trim().toLowerCase());
      const idx = {
        date: header.indexOf('date'),
        home: header.indexOf('home'),
        away: header.indexOf('away'),
        homeScore: header.indexOf('homescore'),
        awayScore: header.indexOf('awayscore'),
      };
      if (idx.date === -1 || idx.home === -1 || idx.away === -1) {
        alert('필수 컬럼(date, home, away)이 없습니다.');
        return;
      }

      const toYMD = (d) => {
        const isSerial = Number.isFinite(d);
        if (isSerial) {
          const x = XLSX.SSF.parse_date_code(d);
          if (x) return `${x.y}-${String(x.m).padStart(2,'0')}-${String(x.d).padStart(2,'0')}`;
        }
        const s = String(d).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
        const dt = new Date(s);
        return isNaN(dt) ? '' : dt.toISOString().slice(0,10);
      };

      const parsed = rows.slice(1).map((r) => {
        const dateStr = toYMD(r[idx.date]);
        return {
          date: dateStr,
          home: String(r[idx.home] ?? '').trim(),
          away: String(r[idx.away] ?? '').trim(),
          homeScore: r[idx.homeScore] === '' ? undefined : Number(r[idx.homeScore]),
          awayScore: r[idx.awayScore] === '' ? undefined : Number(r[idx.awayScore]),
        };
      }).filter(g => g.date && g.home && g.away);

      if (!parsed.length) { alert('유효한 행을 찾지 못했습니다.'); return; }

      localStorage.setItem('recentGames', JSON.stringify(parsed));
      setRecentGames(parsed);
      alert(`일정 ${parsed.length}건을 불러왔습니다.`);
    } catch (err) {
      console.error('일정 업로드 실패:', err);
      alert('일정 파일을 읽는 중 오류가 발생했습니다.');
    }
  };

  const handleScheduleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      // eslint-disable-next-line no-await-in-loop
      await handleScheduleFile(f);
    }
    e.target.value = '';
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-main">
        {/* 헤더 / 액션 */}
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
    <button type="submit" className="primary">검색</button>
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
              <div className="dropdown">

              </div>
            </div>
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

        {/* 조회수 차트 */}
        <div className="views-chart-card">
          <h3>조회 추이</h3>
          <ViewsChart data={chartData} filter={filter} setFilter={setFilter} />
        </div>


        {/* 팀 필터 + 즐겨찾기 */}
        <div className="team-filter-card">
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

        {/* 본문 3열로: 캘린더 / 팀 목록 / 일정 업로드 */}
        <div className="grid-3">
          <div className="calendar-card">
            <h3>캘린더</h3>
            <Calendar
              value={selectedDate}
              onChange={setSelectedDate}
              onClickDay={handleDateClick}
              locale="ko-KR"
              tileContent={tileContent}
              tileClassName={tileClassName}
            />
            {/* 날짜별 기사 팝업 */}
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

          <div className="teams-card">
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

          {/* 📎 일정 업로드 카드 (드롭존 + 버튼 + 숨긴 input) */}
          <div className="upload-card">
            <h3>일정 업로드</h3>
            <p className="help">
              CSV/XLSX 파일을 업로드하면 ‘다가오는 경기’에 자동 반영됩니다.<br />
              필요 컬럼: <code>date</code>, <code>home</code>, <code>away</code> (<code>homeScore</code>, <code>awayScore</code> 선택)
            </p>

            <div
              className={`dropzone ${dragOver ? 'over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const files = Array.from(e.dataTransfer.files || []);
                files.forEach((f) => handleScheduleFile(f));
              }}
            >
              여기로 파일을 드래그해서 놓으세요
            </div>

            <button
              className="upload-btn"
              type="button"
              onClick={() => fileRef.current?.click()}
            >
              파일 선택
            </button>
            <input
              ref={fileRef}
              id="scheduleUpload"
              type="file"
              accept=".csv,.xlsx,.xls"
              multiple
              onChange={handleScheduleUpload}
              style={{ display: 'none' }}
            />

            <div className="help small">예: 2025-09-01, LG 트윈스 vs 두산 베어스</div>
          </div>
        </div>

       

        {/* 다가오는 경기 */}
        <div className="upcoming-card">
          <h3>다가오는 경기</h3>
          {upcomingGames.length ? (
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
          ) : (
            <div className="empty">예정된 경기가 없어요. 일정 데이터를 넣어보세요.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
