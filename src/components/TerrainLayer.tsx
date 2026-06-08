// 校园底图 — 居中，94vw/760px 宽，无阴影卡片
import mapBg from '../assets/校园地图.png';
import { useUIStore } from '../store/uiStore';

export default function TerrainLayer() {
  const timeOfDay = useUIStore((s) => s.timeOfDay);
  const isNight = timeOfDay === 'night';

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none', zIndex: 1,
      opacity: isNight ? 0.70 : 0.95,
      transition: 'opacity 4s ease',
    }}>
      <img
        src={mapBg}
        alt="交大校园地图"
        style={{
          width: 'min(94vw, 760px)',
          height: 'auto',
          maxHeight: '100%',
          objectFit: 'contain',
          display: 'block',
          // 纸张感：轻微暖色内发光
          filter: 'drop-shadow(0 0 0 rgba(0,0,0,0))',
        }}
      />
    </div>
  );
}
