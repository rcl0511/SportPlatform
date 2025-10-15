// src/pages/Edit3.jsx
import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.js';
import '../styles/Edit3.css';

/* =========================================================
   🔧 CONFIG — 수기로 쉽게 토글 가능
   ========================================================= */
const CONFIG = {
  REPORT_ENDPOINT: 'https://api.jolpai-backend.shop/api/generate-report',
  //REPORT_ENDPOINT: '/api/generate-report',
  USE_CAPTION_AS_TITLE_FALLBACK: true,
  REGENERATE_ON_TITLE_SELECT: false, // 타이틀 클릭 시 본문 재생성까지 할지
  MAX_RETRIES: 1,
};
/* ======================================================= */

/** 모델 응답에 섞일 수 있는 특수 마커(<|...|>) 및 라벨 정리 */
const stripChatMarkers = (val) => {
  if (typeof val !== 'string') return val;
  const noMarkers = val.replace(/<\|[^|>]+?\|>/g, '');
  return noMarkers.replace(/^\s*(assistant:|user:)\s*/gi, '').trim();
};

/** ✅ 보기 좋은 이름 만들기 (camel + snake + username/email 대응) */
const getFullName = (u) => {
  if (!u) return '이름없음';
  const {
    name, displayName,               // 전체 이름
    firstName, lastName,             // camelCase
    first_name, last_name,           // snake_case
    username, email,
  } = u;

  // 1) 명시적 전체 이름
  if (name) return String(name).trim();
  if (displayName) return String(displayName).trim();

  // 2) firstName + lastName (띄어쓰기)
  const camel = [lastName, firstName].filter(Boolean).join(' ').trim();
  if (camel) return camel;

  // 3) first_name + last_name (붙여쓰기: 한국식)
  const snake = `${first_name || ''}${last_name || ''}`.trim();
  if (snake) return snake;

  // 4) username / email에서 사용자 친화적으로
  const idLike = username || email || '';
  if (idLike.includes('@')) return idLike.split('@')[0]; // 이메일이면 @ 앞만
  if (idLike) return idLike;

  return '이름없음';
};

/** 필요하면 빈 문자열이 더 안전할 때 사용하는 래퍼 */
const getDisplayName = (u) => {
  const n = getFullName(u);
  return n === '이름없음' ? '' : n;
};

const Edit3 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { topic: initialTopic, base64, fileName, reset } = location.state || {};
  const { userInfo } = useContext(AuthContext);

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [reportTags, setReportTags] = useState([]);
  const [reportCaptions, setReportCaptions] = useState({});
  const [today, setToday] = useState('');

  // 응답으로 받은 title 전체(3개) 표시/선택
  const [allTitles, setAllTitles] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState('');

  const hasGeneratedRef = useRef(false);

  // ✅ 사이드바: 0 ↔ 300px 토글
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarWidth = isSidebarOpen ? 300 : 0;

  // 이미지 설정
  const [imageUrl, setImageUrl] = useState(null);
  const [imagePosition, setImagePosition] = useState('top');
  const [imageWidth, setImageWidth] = useState(100);
  const [imageAlign, setImageAlign] = useState('center');
  const [imageMarginTop, setImageMarginTop] = useState(0);
  const [imageMarginLeft, setImageMarginLeft] = useState(0);

  const clearAllLocalForEdit = () => {
    [
      'edit_subject',
      'edit_content',
      'edit_tags',
      'edit_captions',
      'edit_image',
      'edit_image_position',
      'edit_image_width',
      'edit_image_align',
      'edit_image_marginTop',
      'edit_image_marginLeft',
    ].forEach((k) => localStorage.removeItem(k));
  };

  const generateReport = async (topicForReport, attempt = 0) => {
    if (!topicForReport) topicForReport = '스포츠 기사 작성';
    if (hasGeneratedRef.current && attempt === 0) return;
    hasGeneratedRef.current = true;

    setIsPageLoading(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('topic', topicForReport);

      if (base64 && fileName) {
        if (base64.startsWith('data:')) {
          const byteString = atob(base64.split(',')[1]);
          const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
          formData.append('file', new Blob([ab], { type: mimeString }), fileName);
        } else {
          formData.append('file', new Blob([base64], { type: 'text/csv' }), fileName);
        }
      }

      const res = await fetch(CONFIG.REPORT_ENDPOINT, { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);

      const raw = await res.json();

      // 🔹 title 배열/문자열 대응 + 마커 제거
      const incomingTitles = Array.isArray(raw.title)
        ? raw.title
        : (typeof raw.title === 'string' && raw.title.trim() ? [raw.title] : []);

      // 줄바꿈으로 3개가 올 수도 있으니 확장
      const expanded =
        incomingTitles.length === 1 && incomingTitles[0].includes('\n')
          ? incomingTitles[0].split('\n').map(s => s.trim()).filter(Boolean)
          : incomingTitles;

      const cleanTitles = expanded
        .map(t => stripChatMarkers(t || ''))
        .map(t => t.replace(/^[-•\s]+/, ''))
        .filter(Boolean);

      setAllTitles(cleanTitles);

      // 기본 적용할 제목: 1) 배열 첫 번째 → 2) 캡션 → 3) 토픽
      let nextTitle = cleanTitles[0] || '';
      if (!nextTitle && CONFIG.USE_CAPTION_AS_TITLE_FALLBACK) {
        const caps = raw.captions && typeof raw.captions === 'object' ? raw.captions : {};
        const capCandidates = Object.values(caps)
          .filter(v => typeof v === 'string' && v.trim())
          .map(v => stripChatMarkers(v));
        if (capCandidates.length) nextTitle = capCandidates[0];
      }
      if (!nextTitle) nextTitle = topicForReport;

      // 본문/태그/캡션 sanitize
      const nextContent = stripChatMarkers(raw.content || '');
      const nextTags = Array.isArray(raw.tags)
        ? raw.tags.map(t => stripChatMarkers(String(t)))
        : [];
      const nextCaptions = (raw.captions && typeof raw.captions === 'object')
        ? Object.fromEntries(
            Object.entries(raw.captions).map(([k, v]) => [k, stripChatMarkers(String(v || ''))])
          )
        : {};

      setReportTitle(nextTitle);
      setReportContent(nextContent);
      setReportTags(nextTags);
      setReportCaptions(nextCaptions);

      // localStorage 저장
      localStorage.setItem('edit_subject', nextTitle);
      localStorage.setItem('edit_content', nextContent);
      nextTags.length
        ? localStorage.setItem('edit_tags', JSON.stringify(nextTags))
        : localStorage.removeItem('edit_tags');
      Object.keys(nextCaptions).length
        ? localStorage.setItem('edit_captions', JSON.stringify(nextCaptions))
        : localStorage.removeItem('edit_captions');

    } catch (err) {
      console.error('보고서 생성 실패:', err);
      setErrorMsg('보고서 생성에 실패했습니다. 네트워크 또는 서버 상태를 확인하세요.');

      if (attempt < CONFIG.MAX_RETRIES) {
        hasGeneratedRef.current = false;
        return generateReport(topicForReport, attempt + 1);
      } else {
        hasGeneratedRef.current = false;
      }
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    );

    if (reset) clearAllLocalForEdit();

    const baseTopic = (initialTopic || '').trim();
    setReportTitle(baseTopic);

    // 이미지 관련 로컬값 초기화
    [
      'edit_image',
      'edit_image_position',
      'edit_image_width',
      'edit_image_align',
      'edit_image_marginTop',
      'edit_image_marginLeft',
    ].forEach((k) => localStorage.removeItem(k));

    generateReport(baseTopic);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const applySelectedTitle = async (title) => {
    setSelectedTitle(title);
    setReportTitle(title);
    localStorage.setItem('edit_subject', title);

    if (CONFIG.REGENERATE_ON_TITLE_SELECT) {
      hasGeneratedRef.current = false;
      localStorage.removeItem('edit_content');
      localStorage.removeItem('edit_tags');
      localStorage.removeItem('edit_captions');
      await generateReport(title);
    }
  };

  const onChangeTitle = (e) => {
    const v = e.target.value;
    setReportTitle(v);
    localStorage.setItem('edit_subject', v);
  };
  const onKeyDownTitle = (e) => {
    if (e.key === 'Enter') e.currentTarget.blur();
  };

  return (
    // ✅ 컨테이너에 CSS 변수로 사이드바 너비 전달 (네 CSS와 연동)
    <div className="editor-container" style={{ '--sidebar-w': `${sidebarWidth}px` }}>
      {/* 전체 로딩 오버레이 */}
      {isPageLoading && (
        <div className="loading-overlay">
          <div className="loading-box">
            <div className="spinner" />
            <div className="loading-text">기사를 생성하는 중입니다…</div>
          </div>
        </div>
      )}

      {/* 오류 안내 */}
      {!isPageLoading && errorMsg && (
        <div className="loading-overlay" style={{ background: 'rgba(255,255,255,.6)' }}>
          <div className="loading-box">
            <div className="loading-text" style={{ marginBottom: 8 }}>{errorMsg}</div>
            <button
              className="btn"
              onClick={() => generateReport(reportTitle || initialTopic || '스포츠 기사 작성')}
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {/* 유저 정보 */}
      <div className="user-info">
        <div className="row">
          <div className="col">작성자</div>
          <div className="col" style={{ textAlign: 'center' }}>부서</div>
          <div className="col" style={{ textAlign: 'right' }}>작성날짜</div>
        </div>
        <div className="row">
          <div className="col value">
            {/* ✅ 다양한 케이스에서 사람 이름을 자연스럽게 표기 */}
            {getFullName(userInfo)}
          </div>
          <div className="col value" style={{ textAlign: 'center' }}>
            {userInfo?.department || '부서없음'}
          </div>
          <div className="col value" style={{ textAlign: 'right' }}>
            {today}
          </div>
        </div>
      </div>

      {/* ===== 제목 추천 영역 (응답 title 3개, 기존 CSS 그대로 사용) ===== */}
      {allTitles.length > 0 && (
        <div className="title-recommendations">
          <h3>제목 추천</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {allTitles.map((t, idx) => (
              <button
                key={`${idx}-${t}`}
                className={`title-item ${selectedTitle === t ? 'selected' : ''}`}
                onClick={() => applySelectedTitle(t)}
                title={t}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className="main-content">
        {/* 🔹 제목 입력 가능 */}
        <input
          className="report-title-input"
          value={reportTitle}
          onChange={onChangeTitle}
          onKeyDown={onKeyDownTitle}
          placeholder="기사 제목을 입력하세요"
        />

        {/* 이미지 컨트롤 */}
        {imageUrl && (
          <div className="image-controls">
            <button className="btn" onClick={() => setImagePosition('top')}>위로</button>
            <button className="btn" onClick={() => setImagePosition('bottom')}>아래로</button>
            <label>크기:</label>
            <input
              type="range"
              min="10"
              max="100"
              value={imageWidth}
              onChange={(e) => setImageWidth(Number(e.target.value))}
            />
            <span>{imageWidth}%</span>
            <label style={{ marginLeft: 16 }}>정렬:</label>
            <select value={imageAlign} onChange={(e) => setImageAlign(e.target.value)}>
              <option value="left">왼쪽</option>
              <option value="center">가운데</option>
              <option value="right">오른쪽</option>
            </select>
            <label style={{ marginLeft: 16 }}>여백TOP(px):</label>
            <input
              type="number"
              value={imageMarginTop}
              onChange={(e) => setImageMarginTop(Number(e.target.value))}
              style={{ width: 60 }}
            />
            <label style={{ marginLeft: 8 }}>LEFT(px):</label>
            <input
              type="number"
              value={imageMarginLeft}
              onChange={(e) => setImageMarginLeft(Number(e.target.value))}
              style={{ width: 60 }}
            />
          </div>
        )}

        {/* 본문 */}
        <textarea
          className="report-textarea"
          rows={10}
          value={reportContent}
          onChange={(e) => setReportContent(e.target.value)}
          placeholder="내용을 입력하세요"
        />

        {/* 이미지 프리뷰 */}
        {imageUrl && ['top', 'bottom'].includes(imagePosition) && (
          <div
            className="image-wrapper"
            style={{ textAlign: imageAlign, marginTop: imageMarginTop, marginLeft: imageMarginLeft }}
          >
            <img src={imageUrl} alt="첨부" style={{ width: `${imageWidth}%` }} />
          </div>
        )}

        {/* ✅ 완료하기 버튼 — 여기서 saved_files에 기사(이미지 포함) 저장 */}
        <div className="bottom-buttons">
          <button
            className="btn"
            onClick={() => {
              // 1) 개별 편집 값 저장
              localStorage.setItem('edit_content', reportContent);
              localStorage.setItem('edit_subject', reportTitle);
              localStorage.setItem('edit_tags', JSON.stringify(reportTags));
              localStorage.setItem('edit_captions', JSON.stringify(reportCaptions));
              if (imageUrl) {
                localStorage.setItem('edit_image', imageUrl);
                localStorage.setItem('edit_image_position', imagePosition);
                localStorage.setItem('edit_image_width', String(imageWidth));
                localStorage.setItem('edit_image_align', imageAlign);
                localStorage.setItem('edit_image_marginTop', String(imageMarginTop));
                localStorage.setItem('edit_image_marginLeft', String(imageMarginLeft));
              }

              // 2) Platform이 읽는 saved_files에 기사 객체 푸시 (대표 이미지 포함)
              const article = {
                id: `art-${Date.now()}`,
                title: reportTitle || '제목 없음',
                // ✅ reporter에 full name 사용 (fallback: getDisplayName → '기자 미상')
                reporter:
                  getFullName(userInfo) ||
                  getDisplayName(userInfo) ||
                  '기자 미상',
                views: 1, // 초기 조회수
                image: imageUrl || null, // ✅ Platform 뉴스 카드에서 표시됨
                tags: Array.isArray(reportTags) && reportTags.length ? reportTags : ['KBO', '속보'],
                content: reportContent || '',
                createdAt: new Date().toISOString(),
              };
              try {
                const prev = JSON.parse(localStorage.getItem('saved_files') || '[]');
                const next = [article, ...(Array.isArray(prev) ? prev : [])];
                localStorage.setItem('saved_files', JSON.stringify(next));
              } catch {
                localStorage.setItem('saved_files', JSON.stringify([article]));
              }

              // 3) 이동 경로: Platform에서 바로 확인하려면 아래 주석 해제
              // navigate('/Platform');
              navigate('/Result');
            }}
          >
            완료하기
          </button>
        </div>
      </div>

      {/* 사이드바 */}
      <aside className="sidebar" style={{ width: sidebarWidth }}>
        <h3 className="sidebar-title">이미지 추가하기</h3>
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
        <label htmlFor="file-upload" className="file-button">파일 선택</label>
      </aside>

      {/* 토글 버튼 */}
      <div
        className="sidebar-toggle"
        style={{ right: `calc(var(--sidebar-w, 0px) + 0px)` }}
        onClick={toggleSidebar}
      >
        {isSidebarOpen ? '>' : '<'}
      </div>
    </div>
  );
};

export default Edit3;
