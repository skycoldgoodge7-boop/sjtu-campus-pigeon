import { useEffect, useRef } from 'react';
import { usePigeonStore } from './store/pigeonStore';
import { useUIStore } from './store/uiStore';
import { getTodayDateString } from './utils/time';
import AmbientBackground from './components/AmbientBackground';
import CampusMap from './components/CampusMap';
import InfoBar from './components/InfoBar';
import StatusLine from './components/StatusLine';
import MoodRadar from './components/MoodRadar';
import FeedDock from './components/FeedDock';
import SidePanel from './components/SidePanel';
import PigeonBubble from './components/PigeonBubble';
import TouchFeedback from './components/TouchFeedback';

export default function App() {
  const tickPigeonAI = usePigeonStore((s) => s.tickPigeonAI);
  const decayMood = usePigeonStore((s) => s.decayMood);
  const updateTimeDerived = useUIStore((s) => s.updateTimeDerived);
  const touchDetected = useUIStore((s) => s.touchDetected);
  const initFromCloud = usePigeonStore((s) => s.initFromCloud);
  const cloudReady = usePigeonStore((s) => s.cloudReady);

  // Track previous date for journal generation
  const prevDateRef = useRef(getTodayDateString());

  // Initialize from Supabase (or localStorage fallback) on mount
  useEffect(() => {
    initFromCloud();
  }, [initFromCloud]);

  // Pigeon AI tick: every 30-60 seconds (only after cloud is ready)
  useEffect(() => {
    if (!cloudReady) return;
    const schedule = () => {
      const delay = 30000 + Math.random() * 30000;
      return setTimeout(() => {
        tickPigeonAI();
        schedule();
      }, delay);
    };
    const timer = schedule();
    return () => clearTimeout(timer);
  }, [tickPigeonAI, cloudReady]);

  // Mood decay + time update + daily journal check: every 60 seconds
  useEffect(() => {
    if (!cloudReady) return;
    updateTimeDerived();
    const interval = setInterval(() => {
      decayMood();
      updateTimeDerived();

      // Check for date change → generate yesterday's journal
      const today = getTodayDateString();
      if (today !== prevDateRef.current) {
        const store = usePigeonStore.getState();
        store.resetTodayIfNeeded();
        prevDateRef.current = today;
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [decayMood, updateTimeDerived, cloudReady]);

  // Global touch detection for idle mode
  useEffect(() => {
    const handleTouch = () => touchDetected();
    window.addEventListener('pointerdown', handleTouch);
    return () => window.removeEventListener('pointerdown', handleTouch);
  }, [touchDetected]);

  return (
    <>
      <AmbientBackground />
      <CampusMap />
      <InfoBar />
      <StatusLine />
      <MoodRadar />
      <FeedDock />
      <SidePanel />
      <PigeonBubble />
      <TouchFeedback />
      {!cloudReady && <LoadingOverlay />}
    </>
  );
}

function LoadingOverlay() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(245, 240, 232, 0.95)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 16,
    }}>
      <div style={{ fontSize: 56, animation: 'bob 1.2s ease infinite' }}>🕊️</div>
      <div style={{
        fontSize: 16, fontWeight: 600, color: '#4A3728',
        letterSpacing: 1,
      }}>
        正在连接云端鸽子...
      </div>
      <div style={{
        width: 120, height: 3, borderRadius: 2,
        background: '#E0D5C0', overflow: 'hidden',
      }}>
        <div style={{
          width: '40%', height: '100%',
          background: '#8B6B5A',
          borderRadius: 2,
          animation: 'loadingBar 1.5s ease-in-out infinite',
        }} />
      </div>
    </div>
  );
}
