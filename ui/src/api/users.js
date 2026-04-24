import client from './client';

export const usersApi = {
  list: (params) => client.get('/users', { params }),
  getById: (id) => client.get(`/users/${id}`),
  getMe: () => client.get('/users/me'),
  updateMe: (data) => client.patch('/users/me', data),
  update: (id, data) => client.patch(`/users/${id}`, data),
  updateRole: (id, role) => client.patch(`/users/${id}/role`, { role }),
  delete: (id) => client.delete(`/users/${id}`),
  restore: (id) => client.post(`/users/${id}/restore`),
};
