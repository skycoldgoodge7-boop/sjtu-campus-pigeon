// ====== 横向滑动切换器 ======
// 屏幕1（home 养成）+ 屏幕2（map 地图）
// pointer 事件驱动，带弹簧回弹，阈值 50px
// v2: 使用 px 位移，避免 Safari 上 transform % 的计算问题

import { useRef, useState, useCallback, useEffect } from 'react';
import { useUIStore } from '../store/uiStore';
import { haptic } from '../utils/haptic';

const THRESHOLD = 50;

export default function SwipeContainer({
  homeScreen,
  mapScreen,
}: {
  homeScreen: React.ReactNode;
  mapScreen: React.ReactNode;
}) {
  const currentScreen = useUIStore((s) => s.currentScreen);
  const setScreen = useUIStore((s) => s.setScreen);

  const [vw, setVw] = useState(() => window.innerWidth);
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const startX = useRef(0);
  const movedRef = useRef(false);

  // 跟踪窗口宽度
  useEffect(() => {
    const handleResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const screenIndex = currentScreen === 'home' ? 0 : 1;

  // px 偏移：两个屏幕并排，每屏宽 vw
  // 屏0: 0 .. vw,  屏1: vw .. 2*vw
  // 需要向左平移 screenIndex * vw 来显示目标屏
  // 拖动时再加上 offset px
  const translateX = -(screenIndex * vw) + offset;

  const handleDown = useCallback((e: React.PointerEvent) => {
    setIsAnimating(false);
    startX.current = e.clientX;
    movedRef.current = false;
    setIsDragging(true);
    try { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); } catch {}
  }, []);

  const handleMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) < 4 && !movedRef.current) return;
    movedRef.current = true;

    // 边界阻尼
    if ((currentScreen === 'home' && dx > 0) || (currentScreen === 'map' && dx < 0)) {
      setOffset(dx * 0.35);
    } else {
      setOffset(dx);
    }
  }, [isDragging, currentScreen]);

  const finishSwipe = useCallback((clientX: number) => {
    setIsDragging(false);
    const dx = clientX - startX.current;

    if (Math.abs(dx) < THRESHOLD || !movedRef.current) {
      setIsAnimating(true);
      setOffset(0);
      return;
    }

    setIsAnimating(true);
    if (dx < 0 && currentScreen === 'home') {
      setScreen('map');
      haptic('swipe');
    } else if (dx > 0 && currentScreen === 'map') {
      setScreen('home');
      haptic('swipe');
    }
    setOffset(0);
  }, [currentScreen, setScreen]);

  const handleUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    try { (e.target as HTMLElement).releasePointerCapture?.(e.pointerId); } catch {}
    finishSwipe(e.clientX);
  }, [isDragging, finishSwipe]);

  // pointerleave 时只回弹，不触发切屏（移动端手指滑出边缘时坐标不可靠）
  const handleLeave = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    setIsAnimating(true);
    setOffset(0);
  }, [isDragging]);

  useEffect(() => { setOffset(0); }, [currentScreen]);

  const transition = isAnimating
    ? 'transform 0.42s cubic-bezier(0.34, 1.4, 0.64, 1)'
    : isDragging ? 'none' : 'transform 0.42s cubic-bezier(0.34, 1.4, 0.64, 1)';

  return (
    <div
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onPointerLeave={handleLeave}
      style={{
        position: 'fixed', inset: 0,
        overflow: 'hidden',
        touchAction: 'pan-y',
        background: '#F5F0E8',
      }}
    >
      {/* 两个屏幕并排：2*vw 宽容器，translateX 控制显示区域 */}
      <div style={{
        display: 'flex',
        width: vw * 2,
        height: '100%',
        transform: `translateX(${translateX}px)`,
        transition,
        willChange: isDragging ? 'transform' : 'auto',
      }}>
        {/* 屏幕 0：Home */}
        <div style={{
          flex: '0 0 auto',
          width: vw,
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          background: '#F8F0E5',
        }}>
          {homeScreen}
        </div>
        {/* 屏幕 1：Map — 纸质地图渐变 */}
        <div style={{
          flex: '0 0 auto',
          width: vw,
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #E8EAD6 0%, #E3E6CF 50%, #DDE2C8 100%)',
        }}>
          {mapScreen}
        </div>
      </div>

    </div>
  );
}
