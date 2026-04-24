import { create } from 'zustand';
import { authApi } from '../api/auth';

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  loading: false,

  login: async (credentials) => {
    set({ loading: true });
    try {
      const { data } = await authApi.login(credentials);
      const { user, tokens } = data.data;
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      set({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, loading: false });
      return user;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  register: async (userData) => {
    set({ loading: true });
    try {
      const { data } = await authApi.register(userData);
      set({ loading: false });
      return data.data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: async () => {
    const { refreshToken } = get();
    try {
      await authApi.logout(refreshToken);
    } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, accessToken: null, refreshToken: null });
  },

  fetchMe: async () => {
    try {
      const { data } = await authApi.me();
      set({ user: data.data });
      return data.data;
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, accessToken: null, refreshToken: null });
    }
  },

  isAdmin: () => get().user?.role === 'ADMIN',
  isAuthenticated: () => !!get().accessToken,
}));
