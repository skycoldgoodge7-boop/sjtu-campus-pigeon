import { useCallback, useRef } from 'react';
import { usePigeonStore } from '../store/pigeonStore';
import { useUIStore } from '../store/uiStore';
import { feedItems } from '../data/feedItems';
import type { FeedItemId } from '../types';

export default function FeedDock() {
  const feedPigeon = usePigeonStore((s) => s.feedPigeon);
  const recentFeeds = usePigeonStore((s) => s.recentFeeds);
  const setActiveFeedAnimation = useUIStore((s) => s.setActiveFeedAnimation);
  const setPigeonBubble = useUIStore((s) => s.setPigeonBubble);
  const addRipple = useUIStore((s) => s.addRipple);

  const lastFeedRef = useRef(0);

  const handleFeed = useCallback((itemId: FeedItemId, emoji: string, _name: string, e: React.PointerEvent) => {
    if (Date.now() - lastFeedRef.current < 2000) return;
    lastFeedRef.current = Date.now();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    feedPigeon(itemId);
    setActiveFeedAnimation({ itemId, emoji, x, y });
    addRipple(e.clientX, e.clientY);

    const item = feedItems.find((f) => f.id === itemId);
    if (item) {
      const bubble = item.thoughtBubbles[Math.floor(Math.random() * item.thoughtBubbles.length)];
      setPigeonBubble({ emoji, text: bubble });
    }

    setTimeout(() => setActiveFeedAnimation(null), 600);
  }, [feedPigeon, setActiveFeedAnimation, setPigeonBubble, addRipple]);

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
        background: 'linear-gradient(0deg, rgba(0,0,0,0.25) 0%, transparent 100%)',
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
              border: '1.5px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(6px)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              fontSize: 'clamp(22px, 2.8vw, 40px)',
              color: 'white',
              transition: 'background 0.2s ease',
              WebkitTapHighlightColor: 'transparent',
            }}
            onPointerEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.2)';
            }}
            onPointerLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
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
