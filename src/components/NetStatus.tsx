// ====== 网络状态指示器 ======
// 监控 navigator.onLine 变化，file:// 协议警告，离线/在线切换 toast
import { useEffect, useState, useRef, useCallback } from 'react';

type NetState = 'online' | 'offline' | 'cors-warning';

interface Toast {
  id: number;
  state: NetState;
  timestamp: number;
}

const TOAST_DURATION = 4000;
let toastId = 0;

export default function NetStatus() {
  const [netState, setNetState] = useState<NetState>(() => {
    if (typeof navigator === 'undefined') return 'online';
    // file:// 协议 → CORS 拦截 → 云端同步无效
    if (window.location.protocol === 'file:') return 'cors-warning';
    return navigator.onLine ? 'online' : 'offline';
  });

  const [toasts, setToasts] = useState<Toast[]>([]);
  const prevRef = useRef<NetState>(netState);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addToast = useCallback((state: NetState) => {
    const id = ++toastId;
    setToasts((prev) => [...prev.slice(-2), { id, state, timestamp: Date.now() }]);
    // 自动清除
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setNetState('online');
      if (prevRef.current !== 'online') addToast('online');
      prevRef.current = 'online';
    };
    const handleOffline = () => {
      setNetState('offline');
      addToast('offline');
      prevRef.current = 'offline';
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 首次加载时如果已离线，提示
    if (netState === 'offline') {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => addToast('offline'), 2000);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [addToast, netState]);

  return (
    <>
      {/* ── file:// CORS 警告横幅 ── */}
      {netState === 'cors-warning' && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 9999,
          background: 'linear-gradient(135deg, #F5A623, #F7B84E)',
          color: '#fff',
          padding: '10px 16px',
          fontSize: 'clamp(11px, 0.9vw, 13px)',
          fontWeight: 600,
          textAlign: 'center',
          lineHeight: 1.6,
          boxShadow: '0 2px 12px rgba(245,166,35,0.3)',
          animation: 'fadeInUp 0.4s ease',
        }}>
          ⚠️ 检测到 file:// 协议打开 — Supabase 云端同步被 CORS 拦截，数据仅保存在本地。
          <br />
          <span style={{ fontWeight: 400, opacity: 0.85 }}>
            请用 HTTP 服务器启动：<code style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 4 }}>npx serve dist</code>
          </span>
        </div>
      )}

      {/* ── 离线横幅 ── */}
      {netState === 'offline' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0, right: 0,
          zIndex: 9998,
          background: 'linear-gradient(135deg, #8B7355, #A09080)',
          color: '#fff',
          padding: '8px 16px',
          fontSize: 'clamp(10px, 0.8vw, 12px)',
          fontWeight: 600,
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          animation: 'fadeInUp 0.4s ease',
        }}>
          🔌 当前离线 · 数据将保存在本地，网络恢复后自动同步
        </div>
      )}

      {/* ── Toast 通知 ── */}
      {toasts.map((toast, i) => (
        <div
          key={toast.id}
          style={{
            position: 'fixed',
            top: 'clamp(60px, 10vh, 90px)',
            left: '50%',
            transform: `translateX(-50%) translateY(${i * 52}px)`,
            zIndex: 9997,
            background: toast.state === 'online'
              ? 'rgba(160,184,136,0.95)'
              : 'rgba(139,115,85,0.95)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            borderRadius: 14,
            padding: '10px 20px',
            fontSize: 'clamp(11px, 0.9vw, 14px)',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            animation: toast.state === 'online'
              ? 'fadeInUp 0.35s ease, fadeOut 0.5s 3.5s ease forwards'
              : 'fadeInUp 0.35s ease',
            pointerEvents: 'none',
          }}
        >
          {toast.state === 'online' ? '🌐 网络已恢复' : '🔌 网络已断开'}
        </div>
      ))}
    </>
  );
}
