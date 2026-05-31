import { useUIStore } from '../store/uiStore';
import type { TimeOfDay, CampusState } from '../types';

// 低饱和天空渐变
const SKY_GRADIENTS: Record<TimeOfDay, string> = {
  dawn:    'linear-gradient(180deg, #F0DDD5 0%, #EDE5D8 35%, #DDE0E4 65%, #E5E0DA 100%)',
  morning: 'linear-gradient(180deg, #D5DFE8 0%, #DEE4E8 40%, #E8E2DC 80%, #ECE5DD 100%)',
  afternoon: 'linear-gradient(180deg, #CDD6DE 0%, #D5DCE2 35%, #E0DCD5 70%, #E8E0D8 100%)',
  evening: 'linear-gradient(180deg, #C0B5C0 0%, #D8C5C0 30%, #E5D0C0 55%, #ECDED0 100%)',
  night:   'linear-gradient(180deg, #303040 0%, #343848 40%, #383C48 80%, #323848 100%)',
};

const PARTICLES: Record<CampusState, { emoji: string; count: number }> = {
  exam:    { emoji: '◈',    count: 5 },
  spring:  { emoji: '🌸',   count: 10 },
  graduation: { emoji: '✨', count: 8 },
  normal:  { emoji: '',     count: 0 },
};

export default function AmbientBackground() {
  const timeOfDay = useUIStore((s) => s.timeOfDay);
  const campusState = useUIStore((s) => s.campusState);
  const particle = PARTICLES[campusState];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0,
      background: SKY_GRADIENTS[timeOfDay],
      transition: 'background 4s ease',
    }}>
      {/* 童趣云朵 — 圆润、缓慢漂浮 */}
      <SoftCloud top="6%"  leftStart="-20%" duration="75s" delay="0s"  size="28vw" h="clamp(35px, 4.5vh, 70px)" />
      <SoftCloud top="13%" leftStart="-25%" duration="90s" delay="20s" size="22vw" h="clamp(30px, 4vh, 60px)" />
      <SoftCloud top="5%"  leftStart="-18%" duration="65s" delay="40s" size="18vw" h="clamp(28px, 3.5vh, 55px)" />
      <SoftCloud top="18%" leftStart="-30%" duration="80s" delay="55s" size="24vw" h="clamp(32px, 4vh, 65px)" />

      {/* 季节粒子 */}
      {particle.emoji && Array.from({ length: particle.count }).map((_, i) => (
        <span key={i} style={{
          position: 'absolute',
          left: `${Math.random() * 100}%`,
          top: '-5%',
          fontSize: `${12 + Math.random() * 16}px`,
          animation: `particleFall ${10 + Math.random() * 14}s linear ${Math.random() * 12}s infinite`,
          opacity: 0.5,
          pointerEvents: 'none',
        }}>{particle.emoji}</span>
      ))}

      {/* 地面暖灰过渡 */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '5%',
        background: 'linear-gradient(180deg, transparent, rgba(180,165,140,0.15))',
      }} />
    </div>
  );
}

// 童趣柔软云朵
function SoftCloud({ top, leftStart, duration, delay, size, h }: {
  top: string; leftStart: string; duration: string; delay: string; size: string; h: string;
}) {
  return (
    <div style={{
      position: 'absolute',
      top,
      left: leftStart,
      width: size,
      height: h,
      animation: `drift ${duration} linear ${delay} infinite`,
      opacity: 0.3,
      pointerEvents: 'none',
    }}>
      {/* 云主体 — 多个圆润椭圆叠加 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 60% 80% at 30% 50%, rgba(255,254,250,0.9) 0%, rgba(255,252,248,0.5) 40%, transparent 72%)',
        borderRadius: '50%',
        filter: 'blur(6px)',
      }} />
      <div style={{
        position: 'absolute',
        top: '-10%', left: '25%',
        width: '50%', height: '70%',
        background: 'radial-gradient(ellipse at center, rgba(255,254,252,0.7) 0%, transparent 65%)',
        borderRadius: '50%',
        filter: 'blur(4px)',
      }} />
      <div style={{
        position: 'absolute',
        top: '5%', left: '50%',
        width: '40%', height: '55%',
        background: 'radial-gradient(ellipse at center, rgba(255,253,250,0.5) 0%, transparent 60%)',
        borderRadius: '50%',
        filter: 'blur(5px)',
      }} />
    </div>
  );
}
