// src/pages/Platform.jsx
import React, { useState, useEffect } from 'react';
import '../styles/Platform.css';
import { Link } from 'react-router-dom';

export default function Platform() {
  const scheduleTabs = ['주요 경기', 'KBO', '야구 기타'];
  const itemsPerSlide = 4;
  const [slideIndex, setSlideIndex] = useState(0);
  const [savedArticles, setSavedArticles] = useState([]);

  const matchList = [
    {
      status: 'LIVE', league: 'KBO', homeTeam: 'LG', homeScore: 3, awayTeam: 'KIA', awayScore: 2,
      homeLogo: '/LG.png', awayLogo: '/KIA.png'
    },
    {
      status: '15:00 예정', league: 'KBO', homeTeam: 'KT', homeScore: 0, awayTeam: 'NC', awayScore: 0,
      homeLogo: '/KT.png', awayLogo: '/NC.png'
    },
    {
      status: '종료', league: 'KBO', homeTeam: 'SSG', homeScore: 4, awayTeam: '두산', awayScore: 5,
      homeLogo: '/SSG.png', awayLogo: '/DOOSAN.png'
    },
    {
      status: '18:00 예정', league: 'KBO', homeTeam: '삼성', homeScore: 0, awayTeam: '한화', awayScore: 0,
      homeLogo: '/SAMSUNG.png', awayLogo: '/HANWHA.png'
    },
    {
      status: '종료', league: 'KBO', homeTeam: '키움', homeScore: 1, awayTeam: '롯데', awayScore: 2,
      homeLogo: '/KIWOOM.png', awayLogo: '/LOTTE.png'
    }
  ];

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('saved_files') || '[]');
    setSavedArticles(stored);
  }, []);

  const sortedArticles = [...savedArticles].sort((a, b) => (b.views || 0) - (a.views || 0));

  const getStatusColor = (status) => {
    if (status === 'LIVE') return '#E60000';
    if (status.includes('예정')) return '#3283FD';
    return '#757575';
  };

  const totalSlides = Math.ceil(matchList.length / itemsPerSlide);
  const visibleMatches = matchList.slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide);

  const nextSlide = () => setSlideIndex((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setSlideIndex((prev) => (prev - 1 + totalSlides) % totalSlides);

  return (
    <div className="platform-wrapper">
      {/* 상단 슬라이드 */}
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

      {/* 하단 뉴스 */}
      <div className="news-section">
        <h2>야구 <span className="highlight">NOW</span></h2>

        {/* 메인 기사 (조회수 1위) */}
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

        {/* 서브 기사 */}
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
  );
}
