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
  SHOW_RECOMMENDATIONS: true,
  USE_CAPTION_AS_TITLE_FALLBACK: true,
  REGENERATE_ON_TITLE_SELECT: false,
  MAX_RETRIES: 1,
};
/* ======================================================= */

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

  const [recommendedTitles, setRecommendedTitles] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState('');

  const hasGeneratedRef = useRef(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarWidth = isSidebarOpen ? 600 : 300;

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

  const buildSuggestedTitles = (data, fallbackTopic) => {
    const out = [];
    if (Array.isArray(data?.titles) && data.titles.length) return data.titles;

    const caps = data?.captions || {};
    if (typeof caps === 'object') {
      if (caps.headline && typeof caps.headline === 'string') out.push(caps.headline);
      if (caps.summary && typeof caps.summary === 'string') out.push(caps.summary);
    }

    if (Array.isArray(data?.tags) && data.tags.length) {
      const keys = data.tags.slice(0, 3).join(' · ');
      if (keys) out.push(`${keys} — 한 경기 요약`);
    }

    if (typeof data?.content === 'string' && data.content.trim()) {
      const firstSentence = data.content.split(/[.!?]\s|[\n]/).find(Boolean);
      if (firstSentence && firstSentence.length > 8) out.push(firstSentence);
    }

    if (out.length === 0 && fallbackTopic) out.push(fallbackTopic);
    return Array.from(new Set(out)).slice(0, 5);
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

      const data = await res.json();

      let nextTitle = (data.title || '').trim();
      if (!nextTitle && CONFIG.USE_CAPTION_AS_TITLE_FALLBACK) {
        const caps = data.captions || {};
        const capCandidates = [
          caps.headline,
          caps.summary,
          ...(typeof caps === 'object' ? Object.values(caps) : []),
        ].filter((v) => typeof v === 'string' && v.trim());
        if (capCandidates.length) nextTitle = capCandidates[0].trim();
      }
      if (!nextTitle) nextTitle = topicForReport;

      const nextContent = data.content || '';

      setReportTitle(nextTitle);
      setReportContent(nextContent);

      localStorage.setItem('edit_subject', nextTitle);
      localStorage.setItem('edit_content', nextContent);

      if (Array.isArray(data.tags)) {
        setReportTags(data.tags);
        localStorage.setItem('edit_tags', JSON.stringify(data.tags));
      } else {
        setReportTags([]);
        localStorage.removeItem('edit_tags');
      }

      if (data.captions && typeof data.captions === 'object') {
        setReportCaptions(data.captions);
        localStorage.setItem('edit_captions', JSON.stringify(data.captions));
      } else {
        setReportCaptions({});
        localStorage.removeItem('edit_captions');
      }

      const suggestions = buildSuggestedTitles(data, nextTitle);
      setRecommendedTitles(suggestions);
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

  // 🔹 타이핑으로 제목 직접 수정 가능
  const onChangeTitle = (e) => {
    const v = e.target.value;
    setReportTitle(v);
    localStorage.setItem('edit_subject', v);
  };
  const onKeyDownTitle = (e) => {
    if (e.key === 'Enter') e.currentTarget.blur();
  };

  return (
    <div className="editor-container" style={{ paddingRight: sidebarWidth + 20 }}>
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
      <div className="user-info" style={{ paddingRight: sidebarWidth + 50 }}>
        <div className="row">
          <div className="col">작성자</div>
          <div className="col" style={{ textAlign: 'center' }}>부서</div>
          <div className="col" style={{ textAlign: 'right' }}>작성날짜</div>
        </div>
        <div className="row">
          <div className="col value">
            {userInfo ? `${userInfo.firstName}${userInfo.lastName}` : '이름없음'}
          </div>
          <div className="col value" style={{ textAlign: 'center' }}>
            {userInfo?.department || '부서없음'}
          </div>
          <div className="col value" style={{ textAlign: 'right' }}>
            {today}
          </div>
        </div>
      </div>

      {/* 제목 추천 (응답 기반) */}
      {CONFIG.SHOW_RECOMMENDATIONS && (
        <div className="title-recommendations" style={{ width: `calc(100% - ${sidebarWidth}px)` }}>
          <h3 style={{ marginTop: 8, marginBottom: 8 }}>제목 추천</h3>
          {recommendedTitles.length === 0 && (
            <div className="title-empty">추천 제목이 없습니다.</div>
          )}
          {recommendedTitles.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {recommendedTitles.map((t, idx) => (
                <button
                  key={idx}
                  className={`title-item ${selectedTitle === t ? 'selected' : ''}`}
                  onClick={() => applySelectedTitle(t)}
                  title={t}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className="main-content" style={{ width: `calc(100% - ${sidebarWidth}px)` }}>
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
            <input type="range" min="10" max="100" value={imageWidth} onChange={(e) => setImageWidth(Number(e.target.value))} />
            <span>{imageWidth}%</span>
            <label style={{ marginLeft: 16 }}>정렬:</label>
            <select value={imageAlign} onChange={(e) => setImageAlign(e.target.value)}>
              <option value="left">왼쪽</option>
              <option value="center">가운데</option>
              <option value="right">오른쪽</option>
            </select>
            <label style={{ marginLeft: 16 }}>여백TOP(px):</label>
            <input type="number" value={imageMarginTop} onChange={(e) => setImageMarginTop(Number(e.target.value))} style={{ width: 60 }} />
            <label style={{ marginLeft: 8 }}>LEFT(px):</label>
            <input type="number" value={imageMarginLeft} onChange={(e) => setImageMarginLeft(Number(e.target.value))} style={{ width: 60 }} />
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
        {imageUrl && ['top','bottom'].includes(imagePosition) && (
          <div
            className="image-wrapper"
            style={{ textAlign: imageAlign, marginTop: imageMarginTop, marginLeft: imageMarginLeft }}
          >
            <img src={imageUrl} alt="첨부" style={{ width: `${imageWidth}%` }} />
          </div>
        )}
      </div>

      {/* 사이드바 */}
      <aside className="sidebar" style={{ width: sidebarWidth }}>
        <h3>이미지 추가하기</h3>
        <input id="file-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
        <label htmlFor="file-upload" className="file-button">파일 선택</label>
      </aside>

      {/* 토글 버튼 */}
      <div className="sidebar-toggle" style={{ right: sidebarWidth + 42 }} onClick={toggleSidebar}>
        {isSidebarOpen ? '>' : '<'}
      </div>

      {/* 하단 버튼 */}
      <div className="bottom-buttons" style={{ right: sidebarWidth + 70 }}>
        <button
          className="btn"
          onClick={() => {
            localStorage.setItem('edit_content', reportContent);
            localStorage.setItem('edit_subject', reportTitle);
            localStorage.setItem('edit_tags', JSON.stringify(reportTags));
            localStorage.setItem('edit_captions', JSON.stringify(reportCaptions));
            if (imageUrl) {
              localStorage.setItem('edit_image', imageUrl);
              localStorage.setItem('edit_image_position', imagePosition);
              localStorage.setItem('edit_image_width', imageWidth.toString());
              localStorage.setItem('edit_image_align', imageAlign);
              localStorage.setItem('edit_image_marginTop', imageMarginTop.toString());
              localStorage.setItem('edit_image_marginLeft', imageMarginLeft.toString());
            }
            navigate('/Result');
          }}
        >
          완료하기
        </button>
      </div>
    </div>
  );
};

export default Edit3;
