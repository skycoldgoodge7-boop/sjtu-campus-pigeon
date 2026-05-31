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

  // Track previous date for journal generation
  const prevDateRef = useRef(getTodayDateString());

  // Pigeon AI tick: every 30-60 seconds
  useEffect(() => {
    const schedule = () => {
      const delay = 30000 + Math.random() * 30000;
      return setTimeout(() => {
        tickPigeonAI();
        schedule();
      }, delay);
    };
    const timer = schedule();
    return () => clearTimeout(timer);
  }, [tickPigeonAI]);

  // Mood decay + time update + daily journal check: every 60 seconds
  useEffect(() => {
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
  }, [decayMood, updateTimeDerived]);

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
    </>
  );
}
