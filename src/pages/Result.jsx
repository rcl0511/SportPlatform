// src/pages/Result.jsx
import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { MdEdit, MdHome, MdShare, MdSave, MdPictureAsPdf, MdClose } from 'react-icons/md';
import jsPDF from 'jspdf';
import '../styles/Result.css';

const hexToRgb = (hex) => {
  const [r, g, b] = hex.replace('#', '').match(/.{2}/g).map((x) => parseInt(x, 16));
  return { r, g, b };
};

const TEAM_KEYWORDS = [
  'LG 트윈스','두산 베어스','삼성 라이온즈','기아 타이거즈','SSG 랜더스','NC 다이노스','한화 이글스','롯데 자이언츠','키움 히어로즈','KT WIZ','KT 위즈','KT',
  'LG','두산','삼성','기아','SSG','NC','한화','롯데','키움'
];
const GENERIC_KEYWORDS = [
  'KBO','프로야구','타선','마운드','불펜','선발','마무리','에이스','득점','실점','승리','패배','연승','연패','순위','리그','플레이오프','포스트시즌','MVP',
  '끝내기','홈런','멀티히트','타점','삼진','세이브','호수비','데뷔','복귀','부상','트레이드'
];

const Result = () => {
  const navigate = useNavigate();
  const { userInfo, setUserInfo } = useContext(AuthContext);

  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editableName, setEditableName] = useState('');
  const [editableDept, setEditableDept] = useState('');
  const [editableDate, setEditableDate] = useState('');
  const [fontBase64, setFontBase64] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);

  // 이미지 옵션(기존 유지)
  const [imageUrl, setImageUrl] = useState(null);
  const [imagePosition, setImagePosition] = useState('top'); // 현재 미사용
  const [imageWidth, setImageWidth] = useState(100);
  const [imageAlign, setImageAlign] = useState('center');
  const [imageMarginTop, setImageMarginTop] = useState(0);
  const [imageMarginLeft, setImageMarginLeft] = useState(0);

  // 🔹 태그 편집 상태
  const [suggestedTags, setSuggestedTags] = useState([]); // AI 추천
  const [selectedTags, setSelectedTags] = useState([]);   // 사용자가 선택한 최종 태그
  const [tagInput, setTagInput] = useState('');           // 커스텀 태그 입력

  // 초기 로드
  useEffect(() => {
    setReportTitle(localStorage.getItem('edit_subject') || '제목 없음');
    setReportContent(localStorage.getItem('edit_content') || '내용이 없습니다.');
    setEditableDate(new Date().toISOString().slice(0, 10));

    // AI에서 생성된 태그들 로드 (우선 사용)
    const aiTagsRaw = localStorage.getItem('edit_tags');
    console.log('🔍 localStorage에서 읽은 원본 태그 데이터:', aiTagsRaw);
    
    const aiTags = JSON.parse(aiTagsRaw || '[]');
    console.log('🔄 파싱된 AI 태그 배열:', aiTags, '(길이:', aiTags.length, ')');
    
    if (aiTags.length > 0) {
      console.log('🏷️ AI 생성 태그 로드 성공! 태그들:', aiTags);
      setSuggestedTags(aiTags);
      setSelectedTags(aiTags.slice(0, 5)); // 처음 5개를 기본 선택
    } else {
      console.log('📝 AI 태그가 없어서 로컬 규칙 기반 태그를 사용합니다.');
    }

    // AI에서 생성된 캡션들 로드 (필요시 활용)
    const aiCaptions = JSON.parse(localStorage.getItem('edit_captions') || '{}');
    if (Object.keys(aiCaptions).length > 0) {
      console.log('💬 AI 생성 캡션:', aiCaptions);
    }

    const img = localStorage.getItem('edit_image');
    if (img) {
      setImageUrl(img);
      setImagePosition(localStorage.getItem('edit_image_position') || 'top');
      setImageWidth(Number(localStorage.getItem('edit_image_width')) || 100);
      setImageAlign(localStorage.getItem('edit_image_align') || 'center');
      setImageMarginTop(Number(localStorage.getItem('edit_image_marginTop')) || 0);
      setImageMarginLeft(Number(localStorage.getItem('edit_image_marginLeft')) || 0);
    }
  }, []);

  // 폰트 로드
  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/fonts/NotoSansKR-Regular.ttf.base64.txt`)
      .then((r) => r.text())
      .then(setFontBase64)
      .catch(() => console.error('폰트 로드 실패'));
  }, []);

  // 사용자 정보 → 편집 필드 세팅
  useEffect(() => {
    if (!userInfo) return;
    setEditableName(`${userInfo.firstName}${userInfo.lastName}`);
    setEditableDept(userInfo.department || '');
  }, [userInfo]);

  // 🔹 간단 “AI” 태그 추천(로컬/규칙 기반)
  const makeSuggestions = useMemo(() => {
    return (title, content) => {
      // 1) 외부에서 미리 넣어둔 추천이 있으면 우선 사용
      const preset = JSON.parse(localStorage.getItem('ai_tag_suggestions') || '[]')
        .map((t) => String(t).trim())
        .filter(Boolean);

      // 2) 규칙 기반 추출
      const text = `${title} ${content}`.toLowerCase();
      const set = new Set();

      TEAM_KEYWORDS.forEach((k) => {
        if (text.includes(k.toLowerCase())) set.add(k);
      });
      GENERIC_KEYWORDS.forEach((k) => {
        if (text.includes(k.toLowerCase())) set.add(k);
      });

      // 자주 나오는 단어 간이 추출(한글/영문/숫자 2~10자)
      const freq = {};
      (text.match(/[가-힣a-zA-Z0-9]{2,10}/g) || []).forEach((w) => {
        freq[w] = (freq[w] || 0) + 1;
      });
      const topWords = Object.entries(freq)
        .filter(([w]) => w.length >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([w]) => w);

      topWords.forEach((w) => set.add(w));

      // 기본 장르 태그
      set.add('스포츠');

      // preset 병합(앞쪽 우선)
      const merged = [...preset, ...Array.from(set)];
      // 중복 제거 & 최대 12개로 제한
      return Array.from(new Set(merged)).slice(0, 12);
    };
  }, []);

  // 추천 태그 계산 (AI 태그가 없을 때만)
  useEffect(() => {
    // AI 태그가 이미 있으면 로컬 규칙 기반 태그 생성 건너뛰기
    const aiTagsRaw = localStorage.getItem('edit_tags');
    const aiTags = JSON.parse(aiTagsRaw || '[]');
    console.log('🔎 태그 계산 useEffect - localStorage 확인:', { 
      raw: aiTagsRaw, 
      parsed: aiTags, 
      length: aiTags.length 
    });
    
    if (aiTags.length > 0) {
      console.log('🤖 AI 태그가 있어서 로컬 태그 생성을 건너뜁니다:', aiTags);
      return;
    }

    console.log('📋 AI 태그가 없어서 로컬 규칙 기반 태그를 생성합니다.');
    const recs = makeSuggestions(reportTitle, reportContent);
    console.log('📝 로컬 규칙으로 생성된 태그:', recs);
    setSuggestedTags(recs);
    // 추천 중 상위 3개를 기본 선택값으로 (원하면 0개로 시작해도 OK)
    setSelectedTags((prev) => (prev.length ? prev : recs.slice(0, 3)));
  }, [reportTitle, reportContent, makeSuggestions]);

  // 태그 조작 함수
  const toggleSelectTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };
  const removeSelectedTag = (tag) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };
  const addTagFromInput = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (!selectedTags.includes(t)) setSelectedTags((prev) => [...prev, t]);
    setTagInput('');
  };

  // 저장 + 알림 생성 + 상세 페이지 이동
  const handleSaveClick = () => {
    setIsEditing(false);

    const existing = JSON.parse(localStorage.getItem('saved_files') || '[]');

    const newArticle = {
      id: Date.now(),
      title: reportTitle || '제목 없음',
      content: reportContent || '',
      date: editableDate || new Date().toISOString().slice(0, 10),
      reporter:
        editableName || (userInfo ? `${userInfo.firstName}${userInfo.lastName}` : '기자 미상'),
      department: editableDept || '',
      email: userInfo?.email || '',
      image: imageUrl || '',
      tags: selectedTags.length ? selectedTags : ['스포츠'], // 🔹 선택된 태그 반영
      views: 0,
    };

    const nextList = [newArticle, ...existing];
    localStorage.setItem('saved_files', JSON.stringify(nextList));

    // 에디터 복귀 대비(선택)
    localStorage.setItem('edit_subject', newArticle.title);
    localStorage.setItem('edit_content', newArticle.content);

    // 사용자 정보(선택) 업데이트
    const updatedUser = {
      ...userInfo,
      firstName: (editableName || '').charAt(0) || userInfo?.firstName || '',
      lastName: (editableName || '').slice(1) || userInfo?.lastName || '',
      department: editableDept || userInfo?.department || '',
    };
    setUserInfo(updatedUser);
    localStorage.setItem('user_info', JSON.stringify(updatedUser));

    // 🔔 알림 생성(유틸 없이 직접)
    const alarmList = JSON.parse(localStorage.getItem('alarm_list') || '[]');
    const newAlarm = {
      id: Date.now(),
      message: `새 기사 [${newArticle.title}] 이(가) 작성되었습니다.`,
      time: new Date().toLocaleString(),
      meta: { type: 'article', articleId: newArticle.id },
    };
    const updatedAlarms = [newAlarm, ...alarmList];
    localStorage.setItem('alarm_list', JSON.stringify(updatedAlarms));
    localStorage.setItem('hasNewAlarm', 'true');
    localStorage.setItem('hasNewDashboardAlert', 'true');

    alert('저장되었습니다!');
    navigate(`/platform/article/${newArticle.id}`);
  };

  // PDF 생성 공통
  const createPdfInstance = () => {
    const pdf = new jsPDF('p', 'pt', 'a4');

    if (fontBase64) {
      pdf.addFileToVFS('NotoSansKR-Regular.ttf', fontBase64);
      pdf.addFont('NotoSansKR-Regular.ttf', 'NotoSansKR', 'normal');
      pdf.setFont('NotoSansKR', 'normal');
    }

    const margin = { left: 40, right: 40, top: 40 };
    const pageWidth = pdf.internal.pageSize.getWidth() - margin.left - margin.right;

    // 제목
    pdf.setFontSize(18);
    pdf.text(reportTitle, margin.left + pageWidth / 2, margin.top + 20, { align: 'center' });

    // 메타
    pdf.setFontSize(12);
    pdf.text(`작성자: ${editableName}`, margin.left, margin.top + 60);
    pdf.text(`부서: ${editableDept}`, margin.left + 200, margin.top + 60);
    pdf.text(`작성날짜: ${editableDate}`, margin.left + pageWidth, margin.top + 60, { align: 'right' });

    // 본문
    const { r, g, b } = hexToRgb('#000000');
    pdf.setTextColor(r, g, b);
    pdf.setFontSize(14);

    const lines = pdf.splitTextToSize(reportContent, pageWidth);
    let cursorY = margin.top + 100;
    const lineHeight = 14 * 1.2;

    lines.forEach((line) => {
      if (cursorY > pdf.internal.pageSize.getHeight() - margin.top) {
        pdf.addPage();
        cursorY = margin.top;
      }
      pdf.text(line, margin.left, cursorY);
      cursorY += lineHeight;
    });

    return pdf;
  };

  const handlePreview = () => {
    const blob = createPdfInstance().output('blob');
    setPreviewUrl(URL.createObjectURL(blob));
  };

  const handleDownloadPDF = () => {
    createPdfInstance().save(`${reportTitle || 'report'}.pdf`);
  };

  const handleShare = () => alert('공유 기능은 아직 준비 중입니다!');

  return (
    <div className="result-container">
      {previewUrl && <iframe className="pdf-preview" src={previewUrl} title="PDF Preview" />}

      <div className="report-content">
        <div className="report-header">
          <div className="info">
            {isEditing ? (
              <>
                <input
                  value={editableName}
                  onChange={(e) => setEditableName(e.target.value)}
                  placeholder="작성자"
                />
                <input
                  value={editableDept}
                  onChange={(e) => setEditableDept(e.target.value)}
                  placeholder="부서"
                />
                <input
                  value={editableDate}
                  onChange={(e) => setEditableDate(e.target.value)}
                  placeholder="YYYY-MM-DD"
                />
              </>
            ) : (
              <>
                <span>작성자: {editableName}</span>
                <span>부서: {editableDept}</span>
                <span>작성날짜: {editableDate}</span>
              </>
            )}
          </div>
          {isEditing ? (
            <button onClick={handleSaveClick}>저장</button>
          ) : (
            <button onClick={() => setIsEditing(true)}>
              <MdEdit size={20} />
            </button>
          )}
        </div>

        {imageUrl && (
          <div
            className="image-preview"
            style={{
              marginTop: imageMarginTop,
              marginLeft: imageMarginLeft,
              textAlign: imageAlign,
            }}
          >
            <img src={imageUrl} alt="첨부 이미지" style={{ width: `${imageWidth}%`, maxWidth: '100%' }} />
          </div>
        )}

        {isEditing ? (
          <>
            <input
              className="report-title-input"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
            />
            <textarea
              className="report-body-textarea"
              value={reportContent}
              onChange={(e) => setReportContent(e.target.value)}
            />
          </>
        ) : (
          <>
            <h2 className="report-title">{reportTitle}</h2>
            <p className="report-body">{reportContent}</p>
          </>
        )}

        {/* 🔹 AI 태그 추천/편집 영역 */}
        <div className="tag-editor">
          <div className="tag-editor__row">
            <h4>
              {JSON.parse(localStorage.getItem('edit_tags') || '[]').length > 0 
                ? '🤖 AI 생성 태그' 
                : '📋 추천 태그'
              }
            </h4>
            <div className="tag-cloud">
              {suggestedTags.map((t) => {
                const on = selectedTags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    className={`chip ${on ? 'on' : ''}`}
                    onClick={() => toggleSelectTag(t)}
                    title={on ? '선택 해제' : '선택'}
                  >
                    {t}
                  </button>
                );
              })}
              {suggestedTags.length === 0 && <span className="muted">추천 태그가 없습니다.</span>}
            </div>
          </div>

          <div className="tag-editor__row">
            <h4>선택된 태그</h4>
            <div className="selected-tags">
              {selectedTags.map((t) => (
                <span key={t} className="chip on" title={t}>
                  {t}
                  <button className="chip-close" onClick={() => removeSelectedTag(t)}>
                    <MdClose size={14} />
                  </button>
                </span>
              ))}
              {selectedTags.length === 0 && <span className="muted">아직 선택된 태그가 없습니다.</span>}
            </div>
          </div>

          <div className="tag-editor__add">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="태그 직접 추가 후 Enter"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTagFromInput();
                }
              }}
            />
            <button type="button" onClick={addTagFromInput}>
              추가
            </button>
          </div>
        </div>
      </div>

      <div className="controls">
        <button onClick={handleSaveClick}>
          <MdSave size={20} /> 업로드
        </button>
        <button onClick={handlePreview}>
          <MdPictureAsPdf size={20} /> 미리보기
        </button>
        {previewUrl && (
          <button onClick={handleDownloadPDF}>
            <MdPictureAsPdf size={20} /> PDF 저장
          </button>
        )}
        <button onClick={() => navigate('/')}>
          <MdHome size={20} /> 홈
        </button>
        <button onClick={handleShare}>
          <MdShare size={20} /> 공유
        </button>
      </div>
    </div>
  );
};

export default Result;
