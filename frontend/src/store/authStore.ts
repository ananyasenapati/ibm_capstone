import { create } from 'zustand';

interface User {
  userId: number;
  name: string;
  email: string;
  phone?: string;
  role: 'CUSTOMER' | 'SELLER' | 'ADMIN';
  token: string;
  refreshToken?: string;
  profileImageUrl?: string;
}

interface AuthState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isAdmin: () => boolean;
  isSeller: () => boolean;
  isCustomer: () => boolean;
  isTokenExpired: () => boolean;
}

const isTokenValid = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

const getStoredUser = (): User | null => {
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    const user: User = JSON.parse(stored);
    if (!isTokenValid(user.token)) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
    return user;
  } catch {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getStoredUser(),
  login: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', user.token);
    set({ user });
  },
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null });
  },
  updateUser: (updates) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...updates };
    localStorage.setItem('user', JSON.stringify(updated));
    localStorage.setItem('token', updated.token);
    set({ user: updated });
  },
  isAdmin: () => get().user?.role === 'ADMIN',
  isSeller: () => get().user?.role === 'SELLER',
  isCustomer: () => get().user?.role === 'CUSTOMER',
  isTokenExpired: () => {
    const user = get().user;
    if (!user) return true;
    return !isTokenValid(user.token);
  },
}));
