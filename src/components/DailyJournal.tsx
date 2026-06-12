import { useState, useMemo } from 'react';
import { usePigeonStore } from '../store/pigeonStore';
import { landmarkPhotos, pickCaption } from '../data/photoGallery';
import { LANDMARK_ID_TO_NAME as LANDMARK_TO_NAME } from '../data/backpackItems';
import type { DailyJournal } from '../types';
import type { LandmarkPhoto } from '../data/photoGallery';

export default function DailyJournal() {
  const journals = usePigeonStore((s) => s.journalEntries);
  const unlockedFootprints = usePigeonStore((s) => s.unlockedFootprints);
  const [showPast, setShowPast] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // 根据日记的 landmarksVisited 匹配当天照片（每地标取第一张已解锁的）
  const getPhotosForJournal = (journal: DailyJournal) => {
    const unlockedSet = new Set(unlockedFootprints);
    const photos: (LandmarkPhoto & { caption: string })[] = [];
    for (const vid of [...new Set(journal.landmarksVisited)]) {
      const name = LANDMARK_TO_NAME[vid];
      if (!name || !landmarkPhotos[name]) continue;
      const allPhotos = landmarkPhotos[name];
      const firstUnlocked = allPhotos.find((p) => unlockedSet.has(p.path));
      if (firstUnlocked) {
        photos.push({ ...firstUnlocked, caption: pickCaption(firstUnlocked.captions) });
      }
    }
    return photos;
  };

  const latest = journals[0];
  const latestPhotos = latest ? getPhotosForJournal(latest) : [];

  // 把日记文本拆成段落，在自然断点插入当天足迹照片
  const blendedContent = useMemo(() => {
    if (!latest) return [];
    const paras = latest.content.split(/\n\n+/).filter((p) => p.trim());
    const photos = latestPhotos;
    const result: Array<{ type: 'text'; text: string } | { type: 'photo'; photo: LandmarkPhoto & { caption: string } }> = [];

    if (paras.length > 0) {
      result.push({ type: 'text', text: paras[0] });

      let photoIdx = 0;
      for (let i = 1; i < paras.length; i++) {
        if (photoIdx < photos.length && (i % 3 === 1 || i % 2 === 0)) {
          result.push({ type: 'photo', photo: photos[photoIdx] });
          photoIdx++;
        }
        result.push({ type: 'text', text: paras[i] });
      }

      while (photoIdx < photos.length) {
        result.push({ type: 'photo', photo: photos[photoIdx] });
        photoIdx++;
      }
    }

    return result;
  }, [latest, latestPhotos]);

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
        fontSize: 'clamp(12px, 1vw, 15px)',
        color: '#4A3728',
        lineHeight: 2,
        background: 'rgba(196,119,107,0.05)',
        borderRadius: 16,
        padding: '20px',
        animation: 'fadeInUp 0.6s ease',
      }}>
        {blendedContent.map((item, i) => {
          if (item.type === 'text') {
            return (
              <div key={`t-${i}`} style={{
                whiteSpace: 'pre-line',
                marginBottom: 12,
              }}>
                {item.text}
              </div>
            );
          }
          const photo = item.photo;
          return (
            <div key={`p-${photo.path}`}
              onPointerDown={() => setLightboxSrc(photo.path)}
              style={{
                margin: '0 0 16px 0',
                borderRadius: 12,
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(139,115,85,0.06)',
                animation: 'fadeInUp 0.5s ease both',
                cursor: 'pointer',
              }}>
              <div style={{
                width: '100%',
                aspectRatio: '16/10',
                overflow: 'hidden',
                background: 'rgba(0,0,0,0.02)',
              }}>
                <img
                  src={photo.path}
                  alt={photo.caption}
                  loading="lazy"
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover', display: 'block',
                  }}
                />
              </div>
              <div style={{ padding: '10px 12px', pointerEvents: 'none' }}>
                <span style={{
                  fontSize: 'clamp(9px, 0.75vw, 11px)',
                  color: '#8B7355', opacity: 0.6,
                  lineHeight: 1.5,
                }}>
                  {photo.caption}
                </span>
              </div>
            </div>
          );
        })}
        {/* 如果日记有内容但还没有解锁足迹，显示提示 */}
        {latestPhotos.length === 0 && (
          <div style={{
            textAlign: 'center', color: '#8B7355', opacity: 0.35,
            fontSize: 'clamp(10px, 0.8vw, 12px)', marginTop: 12,
          }}>
            鸽子还没解锁足迹照片。
          </div>
        )}
      </div>

      {/* Past journals */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 'clamp(10px, 0.8vw, 12px)', opacity: 0.6 }}>
                {showPast ? '📖' : '📕'}
              </span>
              <span style={{ fontSize: 'clamp(11px, 0.9vw, 13px)', fontWeight: 600, color: '#8B7355' }}>
                往期记录
              </span>
              <span style={{ fontSize: 'clamp(9px, 0.7vw, 11px)', color: '#8B7355', opacity: 0.5 }}>
                {journals.length - 1} 篇
              </span>
            </div>
            <span style={{
              fontSize: 'clamp(10px, 0.8vw, 12px)', color: '#8B7355', opacity: 0.5,
              transform: showPast ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.25s ease',
            }}>▶</span>
          </button>

          {showPast && (
            <div style={{ marginTop: 8 }}>
              {journals.slice(1, 8).map((j) => {
                const isExpanded = expandedIds.has(j.id);
                return (
                <div key={j.id}
                  style={{
                    padding: '12px 14px', marginBottom: 8,
                    background: isExpanded ? 'rgba(196,119,107,0.06)' : 'rgba(196,119,107,0.035)',
                    borderRadius: 12,
                    fontSize: 'clamp(10px, 0.85vw, 13px)',
                    color: '#8B7355',
                    animation: 'fadeInUp 0.3s ease both',
                    transition: 'background 0.2s ease',
                  }}>
                  <div
                    onPointerDown={() => toggleExpand(j.id)}
                    style={{
                      cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                    <span>
                      <span style={{ fontWeight: 600 }}>{j.date.slice(5)}</span>
                      <span style={{ marginLeft: 8, opacity: 0.6 }}>校园观察</span>
                    </span>
                    <span style={{
                      fontSize: 'clamp(9px, 0.7vw, 11px)', opacity: 0.5,
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s ease',
                    }}>▶</span>
                  </div>
                  {j.pickedNote && (
                    <div style={{
                      marginTop: 4, fontSize: '0.85em', opacity: 0.8, fontStyle: 'italic',
                    }}>
                      📝 捡到纸条：「{j.pickedNote}」
                    </div>
                  )}
                  {isExpanded && (
                    <div style={{
                      whiteSpace: 'pre-line',
                      marginTop: 10, padding: '14px 16px',
                      background: 'rgba(255,255,255,0.6)',
                      borderRadius: 12,
                      fontSize: 'clamp(11px, 0.9vw, 14px)',
                      color: '#4A3728', lineHeight: 2,
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

      {/* Lightbox */}
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
    </div>
  );
}

