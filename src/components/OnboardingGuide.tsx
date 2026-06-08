// ====== 首次引导 ======
// 三步轻引导，localStorage 记录完成状态
// 简洁卡片式，无聚光灯遮罩

import { useState, useCallback } from 'react';
import { haptic } from '../utils/haptic';
import titleImg from '../assets/标题字.png';

const STORAGE_KEY = 'pigeon-onboarding-v2';
const STEPS = [
  {
    emoji: '🕊️',
    title: '这是校园鸽',
    desc: '它住在交大校园里，\n会自己飞来飞去、吃饭、发呆、\n观察路过的人和事。',
  },
  {
    emoji: '🍞',
    title: '投喂它',
    desc: '下面的食物都可以投喂。\n不同的食物会影响鸽子的心情\n——咖啡提神、面包暖胃、奶茶社交。',
  },
  {
    emoji: '🗺️',
    title: '左滑看地图',
    desc: '左滑切换到校园地图，\n可以看到鸽子在哪个地标停留，\n认识校园里的其他生命。',
  },
  {
    emoji: '🗳️',
    title: '每日投票',
    desc: '每天早上会有一个新问题，\n大家投票决定鸽子今天的心情。\n开心的鸽子会飞得更远～',
  },
];

export function isOnboardingDone(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'done';
  } catch {
    return true;
  }
}

export default function OnboardingGuide({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  const advance = useCallback(() => {
    haptic('tap');
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      try { localStorage.setItem(STORAGE_KEY, 'done'); } catch {}
      onDone();
    }
  }, [step, onDone]);

  const skip = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY, 'done'); } catch {}
    onDone();
  }, [onDone]);

  const isLast = step === STEPS.length - 1;

  return (
    <div
      onPointerDown={advance}
      style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(50, 35, 20, 0.65)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* 标题图 */}
      <div style={{
        marginBottom: 'clamp(28px, 4vh, 48px)',
        pointerEvents: 'none',
      }}>
        <img
          src={titleImg}
          alt="交大校园鸽"
          style={{
            width: 'clamp(220px, 58vw, 400px)',
            height: 'auto',
            display: 'block',
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
          }}
        />
      </div>

      {/* 卡片 */}
      <div style={{
        animation: 'fadeInUp 0.5s ease both',
        pointerEvents: 'auto',
        maxWidth: 'min(86vw, 340px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 14,
        background: 'rgba(255,252,245,0.95)',
        borderRadius: 24,
        padding: 'clamp(24px, 3vh, 36px) clamp(20px, 4vw, 32px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      }}
      onPointerDown={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 'clamp(44px, 7vw, 64px)' }}>
          {current.emoji}
        </div>
        <div style={{
          fontSize: 'clamp(18px, 2.5vw, 24px)',
          fontWeight: 800, color: '#4A3728',
          letterSpacing: 0.5,
        }}>
          {current.title}
        </div>
        <div style={{
          fontSize: 'clamp(13px, 1.3vw, 16px)',
          color: '#6B5A4A',
          textAlign: 'center',
          lineHeight: 1.8,
          whiteSpace: 'pre-line',
        }}>
          {current.desc}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          {!isLast ? (
            <>
              <button onPointerDown={(e) => { e.stopPropagation(); skip(); }}
                style={skipBtnStyle}>跳过</button>
              <button onPointerDown={(e) => { e.stopPropagation(); advance(); }}
                style={primaryBtnStyle}>下一步</button>
            </>
          ) : (
            <button onPointerDown={(e) => { e.stopPropagation(); advance(); }}
              style={{ ...primaryBtnStyle, padding: '12px 44px', fontSize: 'clamp(15px, 1.4vw, 18px)' }}>
              开始养鸽子 🕊️
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 16 : 7, height: 7, borderRadius: 4,
              background: i === step ? '#C4776B' : '#D0C8B8',
              transition: 'all 0.3s cubic-bezier(0.34, 1.4, 0.64, 1)',
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

const skipBtnStyle: React.CSSProperties = {
  border: '1.5px solid #D0C8B8', borderRadius: 14,
  background: 'transparent', color: '#8B7355',
  padding: '10px 24px', cursor: 'pointer',
  fontSize: 'clamp(13px, 1.2vw, 16px)', fontWeight: 600,
};

const primaryBtnStyle: React.CSSProperties = {
  border: 'none', borderRadius: 14,
  background: 'linear-gradient(135deg, #C4776B, #D4947E)',
  color: 'white', padding: '10px 28px', cursor: 'pointer',
  fontSize: 'clamp(13px, 1.2vw, 16px)', fontWeight: 700,
  boxShadow: '0 4px 16px rgba(196,119,107,0.3)',
};
