import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests if available
if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
}

export const setAuthToken = (token: string) => {
    if (token) {
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
    }
};

export const RepoApi = {
    list: () => api.get('/repos').then(res => res.data),
    create: (data: { owner: string; name: string }) => api.post('/repos', data).then(res => res.data),
    get: (id: number) => api.get(`/repos/${id}`).then(res => res.data),
    delete: (id: number) => api.delete(`/repos/${id}`).then(res => res.data),
    scan: (id: number) => api.post(`/repos/${id}/scan`).then(res => res.data),
    getSignals: (id: number) => api.get(`/repos/${id}/signals`).then(res => res.data),
    getScanProgress: (id: number) => api.get(`/repos/${id}/scan-progress`).then(res => res.data),
    resumeScan: (id: number) => api.post(`/repos/${id}/resume-scan`).then(res => res.data),
    cancelScan: (id: number) => api.post(`/repos/${id}/cancel-scan`).then(res => res.data),
};

export const IssueApi = {
    list: (repoId: number) => api.get(`/issues?repo_id=${repoId}`).then(res => res.data),
    get: (id: number) => api.get(`/issues/${id}`).then(res => res.data),
    update: (id: number, data: { title?: string; body?: string }) => api.patch(`/issues/${id}`, data).then(res => res.data),
    publish: (id: number) => api.post(`/issues/${id}/publish`).then(res => res.data),
};

export default api;
