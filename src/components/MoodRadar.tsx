import { usePigeonStore } from '../store/pigeonStore';
import { feedItems } from '../data/feedItems';
import type { CampusMood } from '../types';

const MOOD_DIMENSIONS: { key: keyof CampusMood; label: string; emoji: string }[] = [
  { key: 'stress',     label: '压力', emoji: '😰' },
  { key: 'romance',    label: '浪漫', emoji: '💕' },
  { key: 'social',     label: '社交', emoji: '🗣️' },
  { key: 'loneliness', label: '孤独', emoji: '🥺' },
  { key: 'energy',     label: '活力', emoji: '⚡' },
  { key: 'warmth',     label: '温暖', emoji: '☀️' },
  { key: 'academic',   label: '学术', emoji: '📖' },
  { key: 'slack',      label: '摸鱼', emoji: '🎮' },
];

const RADIUS = 46;
const CENTER = 52;
const LABEL_RADIUS = 62;

function polarToCartesian(angle: number, r: number): [number, number] {
  const rad = (angle - 90) * (Math.PI / 180);
  return [
    CENTER + r * Math.cos(rad),
    CENTER + r * Math.sin(rad),
  ];
}

export default function MoodRadar() {
  const mood = usePigeonStore((s) => s.mood);
  const todayFeedCount = usePigeonStore((s) => s.todayFeedCount);
  const feedTotals = usePigeonStore((s) => s.feedTotals);

  const angleStep = 360 / MOOD_DIMENSIONS.length;

  // Data polygon
  const dataPoints = MOOD_DIMENSIONS.map((dim, i) => {
    const angle = i * angleStep;
    const r = (mood[dim.key] / 100) * RADIUS;
    return polarToCartesian(angle, r).join(',');
  }).join(' ');

  // Top feed item
  let topItemName = '';
  let topCount = 0;
  for (const [id, count] of Object.entries(feedTotals)) {
    if (count > topCount) {
      const item = feedItems.find((f) => f.id === id);
      topItemName = item?.name || id;
      topCount = count;
    }
  }

  return (
    <div style={{
      position: 'fixed', bottom: 'clamp(100px, 18vh, 200px)', left: 'clamp(12px, 2vw, 32px)',
      zIndex: 8,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    }}>
      {/* Feed count */}
      <div style={{
        fontSize: 'clamp(10px, 0.85vw, 13px)',
        color: 'rgba(255,255,255,0.65)',
        textAlign: 'center',
        textShadow: '0 1px 4px rgba(0,0,0,0.2)',
        lineHeight: 1.5,
      }}>
        <div>今日投喂 <span style={{ fontWeight: 700, fontSize: '1.2em', color: 'rgba(255,255,255,0.85)' }}>{todayFeedCount}</span> 次</div>
        {topItemName && (
          <div style={{ opacity: 0.7 }}>
            🏆 {topItemName} ×{topCount}
          </div>
        )}
      </div>

      {/* Radar chart */}
      <svg
        viewBox={`0 0 ${CENTER * 2} ${CENTER * 2}`}
        style={{
          width: 'clamp(90px, 10vw, 140px)',
          height: 'clamp(90px, 10vw, 140px)',
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))',
          opacity: 0.8,
        }}
      >
        {/* Data polygon */}
        <polygon
          points={dataPoints}
          fill="rgba(255,255,255,0.1)"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="1"
          style={{ transition: 'all 1.5s ease' }}
        />

        {/* Labels */}
        {MOOD_DIMENSIONS.map((dim, i) => {
          const angle = i * angleStep;
          const [x, y] = polarToCartesian(angle, LABEL_RADIUS);
          return (
            <text
              key={`label-${i}`}
              x={x} y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="rgba(255,255,255,0.5)"
              fontSize="5"
              style={{ pointerEvents: 'none' }}
            >
              {dim.emoji}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
