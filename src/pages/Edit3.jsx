import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.js';

import '../styles/Edit3.css';   // 스타일 import

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
  
  // API 호출 중복 방지를 위한 상태
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

  // 초기 데이터 로딩 및 API 호출 (한번만 실행)
  useEffect(() => {
    // 기본 설정
    if (topic) setReportTitle(topic);

    const savedContent = localStorage.getItem('edit_content');
    if (savedContent) setReportContent(savedContent);

    setToday(new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    }));

    // API 호출 조건 체크
    if (!topic || hasGeneratedRef.current) {
      return;
    }

    console.log('보고서 생성 시작 - topic:', topic, 'fileName:', fileName);

    // 중복 호출 방지 플래그 설정
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

        const response = await fetch('http://127.0.0.1:8000/api/generate-report', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`서버 오류: ${response.status}`);
        }

        const data = await response.json();
        
        console.log('📦 API 응답 전체 데이터:', data);
        console.log('🏷️ API 응답 태그 필드:', data.tags);
        console.log('💬 API 응답 캡션 필드:', data.captions);
        
        // API에서 제목이 오면 덮어씌움
        if (data.title) setReportTitle(data.title);
        setReportContent(data.content);
        
        // 추가 필드들 처리
        if (data.tags && Array.isArray(data.tags)) {
          console.log('✅ AI 태그 설정 중:', data.tags);
          setReportTags(data.tags);
          localStorage.setItem('edit_tags', JSON.stringify(data.tags));
          console.log('💾 localStorage에 AI 태그 저장 완료');
        } else {
          console.log('❌ AI 태그가 없거나 배열이 아닙니다:', data.tags);
        }
        
        if (data.captions && typeof data.captions === 'object') {
          console.log('✅ AI 캡션 설정 중:', data.captions);
          setReportCaptions(data.captions);
          localStorage.setItem('edit_captions', JSON.stringify(data.captions));
        } else {
          console.log('❌ AI 캡션이 없거나 객체가 아닙니다:', data.captions);
        }

        console.log('보고서 생성 완료');
      } catch (error) {
        console.error('보고서 생성 실패:', error);
        // 오류 발생 시에만 플래그 초기화하여 재시도 가능하게 함
        hasGeneratedRef.current = false;
      }
    };

    generateReport();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const handleImageUpload = e => {
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

      {/* 메인 콘텐츠 */}
      <div
        className="main-content"
        style={{ width: `calc(100% - ${sidebarWidth}px)` }}
      >
        {imageUrl && (
          <div className="image-controls">
            <button className="btn" onClick={() => setImagePosition('top')}>위로</button>
            <button className="btn" onClick={() => setImagePosition('bottom')}>아래로</button>
            <label>크기:</label>
            <input
              type="range" min="10" max="100" value={imageWidth}
              onChange={e => setImageWidth(Number(e.target.value))}
            />
            <span>{imageWidth}%</span>
            <label style={{ marginLeft: 16 }}>정렬:</label>
            <select value={imageAlign} onChange={e => setImageAlign(e.target.value)}>
              <option value="left">왼쪽</option>
              <option value="center">가운데</option>
              <option value="right">오른쪽</option>
            </select>
            <label style={{ marginLeft: 16 }}>여백TOP(px):</label>
            <input
              type="number" value={imageMarginTop}
              onChange={e => setImageMarginTop(Number(e.target.value))}
              style={{ width: 60 }}
            />
            <label style={{ marginLeft: 8 }}>LEFT(px):</label>
            <input
              type="number" value={imageMarginLeft}
              onChange={e => setImageMarginLeft(Number(e.target.value))}
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
              marginLeft: imageMarginLeft
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
          onChange={e => setReportContent(e.target.value)}
          placeholder="내용을 입력하세요"
        />

        {imageUrl && imagePosition === 'bottom' && (
          <div
            className="image-wrapper"
            style={{
              textAlign: imageAlign,
              marginTop: imageMarginTop,
              marginLeft: imageMarginLeft
            }}
          >
            <img src={imageUrl} alt="첨부" style={{ width: `${imageWidth}%` }} />
          </div>
        )}
      </div>

      {/* 사이드바 */}
      <aside
        className="sidebar"
        style={{ width: sidebarWidth }}
      >

        <h3>이미지 추가하기</h3>
        <input
          id="file-upload" type="file" accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
        <label htmlFor="file-upload" className="file-button">파일 선택</label>




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
      <div
        className="bottom-buttons"
        style={{ right: sidebarWidth + 70 }}
      >

        <button className="btn" onClick={() => {
          console.log('🚀 완료하기 버튼 클릭 - 현재 상태:');
          console.log('📝 reportTitle:', reportTitle);
          console.log('📄 reportContent:', reportContent);
          console.log('🏷️ reportTags:', reportTags, '(길이:', reportTags.length, ')');
          console.log('💬 reportCaptions:', reportCaptions);
          
          localStorage.setItem('edit_content', reportContent);
          localStorage.setItem('edit_subject', reportTitle);
          localStorage.setItem('edit_tags', JSON.stringify(reportTags));
          localStorage.setItem('edit_captions', JSON.stringify(reportCaptions));
          
          console.log('💾 localStorage 저장 완료:');
          console.log('🏷️ 저장된 태그:', localStorage.getItem('edit_tags'));
          
          if (imageUrl) {
            localStorage.setItem('edit_image', imageUrl);
            localStorage.setItem('edit_image_position', imagePosition);
            localStorage.setItem('edit_image_width', imageWidth.toString());
            localStorage.setItem('edit_image_align', imageAlign);
            localStorage.setItem('edit_image_marginTop', imageMarginTop.toString());
            localStorage.setItem('edit_image_marginLeft', imageMarginLeft.toString());
          }
          // 이동
          navigate('/Result');
        }}>
          완료하기
        </button>
      </div>
    </div>
  );
};

export default Edit3;
