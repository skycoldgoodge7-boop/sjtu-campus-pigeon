import { useUIStore } from '../store/uiStore';
import { usePigeonStore } from '../store/pigeonStore';
import { MAP_POSITIONS } from '../data/mapLayout';
import { useEffect, useState } from 'react';

export default function PigeonBubble() {
  const bubble = useUIStore((s) => s.pigeonBubble);
  const currentLandmarkId = usePigeonStore((s) => s.currentLandmarkId);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (bubble) {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 3500);
      return () => clearTimeout(t);
    }
  }, [bubble]);

  if (!bubble || !visible) return null;

  const pos = MAP_POSITIONS.find((p) => p.landmarkId === currentLandmarkId);
  const left = pos?.leftPercent ?? 50;
  const top = (pos?.topPercent ?? 50) - 8;

  return (
    <div style={{
      position: 'fixed',
      left: `${left}%`,
      top: `${top}%`,
      transform: 'translate(-50%, -100%)',
      zIndex: 15,
      pointerEvents: 'none',
      animation: 'fadeInUp 0.4s ease',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(8px)',
        borderRadius: 16,
        padding: '8px 16px',
        fontSize: 'clamp(12px, 1.2vw, 17px)',
        fontWeight: 600,
        color: '#4A3728',
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span>{bubble.emoji}</span>
        <span>{bubble.text}</span>
      </div>
      {/* Triangle pointer */}
      <div style={{
        width: 0, height: 0,
        borderLeft: '8px solid transparent',
        borderRight: '8px solid transparent',
        borderTop: '8px solid rgba(255,255,255,0.9)',
        margin: '0 auto',
      }} />
    </div>
  );
}
