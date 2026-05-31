import { usePigeonStore, getActivityLabel } from '../store/pigeonStore';
import { landmarks } from '../data/landmarks';
import { useMemo } from 'react';

export default function StatusLine() {
  const activity = usePigeonStore((s) => s.pigeonActivity);
  const currentLandmarkId = usePigeonStore((s) => s.currentLandmarkId);
  const recentStatusText = usePigeonStore((s) => s.recentStatusText);
  const statusExpiresAt = usePigeonStore((s) => s.statusTextExpiresAt);

  const landmark = landmarks.find((l) => l.id === currentLandmarkId);

  const displayText = useMemo(() => {
    // If there's a recent status (from feeding), show it until it expires
    if (recentStatusText && Date.now() < statusExpiresAt) {
      return recentStatusText;
    }
    return getActivityLabel(activity, landmark?.name);
  }, [recentStatusText, statusExpiresAt, activity, landmark]);

  const locationHint = landmark ? ` · ${landmark.emoji} ${landmark.name}` : '';

  return (
    <div style={{
      position: 'fixed',
      top: 'clamp(90px, 15vh, 140px)',
      left: 0, right: 0,
      zIndex: 10,
      display: 'flex', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{
        fontSize: 'clamp(13px, 1.3vw, 18px)',
        fontWeight: 500,
        color: 'rgba(255,255,255,0.85)',
        textShadow: '0 1px 8px rgba(0,0,0,0.3)',
        padding: '4px 20px',
        background: 'rgba(0,0,0,0.25)',
        backdropFilter: 'blur(8px)',
        borderRadius: 16,
        transition: 'opacity 0.5s ease',
        letterSpacing: 1,
      }}>
        {displayText}{locationHint}
      </div>
    </div>
  );
}
