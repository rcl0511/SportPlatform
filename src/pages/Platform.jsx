// src/pages/Platform.jsx
import React, { useEffect, useMemo, useRef, useState, useContext } from 'react';
import '../styles/Platform.css';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

/* ===== 사용자 이름 헬퍼 (컴포넌트 밖에 선언) ===== */
const getFullName = (u) => {
  if (!u) return '기자 미상';
  const {
    first_name, last_name,             // snake_case
    firstName, lastName,               // camelCase
    name, displayName, username,
  } = u;

  // 한국식: 성+이름 붙여쓰기
  const snake = `${last_name || ''}${first_name || ''}`.trim();
  if (snake) return snake;

  // 서양식: 성 띄어쓰기 이름
  const camel = [lastName, firstName].filter(Boolean).join(' ').trim();
  if (camel) return camel;

  return name || displayName || username || '기자 미상';
};

/** saved_files 메타를 article:<id> 의 detail과 병합해서 image/본문을 보강 */
function mergeArticleDetail(meta) {
  if (!meta || !meta.id) return meta;
  try {
    const raw = localStorage.getItem(`article:${meta.id}`);
    if (!raw) return meta;

    const detail = JSON.parse(raw || '{}'); // { content, image }
    // 우선순위: detail.image > meta.image
    const image = detail?.image || meta?.image || null;

    return { ...meta, image, fullContent: detail?.content ?? meta?.fullContent };
  } catch {
    return meta;
  }
}

/** 안전 숫자 */
function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function Platform() {
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext);

  // 로그인 사용자 이름 -> "홍길동 기자" 형태 (없으면 '기자 미상')
  const myReporterName = useMemo(() => {
    const n = (getFullName(userInfo) || '').trim();
    return n && n !== '기자 미상' ? `${n} 기자` : '기자 미상';
  }, [userInfo]);

  const scheduleTabs = ['KBO'];

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
    {
      status: 'LIVE',
      date: today,
      league: 'KBO',
      title: '[스포츠N플러스] \n\n 안우진, 1군 엔트리 등록, 왜?'
    },
    {
      status: '18:30 예정',
      date: today,
      homeTeam: '두산',
      homeScore: 0,
      awayTeam: '삼성',
      awayScore: 0,
      homeLogo: '/DOOSAN.png',
      awayLogo: '/SAMSUNG.png',
      stadium: '대구',
      league: 'KBO',
    },
    {
      status: '18:30 예정',
      date: today,
      homeTeam: 'NC',
      homeScore: 0,
      awayTeam: '롯데',
      awayScore: 0,
      homeLogo: '/NC.png',
      awayLogo: '/LOTTE.png',
      stadium: '울산',
      league: 'KBO',
      scheduledAt: todayWithTime('16:30')
    },
    {
      status: '18:30 예정',
      date: today,
      homeTeam: '키움',
      homeScore: 0,
      awayTeam: 'KT',
      awayScore: 0,
      homeLogo: '/KIWOOM.png',
      awayLogo: '/KT.png',
      stadium: '수원',
      league: 'KBO',
      scheduledAt: todayWithTime('18:00')
    },
    {
      status: '18:30 예정',
      date: today,
      homeTeam: 'KIA',
      homeScore: 0,
      awayTeam: 'SSG',
      awayScore: 0,
      homeLogo: '/KIA.png',
      awayLogo: '/SSG.png',
      stadium: '문학',
      league: 'KBO',
      scheduledAt: todayWithTime('18:00')
    },

    // 종료된 경기 (어제)
    {
      status: '종료',
      date: yesterday,
      homeTeam: '두산',
      homeScore: 9,
      awayTeam: 'SSG',
      awayScore: 2,
      homeLogo: '/DOOSAN.png',
      awayLogo: '/SSG.png',
      stadium: '문학',
      broadcaster: 'SBS SPORTS',
      league: 'KBO'
    }
  ];

  // 각 매치에 안전한 id 부여
  const matchListWithIds = useMemo(
    () => matchList.map((m, i) => ({ id: m.id ?? `match-${i}`, ...m })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // 더미 기사 (있으면 표시되지만, 실제 저장된 기사에 밀림)
  const fallbackArticles = [
    { id: 1, title: '‘홈런 쇼’ KBO 올스타전, 올해 MVP는 누구?', reporter: '이정원 기자', views: 15230, image: '/assets/article1.jpg' },
    { id: 2, title: '역전극의 주인공, 한화의 신예 투수 등장', reporter: '박지훈 기자', views: 12045, image: '/assets/article2.jpg' },
    { id: 3, title: 'LG, 9회말 끝내기 승리…관중 2만 5천 환호', reporter: '김수연 기자', views: 11020, image: '/assets/article3.jpg' },
    { id: 4, title: 'NC, KT 꺾고 5연승 질주', reporter: '홍길동 기자', views: 9800, image: '/assets/article4.jpg' },
    { id: 5, title: '롯데, 3년 만에 포스트시즌 진출 확정', reporter: '최은지 기자', views: 8700, image: '/assets/article5.jpg' }
  ];

  /** 업로드 이미지 없을 때도 동일 크기 유지용 */
  function ImageOrBlank({ src, className, alt, onError }) {
    if (src) {
      return <img src={src} alt={alt || ''} className={className} onError={onError} />;
    }
    // 동일 크기, 테두리만 있는 빈 박스
    return <div className={`${className} img-placeholder`} aria-hidden="true" />;
  }



  // 초기 로드 & 로딩 스켈레톤
  useEffect(() => {
    setLoading(true);
    try {
      // 저장 기사 메타 로드
      const stored = JSON.parse(localStorage.getItem('saved_files') || '[]');

      // **여기서 detail(article:<id>)을 병합해 image를 끌어온다!**
      const merged = stored.map(mergeArticleDetail);
      setSavedArticles(merged);

      const storedRecords = JSON.parse(localStorage.getItem('recent_records') || '[]');
      setRecords(
        storedRecords.length
          ? storedRecords
          : [
            { id: 1, title: 'LG 5-3 KIA (8/14)', detail: '9회말 끝내기 2루타', tag: '경기 요약' },
            { id: 2, title: '두산 7-2 SSG (8/13)', detail: '선발 7이닝 1실점 QS', tag: '투수 기록' },
            { id: 3, title: 'NC 3-0 KT (8/12)', detail: '팀 무실점 승리', tag: '클린시트' }
          ]
      );

      const storedTopics = JSON.parse(localStorage.getItem('hot_topics') || '[]');
      setHotTopics(
        storedTopics.length
          ? storedTopics
          : [
            { id: 't1', text: '루키 외야수, 데뷔 첫 홈런으로 팀 승리 견인', heat: 46 },
            { id: 't2', text: '8월 MVP 레이스, 불펜 에이스 급부상', heat: 21 },
            { id: 't3', text: '트레이드 마감 임박, 각 팀 보강 시나리오', heat: 33 }
          ]
      );
    } catch {
      setSavedArticles([]);
    } finally {
      const t = setTimeout(() => setLoading(false), 250);
      return () => clearTimeout(t);
    }
  }, []);

  // ===== 더미 ↓로 밀리고 실제 ↑로 오게 하는 병합 유틸 =====
  function normalizeId(a, idx) {
    return a?.id ?? `real-${idx}`;
  }
  function toKey(a) {
    return (a?.id ?? a?.title ?? '').toString().trim();
  }

  // 1) 실제 기사: id 정규화 + 조회수 기준 내림차순
  const realArticles = useMemo(() => {
    const arr = Array.isArray(savedArticles) ? savedArticles : [];
    return arr
      .map((a, i) => ({ ...a, id: normalizeId(a, i), isDummy: false }))
      .sort((a, b) => safeNum(b.views) - safeNum(a.views));
  }, [savedArticles]);

  // 2) 더미 기사: 실제와 중복 제거 후 접두사 id 부여
  const dummyArticles = useMemo(() => {
    const realKeys = new Set(realArticles.map(toKey));
    return fallbackArticles
      .filter((d) => !realKeys.has(toKey(d)))
      .map((d, i) => ({ ...d, id: `d-${d.id ?? i}`, isDummy: true }));
  }, [realArticles, fallbackArticles]);

  // 3) 최종 기사 목록: 실제 ↑ → 더미 ↓
  const sortedArticles = useMemo(() => {
    return [...realArticles, ...dummyArticles];
  }, [realArticles, dummyArticles]);

  // 탭에 따른 경기 리스트 필터
  const filteredMatches = useMemo(() => {
    if (activeTab === 'KBO') return matchListWithIds.filter((m) => m.league === 'KBO');
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

  const nextSlide = () => setSlideIndex((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setSlideIndex((prev) => (prev - 1 + totalSlides) % totalSlides);

  // 탭 변경 시 첫 페이지로
  useEffect(() => {
    setSlideIndex(0);
  }, [activeTab]);

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

  const getStatusColor = (status) => {
    if (status === 'LIVE') return '#E60000';
    if (status?.includes?.('예정')) return '#3283FD';
    return '#757575';
  };

  const formatHeat = (n) => `${safeNum(n)}%`;
  const cut = (s, n = 40) =>
    (String(s || '').length > n ? String(s).slice(0, n) + '…' : String(s || ''));
  const viewsText = (v) => `${safeNum(v).toLocaleString?.() || safeNum(v)} views`;

  // ✅ 이미지 에러 시 감추지 말고 표시(디버깅 도움)
  function imgOnError(e) {
    e.currentTarget.style.outline = '2px solid #ff6b6b';
    e.currentTarget.title = '이미지를 불러오지 못했습니다(경로 확인).';
    // 원하면 감추기: e.currentTarget.style.display = 'none';
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
          <button className="slide-button" onClick={prevSlide} disabled={!canPrev} aria-label="이전">
            {'<'}
          </button>

          <div
            className="slide-window"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div
              className="slide-track slide-track--paged"
              style={{ transform: `translateX(-${slideIndex * 100}%)` }}
            >
              {pages.map((page, pIdx) => (
                <div className="slide-page" key={pIdx} style={{ '--items-per': ITEMS_PER_SLIDE }}>
                  {page.map((m, idx) => (
                    <article
                      key={`${pIdx}-${m.id}-${idx}`}
                      className="match-card"
                      aria-label={
                        m.title
                          ? `영상: ${m.title}`
                          : `${m.league || ''} ${m.homeTeam || ''} vs ${m.awayTeam || ''}`
                      }
                    >
                      <div className="match-head">
                        <div className="match-status" style={{ color: getStatusColor(m.status) }}>
                          {m.status === 'LIVE' && <span className="live-dot" aria-hidden />}
                          {m.status}
                        </div>
                        <div className="match-league">{m.league}</div>
                      </div>

                      {/* 팀/점수 UI 대신 제목 한 줄 표시 */}
                      {m.title ? (
                        <div className="title-row" title={m.title}>
                          <p className="video-title">{m.title}</p>
                        </div>
                      ) : (
                        <>
                          <div className="team-row">
                            <img
                              src={`/assets${m.homeLogo || ''}`}
                              alt={m.homeTeam || 'home'}
                              onError={imgOnError}
                            />
                            <span className="team-name">{m.homeTeam}</span>
                            <strong className="score">{safeNum(m.homeScore)}</strong>
                          </div>
                          <div className="team-row">
                            <img
                              src={`/assets${m.awayLogo || ''}`}
                              alt={m.awayTeam || 'away'}
                              onError={imgOnError}
                            />
                            <span className="team-name">{m.awayTeam}</span>
                            <strong className="score">{safeNum(m.awayScore)}</strong>
                          </div>
                        </>
                      )}

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
                                    { url: '/data/리뷰.csv', name: '리뷰.csv', type: 'text/csv' },
                                    { url: '/data/결장.csv', name: '결장.csv', type: 'text/csv' },
                                    { url: '/data/경기주요기록.csv', name: '경기주요기록.csv', type: 'text/csv' }
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
                            onClick={() =>
                            (window.location.href =
                              'https://chzzk.naver.com/live/c7a89dacc428d3e620fe889d6f1fa7c0')
                            }
                          >
                            라이브 보러가기
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <button className="slide-button" onClick={nextSlide} disabled={!canNext} aria-label="다음">
            {'>'}
          </button>
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
            <h2>
              야구 <span className="highlight">NOW</span>
            </h2>

            {/* 스켈레톤 */}
            {loading ? (
              <div className="news-main skeleton" aria-hidden>
                <button
                  type="button"
                  className="btn-x-close"
                  aria-label="로딩 닫기"
                  onClick={() => setLoading(false)}
                />
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
                  <Link
                    to={`/platform/article/${sortedArticles[0].id || 0}`}
                    className="news-main-link"
                  >
                    <article className="news-main">
                      {/* ✅ 대표 이미지: 병합된 image가 있으면 표시 */}
                      <ImageOrBlank
                        src={sortedArticles[0].image}
                        alt={sortedArticles[0].title || 'main'}
                        className="news-main-img"
                        onError={imgOnError}
                      />

                      <div>
                        <h3 className="news-main-title">
                          {sortedArticles[0].title || '제목 없음'}
                        </h3>
                        <div className="news-main-reporter">
                          {sortedArticles[0].reporter || myReporterName}
                        </div>
                        <div className="news-main-views">
                          {viewsText(sortedArticles[0].views)}
                        </div>
                        <div className="tag-list">
                          {(sortedArticles[0].tags || ['속보', 'KBO'])
                            .slice(0, 3)
                            .map((t) => (
                              <span key={t} className="tag">
                                #{t}
                              </span>
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
                    <Link
                      to={`/platform/article/${item.id || 0}`}
                      className="news-sub-item"
                      key={item.id || item.title}
                    >
                      {/* ✅ 서브 썸네일도 병합된 image로 표시 */}
                      <ImageOrBlank
  src={item.image}
  alt="thumb"
  className="news-thumb"
  onError={imgOnError}
/>
                      <div>
                        <div className="news-sub-title">{item.title || '제목 없음'}</div>
                        <div className="news-sub-reporter">{item.reporter || myReporterName}</div>
                        <div className="news-sub-views">{viewsText(item.views)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>

        <aside className="right-column" aria-label="사이드 정보">
          <div className="right-sticky">
            <SideCard
              title="내 저장함"
              rightLink={{ to: '/file', text: '관리' }}
              items={(sortedArticles || []).slice(0, 6)}  // 병합된 이미지가 있는 목록을 사용
              emptyText="아직 저장된 기사가 없어요."
              renderItem={(a) => (
                <li key={a.id || a.title} className="saved-item">
                  <Link to={`/platform/article/${a.id || 0}`} className="saved-link">
                    {/* 작은 점 옆에 썸네일 옵션(원하면 사용) */}
                    {/* {a.image && <img src={a.image} alt="" className="saved-thumb" onError={imgOnError} />} */}
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
  return (
    <span className="pill pill-time" title="경기 시작까지">
      {left}
    </span>
  );
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
  } catch {
    return null;
  }
}

function EmptyCard({ title = '내용이 없어요', actionText, to }) {
  return (
    <div className="empty-card">
      <div className="empty-icon"></div>
      <div className="empty-title">{title}</div>
      {actionText && to && <Link to={to} className="btn-empty">{actionText}</Link>}
    </div>
  );
}

function SideCard({ title, items = [], emptyText, rightLink, onMore, renderItem }) {
  return (
    <section className="right-card">
      <div className="right-card-header">
        <h3>{title}</h3>
        {rightLink ? (
          <Link to={rightLink.to} className="mini-link">
            {rightLink.text}
          </Link>
        ) : (
          <button className="mini-link" onClick={onMore}>
            더보기
          </button>
        )}
      </div>
      <ul
        className={
          title === '이슈 토픽'
            ? 'topic-list'
            : title === '오늘의 기록'
              ? 'record-list'
              : 'saved-list'
        }
      >
        {items.length ? items.map(renderItem) : <li className="saved-empty">{emptyText}</li>}
      </ul>
    </section>
  );
}
