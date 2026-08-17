import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, X, MapPin, AlertTriangle, Info, Zap } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const severityConfig = {
  critical: { bg: 'bg-red-50 border-red-200', dot: 'bg-red-500', icon: AlertTriangle, iconColor: 'text-red-500' },
  warning: { bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-400', icon: AlertTriangle, iconColor: 'text-amber-500' },
  info: { bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-400', icon: Info, iconColor: 'text-blue-500' },
};

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead, connected } = useSocket() || {};
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handle(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const count = unreadCount || 0;
  const notifs = notifications || [];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        id="btn-notification-bell"
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 transition text-slate-600"
        title="Weather Notifications"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {count > 9 ? '9+' : count}
          </span>
        )}
        {/* Live green dot when socket connected */}
        {connected && (
          <span className="absolute bottom-0.5 right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white" />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-slate-800 text-sm">Weather Alerts</span>
              {count > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{count} new</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {count > 0 && (
                <button
                  id="btn-mark-all-read"
                  onClick={() => markAllRead?.()}
                  className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  All read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications list */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Bell className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">No weather alerts yet</p>
                <p className="text-xs mt-1 opacity-70">You'll be notified of farm weather hazards here</p>
              </div>
            ) : (
              notifs.map((notif) => {
                const cfg = severityConfig[notif.severity] || severityConfig.warning;
                const Icon = cfg.icon;
                return (
                  <div
                    key={notif._id}
                    className={`p-4 transition hover:brightness-95 cursor-pointer ${notif.read ? 'bg-white' : cfg.bg + ' border-l-4 ' + cfg.bg.split(' ')[1]}`}
                    onClick={() => !notif.read && markRead?.(notif._id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${notif.read ? 'bg-slate-100' : 'bg-white shadow-sm'}`}>
                        <Icon className={`w-4 h-4 ${notif.read ? 'text-slate-400' : cfg.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-bold leading-snug truncate ${notif.read ? 'text-slate-500' : 'text-slate-900'}`}>
                            {notif.title}
                          </p>
                          {!notif.read && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />}
                        </div>
                        <p className={`text-xs mt-0.5 leading-relaxed line-clamp-2 ${notif.read ? 'text-slate-400' : 'text-slate-600'}`}>
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {notif.metadata?.locationName && (
                            <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                              <MapPin className="w-2.5 h-2.5" />
                              {notif.metadata.locationName}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 ml-auto">{timeAgo(notif.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              {connected ? 'Live socket connected' : 'Connecting...'}
            </span>
            <span className="text-[10px] text-slate-400">Last 30 alerts shown</span>
          </div>
        </div>
      )}
    </div>
  );
}
