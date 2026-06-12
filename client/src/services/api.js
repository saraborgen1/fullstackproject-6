import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Auth endpoints
export const authAPI = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }).then((r) => r.data),
  register: (data) =>
    api.post('/auth/register', data).then((r) => r.data),
};

// User endpoints
export const usersAPI = {
  getById: (id) => api.get(`/users/${id}`).then((r) => r.data),
  update: (id, data) => api.put(`/users/${id}`, data).then((r) => r.data),
  patch: (id, data) => api.patch(`/users/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/users/${id}`).then((r) => r.data),
  blockUser: (id, blocked) =>
    api.patch(`/users/${id}/block`, { blocked }).then((r) => r.data),
  changePassword: (id, oldPassword, newPassword) =>
    api.patch(`/users/${id}/change-password`, { oldPassword, newPassword }).then((r) => r.data),
  getDashboard: (id) => api.get(`/users/${id}/dashboard`).then((r) => r.data),
};

// Todos endpoints
export const todosAPI = {
  getAll: (userId, params = {}) => {
    const query = { userId, ...params };
    return api.get('/todos', { params: query }).then((r) => r.data);
  },
  create: (data) => api.post('/todos', data).then((r) => r.data),
  update: (id, data) => api.put(`/todos/${id}`, data).then((r) => r.data),
  patch: (id, data) => api.patch(`/todos/${id}`, data).then((r) => r.data),
  delete: (id, userId) =>
    api.delete(`/todos/${id}`, { data: { userId } }).then((r) => r.data),
};

// Posts endpoints
export const postsAPI = {
  getAll: (userId, params = {}) => {
    const query = { userId, ...params };
    return api.get('/posts', { params: query }).then((r) => r.data);
  },
  create: (data) => api.post('/posts', data).then((r) => r.data),
  update: (id, data) => api.put(`/posts/${id}`, data).then((r) => r.data),
  patch: (id, data) => api.patch(`/posts/${id}`, data).then((r) => r.data),
  delete: (id, userId) =>
    api.delete(`/posts/${id}`, { data: { userId } }).then((r) => r.data),
};

// Comments endpoints
export const commentsAPI = {
  getAll: (postId, params = {}) => {
    const query = { postId, ...params };
    return api.get('/comments', { params: query }).then((r) => r.data);
  },
  create: (data) => api.post('/comments', data).then((r) => r.data),
  update: (id, data) => api.put(`/comments/${id}`, data).then((r) => r.data),
  patch: (id, data) => api.patch(`/comments/${id}`, data).then((r) => r.data),
  delete: (id, userId) =>
    api.delete(`/comments/${id}`, { data: { userId } }).then((r) => r.data),
};

// Albums endpoints
export const albumsAPI = {
  getAll: (userId, params = {}) => {
    const query = { userId, ...params };
    return api.get('/albums', { params: query }).then((r) => r.data);
  },
  create: (data) => api.post('/albums', data).then((r) => r.data),
  update: (id, data) => api.put(`/albums/${id}`, data).then((r) => r.data),
  patch: (id, data) => api.patch(`/albums/${id}`, data).then((r) => r.data),
  delete: (id, userId) =>
    api.delete(`/albums/${id}`, { data: { userId } }).then((r) => r.data),
};

// Photos endpoints
export const photosAPI = {
  getAll: (albumId, params = {}) => {
    const query = { albumId, ...params };
    return api.get('/photos', { params: query }).then((r) => r.data);
  },
  create: (data) => api.post('/photos', data).then((r) => r.data),
  update: (id, data) => api.put(`/photos/${id}`, data).then((r) => r.data),
  patch: (id, data) => api.patch(`/photos/${id}`, data).then((r) => r.data),
  delete: (id, albumId) =>
    api.delete(`/photos/${id}`, { data: { albumId } }).then((r) => r.data),
  updatePhoto: (id, data) => api.put(`/photos/${id}`, data).then((r) => r.data),
};

// Admin endpoints
export const adminAPI = {
  getStatistics: (adminId) =>
    api.get('/admin/statistics', { params: { adminId } }).then((r) => r.data),
  getAllUsers: (adminId) =>
    api.get('/admin/users', { params: { adminId } }).then((r) => r.data),
  toggleAdmin: (id, adminId, is_admin) =>
    api.patch(`/admin/users/${id}/admin`, { adminId, is_admin }).then((r) => r.data),
};

export default api;