export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'seller' | 'operator';
  permissions: string[];
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}