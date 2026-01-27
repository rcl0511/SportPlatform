# 백엔드 작동 확인 가이드

## 1. 헬스 체크 (가장 간단한 방법)

브라우저에서 다음 URL을 열어보세요:

```
https://sportplatform.onrender.com/health
```

**정상 응답:**
```json
{"status": "healthy"}
```

**또는 루트 경로:**
```
https://sportplatform.onrender.com/
```

**정상 응답:**
```json
{
  "message": "Sports Platform API",
  "status": "running"
}
```

## 2. API 문서 확인

FastAPI는 자동으로 API 문서를 생성합니다:

```
https://sportplatform.onrender.com/docs
```

브라우저에서 열면 Swagger UI가 표시되며, 모든 API 엔드포인트를 테스트할 수 있습니다.

## 3. 회원가입 테스트

### 브라우저 개발자 도구 사용 (가장 쉬움)

1. 브라우저에서 F12 눌러서 개발자 도구 열기
2. **Console** 탭으로 이동
3. 다음 코드 붙여넣기:

```javascript
fetch('https://sportplatform.onrender.com/api/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    first_name: '테스트',
    last_name: '사용자',
    email: 'test@example.com',
    username: 'testuser',
    password: 'test1234'
  })
})
.then(res => res.json())
.then(data => console.log('성공:', data))
.catch(err => console.error('실패:', err));
```

**정상 응답 예시:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "nickname": "테스트사용자",
    "department": ""
  }
}
```

## 4. 로그인 테스트

위에서 만든 계정으로 로그인:

```javascript
fetch('https://sportplatform.onrender.com/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'testuser',
    password: 'test1234'
  })
})
.then(res => res.json())
.then(data => {
  console.log('로그인 성공:', data);
  console.log('토큰:', data.access_token);
})
.catch(err => console.error('로그인 실패:', err));
```

## 5. 기사 목록 가져오기

```javascript
fetch('https://sportplatform.onrender.com/api/articles')
.then(res => res.json())
.then(data => console.log('기사 목록:', data))
.catch(err => console.error('실패:', err));
```

**정상 응답:**
```json
[]
```
(아직 기사가 없으면 빈 배열)

## 6. 프론트엔드에서 테스트

1. https://sportsnewsai.netlify.app/ 접속
2. 브라우저 개발자 도구 (F12) → **Network** 탭 열기
3. 회원가입 또는 로그인 시도
4. Network 탭에서 `sportplatform.onrender.com`으로 요청이 가는지 확인
5. 응답 상태 코드가 200 또는 201인지 확인

## 7. Render 로그 확인

1. Render 대시보드 접속: https://dashboard.render.com
2. 백엔드 서비스 클릭
3. **Logs** 탭 확인
4. 다음과 같은 메시지가 보이면 정상:
   ```
   INFO:     Started server process
   INFO:     Waiting for application startup.
   INFO:     Application startup complete.
   INFO:     Uvicorn running on http://0.0.0.0:XXXX
   ```

## 문제 해결

### 연결이 안 될 때
- Render 서비스가 "Live" 상태인지 확인
- URL이 정확한지 확인 (`https://sportplatform.onrender.com`)

### CORS 에러가 나올 때
- `backend_main.py`의 CORS 설정 확인
- 프론트엔드 주소가 `allow_origins`에 포함되어 있는지 확인

### 401 인증 오류
- 토큰이 제대로 생성되었는지 확인
- SECRET_KEY가 Render 환경 변수에 설정되어 있는지 확인
