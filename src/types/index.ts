// Shared types placeholder

export type UserRole = 'director';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface Musician {
  id: string;
  name: string;
  email: string;
  phone: string;
  instruments: string[];
  availability: string[];
  notes?: string;
}
