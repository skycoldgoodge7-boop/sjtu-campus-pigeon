import { useUIStore } from '../store/uiStore';

export default function TouchFeedback() {
  const ripples = useUIStore((s) => s.rippleEffects);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, pointerEvents: 'none' }}>
      {ripples.map((r) => (
        <div key={r.id} style={{
          position: 'absolute',
          left: r.x - 24, top: r.y - 24,
          width: 48, height: 48,
          borderRadius: '50%',
          background: 'radial-gradient(circle at center, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.1) 35%, transparent 70%)',
          animation: 'ripple 0.8s var(--ease-out-expo) forwards',
        }} />
      ))}
    </div>
  );
}
