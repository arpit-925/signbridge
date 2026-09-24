import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../services/authApi';
import { getAccessToken, getStoredUser, clearAuthStorage } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getAccessToken());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Validate session on app initialization
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      const existingToken = getAccessToken();
      if (existingToken) {
        try {
          const res = await authApi.getMe();
          if (isMounted && res.user) {
            setUser(res.user);
            setToken(existingToken);
          }
        } catch (err) {
          if (isMounted) {
            clearAuthStorage();
            setUser(null);
            setToken(null);
          }
        }
      }
      if (isMounted) setIsLoading(false);
    };

    initAuth();

    // Listen to token refresh expiry
    const handleExpired = () => {
      if (isMounted) {
        setUser(null);
        setToken(null);
      }
    };
    window.addEventListener('sb-auth-expired', handleExpired);

    return () => {
      isMounted = false;
      window.removeEventListener('sb-auth-expired', handleExpired);
    };
  }, []);

  const login = useCallback(async (email, password, role) => {
    setError(null);
    try {
      const data = await authApi.login(email, password, role);
      setUser(data.user);
      setToken(data.accessToken);
      return data.user;
    } catch (err) {
      const msg = err.message || 'Login failed. Please check credentials.';
      setError(msg);
      throw err;
    }
  }, []);

  const register = useCallback(async (formData) => {
    setError(null);
    try {
      const data = await authApi.register(formData);
      setUser(data.user);
      setToken(data.accessToken);
      return data.user;
    } catch (err) {
      const msg = err.message || 'Registration failed.';
      setError(msg);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setToken(null);
      setError(null);
    }
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    const updated = await authApi.updateProfile(profileData);
    setUser(updated);
    return updated;
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
