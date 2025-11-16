/**
 * API 服務層
 */
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器
apiClient.interceptors.request.use(
  (config) => {
    // 可以在這裡添加 token
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 響應攔截器
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.detail || error.message || '請求失敗';
    return Promise.reject(new Error(message));
  }
);

// API 方法
export const demandAPI = {
  // 獲取物料列表
  getItems: () => apiClient.get('/api/items'),

  // 獲取歷史需求數據
  getDemandHistory: (itemId, limit = 100) =>
    apiClient.get(`/api/demand-history/${itemId}`, { params: { limit } }),

  // 創建歷史需求記錄
  createDemandHistory: (data) =>
    apiClient.post('/api/demand-history/', data),

  // 批量創建歷史需求記錄
  createDemandHistoryBatch: (records) =>
    apiClient.post('/api/demand-history/batch', { records }),

  // 生成預測
  generateForecast: (data) =>
    apiClient.post('/api/forecast/', data),

  // 檢測異常
  detectAnomalies: (itemId, contamination = 0.1) =>
    apiClient.get(`/api/anomalies/${itemId}`, { params: { contamination } }),

  // 健康檢查
  healthCheck: () => apiClient.get('/health'),
};

export default apiClient;
