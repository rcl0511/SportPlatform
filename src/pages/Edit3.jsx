// src/pages/Edit3.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.js';
import AiChat from '../components/AiChat.jsx';

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

  // 스타일 상수
  const fileButtonStyle = {
    display: 'inline-block',
    padding: '10px 20px',
    background: '#514EF3',
    color: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    marginTop: '20px',
    marginBottom: '24px',
  };
  const btnStyle = {
    padding: '10px 16px',
    borderRadius: 8,
    background: '#514EF3',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
  };

  // 초기 데이터 로딩
  useEffect(() => {
    // 로컬스토리지에서 제목/내용 꺼내기
    const savedTitle = localStorage.getItem('edit_subject');
    const savedContent = localStorage.getItem('edit_content');
    if (savedTitle) setReportTitle(savedTitle);
    if (savedContent) setReportContent(savedContent);

    // 오늘 날짜 세팅
    setToday(
      new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    );

    // API 호출용 FormData 준비
    if (!topic) return;
    const formData = new FormData();
    formData.append('topic', topic);

    if (base64 && fileName) {
      if (base64.startsWith('data:')) {
        // 이미지 Data URL일 때
        const byteString = atob(base64.split(',')[1]);
        const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        formData.append(
          'file',
          new Blob([ab], { type: mimeString }),
          fileName
        );
      } else {
        // CSV 등 텍스트 파일일 때
        formData.append(
          'file',
          new Blob([base64], { type: 'text/csv' }),
          fileName
        );
      }
    }

    // 리포트 생성 API 호출
    fetch('http://127.0.0.1:8000/api/generate-report', {
      method: 'POST',
      body: formData,
    })
      .then((res) => {
        if (!res.ok) throw new Error('서버 오류');
        return res.json();
      })
      .then((data) => {
        setReportTitle(data.title);
        setReportContent(data.content);
        setAllSources(
          data.sources.map((src, i) => ({
            id: i + 1,
            title: `출처 ${i + 1}`,
            summary: src,
          }))
        );
        setSelectedSources([1, 2, 3]);
      })
      .catch((err) => console.error('보고서 생성 실패:', err));
  }, [topic, base64, fileName]);

  // 핸들러들
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result);
    reader.readAsDataURL(file);
  };
  const handleSourceChange = (id) =>
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  const resetSources = () => {
    const reordered = allSources.filter((s) =>
      selectedSources.includes(s.id)
    );
    setVisibleCount(5);
    setAllSources((prev) => {
      const sel = new Set(selectedSources);
      return [
        ...reordered,
        ...prev.filter((s) => !sel.has(s.id)),
      ];
    });
  };

  return (
    <div
      style={{
        width: '100%',
        position: 'relative',
        padding: '20px',
        background: '#F6FAFD',
        minHeight: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* 유저 정보 */}
      <div
        style={{
          background: '#EEF6FB',
          padding: 16,
          paddingRight: sidebarWidth + 50,
          borderRadius: 8,
          marginTop: 30,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}
        >
          <div style={{ fontSize: 14, color: '#7E92A2', width: '33%' }}>
            작성자
          </div>
          <div
            style={{
              fontSize: 14,
              color: '#7E92A2',
              width: '33%',
              textAlign: 'center',
            }}
          >
            부서
          </div>
          <div
            style={{
              fontSize: 14,
              color: '#7E92A2',
              width: '33%',
              textAlign: 'right',
            }}
          >
            작성날짜
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#092C4C',
              width: '33%',
            }}
          >
            {userInfo
              ? `${userInfo.firstName}${userInfo.lastName}`
              : '이름없음'}
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#092C4C',
              width: '33%',
              textAlign: 'center',
            }}
          >
            {userInfo?.department || '부서없음'}
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#092C4C',
              width: '33%',
              textAlign: 'right',
            }}
          >
            {today}
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div
        style={{
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 0 10px rgba(0,0,0,0.05)',
          padding: 32,
          width: `calc(100% - ${sidebarWidth}px)`,
          minHeight: '50vh',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* 이미지 컨트롤 */}
        {imageUrl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button style={btnStyle} onClick={() => setImagePosition('top')}>
              위로
            </button>
            <button
              style={btnStyle}
              onClick={() => setImagePosition('bottom')}
            >
              아래로
            </button>
            <label style={{ fontSize: 14 }}>크기:</label>
            <input
              type="range"
              min="10"
              max="100"
              value={imageWidth}
              onChange={(e) => setImageWidth(Number(e.target.value))}
            />
            <span>{imageWidth}%</span>
            <label style={{ fontSize: 14, marginLeft: 16 }}>정렬:</label>
            <select
              value={imageAlign}
              onChange={(e) => setImageAlign(e.target.value)}
            >
              <option value="left">왼쪽</option>
              <option value="center">가운데</option>
              <option value="right">오른쪽</option>
            </select>
            <label style={{ fontSize: 14, marginLeft: 16 }}>
              여백TOP(px):
            </label>
            <input
              type="number"
              value={imageMarginTop}
              onChange={(e) =>
                setImageMarginTop(Number(e.target.value))
              }
              style={{ width: 60 }}
            />
            <label style={{ fontSize: 14, marginLeft: 8 }}>LEFT(px):</label>
            <input
              type="number"
              value={imageMarginLeft}
              onChange={(e) =>
                setImageMarginLeft(Number(e.target.value))
              }
              style={{ width: 60 }}
            />
          </div>
        )}

        {/* 이미지 상단 */}
        {imageUrl && imagePosition === 'top' && (
          <div
            style={{
              textAlign: imageAlign,
              marginTop: imageMarginTop,
              marginLeft: imageMarginLeft,
            }}
          >
            <img
              src={imageUrl}
              alt="첨부"
              style={{
                width: `${imageWidth}%`,
                borderRadius: 8,
                margin: '16px 0',
              }}
            />
          </div>
        )}

        {/* 제목 및 본문 */}
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#092C4C',
            margin: 0,
          }}
        >
          {reportTitle}
        </h2>
        <textarea
          rows={10}
          value={reportContent}
          onChange={(e) => setReportContent(e.target.value)}
          placeholder="내용을 입력하세요"
          style={{
            width: '100%',
            padding: 0,
            fontSize: 16,
            color: '#333',
            lineHeight: 1.8,
            border: 'none',
            background: 'transparent',
            resize: 'vertical',
          }}
        />

        {/* 이미지 하단 */}
        {imageUrl && imagePosition === 'bottom' && (
          <div
            style={{
              textAlign: imageAlign,
              marginTop: imageMarginTop,
              marginLeft: imageMarginLeft,
            }}
          >
            <img
              src={imageUrl}
              alt="첨부"
              style={{
                width: `${imageWidth}%`,
                borderRadius: 8,
                margin: '16px 0',
              }}
            />
          </div>
        )}
      </div>

      {/* 사이드바 */}
      <aside
        style={{
          position: 'fixed',
          top: 70,
          right: 0,
          width: sidebarWidth,
          height: 'calc(100vh - 90px)',
          background: '#EEF6FB',
          boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
          padding: 20,
          overflowY: 'auto',
          transition: 'width 0.3s ease',
        }}
      >
        {isChatMode ? (
          <AiChat
            setReportContent={setReportContent}
            onExit={() => setIsChatMode(false)}
          />
        ) : (
          <>
            <div style={{ paddingLeft: 20 }}>
              <h3>이미지 추가하기</h3>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
              <label htmlFor="file-upload" style={fileButtonStyle}>
                파일 선택
              </label>
            </div>
            <div
              style={{
                background: 'white',
                padding: 16,
                borderRadius: 8,
                marginTop: 30,
              }}
            >
              <label
                style={{
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                출처 선택
              </label>
              <select
                style={{
                  padding: '10px 16px',
                  width: '100%',
                  borderRadius: 8,
                  border: '1px solid #EAEEF4',
                  background: '#F6FAFD',
                  marginBottom: 16,
                }}
              >
                <option>출처 없음</option>
                <option>웹 기사</option>
                <option>논문</option>
                <option>기타</option>
              </select>
              <hr style={{ margin: '12px 0' }} />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#092C4C',
                  marginBottom: 8,
                  paddingBottom: 8,
                  borderBottom: '1px solid #EAEEF4',
                }}
              >
                <span style={{ width: '25%' }}>위치</span>
                <span style={{ width: '35%' }}>제목</span>
                <span style={{ width: '40%' }}>요약</span>
              </div>
              <div
                style={{
                  maxHeight: isSidebarOpen ? 300 : 150,
                  overflowY: 'auto',
                }}
              >
                {allSources.slice(0, visibleCount).map((src) => (
                  <div
                    key={src.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      fontSize: 12,
                      padding: '8px 0',
                      borderBottom: '1px solid #F0F0F0',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '25%',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSources.includes(src.id)}
                        onChange={() => handleSourceChange(src.id)}
                      />
                      <span
                        style={{ marginLeft: 8, fontWeight: 500 }}
                      >{`위치 ${src.id}`}</span>
                    </div>
                    <div style={{ fontWeight: 600, width: '35%' }}>
                      {src.title}
                    </div>
                    <div style={{ fontWeight: 300, width: '40%' }}>
                      {src.summary}
                    </div>
                  </div>
                ))}
              </div>
              {visibleCount < allSources.length && (
                <button
                  onClick={() =>
                    setVisibleCount(allSources.length)
                  }
                  style={{
                    ...btnStyle,
                    background: 'transparent',
                    color: '#514EF3',
                    marginTop: 8,
                  }}
                >
                  View more
                </button>
              )}
              <button
                onClick={resetSources}
                style={{ ...btnStyle, width: '100%', marginTop: 12 }}
              >
                출처 재선택
              </button>
            </div>
          </>
        )}
      </aside>

      {/* 토글 버튼 */}
      <div
        onClick={toggleSidebar}
        style={{
          position: 'fixed',
          top: '50%',
          right: sidebarWidth + 42,
          transform: 'translateY(-50%)',
          width: 32,
          height: 80,
          background: '#D0E6F8',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          borderTopLeftRadius: 8,
          borderBottomLeftRadius: 8,
          zIndex: 20,
        }}
      >
        {isSidebarOpen ? '>' : '<'}
      </div>

      {/* 하단 버튼 */}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: sidebarWidth + 70,
          display: 'flex',
          gap: 12,
        }}
      >
        <button
          onClick={() => setIsChatMode(true)}
          style={btnStyle}
        >
          AI 대화수정하기
        </button>
        <button
          onClick={() => {
            localStorage.setItem('edit_content', reportContent);
            navigate('/Result');
          }}
          style={btnStyle}
        >
          완료하기
        </button>
      </div>
    </div>
  );
};

export default Edit3;