import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

const UnreadContext = createContext({ unreadCount: 0, refreshUnread: () => {} });

export function UnreadProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const refreshUnread = useCallback(async () => {
    try {
      const data = await api('/api/messages/unread-count');
      setUnreadCount(data?.count || 0);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }

    refreshUnread();

    let mounted = true;
    getSocket().then((s) => {
      if (!mounted) return;
      // Remove any existing listener first to prevent duplicates
      s.off('private:message:unread');
      s.on('private:message:unread', () => {
        if (mounted) refreshUnread();
      });
    });

    return () => {
      mounted = false;
      getSocket().then((s) => s.off('private:message:unread'));
    };
  }, [user, refreshUnread]);

  return (
    <UnreadContext.Provider value={{ unreadCount, refreshUnread }}>
      {children}
    </UnreadContext.Provider>
  );
}

export function useUnread() {
  return useContext(UnreadContext);
}
