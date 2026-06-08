import { useEffect, useRef, useState } from 'react';
import { usePigeonStore } from './store/pigeonStore';
import { useUIStore } from './store/uiStore';
import { getTodayDateString } from './utils/time';
import SwipeContainer from './components/SwipeContainer';
import HomeScreen from './components/HomeScreen';
import CampusMap from './components/CampusMap';
import InfoBar from './components/InfoBar';
import BottomNav from './components/BottomNav';
import BgmPlayer from './components/BgmPlayer';
import NetStatus from './components/NetStatus';
import TouchFeedback from './components/TouchFeedback';
import OnboardingGuide, { isOnboardingDone } from './components/OnboardingGuide';
import titleImg from './assets/标题字.png';

export default function App() {
  const tickPigeonAI = usePigeonStore((s) => s.tickPigeonAI);
  const decayMood = usePigeonStore((s) => s.decayMood);
  const updateTimeDerived = useUIStore((s) => s.updateTimeDerived);
  const touchDetected = useUIStore((s) => s.touchDetected);
  const initFromCloud = usePigeonStore((s) => s.initFromCloud);
  const cloudReady = usePigeonStore((s) => s.cloudReady);
  const fetchWeatherIfNeeded = usePigeonStore((s) => s.fetchWeatherIfNeeded);

  // First-time onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);
  useEffect(() => {
    // 等 cloud ready 后再检查，避免双重 overlay
    if (cloudReady && !isOnboardingDone()) {
      // 短暂延迟，让页面先渲染
      const t = setTimeout(() => setShowOnboarding(true), 600);
      return () => clearTimeout(t);
    }
  }, [cloudReady]);

  // Track previous date for journal generation
  const prevDateRef = useRef(getTodayDateString());

  // Initialize from Supabase (or localStorage fallback) on mount
  useEffect(() => {
    initFromCloud();
  }, [initFromCloud]);

  // cloudReady 后立即生成投票 + 兜底定时器
  useEffect(() => {
    if (!cloudReady) return;
    const store = usePigeonStore.getState();
    store.resetTodayIfNeeded();

    // 兜底：如果 3 秒后还没有投票，强制生成
    const fallbackTimer = setTimeout(() => {
      const s = usePigeonStore.getState();
      if (!s.dailyVote || s.dailyVote.date !== getTodayDateString()) {
        s.generateDailyVote();
      }
    }, 3000);
    return () => clearTimeout(fallbackTimer);
  }, [cloudReady]);

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

  // 初始化同步 + 背包/日报/传闻慢速同步
  useEffect(() => {
    if (!cloudReady) return;
    const store = usePigeonStore.getState();
    store.syncFeedTotalsFromCloud();
    store.syncDailyVoteFromCloud();
    store.syncRumorFromCloud();
    store.syncBackpackFromCloud();
    store.syncNewspaperFromCloud();
    const interval = setInterval(() => {
      const s = usePigeonStore.getState();
      s.syncRumorFromCloud();
      s.syncBackpackFromCloud();
      s.syncNewspaperFromCloud();
    }, 10000);
    return () => clearInterval(interval);
  }, [cloudReady]);

  // 天气：每30分钟拉取
  useEffect(() => {
    if (!cloudReady) return;
    fetchWeatherIfNeeded();
    const interval = setInterval(() => fetchWeatherIfNeeded(), 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeatherIfNeeded, cloudReady]);

  // Global touch detection for idle mode
  useEffect(() => {
    const handleTouch = () => touchDetected();
    window.addEventListener('pointerdown', handleTouch);
    return () => window.removeEventListener('pointerdown', handleTouch);
  }, [touchDetected]);

  if (!cloudReady) {
    return <LoadingOverlay />;
  }

  return (
    <>
      <SwipeContainer
        homeScreen={<HomeScreen />}
        mapScreen={
          <>
            <CampusMap />
            <InfoBar />
            <BottomNav />
          </>
        }
      />

      {/* 网络状态监控 */}
      <NetStatus />

      {/* 背景音乐 */}
      <BgmPlayer />

      {/* 全局反馈层 */}
      <TouchFeedback />

      {/* 首次引导覆盖层 */}
      {showOnboarding && (
        <OnboardingGuide onDone={() => setShowOnboarding(false)} />
      )}
    </>
  );
}

function LoadingOverlay() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(180deg, #F8F0E5 0%, #F0E4D5 35%, #E8DCC8 70%, #DDD0B8 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 16,
    }}>
      <img src={titleImg} alt="交大校园鸽"
        style={{ width: 'clamp(220px, 58vw, 400px)', height: 'auto', marginBottom: 12 }} />
      <div style={{ fontSize: 48, animation: 'bob 1.2s ease infinite' }}>🕊️</div>
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
