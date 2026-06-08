// 地图图例栏 — 单层居中横向排列
// 17:27 · 📍思源湖 · 🌆傍晚 · 🎓毕业季
import { useUIStore } from '../store/uiStore';
import { usePigeonStore } from '../store/pigeonStore';
import { landmarks } from '../data/landmarks';
import { useState, useEffect } from 'react';
import type { TimeOfDay } from '../types';

const TIME_LABELS: Record<TimeOfDay, { name: string; emoji: string }> = {
  dawn: { name: '清晨', emoji: '🌅' }, morning: { name: '上午', emoji: '☀️' },
  afternoon: { name: '午后', emoji: '🌤️' }, evening: { name: '傍晚', emoji: '🌇' },
  night: { name: '深夜', emoji: '🌙' },
};
const STATE_LABELS: Record<string, { name: string; emoji: string }> = {
  exam: { name: '考试季', emoji: '📚' }, spring: { name: '春日', emoji: '🌸' },
  graduation: { name: '毕业季', emoji: '🎓' }, normal: { name: '', emoji: '' },
};

export default function InfoBar() {
  const timeOfDay = useUIStore((s) => s.timeOfDay);
  const campusState = useUIStore((s) => s.campusState);
  const currentLandmarkId = usePigeonStore((s) => s.currentLandmarkId);
  const weatherData = usePigeonStore((s) => s.weatherData);
  const [time, setTime] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setTime(new Date()), 30000); return () => clearInterval(i); }, []);

  const ti = TIME_LABELS[timeOfDay];
  const st = STATE_LABELS[campusState];
  const timeStr = time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const lm = landmarks.find((l) => l.id === currentLandmarkId);

  return (
    <div style={{
      position: 'absolute', top: 12, left: 20, right: 20, zIndex: 10,
      pointerEvents: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: 48,
      background: 'rgba(248,244,234,0.75)',
      backdropFilter: 'blur(10px)',
      borderRadius: 24,
      border: '1px solid rgba(138,104,75,0.08)',
      padding: '0 18px',
      gap: 10,
    }}>
      <span style={{ fontSize: 20, fontWeight: 700, color: '#5D4632', letterSpacing: 1 }}>{timeStr}</span>
      <span style={{ color: 'rgba(111,101,90,0.3)', fontSize: 11 }}>·</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: '#6F655A' }}>📍{lm?.name || '校园'}</span>
      <span style={{ color: 'rgba(111,101,90,0.3)', fontSize: 11 }}>·</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: '#6F655A' }}>{ti.emoji}{ti.name}</span>
      {st.name && (
        <>
          <span style={{ color: 'rgba(111,101,90,0.3)', fontSize: 11 }}>·</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#6F655A' }}>{st.emoji}{st.name}</span>
        </>
      )}
      {weatherData && (
        <>
          <span style={{ color: 'rgba(111,101,90,0.3)', fontSize: 11 }}>·</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#6F655A' }}>
            {weatherData.emoji} {weatherData.label} {Math.round(weatherData.temperature)}°C
          </span>
        </>
      )}
    </div>
  );
}
