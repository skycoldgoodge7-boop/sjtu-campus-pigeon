import { useUIStore } from '../store/uiStore';

export default function TouchFeedback() {
  const ripples = useUIStore((s) => s.rippleEffects);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, pointerEvents: 'none' }}>
      {ripples.map((r) => (
        <div key={r.id} style={{
          position: 'absolute',
          left: r.x - 20, top: r.y - 20,
          width: 40, height: 40,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.3)',
          animation: 'ripple 0.6s ease-out forwards',
        }} />
      ))}
    </div>
  );
}
