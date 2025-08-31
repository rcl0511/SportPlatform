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

  // 🔎 검색 입력 참조 + 제출
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

  // 초기 로드
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('saved_files') || '[]');

    // id 없는 기사 보정
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
    const kw = (q || '').trim().toLowerCase();
    if (!kw) return byTeam;
    return byTeam.filter(
      (r) =>
        (r.title || '').toLowerCase().includes(kw) ||
        (r.content || '').toLowerCase().includes(kw) ||
        (r.team || '').toLowerCase().includes(kw)
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

  // 날짜 선택
  const handleDateClick = (date) => setSelectedDate(date);

  // 캘린더 타일 렌더
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

  // 즐겨찾기 토글
  const toggleFavorite = (teamName) => {
    let next = favoriteTeams.includes(teamName)
      ? favoriteTeams.filter((t) => t !== teamName)
      : [...favoriteTeams, teamName];
    setFavoriteTeams(next);
    localStorage.setItem('favoriteTeams', JSON.stringify(next));
  };

  // 팀 칩 클릭
  const toggleTeamChip = (team) => {
    setActiveTeams((prev) =>
      prev.includes(team) ? prev.filter((t) => t !== team) : [...prev, team]
    );
  };

  // 빠른 템플릿
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

  // =========================
  // ✍️ 일정 수기 입력 + 일괄 붙여넣기
  // =========================
  const [form, setForm] = useState({
    date: '',
    home: '',
    away: '',
    homeScore: '',
    awayScore: '',
  });

  const onChangeForm = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const addManualGame = (e) => {
    e.preventDefault();
    const date = (form.date || '').trim();
    const home = (form.home || '').trim();
    const away = (form.away || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      alert('날짜는 YYYY-MM-DD 형식으로 입력해주세요.');
      return;
    }
    if (!home || !away) {
      alert('홈/어웨이 팀을 입력해주세요.');
      return;
    }
    const game = {
      id: `g_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      date,
      home,
      away,
      homeScore:
        form.homeScore === '' || isNaN(Number(form.homeScore))
          ? undefined
          : Number(form.homeScore),
      awayScore:
        form.awayScore === '' || isNaN(Number(form.awayScore))
          ? undefined
          : Number(form.awayScore),
    };
    upsertRecentGames([game]);
    setForm({ date: '', home: '', away: '', homeScore: '', awayScore: '' });
  };

  // 붙여넣기
  const [bulkText, setBulkText] = useState('');
  const parsedBulk = useMemo(() => {
    if (!bulkText.trim()) return [];
    const lines = bulkText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    const result = [];
    for (const line of lines) {
      const parts = line.split(/\s*[,|\t]\s*/); // 콤마/탭/파이프
      if (parts.length < 3) continue;

      const [dateRaw, homeRaw, awayRaw, hsRaw, asRaw] = parts;
      const date = dateToYMD(dateRaw);
      const home = (homeRaw || '').trim();
      const away = (awayRaw || '').trim();
      if (!date || !home || !away) continue;

      const homeScore =
        hsRaw === undefined || hsRaw === '' || isNaN(Number(hsRaw))
          ? undefined
          : Number(hsRaw);
      const awayScore =
        asRaw === undefined || asRaw === '' || isNaN(Number(asRaw))
          ? undefined
          : Number(asRaw);

      result.push({
        id: `g_${date}_${home}_${away}_${Math.random().toString(36).slice(2, 5)}`,
        date,
        home,
        away,
        homeScore,
        awayScore,
      });
    }
    return result;
  }, [bulkText]);

  const dateToYMD = (d) => {
    const s = String(d).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const dt = new Date(s);
    return isNaN(dt) ? '' : dt.toISOString().slice(0, 10);
  };

  const upsertRecentGames = (toAdd) => {
    const key = (g) => `${g.date}__${g.home}__${g.away}`;
    const existingMap = new Map(recentGames.map((g) => [key(g), g]));
    toAdd.forEach((g) => existingMap.set(key(g), g));
    const next = Array.from(existingMap.values());
    setRecentGames(next);
    localStorage.setItem('recentGames', JSON.stringify(next));
  };

  const addBulkGames = () => {
    if (!parsedBulk.length) {
      alert('유효한 일정이 없습니다.');
      return;
    }
    upsertRecentGames(parsedBulk);
    setBulkText('');
    alert(`${parsedBulk.length}건을 추가했습니다.`);
  };

  const removeGame = (idOrIndex) => {
    let next;
    if (typeof idOrIndex === 'string') {
      next = recentGames.filter((g) => g.id !== idOrIndex);
    } else {
      next = recentGames.filter((_, i) => i !== idOrIndex);
    }
    setRecentGames(next);
    localStorage.setItem('recentGames', JSON.stringify(next));
  };

  // 다가오는 경기 (옵션)
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

        {/* 🔎 검색 결과: 가로 스크롤 카드행 */}
        {q.trim() && (
          <div className="search-results-card search-row-wrap">
            <div className="sr-head">
              <h3>검색 결과</h3>
              <div className="sr-controls">
                <span className="sr-count">총 {filteredReports.length}건</span>
              </div>
            </div>

            <div className="search-row">
              {filteredReports.map((a) => (
                <article
                  key={a.id}
                  className="sr-card sr-card-row"
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
                  <div className="sr-card-top">
                    <div className="sr-chip">{a.team || '미지정 팀'}</div>
                    <div className="sr-date">{a.date}</div>
                  </div>
                  <h4 className="sr-title">{a.title || '(제목 없음)'}</h4>
                  {a.content ? (
                    <p className="sr-snippet">{a.content.slice(0, 120).trim()}…</p>
                  ) : <p className="sr-snippet sr-empty">내용 없음</p>}
                  <div className="sr-foot">
                    <span className="sr-views">조회 {a.views ?? 1}</span>
                    <button className="sr-open">열기 →</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* 팀 필터 + 즐겨찾기 */}
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

        {/* ========= 2×2 그리드 ========= */}
        <div className="grid-2x2">
          {/* (1) 조회 추이 */}
          <div className="card views-chart-card">
            <h3>조회 추이</h3>
            <ViewsChart data={chartData} filter={filter} setFilter={setFilter} />
          </div>

          {/* (2) 캘린더 */}
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

          {/* (3) 팀 목록 */}
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

          {/* (4) 일정 입력 */}
          <div className="card upload-card">
            <h3>일정 입력</h3>
            <p className="help">
              날짜와 팀명을 직접 입력하거나, 여러 줄을 한 번에 붙여넣을 수 있어요.<br />
              허용 구분자: <code>,</code> (콤마), <code>Tab</code>, <code>|</code> (파이프)
            </p>

            {/* 단건 입력 */}
            <form className="manual-form" onSubmit={addManualGame}>
              <label className="row">
                <span>날짜</span>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={onChangeForm}
                  required
                />
              </label>

              <label className="row">
                <span>홈 팀</span>
                <input
                  type="text"
                  name="home"
                  value={form.home}
                  onChange={onChangeForm}
                  list="teamList"
                  placeholder="예: LG 트윈스"
                  required
                />
              </label>

              <label className="row">
                <span>어웨이 팀</span>
                <input
                  type="text"
                  name="away"
                  value={form.away}
                  onChange={onChangeForm}
                  list="teamList"
                  placeholder="예: 두산 베어스"
                  required
                />
              </label>

              <label className="row">
                <span>홈 점수</span>
                <input
                  type="number"
                  min="0"
                  name="homeScore"
                  value={form.homeScore}
                  onChange={onChangeForm}
                  placeholder="-"
                />
              </label>

              <label className="row">
                <span>어웨이 점수</span>
                <input
                  type="number"
                  min="0"
                  name="awayScore"
                  value={form.awayScore}
                  onChange={onChangeForm}
                  placeholder="-"
                />
              </label>

              <button className="upload-btn" type="submit">일정 추가</button>
            </form>

            <datalist id="teamList">
              {baseballTeams.map((t) => (
                <option key={t.name} value={t.name} />
              ))}
            </datalist>

            {/* 일괄 붙여넣기 */}
            <div className="bulk-box">
              <div className="bulk-head">
                <h4>일괄 붙여넣기</h4>
                <button
                  type="button"
                  className="ghost sm"
                  onClick={() => setBulkText(
`2025-09-01, LG 트윈스, 두산 베어스, 5, 4
2025-09-02, 삼성 라이온즈, 키움 히어로즈
2025-09-03|한화 이글스|롯데 자이언츠|2|1`
                  )}
                >
                  예시 붙여넣기
                </button>
              </div>
              <textarea
                className="bulk-ta"
                placeholder={`YYYY-MM-DD, 홈팀, 원정팀[, 홈점수, 원정점수]\n한 줄에 한 경기씩 입력 (콤마/탭/| 구분자 허용)`}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={6}
              />
              <div className="bulk-preview">
                <span>인식: <b>{parsedBulk.length}</b>건</span>
                {parsedBulk.slice(0, 5).map((g) => (
                  <span key={g.id} className="bulk-chip">
                    {g.date} · {g.home} vs {g.away}
                    {(Number.isFinite(g.homeScore) || Number.isFinite(g.awayScore)) &&
                      ` (${Number.isFinite(g.homeScore) ? g.homeScore : '-'}:${Number.isFinite(g.awayScore) ? g.awayScore : '-'})`}
                  </span>
                ))}
                {parsedBulk.length > 5 && <span className="bulk-more">…외 {parsedBulk.length - 5}건</span>}
              </div>
              <button className="primary" type="button" onClick={addBulkGames}>
                일괄 추가
              </button>
            </div>

            {/* 최근 일정 */}
            <div className="help small" style={{ marginTop: 12 }}>최근 일정</div>
            {recentGames.length ? (
              <ul className="manual-list">
                {recentGames
                  .slice()
                  .sort((a, b) => (a.date > b.date ? 1 : -1))
                  .slice(-10)
                  .map((g, i) => (
                    <li key={g.id || `${g.date}-${g.home}-${g.away}-${i}`} className="manual-item">
                      <span className="u-date">{g.date}</span>
                      <span className="u-teams">
                        {g.home} <span className="vs">vs</span> {g.away}
                      </span>
                      {(Number.isFinite(g.homeScore) || Number.isFinite(g.awayScore)) && (
                        <span className="u-score">
                          {Number.isFinite(g.homeScore) ? g.homeScore : '-'}
                          {' : '}
                          {Number.isFinite(g.awayScore) ? g.awayScore : '-'}
                        </span>
                      )}
                      <button
                        type="button"
                        className="ghost sm"
                        onClick={() => removeGame(g.id ?? i)}
                        title="삭제"
                      >
                        삭제
                      </button>
                    </li>
                  ))}
              </ul>
            ) : (
              <div className="empty">등록된 일정이 없습니다.</div>
            )}
          </div>
        </div>

        {/* (옵션) 다가오는 경기 */}
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
