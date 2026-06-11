import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import { getStoredToken, setStoredToken, api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStoredToken().then((token) => {
      if (!token) {
        setLoading(false);
        return;
      }
      api('/api/auth/me')
        .then((me) => {
          setUser(me);
          // Check for any due reminders now that the user has opened the app
          api('/api/reminders/check', { method: 'POST' })
            .then((due) => {
              due.forEach((reminder) => {
                const session = reminder.sessionId;
                const pitchName = session?.pitch?.name || 'your session';
                const timeStr = session?.time || '';
                Alert.alert(
                  'Kick-off reminder',
                  `${pitchName} starts in about 1 hour${timeStr ? ' at ' + timeStr : ''}.`,
                  [{ text: 'OK' }]
                );
              });
            })
            .catch(() => {}); // silent fail — reminders are non-critical
        })
        .catch(() => {
          setStoredToken(null);
        })
        .finally(() => setLoading(false));
    });
  }, []);

  const login = async (email, password) => {
    const { user: u, token } = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await setStoredToken(token);
    setUser(u);
    return u;
  };

  const register = async (email, password, name, acceptTerms, extra = {}) => {
    const { user: u, token } = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        name,
        acceptTerms: !!acceptTerms,
        ...extra,
      }),
    });
    await setStoredToken(token);
    setUser(u);
    return u;
  };

  const logout = async () => {
    await setStoredToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const me = await api('/api/users/me');
    setUser(me);
    return me;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
