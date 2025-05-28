// Shared types placeholder

export interface Musician {
  id: string;
  name: string;
  instrument?: string;
  phone: string;
}

export type UserRole = 'director' | 'admin';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}
