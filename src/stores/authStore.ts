import { create } from 'zustand';
import api from '../api/client';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  user: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      set({ token: data.accessToken, refreshToken: data.refreshToken, isLoading: false });
      await get().fetchProfile();
    } catch (err: any) {
      const message = err.response?.data?.error || 'Ошибка входа';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    const rt = get().refreshToken;
    if (rt) api.post('/auth/logout', { refreshToken: rt }).catch(() => {});
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ token: null, refreshToken: null, user: null });
  },

  fetchProfile: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data });
    } catch {
      set({ user: null });
    }
  },

  clearError: () => set({ error: null }),
}));
