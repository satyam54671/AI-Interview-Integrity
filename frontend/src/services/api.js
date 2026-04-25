class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    this.token = null;
  }

  // Set JWT token for authentication
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('jwt_token', token);
    } else {
      localStorage.removeItem('jwt_token');
    }
  }

  // Get JWT token from localStorage
  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('jwt_token');
    }
    return this.token;
  }

  // Make authenticated API requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          this.setToken(null);
          throw new Error('Authentication failed. Please login again.');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request error [${endpoint}]:`, error);
      throw error;
    }
  }

  // HTTP Methods
  async get(endpoint) { return this.request(endpoint, { method: 'GET' }); }
  async post(endpoint, data) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) }); }
  async put(endpoint, data) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data) }); }
  async delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }

  // Session endpoints
  async getSessions() { return this.get('/sessions'); }
  async getSession(sessionId) { return this.get(`/sessions/${sessionId}`); }
  async createSession(sessionData) { return this.post('/sessions', sessionData); }
  async updateSession(sessionId, sessionData) { return this.put(`/sessions/${sessionId}`, sessionData); }
  async deleteSession(sessionId) { return this.delete(`/sessions/${sessionId}`); }

  // Alert endpoints
  async getAlerts(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.get(`/alerts?${params.toString()}`);
  }
  async getAlert(alertId) { return this.get(`/alerts/${alertId}`); }
  async createAlert(alertData) { return this.post('/alerts', alertData); }
  async updateAlert(alertId, alertData) { return this.put(`/alerts/${alertId}`, alertData); }

  // Analytics endpoints
  async getAnalytics(sessionId = null) {
    const endpoint = sessionId ? `/analytics?session_id=${sessionId}` : '/analytics';
    return this.get(endpoint);
  }
  async getRiskScore(sessionId) { return this.get(`/sessions/${sessionId}/risk-score`); }
  async getSessionHistory(sessionId) { return this.get(`/sessions/${sessionId}/history`); }

  // Auth endpoints
  async login(credentials) {
    const response = await this.post('/auth/login', credentials);
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    return response;
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } finally {
      this.setToken(null);
    }
  }

  async refreshToken() {
    const response = await this.post('/auth/refresh');
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    return response;
  }

  // User endpoints
  async getCurrentUser() { return this.get('/users/me'); }
  async updateProfile(profileData) { return this.put('/users/me', profileData); }

  // System endpoints
  async getSystemStatus() { return this.get('/system/status'); }
  async getSystemStats() { return this.get('/system/stats'); }
}

const apiService = new ApiService();
export default apiService;
