// ====== 校园热点信息流 ======
// 展示从 news.sjtu.edu.cn 抓取的校园热点
// 每条热点显示标题、摘要、情绪影响
// 数据通过 Supabase Realtime 实时同步

import { usePigeonStore } from '../store/pigeonStore';
import { useEffect } from 'react';

const HOTSPOT_CATEGORY_BG: Record<string, string> = {
  '交大要闻': 'rgba(212,168,120,0.12)',
  '综合新闻': 'rgba(168,200,212,0.12)',
  '学术动态': 'rgba(168,184,136,0.12)',
  '合作交流': 'rgba(196,166,212,0.12)',
  '特别分析': 'rgba(212,160,160,0.12)',
  '专题专栏': 'rgba(180,180,200,0.12)',
};

const MOOD_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  academic: { label: '学术', emoji: '📖', color: '#7A9B6A' },
  stress: { label: '压力', emoji: '😰', color: '#C08060' },
  social: { label: '社交', emoji: '🗣️', color: '#6A8B9B' },
  energy: { label: '活力', emoji: '⚡', color: '#C0A040' },
  warmth: { label: '温暖', emoji: '☀️', color: '#C4776B' },
  slack: { label: '摸鱼', emoji: '🎮', color: '#8B8B9B' },
  romance: { label: '浪漫', emoji: '💕', color: '#C06080' },
  loneliness: { label: '孤独', emoji: '🥺', color: '#8090A0' },
};

export default function HotspotFeed() {
  const hotspots = usePigeonStore((s) => s.hotspots);
  const syncHotspotsFromCloud = usePigeonStore((s) => s.syncHotspotsFromCloud);

  // 进入时刷新
  useEffect(() => {
    syncHotspotsFromCloud();
    // 每5分钟自动刷新
    const interval = setInterval(syncHotspotsFromCloud, 300000);
    return () => clearInterval(interval);
  }, [syncHotspotsFromCloud]);

  const active = hotspots.filter(h => h.is_active);

  if (active.length === 0) {
    return (
      <div style={{
        padding: '40px 20px', textAlign: 'center',
        color: '#8B7355', fontSize: 'clamp(12px, 1vw, 15px)',
        lineHeight: 2,
      }}>
        <div style={{ fontSize: 'clamp(28px, 2.5vw, 44px)', marginBottom: 12 }}>📡</div>
        <div>正在收听校园热点...</div>
        <div style={{ fontSize: '0.85em', opacity: 0.7 }}>
          热点数据由交大新闻网自动抓取
        </div>
        <div style={{ fontSize: '0.85em', opacity: 0.5 }}>
          （首次加载需等待数据同步）
        </div>
      </div>
    );
  }

  // 对今日热点做特殊标记
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '16px' }}>
      {/* 标题区 */}
      <div style={{
        marginBottom: 16, textAlign: 'center',
        animation: 'fadeInUp 0.5s ease both',
      }}>
        <div style={{
          fontSize: 'clamp(14px, 1.3vw, 18px)',
          fontWeight: 700, color: '#4A3728', marginBottom: 4,
        }}>
          校园热点
        </div>
        <div style={{
          fontSize: 'clamp(10px, 0.8vw, 12px)',
          color: '#8B7355', opacity: 0.6,
        }}>
          来自交大新闻网 · 共 {active.length} 条
          <span style={{ marginLeft: 6, fontSize: '0.85em' }}>
            🟢 实时同步
          </span>
        </div>
      </div>

      {/* 热点列表 */}
      {active.map((hot, i) => {
        const isToday = hot.date === today;
        const catBg = HOTSPOT_CATEGORY_BG[hot.category] || 'rgba(200,200,200,0.08)';
        const moodEffects = Object.entries(hot.mood_effect || {}).filter(([, v]) => v !== 0);

        return (
          <div key={hot.id} style={{
            marginBottom: 12,
            borderRadius: 16,
            background: catBg,
            border: isToday ? '1px solid rgba(196,119,107,0.15)' : '1px solid transparent',
            overflow: 'hidden',
            animation: `fadeInUp 0.5s ease ${i * 0.05}s both`,
            position: 'relative',
          }}>
            {/* Today badge */}
            {isToday && (
              <div style={{
                position: 'absolute', top: 0, right: 0,
                background: 'linear-gradient(135deg, #C4776B, #D4947E)',
                color: 'white', fontSize: 10, fontWeight: 700,
                padding: '2px 10px', borderRadius: '0 16px 0 12px',
                letterSpacing: 0.5,
              }}>
                今日
              </div>
            )}

            <div style={{ padding: '14px 16px' }}>
              {/* 分类 + 日期 */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                marginBottom: 8,
                fontSize: 'clamp(10px, 0.8vw, 12px)',
              }}>
                <span>{hot.category_emoji}</span>
                <span style={{
                  fontWeight: 600, color: '#6B5A4A',
                  background: 'rgba(255,255,255,0.5)',
                  borderRadius: 6, padding: '1px 8px',
                }}>
                  {hot.category}
                </span>
                <span style={{ color: '#8B7355', opacity: 0.6, marginLeft: 'auto' }}>
                  {hot.date.slice(5)}
                </span>
              </div>

              {/* 标题 */}
              <a
                href={hot.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontWeight: 700,
                  fontSize: 'clamp(13px, 1.1vw, 16px)',
                  color: '#4A3728',
                  textDecoration: 'none',
                  lineHeight: 1.5,
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                {hot.title}
              </a>

              {/* 摘要 */}
              {hot.summary && hot.summary !== hot.title && (
                <div style={{
                  fontSize: 'clamp(10px, 0.85vw, 13px)',
                  color: '#8B7355',
                  lineHeight: 1.6,
                  opacity: 0.8,
                  marginBottom: moodEffects.length > 0 ? 10 : 0,
                }}>
                  {hot.summary.length > 120 ? hot.summary.slice(0, 120) + '...' : hot.summary}
                </div>
              )}

              {/* 情绪影响标签 */}
              {moodEffects.length > 0 && (
                <div style={{
                  display: 'flex', gap: 4, flexWrap: 'wrap',
                }}>
                  <span style={{
                    fontSize: 'clamp(9px, 0.7vw, 11px)',
                    color: '#8B7355', opacity: 0.5,
                    marginRight: 2, alignSelf: 'center',
                  }}>
                    鸽子感受：
                  </span>
                  {moodEffects.map(([key, val]) => {
                    const info = MOOD_LABELS[key];
                    if (!info) return null;
                    const absVal = Math.abs(val as number);
                    if (absVal < 1) return null;
                    const direction = (val as number) > 0 ? '↑' : '↓';
                    return (
                      <span key={key} style={{
                        background: `${info.color}15`,
                        borderRadius: 8,
                        padding: '2px 7px',
                        fontSize: 'clamp(9px, 0.7vw, 11px)',
                        fontWeight: 500,
                        color: info.color,
                        border: `1px solid ${info.color}20`,
                      }}>
                        {info.emoji} {info.label} {direction}{Math.abs(val as number)}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Footer */}
      <div style={{
        textAlign: 'center', color: '#8B7355', opacity: 0.35,
        fontSize: 'clamp(9px, 0.7vw, 11px)',
        padding: '20px 0', lineHeight: 1.8,
      }}>
        热点数据每30分钟自动更新<br />
        鸽子的情绪会随校园事件微妙变化
      </div>
    </div>
  );
}
