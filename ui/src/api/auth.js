import client from './client';

export const authApi = {
  register: (data) => client.post('/auth/register', data),
  login: (data) => client.post('/auth/login', data),
  refresh: (refreshToken) => client.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken) => client.post('/auth/logout', { refreshToken }),
  logoutAll: () => client.post('/auth/logout-all'),
  me: () => client.get('/auth/me'),
  changePassword: (data) => client.put('/auth/change-password', data),
};
