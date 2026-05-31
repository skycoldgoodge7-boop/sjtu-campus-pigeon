import { useUIStore } from '../store/uiStore';
import { useState, useEffect } from 'react';
import type { TimeOfDay } from '../types';

const STATE_LABELS: Record<string, { emoji: string; label: string }> = {
  exam: { emoji: '📚', label: '考试季' },
  spring: { emoji: '🌸', label: '春日' },
  graduation: { emoji: '🎓', label: '毕业季' },
  normal: { emoji: '🏫', label: '交大' },
};

const TIME_DESCRIPTIONS: Record<TimeOfDay, string> = {
  dawn: '清晨',
  morning: '上午',
  afternoon: '午后',
  evening: '傍晚',
  night: '深夜',
};

export default function InfoBar() {
  const campusState = useUIStore((s) => s.campusState);
  const timeOfDay = useUIStore((s) => s.timeOfDay);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const st = STATE_LABELS[campusState];
  const timeStr = time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const timeDesc = TIME_DESCRIPTIONS[timeOfDay];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: 'clamp(8px, 1.5vh, 16px) clamp(16px, 2vw, 40px)',
      pointerEvents: 'none',
    }}>
      {/* Campus state badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(10px)',
        borderRadius: 20, padding: '6px 16px',
        fontSize: 'clamp(12px, 1.1vw, 16px)',
        fontWeight: 600, color: '#4A3728',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        <span>{st.emoji}</span>
        <span>{st.label}</span>
      </div>

      {/* Clock */}
      <div style={{
        fontSize: 'clamp(28px, 5vw, 64px)',
        fontWeight: 800,
        color: 'rgba(255,255,255,0.9)',
        textShadow: '0 2px 12px rgba(0,0,0,0.2)',
        letterSpacing: 4,
      }}>{timeStr}</div>

      {/* Time description */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(10px)',
        borderRadius: 20, padding: '6px 16px',
        fontSize: 'clamp(12px, 1.1vw, 16px)',
        fontWeight: 600, color: '#4A3728',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        <span>{timeDesc}</span>
      </div>
    </div>
  );
}
