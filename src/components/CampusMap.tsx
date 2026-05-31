// ====== Layer 4: 地标层 ======
// 简约童趣地图
// 水彩地形 + 地标节点 + 鸽子 + 情绪滤镜

import { usePigeonStore } from '../store/pigeonStore';
import { useUIStore } from '../store/uiStore';
import { landmarks } from '../data/landmarks';
import { MAP_POSITIONS, LANDMARK_TIERS, TIER_CONFIGS } from '../data/mapLayout';
import type { CampusState, PigeonActivity, TimeOfDay } from '../types';
import { useEffect, useState, useMemo } from 'react';
import pigeonImg from '../assets/pigeon/鸽子单体图.png';
import TerrainLayer from './TerrainLayer';

// ====== 情绪滤镜 ======
const EMOTION_FILTERS: Record<CampusState, string> = {
  exam:       'rgba(180,190,210,0.04)',
  spring:     'rgba(255,220,210,0.03)',
  graduation: 'rgba(240,225,200,0.04)',
  normal:     'transparent',
};

const TIME_DIM: Record<TimeOfDay, string> = {
  dawn:       'transparent',
  morning:    'transparent',
  afternoon:  'transparent',
  evening:    'rgba(230,180,150,0.03)',
  night:      'rgba(30,30,50,0.10)',
};

// ====== 活动动画 ======
const ACTIVITY_ANIMATIONS: Record<PigeonActivity, string> = {
  idle: '',
  walking: '',
  eating: 'wobble 0.5s ease infinite',
  sleeping: 'pulse 3s ease-in-out infinite',
  dancing: 'bob 0.3s ease infinite',
  thinking: '',
  preening: 'wobble 0.8s ease infinite',
  cooing: 'pulse 1.5s ease-in-out infinite',
  observing: 'wobble 1.2s ease infinite',
  perching: 'pulse 4s ease-in-out infinite',
  circling: 'bob 0.6s ease infinite',
  hopping: 'bounce 0.4s ease infinite',
  approaching: 'wobble 0.6s ease infinite',
  sheltering: '',
};

export default function CampusMap() {
  const currentLandmarkId = usePigeonStore((s) => s.currentLandmarkId);
  const pigeonActivity = usePigeonStore((s) => s.pigeonActivity);
  const campusState = useUIStore((s) => s.campusState);
  const timeOfDay = useUIStore((s) => s.timeOfDay);

  const pos = MAP_POSITIONS.find((p) => p.landmarkId === currentLandmarkId);
  const [px, setPx] = useState(pos?.leftPercent ?? 38);
  const [py, setPy] = useState(pos?.topPercent ?? 72);

  useEffect(() => {
    if (!pos) return;
    setPx(pos.leftPercent);
    setPy(pos.topPercent);
  }, [currentLandmarkId, pos]);

  const transitionStyle = 'left 8s ease-in-out, top 8s ease-in-out';

  // 鸽子与地标距离（动态避让）
  const distToLandmark = useMemo(() => {
    const dist: Record<string, number> = {};
    for (const mp of MAP_POSITIONS) {
      const dx = px - mp.leftPercent;
      const dy = py - mp.topPercent;
      dist[mp.landmarkId] = Math.sqrt(dx * dx + dy * dy);
    }
    return dist;
  }, [px, py]);

  return (
    <div className="map-container" style={{
      position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
    }}>
      {/* ── 水彩地形 ── */}
      <TerrainLayer />

      {/* ── 地标节点 ── */}
      {MAP_POSITIONS.map((mp) => {
        const lm = landmarks.find((l) => l.id === mp.landmarkId);
        if (!lm) return null;
        const tier = LANDMARK_TIERS[mp.landmarkId] || 2;
        const cfg = TIER_CONFIGS[tier];
        const isActive = mp.landmarkId === currentLandmarkId;
        const dist = distToLandmark[mp.landmarkId] || 999;

        // 动态避让
        const nearPigeon = dist < 8;
        const labelShiftX = nearPigeon ? (mp.leftPercent > px ? 4 : -4) : 0;
        const labelShiftY = nearPigeon ? -3 : 0;

        const labelStyle: React.CSSProperties = {
          position: 'absolute',
          fontSize: `calc(clamp(8px, 0.75vw, 12px) * ${cfg.scale})`,
          fontWeight: cfg.fontWeight,
          color: tier === 1 ? '#3A2720' : tier === 3 ? '#9B8B7D' : '#7A6B5D',
          whiteSpace: 'nowrap',
          letterSpacing: '0.3px',
          fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
          transition: 'transform 0.6s ease',
        };

        if (mp.labelPosition === 'top') {
          labelStyle.bottom = '108%';
          labelStyle.left = '50%';
          labelStyle.transform = `translateX(calc(-50% + ${labelShiftX}px)) translateY(${labelShiftY}px)`;
        } else if (mp.labelPosition === 'left') {
          labelStyle.right = '110%';
          labelStyle.top = '50%';
          labelStyle.transform = `translateY(calc(-50% + ${labelShiftY}px)) translateX(${labelShiftX}px)`;
        } else if (mp.labelPosition === 'right') {
          labelStyle.left = '110%';
          labelStyle.top = '50%';
          labelStyle.transform = `translateY(calc(-50% + ${labelShiftY}px)) translateX(${labelShiftX}px)`;
        } else {
          labelStyle.top = '108%';
          labelStyle.left = '50%';
          labelStyle.transform = `translateX(calc(-50% + ${labelShiftX}px)) translateY(${labelShiftY}px)`;
        }

        const iconSize = isActive
          ? `calc(clamp(28px, 3vw, 48px) * ${cfg.scale})`
          : `calc(clamp(20px, 2vw, 34px) * ${cfg.scale})`;

        return (
          <div key={mp.landmarkId} style={{
            position: 'absolute',
            left: `${mp.leftPercent}%`,
            top: `${mp.topPercent}%`,
            transform: 'translate(-50%, -50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            transition: 'all 0.8s ease',
            opacity: cfg.opacity,
            zIndex: isActive ? 4 : tier === 1 ? 3 : 2,
          }}>
            <div style={{
              width: iconSize, height: iconSize,
              borderRadius: tier === 1 ? '42% 58% 52% 48%' : '40% 60% 55% 45%',
              background: isActive
                ? 'rgba(255,252,245,0.96)'
                : tier === 1
                  ? 'rgba(255,252,245,0.88)'
                  : 'rgba(255,252,245,0.78)',
              boxShadow: isActive
                ? '0 2px 14px rgba(140,160,120,0.28), 0 1px 3px rgba(0,0,0,0.06)'
                : tier === 1
                  ? '0 2px 8px rgba(140,160,120,0.15), 0 1px 3px rgba(0,0,0,0.04)'
                  : '0 1px 4px rgba(0,0,0,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: `calc(${iconSize} * 0.55)`,
              lineHeight: 1,
            }}>
              {lm.emoji}
            </div>
            <span style={labelStyle}>{lm.name}</span>
          </div>
        );
      })}

      {/* ── 鸽子 ── */}
      <div style={{
        position: 'absolute',
        left: `${px}%`, top: `${py}%`,
        transform: 'translate(-50%, -80%)',
        zIndex: 5,
        transition: transitionStyle,
        filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.15))',
        pointerEvents: 'none',
      }}>
        <div style={{ animation: ACTIVITY_ANIMATIONS[pigeonActivity] || '' }}>
          <img
            src={pigeonImg}
            alt="校园鸽"
            style={{
              width: 'clamp(44px, 4.5vw, 72px)',
              height: 'auto',
              display: 'block',
            }}
          />
        </div>
        <div style={{
          width: '65%', height: 6, margin: '0 auto',
          background: 'rgba(0,0,0,0.07)', borderRadius: '50%',
        }} />
      </div>

      {/* ── 情绪滤镜 ── */}
      <div style={{
        position: 'absolute', inset: 0,
        background: EMOTION_FILTERS[campusState],
        transition: 'background 4s ease',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: TIME_DIM[timeOfDay],
        transition: 'background 6s ease',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
