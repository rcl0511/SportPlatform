// src/pages/ArticleDetail.jsx

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import '../styles/ArticleDetail.css';
import { FaHeart, FaRegCommentDots, FaShareAlt } from 'react-icons/fa';

export default function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const storedArticles = JSON.parse(localStorage.getItem('saved_files')) || [];
    const found = storedArticles.find(a => a.id === Number(id));

    if (found) {
      found.views = (found.views || 0) + 1;
      const updated = storedArticles.map(a => a.id === found.id ? found : a);
      localStorage.setItem('saved_files', JSON.stringify(updated));

      setArticle(found);
      const savedComments = JSON.parse(localStorage.getItem(`comments_${found.id}`) || '[]');
      setComments(savedComments);
    } else {
      alert('해당 기사를 찾을 수 없습니다.');
      navigate('/platform');
    }
  }, [id, navigate]);

  const handleReaction = (type) => {
    const updated = { ...article };
    if (!updated.reactions) updated.reactions = {};
    updated.reactions[type] = (updated.reactions[type] || 0) + 1;
    setArticle(updated);

    const stored = JSON.parse(localStorage.getItem('saved_files')) || [];
    const newList = stored.map(a => a.id === updated.id ? updated : a);
    localStorage.setItem('saved_files', JSON.stringify(newList));
  };

  const handleAddComment = () => {
    if (newComment.trim() === '') return;
    const updatedComments = [...comments, newComment];
    setComments(updatedComments);
    setNewComment('');
    localStorage.setItem(`comments_${article.id}`, JSON.stringify(updatedComments));
  };

  if (!article) return <div>Loading...</div>;

  return (
    <div className="article-detail-wrapper">
      <Link to="/platform" className="back-link">← 돌아가기</Link>

      <h1 className="article-title">{article.title}</h1>
      <div className="article-meta">
        🖋 {article.reporter || '기자 미상'} | 👁 {article.views?.toLocaleString()} views
      </div>

      <div className="reporter-info">
        <img src={article.profileImg || 'https://placehold.co/60x60'} alt="기자" />
        <div className="reporter-details">
          <div className="reporter-name">{article.reporter}</div>
          <div className="reporter-email">{article.email}</div>
        </div>
      </div>

      <img src={article.image || 'https://placehold.co/399x357?text=No+Image'} alt="기사 이미지" className="article-image" />

      <p className="article-content">{article.content}</p>

      <div className="tags">
        {article.tags?.map(tag => (
          <span key={tag} className="tag">#{tag}</span>
        ))}
      </div>

      <div className="reactions">
        <div className="reaction-item" onClick={() => handleReaction('like')}>
          <FaHeart className="reaction-icon" /> {article.reactions?.like || 0}
        </div>
        <div className="reaction-item">
          <FaRegCommentDots className="reaction-icon" /> {comments.length}
        </div>
        <div className="reaction-item" onClick={() => navigator.clipboard.writeText(window.location.href)}>
          <FaShareAlt className="reaction-icon" /> 공유
        </div>
      </div>

      <div className="comments-section">
        <h3>댓글</h3>
        <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="댓글을 입력하세요" />
        <button onClick={handleAddComment}>댓글 등록</button>
        <div className="comment-list">
          {comments.map((c, i) => (
            <div key={i} className="comment">
              <div className="comment-avatar" />
              <div className="comment-text">
                <div className="comment-author">익명</div>
                <div>{c}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
