// ====== 鸽子的背包 — 收藏品展示 ======
import { useState } from 'react';
import { usePigeonStore } from '../store/pigeonStore';
import { getTotalCollectibleCount } from '../data/backpackItems';
import type { BackpackItem } from '../types';

const RARITY_LABELS: Record<string, { label: string; color: string; glow: string }> = {
  common: { label: '常见', color: '#A0B888', glow: 'rgba(160,184,136,0.2)' },
  uncommon: { label: '稀有', color: '#C9A87A', glow: 'rgba(201,168,122,0.2)' },
  rare: { label: '珍奇', color: '#C4776B', glow: 'rgba(196,119,107,0.25)' },
};

export default function BackpackView() {
  const backpackItems = usePigeonStore((s) => s.backpackItems);
  const [activeItem, setActiveItem] = useState<BackpackItem | null>(null);

  const handleItemClick = (item: BackpackItem) => {
    setActiveItem(item);
  };

  const handleClose = () => {
    setActiveItem(null);
  };

  if (backpackItems.length === 0) {
    return (
      <div style={{
        padding: '40px 20px', textAlign: 'center',
        color: '#8B7355', fontSize: 'clamp(12px, 1vw, 15px)',
        lineHeight: 2,
      }}>
        <div style={{ fontSize: 'clamp(28px, 2.5vw, 44px)', marginBottom: 12 }}>🎒</div>
        <div>鸽子的背包还是空的</div>
        <div style={{ fontSize: '0.85em', opacity: 0.7 }}>它每到一个新地方，就会捡一件小东西</div>
        <div style={{ fontSize: '0.85em', opacity: 0.7 }}>在校园里多转转吧～</div>
      </div>
    );
  }

  return (
    <>
      <div style={{ padding: '16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <div style={{
            fontSize: 'clamp(13px, 1.1vw, 16px)',
            fontWeight: 700, color: '#4A3728',
          }}>
            🎒 鸽子的背包
          </div>
          <div style={{
            fontSize: 12, color: '#8B7355', opacity: 0.6,
          }}>
            {backpackItems.length}/{getTotalCollectibleCount()} 收集
          </div>
        </div>

        {/* 进度条 */}
        <div style={{
          height: 6, borderRadius: 3,
          background: 'rgba(139,115,85,0.08)',
          overflow: 'hidden', marginBottom: 20,
        }}>
          <div style={{
            width: `${(backpackItems.length / getTotalCollectibleCount()) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #C4776B, #D4947E)',
            borderRadius: 3,
            transition: 'width 0.6s var(--ease-out-expo)',
          }} />
        </div>

        {/* 物品网格 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(80px, 20vw, 120px), 1fr))',
          gap: 10,
        }}>
          {backpackItems.map((item, i) => {
            const rarity = RARITY_LABELS[item.rarity] || RARITY_LABELS.common;
            return (
              <div
                key={item.id}
                onPointerDown={() => handleItemClick(item)}
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  borderRadius: 14,
                  padding: '14px 10px',
                  textAlign: 'center',
                  border: `1.5px solid ${rarity.color}20`,
                  boxShadow: `0 2px 10px ${rarity.glow}`,
                  animation: `fadeInUp 0.4s ease ${i * 0.05}s both`,
                  transition: 'transform 0.2s var(--ease-out-expo)',
                  cursor: 'pointer',
                }}>
                <div style={{
                  fontSize: 'clamp(28px, 3vw, 40px)',
                  marginBottom: 6,
                }}>
                  {item.emoji}
                </div>
                <div style={{
                  fontSize: 'clamp(10px, 0.9vw, 13px)',
                  fontWeight: 700,
                  color: '#4A3728',
                  marginBottom: 4,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {item.name}
                </div>
                <div style={{
                  fontSize: 'clamp(9px, 0.7vw, 11px)',
                  color: '#8B7355',
                  opacity: 0.7,
                  marginBottom: 6,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  📍 {item.landmarkName}
                </div>
                <div style={{
                  display: 'inline-block',
                  fontSize: 10,
                  fontWeight: 600,
                  color: rarity.color,
                  background: `${rarity.color}15`,
                  borderRadius: 8,
                  padding: '2px 8px',
                }}>
                  {rarity.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 物品故事 Modal ── */}
      {activeItem && (
        <div
          onPointerDown={handleClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(50,35,20,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(160deg, #FFFCF5 0%, #FFF7EB 50%, #FFF3DF 100%)',
              borderRadius: 24,
              padding: '32px 28px 24px',
              maxWidth: 'min(88vw, 360px)',
              width: '100%',
              boxShadow: '0 12px 48px rgba(50,35,20,0.18)',
              animation: 'fadeInUp 0.35s var(--ease-out-expo) both',
              border: '1px solid rgba(196,167,107,0.15)',
            }}
          >
            {/* Emoji */}
            <div style={{
              fontSize: 56,
              textAlign: 'center',
              marginBottom: 8,
              animation: 'pigeonFloat 1.5s ease-in-out infinite',
            }}>
              {activeItem.emoji}
            </div>

            {/* 名字 */}
            <div style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#4A3728',
              textAlign: 'center',
              marginBottom: 4,
            }}>
              {activeItem.name}
            </div>

            {/* 来源 + 稀有度 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 20,
            }}>
              <span style={{ fontSize: 12, color: '#8B7355', opacity: 0.7 }}>
                📍 {activeItem.landmarkName}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: (RARITY_LABELS[activeItem.rarity] || RARITY_LABELS.common).color,
                background: `${(RARITY_LABELS[activeItem.rarity] || RARITY_LABELS.common).color}15`,
                borderRadius: 8, padding: '2px 8px',
              }}>
                {(RARITY_LABELS[activeItem.rarity] || RARITY_LABELS.common).label}
              </span>
            </div>

            {/* 故事 */}
            <div style={{
              fontSize: 14,
              color: '#5B4A3A',
              lineHeight: 2,
              textAlign: 'center',
              padding: '4px 0 8px',
            }}>
              {activeItem.story || `鸽子在${activeItem.landmarkName}附近捡到了${activeItem.name}。`}
            </div>

            {/* 珍稀标记 */}
            {activeItem.rarity === 'rare' && (
              <div style={{
                textAlign: 'center',
                marginTop: 8,
                fontSize: 11,
                color: '#C4776B',
                fontWeight: 500,
              }}>
                ✨ 珍稀收藏
              </div>
            )}

            {/* 关闭提示 */}
            <div style={{
              textAlign: 'center',
              marginTop: 18,
              fontSize: 10,
              color: '#8B7355',
              opacity: 0.4,
            }}>
              点击外部关闭
            </div>
          </div>
        </div>
      )}
    </>
  );
}
