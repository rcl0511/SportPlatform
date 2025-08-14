// src/pages/Platform.jsx
import React, { useState, useEffect } from 'react';
import '../styles/Platform.css';
import { Link } from 'react-router-dom';

export default function Platform() {
  const scheduleTabs = ['주요 경기', 'KBO', '야구 기타'];
  const itemsPerSlide = 5;
  const [slideIndex, setSlideIndex] = useState(0);
  const [savedArticles, setSavedArticles] = useState([]);

  // ➕ Rightbar 더미 데이터
  const [records, setRecords] = useState([
    { id: 1, title: 'LG 5-3 KIA (8/14)', detail: '9회말 끝내기 2루타', tag: '경기 요약' },
    { id: 2, title: '두산 7-2 SSG (8/13)', detail: '선발 7이닝 1실점 QS', tag: '투수 기록' },
    { id: 3, title: 'NC 3-0 KT (8/12)', detail: '팀 무실점 승리', tag: '클린시트' },
  ]);
  const [hotTopics, setHotTopics] = useState([
    { id: 't1', text: '루키 외야수, 데뷔 첫 홈런으로 팀 승리 견인', heat: 92 },
    { id: 't2', text: '8월 MVP 레이스, 불펜 에이스 급부상', heat: 88 },
    { id: 't3', text: '트레이드 마감 임박, 각 팀 보강 시나리오', heat: 83 },
  ]);

  const matchList = [
    { status: 'LIVE',      league: 'KBO', homeTeam: 'LG',   homeScore: 3, awayTeam: 'KIA',   awayScore: 2, homeLogo: '/LG.png',     awayLogo: '/KIA.png' },
    { status: '15:00 예정', league: 'KBO', homeTeam: 'KT',   homeScore: 0, awayTeam: 'NC',    awayScore: 0, homeLogo: '/KT.png',     awayLogo: '/NC.png' },
    { status: '종료',       league: 'KBO', homeTeam: 'SSG',  homeScore: 4, awayTeam: '두산',  awayScore: 5, homeLogo: '/SSG.png',    awayLogo: '/DOOSAN.png' },
    { status: '18:00 예정', league: 'KBO', homeTeam: '삼성', homeScore: 0, awayTeam: '한화',  awayScore: 0, homeLogo: '/SAMSUNG.png', awayLogo: '/HANWHA.png' },
    { status: '종료',       league: 'KBO', homeTeam: '키움', homeScore: 1, awayTeam: '롯데',  awayScore: 2, homeLogo: '/KIWOOM.png',  awayLogo: '/LOTTE.png' }
  ];

  const dummyArticles = [
    { id: 1, title: "‘홈런 쇼’ KBO 올스타전, 올해 MVP는 누구?", reporter: "이정원 기자", views: 15230, image: "/assets/article1.jpg" },
    { id: 2, title: "역전극의 주인공, 한화의 신예 투수 등장",     reporter: "박지훈 기자", views: 12045, image: "/assets/article2.jpg" },
    { id: 3, title: "LG, 9회말 끝내기 승리…관중 2만 5천 환호",    reporter: "김수연 기자", views: 11020, image: "/assets/article3.jpg" },
    { id: 4, title: "NC, KT 꺾고 5연승 질주",                     reporter: "홍길동 기자", views: 9800,  image: "/assets/article4.jpg" },
    { id: 5, title: "롯데, 3년 만에 포스트시즌 진출 확정",         reporter: "최은지 기자", views: 8700,  image: "/assets/article5.jpg" }
  ];

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('saved_files') || '[]');
    setSavedArticles(stored);

    // 필요 시 로컬스토리지에서 기록/이슈도 불러오기 (키만 정하면 됨)
    const storedRecords = JSON.parse(localStorage.getItem('recent_records') || '[]');
    if (storedRecords.length) setRecords(storedRecords);

    const storedTopics = JSON.parse(localStorage.getItem('hot_topics') || '[]');
    if (storedTopics.length) setHotTopics(storedTopics);
  }, []);

  const articles = (savedArticles && savedArticles.length > 0) ? savedArticles : dummyArticles;
  const sortedArticles = [...articles].sort((a, b) => (b.views || 0) - (a.views || 0));

  const getStatusColor = (status) => {
    if (status === 'LIVE') return '#E60000';
    if (status.includes('예정')) return '#3283FD';
    return '#757575';
  };

  const totalSlides = Math.ceil(matchList.length / itemsPerSlide);
  const visibleMatches = matchList.slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide);

  const nextSlide = () => setSlideIndex((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setSlideIndex((prev) => (prev - 1 + totalSlides) % totalSlides);

  const formatHeat = (n) => `${n}%`;
  const cut = (s, n = 40) => (s.length > n ? s.slice(0, n) + '…' : s);

  return (
    <div className="platform-wrapper">
      {/* ======= 상단 영역 ======= */}
      <div className="top-schedule" style={{ marginTop: '90px' }}>
        <div className="schedule-tabs">
          {scheduleTabs.map((tab, idx) => (
            <button key={idx} className={idx === 0 ? 'tab active' : 'tab'}>{tab}</button>
          ))}
        </div>

        <div className="schedule-slider">
          <button className="slide-button" onClick={prevSlide}>{'<'}</button>
          <div className="slide-window">
            <div className="slide-track">
              {visibleMatches.map((match, idx) => (
                <div key={idx} className="match-card">
                  <div className="match-status" style={{ color: getStatusColor(match.status) }}>{match.status}</div>
                  <div className="match-league">{match.league}</div>

                  <div className="team-row">
                    <img src={`/assets${match.homeLogo}`} alt={match.homeTeam} />
                    <span>{match.homeTeam}</span>
                    <strong style={{ marginLeft: 'auto' }}>{match.homeScore}</strong>
                  </div>
                  <div className="team-row">
                    <img src={`/assets${match.awayLogo}`} alt={match.awayTeam} />
                    <span>{match.awayTeam}</span>
                    <strong style={{ marginLeft: 'auto' }}>{match.awayScore}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button className="slide-button" onClick={nextSlide}>{'>'}</button>
        </div>
      </div>

      {/* ======= 메인/우측 레이아웃 ======= */}
      <div className="content-grid">
        {/* 메인 뉴스 영역 */}
        <div className="main-column">
          <div className="news-section">
            <h2>야구 <span className="highlight">NOW</span></h2>

            {sortedArticles[0] && (
              <Link to={`/platform/article/${sortedArticles[0].id}`} className="news-main-link">
                <div className="news-main">
                  <img src={sortedArticles[0].image} alt="main" className="news-main-img" />
                  <div className="news-main-title">{sortedArticles[0].title}</div>
                  <div className="news-main-reporter">🖋 {sortedArticles[0].reporter}</div>
                  <div className="news-main-views">👁 {sortedArticles[0].views?.toLocaleString?.()} views</div>
                </div>
              </Link>
            )}

            <div className="news-sub-list">
              {sortedArticles.slice(1).map((item) => (
                <Link to={`/platform/article/${item.id}`} className="news-sub-item" key={item.id}>
                  <img src={item.image} alt="thumb" className="news-thumb" />
                  <div>
                    <div className="news-sub-title">{item.title}</div>
                    <div className="news-sub-reporter">🖋 {item.reporter}</div>
                    <div className="news-sub-views">👁 {item.views?.toLocaleString?.()} views</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* 👉 우측 사이드 영역 */}
        <aside className="right-column">
          <div className="right-sticky">
            {/* 카드 1: 오늘의 경기 기록 */}
            <section className="right-card">
              <div className="right-card-header">
                <h3>오늘의 기록</h3>
                <button className="mini-link" onClick={() => alert('기록 더보기 준비 중!')}>더보기</button>
              </div>
              <ul className="record-list">
                {records.slice(0, 4).map(r => (
                  <li key={r.id} className="record-item">
                    <div className="record-title">⚾ {r.title}</div>
                    <div className="record-detail">{r.detail}</div>
                    <span className="record-tag">{r.tag}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* 카드 2: 뜨거운 이슈 */}
            <section className="right-card">
              <div className="right-card-header">
                <h3>이슈 토픽</h3>
                <button className="mini-link" onClick={() => alert('이슈 더보기 준비 중!')}>더보기</button>
              </div>
              <ul className="topic-list">
                {hotTopics.slice(0, 5).map(t => (
                  <li key={t.id} className="topic-item">
                    <div className="topic-text">{cut(t.text, 48)}</div>
                    <div className="topic-heat">{formatHeat(t.heat)}</div>
                  </li>
                ))}
              </ul>
            </section>

            {/* 카드 3: 내 저장함 */}
            <section className="right-card">
              <div className="right-card-header">
                <h3>내 저장함</h3>
                <Link to="/file" className="mini-link">관리</Link>
              </div>
              <ul className="saved-list">
                {(savedArticles.length ? savedArticles : []).slice(0, 4).map(a => (
                  <li key={a.id || a.title} className="saved-item">
                    <Link to={`/platform/article/${a.id || 0}`} className="saved-link">
                      <span className="dot" /> {cut(a.title || '제목 없음', 36)}
                    </Link>
                  </li>
                ))}
                {!savedArticles.length && (
                  <li className="saved-empty">아직 저장된 기사가 없어요.</li>
                )}
              </ul>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}
