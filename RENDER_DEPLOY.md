# Render 배포 가이드

## 1. Render에 백엔드 배포하기

### Step 1: GitHub에 코드 푸시
```bash
git add .
git commit -m "Add backend for Render deployment"
git push origin main
```

### Step 2: Render 웹사이트에서 설정

1. [Render.com](https://render.com)에 로그인
2. "New +" 버튼 클릭 → "Web Service" 선택
3. GitHub 저장소 연결
4. 설정:
   - **Name**: `sports-platform-backend` (또는 원하는 이름)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend_main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: (비워두기)

### Step 3: 환경 변수 설정

Render 대시보드에서 "Environment" 탭으로 이동하여 추가:

- **SECRET_KEY**: JWT 토큰 암호화용 비밀키 (랜덤 문자열 생성)
  - 예: `openssl rand -hex 32` 명령어로 생성하거나 Render의 "Generate" 버튼 사용

### Step 4: CORS 설정 업데이트

`backend_main.py` 파일의 `allow_origins` 리스트에 프론트엔드 주소 추가:

```python
allow_origins=[
    "http://localhost:3000",  # 로컬 개발
    "https://your-frontend-domain.netlify.app",  # Netlify 배포 주소
    "https://your-frontend-domain.onrender.com",  # Render 프론트엔드 주소
],
```

## 2. 프론트엔드 설정 업데이트

### `.env` 파일 수정

Render에서 배포한 백엔드 주소로 변경:

```env
REACT_APP_API_BASE=https://your-backend-name.onrender.com
```

예시:
```env
REACT_APP_API_BASE=https://sports-platform-backend.onrender.com
```

### 프론트엔드 재배포

Netlify나 다른 플랫폼에 재배포하면 새로운 백엔드 주소로 연결됩니다.

## 3. 테스트

### 백엔드 헬스 체크
```bash
curl https://your-backend-name.onrender.com/health
```

### API 테스트
```bash
# 회원가입
curl -X POST https://your-backend-name.onrender.com/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "홍",
    "last_name": "길동",
    "email": "test@example.com",
    "username": "testuser",
    "password": "test1234"
  }'
```

## 4. 주의사항

### CORS 설정
- 프론트엔드 도메인을 정확히 `allow_origins`에 추가해야 합니다
- `http://`와 `https://`를 구분해야 합니다
- 와일드카드 `*`는 프로덕션에서 사용하지 마세요

### 보안
- `SECRET_KEY`는 반드시 환경 변수로 설정하세요
- Render의 "Generate" 기능을 사용하여 강력한 키 생성
- 실제 운영 시 데이터베이스 사용 권장 (현재는 메모리 저장)

### 데이터베이스 추가 (선택사항)
실제 운영을 위해서는 PostgreSQL 등 데이터베이스를 추가하세요:

1. Render에서 "New +" → "PostgreSQL" 선택
2. 데이터베이스 생성
3. 환경 변수에 `DATABASE_URL` 추가
4. `backend_main.py`에서 SQLAlchemy로 데이터베이스 연결

## 5. 문제 해결

### 백엔드가 응답하지 않을 때
- Render 로그 확인: "Logs" 탭에서 에러 확인
- 포트 확인: `$PORT` 환경 변수 사용 확인
- 빌드 실패: `requirements.txt` 의존성 확인

### CORS 에러
- 브라우저 콘솔에서 정확한 에러 메시지 확인
- `allow_origins`에 프론트엔드 주소가 정확히 포함되어 있는지 확인
- 프론트엔드가 `https://`인지 `http://`인지 확인

### 인증 오류
- JWT 토큰이 제대로 생성되는지 확인
- `SECRET_KEY`가 설정되어 있는지 확인
- 토큰 만료 시간 확인 (기본 30분)

## 6. 참고 파일

- `backend_main.py` - 백엔드 메인 파일
- `requirements.txt` - Python 의존성
- `render.yaml` - Render 설정 파일 (선택사항)
