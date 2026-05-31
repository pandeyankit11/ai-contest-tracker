import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  authAPI,
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  setStoredAuth,
} from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getStoredToken());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const persistSession = useCallback((authResult) => {
    if (!authResult?.token || !authResult?.user) {
      throw new Error('Authentication response was missing user or token');
    }

    setStoredAuth(authResult);
    setUser(authResult.user);
    setToken(authResult.token);
    setError(null);
  }, []);

  const clearSession = useCallback(() => {
    clearStoredAuth();
    setUser(null);
    setToken(null);
  }, []);

  const login = useCallback(
    async (email, password) => {
      setIsLoading(true);
      setError(null);

      try {
        const authResult = await authAPI.login(email, password);
        persistSession(authResult);
        return authResult.user;
      } catch (loginError) {
        const message = loginError.message || 'Unable to log in';
        setError(message);
        throw loginError;
      } finally {
        setIsLoading(false);
      }
    },
    [persistSession],
  );

  const register = useCallback(
    async (email, password,passwordConfirmation) => {
      setIsLoading(true);
      setError(null);

      try {
        const authResult = await authAPI.register(email, password,passwordConfirmation);
        persistSession(authResult);
        return authResult.user;
      } catch (registerError) {
        const message = registerError.message || 'Unable to register';
        setError(message);
        throw registerError;
      } finally {
        setIsLoading(false);
      }
    },
    [persistSession],
  );

  const logout = useCallback(() => {
    clearSession();
    setError(null);
  }, [clearSession]);

  const initializeAuth = useCallback(async () => {
    const storedToken = getStoredToken();

    if (!storedToken) {
      clearSession();
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const data = await authAPI.me();
      const restoredUser = data.user;

      setUser(restoredUser);
      setToken(storedToken);
      setStoredAuth({ token: storedToken, user: restoredUser });
    } catch {
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [clearSession]);

  useEffect(() => {
    if (!error) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setError(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [error]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      error,
      login,
      register,
      logout,
      initializeAuth,
      clearError,
    }),
    [clearError, error, initializeAuth, isLoading, login, logout, register, token, user],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
