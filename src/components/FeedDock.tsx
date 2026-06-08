import { useCallback } from 'react';
import { usePigeonStore } from '../store/pigeonStore';
import { useUIStore } from '../store/uiStore';
import { feedItems } from '../data/feedItems';
import type { FeedItemId } from '../types';
import { haptic } from '../utils/haptic';

export default function FeedDock() {
  const currentScreen = useUIStore((s) => s.currentScreen);
  const feedPigeon = usePigeonStore((s) => s.feedPigeon);
  const recentFeeds = usePigeonStore((s) => s.recentFeeds);
  const setActiveFeedAnimation = useUIStore((s) => s.setActiveFeedAnimation);
  const setPigeonBubble = useUIStore((s) => s.setPigeonBubble);
  const addRipple = useUIStore((s) => s.addRipple);

  const handleFeed = useCallback((itemId: FeedItemId, emoji: string, _name: string, e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    feedPigeon(itemId);
    haptic('feed');
    setActiveFeedAnimation({ itemId, emoji, x, y });
    addRipple(e.clientX, e.clientY);

    const item = feedItems.find((f) => f.id === itemId);
    if (item) {
      const bubble = item.thoughtBubbles[Math.floor(Math.random() * item.thoughtBubbles.length)];
      setPigeonBubble({ emoji, text: bubble });
    }

    setTimeout(() => setActiveFeedAnimation(null), 600);
  }, [feedPigeon, setActiveFeedAnimation, setPigeonBubble, addRipple]);

  // 地图屏有底部导航栏，投喂通过 HomeScreen 内的网格完成
  if (currentScreen === 'map') return null;

  const displayItems = feedItems.slice(0, 8);
  const lastFeed = recentFeeds[recentFeeds.length - 1];

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10,
    }}>
      {/* Subtle recent feed hint */}
      {lastFeed && (
        <div style={{
          textAlign: 'center', padding: '4px 0',
          fontSize: 'clamp(10px, 0.9vw, 13px)',
          color: 'rgba(255,255,255,0.6)',
          pointerEvents: 'none',
        }}>
          刚刚有人留下了{lastFeed.itemEmoji}
        </div>
      )}

      {/* Feed tray */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 'clamp(8px, 1.2vw, 16px)',
        padding: 'clamp(8px, 1.2vh, 14px) clamp(16px, 2vw, 32px)',
        paddingBottom: 'clamp(14px, 2.5vh, 28px)',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.06) 60%, transparent 100%)',
        flexWrap: 'wrap',
      }}>
        {displayItems.map((item) => (
          <button
            key={item.id}
            onPointerDown={(e) => handleFeed(item.id, item.emoji, item.name, e)}
            style={{
              width: 'clamp(52px, 6vw, 88px)',
              height: 'clamp(52px, 6vw, 88px)',
              borderRadius: 18,
              border: '1.5px solid rgba(255,255,255,0.25)',
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              fontSize: 'clamp(22px, 2.8vw, 40px)',
              color: 'white',
              transition: 'background 0.2s var(--ease-out-expo), transform 0.15s var(--ease-out-expo), box-shadow 0.3s ease',
              WebkitTapHighlightColor: 'transparent',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
            onPointerEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = 'rgba(255,255,255,0.22)';
              el.style.boxShadow = '0 4px 14px rgba(0,0,0,0.15)';
              el.style.transform = 'translateY(-2px)';
            }}
            onPointerLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = 'rgba(255,255,255,0.12)';
              el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              el.style.transform = 'translateY(0)';
            }}
          >
            <span>{item.emoji}</span>
            <span style={{ fontSize: 'clamp(8px, 0.8vw, 12px)', fontWeight: 500, opacity: 0.85 }}>
              {item.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
