import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../../types/index.js';
import { api } from '../api/index.js';

interface AuthConfig {
  auth_enabled: boolean;
  google_client_id: string;
  allowed_email: string;
  company_name: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  authConfig: AuthConfig | null;
  loginWithCredentials: (password: string, email?: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'rlp_auth_token';
const USER_KEY = 'rlp_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });

  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Carrega configurações públicas do backend
  const loadAuthConfig = useCallback(async () => {
    try {
      const config = await api.getAuthConfig();
      setAuthConfig(config);
    } catch (err) {
      console.warn('Erro ao carregar configurações de autenticação:', err);
    }
  }, []);

  // Valida a sessão no servidor ao iniciar
  const validateSession = useCallback(async () => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (!savedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res && res.user) {
        setUser(res.user);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      } else {
        throw new Error('Sessão inválida');
      }
    } catch {
      // Token expirou ou servidor invalidou
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuthConfig();
    validateSession();

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('rlp_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('rlp_unauthorized', handleUnauthorized);
  }, [loadAuthConfig, validateSession]);

  const loginWithCredentials = async (password: string, email = 'roboledpartner@gmail.com') => {
    const res = await api.login(email, password);
    if (res.success && res.token) {
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
  };

  const loginWithGoogle = async (credential: string) => {
    const res = await api.loginGoogle(credential);
    if (res.success && res.token) {
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        authConfig,
        loginWithCredentials,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
