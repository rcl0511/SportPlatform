// src/pages/Dashboard.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../styles/Dashboard.css';
import { useNavigate } from 'react-router-dom';
import ViewsChart from '../components/ViewsChart';
import { articleAPI } from '../utils/api';

const Dashboard = () => {
  const [reports, setReports] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [kboSchedule, setKboSchedule] = useState([]);
  
  // 초기 샘플 경기 데이터
  const getInitialTodayGames = () => {
    const today = new Date().toISOString().slice(0, 10);
    return [
      {
        id: 'sample-1',
        dateText: today,
        timeText: '18:30',
        playText: 'LG 트윈스 vs 기아 타이거즈',
        stadium: '잠실야구장',
        dateObj: new Date(today),
        home: 'LG 트윈스',
        away: '기아 타이거즈',
      },
      {
        id: 'sample-2',
        dateText: today,
        timeText: '18:30',
        playText: 'SSG 랜더스 vs NC 다이노스',
        stadium: '인천SSG랜더스필드',
        dateObj: new Date(today),
        home: 'SSG 랜더스',
        away: 'NC 다이노스',
      },
      {
        id: 'sample-3',
        dateText: today,
        timeText: '18:30',
        playText: '두산 베어스 vs 한화 이글스',
        stadium: '잠실야구장',
        dateObj: new Date(today),
        home: '두산 베어스',
        away: '한화 이글스',
      },
    ];
  };
  
  const [todayGames, setTodayGames] = useState(getInitialTodayGames());
  const [liveGames, setLiveGames] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filter, setFilter] = useState('7days');
  const [chartData, setChartData] = useState([]);
  const [q, setQ] = useState('');
  const [activeTeams, setActiveTeams] = useState([]);
  const [favoriteTeams, setFavoriteTeams] = useState([]);
  const [articleStatus, setArticleStatus] = useState('all'); // all, draft, review, published
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingArticle, setEditingArticle] = useState(null);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [selectedReporter, setSelectedReporter] = useState('all');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
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

  // KBO 일정 데이터 로드 (백엔드 API 우선, 실패 시 S3, 최종 fallback은 localStorage)
  useEffect(() => {
    async function loadKboSchedule() {
      const API_BASE = process.env.REACT_APP_API_BASE || 'https://api.jolpai-backend.shop';
      
      // 1순위: 백엔드 API에서 KBO 스크래핑
      try {
        const apiRes = await fetch(`${API_BASE}/api/kbo-schedule`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (apiData.success && apiData.games && apiData.games.length > 0) {
            const games = apiData.games;
            
            const normalized = games.map((g, i) => ({
              id: i,
              dateText: g.dateText || g.date || "",
              timeText: g.timeText || g.time || "",
              playText: g.playText || g.play || `${g.home || ''} vs ${g.away || ''}`,
              stadium: g.stadium || "",
              dateObj: g.date ? new Date(g.date) : null,
              home: g.home || '',
              away: g.away || '',
            })).filter((g) => g.dateObj);
            
            setKboSchedule(normalized);
            
            // 오늘 경기 필터링
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
            const toKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
            
            const todayMatches = normalized.filter((g) => {
              const key = toKey(g.dateObj);
              return key === todayStr;
            });
            
            // 샘플 데이터 제거하고 실제 데이터로 교체
            if (todayMatches.length > 0) {
              setTodayGames((prev) => {
                const realGames = prev.filter((g) => !g.id?.startsWith('sample-'));
                const existingIds = new Set(realGames.map((g) => g.id));
                const newGames = todayMatches.filter((g) => !existingIds.has(g.id));
                return [...realGames, ...newGames];
              });
            } else {
              // 오늘 경기가 없으면 샘플 데이터도 제거
              setTodayGames([]);
            }
            
            // 진행 중인 경기
            const now = new Date();
            const live = todayMatches.filter((g) => {
              const timeMatch = g.timeText.match(/(\d{2}):(\d{2})/);
              if (!timeMatch) return false;
              const gameTime = new Date(g.dateObj);
              gameTime.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
              const gameEnd = new Date(gameTime);
              gameEnd.setHours(gameEnd.getHours() + 3);
              return now >= gameTime && now <= gameEnd;
            });
            setLiveGames(live);
            
            return; // 성공하면 여기서 종료
          } else {
            // 백엔드 API는 성공했지만 게임 데이터가 없는 경우
            console.warn('백엔드 API 응답에 게임 데이터가 없음:', apiData);
            if (apiData.error) {
              console.error('   오류 상세:', apiData.error);
            }
            setKboSchedule([]);
            setTodayGames([]);
            setLiveGames([]);
          }
        } else {
          // 백엔드 API 응답 실패
          console.warn(`백엔드 API 응답 실패: ${apiRes.status} ${apiRes.statusText}`);
          setKboSchedule([]);
          setTodayGames([]);
          setLiveGames([]);
        }
      } catch (apiErr) {
        console.warn('백엔드 API 호출 실패:', apiErr);
        setKboSchedule([]);
        setTodayGames([]);
        setLiveGames([]);
      }
      
      // 최종 fallback: localStorage의 recentGames에서 오늘 경기 추출
      try {
        // localStorage의 recentGames에서 오늘 경기 추출
        const storedGames = JSON.parse(localStorage.getItem('recentGames') || '[]');
        const today = new Date().toISOString().slice(0, 10);
        
        const todayFromStorage = storedGames
          .filter((g) => g.date === today)
          .map((g) => ({
            id: g.id || Date.now(),
            dateText: g.date || today,
            timeText: g.time || '18:00',
            playText: `${g.home || ''} vs ${g.away || ''}`,
            stadium: g.stadium || '경기장',
            dateObj: new Date(g.date || today),
            home: g.home || '',
            away: g.away || '',
          }));
        
        if (todayFromStorage.length > 0) {
          // 샘플 데이터 제거하고 실제 데이터로 교체
          setTodayGames((prev) => {
            const realGames = prev.filter((g) => !g.id?.startsWith('sample-'));
            const existingIds = new Set(realGames.map((g) => g.id));
            const newGames = todayFromStorage.filter((g) => !existingIds.has(g.id));
            return [...realGames, ...newGames];
          });
        } else {
          // 실제 데이터가 없으면 샘플 데이터도 제거
          setTodayGames([]);
        }
      } catch (err) {
        // localStorage 읽기 실패 시 무시
      }
    }

    loadKboSchedule();
  }, []);

  useEffect(() => {
    async function loadArticles() {
      try {
        const result = await articleAPI.getArticles();
        const articles = result.articles || result || [];
        let mutated = false;
        const normalized = articles.map((a) => {
          if (!a.id) {
            mutated = true;
            return { ...a, id: Date.now() + Math.floor(Math.random() * 1000) };
          }
          return a;
        });
        const withDates = normalized.map((r) => ({
          ...r,
          date: r.date
            ? r.date
            : (r.createdAt || r.timestamp)
            ? new Date(r.createdAt || r.timestamp).toISOString().slice(0, 10)
            : new Date().toISOString().slice(0, 10),
          views: r.views ?? 1,
          team: r.team || r.tag || '',
          status: r.status || 'draft',
          scheduledPublishDate: r.scheduledPublishDate || null,
          reviewer: r.reviewer || null,
          comments: r.comments || [],
          reporter: r.reporter || '기자 미상',
        }));
        setReports(withDates);
        
        // localStorage 동기화 (fallback용)
        if (!result.fromCache) {
          localStorage.setItem('saved_files', JSON.stringify(normalized));
        }
      } catch (error) {
        console.error('기사 목록 로드 실패:', error);
        // Fallback: localStorage 사용
        const stored = JSON.parse(localStorage.getItem('saved_files') || '[]');
        let mutated = false;
        const normalized = stored.map((a) => {
          if (!a.id) {
            mutated = true;
            return { ...a, id: Date.now() + Math.floor(Math.random() * 1000) };
          }
          return a;
        });
        const withDates = normalized.map((r) => ({
          ...r,
          date: r.date
            ? r.date
            : (r.createdAt || r.timestamp)
            ? new Date(r.createdAt || r.timestamp).toISOString().slice(0, 10)
            : new Date().toISOString().slice(0, 10),
          views: r.views ?? 1,
          team: r.team || r.tag || '',
          status: r.status || 'draft',
          scheduledPublishDate: r.scheduledPublishDate || null,
          reviewer: r.reviewer || null,
          comments: r.comments || [],
          reporter: r.reporter || '기자 미상',
        }));
        if (mutated) {
          localStorage.setItem('saved_files', JSON.stringify(normalized));
        }
        setReports(withDates);
      }
    }
    
    loadArticles();

    const storedGames = JSON.parse(localStorage.getItem('recentGames') || '[]');
    if (storedGames.length) {
      setRecentGames(storedGames);
    }

    setFavoriteTeams(JSON.parse(localStorage.getItem('favoriteTeams') || '[]'));
  }, []);

  // recentGames가 로드되면 오늘 경기 업데이트
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    
    // localStorage에서 오늘 경기 찾기
    const todayFromStorage = recentGames.filter((g) => g.date === today);
    
    if (todayFromStorage.length > 0) {
      const formatted = todayFromStorage.map((g, idx) => ({
        id: g.id || `today-${idx}-${Date.now()}`,
        dateText: g.date || today,
        timeText: g.time || '18:00',
        playText: `${g.home || ''} vs ${g.away || ''}`,
        stadium: g.stadium || '경기장',
        dateObj: new Date(g.date || today),
        home: g.home || '',
        away: g.away || '',
      }));
      
      // 샘플 데이터 제거하고 실제 데이터로 교체
      setTodayGames((prev) => {
        const realGames = prev.filter((g) => !g.id?.startsWith('sample-'));
        const existingIds = new Set(realGames.map((g) => g.id));
        const newGames = formatted.filter((g) => !existingIds.has(g.id));
        return [...realGames, ...newGames];
      });
    }
  }, [recentGames]);

  // recentGames나 KBO 일정에서 실제 데이터가 로드되면 샘플 데이터 대체
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const hasRealData = recentGames.some((g) => g.date === today) || 
                        kboSchedule.some((g) => {
                          const key = `${g.dateObj.getFullYear()}-${g.dateObj.getMonth() + 1}-${g.dateObj.getDate()}`;
                          return key === today;
                        });
    
    // 실제 데이터가 있고 현재 샘플 데이터만 있으면 교체
    if (hasRealData && todayGames.some((g) => g.id?.startsWith('sample-'))) {
      // 실제 데이터로 교체 (다른 useEffect에서 처리됨)
      return;
    }
  }, [recentGames, kboSchedule, todayGames]);

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
    let filtered = reports;
    
    // 상태 필터
    if (articleStatus !== 'all') {
      filtered = filtered.filter((r) => {
        const status = r.status || 'draft';
        return status === articleStatus;
      });
    }
    
    // 카테고리 필터
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((r) => {
        const tags = Array.isArray(r.tags) ? r.tags : [];
        return tags.includes(selectedCategory);
      });
    }
    
    // 팀 필터
    if (activeTeams.length > 0) {
      filtered = filtered.filter((r) => activeTeams.includes(r.team));
    }
    
    // 검색어 필터
    const kw = (q || '').trim().toLowerCase();
    if (kw) {
      filtered = filtered.filter(
        (r) =>
          (r.title || '').toLowerCase().includes(kw) ||
          (r.content || '').toLowerCase().includes(kw) ||
          (r.team || '').toLowerCase().includes(kw) ||
          (r.reporter || '').toLowerCase().includes(kw)
      );
    }
    
    return filtered;
  }, [reports, q, activeTeams, articleStatus, selectedCategory]);
  
  // 카테고리 목록 추출
  const categories = useMemo(() => {
    const catSet = new Set();
    reports.forEach((r) => {
      if (Array.isArray(r.tags)) {
        r.tags.forEach((tag) => catSet.add(tag));
      }
    });
    return Array.from(catSet).sort();
  }, [reports]);
  
  // 기사 상태별 통계
  const statusStats = useMemo(() => {
    const stats = {
      draft: 0,
      review: 0,
      published: 0,
      archived: 0,
    };
    reports.forEach((r) => {
      const status = r.status || 'draft';
      stats[status] = (stats[status] || 0) + 1;
    });
    return stats;
  }, [reports]);

  // 기자별 통계
  const reporterStats = useMemo(() => {
    const statsMap = {};
    reports.forEach((r) => {
      const reporter = r.reporter || '기자 미상';
      if (!statsMap[reporter]) {
        statsMap[reporter] = {
          name: reporter,
          totalArticles: 0,
          totalViews: 0,
          publishedArticles: 0,
          avgViews: 0,
        };
      }
      statsMap[reporter].totalArticles++;
      statsMap[reporter].totalViews += r.views || 0;
      if (r.status === 'published') {
        statsMap[reporter].publishedArticles++;
      }
    });
    
    // 평균 조회수 계산
    Object.values(statsMap).forEach((stat) => {
      stat.avgViews = stat.totalArticles > 0 
        ? Math.round(stat.totalViews / stat.totalArticles) 
        : 0;
    });
    
    return Object.values(statsMap).sort((a, b) => b.totalViews - a.totalViews);
  }, [reports]);

  // 이미지 갤러리 데이터
  const imageGallery = useMemo(() => {
    const images = [];
    reports.forEach((r) => {
      if (r.image) {
        images.push({
          id: r.id,
          url: r.image,
          title: r.title,
          date: r.date,
          reporter: r.reporter,
        });
      }
      // article:<id>에서도 이미지 가져오기
      try {
        const detail = JSON.parse(localStorage.getItem(`article:${r.id}`) || 'null');
        if (detail && detail.image && !images.find((img) => img.url === detail.image)) {
          images.push({
            id: r.id,
            url: detail.image,
            title: r.title,
            date: r.date,
            reporter: r.reporter,
          });
        }
      } catch {}
    });
    return images;
  }, [reports]);

  // 예약 발행 기사
  const scheduledArticles = useMemo(() => {
    return reports
      .filter((r) => r.scheduledPublishDate && r.status !== 'published')
      .sort((a, b) => {
        const dateA = new Date(a.scheduledPublishDate);
        const dateB = new Date(b.scheduledPublishDate);
        return dateA - dateB;
      });
  }, [reports]);

  // 기사 상태 변경 핸들러
  const handleStatusChange = async (articleId, newStatus) => {
    try {
      await articleAPI.updateArticleStatus(articleId, newStatus);
      const updated = reports.map((r) =>
        r.id === articleId ? { ...r, status: newStatus } : r
      );
      setReports(updated);
      localStorage.setItem('saved_files', JSON.stringify(updated));
    } catch (error) {
      console.error('상태 변경 실패:', error);
      // Fallback: localStorage 업데이트
      const updated = reports.map((r) =>
        r.id === articleId ? { ...r, status: newStatus } : r
      );
      setReports(updated);
      localStorage.setItem('saved_files', JSON.stringify(updated));
    }
  };

  // 기사 삭제 핸들러
  const handleDeleteArticle = async (articleId) => {
    if (window.confirm('정말 이 기사를 삭제하시겠습니까?')) {
      try {
        await articleAPI.deleteArticle(articleId);
        const updated = reports.filter((r) => r.id !== articleId);
        setReports(updated);
        // localStorage 동기화
        localStorage.setItem('saved_files', JSON.stringify(updated));
        localStorage.removeItem(`article:${articleId}`);
      } catch (error) {
        console.error('기사 삭제 실패:', error);
        // Fallback: localStorage에서 삭제
        const updated = reports.filter((r) => r.id !== articleId);
        setReports(updated);
        localStorage.setItem('saved_files', JSON.stringify(updated));
        localStorage.removeItem(`article:${articleId}`);
      }
    }
  };

  // 기사 편집 핸들러
  const handleEditArticle = (article) => {
    localStorage.setItem('edit_subject', article.title || '');
    localStorage.setItem('edit_content', article.content || article.fullContent || '');
    localStorage.setItem('editing_article_id', article.id);
    navigate('/edit3');
  };

  // 예약 발행 설정 핸들러
  const handleSchedulePublish = (articleId) => {
    if (!scheduleDate || !scheduleTime) {
      alert('날짜와 시간을 모두 입력해주세요.');
      return;
    }
    
    const scheduledDateTime = `${scheduleDate}T${scheduleTime}:00`;
    const updated = reports.map((r) =>
      r.id === articleId 
        ? { ...r, scheduledPublishDate: scheduledDateTime } 
        : r
    );
    setReports(updated);
    localStorage.setItem('saved_files', JSON.stringify(updated));
    setShowScheduleModal(false);
    setScheduleDate('');
    setScheduleTime('');
  };

  // 리뷰어 할당 핸들러
  const handleAssignReviewer = (articleId, reviewerName) => {
    const updated = reports.map((r) =>
      r.id === articleId 
        ? { ...r, reviewer: reviewerName, status: 'review' } 
        : r
    );
    setReports(updated);
    localStorage.setItem('saved_files', JSON.stringify(updated));
  };

  // 댓글 추가 핸들러
  const handleAddComment = (articleId, commentText, author) => {
    const updated = reports.map((r) => {
      if (r.id === articleId) {
        const comments = r.comments || [];
        return {
          ...r,
          comments: [...comments, {
            id: Date.now(),
            text: commentText,
            author: author || '익명',
            date: new Date().toISOString(),
          }],
        };
      }
      return r;
    });
    setReports(updated);
    localStorage.setItem('saved_files', JSON.stringify(updated));
  };

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
      { key: 'total', label: '전체 기사', value: total, icon: null },
      { key: 'week', label: '이번 주 작성', value: thisWeek, icon: null },
      { key: 'views', label: '최근 7일 조회', value: last7Views, icon: null },
      { key: 'avg', label: '평균 조회/기사', value: avg, icon: null },
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
    const fromRecent = recentGames
      .filter((g) => g.date >= today)
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .slice(0, 5);
    
    // KBO 일정과 병합
    const fromKbo = kboSchedule
      .filter((g) => {
        const key = `${g.dateObj.getFullYear()}-${g.dateObj.getMonth() + 1}-${g.dateObj.getDate()}`;
        return key >= today;
      })
      .sort((a, b) => a.dateObj - b.dateObj)
      .slice(0, 5)
      .map((g) => {
        const teams = g.playText.match(/([가-힣A-Z\s]+)\s+vs\s+([가-힣A-Z\s]+)/);
        return {
          date: `${g.dateObj.getFullYear()}-${String(g.dateObj.getMonth() + 1).padStart(2, '0')}-${String(g.dateObj.getDate()).padStart(2, '0')}`,
          home: teams ? teams[1].trim() : '',
          away: teams ? teams[2].trim() : '',
          time: g.timeText,
          stadium: g.stadium,
        };
      });
    
    return [...fromKbo, ...fromRecent].slice(0, 5);
  }, [recentGames, kboSchedule]);

  // 인기 기사 (조회수 기준)
  const popularArticles = useMemo(() => {
    return [...reports]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);
  }, [reports]);

  // 경기에서 팀명 추출
  const extractTeams = (playText) => {
    const match = playText.match(/([가-힣A-Z\s]+)\s+vs\s+([가-힣A-Z\s]+)/);
    if (match) {
      return { home: match[1].trim(), away: match[2].trim() };
    }
    return { home: '', away: '' };
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-main">
        <div className="dash-header">
          <div>
            <h2>스포츠 플랫폼 대시보드</h2>
            <p className="dash-subtitle">KBO 리그 실시간 정보 및 기사 관리</p>
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

        {/* 실시간 경기 스코어 */}
        {liveGames.length > 0 && (
          <div className="live-games-card card">
            <div className="live-header">
              <h3>LIVE 경기</h3>
              <span className="live-badge">진행중</span>
            </div>
            <div className="live-games-grid">
              {liveGames.map((game, idx) => {
                const teams = extractTeams(game.playText);
                return (
                  <div key={idx} className="live-game-item">
                    <div className="live-game-teams">
                      <div className="live-team">
                        <img src={getLogo(teams.home)} alt={teams.home} className="team-logo-sm" />
                        <span>{teams.home}</span>
                      </div>
                      <span className="live-vs">VS</span>
                      <div className="live-team">
                        <img src={getLogo(teams.away)} alt={teams.away} className="team-logo-sm" />
                        <span>{teams.away}</span>
                      </div>
                    </div>
                    <div className="live-game-info">
                      <span className="live-time">{game.timeText}</span>
                      <span className="live-stadium">{game.stadium}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 오늘의 경기 */}
        {todayGames.length > 0 && (
          <div className="today-games-card card">
            <h3>오늘의 경기 ({todayGames.length}경기)</h3>
            <div className="today-games-grid">
              {todayGames.map((game, idx) => {
                // playText에서 추출하거나 직접 home/away 사용
                let home = game.home || '';
                let away = game.away || '';
                
                if (!home || !away) {
                  const teams = extractTeams(game.playText);
                  home = teams.home || home;
                  away = teams.away || away;
                }
                
                return (
                  <div key={game.id || idx} className="today-game-item">
                    <div className="game-time">{game.timeText || '18:00'}</div>
                    <div className="game-teams">
                      <div className="game-team">
                        <img src={getLogo(home)} alt={home} className="team-logo-sm" />
                        <span>{home || '홈팀'}</span>
                      </div>
                      <span className="game-vs">VS</span>
                      <div className="game-team">
                        <img src={getLogo(away)} alt={away} className="team-logo-sm" />
                        <span>{away || '원정팀'}</span>
                      </div>
                    </div>
                    <div className="game-stadium">{game.stadium || '경기장'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* 오늘 경기가 없을 때 안내 */}
        {todayGames.length === 0 && (
          <div className="today-games-card card">
            <h3>오늘의 경기</h3>
            <div className="no-games-message">
              <p>오늘 예정된 경기가 없습니다.</p>
              <p className="help-text">경기 일정을 추가하려면 경기 일정 입력 기능을 사용하세요.</p>
            </div>
          </div>
        )}

        {/* 기자별 통계 */}
        {reporterStats.length > 0 && (
          <div className="reporter-stats-card card">
            <h3>기자별 통계</h3>
            <div className="reporter-stats-grid">
              {reporterStats.slice(0, 5).map((stat, idx) => (
                <div key={stat.name} className="reporter-stat-item">
                  <div className="reporter-name">{stat.name}</div>
                  <div className="reporter-metrics">
                    <div className="metric">
                      <span className="metric-label">기사 수</span>
                      <span className="metric-value">{stat.totalArticles}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">발행</span>
                      <span className="metric-value">{stat.publishedArticles}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">총 조회</span>
                      <span className="metric-value">{stat.totalViews.toLocaleString()}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">평균 조회</span>
                      <span className="metric-value">{stat.avgViews}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 예약 발행 기사 */}
        {scheduledArticles.length > 0 && (
          <div className="scheduled-articles-card card">
            <h3>예약 발행 기사 ({scheduledArticles.length}개)</h3>
            <div className="scheduled-list">
              {scheduledArticles.map((article) => (
                <div key={article.id} className="scheduled-item">
                  <div className="scheduled-info">
                    <div className="scheduled-title">{article.title || '제목 없음'}</div>
                    <div className="scheduled-date">
                      {new Date(article.scheduledPublishDate).toLocaleString('ko-KR')}
                    </div>
                  </div>
                  <div className="scheduled-actions">
                    <button
                      className="btn-small"
                      onClick={() => handleStatusChange(article.id, 'published')}
                    >
                      지금 발행
                    </button>
                    <button
                      className="btn-small ghost"
                      onClick={() => {
                        const updated = reports.map((r) =>
                          r.id === article.id ? { ...r, scheduledPublishDate: null } : r
                        );
                        setReports(updated);
                        localStorage.setItem('saved_files', JSON.stringify(updated));
                      }}
                    >
                      취소
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 인기 기사 */}
        {popularArticles.length > 0 && (
          <div className="popular-articles-card card">
            <h3>인기 기사</h3>
            <div className="popular-articles-list">
              {popularArticles.map((article, idx) => (
                <div
                  key={article.id || idx}
                  className="popular-article-item"
                >
                  <div className="popular-rank">{idx + 1}</div>
                  <div 
                    className="popular-content"
                    onClick={() => {
                      if (article.id) {
                        navigate(`/platform/article/${article.id}`);
                      } else {
                        localStorage.setItem('edit_subject', article.title || '');
                        localStorage.setItem('edit_content', article.content || '');
                        navigate('/result');
                      }
                    }}
                  >
                    <div className="popular-title">{article.title || '제목 없음'}</div>
                    <div className="popular-meta">
                      <span className="popular-team">{article.team || '전체'}</span>
                      <span className="popular-views">조회 {article.views || 0}</span>
                    </div>
                  </div>
                  <div className="article-actions">
                    <select
                      className="status-select"
                      value={article.status || 'draft'}
                      onChange={(e) => handleStatusChange(article.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="draft">초안</option>
                      <option value="review">검토중</option>
                      <option value="published">발행됨</option>
                      <option value="archived">보관됨</option>
                    </select>
                    <button
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditArticle(article);
                      }}
                      title="편집"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteArticle(article.id);
                      }}
                      title="삭제"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 이미지 갤러리 */}
        {imageGallery.length > 0 && (
          <div className="image-gallery-card card">
            <div className="gallery-header">
              <h3>이미지 갤러리 ({imageGallery.length}개)</h3>
              <button
                className="ghost"
                onClick={() => setShowImageGallery(!showImageGallery)}
              >
                {showImageGallery ? '접기' : '펼치기'}
              </button>
            </div>
            {showImageGallery && (
              <div className="image-gallery-grid">
                {imageGallery.map((img) => (
                  <div key={img.id} className="gallery-item">
                    <img src={img.url} alt={img.title} />
                    <div className="gallery-overlay">
                      <div className="gallery-title">{img.title}</div>
                      <div className="gallery-meta">
                        <span>{img.reporter}</span>
                        <span>{img.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 기사 상태 필터 */}
        <div className="status-filter-card card">
          <h3>기사 상태</h3>
          <div className="status-buttons">
            <button
              className={`status-btn ${articleStatus === 'all' ? 'active' : ''}`}
              onClick={() => setArticleStatus('all')}
            >
              전체 ({reports.length})
            </button>
            <button
              className={`status-btn ${articleStatus === 'draft' ? 'active' : ''}`}
              onClick={() => setArticleStatus('draft')}
            >
              초안 ({statusStats.draft})
            </button>
            <button
              className={`status-btn ${articleStatus === 'review' ? 'active' : ''}`}
              onClick={() => setArticleStatus('review')}
            >
              검토중 ({statusStats.review})
            </button>
            <button
              className={`status-btn ${articleStatus === 'published' ? 'active' : ''}`}
              onClick={() => setArticleStatus('published')}
            >
              발행됨 ({statusStats.published})
            </button>
          </div>
        </div>

        {/* 카테고리 필터 */}
        {categories.length > 0 && (
          <div className="category-filter-card card">
            <h3>카테고리</h3>
            <div className="category-buttons">
              <button
                className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                전체
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

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
                즐겨찾기
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

        {/* 검색 결과 */}
        {q && filteredReports.length > 0 && (
          <div className="search-results-card card">
            <div className="sr-head">
              <h3>검색 결과</h3>
              <div className="sr-controls">
                <span className="sr-count">{filteredReports.length}개 기사</span>
              </div>
            </div>
            <div className="search-row">
              {filteredReports.slice(0, 10).map((article) => (
                <div key={article.id} className="sr-card">
                  <div
                    className="sr-card-content"
                    onClick={() => {
                      if (article.id) {
                        navigate(`/platform/article/${article.id}`);
                      } else {
                        localStorage.setItem('edit_subject', article.title || '');
                        localStorage.setItem('edit_content', article.content || '');
                        navigate('/result');
                      }
                    }}
                  >
                    <div className="sr-card-top">
                      <span className="sr-chip">{article.team || '전체'}</span>
                      <span className="sr-date">{article.date || ''}</span>
                    </div>
                    <h4 className="sr-title">{article.title || '제목 없음'}</h4>
                    <p className={`sr-snippet ${!article.content ? 'sr-empty' : ''}`}>
                      {article.content ? article.content.slice(0, 100) + '...' : '내용 없음'}
                    </p>
                    <div className="sr-foot">
                      <span className="sr-views">조회 {article.views || 0}</span>
                      <span className="sr-status">{article.status === 'draft' ? '초안' : article.status === 'review' ? '검토중' : article.status === 'published' ? '발행됨' : '보관됨'}</span>
                    </div>
                  </div>
                  <div className="sr-card-actions" onClick={(e) => e.stopPropagation()}>
                    <select
                      className="status-select-small"
                      value={article.status || 'draft'}
                      onChange={(e) => handleStatusChange(article.id, e.target.value)}
                    >
                      <option value="draft">초안</option>
                      <option value="review">검토중</option>
                      <option value="published">발행됨</option>
                      <option value="archived">보관됨</option>
                    </select>
                    <button
                      className="btn-icon-small"
                      onClick={() => {
                        setScheduleDate(article.date || new Date().toISOString().slice(0, 10));
                        setScheduleTime('09:00');
                        setEditingArticle(article);
                        setShowScheduleModal(true);
                      }}
                      title="예약 발행"
                    >
                      📅
                    </button>
                    <button
                      className="btn-icon-small"
                      onClick={() => handleEditArticle(article)}
                      title="편집"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon-small"
                      onClick={() => handleDeleteArticle(article.id)}
                      title="삭제"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* 예약 발행 모달 */}
        {showScheduleModal && editingArticle && (
          <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>예약 발행 설정</h3>
              <div className="modal-form">
                <div className="form-group">
                  <label>기사 제목</label>
                  <input type="text" value={editingArticle.title || ''} readOnly />
                </div>
                <div className="form-group">
                  <label>발행 날짜</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                  />
                </div>
                <div className="form-group">
                  <label>발행 시간</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
                <div className="modal-actions">
                  <button
                    className="primary"
                    onClick={() => handleSchedulePublish(editingArticle.id)}
                  >
                    예약 설정
                  </button>
                  <button
                    className="ghost"
                    onClick={() => {
                      setShowScheduleModal(false);
                      setEditingArticle(null);
                      setScheduleDate('');
                      setScheduleTime('');
                    }}
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 협업 기능 - 리뷰어 할당 및 댓글 */}
        {filteredReports.length > 0 && articleStatus === 'review' && (
          <div className="collaboration-card card">
            <h3>검토 중인 기사</h3>
            <div className="review-articles-list">
              {filteredReports
                .filter((r) => r.status === 'review')
                .slice(0, 5)
                .map((article) => (
                  <div key={article.id} className="review-article-item">
                    <div className="review-article-header">
                      <div className="review-title">{article.title || '제목 없음'}</div>
                      <div className="review-meta">
                        <span>작성자: {article.reporter || '기자 미상'}</span>
                        {article.reviewer && <span>리뷰어: {article.reviewer}</span>}
                      </div>
                    </div>
                    {article.comments && article.comments.length > 0 && (
                      <div className="review-comments">
                        {article.comments.map((comment) => (
                          <div key={comment.id} className="comment-item">
                            <div className="comment-author">{comment.author}</div>
                            <div className="comment-text">{comment.text}</div>
                            <div className="comment-date">
                              {new Date(comment.date).toLocaleString('ko-KR')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="review-actions">
                      <input
                        type="text"
                        placeholder="리뷰어 이름 입력"
                        className="reviewer-input"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            handleAssignReviewer(article.id, e.target.value.trim());
                            e.target.value = '';
                          }
                        }}
                      />
                      <input
                        type="text"
                        placeholder="댓글 입력"
                        className="comment-input"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            handleAddComment(article.id, e.target.value.trim(), '현재 사용자');
                            e.target.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
