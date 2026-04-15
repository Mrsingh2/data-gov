import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
});

// Attach JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const isLoginPage =
        window.location.pathname === '/auth/login' ||
        window.location.pathname === '/auth/register';
      if (!isLoginPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;

// ── Auth ──────────────────────────────────────────────────────

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// ── Datasets ──────────────────────────────────────────────────

export const datasetsApi = {
  search: (params?: Record<string, any>) => api.get('/datasets', { params }),
  findOne: (id: string) => api.get(`/datasets/${id}`),
  create: (data: any) => api.post('/datasets', data),
  update: (id: string, data: any) => api.patch(`/datasets/${id}`, data),
  delete: (id: string) => api.delete(`/datasets/${id}`),
  mine: () => api.get('/datasets/mine'),
};

// ── Upload ────────────────────────────────────────────────────

export const uploadApi = {
  uploadCsv: (datasetId: string, file: File, changeNote?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (changeNote) form.append('changeNote', changeNote);
    return api.post(`/upload/csv/${datasetId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ── Versions ──────────────────────────────────────────────────

export const versionsApi = {
  metadata: (datasetId: string) => api.get(`/datasets/${datasetId}/versions/metadata`),
  data: (datasetId: string) => api.get(`/datasets/${datasetId}/versions/data`),
};

// ── Protection ────────────────────────────────────────────────

export const protectionApi = {
  getColumnRules: (datasetId: string) => api.get(`/datasets/${datasetId}/protection/columns`),
  addColumnRule: (datasetId: string, data: any) =>
    api.post(`/datasets/${datasetId}/protection/columns`, data),
  deleteColumnRule: (datasetId: string, ruleId: string) =>
    api.delete(`/datasets/${datasetId}/protection/columns/${ruleId}`),
  getRowRules: (datasetId: string) => api.get(`/datasets/${datasetId}/protection/rows`),
  addRowRule: (datasetId: string, data: any) =>
    api.post(`/datasets/${datasetId}/protection/rows`, data),
  deleteRowRule: (datasetId: string, ruleId: string) =>
    api.delete(`/datasets/${datasetId}/protection/rows/${ruleId}`),
};

// ── Preview ───────────────────────────────────────────────────

export const previewApi = {
  get: (datasetId: string) => api.get(`/datasets/${datasetId}/preview`),
  sample: (datasetId: string) => api.get(`/datasets/${datasetId}/preview/sample`),
};

// ── Access ────────────────────────────────────────────────────

export const accessApi = {
  request: (datasetId: string, message?: string) =>
    api.post('/access/request', { datasetId, message }),
  pending: () => api.get('/access/pending'),
  mine: () => api.get('/access/mine'),
  review: (requestId: string, data: { status: string; reviewNote?: string }) =>
    api.patch(`/access/request/${requestId}/review`, data),
};

// ── Downloads ─────────────────────────────────────────────────

export const downloadsApi = {
  download: (datasetId: string, versionId?: string) => {
    const params = versionId ? `?versionId=${versionId}` : '';
    return api.get(`/datasets/${datasetId}/download${params}`, {
      responseType: 'blob',
    });
  },
  myDownloads: () => api.get('/users/me/downloads'),
};

// ── KPI ───────────────────────────────────────────────────────

export const kpiApi = {
  get: () => api.get('/kpi'),
};

// ── Audit ─────────────────────────────────────────────────────

export const auditApi = {
  get: (params?: Record<string, any>) => api.get('/audit', { params }),
};
