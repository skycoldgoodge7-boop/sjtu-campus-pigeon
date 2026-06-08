import { useMemo } from 'react';
import { usePigeonStore } from '../store/pigeonStore';
import { feedItems } from '../data/feedItems';
import { landmarks } from '../data/landmarks';
import type { CampusMood } from '../types';
import DataManager from './DataManager';

const MOOD_DIMENSIONS: { key: keyof CampusMood; label: string; emoji: string }[] = [
  { key: 'stress',     label: '压力',   emoji: '😰' },
  { key: 'romance',    label: '浪漫',   emoji: '💕' },
  { key: 'social',     label: '社交',   emoji: '🗣️' },
  { key: 'loneliness', label: '孤独',   emoji: '🥺' },
  { key: 'energy',     label: '活力',   emoji: '⚡' },
  { key: 'warmth',     label: '温暖',   emoji: '☀️' },
  { key: 'academic',   label: '学术',   emoji: '📖' },
  { key: 'slack',      label: '摸鱼',   emoji: '🎮' },
];

export default function StatsDashboard() {
  const feedTotals = usePigeonStore((s) => s.feedTotals);
  const messages = usePigeonStore((s) => s.messages);
  const rememberedCharacters = usePigeonStore((s) => s.rememberedCharacters);
  const journalEntries = usePigeonStore((s) => s.journalEntries);
  const mood = usePigeonStore((s) => s.mood);
  const moodStreaks = usePigeonStore((s) => s.moodStreaks);
  const totalFlights = usePigeonStore((s) => s.totalFlights);
  const landmarkStayDurations = usePigeonStore((s) => s.landmarkStayDurations);
  const dailyPhotos = usePigeonStore((s) => s.dailyPhotos);

  const stats = useMemo(() => {
    // Total feed count
    const totalFeeds = Object.values(feedTotals).reduce((a, b) => a + b, 0);

    // Favorite food
    let favFoodId = '';
    let favFoodCount = 0;
    for (const [id, count] of Object.entries(feedTotals)) {
      if (count > favFoodCount) { favFoodId = id; favFoodCount = count; }
    }
    const favFood = feedItems.find((f) => f.id === favFoodId);

    // Most visited landmark (from cumulative stay durations)
    let favLandmarkId = '';
    let maxStay = 0;
    for (const [lid, dur] of Object.entries(landmarkStayDurations)) {
      if (dur > maxStay) { maxStay = dur; favLandmarkId = lid; }
    }
    const favLandmark = landmarks.find((l) => l.id === favLandmarkId);

    // Total known characters
    const knownLife = rememberedCharacters.filter((r) => !r.disappeared).length;
    const totalMet = rememberedCharacters.length;

    // Picked bottles
    const bottlesPicked = messages.filter((m) => m.pickedByPigeon).length;

    // Longest mood streak
    let bestStreakDim = '';
    let bestStreakDays = 0;
    for (const [dim, days] of Object.entries(moodStreaks)) {
      if (days > bestStreakDays) { bestStreakDim = dim; bestStreakDays = days; }
    }
    const bestStreakLabel = MOOD_DIMENSIONS.find((d) => d.key === bestStreakDim);

    // Total journal days
    const totalDays = journalEntries.length;

    // Total photos generated
    const totalPhotos = dailyPhotos.length;

    // Current dominant mood
    let domMood = 'slack';
    let domVal = 0;
    for (const [key, val] of Object.entries(mood)) {
      if (val > domVal) { domMood = key; domVal = val; }
    }
    const domMoodLabel = MOOD_DIMENSIONS.find((d) => d.key === domMood);

    return {
      totalFeeds, favFood, favFoodCount, favLandmark,
      knownLife, totalMet, bottlesPicked,
      bestStreakDays, bestStreakLabel, totalDays, totalPhotos,
      totalFlights, domMoodLabel, domVal,
    };
  }, [feedTotals, landmarkStayDurations, rememberedCharacters, messages,
      moodStreaks, journalEntries, dailyPhotos, totalFlights, mood]);

  const statCards = [
    { emoji: '🍞', value: stats.totalFeeds, label: '累计投喂', unit: '次' },
    { emoji: '✈️', value: stats.totalFlights, label: '累计飞行', unit: '次' },
    { emoji: '📋', value: stats.totalDays, label: '记录天数', unit: '天' },
    { emoji: '📷', value: stats.totalPhotos, label: '每日照片', unit: '张' },
    { emoji: '💌', value: stats.bottlesPicked, label: '捡到纸条', unit: '张' },
    { emoji: '👁️', value: stats.knownLife, label: '认识的生命', unit: '个' },
  ];

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '16px' }}>
      {/* Header */}
      <div style={{
        textAlign: 'center', marginBottom: 20,
        animation: 'fadeInUp 0.5s ease both',
      }}>
        <div style={{ fontSize: 'clamp(36px, 3.5vw, 56px)', marginBottom: 8 }}>🕊️</div>
        <div style={{
          fontSize: 'clamp(14px, 1.3vw, 20px)',
          fontWeight: 700, color: '#4A3728',
        }}>
          鸽子数据
        </div>
        <div style={{
          fontSize: 'clamp(10px, 0.8vw, 12px)',
          color: '#8B7355', opacity: 0.6, marginTop: 4,
        }}>
          从相遇的那天开始
        </div>
      </div>

      {/* Stat cards grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 10, marginBottom: 24,
      }}>
        {statCards.map((card, i) => (
          <div key={card.label} style={{
            background: 'rgba(196,119,107,0.05)',
            borderRadius: 16, padding: '16px 14px',
            textAlign: 'center',
            animation: `fadeInUp 0.5s ease ${i * 0.06}s both`,
            border: '1px solid rgba(196,119,107,0.08)',
          }}>
            <div style={{ fontSize: 'clamp(24px, 2.5vw, 40px)', marginBottom: 4 }}>
              {card.emoji}
            </div>
            <div style={{
              fontSize: 'clamp(22px, 2.5vw, 38px)',
              fontWeight: 800, color: '#4A3728',
              lineHeight: 1.2,
            }}>
              {card.value}
              <span style={{
                fontSize: '0.45em', fontWeight: 400,
                color: '#8B7355', marginLeft: 2,
              }}>
                {card.unit}
              </span>
            </div>
            <div style={{
              fontSize: 'clamp(10px, 0.8vw, 12px)',
              color: '#8B7355', opacity: 0.7,
            }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Favorites */}
      <div style={{ marginBottom: 24, animation: 'fadeInUp 0.5s ease 0.3s both' }}>
        <div style={{
          fontSize: 'clamp(12px, 1vw, 14px)',
          fontWeight: 600, color: '#4A3728', marginBottom: 10,
        }}>
          鸽子最爱
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Favorite food */}
          {stats.favFood && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px',
              background: 'rgba(196,119,107,0.05)', borderRadius: 14,
              border: '1px solid rgba(196,119,107,0.07)',
            }}>
              <span style={{ fontSize: 'clamp(28px, 2.5vw, 40px)' }}>
                {stats.favFood.emoji}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: 600, color: '#4A3728',
                  fontSize: 'clamp(13px, 1.1vw, 16px)',
                }}>
                  {stats.favFood.name}
                </div>
                <div style={{
                  fontSize: 'clamp(10px, 0.8vw, 12px)',
                  color: '#8B7355', opacity: 0.7,
                }}>
                  被投喂了 <strong>{stats.favFoodCount}</strong> 次
                </div>
              </div>
              <span style={{ fontSize: 'clamp(14px, 1.2vw, 20px)', opacity: 0.5 }}>🏆</span>
            </div>
          )}

          {/* Favorite place */}
          {stats.favLandmark && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px',
              background: 'rgba(196,119,107,0.05)', borderRadius: 14,
              border: '1px solid rgba(196,119,107,0.07)',
            }}>
              <span style={{ fontSize: 'clamp(28px, 2.5vw, 40px)' }}>
                {stats.favLandmark.emoji}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: 600, color: '#4A3728',
                  fontSize: 'clamp(13px, 1.1vw, 16px)',
                }}>
                  {stats.favLandmark.name}
                </div>
                <div style={{
                  fontSize: 'clamp(10px, 0.8vw, 12px)',
                  color: '#8B7355', opacity: 0.7,
                }}>
                  停留时间最长的地方
                </div>
              </div>
              <span style={{ fontSize: 'clamp(14px, 1.2vw, 20px)', opacity: 0.5 }}>📍</span>
            </div>
          )}
        </div>
      </div>

      {/* Mood distribution */}
      <div style={{ marginBottom: 24, animation: 'fadeInUp 0.5s ease 0.4s both' }}>
        <div style={{
          fontSize: 'clamp(12px, 1vw, 14px)',
          fontWeight: 600, color: '#4A3728', marginBottom: 10,
        }}>
          当前情绪
        </div>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 5,
          background: 'rgba(196,119,107,0.035)',
          borderRadius: 16, padding: '14px',
          border: '1px solid rgba(196,119,107,0.07)',
        }}>
          {MOOD_DIMENSIONS.map((dim) => {
            const val = mood[dim.key] || 50;
            return (
              <div key={dim.key} style={{
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{
                  fontSize: 'clamp(12px, 1vw, 15px)',
                  width: 28, textAlign: 'center',
                }}>
                  {dim.emoji}
                </span>
                <span style={{
                  width: 'clamp(24px, 2vw, 36px)',
                  fontSize: 'clamp(9px, 0.7vw, 11px)',
                  color: '#8B7355', textAlign: 'right',
                }}>
                  {dim.label}
                </span>
                <div style={{
                  flex: 1, height: 6,
                  background: 'rgba(196,119,107,0.08)',
                  borderRadius: 3, overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${val}%`, height: '100%',
                    background: val > 70
                      ? 'linear-gradient(90deg, #C08060, #D4A878)'
                      : val > 45
                        ? 'linear-gradient(90deg, #A8B888, #C0D5B0)'
                        : 'linear-gradient(90deg, #B0A090, #D0C8B8)',
                    borderRadius: 3,
                    transition: 'width 1.5s ease',
                  }} />
                </div>
                <span style={{
                  width: 28, textAlign: 'right',
                  fontSize: 'clamp(9px, 0.75vw, 12px)',
                  fontWeight: 600, color: '#4A3728',
                }}>
                  {val}
                </span>
              </div>
            );
          })}
        </div>
        {/* Current dominant mood hint */}
        {stats.domMoodLabel && (
          <div style={{
            textAlign: 'center', marginTop: 8,
            fontSize: 'clamp(10px, 0.8vw, 12px)',
            color: '#8B7355', opacity: 0.7,
          }}>
            鸽子现在的心情主要是 {stats.domMoodLabel.emoji} {stats.domMoodLabel.label}
          </div>
        )}
      </div>

      {/* Mood streaks */}
      <div style={{ marginBottom: 24, animation: 'fadeInUp 0.5s ease 0.5s both' }}>
        <div style={{
          fontSize: 'clamp(12px, 1vw, 14px)',
          fontWeight: 600, color: '#4A3728', marginBottom: 10,
        }}>
          情绪连续天数
        </div>
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap',
          background: 'rgba(196,119,107,0.035)',
          borderRadius: 16, padding: '14px',
          border: '1px solid rgba(196,119,107,0.07)',
        }}>
          {(Object.entries(moodStreaks) as [string, number][]).map(([dim, days]) => {
            const info = MOOD_DIMENSIONS.find((d) => d.key === dim);
            if (!info || days === 0) return null;
            return (
              <div key={dim} style={{
                flex: '1 1 auto', minWidth: 70,
                textAlign: 'center',
                padding: '10px 8px',
                background: days >= 5 ? 'rgba(212,168,120,0.12)' : 'transparent',
                borderRadius: 12,
              }}>
                <div style={{ fontSize: 'clamp(16px, 1.5vw, 24px)' }}>
                  {info.emoji}
                </div>
                <div style={{
                  fontSize: 'clamp(16px, 1.8vw, 28px)',
                  fontWeight: 800, color: '#4A3728',
                }}>
                  {days}
                </div>
                <div style={{
                  fontSize: 'clamp(9px, 0.7vw, 11px)',
                  color: '#8B7355', opacity: 0.7,
                }}>
                  天
                </div>
              </div>
            );
          })}
          {Object.values(moodStreaks).every((v) => v === 0) && (
            <div style={{
              textAlign: 'center', width: '100%',
              fontSize: 'clamp(10px, 0.8vw, 12px)',
              color: '#8B7355', opacity: 0.6, padding: '8px 0',
            }}>
              还没有形成明显的情绪趋势
            </div>
          )}
        </div>
      </div>

      {/* Life encountered summary */}
      {stats.totalMet > 0 && (
        <div style={{ marginBottom: 24, animation: 'fadeInUp 0.5s ease 0.6s both' }}>
          <div style={{
            fontSize: 'clamp(12px, 1vw, 14px)',
            fontWeight: 600, color: '#4A3728', marginBottom: 10,
          }}>
            生命档案
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '14px 18px',
            background: 'rgba(196,119,107,0.05)', borderRadius: 14,
            border: '1px solid rgba(196,119,107,0.07)',
          }}>
            <div style={{ fontSize: 'clamp(32px, 3vw, 48px)' }}>📖</div>
            <div>
              <div style={{
                fontSize: 'clamp(24px, 2.5vw, 38px)',
                fontWeight: 800, color: '#4A3728',
                lineHeight: 1.1,
              }}>
                {stats.totalMet}
              </div>
              <div style={{
                fontSize: 'clamp(10px, 0.8vw, 12px)',
                color: '#8B7355',
              }}>
                累计遇到 · 现在身边还有 {stats.knownLife} 位
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data export/import */}
      <div style={{ animation: 'fadeInUp 0.5s ease 0.7s both' }}>
        <DataManager />
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center', color: '#8B7355', opacity: 0.35,
        fontSize: 'clamp(9px, 0.7vw, 11px)',
        padding: '20px 0', lineHeight: 1.8,
      }}>
        每一天都是鸽子生命中的一页<br />
        而你在陪着它慢慢长大
      </div>
    </div>
  );
}
