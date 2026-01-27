"""
백엔드에 추가할 기사(Article) CRUD API 엔드포인트
FastAPI 라우터에 추가하세요.

사용법:
1. 이 파일을 백엔드 프로젝트의 app/api/ 디렉토리에 article.py로 저장
2. main.py에 추가: app.include_router(article.router, prefix="/api")
3. 데이터베이스 모델이 필요합니다 (아래 참고)
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import json

router = APIRouter()
security = HTTPBearer()

# ============================================
# Pydantic 모델 (요청/응답 스키마)
# ============================================

class ArticleCreate(BaseModel):
    title: str
    content: str  # 미리보기
    fullContent: Optional[str] = None  # 전체 본문
    date: Optional[str] = None
    reporter: Optional[str] = None
    department: Optional[str] = None
    email: Optional[str] = None
    image: Optional[str] = None
    tags: Optional[List[str]] = None
    views: int = 0
    status: str = "draft"  # draft, review, published, archived

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    fullContent: Optional[str] = None
    date: Optional[str] = None
    reporter: Optional[str] = None
    department: Optional[str] = None
    email: Optional[str] = None
    image: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None

class ArticleResponse(BaseModel):
    id: int
    title: str
    content: str
    fullContent: Optional[str] = None
    date: str
    reporter: Optional[str] = None
    department: Optional[str] = None
    email: Optional[str] = None
    image: Optional[str] = None
    tags: Optional[List[str]] = None
    views: int
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StatusUpdate(BaseModel):
    status: str

class ViewsResponse(BaseModel):
    views: int

# ============================================
# 인증 의존성 (JWT 토큰 검증)
# ============================================

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    JWT 토큰을 검증하고 사용자 정보를 반환합니다.
    실제 구현은 백엔드의 인증 시스템에 맞게 수정하세요.
    """
    token = credentials.credentials
    # TODO: JWT 토큰 검증 로직 구현
    # 예: jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    # 여기서는 간단히 토큰이 있으면 통과하도록 함
    if not token:
        raise HTTPException(status_code=401, detail="인증 토큰이 필요합니다")
    return {"user_id": 1}  # 실제로는 토큰에서 추출한 사용자 ID

# ============================================
# API 엔드포인트
# ============================================

@router.get("/articles", response_model=List[ArticleResponse])
async def get_articles(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db)  # 데이터베이스 세션 의존성
):
    """
    기사 목록을 가져옵니다.
    """
    # TODO: 데이터베이스에서 기사 목록 조회
    # 예: articles = db.query(Article).filter(...).offset(skip).limit(limit).all()
    # 여기서는 예시 응답 반환
    return []

@router.get("/articles/{article_id}", response_model=ArticleResponse)
async def get_article(
    article_id: int,
    db: Session = Depends(get_db)
):
    """
    특정 기사의 상세 정보를 가져옵니다.
    """
    # TODO: 데이터베이스에서 기사 조회
    # 예: article = db.query(Article).filter(Article.id == article_id).first()
    # if not article:
    #     raise HTTPException(status_code=404, detail="기사를 찾을 수 없습니다")
    # return article
    raise HTTPException(status_code=404, detail="기사를 찾을 수 없습니다")

@router.post("/articles", response_model=ArticleResponse, status_code=status.HTTP_201_CREATED)
async def create_article(
    article: ArticleCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    새 기사를 생성합니다.
    """
    # TODO: 데이터베이스에 기사 저장
    # 예:
    # db_article = Article(
    #     title=article.title,
    #     content=article.content,
    #     fullContent=article.fullContent,
    #     date=article.date or datetime.now().isoformat(),
    #     reporter=article.reporter,
    #     department=article.department,
    #     email=article.email,
    #     image=article.image,
    #     tags=json.dumps(article.tags) if article.tags else None,
    #     views=article.views,
    #     status=article.status,
    #     author_id=current_user["user_id"]
    # )
    # db.add(db_article)
    # db.commit()
    # db.refresh(db_article)
    # return db_article
    
    # 임시 응답
    return ArticleResponse(
        id=1,
        title=article.title,
        content=article.content,
        fullContent=article.fullContent,
        date=article.date or datetime.now().isoformat(),
        reporter=article.reporter,
        department=article.department,
        email=article.email,
        image=article.image,
        tags=article.tags or [],
        views=article.views,
        status=article.status
    )

@router.put("/articles/{article_id}", response_model=ArticleResponse)
async def update_article(
    article_id: int,
    article_update: ArticleUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    기사를 수정합니다.
    """
    # TODO: 데이터베이스에서 기사 조회 및 업데이트
    # 예:
    # db_article = db.query(Article).filter(Article.id == article_id).first()
    # if not db_article:
    #     raise HTTPException(status_code=404, detail="기사를 찾을 수 없습니다")
    # 
    # # 권한 확인 (작성자만 수정 가능)
    # if db_article.author_id != current_user["user_id"]:
    #     raise HTTPException(status_code=403, detail="수정 권한이 없습니다")
    # 
    # # 필드 업데이트
    # update_data = article_update.dict(exclude_unset=True)
    # for field, value in update_data.items():
    #     if field == "tags" and value:
    #         setattr(db_article, field, json.dumps(value))
    #     else:
    #         setattr(db_article, field, value)
    # 
    # db_article.updated_at = datetime.now()
    # db.commit()
    # db.refresh(db_article)
    # return db_article
    
    raise HTTPException(status_code=404, detail="기사를 찾을 수 없습니다")

@router.delete("/articles/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_article(
    article_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    기사를 삭제합니다.
    """
    # TODO: 데이터베이스에서 기사 삭제
    # 예:
    # db_article = db.query(Article).filter(Article.id == article_id).first()
    # if not db_article:
    #     raise HTTPException(status_code=404, detail="기사를 찾을 수 없습니다")
    # 
    # # 권한 확인
    # if db_article.author_id != current_user["user_id"]:
    #     raise HTTPException(status_code=403, detail="삭제 권한이 없습니다")
    # 
    # db.delete(db_article)
    # db.commit()
    return None

@router.post("/articles/{article_id}/views", response_model=ViewsResponse)
async def increment_views(
    article_id: int,
    db: Session = Depends(get_db)
):
    """
    기사 조회수를 1 증가시킵니다.
    인증 없이도 호출 가능 (조회수는 공개 데이터)
    """
    # TODO: 데이터베이스에서 기사 조회 및 조회수 증가
    # 예:
    # db_article = db.query(Article).filter(Article.id == article_id).first()
    # if not db_article:
    #     raise HTTPException(status_code=404, detail="기사를 찾을 수 없습니다")
    # 
    # db_article.views += 1
    # db.commit()
    # db.refresh(db_article)
    # return ViewsResponse(views=db_article.views)
    
    # 임시 응답
    return ViewsResponse(views=1)

@router.patch("/articles/{article_id}/status", response_model=ArticleResponse)
async def update_article_status(
    article_id: int,
    status_update: StatusUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    기사 상태를 변경합니다.
    """
    # TODO: 데이터베이스에서 기사 조회 및 상태 업데이트
    # 예:
    # db_article = db.query(Article).filter(Article.id == article_id).first()
    # if not db_article:
    #     raise HTTPException(status_code=404, detail="기사를 찾을 수 없습니다")
    # 
    # # 권한 확인 (작성자 또는 관리자만)
    # if db_article.author_id != current_user["user_id"]:
    #     raise HTTPException(status_code=403, detail="상태 변경 권한이 없습니다")
    # 
    # db_article.status = status_update.status
    # db_article.updated_at = datetime.now()
    # db.commit()
    # db.refresh(db_article)
    # return db_article
    
    raise HTTPException(status_code=404, detail="기사를 찾을 수 없습니다")

# ============================================
# 데이터베이스 의존성 (예시)
# ============================================

def get_db():
    """
    데이터베이스 세션을 생성합니다.
    실제 구현은 백엔드의 데이터베이스 설정에 맞게 수정하세요.
    """
    # 예: 
    # from app.db.database import SessionLocal
    # db = SessionLocal()
    # try:
    #     yield db
    # finally:
    #     db.close()
    pass

# ============================================
# 데이터베이스 모델 예시 (SQLAlchemy)
# ============================================
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from app.db.database import Base

class Article(Base):
    __tablename__ = "articles"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text)  # 미리보기
    fullContent = Column(Text)  # 전체 본문
    date = Column(String)
    reporter = Column(String)
    department = Column(String)
    email = Column(String)
    image = Column(Text)  # 이미지 URL 또는 base64
    tags = Column(JSON)  # 또는 Text로 JSON 문자열 저장
    views = Column(Integer, default=0)
    status = Column(String, default="draft")  # draft, review, published, archived
    author_id = Column(Integer, nullable=False)  # 작성자 ID
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
"""
