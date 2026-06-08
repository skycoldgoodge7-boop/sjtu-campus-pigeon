import { useState, useRef, useEffect } from 'react';
import { usePigeonStore } from '../store/pigeonStore';
import { useUIStore } from '../store/uiStore';
import type { DriftBottle, PhotoCard } from '../types';
import { haptic } from '../utils/haptic';
import DailyJournal from './DailyJournal';
import ObservationArchive from './ObservationArchive';
import StatsDashboard from './StatsDashboard';

const TABS = [
  { id: 'photos' as const, emoji: '📷', label: '照片' },
  { id: 'observe' as const, emoji: '👁️', label: '观察' },
  { id: 'journal' as const, emoji: '📋', label: '记录' },
  { id: 'messages' as const, emoji: '💌', label: '漂流瓶' },
  { id: 'stats' as const, emoji: '📊', label: '数据' },
];

export default function SidePanel() {
  const open = useUIStore((s) => s.sidePanelOpen);
  const tab = useUIStore((s) => s.sidePanelTab);
  const toggleSidePanel = useUIStore((s) => s.toggleSidePanel);
  const setSidePanelTab = useUIStore((s) => s.setSidePanelTab);

  return (
    <>
      {/* Toggle button */}
      <button
        onPointerDown={(e) => { e.stopPropagation(); toggleSidePanel(); }}
        style={{
          position: 'absolute', right: open ? 'min(90vw, 420px)' : 0, top: '40%',
          zIndex: 21,
          width: 40, height: 80,
          borderRadius: '20px 0 0 20px',
          border: 'none',
          background: 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(10px)',
          cursor: 'pointer',
          fontSize: 18,
          transition: 'right 0.35s ease',
          boxShadow: '-1px 0 8px rgba(0,0,0,0.08)',
          color: '#4A3728',
        }}
      >
        {open ? '▶' : '◀'}
      </button>

      {/* Panel */}
      <div style={{
        position: 'absolute', right: open ? 0 : 'min(-90vw, -420px)',
        top: 0, bottom: 0,
        width: 'min(90vw, 420px)',
        zIndex: 20,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        transition: 'right 0.35s ease',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Tabs */}
        <div style={{
          display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.06)',
          padding: '12px 12px 0', gap: 2,
        }}>
          {TABS.map((t) => (
            <button key={t.id}
              onPointerDown={() => setSidePanelTab(t.id)}
              style={{
                flex: 1, border: 'none', minWidth: 0,
                background: tab === t.id ? 'rgba(196,119,107,0.08)' : 'transparent',
                borderRadius: '12px 12px 0 0',
                padding: '8px 2px',
                cursor: 'pointer',
                fontSize: 'clamp(10px, 1vw, 15px)',
                fontWeight: tab === t.id ? 700 : 400,
                color: tab === t.id ? '#C4776B' : '#8B7355',
                transition: 'all 0.25s var(--ease-in-out-soft)',
                whiteSpace: 'nowrap',
              }}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {tab === 'photos' && <PhotoWall />}
          {tab === 'observe' && <ObservationArchive />}
          {tab === 'journal' && <DailyJournal />}
          {tab === 'messages' && <MessageStream />}
          {tab === 'stats' && <StatsDashboard />}
        </div>
      </div>
    </>
  );
}

// ====== Photo Wall (每日照片) ======
function PhotoWall() {
  const dailyPhotos = usePigeonStore((s) => s.dailyPhotos);
  const [viewingPhoto, setViewingPhoto] = useState<PhotoCard | null>(null);

  if (dailyPhotos.length === 0) {
    return (
      <div style={{
        padding: '40px 20px', textAlign: 'center',
        color: '#8B7355', fontSize: 'clamp(12px, 1vw, 15px)',
        lineHeight: 2,
      }}>
        <div style={{ fontSize: 'clamp(28px, 2.5vw, 44px)', marginBottom: 12 }}>📷</div>
        <div>还没有每日照片</div>
        <div style={{ fontSize: '0.85em', opacity: 0.7 }}>每天凌晨会在校园随机角落</div>
        <div style={{ fontSize: '0.85em', opacity: 0.7 }}>留下一张照片记忆</div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '12px' }}>
      {/* 最新每日照片 - 大卡片 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 'clamp(11px, 0.9vw, 13px)',
          fontWeight: 600, color: '#8B7355', marginBottom: 8,
        }}>
          {(() => {
            const d = dailyPhotos[0];
            const dl = d.id.replace('daily-photo-', '');
            return `📷 ${dl} 校园记录`;
          })()}
        </div>
        {(() => {
          const p = dailyPhotos[0];
          const dateLabel = p.id.replace('daily-photo-', '');
          const isEgg = p.isEasterEgg;
          return (
            <div style={{
              borderRadius: 16, overflow: 'hidden',
              background: isEgg
                ? 'linear-gradient(135deg, #FFD700, #FF8C00)'
                : `linear-gradient(135deg, ${p.gradient[0]}, ${p.gradient[1]})`,
              boxShadow: isEgg
                ? '0 2px 20px rgba(255, 165, 0, 0.3), 0 0 40px rgba(255, 215, 0, 0.15)'
                : '0 2px 14px rgba(0,0,0,0.1)',
              animation: 'fadeInUp 0.5s ease both',
              position: 'relative',
            }}>
              {isEgg && (
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  zIndex: 2,
                  fontSize: 'clamp(16px, 1.5vw, 24px)',
                  animation: 'bob 1s ease infinite',
                  filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.3))',
                }}>
                  ✨
                </div>
              )}
              {/* Photo image or placeholder */}
              <div style={{
                width: '100%', aspectRatio: '4/3',
                background: p.photoUrl ? 'transparent' : 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'clamp(36px, 3vw, 56px)',
                overflow: 'hidden',
                cursor: p.photoUrl ? 'pointer' : 'default',
              }}
                onPointerDown={() => { if (p.photoUrl) setViewingPhoto(p); }}
              >
                {p.photoUrl ? (
                  <img src={p.photoUrl} alt={p.caption}
                    style={{
                      width: '100%', height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : (
                  p.sceneEmojis.join(' ')
                )}
              </div>
              {/* Info */}
              <div style={{ padding: '14px 16px', color: '#fff' }}>
                <div style={{
                  fontWeight: 600, marginBottom: 4,
                  fontSize: 'clamp(11px, 0.9vw, 14px)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span>{p.landmarkEmoji} {p.landmarkName}</span>
                  <span style={{ fontSize: '0.8em', opacity: 0.7 }}>{dateLabel}</span>
                </div>
                <div style={{
                  opacity: 0.9, fontSize: 'clamp(10px, 0.8vw, 13px)',
                  lineHeight: 1.7, textShadow: '0 1px 2px rgba(0,0,0,0.15)',
                }}>
                  {p.caption}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 往期照片 */}
      {dailyPhotos.length > 1 && (
        <div>
          <div style={{
            fontSize: 'clamp(11px, 0.9vw, 13px)',
            fontWeight: 600, color: '#8B7355', marginBottom: 10,
          }}>
            往期照片
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
            paddingBottom: 20,
          }}>
            {dailyPhotos.slice(1).map((p, i) => {
              const dateLabel = p.id.replace('daily-photo-', '');
              const isEgg = p.isEasterEgg;
              return (
                <div key={p.id} style={{
                  borderRadius: 14, overflow: 'hidden',
                  background: isEgg
                    ? 'linear-gradient(135deg, #FFD700, #FF8C00)'
                    : `linear-gradient(135deg, ${p.gradient[0]}, ${p.gradient[1]})`,
                  boxShadow: isEgg
                    ? '0 2px 14px rgba(255, 165, 0, 0.25)'
                    : '0 2px 10px rgba(0,0,0,0.08)',
                  animation: `fadeInUp 0.5s ease ${i * 0.06}s both`,
                  position: 'relative',
                }}>
                  {isEgg && (
                    <div style={{
                      position: 'absolute', top: 4, right: 4,
                      zIndex: 2,
                      fontSize: 'clamp(12px, 1vw, 18px)',
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
                    }}>
                      ✨
                    </div>
                  )}
                  <div style={{
                    width: '100%', aspectRatio: '4/3',
                    background: p.photoUrl ? 'transparent' : 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 'clamp(24px, 2.5vw, 40px)',
                    overflow: 'hidden',
                    cursor: p.photoUrl ? 'pointer' : 'default',
                  }}
                    onPointerDown={() => { if (p.photoUrl) setViewingPhoto(p); }}
                  >
                    {p.photoUrl ? (
                      <img src={p.photoUrl} alt={p.caption}
                        style={{
                          width: '100%', height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    ) : (
                      p.sceneEmojis.join(' ')
                    )}
                  </div>
                  <div style={{ padding: '10px 12px', color: '#fff' }}>
                    <div style={{
                      fontWeight: 600, marginBottom: 3,
                      fontSize: 'clamp(10px, 0.85vw, 13px)',
                      textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                      display: 'flex', justifyContent: 'space-between',
                    }}>
                      <span>{p.landmarkEmoji} {p.landmarkName}</span>
                      <span style={{ opacity: 0.65, fontSize: '0.85em' }}>{dateLabel}</span>
                    </div>
                    <div style={{
                      opacity: 0.85, fontSize: 'clamp(9px, 0.75vw, 12px)',
                      lineHeight: 1.4,
                    }}>
                      {p.caption}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Photo viewer modal */}
      {viewingPhoto && viewingPhoto.photoUrl && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.92)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}
          onPointerDown={() => setViewingPhoto(null)}
        >
          <img src={viewingPhoto.photoUrl} alt={viewingPhoto.caption}
            style={{
              maxWidth: '95vw', maxHeight: '70vh',
              objectFit: 'contain', borderRadius: 8,
            }}
            onPointerDown={(e) => e.stopPropagation()}
          />
          <div style={{ color: '#fff', marginTop: 16, textAlign: 'center', padding: '0 24px' }}>
            <div style={{ fontSize: 'clamp(12px, 1.2vw, 16px)', marginBottom: 4 }}>
              {viewingPhoto.landmarkEmoji} {viewingPhoto.landmarkName}
            </div>
            <div style={{ fontSize: 'clamp(10px, 0.9vw, 13px)', opacity: 0.65 }}>
              {viewingPhoto.caption}
            </div>
          </div>
          <a href={viewingPhoto.photoUrl} download
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              marginTop: 14, padding: '10px 28px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 12, color: '#fff',
              textDecoration: 'none',
              fontSize: 'clamp(12px, 1vw, 15px)',
              fontWeight: 600,
            }}
          >
            💾 保存图片
          </a>
        </div>
      )}
    </div>
  );
}

// ====== Message Stream (Drift Bottles) ======
function MessageStream() {
  const messages = usePigeonStore((s) => s.messages);
  const postMessage = usePigeonStore((s) => s.postMessage);
  const retrieveBottle = usePigeonStore((s) => s.retrieveBottle);
  const lastBottleReply = usePigeonStore((s) => s.lastBottleReply);
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState('💌');
  const lastPostRef = useRef(0);
  const lastRetrieveRef = useRef(0);

  // Bottle retrieve state
  const [retrievedBottle, setRetrievedBottle] = useState<DriftBottle | null>(null);
  const [revealBottle, setRevealBottle] = useState(false);
  const [showReply, setShowReply] = useState(false);

  const EMOJIS = ['💌', '❤️', '😊', '📝', '🍀', '🌟', '💪', '🕊️', '🌸', '🎓', '☕', '🍞'];

  // 监听鸽子的回复
  useEffect(() => {
    if (lastBottleReply && retrievedBottle && lastBottleReply.noteText === retrievedBottle.text) {
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
      // Slow reveal: show card first, then reveal text
      setTimeout(() => setRevealBottle(true), 600);
    }
  };

  const cooldownRemaining = (lastRef: React.MutableRefObject<number>) => {
    const elapsed = Date.now() - lastRef.current;
    const remaining = 30 - Math.floor(elapsed / 1000);
    return remaining > 0 ? remaining : 0;
  };

  // Only show floating bottles in the stream
  const floatingMessages = messages.filter((m) => m.status === 'floating');
  const retrieveCooldown = cooldownRemaining(lastRetrieveRef);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Retrieve section */}
      <div style={{
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '12px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: retrievedBottle ? 10 : 0,
        }}>
          <button
            onPointerDown={handleRetrieve}
            disabled={retrieveCooldown > 0}
            style={{
              border: 'none', borderRadius: 20,
              background: retrieveCooldown > 0
                ? 'rgba(0,0,0,0.06)'
                : 'linear-gradient(135deg, #4682B4, #5F9EA0)',
              color: retrieveCooldown > 0 ? '#8B7355' : 'white',
              padding: '8px 18px', cursor: retrieveCooldown > 0 ? 'default' : 'pointer',
              fontWeight: 600, fontSize: 'clamp(12px, 1vw, 15px)',
              whiteSpace: 'nowrap', transition: 'all 0.3s ease',
            }}
          >
            {retrieveCooldown > 0 ? `捞一个 (${retrieveCooldown}s)` : '🫧 捞一个'}
          </button>
          <span style={{
            fontSize: 'clamp(10px, 0.8vw, 12px)',
            color: '#8B7355', opacity: 0.7,
          }}>
            随机捞取一张漂流纸条
          </span>
        </div>

        {/* Retrieved bottle card */}
        {retrievedBottle && (
          <div style={{
            background: 'linear-gradient(135deg, #FFF8E7, #FFF0D0)',
            borderRadius: 14,
            padding: '16px 18px',
            border: '1px solid rgba(196,119,107,0.1)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            animation: 'fadeInUp 0.5s ease both',
            position: 'relative',
          }}>
            {/* Paper fold effect */}
            <div style={{
              position: 'absolute', top: 0, right: 0,
              width: 0, height: 0,
              borderStyle: 'solid',
              borderWidth: '0 20px 20px 0',
              borderColor: 'transparent rgba(196,119,107,0.08) transparent transparent',
              borderRadius: '0 14px 0 0',
            }} />
            <div style={{
              fontSize: 'clamp(28px, 2.5vw, 40px)',
              textAlign: 'center', marginBottom: 8,
              transition: 'opacity 0.6s ease',
            }}>
              {retrievedBottle.emoji}
            </div>
            <div style={{
              fontSize: 'clamp(14px, 1.3vw, 20px)',
              color: '#4A3728',
              textAlign: 'center',
              lineHeight: 1.8,
              fontWeight: 500,
              opacity: revealBottle ? 1 : 0,
              transform: revealBottle ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.8s ease, transform 0.8s ease',
              minHeight: '2em',
            }}>
              {revealBottle ? retrievedBottle.text : '...'}
            </div>
            <div style={{
              textAlign: 'center', marginTop: 8,
              fontSize: 'clamp(9px, 0.7vw, 11px)',
              color: '#8B7355', opacity: 0.6,
            }}>
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

      {/* Floating messages list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
        {floatingMessages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#8B7355', padding: 40, fontSize: 'clamp(12px, 1vw, 15px)', lineHeight: 2 }}>
            <div style={{ fontSize: 24 }}>💌</div>
            <div>还没有漂流瓶</div>
            <div style={{ fontSize: '0.85em', opacity: 0.6 }}>写点什么扔出去吧</div>
          </div>
        )}
        {floatingMessages.map((m) => {
          const mins = Math.floor((Date.now() - m.timestamp) / 60000);
          const timeStr = mins < 1 ? '刚刚' : mins < 60 ? `${mins}分钟前` : `${Math.floor(mins / 60)}小时前`;
          return (
            <div key={m.id} style={{
              background: 'rgba(196,119,107,0.05)', borderRadius: 12, padding: '10px 14px',
              marginBottom: 8, fontSize: 'clamp(11px, 0.9vw, 14px)', color: '#4A3728',
              opacity: m.pickedByPigeon ? 0.5 : 1,
            }}>
              <span style={{ marginRight: 6 }}>{m.emoji}</span>
              {m.text}
              {m.pickedByPigeon && (
                <span style={{ fontSize: '0.8em', marginLeft: 6, opacity: 0.7 }}>🕊️</span>
              )}
              <span style={{ float: 'right', color: '#8B7355', fontSize: '0.8em' }}>{timeStr}</span>
            </div>
          );
        })}
      </div>

      {/* Compose */}
      <div style={{
        borderTop: '1px solid rgba(0,0,0,0.06)',
        padding: '10px 12px calc(12px + env(safe-area-inset-bottom, 20px))',
      }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {EMOJIS.map((e) => (
            <button key={e} onPointerDown={() => setEmoji(e)} style={{
              border: emoji === e ? '2px solid #C4776B' : '2px solid transparent',
              background: 'transparent', borderRadius: 8,
              fontSize: 'clamp(20px, 3vw, 26px)',
              cursor: 'pointer', padding: '4px 2px',
              lineHeight: 1,
            }}>{e}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 30))}
            placeholder="说点什么..."
            maxLength={30}
            style={{
              flex: 1, minWidth: 0,
              border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12,
              padding: '12px 14px', fontSize: '15px',
              outline: 'none', background: 'rgba(255,255,255,0.6)',
              fontFamily: 'inherit',
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          />
          <button onPointerDown={handleSend} style={{
            border: 'none', borderRadius: 12,
            background: 'linear-gradient(135deg, #C4776B, #D4947E)',
            color: 'white', padding: '12px 20px', cursor: 'pointer',
            fontWeight: 700, fontSize: '15px',
            whiteSpace: 'nowrap', flexShrink: 0,
            transition: 'all 0.2s var(--ease-out-expo)',
          }}>
            扔出
          </button>
        </div>
        <div style={{
          textAlign: 'center', fontSize: '11px',
          color: '#8B7355', marginTop: 6, opacity: 0.6,
        }}>
          匿名留言 · 30秒间隔
        </div>
      </div>
    </div>
  );
}
