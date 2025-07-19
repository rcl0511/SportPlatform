import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.js';
import AiChat from '../components/AiChat.jsx';
import '../styles/Edit3.css';   // 스타일 import

const Edit3 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { topic, base64, fileName } = location.state || {};
  const { userInfo } = useContext(AuthContext);

  // 리포트 데이터 상태
  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [today, setToday] = useState('');

  // 사이드바 상태
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarWidth = isSidebarOpen ? 600 : 300;

  // 출처 데이터 상태
  const [allSources, setAllSources] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [selectedSources, setSelectedSources] = useState([]);

  // 챗 모드 상태
  const [isChatMode, setIsChatMode] = useState(false);

  // 이미지 업로드 및 레이아웃 조정 상태
  const [imageUrl, setImageUrl] = useState(null);
  const [imagePosition, setImagePosition] = useState('top');
  const [imageWidth, setImageWidth] = useState(100);
  const [imageAlign, setImageAlign] = useState('center');
  const [imageMarginTop, setImageMarginTop] = useState(0);
  const [imageMarginLeft, setImageMarginLeft] = useState(0);

  // 초기 데이터 로딩
  useEffect(() => {
    const savedTitle = localStorage.getItem('edit_subject');
    const savedContent = localStorage.getItem('edit_content');
    if (savedTitle) setReportTitle(savedTitle);
    if (savedContent) setReportContent(savedContent);

    setToday(new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    }));

    if (!topic) return;
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

    fetch('http://127.0.0.1:8000/api/generate-report', {
      method: 'POST',
      body: formData,
    })
      .then(res => { if (!res.ok) throw new Error('서버 오류'); return res.json(); })
      .then(data => {
        setReportTitle(data.title);
        setReportContent(data.content);
        setAllSources(data.sources.map((src,i) => ({
          id: i+1, title: `출처 ${i+1}`, summary: src
        })));
        setSelectedSources([1,2,3]);
      })
      .catch(err => console.error('보고서 생성 실패:', err));
  }, [topic, base64, fileName]);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const handleImageUpload = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result);
    reader.readAsDataURL(file);
  };
  const handleSourceChange = id => setSelectedSources(prev =>
    prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
  );
  const resetSources = () => {
    const reordered = allSources.filter(s => selectedSources.includes(s.id));
    setVisibleCount(5);
    setAllSources(prev => [
      ...reordered,
      ...prev.filter(s => !selectedSources.includes(s.id))
    ]);
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
        {isChatMode ? (
          <AiChat setReportContent={setReportContent} onExit={() => setIsChatMode(false)} />
        ) : (
          <>
            <h3>이미지 추가하기</h3>
            <input
              id="file-upload" type="file" accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
            <label htmlFor="file-upload" className="file-button">파일 선택</label>

            <div style={{ background: 'white', padding: 16, borderRadius: 8, marginTop: 30 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>출처 선택</label>
              <select style={{ padding: '10px 16px', width: '100%', borderRadius: 8, border: '1px solid #EAEEF4', background: '#F6FAFD', marginBottom: 16 }}>
                <option>출처 없음</option>
                <option>웹 기사</option>
                <option>논문</option>
                <option>기타</option>
              </select>
              <hr style={{ margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 14, color: '#092C4C', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #EAEEF4' }}>
                <span style={{ width: '25%' }}>위치</span>
                <span style={{ width: '35%' }}>제목</span>
                <span style={{ width: '40%' }}>요약</span>
              </div>
              <div style={{ maxHeight: isSidebarOpen ? 300 : 150, overflowY: 'auto' }}>
                {allSources.slice(0, visibleCount).map(src => (
                  <div key={src.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: 12, padding: '8px 0', borderBottom: '1px solid #F0F0F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', width: '25%' }}>
                      <input type="checkbox" checked={selectedSources.includes(src.id)} onChange={() => handleSourceChange(src.id)} />
                      <span style={{ marginLeft: 8, fontWeight: 500 }}>{`위치 ${src.id}`}</span>
                    </div>
                    <div style={{ fontWeight: 600, width: '35%' }}>{src.title}</div>
                    <div style={{ fontWeight: 300, width: '40%' }}>{src.summary}</div>
                  </div>
                ))}
              </div>
              {visibleCount < allSources.length && (
                <button className="btn" style={{ background: 'transparent', color: '#514EF3', marginTop: 8 }} onClick={() => setVisibleCount(allSources.length)}>
                  View more
                </button>
              )}
              <button className="btn" style={{ width: '100%', marginTop: 12 }} onClick={resetSources}>
                출처 재선택
              </button>
            </div>
          </>
        )}
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
        <button className="btn" onClick={() => setIsChatMode(true)}>AI 대화수정하기</button>
        <button className="btn" onClick={() => {
            localStorage.setItem('edit_content', reportContent);
            navigate('/Result');
          }}>
          완료하기
        </button>
      </div>
    </div>
  );
};

export default Edit3;
