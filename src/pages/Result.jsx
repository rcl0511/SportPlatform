// src/pages/Result.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { MdEdit, MdHome, MdShare, MdSave, MdPictureAsPdf } from 'react-icons/md';
import jsPDF from 'jspdf';

// 헥스 컬러를 RGB로 변환
const hexToRgb = (hex) => {
  const [r, g, b] = hex.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16));
  return { r, g, b };
};

const Result = () => {
  const navigate = useNavigate();
  const { userInfo, setUserInfo } = useContext(AuthContext);

  // 리포트 내용 & 편집 상태
  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // 헤더 편집용 상태
  const [editableName, setEditableName] = useState('');
  const [editableDept, setEditableDept] = useState('');
  const [editableDate, setEditableDate] = useState('');

  // 콘텐츠 스타일 설정
  const [contentFontSize] = useState(14);
  const [contentColor] = useState('#000000');
  const [isBold] = useState(false);
  const [isItalic] = useState(false);
  const [isUnderline] = useState(false);
  const [contentFontFamily] = useState('Noto Sans KR');
  const [contentAlign] = useState('left');

  // PDF 설정
  const [margins]   = useState({ top: 40, left: 40, right: 40 });
  const [positions] = useState({ headerY: 60, metaYStart: 100, contentYStart: 160 });
  const [fontBase64, setFontBase64] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);

  // 1) 한글 폰트 Base64 로드
  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/fonts/NotoSansKR-Regular.ttf.base64.txt`)
      .then(r => r.text())
      .then(setFontBase64)
      .catch(() => console.error('폰트 로드 실패'));
  }, []);

  // 2) 초기 데이터 로드 (제목·내용 + 헤더 정보)
  useEffect(() => {
    const subj = localStorage.getItem('edit_subject') || '제목 없음';
    const cont = localStorage.getItem('edit_content') || '내용이 없습니다.';
    setReportTitle(subj);
    setReportContent(cont);

    const today = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
    setEditableDate(today);

    if (userInfo) {
      setEditableName(`${userInfo.firstName}${userInfo.lastName}`);
      setEditableDept(userInfo.department || '');
    }
  }, [userInfo]);

  // 3) 저장 핸들러
  const handleSaveClick = () => {
    setIsEditing(false);

    // 제목/내용 저장
    localStorage.setItem('edit_subject', reportTitle);
    localStorage.setItem('edit_content', reportContent);

    // 유저 정보 저장
    const updatedUser = {
      ...userInfo,
      firstName: editableName.charAt(0),
      lastName: editableName.slice(1),
      department: editableDept
    };
    setUserInfo(updatedUser);
    localStorage.setItem('user_info', JSON.stringify(updatedUser));

    alert('저장되었습니다!');
  };

  // 4) 공유 (임시)
  const handleShare = () => {
    alert('공유 기능은 아직 준비 중입니다!');
  };

  // 5) PDF 생성 로직
  const createPdfInstance = () => {
    const pdf = new jsPDF('p', 'pt', 'a4');
    const { left, right, top } = margins;
    const pageWidth = pdf.internal.pageSize.getWidth() - left - right;

    if (fontBase64) {
      pdf.addFileToVFS('NotoSansKR-Regular.ttf', fontBase64);
      pdf.addFont('NotoSansKR-Regular.ttf', 'NotoSansKR', 'normal');
      pdf.setFont('NotoSansKR', 'normal');
    }

    pdf.setFontSize(18);
    pdf.text(reportTitle, pageWidth / 2 + left, positions.headerY, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text(`작성자: ${editableName}`, left, positions.metaYStart);
    pdf.text(`부서: ${editableDept}`, left + 200, positions.metaYStart);
    pdf.text(`작성날짜: ${editableDate}`, pageWidth + left, positions.metaYStart, { align: 'right' });

    const { r, g, b } = hexToRgb(contentColor);
    pdf.setTextColor(r, g, b);
    pdf.setFontSize(contentFontSize);
    if (isBold) pdf.setFont(undefined, 'bold');
    if (isItalic) pdf.setFont(undefined, 'italic');

    const lines = pdf.splitTextToSize(reportContent, pageWidth);
    let cursorY = positions.contentYStart;
    lines.forEach(line => {
      if (cursorY > pdf.internal.pageSize.getHeight() - top) {
        pdf.addPage();
        cursorY = top;
      }
      pdf.text(line, left, cursorY);
      cursorY += contentFontSize * 1.2;
    });

    return pdf;
  };

  // PDF 미리보기/저장
  const handlePreview = () => {
    const blob = createPdfInstance().output('blob');
    setPreviewUrl(URL.createObjectURL(blob));
  };
  const handleDownloadPDF = () => {
    createPdfInstance().save(`${reportTitle || 'report'}.pdf`);
  };

  return (
    <div style={{ padding: 20 }}>
      {/* PDF 미리보기 */}
      {previewUrl && (
        <iframe
          src={previewUrl}
          title="PDF Preview"
          style={{ width: '100%', height: 500, border: '1px solid #ccc', marginBottom: 20 }}
        />
      )}

      {/* 헤더 편집 모드 */}
      {isEditing && (
        <div style={{ marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {/* 필요시 편집 툴바 추가 */}
        </div>
      )}

      {/* 리포트 내용 */}
      <div
        id="report-content"
        style={{
          padding: 40,
          maxWidth: 900,
          margin: '0 auto 20px',
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 0 10px rgba(0,0,0,0.05)'
        }}
      >
        {/* 헤더 정보 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#EEF6FB',
            padding: 20,
            borderRadius: 8,
            marginBottom: 30
          }}
        >
          <div style={{ display: 'flex', gap: 20, fontSize: 16, color: '#092C4C' }}>
            {isEditing ? (
              <>
                <input
                  value={editableName}
                  onChange={e => setEditableName(e.target.value)}
                  placeholder="작성자"
                  style={{ padding: 8, width: 150, borderRadius: 8, border: '1px solid #ccc' }}
                />
                <input
                  value={editableDept}
                  onChange={e => setEditableDept(e.target.value)}
                  placeholder="부서"
                  style={{ padding: 8, width: 150, borderRadius: 8, border: '1px solid #ccc' }}
                />
                <input
                  value={editableDate}
                  onChange={e => setEditableDate(e.target.value)}
                  placeholder="작성날짜"
                  style={{ padding: 8, width: 150, borderRadius: 8, border: '1px solid #ccc' }}
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
            <button
              onClick={handleSaveClick}
              style={{ padding: '8px 16px', background: '#6789F7', color: '#fff', border: 'none', borderRadius: 8 }}
            >
              저장
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              style={{ padding: 8, background: '#6789F7', color: '#fff', border: 'none', borderRadius: 8 }}
            >
              <MdEdit size={20} />
            </button>
          )}
        </div>

        {/* 제목 */}
        <h2
          style={{
            fontSize: 24,
            fontFamily: contentFontFamily,
            fontWeight: isBold ? 'bold' : 'normal',
            fontStyle: isItalic ? 'italic' : 'normal',
            textDecoration: isUnderline ? 'underline' : 'none',
            color: contentColor,
            textAlign: contentAlign,
            marginBottom: 20
          }}
        >
          {reportTitle}
        </h2>

        {/* 본문 */}
        <p
          style={{
            whiteSpace: 'pre-line',
            fontSize: contentFontSize,
            fontFamily: contentFontFamily,
            fontWeight: isBold ? 'bold' : 'normal',
            fontStyle: isItalic ? 'italic' : 'normal',
            textDecoration: isUnderline ? 'underline' : 'none',
            color: contentColor,
            textAlign: contentAlign,
            lineHeight: 1.5
          }}
        >
          {reportContent}
        </p>
      </div>

      {/* 하단 컨트롤 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 40 }}>
        <button
          onClick={handleSaveClick}
          style={{
            padding: 10,
            background: '#6789F7',
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 8
          }}
        >
          <MdSave size={20} /> 저장
        </button>
        <button
          onClick={handlePreview}
          style={{
            padding: 10,
            background: '#6789F7',
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 8
          }}
        >
          <MdPictureAsPdf size={20} /> 미리보기
        </button>
        {previewUrl && (
          <button
            onClick={handleDownloadPDF}
            style={{
              padding: 10,
              background: '#6789F7',
              color: '#fff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 8
            }}
          >
            <MdPictureAsPdf size={20} /> PDF 저장
          </button>
        )}
        <button
          onClick={() => navigate('/')}
          style={{
            padding: 10,
            background: '#6789F7',
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 8
          }}
        >
          <MdHome size={20} /> 홈
        </button>
        <button
          onClick={handleShare}
          style={{
            padding: 10,
            background: '#6789F7',
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 8
          }}
        >
          <MdShare size={20} /> 공유
        </button>
      </div>
    </div>
  );
};

export default Result;