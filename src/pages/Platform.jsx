// src/pages/Platform.jsx
import React, { useEffect, useMemo, useRef, useState, useContext } from 'react';
import '../styles/Platform.css';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
//import { parse } from "date-fns";

// 팀 이름 → 로고 경로 매핑
const teamLogoMap = {
  두산: "/assets/DOOSAN.png",
  삼성: "/assets/SAMSUNG.png",
  SSG: "/assets/SSG.png",
  한화: "/assets/HANWHA.png",
  NC: "/assets/NC.png",
  롯데: "/assets/LOTTE.png",
  LG: "/assets/LG.png",
  KT: "/assets/KT.png",
  키움: "/assets/KIWOOM.png",
  KIA: "/assets/KIA.png",
};

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

  const [scheduleData, setScheduleData] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);



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
  const [searchQuery, setSearchQuery] = useState('');
  const [articleTab, setArticleTab] = useState('popular'); // popular, latest, category
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [naverArticles, setNaverArticles] = useState([]);
  const [loadingNaver, setLoadingNaver] = useState(false);

  // 날짜 헬퍼
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  function todayWithTime(hhmm = '18:00') {
    const [hh, mm] = hhmm.split(':').map(Number);
    const d = new Date();
    d.setHours(hh || 0, mm || 0, 0, 0);
    return d.toISOString();
  }

  // === KBO 일정 불러오기 (S3) ===
  useEffect(() => {
    async function loadSchedule() {
      try {
        const res = await fetch(
          "https://kbo-schedule-data.s3.ap-northeast-2.amazonaws.com/kbo_schedule.json"
        );
        const json = await res.json();
        const games = json.games || [];

        // HTML 태그 제거, 공백 정규화
        const stripTags = (html) => {
          return html
            ?.replace(/<\/?[^>]+(>|$)/g, "")      // 태그 제거
            .replace(/vs/g, " vs ")               // vs 앞뒤 공백 추가
            .replace(/(\d)([A-Za-z가-힣])/g, "$1 $2") // 숫자 뒤 문자 간격
            .replace(/([가-힣A-Za-z])(\d)/g, "$1 $2") // 문자 뒤 숫자 간격
            .replace(/\s+/g, " ")                 // 공백 정리
            .trim();
        };

        // 날짜 문자열 "10.14(화)" → Date
        const parseDate = (str) => {
          if (!str) return null;
          const m = str.match(/(\d{2})\.(\d{2})/);
          if (!m) return null;
          return new Date(2025, parseInt(m[1]) - 1, parseInt(m[2]));
        };

        const today = new Date();
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        // 데이터 정리
        const normalized = games
          .map((g, i) => ({
            id: i,
            dateText: g.date || "날짜 미정",
            timeText: stripTags(g.time || ""),
            playText: stripTags(g.play || ""),
            stadium: g.stadium,
            dateObj: parseDate(g.date),
          }))
          .filter((g) => g.dateObj);

        // 🟢 오늘 날짜 비교용
        const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
          
        // 날짜 → YYYY-M-D 형태로 변환
        const toKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
          
        const normalizedWithStatus = normalized.map((g) => {
           const isToday = g.dateObj && toKey(g.dateObj) === todayStr;
           return {
            ...g,
            isToday,
            statusTag: isToday ? "LIVE" : g.dateObj > today ? "예정" : "종료",
          };
        });

        const upcoming = normalizedWithStatus
          .filter((g) => g.dateObj >= todayOnly)
          .sort((a, b) => a.dateObj - b.dateObj)
          .slice(0, 5);
          
        const finished = normalizedWithStatus
          .filter((g) => g.dateObj < todayOnly)
          .sort((a, b) => b.dateObj - a.dateObj)
          .slice(0, 5);

        setScheduleData(normalized);
        setUpcomingMatches(upcoming);
        setRecentMatches(finished);
        console.log("📅 upcoming:", upcoming);
        console.log("📅 finished:", finished);
      } catch (err) {
        console.error("❌ 일정 불러오기 실패:", err);
      }
    }

    loadSchedule();
  }, []);


  const matchList = [
    ...upcomingMatches.map((m) => ({
      status: `${m.timeText} 예정`,
      date: m.dateText,
      league: "KBO",
      title: m.playText,
      stadium: m.stadium,
    })),
    ...recentMatches.map((m) => ({
      status: "종료",
      date: m.dateText,
      league: "KBO",
      title: m.playText,
      stadium: m.stadium,
    })),
  ];

  // 각 매치에 안전한 id 부여
  const matchListWithIds = useMemo(
    () => matchList.map((m, i) => ({ id: m.id ?? `match-${i}`, ...m })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [matchList]
  );

  // 더미 기사 제거 - 실제 데이터만 사용
  const fallbackArticles = [];

  /** 업로드 이미지 없을 때도 동일 크기 유지용 */
  function ImageOrBlank({ src, className, alt, onError }) {
    if (src) {
      return <img src={src} alt={alt || ''} className={className} onError={onError} />;
    }
    // 동일 크기, 테두리만 있는 빈 박스
    return <div className={`${className} img-placeholder`} aria-hidden="true" />;
  }



  // 네이버 야구 기사 로드
  useEffect(() => {
    async function loadNaverArticles() {
      const API_BASE = process.env.REACT_APP_API_BASE || 'https://api.jolpai-backend.shop';
      const today = new Date().toISOString().slice(0, 10);
      const cacheKey = `naver_articles_${today}`;
      
      // 오늘 날짜의 캐시 확인
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const cachedData = JSON.parse(cached);
          const cacheDate = cachedData.date;
          if (cacheDate === today && cachedData.articles && cachedData.articles.length > 0) {
            setNaverArticles(cachedData.articles);
            return;
          }
        }
      } catch {}

      setLoadingNaver(true);
      try {
        const res = await fetch(`${API_BASE}/api/naver-baseball-articles`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.articles && data.articles.length > 0) {
            // 기사 요약 생성
            const articlesWithSummary = await Promise.all(
              data.articles.map(async (article) => {
                const summary = await generateSummary(article.title);
                return {
                  ...article,
                  summary: summary || `${article.title}에 대한 최신 야구 뉴스입니다.`,
                };
              })
            );
            
            setNaverArticles(articlesWithSummary);
            // 캐시 저장
            localStorage.setItem(cacheKey, JSON.stringify({
              date: today,
              articles: articlesWithSummary,
            }));
          }
        } else {
          // API 실패 시 샘플 데이터 표시 (개발용)
          const sampleArticles = [
            {
              title: 'LG 트윈스, 시즌 첫 10연승 달성',
              summary: 'LG 트윈스가 어제 경기에서 승리하며 시즌 첫 10연승을 달성했습니다. 팀의 투타 밸런스가 완벽하게 맞아떨어지며 강력한 경기력을 보여주고 있습니다.',
              image: '/assets/article1.jpg',
              source: '네이버 스포츠',
              date: '1시간 전',
              link: 'https://m.sports.naver.com/kbaseball/index',
            },
            {
              title: 'KIA 타이거즈 신인 투수, 데뷔전 완벽한 피칭',
              summary: 'KIA 타이거즈의 신인 투수가 데뷔전에서 7이닝 무실점의 완벽한 피칭을 선보이며 화제가 되고 있습니다.',
              image: '/assets/article2.jpg',
              source: '네이버 스포츠',
              date: '2시간 전',
              link: 'https://m.sports.naver.com/kbaseball/index',
            },
            {
              title: 'SSG 랜더스, 외국인 타자 영입 발표',
              summary: 'SSG 랜더스가 새로운 외국인 타자를 영입한다고 발표했습니다. 팀의 공격력을 강화하기 위한 전략적 영입으로 평가됩니다.',
              image: '/assets/article3.jpg',
              source: '네이버 스포츠',
              date: '3시간 전',
              link: 'https://m.sports.naver.com/kbaseball/index',
            },
            {
              title: 'NC 다이노스, 포스트시즌 진출 확정',
              summary: 'NC 다이노스가 어제 경기 승리로 포스트시즌 진출을 확정지었습니다. 팬들의 환호가 이어지고 있습니다.',
              image: '/assets/article4.jpg',
              source: '네이버 스포츠',
              date: '4시간 전',
              link: 'https://m.sports.naver.com/kbaseball/index',
            },
            {
              title: '롯데 자이언츠, 연장전 끝내기 승리',
              summary: '롯데 자이언츠가 어제 연장 12회말 끝내기 안타로 극적인 승리를 거두었습니다. 관중석은 함성으로 가득 찼습니다.',
              image: '/assets/article5.jpg',
              source: '네이버 스포츠',
              date: '5시간 전',
              link: 'https://m.sports.naver.com/kbaseball/index',
            },
          ];
          setNaverArticles(sampleArticles);
          localStorage.setItem(cacheKey, JSON.stringify({
            date: today,
            articles: sampleArticles,
          }));
        }
      } catch (err) {
        console.warn('네이버 기사 로드 실패:', err);
        // 실패 시 샘플 데이터 표시
        const sampleArticles = [
          {
            title: 'LG 트윈스, 시즌 첫 10연승 달성',
            summary: 'LG 트윈스가 어제 경기에서 승리하며 시즌 첫 10연승을 달성했습니다.',
            image: '/assets/article1.jpg',
            source: '네이버 스포츠',
            date: '1시간 전',
            link: 'https://m.sports.naver.com/kbaseball/index',
          },
          {
            title: 'KIA 타이거즈 신인 투수, 데뷔전 완벽한 피칭',
            summary: 'KIA 타이거즈의 신인 투수가 데뷔전에서 7이닝 무실점의 완벽한 피칭을 선보였습니다.',
            image: '/assets/article2.jpg',
            source: '네이버 스포츠',
            date: '2시간 전',
            link: 'https://m.sports.naver.com/kbaseball/index',
          },
        ];
        setNaverArticles(sampleArticles);
      } finally {
        setLoadingNaver(false);
      }
    }

    loadNaverArticles();
  }, []);

  // 기사 요약 생성 함수
  async function generateSummary(title) {
    // 간단한 요약 생성 (실제로는 AI API를 사용하거나 본문을 가져와야 함)
    // 여기서는 제목 기반으로 간단한 요약 생성
    try {
      const API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY;
      if (!API_KEY) return null;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Sports Platform',
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: '당신은 스포츠 기사 요약 전문가입니다. 기사 제목을 보고 2-3문장으로 간단히 요약해주세요.',
            },
            {
              role: 'user',
              content: `다음 야구 기사 제목을 요약해주세요: ${title}`,
            },
          ],
          max_tokens: 100,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim() || null;
      }
    } catch (err) {
      console.warn('요약 생성 실패:', err);
    }
    return null;
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
      setRecords(storedRecords);

      const storedTopics = JSON.parse(localStorage.getItem('hot_topics') || '[]');
      setHotTopics(storedTopics);
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

  // 더미 기사 제거 - 실제 기사만 사용
  const sortedArticles = useMemo(() => {
    return realArticles;
  }, [realArticles]);

  // 카테고리 목록 추출
  const categories = useMemo(() => {
    const catSet = new Set();
    sortedArticles.forEach((a) => {
      if (Array.isArray(a.tags)) {
        a.tags.forEach((tag) => catSet.add(tag));
      }
    });
    return Array.from(catSet).sort();
  }, [sortedArticles]);

  // 필터링된 기사
  const filteredArticles = useMemo(() => {
    let filtered = sortedArticles;

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          (a.title || '').toLowerCase().includes(query) ||
          (a.content || '').toLowerCase().includes(query) ||
          (a.reporter || '').toLowerCase().includes(query) ||
          (a.tags || []).some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // 카테고리 필터
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((a) => (a.tags || []).includes(selectedCategory));
    }

    // 팀 필터
    if (selectedTeam !== 'all') {
      filtered = filtered.filter((a) => (a.team || '').includes(selectedTeam));
    }

    // 탭별 정렬
    if (articleTab === 'popular') {
      return filtered.sort((a, b) => safeNum(b.views) - safeNum(a.views));
    } else if (articleTab === 'latest') {
      return filtered.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || 0);
        const dateB = new Date(b.date || b.createdAt || 0);
        return dateB - dateA;
      });
    }

    return filtered;
  }, [sortedArticles, searchQuery, selectedCategory, selectedTeam, articleTab]);

  // 통계 데이터
  const stats = useMemo(() => {
    const total = sortedArticles.length;
    const today = new Date().toISOString().slice(0, 10);
    const todayArticles = sortedArticles.filter((a) => a.date === today).length;
    const totalViews = sortedArticles.reduce((sum, a) => sum + safeNum(a.views), 0);
    const avgViews = total > 0 ? Math.round(totalViews / total) : 0;

    return {
      total,
      todayArticles,
      totalViews,
      avgViews,
    };
  }, [sortedArticles]);

  // 팀별 기사 수
  const teamStats = useMemo(() => {
    const teamMap = {};
    sortedArticles.forEach((a) => {
      const team = a.team || '전체';
      teamMap[team] = (teamMap[team] || 0) + 1;
    });
    return Object.entries(teamMap)
      .map(([team, count]) => ({ team, count }))
      .sort((a, b) => b.count - a.count);
  }, [sortedArticles]);

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

      {/* 네이버 야구 기사 섹션 */}
      {naverArticles.length > 0 && (
        <div className="naver-articles-section">
          <div className="section-header">
            <h2 className="section-title">네이버 스포츠 야구 뉴스</h2>
            <span className="section-subtitle">매일 업데이트되는 최신 야구 기사</span>
          </div>
          <div className="naver-articles-grid">
            {naverArticles.map((article, idx) => (
              <div key={idx} className="naver-article-card">
                {article.image && (
                  <div className="naver-article-image">
                    <img src={article.image} alt={article.title} onError={(e) => { e.target.style.display = 'none'; }} />
                  </div>
                )}
                <div className="naver-article-content">
                  <h3 className="naver-article-title">{article.title}</h3>
                  {article.summary && (
                    <p className="naver-article-summary">{article.summary}</p>
                  )}
                  <div className="naver-article-footer">
                    <span className="naver-article-source">{article.source}</span>
                    {article.date && <span className="naver-article-date">{article.date}</span>}
                    {article.link && (
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="naver-article-link"
                      >
                        원문 보기 →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loadingNaver && (
        <div className="naver-loading">
          <div className="loading-spinner"></div>
          <span>네이버 야구 기사를 불러오는 중...</span>
        </div>
      )}

      {/* 검색 바 */}
      <div className="platform-search-section">
        <div className="search-container">
          <input
            type="text"
            className="platform-search-input"
            placeholder="기사 제목, 내용, 기자명, 태그로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="platform-stats-grid">
        <div className="stat-card">
          <div className="stat-label">전체 기사</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">오늘 작성</div>
          <div className="stat-value">{stats.todayArticles}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">총 조회수</div>
          <div className="stat-value">{stats.totalViews.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">평균 조회</div>
          <div className="stat-value">{stats.avgViews}</div>
        </div>
      </div>

      {/* 카테고리 및 탭 필터 */}
      <div className="platform-filters">
        <div className="article-tabs">
          <button
            className={`tab-btn ${articleTab === 'popular' ? 'active' : ''}`}
            onClick={() => setArticleTab('popular')}
          >
            인기 기사
          </button>
          <button
            className={`tab-btn ${articleTab === 'latest' ? 'active' : ''}`}
            onClick={() => setArticleTab('latest')}
          >
            최신 기사
          </button>
        </div>
        {categories.length > 0 && (
          <div className="category-filters">
            <button
              className={`category-filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              전체
            </button>
            {categories.slice(0, 8).map((cat) => (
              <button
                key={cat}
                className={`category-filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
        {teamStats.length > 0 && (
          <div className="team-filters">
            <button
              className={`team-filter-btn ${selectedTeam === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedTeam('all')}
            >
              전체 팀
            </button>
            {teamStats.slice(0, 5).map(({ team, count }) => (
              <button
                key={team}
                className={`team-filter-btn ${selectedTeam === team ? 'active' : ''}`}
                onClick={() => setSelectedTeam(team)}
              >
                {team} ({count})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 팀별 기사 섹션 */}
      {teamStats.length > 0 && selectedTeam === 'all' && (
        <div className="team-articles-section">
          <h2 className="section-title">팀별 기사</h2>
          <div className="team-articles-grid">
            {teamStats.slice(0, 6).map(({ team, count }) => {
              const teamArticles = sortedArticles
                .filter((a) => (a.team || '전체') === team)
                .slice(0, 3);
              if (teamArticles.length === 0) return null;
              return (
                <div key={team} className="team-article-card">
                  <div className="team-card-header">
                    <h3>{team}</h3>
                    <span className="team-article-count">{count}개</span>
                  </div>
                  <div className="team-article-list">
                    {teamArticles.map((article) => (
                      <Link
                        key={article.id}
                        to={`/platform/article/${article.id || 0}`}
                        className="team-article-item"
                      >
                        <div className="team-article-title">{article.title || '제목 없음'}</div>
                        <div className="team-article-meta">
                          <span>{article.reporter || '기자 미상'}</span>
                          <span>조회 {safeNum(article.views)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======= 메인/우측 레이아웃 ======= */}
      <div className="content-grid">
        {/* 메인 뉴스 영역 */}
        <div className="main-column">
          <section className="news-section" aria-label="주요 뉴스">
            <div className="section-header-with-tabs">
              <h2>
                야구 <span className="highlight">NOW</span>
              </h2>
              {searchQuery && (
                <div className="search-result-info">
                  "{searchQuery}" 검색 결과: {filteredArticles.length}개
                </div>
              )}
            </div>

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
                {filteredArticles[0] ? (
                  <Link
                    to={`/platform/article/${filteredArticles[0].id || 0}`}
                    className="news-main-link"
                  >
                    <article className="news-main">
                      {/* ✅ 대표 이미지: 병합된 image가 있으면 표시 */}
                      <ImageOrBlank
                        src={filteredArticles[0].image}
                        alt={filteredArticles[0].title || 'main'}
                        className="news-main-img"
                        onError={imgOnError}
                      />

                      <div>
                        <h3 className="news-main-title">
                          {filteredArticles[0].title || '제목 없음'}
                        </h3>
                        <div className="news-main-reporter">
                          {filteredArticles[0].reporter || myReporterName}
                        </div>
                        <div className="news-main-views">
                          {viewsText(filteredArticles[0].views)}
                        </div>
                        <div className="tag-list">
                          {(filteredArticles[0].tags || ['속보', 'KBO'])
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
                  {filteredArticles.slice(1, 7).map((item) => (
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
              items={(sortedArticles || []).slice(0, 6)}
              emptyText="아직 저장된 기사가 없어요."
              renderItem={(a) => (
                <li key={a.id || a.title} className="saved-item">
                  <Link to={`/platform/article/${a.id || 0}`} className="saved-link">
                    <span className="dot" /> {cut(a.title || '제목 없음', 36)}
                  </Link>
                </li>
              )}
            />

            {/* 인기 기사 */}
            <SideCard
              title="인기 기사"
              items={sortedArticles.slice(0, 5)}
              emptyText="인기 기사가 없어요."
              renderItem={(a, idx) => (
                <li key={a.id || a.title} className="popular-side-item">
                  <Link to={`/platform/article/${a.id || 0}`} className="popular-side-link">
                    <span className="popular-rank-small">{idx + 1}</span>
                    <div className="popular-side-content">
                      <div className="popular-side-title">{cut(a.title || '제목 없음', 30)}</div>
                      <div className="popular-side-meta">
                        <span>{viewsText(a.views)}</span>
                        <span>{a.reporter || '기자 미상'}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              )}
            />

            {/* 카테고리별 기사 수 */}
            {categories.length > 0 && (
              <SideCard
                title="카테고리"
                items={categories.slice(0, 8)}
                emptyText="카테고리가 없어요."
                renderItem={(cat) => {
                  const count = sortedArticles.filter((a) => (a.tags || []).includes(cat)).length;
                  return (
                    <li key={cat} className="category-side-item">
                      <button
                        className={`category-side-link ${selectedCategory === cat ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat)}
                      >
                        <span className="category-name">{cat}</span>
                        <span className="category-count">{count}</span>
                      </button>
                    </li>
                  );
                }}
              />
            )}

            {/* 팀별 기사 수 */}
            {teamStats.length > 0 && (
              <SideCard
                title="팀별 기사"
                items={teamStats.slice(0, 6)}
                emptyText="팀별 기사가 없어요."
                renderItem={({ team, count }) => (
                  <li key={team} className="team-side-item">
                    <button
                      className={`team-side-link ${selectedTeam === team ? 'active' : ''}`}
                      onClick={() => setSelectedTeam(team)}
                    >
                      <span className="team-name-side">{team}</span>
                      <span className="team-count">{count}</span>
                    </button>
                  </li>
                )}
              />
            )}
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
              : title === '인기 기사'
                ? 'popular-side-list'
                : 'saved-list'
        }
      >
        {items.length ? items.map((item, idx) => renderItem(item, idx)) : <li className="saved-empty">{emptyText}</li>}
      </ul>
    </section>
  );
}
