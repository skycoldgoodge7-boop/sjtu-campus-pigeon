// ====== 校园地图 ======
// 手绘底图 + 鸽子 + 固定上方气泡
// 鸽子约束在 MAP_BOUNDS 内

import { usePigeonStore, getActivityLabel } from '../store/pigeonStore';
import { useUIStore } from '../store/uiStore';
import { landmarks } from '../data/landmarks';
import { MAP_POSITIONS } from '../data/mapLayout';
import { getRandomShard } from '../data/memoryShards';
import type { MemoryShard } from '../data/memoryShards';
import { getDailyDiscovery } from '../data/dailyDiscoveries';
import type { CampusState, TimeOfDay } from '../types';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import PigeonSprite from './PigeonSprite';
import TerrainLayer from './TerrainLayer';

const EMOTION_FILTERS: Record<CampusState, string> = {
  exam: 'rgba(180,190,210,0.05)',
  spring: 'rgba(255,220,210,0.04)',
  graduation: 'rgba(240,225,200,0.05)',
  normal: 'transparent',
};
const TIME_DIM: Record<TimeOfDay, string> = {
  dawn: 'transparent', morning: 'transparent', afternoon: 'transparent',
  evening: 'rgba(230,180,150,0.03)', night: 'rgba(30,30,50,0.10)',
};
const MAP_PADDING = 8; // 百分比边距，鸽子不飞出边缘
const SHARD_PADDING_TOP = 12;  // 记忆碎片顶部留白，避开 InfoBar
const SHARD_PADDING_BOTTOM = 5;  // 记忆碎片底部留白，避开 BottomNav（须 ≥95% 以容纳庙门 94.5、植物园 91.5）

function clampPos(v: number): number {
  return Math.max(MAP_PADDING, Math.min(100 - MAP_PADDING, v));
}

function clampShardTop(v: number): number {
  return Math.max(SHARD_PADDING_TOP, Math.min(100 - SHARD_PADDING_BOTTOM, v));
}

export default function CampusMap() {
  const currentLandmarkId = usePigeonStore((s) => s.currentLandmarkId);
  const targetLandmarkId = usePigeonStore((s) => s.targetLandmarkId);
  const pigeonActivity = usePigeonStore((s) => s.pigeonActivity);
  const recentStatusText = usePigeonStore((s) => s.recentStatusText);
  const statusExpiresAt = usePigeonStore((s) => s.statusTextExpiresAt);
  const voteRitualDone = usePigeonStore((s) => s.voteRitualDone);
  const voteRitualLabel = usePigeonStore((s) => s.voteRitualLabel);
  const campusState = useUIStore((s) => s.campusState);
  const timeOfDay = useUIStore((s) => s.timeOfDay);

  const pos = MAP_POSITIONS.find((p) => p.landmarkId === currentLandmarkId);
  const targetPos = targetLandmarkId ? MAP_POSITIONS.find((p) => p.landmarkId === targetLandmarkId) : null;
  const initialPos = MAP_POSITIONS[0];
  const [px, setPx] = useState(() => clampPos(pos?.leftPercent ?? initialPos?.leftPercent ?? 47));
  const [py, setPy] = useState(() => clampPos(pos?.topPercent ?? initialPos?.topPercent ?? 40));

  useEffect(() => {
    if (!pos) return;
    setPx(clampPos(pos.leftPercent));
    setPy(clampPos(pos.topPercent));
  }, [currentLandmarkId, pos]);

  const landmark = landmarks.find((l) => l.id === currentLandmarkId);
  const isMoving = pigeonActivity === 'walking';

  const statusText = useMemo(() => {
    if (recentStatusText && Date.now() < statusExpiresAt) return recentStatusText;
    return getActivityLabel(pigeonActivity, '');
  }, [recentStatusText, statusExpiresAt, pigeonActivity]);

  // ── 校友记忆碎片 ──
  const DISCOVERED_KEY = 'pigeon-discovered-shards';
  const [memoryShard, setMemoryShard] = useState<MemoryShard | null>(null);
  const [revealedShard, setRevealedShard] = useState(false);
  const discoveredShardIdsRef = useRef<Set<string>>(
    (() => {
      try {
        const raw = localStorage.getItem(DISCOVERED_KEY);
        return raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
      } catch { return new Set<string>(); }
    })()
  );
  const shownShardIds = useRef<Set<string>>(new Set()); // 本轮已展示（防短期重复）
  const shardTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const discoverShard = useCallback((shardId: string) => {
    const ref = discoveredShardIdsRef;
    if (ref.current.has(shardId)) return;
    ref.current = new Set(ref.current);
    ref.current.add(shardId);
    try { localStorage.setItem(DISCOVERED_KEY, JSON.stringify(Array.from(ref.current))); } catch {}
  }, []);

  const rotateShard = useCallback(() => {
    // 优先浮现实时未揭示的，其次已揭示的
    const fresh = getRandomShard(Array.from(shownShardIds.current));
    const shard = fresh || getRandomShard();
    if (shard) {
      shownShardIds.current.add(shard.id);
      if (shownShardIds.current.size > 25) {
        const arr = Array.from(shownShardIds.current);
        shownShardIds.current = new Set(arr.slice(-10));
      }
      setMemoryShard(shard);
      setRevealedShard(false);
    }
    shardTimer.current = setTimeout(rotateShard, 25000 + Math.random() * 15000);
  }, []);

  useEffect(() => {
    // 10秒后第一次浮现
    const init = setTimeout(rotateShard, 10000);
    return () => {
      clearTimeout(init);
      if (shardTimer.current) clearTimeout(shardTimer.current);
    };
  }, [rotateShard]);

  const shardPos = memoryShard ? MAP_POSITIONS.find((p) => p.landmarkId === memoryShard.landmarkId) : null;

  // ── 今日发现 ✨ ──
  const [showDiscovery, setShowDiscovery] = useState(false);
  const todayDiscovery = useMemo(() => getDailyDiscovery(), []);

  useEffect(() => {
    // 15秒后浮现
    const t = setTimeout(() => setShowDiscovery(true), 15000);
    return () => clearTimeout(t);
  }, []);

  // ── 瞬时微状态 ──
  const MICRO_STATUSES = [
    '发呆中…', '看湖面', '想事情', '偷听聊天', '晒太阳',
    '盯着蚂蚁', '梳理羽毛', '眯着眼', '歪着头', '数云',
    '等人来', '假装没在看', '打了个哈欠', '抖了抖翅膀',
    '看树叶', '竖起耳朵', '踱来踱去', '缩成团', '探出头',
  ];
  const [microStatus, setMicroStatus] = useState('');
  const [showMicro, setShowMicro] = useState(false);
  const microTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rotateMicro = useCallback(() => {
    setMicroStatus(MICRO_STATUSES[Math.floor(Math.random() * MICRO_STATUSES.length)]);
    setShowMicro(true);
    // 5-8s 后淡出
    setTimeout(() => setShowMicro(false), 5000 + Math.random() * 3000);
    // 12-25s 后再次出现
    microTimer.current = setTimeout(rotateMicro, 12000 + Math.random() * 13000);
  }, []);

  useEffect(() => {
    const init = setTimeout(rotateMicro, 5000);
    return () => {
      clearTimeout(init);
      if (microTimer.current) clearTimeout(microTimer.current);
    };
  }, [rotateMicro]);

  return (
    <div className="map-container" style={{
      position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
    }}>
      <TerrainLayer />

      {/* ── 鸽子 + 跟随气泡 ── */}
      <div style={{
        position: 'absolute',
        left: `${px}%`, top: `${py}%`,
        transform: 'translate(-50%, -60%)',
        zIndex: 5,
        transition: 'left 6s ease-in-out, top 6s ease-in-out',
        pointerEvents: 'none',
      }}>
        {/* 气泡 — 永远在鸽子上方，带地点+状态 */}
        {!isMoving && (
          <div style={{
            position: 'absolute',
            left: '50%', transform: 'translateX(-50%)',
            bottom: 'calc(100% + 10px)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            animation: 'fadeInUp 0.4s ease',
          }}>
            <div style={{
              background: 'rgba(255,252,245,0.94)',
              backdropFilter: 'blur(8px)',
              borderRadius: 14,
              padding: '5px 12px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
              textAlign: 'center',
            }}>
              {landmark && (
                <div style={{
                  fontSize: 'clamp(9px, 0.85vw, 12px)',
                  fontWeight: 700,
                  color: '#4A3728',
                  marginBottom: 2,
                }}>
                  📍 {landmark.name}
                </div>
              )}
              <div style={{
                fontSize: 'clamp(8px, 0.75vw, 11px)',
                color: '#6B5A4A',
                opacity: 0.85,
              }}>
                💭 {statusText}
              </div>
            </div>
            <div style={{
              width: 0, height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid rgba(255,252,245,0.94)',
              margin: '0 auto',
            }} />
          </div>
        )}

        {/* 鸽子 */}
        <div style={{
          animation: isMoving ? 'pigeonFloat 1.5s ease-in-out infinite' : 'pigeonBreathe 3s ease-in-out infinite',
          filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.15))',
        }}>
          <PigeonSprite
            activity={pigeonActivity}
            width="clamp(42px, 5.5vw, 68px)"
          />
        </div>
      </div>

      {/* ── 瞬时微状态 ── */}
      {!isMoving && microStatus && (
        <div style={{
          position: 'absolute',
          left: `${px}%`, top: `${py + 3}%`,
          transform: 'translate(-50%, 0)',
          zIndex: 4, pointerEvents: 'none',
          opacity: showMicro ? 1 : 0,
          transition: 'opacity 0.8s ease',
        }}>
          <div style={{
            background: 'rgba(255,252,245,0.85)',
            backdropFilter: 'blur(4px)',
            borderRadius: 10,
            padding: '3px 10px',
            fontSize: 'clamp(9px, 0.8vw, 11px)',
            color: '#8B7355', fontWeight: 400,
            animation: 'fadeInUp 0.5s ease both',
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}>
            {microStatus}
          </div>
        </div>
      )}

      {/* 目的地呼吸指示（飞行中可见） */}
      {isMoving && targetPos && (
        <div style={{
          position: 'absolute',
          left: `${clampPos(targetPos.leftPercent)}%`,
          top: `${clampPos(targetPos.topPercent)}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: 3, pointerEvents: 'none',
        }}>
          {/* 脉冲光环 */}
          <div style={{
            width: 'clamp(24px, 4vw, 48px)',
            height: 'clamp(24px, 4vw, 48px)',
            borderRadius: '50%',
            border: '2px dashed rgba(196,119,107,0.3)',
            animation: 'targetPulse 2s ease-in-out infinite',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 'clamp(6px, 1vw, 12px)',
              height: 'clamp(6px, 1vw, 12px)',
              borderRadius: '50%',
              background: 'rgba(196,119,107,0.4)',
              animation: 'targetDot 1.5s ease-in-out infinite',
            }} />
          </div>
        </div>
      )}

      {/* 当前地点呼吸光晕 */}
      {!isMoving && pos && (
        <div style={{
          position: 'absolute',
          left: `${clampPos(pos.leftPercent)}%`,
          top: `${clampPos(pos.topPercent)}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: 2, pointerEvents: 'none',
        }}>
          <div style={{
            width: 'clamp(36px, 6vw, 72px)',
            height: 'clamp(36px, 6vw, 72px)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,242,225,0.25) 0%, transparent 70%)',
            animation: 'landmarkBreathe 4s ease-in-out infinite',
          }} />
        </div>
      )}

      {/* ── 今日发现 ✨ ── */}
      {showDiscovery && todayDiscovery && (
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            setShowDiscovery(false);
          }}
          style={{
            position: 'absolute',
            right: 'clamp(8px, 2vw, 18px)',
            top: 'clamp(80px, 12vh, 140px)',
            zIndex: 4, pointerEvents: 'auto',
            cursor: 'pointer',
            animation: 'fadeInUp 0.6s ease both',
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,248,220,0.94), rgba(255,240,200,0.94))',
            backdropFilter: 'blur(8px)',
            borderRadius: 16,
            padding: '10px 14px',
            boxShadow: '0 2px 16px rgba(180,160,100,0.1)',
            border: '1px solid rgba(200,180,120,0.15)',
            maxWidth: 'clamp(160px, 40vw, 240px)',
            fontSize: 'clamp(11px, 0.9vw, 13px)',
            color: '#4A3728',
            lineHeight: 1.6,
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <span style={{ fontSize: 'clamp(18px, 2vw, 24px)', flexShrink: 0 }}>✨</span>
            <div>
              <div style={{ fontSize: 10, color: '#C4776B', fontWeight: 600, marginBottom: 2 }}>今日发现</div>
              <div>{todayDiscovery.text}</div>
              <div style={{ fontSize: 10, color: '#8B7355', opacity: 0.5, marginTop: 4 }}>点击收起</div>
            </div>
          </div>
        </div>
      )}

      {/* ── 校友记忆碎片 💭 ── */}
      {memoryShard && shardPos && (
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            setRevealedShard((v) => {
              if (!v && memoryShard) {
                // 被展开 → 收藏
                discoverShard(memoryShard.id);
              }
              return !v;
            });
          }}
          style={{
            position: 'absolute',
            left: `${clampPos(shardPos.leftPercent)}%`,
            top: `${clampShardTop(shardPos.topPercent)}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 50, pointerEvents: 'auto',
            cursor: 'pointer',
            animation: 'fadeInUp 0.6s ease both',
          }}
        >
          {!revealedShard ? (
            /* 未展开 — emoji 气泡 */
            <div style={{
              background: 'rgba(255,252,245,0.9)',
              backdropFilter: 'blur(4px)',
              borderRadius: 16,
              padding: '6px 12px',
              boxShadow: '0 2px 12px rgba(100,80,60,0.08)',
              fontSize: 'clamp(20px, 2.5vw, 28px)',
              animation: 'gentleFloat 3s ease-in-out infinite',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span>💭</span>
              <span style={{ fontSize: 'clamp(9px, 0.8vw, 11px)', color: '#8B7355', fontWeight: 500 }}>点击查看</span>
            </div>
          ) : (
            /* 展开 — 完整记忆 */
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,248,231,0.96), rgba(255,240,208,0.96))',
              backdropFilter: 'blur(12px)',
              borderRadius: 18,
              padding: '14px 16px',
              boxShadow: '0 4px 20px rgba(100,80,60,0.1)',
              maxWidth: 'clamp(180px, 50vw, 280px)',
              border: '1px solid rgba(196,119,107,0.1)',
              animation: 'fadeInUp 0.35s ease both',
            }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: '#C4776B',
                marginBottom: 6,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <span>{memoryShard.emoji}</span>
                <span>{memoryShard.year}</span>
              </div>
              <div style={{
                fontSize: 'clamp(11px, 0.9vw, 14px)',
                color: '#4A3728',
                lineHeight: 1.8,
                fontWeight: 400,
              }}>
                「{memoryShard.text}」
              </div>
              <div style={{
                fontSize: 10, color: '#8B7355', opacity: 0.5,
                marginTop: 6, textAlign: 'right',
              }}>
                —— 校园记忆碎片
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── P2: 投票仪式 Toast ── */}
      {voteRitualDone && pigeonActivity === 'walking' && voteRitualLabel && (
        <div style={{
          position: 'absolute',
          bottom: 'clamp(100px, 22vh, 180px)',
          left: '50%', transform: 'translateX(-50%)',
          zIndex: 20, pointerEvents: 'none',
          animation: 'fadeInUp 0.5s ease both',
        }}>
          <div style={{
            background: 'rgba(255,252,245,0.96)',
            backdropFilter: 'blur(12px)',
            borderRadius: 18,
            padding: '14px 28px',
            boxShadow: '0 6px 28px rgba(100,80,50,0.14)',
            border: '1px solid rgba(196,167,107,0.2)',
            whiteSpace: 'nowrap',
          }}>
            <div style={{
              fontSize: 'clamp(26px, 3vw, 36px)',
              textAlign: 'center',
              marginBottom: 4,
              animation: 'pigeonFloat 1.2s ease-in-out infinite',
            }}>
              🕊️
            </div>
            <div style={{
              fontSize: 'clamp(13px, 1.1vw, 16px)',
              fontWeight: 700,
              color: '#4A3728',
              textAlign: 'center',
            }}>
              大家决定了——咕咕飞向{voteRitualLabel}了～
            </div>
          </div>
        </div>
      )}

      {/* 滤镜 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: EMOTION_FILTERS[campusState],
        transition: 'background 4s ease', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: TIME_DIM[timeOfDay],
        transition: 'background 6s ease', pointerEvents: 'none',
      }} />
    </div>
  );
}
