// ====== 底部导航栏 + 弹出面板 ======
// 旅行青蛙风格 — 底部 emoji 图标栏 + 全屏弹出层
// 替换原来的右侧滑出 SidePanel

import { useState, useRef, useEffect, useMemo } from 'react';
import { useUIStore } from '../store/uiStore';
import { usePigeonStore } from '../store/pigeonStore';
import type { DriftBottle } from '../types';
import { haptic } from '../utils/haptic';
import DailyJournal from './DailyJournal';
import DailyNewspaper from './DailyNewspaper';
import ObservationArchive from './ObservationArchive';
import StatsDashboard from './StatsDashboard';
import BackpackView from './BackpackView';
import SHARDS from '../data/memoryShards';
import { landmarkPhotos, pickCaption } from '../data/photoGallery';

type TabId = 'journal' | 'newspaper' | 'collection' | 'mailbox';

const NAV_ITEMS: { id: TabId; emoji: string; label: string }[] = [
  { id: 'journal',    emoji: '📖', label: '日记' },
  { id: 'newspaper',  emoji: '📰', label: '鸽报' },
  { id: 'collection', emoji: '📚', label: '图鉴' },
  { id: 'mailbox',    emoji: '💌', label: '信箱' },
];

// 今日投喂 — 导航上方弱提示
function TodayFeedLine() {
  const todayFeedCount = usePigeonStore((s) => s.todayFeedCount);
  const feedTotals = usePigeonStore((s) => s.feedTotals);
  const total = Object.values(feedTotals).reduce((a, b) => a + b, 0);
  return (
    <div style={{
      position: 'absolute', bottom: 68, left: 0, right: 0,
      zIndex: 15, pointerEvents: 'none',
      textAlign: 'center',
      fontSize: 12, color: '#8B7355',
      opacity: 0.65, paddingBottom: 8,
    }}>
      🧺 今日 {todayFeedCount} 次 · 累计 {total} 次
    </div>
  );
}

export default function BottomNav() {
  const bottomSheet = useUIStore((s) => s.bottomSheet);
  const openBottomSheet = useUIStore((s) => s.openBottomSheet);
  const closeBottomSheet = useUIStore((s) => s.closeBottomSheet);

  return (
    <>
      {/* ── 投喂统计弱提示 ── */}
      <TodayFeedLine />

      {/* ── 底部毛玻璃导航 ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        zIndex: 15,
        height: 68,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 'clamp(4px, 1.5vw, 12px)',
        padding: '0 clamp(12px, 2vw, 24px)',
        background: 'rgba(248,244,234,0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(0,0,0,0.04)',
      }}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onPointerDown={(e) => {
              e.stopPropagation();
              haptic('tap');
              openBottomSheet(item.id);
            }}
            style={{
              width: 'clamp(44px, 11vw, 56px)',
              borderRadius: 12,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              fontSize: 28,
              color: bottomSheet === item.id ? '#C4776B' : '#9B9489',
              transition: 'color 0.2s ease',
              WebkitTapHighlightColor: 'transparent',
              padding: 0,
            }}
          >
            <span style={{ lineHeight: 1 }}>{item.emoji}</span>
            <span style={{
              fontSize: 11,
              fontWeight: 500,
              lineHeight: 1,
              color: 'inherit',
            }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* ── 弹出层 ── */}
      {bottomSheet && (
        <BottomSheetContent tab={bottomSheet} onClose={closeBottomSheet} />
      )}
    </>
  );
}

// ====== 全屏弹出层 ======
function BottomSheetContent({ tab, onClose }: { tab: string; onClose: () => void }) {
  const title = NAV_ITEMS.find((n) => n.id === tab);

  return (
    <div
      onPointerDown={(e) => {
        if ((e.target as HTMLElement) === e.currentTarget) onClose();
      }}
      style={{
      position: 'absolute', inset: 0, zIndex: 25,
      background: 'rgba(50,35,20,0.35)',
      display: 'flex', flexDirection: 'column',
      animation: 'fadeIn 0.25s ease',
    }}>
      {/* 面板 */}
      <div style={{
        flex: 1,
        margin: 'clamp(32px, 5vh, 56px) clamp(12px, 2vw, 24px) clamp(12px, 2vh, 20px)',
        background: 'rgba(255,252,245,0.97)',
        borderRadius: 24,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
        animation: 'fadeInUp 0.35s cubic-bezier(0.34, 1.4, 0.64, 1) both',
        pointerEvents: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'clamp(14px, 2vh, 20px) clamp(16px, 3vw, 24px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}>
          <div style={{
            fontSize: 'clamp(15px, 1.5vw, 20px)',
            fontWeight: 700, color: '#4A3728',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>{title?.emoji}</span>
            <span>{title?.label}</span>
          </div>
          <button
            onPointerDown={(e) => { e.stopPropagation(); haptic('tap'); onClose(); }}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              border: 'none', background: 'rgba(0,0,0,0.06)',
              fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#6B5A4A',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {tab === 'journal'    && <DailyJournal />}
          {tab === 'newspaper'  && <NewspaperWithStats />}
          {tab === 'collection' && <CollectionView />}
          {tab === 'mailbox'    && <MessageStream />}
        </div>
      </div>
    </div>
  );
}

// ====== 鸽报 + 统计（合并在一个面板） ======
function NewspaperWithStats() {
  const [showStats, setShowStats] = useState(false);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {showStats ? <StatsDashboard /> : <DailyNewspaper />}
      </div>
      <div style={{
        padding: '8px 16px', borderTop: '1px solid rgba(0,0,0,0.04)',
        display: 'flex', justifyContent: 'center',
      }}>
        <button
          onPointerDown={() => { setShowStats((v) => !v); haptic('tap'); }}
          style={{
            border: 'none', borderRadius: 14,
            background: 'rgba(139,115,85,0.06)',
            padding: '6px 16px', cursor: 'pointer',
            fontSize: 12, color: '#8B7355', fontWeight: 500,
          }}
        >
          {showStats ? '📰 看鸽报' : '🪶 成长记录'}
        </button>
      </div>
    </div>
  );
}

// ====== 图鉴 = 遇见的朋友 + 背包 + 记忆碎片 + 足迹照片 ======
function CollectionView() {
  const [tab, setTab] = useState<'observe' | 'backpack' | 'memories' | 'footprints'>('observe');
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex', gap: 4, padding: '10px 14px',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
      }}>
        {[
          { id: 'observe' as const, emoji: '🔍', label: '遇见' },
          { id: 'backpack' as const, emoji: '🎒', label: '收集' },
          { id: 'memories' as const, emoji: '💭', label: '记忆' },
          { id: 'footprints' as const, emoji: '📸', label: '足迹' },
        ].map(({ id, emoji, label }) => (
          <button
            key={id}
            onPointerDown={() => setTab(id)}
            style={{
              flex: 1, border: 'none', borderRadius: 12,
              background: tab === id ? 'rgba(196,119,107,0.1)' : 'rgba(139,115,85,0.04)',
              padding: '8px 6px', cursor: 'pointer',
              fontSize: 11, fontWeight: 600,
              color: tab === id ? '#C4776B' : '#8B7355',
              transition: 'all 0.2s ease',
            }}
          >
            {emoji} {label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'observe' && <ObservationArchive />}
        {tab === 'backpack' && <BackpackView />}
        {tab === 'memories' && <MemoryAlbum />}
        {tab === 'footprints' && <FootprintGallery />}
      </div>
    </div>
  );
}

// ====== 足迹照片廊 ======
function FootprintGallery() {
  const unlockedFootprints = usePigeonStore((s) => s.unlockedFootprints);
  const unlockedSet = useMemo(() => new Set(unlockedFootprints), [unlockedFootprints]);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const totalPhotos = Object.values(landmarkPhotos).flat().length;
  const unlockedCount = unlockedFootprints.length;
  const allUnlocked = unlockedCount >= totalPhotos;

  return (
    <div style={{ padding: '16px' }}>
      <div style={{
        textAlign: 'center', marginBottom: 20,
        padding: '16px', background: allUnlocked
          ? 'linear-gradient(135deg, rgba(255,215,0,0.06), rgba(255,180,0,0.03))'
          : 'rgba(196,119,107,0.04)',
        borderRadius: 16,
        border: allUnlocked ? '1px solid rgba(255,180,0,0.12)' : 'none',
      }}>
        <div style={{ fontSize: 'clamp(28px, 3vw, 44px)', marginBottom: 4 }}>
          {allUnlocked ? '✨' : '📸'}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#4A3728', marginBottom: 2 }}>校园足迹</div>
        <div style={{ fontSize: 'clamp(20px, 2.5vw, 30px)', fontWeight: 700, color: '#C4776B', margin: '6px 0' }}>
          {unlockedCount} / {totalPhotos}
        </div>
        <div style={{ fontSize: 11, color: '#8B7355', opacity: 0.6 }}>
          {allUnlocked ? '所有足迹都留下了！ 🕊️' : `鸽子每到一个地方，就会解锁一张照片 · 还差 ${totalPhotos - unlockedCount} 张`}
        </div>
      </div>

      {Object.entries(landmarkPhotos).map(([landmark, imgs]) => {
        const unlockedHere = imgs.filter((img) => unlockedSet.has(img.path));
        const anyHere = unlockedHere.length > 0;
        return (
          <div key={landmark} style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: anyHere ? '#C4776B' : '#8B7355',
              marginBottom: 10, paddingBottom: 6,
              borderBottom: '1px solid rgba(196,119,107,0.08)',
              opacity: anyHere ? 1 : 0.45,
            }}>
              📍 {landmark} · {unlockedHere.length} / {imgs.length}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 9 }}>
              {imgs.map((img, i) => {
                const isUnlocked = unlockedSet.has(img.path);
                return (
                  <div key={i} style={{
                    borderRadius: 12, overflow: 'hidden',
                    background: isUnlocked ? 'rgba(255,248,231,0.5)' : 'rgba(0,0,0,0.02)',
                    border: isUnlocked ? '1px solid rgba(196,119,107,0.06)' : '1px solid rgba(0,0,0,0.03)',
                    opacity: isUnlocked ? 1 : 0.3,
                  }}>
                    {isUnlocked ? (
                      <>
                        <div
                          onPointerDown={() => setLightboxSrc(img.path)}
                          style={{ width: '100%', aspectRatio: '4/3', overflow: 'hidden', background: 'rgba(0,0,0,0.03)', cursor: 'pointer' }}>
                          <img
                            src={img.path}
                            alt={img.captions[0]}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
                          />
                        </div>
                        <div style={{
                          padding: '6px 8px', fontSize: 10, color: '#8B7355',
                          textAlign: 'center', fontWeight: 500, lineHeight: 1.5,
                        }}>
                          {pickCaption(img.captions)}
                        </div>
                      </>
                    ) : (
                      <div style={{
                        width: '100%', aspectRatio: '4/3',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, color: '#8B7355', opacity: 0.25,
                      }}>
                        🔒
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Lightbox — 点击放大 */}
      {lightboxSrc && (
        <div
          onPointerDown={() => setLightboxSrc(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}>
          <img src={lightboxSrc} alt="足迹照片"
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              maxWidth: '95vw', maxHeight: '90vh',
              objectFit: 'contain', borderRadius: 12,
              boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
            }} />
        </div>
      )}

      <div style={{ height: 40 }} />
    </div>
  );
}

// ====== 记忆碎片收藏册 ======
function MemoryAlbum() {
  const [discoveredIds, setDiscoveredIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('pigeon-discovered-shards');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });

  const discoveredCount = discoveredIds.size;
  const totalCount = SHARDS.length;
  const allDiscovered = discoveredCount >= totalCount;

  // 按地标分组（只显示已收集的）
  const byLandmark = useMemo(() => {
    const map: Record<string, typeof SHARDS> = {};
    for (const s of SHARDS) {
      if (!discoveredIds.has(s.id)) continue;
      const key = s.landmarkId;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return map;
  }, [discoveredIds]);

  // 未收集的按地标分组
  const undiscoveredByLandmark = useMemo(() => {
    const map: Record<string, typeof SHARDS> = {};
    for (const s of SHARDS) {
      if (discoveredIds.has(s.id)) continue;
      const key = s.landmarkId;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return map;
  }, [discoveredIds]);

  const landmarkNames: Record<string, string> = {
    'siyuan-lake': '思源湖', 'new-library': '图书馆', 'temple-gate': '庙门',
    'botanical-garden': '植物园', 'seiee-lawn': '电院草坪', 'zhiyuan-lake': '致远湖',
    'dining-hall-1': '食堂', 'south-stadium': '南区体育场', 'nan-da-men': '南大门',
    'siyuan-men': '思源门', 'east-middle': '东中院', 'design-school': '设计学院',
    'humanities-school': '人文学院', 'east-lower': '东下院', 'hufaguang-stadium': '胡法光体育场',
  };

  // 轮询 localStorage 变化（跨 tab 同步）
  useEffect(() => {
    const check = () => {
      try {
        const raw = localStorage.getItem('pigeon-discovered-shards');
        if (raw) {
          const ids = new Set<string>(JSON.parse(raw));
          if (ids.size !== discoveredIds.size) setDiscoveredIds(ids);
        }
      } catch {}
    };
    const id = setInterval(check, 3000);
    return () => clearInterval(id);
  }, [discoveredIds.size]);

  if (discoveredCount === 0) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#8B7355', fontSize: 'clamp(12px, 1vw, 15px)', lineHeight: 2 }}>
        <div style={{ fontSize: 'clamp(28px, 2.5vw, 44px)', marginBottom: 12 }}>💭</div>
        <div>还没有收集到记忆碎片</div>
        <div style={{ fontSize: '0.85em', opacity: 0.7 }}>在地图上点击浮现的 💭 </div>
        <div style={{ fontSize: '0.85em', opacity: 0.7 }}>它们会出现在这里</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* 收集进度 */}
      <div style={{
        textAlign: 'center', marginBottom: 20,
        padding: '16px', background: allDiscovered
          ? 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,180,0,0.04))'
          : 'rgba(196,119,107,0.04)',
        borderRadius: 16,
        border: allDiscovered ? '1px solid rgba(255,180,0,0.15)' : 'none',
      }}>
        <div style={{ fontSize: 'clamp(28px, 3vw, 44px)', marginBottom: 4 }}>
          {allDiscovered ? '✨' : '💭'}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#4A3728', marginBottom: 2 }}>
          校园记忆碎片
        </div>
        <div style={{ fontSize: 'clamp(22px, 2.5vw, 32px)', fontWeight: 700, color: '#C4776B', margin: '6px 0' }}>
          {discoveredCount} / {totalCount}
        </div>
        <div style={{ fontSize: 11, color: '#8B7355', opacity: 0.6 }}>
          {allDiscovered ? '你已集齐所有校园记忆 🕊️' : `还差 ${totalCount - discoveredCount} 条 · 在地图上点击 💭 收集`}
        </div>
      </div>

      {/* 已收集 */}
      {Object.entries(byLandmark).map(([lmId, shards]) => (
        <div key={lmId} style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: '#C4776B',
            marginBottom: 8, paddingBottom: 6,
            borderBottom: '1px solid rgba(196,119,107,0.08)',
          }}>
            📍 {landmarkNames[lmId] || lmId} · {shards.length} 条
          </div>
          {shards.map((s) => (
            <div key={s.id} style={{
              padding: '10px 12px', marginBottom: 6,
              background: 'rgba(255,248,231,0.5)', borderRadius: 12,
              fontSize: 12, color: '#4A3728', lineHeight: 1.7,
              border: '1px solid rgba(196,119,107,0.06)',
              animation: 'fadeInUp 0.3s ease both',
            }}>
              <span style={{ marginRight: 6 }}>{s.emoji}</span>
              <span style={{ fontSize: 11, color: '#C4776B', fontWeight: 600, marginRight: 4 }}>{s.year}</span>
              「{s.text}」
            </div>
          ))}
        </div>
      ))}

      {/* 未收集预览 */}
      {Object.keys(undiscoveredByLandmark).length > 0 && (
        <div style={{ marginTop: 8, marginBottom: 20 }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: '#8B7355', opacity: 0.6,
            marginBottom: 10,
          }}>
            🔒 尚未发现的记忆
          </div>
          {Object.entries(undiscoveredByLandmark).map(([lmId, shards]) => (
            <div key={'und-' + lmId} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#8B7355', opacity: 0.4, marginBottom: 4 }}>
                📍 {landmarkNames[lmId] || lmId} · {shards.length} 条
              </div>
              {shards.map((s) => (
                <div key={s.id} style={{
                  padding: '8px 10px', marginBottom: 4,
                  background: 'rgba(0,0,0,0.02)', borderRadius: 10,
                  fontSize: 11, color: '#8B7355', opacity: 0.3,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span>❓</span>
                  <span>尚未发现</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div style={{ height: 40 }} />
    </div>
  );
}

// ====== MessageStream ======
function MessageStream() {
  const messages = usePigeonStore((s) => s.messages);
  const postMessage = usePigeonStore((s) => s.postMessage);
  const retrieveBottle = usePigeonStore((s) => s.retrieveBottle);
  const lastBottleReply = usePigeonStore((s) => s.lastBottleReply);
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState('💌');
  const lastPostRef = useRef(0);
  const lastRetrieveRef = useRef(0);
  const [retrievedBottle, setRetrievedBottle] = useState<DriftBottle | null>(null);
  const [revealBottle, setRevealBottle] = useState(false);
  const [showReply, setShowReply] = useState(false);

  const EMOJIS = ['💌', '❤️', '😊', '📝', '🍀', '🌟', '💪', '🕊️', '🌸', '🎓', '☕', '🍞'];

  // 监听鸽子的回复
  useEffect(() => {
    if (lastBottleReply && retrievedBottle && lastBottleReply.noteText === retrievedBottle.text) {
      // 延迟显示回复，给纸条展开动画时间
      const t = setTimeout(() => setShowReply(true), 1500);
      return () => clearTimeout(t);
    }
  }, [lastBottleReply, retrievedBottle]);

  const handleSend = () => {
    if (!text.trim()) return;
    if (Date.now() - lastPostRef.current < 30000) return;
    lastPostRef.current = Date.now();
    haptic('send');
    postMessage(emoji, text);
    setText('');
  };

  const handleRetrieve = () => {
    if (Date.now() - lastRetrieveRef.current < 30000) return;
    lastRetrieveRef.current = Date.now();
    haptic('retrieve');
    setShowReply(false);
    const bottle = retrieveBottle();
    if (bottle) {
      setRetrievedBottle(bottle);
      setRevealBottle(false);
      setTimeout(() => setRevealBottle(true), 600);
    }
  };

  const cdRemain = (ref: React.MutableRefObject<number>) => Math.max(0, 30 - Math.floor((Date.now() - ref.current) / 1000));
  const floatingMessages = messages.filter((m) => m.status === 'floating');
  const retrieveCooldown = cdRemain(lastRetrieveRef);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: retrievedBottle ? 10 : 0 }}>
          <button onPointerDown={handleRetrieve} disabled={retrieveCooldown > 0} style={{
            border: 'none', borderRadius: 20,
            background: retrieveCooldown > 0 ? 'rgba(0,0,0,0.06)' : 'linear-gradient(135deg, #4682B4, #5F9EA0)',
            color: retrieveCooldown > 0 ? '#8B7355' : 'white',
            padding: '8px 18px', cursor: retrieveCooldown > 0 ? 'default' : 'pointer',
            fontWeight: 600, fontSize: 'clamp(12px, 1vw, 15px)', whiteSpace: 'nowrap',
          }}>
            {retrieveCooldown > 0 ? `捞一个 (${retrieveCooldown}s)` : '🫧 捞一个'}
          </button>
          <span style={{ fontSize: 'clamp(10px, 0.8vw, 12px)', color: '#8B7355', opacity: 0.7 }}>随机捞取一张漂流纸条</span>
        </div>

        {retrievedBottle && (
          <div style={{
            background: 'linear-gradient(135deg, #FFF8E7, #FFF0D0)', borderRadius: 14, padding: '16px 18px',
            border: '1px solid rgba(196,119,107,0.1)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            animation: 'fadeInUp 0.5s ease both', position: 'relative',
          }}>
            <div style={{ fontSize: 'clamp(28px, 2.5vw, 40px)', textAlign: 'center', marginBottom: 8 }}>{retrievedBottle.emoji}</div>
            <div style={{
              fontSize: 'clamp(14px, 1.3vw, 20px)', color: '#4A3728', textAlign: 'center',
              lineHeight: 1.8, fontWeight: 500, opacity: revealBottle ? 1 : 0,
              transform: revealBottle ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.8s ease, transform 0.8s ease', minHeight: '2em',
            }}>
              {revealBottle ? retrievedBottle.text : '...'}
            </div>
            <div style={{ textAlign: 'center', marginTop: 8, fontSize: 'clamp(9px, 0.7vw, 11px)', color: '#8B7355', opacity: 0.6 }}>
              {revealBottle ? '—— 漂流中的纸条' : '纸条正在展开...'}
            </div>

            {/* 鸽子回复 */}
            {showReply && lastBottleReply && (
              <div style={{
                marginTop: 12, padding: '12px 16px',
                background: 'rgba(196,119,107,0.08)',
                borderRadius: 12,
                border: '1px solid rgba(196,119,107,0.15)',
                animation: 'fadeInUp 0.5s ease both',
              }}>
                <div style={{ fontSize: 'clamp(10px, 0.8vw, 12px)', color: '#C4776B', fontWeight: 600, marginBottom: 4 }}>
                  🕊️ 鸽子回复了这张纸条：
                </div>
                <div style={{
                  fontSize: 'clamp(13px, 1.1vw, 16px)', color: '#4A3728',
                  lineHeight: 1.7, fontWeight: 500,
                }}>
                  「{lastBottleReply.reply}」
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
        {floatingMessages.length === 0 && <EmptyState emoji="💌" title="还没有漂流瓶" desc="写点什么扔出去吧" />}
        {floatingMessages.map((m) => {
          const mins = Math.floor((Date.now() - m.timestamp) / 60000);
          const timeStr = mins < 1 ? '刚刚' : mins < 60 ? `${mins}分钟前` : `${Math.floor(mins / 60)}小时前`;
          return (
            <div key={m.id} style={{
              background: 'rgba(196,119,107,0.05)', borderRadius: 12, padding: '10px 14px',
              marginBottom: 8, fontSize: 'clamp(11px, 0.9vw, 14px)', color: '#4A3728',
              opacity: m.pickedByPigeon ? 0.5 : 1,
            }}>
              <span style={{ marginRight: 6 }}>{m.emoji}</span>{m.text}
              {m.pickedByPigeon && <span style={{ fontSize: '0.8em', marginLeft: 6, opacity: 0.7 }}>🕊️</span>}
              <span style={{ float: 'right', color: '#8B7355', fontSize: '0.8em' }}>{timeStr}</span>
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '10px 12px calc(12px + env(safe-area-inset-bottom, 20px))' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {EMOJIS.map((e) => (
            <button key={e} onPointerDown={() => setEmoji(e)} style={{
              border: emoji === e ? '2px solid #C4776B' : '2px solid transparent',
              background: 'transparent', borderRadius: 8,
              fontSize: 'clamp(18px, 2.5vw, 24px)',
              cursor: 'pointer', padding: '3px 2px', lineHeight: 1,
            }}>{e}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={text} onChange={(e) => setText(e.target.value.slice(0, 30))} placeholder="说点什么..." maxLength={30}
            style={{ flex: 1, minWidth: 0, border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, padding: '12px 14px', fontSize: '15px', outline: 'none', background: 'rgba(255,255,255,0.6)', fontFamily: 'inherit' }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }} />
          <button onPointerDown={handleSend} style={{
            border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #C4776B, #D4947E)',
            color: 'white', padding: '12px 20px', cursor: 'pointer', fontWeight: 700, fontSize: '15px',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>扔出</button>
        </div>
        <div style={{ textAlign: 'center', fontSize: '11px', color: '#8B7355', marginTop: 6, opacity: 0.6 }}>匿名留言 · 30秒间隔</div>
      </div>
    </div>
  );
}

function EmptyState({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#8B7355', fontSize: 'clamp(12px, 1vw, 15px)', lineHeight: 2 }}>
      <div style={{ fontSize: 'clamp(28px, 2.5vw, 44px)', marginBottom: 12 }}>{emoji}</div>
      <div>{title}</div>
      <div style={{ fontSize: '0.85em', opacity: 0.7 }}>{desc}</div>
    </div>
  );
}
