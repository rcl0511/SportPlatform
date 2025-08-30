// src/pages/Platform.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/Platform.css';
import { Link, useNavigate } from 'react-router-dom';

const PLACEHOLDER_IMG = '/assets/placeholder.jpg';

export default function Platform() {
  const navigate = useNavigate();

  const scheduleTabs = ['주요 경기', 'KBO', '야구 기타'];

  // 탭 선택 상태
  const [activeTab, setActiveTab] = useState(scheduleTabs[0]);

  // 슬라이드는 항상 5개씩 고정
  const ITEMS_PER_SLIDE = 5;
  const [slideIndex, setSlideIndex] = useState(0);

  // 데이터 상태
  const [savedArticles, setSavedArticles] = useState([]);
  const [records, setRecords] = useState([]);
  const [hotTopics, setHotTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  // 날짜 헬퍼
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  function todayWithTime(hhmm = '18:00') {
    const [hh, mm] = hhmm.split(':').map(Number);
    const d = new Date();
    d.setHours(hh || 0, mm || 0, 0, 0);
    return d.toISOString();
  }

  const matchList = [
    { status: 'LIVE', date: today, homeTeam: 'LG',   homeScore: 3, awayTeam: 'KIA',   awayScore: 2, homeLogo: '/LG.png',      awayLogo: '/KIA.png',      stadium: '잠실',  league: 'KBO' },
    { status: '18:30 예정', date: today, homeTeam: 'KT',   homeScore: 0, awayTeam: 'NC',    awayScore: 0, homeLogo: '/KT.png',      awayLogo: '/NC.png',       stadium: '수원',  league: 'KBO', scheduledAt: todayWithTime('15:00') },
    { status: '18:30 예정', date: today, homeTeam: 'SSG',  homeScore: 0, awayTeam: '두산',  awayScore: 0, homeLogo: '/SSG.png',     awayLogo: '/DOOSAN.png',   stadium: '문학',  league: 'KBO', scheduledAt: todayWithTime('18:00') },
    { status: '18:30 예정', date: today, homeTeam: '삼성', homeScore: 0, awayTeam: '한화',  awayScore: 0, homeLogo: '/SAMSUNG.png',  awayLogo: '/HANWHA.png',   stadium: '대구',  league: 'KBO', scheduledAt: todayWithTime('18:00') },
    { status: '18:30 예정', date: today, homeTeam: '키움', homeScore: 0, awayTeam: '롯데',  awayScore: 0, homeLogo: '/KIWOOM.png',   awayLogo: '/LOTTE.png',    stadium: '고척',  league: 'KBO', scheduledAt: todayWithTime('18:00') },

    // 종료된 경기 (어제)
    { status: '종료', date: yesterday, homeTeam: '두산', homeScore: 7, awayTeam: 'LG', awayScore: 6, homeLogo: '/DOOSAN.png', awayLogo: '/LG.png', stadium: '잠실', broadcaster: 'SPOTV', league: 'KBO' },
    { status: '종료', date: yesterday, homeTeam: 'KIA', homeScore: 2, awayTeam: '삼성', awayScore: 5, homeLogo: '/KIA.png', awayLogo: '/SAMSUNG.png', stadium: '광주', broadcaster: 'KBSN', league: 'KBO' },
    { status: '종료', date: yesterday, homeTeam: '롯데', homeScore: 9, awayTeam: 'NC', awayScore: 3, homeLogo: '/LOTTE.png', awayLogo: '/NC.png', stadium: '사직', broadcaster: 'MBC Sports', league: 'KBO' },
    { status: '종료', date: yesterday, homeTeam: '한화', homeScore: 4, awayTeam: 'SSG', awayScore: 4, homeLogo: '/HANWHA.png', awayLogo: '/SSG.png', stadium: '대전', broadcaster: 'SPOTV', league: 'KBO' },
    { status: '종료', date: yesterday, homeTeam: '키움', homeScore: 1, awayTeam: 'KT', awayScore: 8, homeLogo: '/KIWOOM.png', awayLogo: '/KT.png', stadium: '고척', broadcaster: 'SBS Sports', league: 'KBO' },
  ];

  // 각 매치에 안전한 id 부여
  const matchListWithIds = useMemo(
    () => matchList.map((m, i) => ({ id: m.id ?? `match-${i}`, ...m })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const fallbackArticles = [
    { id: 1, title: "‘홈런 쇼’ KBO 올스타전, 올해 MVP는 누구?", reporter: "이정원 기자", views: 15230, image: "/assets/article1.jpg" },
    { id: 2, title: "역전극의 주인공, 한화의 신예 투수 등장",     reporter: "박지훈 기자", views: 12045, image: "/assets/article2.jpg" },
    { id: 3, title: "LG, 9회말 끝내기 승리…관중 2만 5천 환호",    reporter: "김수연 기자", views: 11020, image: "/assets/article3.jpg" },
    { id: 4, title: "NC, KT 꺾고 5연승 질주",                     reporter: "홍길동 기자", views: 9800,  image: "/assets/article4.jpg" },
    { id: 5, title: "롯데, 3년 만에 포스트시즌 진출 확정",         reporter: "최은지 기자", views: 8700,  image: "/assets/article5.jpg" }
  ];

  // 초기 로드 & 로딩 스켈레톤
  useEffect(() => {
    setLoading(true);
    try {
      const stored = JSON.parse(localStorage.getItem('saved_files') || '[]');
      setSavedArticles(stored.length ? stored : fallbackArticles);

      const storedRecords = JSON.parse(localStorage.getItem('recent_records') || '[]');
      setRecords(storedRecords.length ? storedRecords : [
        { id: 1, title: 'LG 5-3 KIA (8/14)', detail: '9회말 끝내기 2루타', tag: '경기 요약' },
        { id: 2, title: '두산 7-2 SSG (8/13)', detail: '선발 7이닝 1실점 QS', tag: '투수 기록' },
        { id: 3, title: 'NC 3-0 KT (8/12)', detail: '팀 무실점 승리', tag: '클린시트' },
      ]);

      const storedTopics = JSON.parse(localStorage.getItem('hot_topics') || '[]');
      setHotTopics(storedTopics.length ? storedTopics : [
        { id: 't1', text: '루키 외야수, 데뷔 첫 홈런으로 팀 승리 견인', heat: 46 },
        { id: 't2', text: '8월 MVP 레이스, 불펜 에이스 급부상', heat: 21 },
        { id: 't3', text: '트레이드 마감 임박, 각 팀 보강 시나리오', heat: 33 },
      ]);
    } catch {
      setSavedArticles(fallbackArticles);
    } finally {
      const t = setTimeout(() => setLoading(false), 250);
      return () => clearTimeout(t);
    }
  }, []);

  // 탭에 따른 경기 리스트 필터
  const filteredMatches = useMemo(() => {
    if (activeTab === 'KBO') return matchListWithIds.filter(m => m.league === 'KBO');
    if (activeTab === '야구 기타') return matchListWithIds.filter(m => m.league !== 'KBO');
    return matchListWithIds; // '주요 경기'
  }, [activeTab, matchListWithIds]);

  // 페이지 단위로 분할해 슬라이드(항상 5개씩)
  const pages = useMemo(() => {
    const arr = [];
    for (let i = 0; i < filteredMatches.length; i += ITEMS_PER_SLIDE) {
      arr.push(filteredMatches.slice(i, i + ITEMS_PER_SLIDE));
    }
    return arr.length ? arr : [[]];
  }, [filteredMatches]);

  const totalSlides = pages.length;
  const canPrev = totalSlides > 1;
  const canNext = totalSlides > 1;

  const nextSlide = () => setSlideIndex(prev => (prev + 1) % totalSlides);
  const prevSlide = () => setSlideIndex(prev => (prev - 1 + totalSlides) % totalSlides);

  // 탭 변경 시 첫 페이지로
  useEffect(() => { setSlideIndex(0); }, [activeTab]);

  // 모바일 스와이프 지원
  const touchStartX = useRef(0);
  const touchDx = useRef(0);
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchDx.current = 0;
  };
  const onTouchMove = (e) => {
    touchDx.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = () => {
    const threshold = 40;
    if (touchDx.current < -threshold && canNext) nextSlide();
    if (touchDx.current > threshold && canPrev) prevSlide();
  };

  const articles = (savedArticles && savedArticles.length > 0) ? savedArticles : fallbackArticles;

  const sortedArticles = useMemo(() => {
    return [...articles].sort((a, b) => (safeNum(b.views) - safeNum(a.views)));
  }, [articles]);

  const getStatusColor = (status) => {
    if (status === 'LIVE') return '#E60000';
    if (status?.includes?.('예정')) return '#3283FD';
    return '#757575';
  };

  const formatHeat = (n) => `${safeNum(n)}%`;
  const cut = (s, n = 40) => (String(s || '').length > n ? String(s).slice(0, n) + '…' : String(s || ''));
  const viewsText = (v) => `${safeNum(v).toLocaleString?.() || safeNum(v)} views`;

  function safeNum(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function imgOnError(e) {
    e.currentTarget.src = PLACEHOLDER_IMG;
  }

  return (
    <div className="platform-wrapper" role="main" aria-label="스포츠 플랫폼">
      {/* ======= 상단 영역 ======= */}
      <div className="top-schedule">
        <div className="schedule-tabs" role="tablist" aria-label="대회 탭">
          {scheduleTabs.map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="schedule-slider" aria-label="경기 슬라이더">
          <button className="slide-button" onClick={prevSlide} disabled={!canPrev} aria-label="이전">{'<'}</button>

          <div
            className="slide-window"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div
              className="slide-track slide-track--paged"
              style={{
                width: `${totalSlides * 100}%`,
                transform: `translateX(-${(100 / totalSlides) * slideIndex}%)`,
              }}
            >
              {pages.map((page, pIdx) => (
                <div className="slide-page" key={pIdx} style={{ width: `${100 / totalSlides}%` }}>
                  {page.map((m, idx) => (
                    <article key={`${pIdx}-${m.id}-${idx}`} className="match-card" aria-label={`${m.league} ${m.homeTeam} vs ${m.awayTeam}`}>
                      <div className="match-head">
                        <div className="match-status" style={{ color: getStatusColor(m.status) }}>
                          {m.status === 'LIVE' && <span className="live-dot" aria-hidden />}
                          {m.status}
                        </div>
                        <div className="match-league">{m.league}</div>
                      </div>

                      <div className="team-row">
                        <img src={`/assets${m.homeLogo}`} alt={m.homeTeam} onError={imgOnError} />
                        <span className="team-name">{m.homeTeam}</span>
                        <strong className="score">{safeNum(m.homeScore)}</strong>
                      </div>
                      <div className="team-row">
                        <img src={`/assets${m.awayLogo}`} alt={m.awayTeam} onError={imgOnError} />
                        <span className="team-name">{m.awayTeam}</span>
                        <strong className="score">{safeNum(m.awayScore)}</strong>
                      </div>

                      <div className="match-meta">
                        <span className="pill">{m.date}</span>
                        {m.stadium && <span className="pill">{m.stadium}</span>}
                        {m.broadcaster && <span className="pill">{m.broadcaster}</span>}
                        {m.scheduledAt && <Countdown scheduledAt={m.scheduledAt} />}
                      </div>

                      {/* 상태별 액션 버튼 */}
                      <div className="match-actions">
                        {m.status === '종료' ? (
                          <button
                            className="btn btn--result"
                            onClick={() =>
                              navigate('/editver2', {
                                state: {
                                  preloadFiles: [
                                    { url: '/data/리뷰.csv',        name: '리뷰.csv',        type: 'text/csv' },
                                    { url: '/data/결장.csv',        name: '결장.csv',        type: 'text/csv' },
                                    { url: '/data/경기주요기록.csv', name: '경기주요기록.csv', type: 'text/csv' },
                                  ],
                                  defaultSubject: `[${m.homeTeam} vs ${m.awayTeam}] 경기 기사 작성`
                                }
                              })
                            }
                          >
                            기사 작성하기
                          </button>
                        ) : m.status === 'LIVE' ? (
                          <button
                            className="btn btn--live"
                            onClick={() => navigate(`/live/${m.id}`)}
                          >
                            라이브 보기
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <button className="slide-button" onClick={nextSlide} disabled={!canNext} aria-label="다음">{'>'}</button>
        </div>

        {/* 인디케이터 */}
        <div className="dots" role="tablist" aria-label="슬라이드 위치">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              className={`dot-btn ${i === slideIndex ? 'active' : ''}`}
              onClick={() => setSlideIndex(i)}
              aria-selected={i === slideIndex}
              aria-label={`${i + 1}번째 슬라이드로 이동`}
            />
          ))}
        </div>
      </div>

      {/* ======= 메인/우측 레이아웃 ======= */}
      <div className="content-grid">
        {/* 메인 뉴스 영역 */}
        <div className="main-column">
          <section className="news-section" aria-label="주요 뉴스">
            <h2>야구 <span className="highlight">NOW</span></h2>

            {/* 스켈레톤 */}
            {loading ? (
              <div className="news-main skeleton" aria-hidden>
                <div className="sk-img" />
                <div className="sk-lines">
                  <div className="sk-line w-80" />
                  <div className="sk-line w-60" />
                  <div className="sk-line w-40" />
                </div>
              </div>
            ) : (
              <>
                {sortedArticles[0] ? (
                  <Link to={`/platform/article/${sortedArticles[0].id || 0}`} className="news-main-link">
                    <article className="news-main">
                      <img
                        src={sortedArticles[0].image || PLACEHOLDER_IMG}
                        alt={sortedArticles[0].title || 'main'}
                        className="news-main-img"
                        onError={imgOnError}
                      />
                      <div>
                        <h3 className="news-main-title">{sortedArticles[0].title || '제목 없음'}</h3>
                        <div className="news-main-reporter">{sortedArticles[0].reporter || '기자 미상'}</div>
                        <div className="news-main-views">{viewsText(sortedArticles[0].views)}</div>
                        <div className="tag-list">
                          {(sortedArticles[0].tags || ['속보', 'KBO']).slice(0, 3).map((t) => (
                            <span key={t} className="tag">#{t}</span>
                          ))}
                        </div>
                      </div>
                    </article>
                  </Link>
                ) : (
                  <EmptyCard title="표시할 메인 기사가 없어요" actionText="첫 기사 만들기" to="/result" />
                )}

                <div className="news-sub-list">
                  {sortedArticles.slice(1, 7).map((item) => (
                    <Link to={`/platform/article/${item.id || 0}`} className="news-sub-item" key={item.id || item.title}>
                      <img
                        src={item.image || PLACEHOLDER_IMG}
                        alt="thumb"
                        className="news-thumb"
                        onError={imgOnError}
                      />
                      <div>
                        <div className="news-sub-title">{item.title || '제목 없음'}</div>
                        <div className="news-sub-reporter">{item.reporter || '기자 미상'}</div>
                        <div className="news-sub-views">{viewsText(item.views)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>

        {/* 우측 사이드: 기록 / 이슈 토픽(히트율) / 내 저장함 */}
        <aside className="right-column" aria-label="사이드 정보">
          <div className="right-sticky">
            <SideCard
              title="오늘의 기록"
              items={records.slice(0, 5)}
              emptyText="오늘 기록이 아직 없어요."
              onMore={() => alert('기록 더보기 준비 중!')}
              renderItem={(r) => (
                <li key={r.id} className="record-item">
                  <div className="record-title">{r.title}</div>
                  <div className="record-detail">{r.detail}</div>
                  <span className="record-tag">{r.tag}</span>
                </li>
              )}
            />

            <SideCard
              title="이슈 토픽"
              items={hotTopics.slice(0, 6)}
              emptyText="이슈 토픽이 아직 없어요."
              onMore={() => alert('이슈 더보기 준비 중!')}
              renderItem={(t) => (
                <li key={t.id} className="topic-item">
                  <div className="topic-text">{cut(t.text, 48)}</div>
                  <div className="topic-heat">{formatHeat(t.heat)}</div>
                </li>
              )}
            />

            <SideCard
              title="내 저장함"
              rightLink={{ to: '/file', text: '관리' }}
              items={(savedArticles || []).slice(0, 6)}
              emptyText="아직 저장된 기사가 없어요."
              renderItem={(a) => (
                <li key={a.id || a.title} className="saved-item">
                  <Link to={'/platform/article/${id}'} className="saved-link">
                    <span className="dot" /> {cut(a.title || '제목 없음', 36)}
                  </Link>
                </li>
              )}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ===== 유틸/보조 컴포넌트 ===== */
function Countdown({ scheduledAt }) {
  const [left, setLeft] = useState(calcDiff(scheduledAt));
  useEffect(() => {
    const t = setInterval(() => setLeft(calcDiff(scheduledAt)), 1000);
    return () => clearInterval(t);
  }, [scheduledAt]);
  if (!left) return null;
  return <span className="pill pill-time" title="경기 시작까지">{left}</span>;
}
function calcDiff(iso) {
  try {
    const target = new Date(iso).getTime();
    const now = Date.now();
    const ms = target - now;
    if (ms <= 0) return '곧 시작';
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    const s = Math.floor((ms % 60_000) / 1000);
    return `${h}시간 ${m}분 ${s}초`;
  } catch { return null; }
}

function EmptyCard({ title = '내용이 없어요', actionText, to }) {
  return (
    <div className="empty-card">
      <div className="empty-icon"></div>
      <div className="empty-title">{title}</div>
      {actionText && to && (
        <Link to={to} className="btn-empty">{actionText}</Link>
      )}
    </div>
  );
}

function SideCard({ title, items = [], emptyText, rightLink, onMore, renderItem }) {
  return (
    <section className="right-card">
      <div className="right-card-header">
        <h3>{title}</h3>
        {rightLink ? (
          <Link to={rightLink.to} className="mini-link">{rightLink.text}</Link>
        ) : (
          <button className="mini-link" onClick={onMore}>더보기</button>
        )}
      </div>
      <ul
        className={
          title === '이슈 토픽' ? 'topic-list' :
          title === '오늘의 기록' ? 'record-list' : 'saved-list'
        }
      >
        {items.length ? items.map(renderItem) : <li className="saved-empty">{emptyText}</li>}
      </ul>
    </section>
  );
}
