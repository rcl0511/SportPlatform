// src/pages/Edit3.jsx
import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.js';
import '../styles/Edit3.css';

const Edit3 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { topic, base64, fileName } = location.state || {};
  const { userInfo } = useContext(AuthContext);

  // 리포트 데이터 상태
  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [reportTags, setReportTags] = useState([]);
  const [reportCaptions, setReportCaptions] = useState({});
  const [today, setToday] = useState('');

  // API 중복 호출 방지
  const hasGeneratedRef = useRef(false);

  // 사이드바 상태
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarWidth = isSidebarOpen ? 600 : 300;

  // 이미지 업로드 및 레이아웃 조정 상태
  const [imageUrl, setImageUrl] = useState(null);
  const [imagePosition, setImagePosition] = useState('top');
  const [imageWidth, setImageWidth] = useState(100);
  const [imageAlign, setImageAlign] = useState('center');
  const [imageMarginTop, setImageMarginTop] = useState(0);
  const [imageMarginLeft, setImageMarginLeft] = useState(0);

  // 초기 데이터 로딩 & AI 호출
  useEffect(() => {
    // 기본 설정
    if (topic) setReportTitle(topic);

    const savedContent = localStorage.getItem('edit_content');
    if (savedContent) setReportContent(savedContent);

    setToday(
      new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    );

    // 새 주제 시작 시, 이전 이미지 관련 잔존값 제거
    if (topic) {
      [
        'edit_image',
        'edit_image_position',
        'edit_image_width',
        'edit_image_align',
        'edit_image_marginTop',
        'edit_image_marginLeft',
      ].forEach((k) => localStorage.removeItem(k));
    }

    if (!topic || hasGeneratedRef.current) return;

    hasGeneratedRef.current = true;

    const generateReport = async () => {
      try {
        const formData = new FormData();
        formData.append('topic', topic);

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

        console.log('보고서 생성 API 호출 시작:', topic);

        // ✅ 프록시 없이 절대 URL 사용
        const response = await fetch('https://api.jolpai-backend.shop/api/generate-report', {
          method: 'POST',
          body: formData,
          // mode: 'cors', // 기본이 cors라 생략 가능
        });

        if (!response.ok) {
          throw new Error(`서버 오류: ${response.status}`);
        }

        const data = await response.json();

        console.log('📦 API 응답 전체 데이터:', data);
        console.log('🏷️ API 응답 태그 필드:', data.tags);
        console.log('💬 API 응답 캡션 필드:', data.captions);

        // 제목/내용 반영 + 즉시 저장 (Result가 바로 읽도록)
        const nextTitle = data.title || topic || '';
        const nextContent = data.content || '';

        setReportTitle(nextTitle);
        setReportContent(nextContent);

        localStorage.setItem('edit_subject', nextTitle);
        localStorage.setItem('edit_content', nextContent);

        // 태그 저장
        if (Array.isArray(data.tags)) {
          setReportTags(data.tags);
          localStorage.setItem('edit_tags', JSON.stringify(data.tags));
        }

        // 캡션 저장
        if (data.captions && typeof data.captions === 'object') {
          setReportCaptions(data.captions);
          localStorage.setItem('edit_captions', JSON.stringify(data.captions));
        }

        // 🔕 자동 새로고침 제거: 화면 상태만 갱신
      } catch (error) {
        console.error('보고서 생성 실패:', error);
        // 실패 시 재시도 허용
        hasGeneratedRef.current = false;
      }
    };

    generateReport();
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

  return (
    <div className="editor-container" style={{ paddingRight: sidebarWidth + 20 }}>
      {/* 유저 정보 */}
      <div className="user-info" style={{ paddingRight: sidebarWidth + 50 }}>
        <div className="row">
          <div className="col">작성자</div>
          <div className="col" style={{ textAlign: 'center' }}>
            부서
          </div>
          <div className="col" style={{ textAlign: 'right' }}>
            작성날짜
          </div>
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

      {/* 메인 콘텐츠 */}
      <div className="main-content" style={{ width: `calc(100% - ${sidebarWidth}px)` }}>
        {imageUrl && (
          <div className="image-controls">
            <button className="btn" onClick={() => setImagePosition('top')}>
              위로
            </button>
            <button className="btn" onClick={() => setImagePosition('bottom')}>
              아래로
            </button>
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

        {imageUrl && imagePosition === 'top' && (
          <div
            className="image-wrapper"
            style={{
              textAlign: imageAlign,
              marginTop: imageMarginTop,
              marginLeft: imageMarginLeft,
            }}
          >
            <img src={imageUrl} alt="첨부" style={{ width: `${imageWidth}%` }} />
          </div>
        )}

        <h2 className="report-title">{reportTitle}</h2>
        <textarea
          className="report-textarea"
          rows={10}
          value={reportContent}
          onChange={(e) => setReportContent(e.target.value)}
          placeholder="내용을 입력하세요"
        />

        {imageUrl && imagePosition === 'bottom' && (
          <div
            className="image-wrapper"
            style={{
              textAlign: imageAlign,
              marginTop: imageMarginTop,
              marginLeft: imageMarginLeft,
            }}
          >
            <img src={imageUrl} alt="첨부" style={{ width: `${imageWidth}%` }} />
          </div>
        )}
      </div>

      {/* 사이드바 */}
      <aside className="sidebar" style={{ width: sidebarWidth }}>
        <h3>이미지 추가하기</h3>
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
        <label htmlFor="file-upload" className="file-button">
          파일 선택
        </label>
      </aside>

      {/* 토글 버튼 */}
      <div
        className="sidebar-toggle"
        style={{ right: sidebarWidth + 42 }}
        onClick={toggleSidebar}
      >
        {isSidebarOpen ? '>' : '<'}
      </div>

      {/* 하단 버튼 */}
      <div className="bottom-buttons" style={{ right: sidebarWidth + 70 }}>
        <button
          className="btn"
          onClick={() => {
            // 최종 확정값 저장
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
