import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { MdEdit, MdHome, MdShare, MdSave, MdPictureAsPdf } from 'react-icons/md';
import jsPDF from 'jspdf';
import '../styles/Result.css';

const hexToRgb = hex => {
  const [r, g, b] = hex.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16));
  return { r, g, b };
};

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
  const [imageUrl, setImageUrl] = useState(null);
  const [imagePosition, setImagePosition] = useState('top');
  const [imageWidth, setImageWidth] = useState(100);
  const [imageAlign, setImageAlign] = useState('center');
  const [imageMarginTop, setImageMarginTop] = useState(0);
  const [imageMarginLeft, setImageMarginLeft] = useState(0);

  useEffect(() => {
    setReportTitle(localStorage.getItem('edit_subject') || '제목 없음');
    setReportContent(localStorage.getItem('edit_content') || '내용이 없습니다.');
    setEditableDate(new Date().toISOString().slice(0, 10));

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

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/fonts/NotoSansKR-Regular.ttf.base64.txt`)
      .then(r => r.text())
      .then(setFontBase64)
      .catch(() => console.error('폰트 로드 실패'));
  }, []);

  useEffect(() => {
    if (!userInfo) return;
    setEditableName(`${userInfo.firstName}${userInfo.lastName}`);
    setEditableDept(userInfo.department || '');
  }, [userInfo]);

 // ✅ 교체: 저장하고 /platform/article/:id 로 이동
const handleSaveClick = () => {
  setIsEditing(false);

  const existing = JSON.parse(localStorage.getItem('saved_files') || '[]');

  const newArticle = {
    id: Date.now(),                       // 상세페이지 라우팅용 고유 ID
    title: reportTitle || '제목 없음',
    content: reportContent || '',
    date: editableDate || new Date().toISOString().slice(0,10),
    reporter: editableName || (userInfo ? `${userInfo.firstName}${userInfo.lastName}` : '기자 미상'),
    department: editableDept || '',
    email: userInfo?.email || '',
    image: imageUrl || '',                // 이미지가 없으면 '' 저장
    tags: ['스포츠', '속보'],
    views: 0,
  };

  // 맨 앞에 추가(최근 저장 우선)
  const nextList = [newArticle, ...existing];
  localStorage.setItem('saved_files', JSON.stringify(nextList));

  // 에디터 폼 복귀 대비(선택)
  localStorage.setItem('edit_subject', newArticle.title);
  localStorage.setItem('edit_content', newArticle.content);

  // 사용자 정보(선택): 이름을 한 글자/나머지로 쪼개던 로직 유지
  const updatedUser = {
    ...userInfo,
    firstName: (editableName || '').charAt(0) || userInfo?.firstName || '',
    lastName: (editableName || '').slice(1) || userInfo?.lastName || '',
    department: editableDept || userInfo?.department || '',
  };
  setUserInfo(updatedUser);
  localStorage.setItem('user_info', JSON.stringify(updatedUser));

  alert('저장되었습니다!');
  // ✅ 바로 상세 페이지로 이동
  navigate(`/platform/article/${newArticle.id}`);
};


  const createPdfInstance = () => {
    const pdf = new jsPDF('p', 'pt', 'a4');

    if (fontBase64) {
      pdf.addFileToVFS('NotoSansKR-Regular.ttf', fontBase64);
      pdf.addFont('NotoSansKR-Regular.ttf', 'NotoSansKR', 'normal');
      pdf.setFont('NotoSansKR', 'normal');
    }

    const margin = { left: 40, right: 40, top: 40 };
    const pageWidth = pdf.internal.pageSize.getWidth() - margin.left - margin.right;

    pdf.setFontSize(18);
    pdf.text(reportTitle, margin.left + pageWidth / 2, margin.top + 20, { align: 'center' });

    pdf.setFontSize(12);
    pdf.text(`작성자: ${editableName}`, margin.left, margin.top + 60);
    pdf.text(`부서: ${editableDept}`, margin.left + 200, margin.top + 60);
    pdf.text(`작성날짜: ${editableDate}`, margin.left + pageWidth, margin.top + 60, { align: 'right' });

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
      {previewUrl && (
        <iframe className="pdf-preview" src={previewUrl} title="PDF Preview" />
      )}

      <div className="report-content">
        <div className="report-header">
          <div className="info">
            {isEditing ? (
              <>
                <input value={editableName} onChange={e => setEditableName(e.target.value)} placeholder="작성자" />
                <input value={editableDept} onChange={e => setEditableDept(e.target.value)} placeholder="부서" />
                <input value={editableDate} onChange={e => setEditableDate(e.target.value)} placeholder="YYYY-MM-DD" />
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
            <button onClick={() => setIsEditing(true)}><MdEdit size={20} /></button>
          )}
        </div>

        {imageUrl && (
          <div
            className="image-preview"
            style={{
              marginTop: imageMarginTop,
              marginLeft: imageMarginLeft,
              textAlign: imageAlign
            }}
          >
            <img
              src={imageUrl}
              alt="첨부 이미지"
              style={{ width: `${imageWidth}%`, maxWidth: '100%' }}
            />
          </div>
        )}

        {isEditing ? (
          <>
            <input className="report-title-input" value={reportTitle} onChange={e => setReportTitle(e.target.value)} />
            <textarea className="report-body-textarea" value={reportContent} onChange={e => setReportContent(e.target.value)} />
          </>
        ) : (
          <>
            <h2 className="report-title">{reportTitle}</h2>
            <p className="report-body">{reportContent}</p>
          </>
        )}
      </div>

      <div className="controls">
        <button onClick={handleSaveClick}><MdSave size={20} /> 업로드 </button>
        <button onClick={handlePreview}><MdPictureAsPdf size={20} /> 미리보기</button>
        {previewUrl && <button onClick={handleDownloadPDF}><MdPictureAsPdf size={20} /> PDF 저장</button>}
        <button onClick={() => navigate('/')}><MdHome size={20} /> 홈</button>
        <button onClick={handleShare}><MdShare size={20} /> 공유</button>
      </div>
    </div>
  );
};

export default Result;
