import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import '../styles/ArticleDetail.css';
import { FaHeart, FaRegCommentDots, FaShareAlt, FaTrashAlt } from 'react-icons/fa';

export default function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [authorInput, setAuthorInput] = useState('');
  const [newComment, setNewComment] = useState('');
  const [toast, setToast] = useState('');

  /** 실제 HTML만 허용: 모델 토큰(<|...|>)이나 단순 '<...>' 텍스트는 제외 */
  const looksLikeHTML = (str) => {
    if (typeof str !== 'string') return false;
    if (/<\|/.test(str)) return false; // 모델 토큰 섞이면 텍스트 처리
    return /<(p|br|strong|em|b|i|ul|ol|li|h[1-6]|blockquote|span|div|hr|img|a)(\s|>)/i.test(str);
  };

  // 초기 로드
  useEffect(() => {
    const numericId = Number(id);
    if (Number.isNaN(numericId)) {
      alert('잘못된 문서 ID입니다.');
      navigate('/platform');
      return;
    }

    const metas = JSON.parse(localStorage.getItem('saved_files') || '[]');
    const found = metas.find((a) => a.id === numericId);

    if (!found) {
      alert('해당 기사를 찾을 수 없습니다.');
      navigate('/platform');
      return;
    }

    // 조회수 +1 (메타 갱신)
    const nextMeta = { ...found, views: (found.views || 0) + 1 };
    localStorage.setItem(
      'saved_files',
      JSON.stringify(metas.map((a) => (a.id === nextMeta.id ? nextMeta : a)))
    );

    // article:<id> 풀텍스트/이미지 시도
    let full = null;
    try {
      full = JSON.parse(localStorage.getItem(`article:${found.id}`) || 'null');
    } catch { full = null; }

    // ✅ 병합 규칙 (우선순위: article:<id>.content → meta.fullContent → meta.content)
    const fullContent =
      (full && typeof full.content === 'string' && full.content)
      ?? (typeof nextMeta.fullContent === 'string' ? nextMeta.fullContent : undefined)
      ?? (typeof nextMeta.content === 'string' ? nextMeta.content : '');

    // ✅ 이미지 병합 (TS5076 피하기 위해 ?? 만 사용)
    const image =
      (nextMeta.image !== undefined ? nextMeta.image : undefined)
      ?? (full && typeof full.image === 'string' ? full.image : undefined)
      ?? (nextMeta.hasImage ? nextMeta.image : undefined)
      ?? '';

    const merged = { ...nextMeta, fullContent, image };

    // 디버깅 로그(필요 시 콘솔에서 확인)
    try {
      console.log('[ArticleDetail] metaLen=%s, fullObj=%o, useLen=%s',
        (nextMeta.fullContent || nextMeta.content || '').length,
        full,
        fullContent.length
      );
    } catch {}

    setArticle(merged);
    setComments(JSON.parse(localStorage.getItem(`comments_${nextMeta.id}`) || '[]'));

    const user = JSON.parse(localStorage.getItem('user_info') || 'null');
    setAuthorInput(user ? `${user.firstName || ''}${user.lastName || ''}` : '');
  }, [id, navigate]);

  // 좋아요(중복 방지: 세션 기준)
  const likeKey = useMemo(() => `reacted_${id}_like`, [id]);
  const handleLike = () => {
    if (!article || sessionStorage.getItem(likeKey) === 'true') return;
    const updated = { ...article, reactions: { ...(article.reactions || {}) } };
    updated.reactions.like = (updated.reactions.like || 0) + 1;
    setArticle(updated);
    const stored = JSON.parse(localStorage.getItem('saved_files') || '[]');
    localStorage.setItem(
      'saved_files',
      JSON.stringify(stored.map((a) => (a.id === updated.id ? updated : a)))
    );
    sessionStorage.setItem(likeKey, 'true');
  };

  // 댓글
  const submitComment = () => {
    if (!newComment.trim() || !article) return;
    const entry = {
      id: Date.now(),
      author: authorInput?.trim() || '익명',
      text: newComment.trim(),
      time: new Date().toLocaleString(),
    };
    const next = [entry, ...comments];
    setComments(next);
    setNewComment('');
    localStorage.setItem(`comments_${article.id}`, JSON.stringify(next));
  };

  const handleDeleteComment = (cid) => {
    if (!article) return;
    const next = comments.filter((c) => c.id !== cid);
    setComments(next);
    localStorage.setItem(`comments_${article.id}`, JSON.stringify(next));
  };

  // 공유
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: article?.title || '기사',
          text: '기사를 공유합니다',
          url: window.location.href,
        });
        setToast('공유 완료!');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setToast('링크 복사됨!');
      }
    } catch {
      setToast('공유 실패');
    } finally {
      setTimeout(() => setToast(''), 1200);
    }
  };

  // 태그 클릭 → 검색어 주입
  const handleTagClick = (tag) => {
    localStorage.setItem('dashboard_q', tag);
    navigate('/');
  };

  // 상세 본문: fullContent 우선, 없으면 content
  const fullText = useMemo(() => {
    if (!article) return '';
    return article.fullContent || article.content || '';
  }, [article]);

  // 안전 삽입용: script/style 제거
  const sanitizedHTML = useMemo(() => {
    if (!fullText) return '';
    return fullText.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '');
  }, [fullText]);

  // 텍스트 단락 분리(빈 줄 2개 이상), CRLF 정규화
  const textParagraphs = useMemo(() => {
    return fullText
      .replace(/\r\n/g, '\n')
      .split(/\n{2,}/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [fullText]);

  if (!article) return <div className="article-loading">Loading…</div>;

  return (
    <div className="article-wrap">
      <div className="article-header">
        <Link to="/" className="back-link">← 목록으로</Link>
      </div>

      <article className="article">
        {/* 제목 */}
        <h1 className="article__title">{article.title}</h1>

        {/* 메타 */}
        <div className="article__meta">
          <div className="meta__left">
            <div className="reporter">
              <img
                src={article.profileImg || 'https://placehold.co/56x56'}
                alt="기자"
                className="reporter__img"
              />
              <div className="reporter__info">
                <div className="reporter__row">
                  <span className="reporter__name">{article.reporter || '기자 미상'}</span>
                  <span className="reporter__dept">{article.department || '소속 부서'}</span>
                </div>
                <div className="reporter__sub">
                  {article.email && <span>{article.email}</span>}
                </div>
              </div>
            </div>
          </div>
          <div className="meta__right">
            <span>{article.date}</span>
            <span>{(article.views || 0).toLocaleString()} views</span>
          </div>
        </div>

        {/* 대표 이미지 */}
        {article.image && (
          <figure className="feature">
            <img src={article.image} alt="기사 이미지" className="feature__img" />
          </figure>
        )}

        {/* 본문 */}
        <div className="article__body">
          {looksLikeHTML(fullText) ? (
            <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
          ) : (
            textParagraphs.map((para, i) => <p key={i}>{para}</p>)
          )}
        </div>

        {/* 태그 */}
        {!!article.tags?.length && (
          <div className="tags">
            {article.tags.map((tag) => (
              <button key={tag} className="tag" onClick={() => handleTagClick(tag)}>
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* 액션 바 */}
        <div className="actions-bar">
          <button
            className={`action action--like ${sessionStorage.getItem(likeKey) === 'true' ? 'on' : ''}`}
            onClick={handleLike}
            title="좋아요"
          >
            <FaHeart /> <span>{article.reactions?.like || 0}</span>
          </button>

          <div className="action" title="댓글 수">
            <FaRegCommentDots /> <span>{comments.length}</span>
          </div>

          <button className="action" onClick={handleShare} title="공유">
            <FaShareAlt /> <span>공유</span>
          </button>

          {toast && <div className="toast">{toast}</div>}
        </div>
      </article>

      {/* 댓글 */}
      <section className="comments">
        <h3 className="comments__title">댓글</h3>

        <div className="comment-form">
          <input
            className="comment-author"
            placeholder="작성자 (선택)"
            value={authorInput}
            onChange={(e) => setAuthorInput(e.target.value)}
          />
          <textarea
            className="comment-input"
            placeholder="댓글을 입력하세요 (Enter 등록, Shift+Enter 줄바꿈)"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitComment();
              }
            }}
          />
          <button className="comment-submit" onClick={submitComment}>
            댓글 등록
          </button>
        </div>

        <div className="comment-list">
          {comments.length === 0 ? (
            <div className="comment-empty">첫 댓글을 남겨보세요!</div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="comment">
                <div className="comment__avatar" />
                <div className="comment__body">
                  <div className="comment__row">
                    <span className="comment__author">{c.author || '익명'}</span>
                    <span className="comment__time">{c.time}</span>
                    <button
                      className="comment__delete"
                      title="삭제"
                      onClick={() => handleDeleteComment(c.id)}
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                  <div className="comment__text">{c.text}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
