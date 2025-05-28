// Shared types placeholder

export type UserRole = 'director' | 'musician';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  githubId: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface Musician {
  id: string;
  name: string;
  email: string;
  phone: string;
  instruments: string[];
  availability: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  notes: string;
  createdAt: string;
  updatedAt: string;
}
