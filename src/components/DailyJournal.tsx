import { useState } from 'react';
import { usePigeonStore } from '../store/pigeonStore';
import type { DailyJournal } from '../types';

export default function DailyJournal() {
  const journals = usePigeonStore((s) => s.journalEntries);
  const [showPast, setShowPast] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const latest = journals[0];

  if (!latest) {
    return (
      <div style={{
        padding: '20px', textAlign: 'center',
        color: '#8B7355', fontSize: 'clamp(12px, 1vw, 15px)',
        lineHeight: 2,
      }}>
        <div style={{ fontSize: 'clamp(20px, 2vw, 32px)', marginBottom: 12 }}>📋</div>
        <div>还没有校园记录</div>
        <div style={{ fontSize: '0.85em', opacity: 0.7 }}>每天凌晨自动生成</div>
        <div style={{ fontSize: '0.85em', opacity: 0.7 }}>记录这一天的校园故事</div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%', overflow: 'auto', padding: '16px',
    }}>
      <div style={{
        whiteSpace: 'pre-line',
        fontSize: 'clamp(12px, 1vw, 15px)',
        color: '#4A3728',
        lineHeight: 2,
        background: 'rgba(196,119,107,0.05)',
        borderRadius: 16,
        padding: '20px',
        animation: 'fadeInUp 0.6s ease',
      }}>
        {latest.content}
      </div>

      {/* Past journals — 折叠展开 */}
      {journals.length > 1 && (
        <div style={{ marginTop: 24 }}>
          <button
            onPointerDown={() => setShowPast((v) => !v)}
            style={{
              width: '100%', border: 'none',
              background: 'rgba(196,119,107,0.04)',
              borderRadius: 14,
              padding: '12px 16px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'background 0.2s ease',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 'clamp(10px, 0.8vw, 12px)', opacity: 0.6 }}>
                {showPast ? '📖' : '📕'}
              </span>
              <span style={{
                fontSize: 'clamp(11px, 0.9vw, 13px)',
                fontWeight: 600, color: '#8B7355',
              }}>
                往期记录
              </span>
              <span style={{
                fontSize: 'clamp(9px, 0.7vw, 11px)',
                color: '#8B7355', opacity: 0.5,
              }}>
                {journals.length - 1} 篇
              </span>
            </div>
            <span style={{
              fontSize: 'clamp(10px, 0.8vw, 12px)',
              color: '#8B7355', opacity: 0.5,
              transform: showPast ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.25s ease',
            }}>
              ▶
            </span>
          </button>

          {showPast && (
            <div style={{ marginTop: 8 }}>
              {journals.slice(1, 8).map((j) => {
                const isExpanded = expandedIds.has(j.id);
                return (
                <div key={j.id}
                  onPointerDown={() => toggleExpand(j.id)}
                  style={{
                    padding: '12px 14px',
                    marginBottom: 8,
                    background: isExpanded ? 'rgba(196,119,107,0.06)' : 'rgba(196,119,107,0.035)',
                    borderRadius: 12,
                    fontSize: 'clamp(10px, 0.85vw, 13px)',
                    color: '#8B7355',
                    cursor: 'pointer',
                    animation: 'fadeInUp 0.3s ease both',
                    transition: 'background 0.2s ease',
                  }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span>
                      <span style={{ fontWeight: 600 }}>{j.date.slice(5)}</span>
                      <span style={{ marginLeft: 8, opacity: 0.6 }}>
                        校园观察
                      </span>
                    </span>
                    <span style={{
                      fontSize: 'clamp(9px, 0.7vw, 11px)',
                      opacity: 0.5,
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s ease',
                    }}>
                      ▶
                    </span>
                  </div>
                  {j.pickedNote && (
                    <div style={{
                      marginTop: 4, fontSize: '0.85em', opacity: 0.8,
                      fontStyle: 'italic',
                    }}>
                      📝 捡到纸条：「{j.pickedNote}」
                    </div>
                  )}
                  {j.pigeonReply && (
                    <div style={{
                      marginTop: 6, padding: '8px 12px',
                      background: 'rgba(196,119,107,0.06)',
                      borderRadius: 10,
                      fontSize: '0.85em', opacity: 0.85,
                      lineHeight: 1.6,
                      border: '1px solid rgba(196,119,107,0.1)',
                    }}>
                      🕊️ 鸽子回复：「{j.pigeonReply}」
                    </div>
                  )}
                  {isExpanded && (
                    <div style={{
                      whiteSpace: 'pre-line',
                      marginTop: 10,
                      padding: '14px 16px',
                      background: 'rgba(255,255,255,0.6)',
                      borderRadius: 12,
                      fontSize: 'clamp(11px, 0.9vw, 14px)',
                      color: '#4A3728',
                      lineHeight: 2,
                      animation: 'fadeInUp 0.3s ease both',
                      border: '1px solid rgba(196,119,107,0.08)',
                    }}>
                      {j.content}
                    </div>
                  )}
                </div>
              );
              })}


            </div>
          )}
        </div>
      )}
    </div>
  );
}
