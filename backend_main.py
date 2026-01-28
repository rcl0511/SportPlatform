"""
Render 배포용 FastAPI 백엔드 메인 파일
CORS 및 JWT 인증이 포함된 완전한 백엔드 예시
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
import os
import requests
from bs4 import BeautifulSoup
import re

# Playwright는 선택적 의존성 (설치되어 있으면 사용)
try:
    from playwright.async_api import async_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False

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
        "http://localhost:3000",  # 로컬 개발 (CRA 기본 포트)
        "http://localhost:3001",  # 로컬 개발 (현재 사용 중인 포트)
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

# ============================================
# 네이버 스포츠 야구 뉴스 API
# ============================================

@app.get("/api/naver-baseball-articles")
async def get_naver_baseball_articles():
    """
    네이버 스포츠 야구 뉴스 페이지에서 최신 기사를 가져옵니다.
    https://m.sports.naver.com/kbaseball/news
    """
    url = "https://m.sports.naver.com/kbaseball/news"
    html_content = None
    
    # Playwright 사용 시도 (JavaScript 렌더링 필요)
    if PLAYWRIGHT_AVAILABLE:
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    viewport={'width': 1920, 'height': 1080}
                )
                page = await context.new_page()
                await page.goto(url, wait_until='networkidle', timeout=30000)
                # 기사 목록이 로드될 때까지 대기
                try:
                    await page.wait_for_selector('a[href*="sports.news"], a[href*="news.naver"], .news_item, .article_item', timeout=5000)
                except:
                    pass
                html_content = await page.content()
                await browser.close()
        except Exception as e:
            # Playwright 실패 시 requests로 fallback
            pass
    
    # Playwright가 없거나 실패한 경우 requests 사용
    if not html_content:
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
            }
            response = requests.get(url, headers=headers, timeout=15)
            response.encoding = "utf-8"
            if response.status_code == 200:
                html_content = response.text
        except Exception as e:
            return JSONResponse({
                "success": False,
                "articles": [],
                "error": f"네이버 스포츠 접근 실패: {str(e)}",
            })
    
    if not html_content:
        return JSONResponse({
            "success": False,
            "articles": [],
            "error": "HTML 콘텐츠를 가져올 수 없습니다.",
        })
    
    try:
        soup = BeautifulSoup(html_content, "html.parser")
        articles = []
        
        # 여러 방법으로 기사 찾기
        # 방법 1: 기사 링크가 있는 a 태그 찾기
        for a in soup.find_all("a", href=True):
            href = a.get("href", "")
            # 네이버 스포츠 기사 URL 패턴
            if "sports.news" in href or "news.naver" in href or "/kbaseball/news/" in href or "sports.naver.com/news" in href:
                if href.startswith("//"):
                    href = "https:" + href
                elif href.startswith("/"):
                    href = "https://m.sports.naver.com" + href
                
                # 제목 추출 (여러 방법 시도)
                title = ""
                title_el = a.find(class_=re.compile("title|headline|tit|text|subject", re.I))
                if title_el:
                    title = title_el.get_text(strip=True)
                else:
                    # 직접 텍스트 추출
                    title = a.get_text(strip=True)
                
                if not title or len(title) < 5:
                    continue
                
                # 이미지 추출
                img = a.find("img")
                image = ""
                if img:
                    image = img.get("src") or img.get("data-src") or img.get("data-lazy-src") or ""
                if image and not image.startswith("http"):
                    image = "https:" + image if image.startswith("//") else "https://m.sports.naver.com" + image
                
                # 날짜 추출
                date_el = a.find(class_=re.compile("date|time|info|date_time", re.I))
                date_text = date_el.get_text(strip=True) if date_el else ""
                
                articles.append({
                    "title": title[:200],
                    "link": href,
                    "image": image or "",
                    "date": date_text or "",
                    "source": "네이버 스포츠",
                })
        
        # 방법 2: 기사 리스트 아이템 찾기
        news_items = soup.find_all(class_=re.compile("news_item|article_item|list_item|news_list", re.I))
        for item in news_items:
            link_elem = item.find("a", href=True)
            if not link_elem:
                continue
            
            href = link_elem.get("href", "")
            if not href or ("sports.news" not in href and "news.naver" not in href):
                continue
            
            if href.startswith("//"):
                href = "https:" + href
            elif href.startswith("/"):
                href = "https://m.sports.naver.com" + href
            
            title_elem = item.find(class_=re.compile("title|headline|tit|subject", re.I))
            title = title_elem.get_text(strip=True) if title_elem else link_elem.get_text(strip=True)
            
            if not title or len(title) < 5:
                continue
            
            img_elem = item.find("img")
            image = ""
            if img_elem:
                image = img_elem.get("src") or img_elem.get("data-src") or img_elem.get("data-lazy-src") or ""
            if image and not image.startswith("http"):
                image = "https:" + image if image.startswith("//") else "https://m.sports.naver.com" + image
            
            date_elem = item.find(class_=re.compile("date|time|info", re.I))
            date_text = date_elem.get_text(strip=True) if date_elem else ""
            
            articles.append({
                "title": title[:200],
                "link": href,
                "image": image or "",
                "date": date_text or "",
                "source": "네이버 스포츠",
            })
        # 제목 기준 중복 제거, 최대 10개
        seen = set()
        unique = []
        for art in articles:
            key = art["title"][:80]
            if key not in seen and len(unique) < 10:
                seen.add(key)
                unique.append(art)
        
        # 디버깅 정보
        debug_info = {
            "html_length": len(html_content),
            "total_links_found": len(soup.find_all("a", href=True)),
            "articles_found": len(articles),
            "unique_articles": len(unique),
            "playwright_used": PLAYWRIGHT_AVAILABLE and html_content is not None
        }
        
        return JSONResponse({
            "success": True if unique else False,
            "articles": unique,
            "count": len(unique),
            "date": datetime.now().strftime("%Y-%m-%d"),
            "debug": debug_info if not unique else None,
            "error": "기사를 찾을 수 없습니다. 네이버 스포츠 페이지 구조가 변경되었을 수 있습니다." if not unique else None
        })
    except requests.exceptions.RequestException as e:
        return JSONResponse({
            "success": False,
            "articles": [],
            "error": f"네트워크 오류: {str(e)}",
        })
    except Exception as e:
        return JSONResponse({
            "success": False,
            "articles": [],
            "error": f"스크래핑 오류: {str(e)}",
        })

# ============================================
# KBO 일정 API
# ============================================

@app.get("/api/kbo-schedule")
async def get_kbo_schedule():
    """
    KBO 경기 일정을 가져옵니다.
    Playwright가 있으면 사용하고, 없으면 requests로 시도합니다.
    """
    url = "https://www.koreabaseball.com/Schedule/Schedule.aspx"
    html_content = None
    
    # Playwright 사용 시도
    if PLAYWRIGHT_AVAILABLE:
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    viewport={'width': 1920, 'height': 1080}
                )
                page = await context.new_page()
                await page.goto(url, wait_until='networkidle', timeout=30000)
                try:
                    await page.wait_for_selector('table, .schedule, [class*="schedule"], [id*="schedule"]', timeout=5000)
                except:
                    pass
                html_content = await page.content()
                await browser.close()
        except Exception as e:
            # Playwright 실패 시 requests로 fallback
            pass
    
    # Playwright가 없거나 실패한 경우 requests 사용
    if not html_content:
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            }
            response = requests.get(url, headers=headers, timeout=15)
            response.encoding = 'utf-8'
            if response.status_code == 200:
                html_content = response.text
        except Exception as e:
            return JSONResponse({
                "success": False,
                "games": [],
                "error": f"웹사이트 접근 실패: {str(e)}"
            })
    
    if not html_content:
        return JSONResponse({
            "success": False,
            "games": [],
            "error": "HTML 콘텐츠를 가져올 수 없습니다."
        })
    
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        games = []
        
        # KBO 웹사이트의 경기 일정 테이블 찾기 (여러 방법 시도)
        schedule_table = soup.find('table', {'id': 'scheduleTable'}) or \
                        soup.find('table', class_=re.compile('schedule', re.I)) or \
                        soup.find('div', class_=re.compile('schedule', re.I)) or \
                        soup.find('div', id=re.compile('schedule', re.I)) or \
                        soup.find('table') or \
                        soup.find('tbody') or \
                        soup.find('ul', class_=re.compile('schedule|game|match', re.I))
        
        debug_info = {
            "html_length": len(html_content),
            "found_table": schedule_table is not None,
            "table_name": schedule_table.name if schedule_table else None
        }
        
        if schedule_table:
            # 테이블이 있으면 행 찾기
            if schedule_table.name == 'table':
                rows = schedule_table.find_all('tr')
            else:
                # div인 경우 경기 항목 찾기
                rows = schedule_table.find_all(['div', 'li'], class_=re.compile('game|match|schedule', re.I))
            
            for row in rows[1:] if schedule_table.name == 'table' else rows:  # 헤더 제외
                try:
                    if schedule_table.name == 'table':
                        cells = row.find_all(['td', 'th'])
                        if len(cells) < 2:
                            continue
                        
                        date_text = cells[0].get_text(strip=True) if len(cells) > 0 else ''
                        time_text = cells[1].get_text(strip=True) if len(cells) > 1 else ''
                        game_text = cells[2].get_text(strip=True) if len(cells) > 2 else ''
                        stadium_text = cells[-1].get_text(strip=True) if len(cells) > 3 else ''
                    else:
                        # div 구조인 경우
                        date_text = row.find(class_=re.compile('date', re.I))
                        date_text = date_text.get_text(strip=True) if date_text else ''
                        time_text = row.find(class_=re.compile('time', re.I))
                        time_text = time_text.get_text(strip=True) if time_text else ''
                        game_text = row.find(class_=re.compile('game|match|vs', re.I))
                        game_text = game_text.get_text(strip=True) if game_text else ''
                        stadium_text = row.find(class_=re.compile('stadium|venue', re.I))
                        stadium_text = stadium_text.get_text(strip=True) if stadium_text else ''
                    
                    # 날짜 파싱 (예: "01.27(월)" 또는 "2025.01.27")
                    date_match = re.search(r'(\d{2,4})\.(\d{2})\.?(\d{2})?', date_text)
                    if date_match:
                        if date_match.group(3):  # YYYY.MM.DD 형식
                            year = int(date_match.group(1))
                            month = int(date_match.group(2))
                            day = int(date_match.group(3))
                        else:  # MM.DD 형식
                            year = datetime.now().year
                            month = int(date_match.group(1))
                            day = int(date_match.group(2))
                        
                        try:
                            date_obj = datetime(year, month, day)
                            
                            # 경기 팀 추출
                            teams_match = re.search(r'([가-힣A-Z\s]+)\s*(?:vs|VS|대)\s*([가-힣A-Z\s]+)', game_text)
                            home = teams_match.group(1).strip() if teams_match else ''
                            away = teams_match.group(2).strip() if teams_match else ''
                            
                            games.append({
                                "date": date_obj.strftime("%Y-%m-%d"),
                                "dateText": date_text,
                                "time": time_text,
                                "timeText": time_text,
                                "play": game_text,
                                "playText": game_text,
                                "stadium": stadium_text,
                                "home": home,
                                "away": away
                            })
                        except ValueError:
                            continue
                except Exception:
                    continue
        
        # 데이터가 없으면 빈 배열 반환 (디버깅 정보 포함)
        if not games:
            if schedule_table:
                if schedule_table.name == 'table':
                    rows = schedule_table.find_all('tr')
                    debug_info["rows_found"] = len(rows)
                    debug_info["parsing_attempts"] = len(rows[1:]) if len(rows) > 1 else 0
                    # 첫 번째 행 샘플 확인
                    if len(rows) > 1:
                        first_row_cells = rows[1].find_all(['td', 'th'])
                        debug_info["first_row_cells"] = len(first_row_cells)
                        debug_info["first_row_text"] = rows[1].get_text(strip=True)[:100] if rows[1] else None
                else:
                    rows = schedule_table.find_all(['div', 'li'], class_=re.compile('game|match|schedule', re.I))
                    debug_info["rows_found"] = len(rows)
                    debug_info["parsing_attempts"] = len(rows)
            else:
                debug_info["rows_found"] = 0
                debug_info["parsing_attempts"] = 0
                # HTML 샘플 확인 (처음 500자)
                debug_info["html_sample"] = html_content[:500] if html_content else None
                # 테이블 태그가 있는지 확인
                all_tables = soup.find_all('table')
                debug_info["total_tables_found"] = len(all_tables)
                if all_tables:
                    debug_info["first_table_id"] = all_tables[0].get('id', 'no-id')
                    debug_info["first_table_class"] = all_tables[0].get('class', [])
        
        return JSONResponse({
            "success": True if games else False,
            "games": games,
            "count": len(games),
            "debug": debug_info if not games else None,
            "error": "경기 일정을 찾을 수 없습니다. KBO 웹사이트 구조가 변경되었을 수 있습니다." if not games else None
        })
        
    except requests.exceptions.RequestException as e:
        return JSONResponse({
            "success": False,
            "games": [],
            "error": f"네트워크 오류: {str(e)}"
        })
    except Exception as e:
        return JSONResponse({
            "success": False,
            "games": [],
            "error": f"스크래핑 오류: {str(e)}"
        })

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
