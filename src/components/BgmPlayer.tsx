// ====== 背景音乐播放器 ======
// 轻量循环背景，默认播放，可一键静音

import { useEffect, useRef, useState, useCallback } from 'react';
import bgmSrc from '../assets/bgm.mp3';

const BGM_KEY = 'pigeon-bgm-muted';

export default function BgmPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem(BGM_KEY) === '1'; } catch { return false; }
  });
  const [started, setStarted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // 首次用户交互后启动播放
  const tryStart = useCallback(() => {
    if (started || !audioRef.current) return;
    audioRef.current.volume = 0.12;
    audioRef.current.loop = true;
    audioRef.current.play().catch(() => {});
    setStarted(true);
    setShowHint(true);
    setTimeout(() => setShowHint(false), 4000);
  }, [started]);

  useEffect(() => {
    window.addEventListener('pointerdown', tryStart, { once: true });
    return () => window.removeEventListener('pointerdown', tryStart);
  }, [tryStart]);

  // 静音切换
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = muted;
    try { localStorage.setItem(BGM_KEY, muted ? '1' : '0'); } catch {}
  }, [muted]);

  const toggle = () => {
    if (!started) {
      tryStart();
      return;
    }
    setMuted((v) => !v);
  };

  return (
    <>
      <audio ref={audioRef} src={bgmSrc} preload="auto" />

      {/* 浮动按钮 */}
      <div style={{
        position: 'absolute',
        top: 'clamp(10px, 1.5vh, 20px)',
        right: 'clamp(10px, 2vw, 18px)',
        zIndex: 20,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        gap: 4,
      }}>
        {/* 首次播放提示 */}
        {showHint && (
          <div style={{
            fontSize: 10, color: '#8B7355', opacity: 0.7,
            background: 'rgba(255,252,245,0.85)',
            borderRadius: 8, padding: '4px 10px',
            animation: 'fadeInUp 0.5s ease both',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}>
            🎵 校园背景音乐
          </div>
        )}
        <button
          onPointerDown={(e) => { e.stopPropagation(); toggle(); }}
          style={{
            width: 'clamp(32px, 4vw, 36px)',
            height: 'clamp(32px, 4vw, 36px)',
            borderRadius: '50%',
            border: '1px solid rgba(139,115,85,0.1)',
            background: muted || !started ? 'rgba(255,252,245,0.7)' : 'rgba(196,119,107,0.1)',
            cursor: 'pointer',
            fontSize: 'clamp(14px, 1.5vw, 18px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
            transition: 'all 0.2s ease',
            color: muted || !started ? '#9B9489' : '#C4776B',
            WebkitTapHighlightColor: 'transparent',
            padding: 0,
          }}
          title={muted || !started ? '点击开启音乐' : '点击关闭音乐'}
        >
          {muted || !started ? '🔇' : '🎵'}
        </button>
      </div>
    </>
  );
}
