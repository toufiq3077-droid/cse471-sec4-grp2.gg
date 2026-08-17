import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:9478';

// Play a soft chime using Web Audio API
function playAlertChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const freqs = [523, 659, 784, 659];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.25);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.3);
    });
  } catch (_) {}
}

export function SocketProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);

  const addNotification = useCallback((notif) => {
    setNotifications((prev) => [notif, ...prev].slice(0, 50));
    setUnreadCount((prev) => prev + 1);
    playAlertChime();

    const severityStyles = {
      critical: 'border-l-4 border-red-500 bg-red-50',
      warning: 'border-l-4 border-amber-400 bg-amber-50',
      info: 'border-l-4 border-blue-400 bg-blue-50',
    };
    const icons = { critical: '🚨', warning: '⚠️', info: 'ℹ️' };
    const icon = icons[notif.severity] || '⚠️';

    toast.custom(
      (t) => (
        <div
          className={`max-w-sm w-full rounded-2xl shadow-2xl p-4 flex gap-3 items-start transition-all
            ${severityStyles[notif.severity] || severityStyles.warning}
            ${t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
          style={{ transition: 'all 0.3s ease' }}
        >
          <span className="text-2xl mt-0.5">{icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 leading-snug">{notif.title}</p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-3">{notif.message}</p>
            {notif.metadata?.locationName && (
              <p className="text-xs text-slate-400 mt-1">📍 {notif.metadata.locationName}</p>
            )}
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none mt-0.5 flex-shrink-0"
          >
            ×
          </button>
        </div>
      ),
      { duration: 8000, position: 'top-right' }
    );
  }, []);

  // Set initial notifications from REST (on mount)
  const loadInitialNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const BASE = import.meta.env.VITE_API_URL
        ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`)
        : 'http://localhost:9478/api';
      const res = await fetch(`${BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (_) {}
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    loadInitialNotifications();

    // Connect Socket.io
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('weather_alert', (notif) => {
      addNotification(notif);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token, addNotification, loadInitialNotifications]);

  const markRead = useCallback(async (id) => {
    if (!token) return;
    try {
      const BASE = import.meta.env.VITE_API_URL
        ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`)
        : 'http://localhost:9478/api';
      const res = await fetch(`${BASE}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
        setUnreadCount(data.unreadCount ?? Math.max(0, unreadCount - 1));
      }
    } catch (_) {}
  }, [token, unreadCount]);

  const markAllRead = useCallback(async () => {
    if (!token) return;
    try {
      const BASE = import.meta.env.VITE_API_URL
        ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`)
        : 'http://localhost:9478/api';
      await fetch(`${BASE}/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (_) {}
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, notifications, unreadCount, connected, markRead, markAllRead, addNotification }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
