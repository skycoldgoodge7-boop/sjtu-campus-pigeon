// ====== 天空 + 季节粒子 ======
// 5 时段渐变 + 云朵 + 真实季节检测
// 春:🌸樱花飘落  夏:🪲萤火虫  秋:🍂落叶  冬:❄️雪花

import { useUIStore } from '../store/uiStore';
import type { TimeOfDay } from '../types';

const SKY_GRADIENTS: Record<TimeOfDay, string> = {
  dawn:    'linear-gradient(180deg, #F0DDD5 0%, #EDE5D8 35%, #DDE0E4 65%, #E5E0DA 100%)',
  morning: 'linear-gradient(180deg, #D5DFE8 0%, #DEE4E8 40%, #E8E2DC 80%, #ECE5DD 100%)',
  afternoon:'linear-gradient(180deg, #CDD6DE 0%, #D5DCE2 35%, #E0DCD5 70%, #E8E0D8 100%)',
  evening: 'linear-gradient(180deg, #C0B5C0 0%, #D8C5C0 30%, #E5D0C0 55%, #ECDED0 100%)',
  night:   'linear-gradient(180deg, #303040 0%, #343848 40%, #383C48 80%, #323848 100%)',
};

// 月份→季节
function getSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}

interface SeasonParticle {
  emoji: string;
  count: number;
  size: string;
  animation: string;
  nightDim: number; // 夜间透明度衰减
}

const SEASON_PARTICLES: Record<string, SeasonParticle> = {
  spring:  { emoji: '🌸', count: 8,  size: '12-18px',   animation: 'particleFall',       nightDim: 0.7 },
  summer:  { emoji: '🪲', count: 6,  size: '8-14px',    animation: 'fireflyFloat',       nightDim: 1.0 },
  autumn:  { emoji: '🍂', count: 7,  size: '14-22px',   animation: 'particleFall',       nightDim: 0.6 },
  winter:  { emoji: '❄️', count: 10, size: '10-16px',   animation: 'snowFall',           nightDim: 1.0 },
};

export default function AmbientBackground() {
  const timeOfDay = useUIStore((s) => s.timeOfDay);
  const isNight = timeOfDay === 'night';
  const season = getSeason();
  const p = SEASON_PARTICLES[season];

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 0,
      background: SKY_GRADIENTS[timeOfDay],
      transition: 'background 4s var(--ease-in-out-soft)',
    }}>
      {/* 云朵 */}
      <SoftCloud top="5%"  leftStart="-20%" duration="75s" delay="0s"  size="28vw" h="clamp(32px, 4vh, 64px)" />
      <SoftCloud top="12%" leftStart="-25%" duration="90s" delay="20s" size="22vw" h="clamp(28px, 3.5vh, 56px)" />
      <SoftCloud top="3%"  leftStart="-18%" duration="65s" delay="40s" size="16vw" h="clamp(22px, 3vh, 48px)" />
      <SoftCloud top="16%" leftStart="-30%" duration="80s" delay="55s" size="24vw" h="clamp(30px, 4vh, 60px)" />
      <SoftCloud top="9%"  leftStart="-35%" duration="110s" delay="10s" size="30vw" h="clamp(20px, 2.5vh, 40px)" opacity={0.16} />

      {/* 季节粒子 */}
      {p.emoji && Array.from({ length: p.count }).map((_, i) => {
        const size = p.animation === 'fireflyFloat'
          ? `${4 + Math.random() * 6}px`
          : `${10 + Math.random() * 16}px`;
        const duration = p.animation === 'fireflyFloat'
          ? `${4 + Math.random() * 6}`
          : `${8 + Math.random() * 12}`;
        const opacity = isNight ? 0.2 + Math.random() * 0.15 * p.nightDim : 0.35 + Math.random() * 0.2;
        return (
          <span key={i} style={{
            position: 'absolute',
            left: `${3 + Math.random() * 94}%`,
            top: p.animation === 'fireflyFloat'
              ? `${20 + Math.random() * 60}%`
              : '-5%',
            fontSize: size,
            animation: `${p.animation} ${duration}s ease-in-out ${Math.random() * 10}s infinite`,
            opacity,
            pointerEvents: 'none',
            filter: p.animation === 'fireflyFloat'
              ? `blur(1px) drop-shadow(0 0 ${3 + Math.random() * 4}px rgba(255,255,150,0.6))`
              : undefined,
          }}>{p.emoji}</span>
        );
      })}

      {/* 地面过渡 */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '6%',
        background: 'linear-gradient(180deg, transparent, rgba(180,165,140,0.08), rgba(155,140,115,0.15))',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// ── 云朵 ──
function SoftCloud({ top, leftStart, duration, delay, size, h, opacity = 0.28 }: {
  top: string; leftStart: string; duration: string; delay: string; size: string; h: string;
  opacity?: number;
}) {
  return (
    <div style={{
      position: 'absolute', top, left: leftStart, width: size, height: h,
      animation: `cloudDrift ${duration} linear ${delay} infinite`,
      opacity, pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 60% 80% at 30% 50%, rgba(255,254,250,0.9) 0%, rgba(255,252,248,0.5) 40%, transparent 72%)',
        borderRadius: '50%', filter: 'blur(5px)',
        animation: `cloudBob ${2.5 + Math.random() * 2}s ease-in-out ${Math.random() * 2}s infinite`,
      }} />
      <div style={{
        position: 'absolute', top: '-10%', left: '25%', width: '50%', height: '70%',
        background: 'radial-gradient(ellipse at center, rgba(255,254,252,0.7) 0%, transparent 65%)',
        borderRadius: '50%', filter: 'blur(3px)',
        animation: `cloudBob ${2 + Math.random() * 2}s ease-in-out ${Math.random() * 1.5}s infinite`,
      }} />
    </div>
  );
}
