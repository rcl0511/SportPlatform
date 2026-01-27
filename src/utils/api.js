/**
 * 백엔드 API 유틸리티
 * 인증 토큰을 포함한 API 호출 헬퍼 함수들
 * 실제 백엔드 API만 사용 (localStorage fallback 없음)
 */

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

if (!API_BASE) {
  console.error('REACT_APP_API_BASE가 설정되지 않았습니다. .env 파일을 확인하세요.');
}

// 인증 토큰 가져오기
function getAuthToken() {
  return localStorage.getItem('token');
}

// 인증 헤더 생성
function getAuthHeaders() {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}

// API 호출 래퍼 (에러 처리 포함)
async function apiCall(url, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    // 401 Unauthorized: 토큰 만료 또는 인증 실패
    if (response.status === 401) {
      const token = getAuthToken();
      if (token) {
        // 토큰이 있지만 만료된 경우, 로그아웃 처리
        console.warn('인증 토큰이 만료되었거나 유효하지 않습니다.');
        localStorage.removeItem('token');
        localStorage.removeItem('user_info');
        localStorage.removeItem('isLoggedIn');
        
        // 로그인 페이지로 리다이렉트 (현재 페이지가 로그인 페이지가 아닌 경우)
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '인증이 필요합니다. 다시 로그인해주세요.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API 오류: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API 호출 실패:', error);
    throw error;
  }
}

// 기사 관련 API
export const articleAPI = {
  // 기사 목록 가져오기
  async getArticles() {
    const response = await apiCall('/api/articles');
    // 백엔드 응답 형식에 맞게 조정 (배열이면 { articles: ... } 형태로)
    if (Array.isArray(response)) {
      return { articles: response, success: true };
    }
    return response;
  },

  // 기사 상세 가져오기
  async getArticle(id) {
    return await apiCall(`/api/articles/${id}`);
  },

  // 기사 조회수 증가
  async incrementViews(articleId) {
    return await apiCall(`/api/articles/${articleId}/views`, {
      method: 'POST',
    });
  },

  // 기사 생성
  async createArticle(articleData) {
    return await apiCall('/api/articles', {
      method: 'POST',
      body: JSON.stringify(articleData),
    });
  },

  // 기사 수정
  async updateArticle(articleId, articleData) {
    return await apiCall(`/api/articles/${articleId}`, {
      method: 'PUT',
      body: JSON.stringify(articleData),
    });
  },

  // 기사 삭제
  async deleteArticle(articleId) {
    return await apiCall(`/api/articles/${articleId}`, {
      method: 'DELETE',
    });
  },

  // 기사 상태 변경
  async updateArticleStatus(articleId, status) {
    return await apiCall(`/api/articles/${articleId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// 인증 관련 API
export const authAPI = {
  async login(username, password) {
    return await apiCall('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  async register(userData) {
    return await apiCall('/api/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async kakaoLogin(kakaoUser) {
    return await apiCall('/api/kakao-login', {
      method: 'POST',
      body: JSON.stringify(kakaoUser),
    });
  },

  async getCurrentUser() {
    return await apiCall('/api/users/me');
  },
};

export default {
  articleAPI,
  authAPI,
  getAuthToken,
  getAuthHeaders,
};
