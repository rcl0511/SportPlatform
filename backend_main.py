"""
Render 배포용 FastAPI 백엔드 메인 파일
CORS 및 JWT 인증이 포함된 완전한 백엔드 예시
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
import os

# JWT 설정
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# 비밀번호 해싱
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="Sports Platform API")

# ============================================
# CORS 설정 (프론트엔드 도메인 허용)
# ============================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # 로컬 개발
        "https://sportsnewsai.netlify.app",  # Netlify 배포 주소
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# 보안 설정
# ============================================
security = HTTPBearer()

# ============================================
# Pydantic 모델
# ============================================

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class KakaoUser(BaseModel):
    email: str
    nickname: str
    kakaoId: str

class ArticleCreate(BaseModel):
    title: str
    content: str
    fullContent: Optional[str] = None
    date: Optional[str] = None
    reporter: Optional[str] = None
    department: Optional[str] = None
    email: Optional[str] = None
    image: Optional[str] = None
    tags: Optional[List[str]] = None
    views: int = 0
    status: str = "draft"

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

class StatusUpdate(BaseModel):
    status: str

class UserResponse(BaseModel):
    id: int
    email: str
    nickname: str
    department: Optional[str] = None

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

class TokenResponse(BaseModel):
    access_token: str
    user: UserResponse

class ViewsResponse(BaseModel):
    views: int

# ============================================
# 인증 유틸리티 함수
# ============================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": user_id}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# ============================================
# 임시 데이터베이스 (실제로는 SQLAlchemy 사용)
# ============================================
# 실제 운영 시에는 데이터베이스를 사용하세요
users_db = []
articles_db = []
next_user_id = 1
next_article_id = 1

# ============================================
# 인증 관련 엔드포인트
# ============================================

@app.post("/api/register", response_model=TokenResponse)
async def register(user: UserCreate):
    """회원가입"""
    # 중복 체크
    if any(u["email"] == user.email for u in users_db):
        raise HTTPException(status_code=400, detail="Email already registered")
    if any(u["username"] == user.username for u in users_db):
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # 비밀번호 해싱
    hashed_password = hash_password(user.password)
    
    # 사용자 생성
    global next_user_id
    new_user = {
        "id": next_user_id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "phone": user.phone,
        "username": user.username,
        "password": hashed_password,
        "department": "",
    }
    users_db.append(new_user)
    next_user_id += 1
    
    # JWT 토큰 생성
    access_token = create_access_token(data={"sub": new_user["id"]})
    
    return {
        "access_token": access_token,
        "user": {
            "id": new_user["id"],
            "email": new_user["email"],
            "nickname": f"{new_user['first_name']}{new_user['last_name']}",
            "department": new_user["department"],
        }
    }

@app.post("/api/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """로그인"""
    # 사용자 찾기
    user = next((u for u in users_db if u["username"] == credentials.username), None)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # 비밀번호 확인
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # JWT 토큰 생성
    access_token = create_access_token(data={"sub": user["id"]})
    
    return {
        "access_token": access_token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "nickname": f"{user['first_name']}{user['last_name']}",
            "department": user["department"],
        }
    }

@app.post("/api/kakao-login", response_model=TokenResponse)
async def kakao_login(kakao_user: KakaoUser):
    """카카오 로그인"""
    # 카카오 사용자 찾기 또는 생성
    user = next((u for u in users_db if u.get("kakaoId") == kakao_user.kakaoId), None)
    
    if not user:
        # 새 사용자 생성
        global next_user_id
        new_user = {
            "id": next_user_id,
            "email": kakao_user.email or f"kakao_{kakao_user.kakaoId}@kakao.com",
            "nickname": kakao_user.nickname,
            "first_name": kakao_user.nickname[:1] if kakao_user.nickname else "",
            "last_name": kakao_user.nickname[1:] if len(kakao_user.nickname) > 1 else "",
            "kakaoId": kakao_user.kakaoId,
            "department": "",
        }
        users_db.append(new_user)
        user = new_user
        next_user_id += 1
    
    # JWT 토큰 생성
    access_token = create_access_token(data={"sub": user["id"]})
    
    return {
        "access_token": access_token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "nickname": user.get("nickname", f"{user.get('first_name', '')}{user.get('last_name', '')}"),
            "department": user.get("department", ""),
        }
    }

@app.get("/api/users/me", response_model=UserResponse)
async def get_current_user(current_user: dict = Depends(verify_token)):
    """현재 사용자 정보 가져오기"""
    user_id = current_user["user_id"]
    user = next((u for u in users_db if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user["id"],
        "email": user["email"],
        "nickname": user.get("nickname", f"{user.get('first_name', '')}{user.get('last_name', '')}"),
        "department": user.get("department", ""),
    }

# ============================================
# 기사 관련 엔드포인트
# ============================================

@app.get("/api/articles", response_model=List[ArticleResponse])
async def get_articles(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None
):
    """기사 목록 가져오기"""
    articles = articles_db
    if status:
        articles = [a for a in articles if a.get("status") == status]
    return articles[skip:skip+limit]

@app.get("/api/articles/{article_id}", response_model=ArticleResponse)
async def get_article(article_id: int):
    """기사 상세 가져오기"""
    article = next((a for a in articles_db if a["id"] == article_id), None)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@app.post("/api/articles", response_model=ArticleResponse, status_code=status.HTTP_201_CREATED)
async def create_article(
    article: ArticleCreate,
    current_user: dict = Depends(verify_token)
):
    """기사 생성"""
    global next_article_id
    new_article = {
        "id": next_article_id,
        "title": article.title,
        "content": article.content,
        "fullContent": article.fullContent,
        "date": article.date or datetime.now().isoformat(),
        "reporter": article.reporter,
        "department": article.department,
        "email": article.email,
        "image": article.image,
        "tags": article.tags or [],
        "views": article.views,
        "status": article.status,
        "author_id": current_user["user_id"],
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }
    articles_db.append(new_article)
    next_article_id += 1
    return new_article

@app.put("/api/articles/{article_id}", response_model=ArticleResponse)
async def update_article(
    article_id: int,
    article_update: ArticleUpdate,
    current_user: dict = Depends(verify_token)
):
    """기사 수정"""
    article = next((a for a in articles_db if a["id"] == article_id), None)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # 권한 확인
    if article.get("author_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # 업데이트
    update_data = article_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        article[key] = value
    article["updated_at"] = datetime.now()
    
    return article

@app.delete("/api/articles/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_article(
    article_id: int,
    current_user: dict = Depends(verify_token)
):
    """기사 삭제"""
    article = next((a for a in articles_db if a["id"] == article_id), None)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # 권한 확인
    if article.get("author_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    articles_db.remove(article)
    return None

@app.post("/api/articles/{article_id}/views", response_model=ViewsResponse)
async def increment_views(article_id: int):
    """조회수 증가 (인증 불필요)"""
    article = next((a for a in articles_db if a["id"] == article_id), None)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    article["views"] = article.get("views", 0) + 1
    return {"views": article["views"]}

@app.patch("/api/articles/{article_id}/status", response_model=ArticleResponse)
async def update_article_status(
    article_id: int,
    status_update: StatusUpdate,
    current_user: dict = Depends(verify_token)
):
    """기사 상태 변경"""
    article = next((a for a in articles_db if a["id"] == article_id), None)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # 권한 확인
    if article.get("author_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    article["status"] = status_update.status
    article["updated_at"] = datetime.now()
    return article

# ============================================
# 헬스 체크
# ============================================

@app.get("/")
async def root():
    return {"message": "Sports Platform API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
