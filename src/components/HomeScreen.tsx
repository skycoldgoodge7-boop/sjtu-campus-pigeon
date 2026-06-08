// ====== 养成主界面 ======
// 顶部：投喂统计 → 标题字 → 鸽子气泡 → 鸽子大图 → 状态标签
// 底部：投票选项（强制投票） / 投票结果 / 投喂图标
// 特殊日期投票后有AI感慨

import { usePigeonStore, getActivityLabel } from '../store/pigeonStore';
import { useUIStore } from '../store/uiStore';
import { feedItems } from '../data/feedItems';
import { landmarks } from '../data/landmarks';
import { useMemo, useCallback, useState, useEffect } from 'react';
import PigeonSprite from './PigeonSprite';
import titleImg from '../assets/标题字.png';
import type { FeedItemId, DailyVote } from '../types';
import { haptic } from '../utils/haptic';
import { detectSpecialDate, generateSpecialDateComment } from '../utils/ai';
import { isVoteOpen, minutesUntilVoteClose } from '../utils/time';

const FEED_COLORS: Record<string, { bg: string; border: string }> = {
  bread:     { bg: '#F5E6D0', border: '#E0CCAA' },
  coffee:    { bg: '#E8D8C8', border: '#D4BCA0' },
  milkTea:   { bg: '#F0E0D0', border: '#DEC8B0' },
  noodles:   { bg: '#F2E8D8', border: '#E0D0B8' },
  fries:     { bg: '#F4E4CC', border: '#E2CCA8' },
  flower:    { bg: '#F8E8E0', border: '#E8D0C8' },
  umbrella:  { bg: '#E8E4F0', border: '#D4CFE0' },
  headphone: { bg: '#E8ECF0', border: '#D0D8E0' },
};

export default function HomeScreen() {
  const activity = usePigeonStore((s) => s.pigeonActivity);
  const currentLandmarkId = usePigeonStore((s) => s.currentLandmarkId);
  const todayFeedCount = usePigeonStore((s) => s.todayFeedCount);
  const feedTotals = usePigeonStore((s) => s.feedTotals);
  const totalFeedCount = Object.values(feedTotals).reduce((a, b) => a + b, 0);
  const recentStatusText = usePigeonStore((s) => s.recentStatusText);
  const statusExpiresAt = usePigeonStore((s) => s.statusTextExpiresAt);
  const mood = usePigeonStore((s) => s.mood);
  const feedPigeon = usePigeonStore((s) => s.feedPigeon);

  const bubble = useUIStore((s) => s.pigeonBubble);
  const setActiveFeedAnimation = useUIStore((s) => s.setActiveFeedAnimation);
  const setPigeonBubble = useUIStore((s) => s.setPigeonBubble);
  const addRipple = useUIStore((s) => s.addRipple);

  // 投票
  const dailyVote = usePigeonStore((s) => s.dailyVote);
  const userVoteRecord = usePigeonStore((s) => s.userVoteRecord);
  const todayDate = usePigeonStore((s) => s.todayDate);
  const zhipuApiKey = usePigeonStore((s) => s.zhipuApiKey);
  const castVote = usePigeonStore((s) => s.castVote);

  const [voteResultsVisible, setVoteResultsVisible] = useState(false);
  const [specialComment, setSpecialComment] = useState<string | null>(null);
  const [showMoodBottle, setShowMoodBottle] = useState(false);

  const todayFeedTotals = usePigeonStore((s) => s.todayFeedTotals);
  const giftFlags = usePigeonStore((s) => s.giftFlags);
  const weatherData = usePigeonStore((s) => s.weatherData);

  // ── 心情成分推导 ──
  const moodComposition = useMemo(() => {
    const items: { emoji: string; label: string; delta: number }[] = [];
    const moodLabels: Record<string, string> = {
      warmth: '温暖', social: '社交', romance: '浪漫', energy: '活力',
      academic: '学术', slack: '摸鱼', loneliness: '孤独', stress: '压力',
    };
    for (const [itemId, count] of Object.entries(todayFeedTotals)) {
      if (count <= 0) continue;
      const item = feedItems.find((f) => f.id === itemId);
      if (!item?.moodEffect) continue;
      for (const [key, delta] of Object.entries(item.moodEffect)) {
        if (!delta || !(key in moodLabels)) continue;
        items.push({ emoji: item.emoji, label: `${item.name}`, delta: delta * count });
      }
    }
    // 礼物影响
    if (giftFlags.hasFlower) items.push({ emoji: '🌸', label: '花的陪伴', delta: 5 });
    if (giftFlags.hasUmbrella && weatherData && weatherData.weatherCode >= 51) items.push({ emoji: '☂️', label: '有伞不怕雨', delta: 3 });
    if (giftFlags.hasScarf) items.push({ emoji: '🧣', label: '围巾暖暖的', delta: 3 });
    return items;
  }, [todayFeedTotals, giftFlags, weatherData]);

  const hasVote = !!dailyVote && dailyVote.date === todayDate;
  const alreadyVoted = userVoteRecord?.date === todayDate;
  const voteOpen = isVoteOpen();
  const voteCountdown = voteOpen ? minutesUntilVoteClose() : 0;
  // 投票开放 + 有问题 + 没投过 → 显示投票
  const showVoting = hasVote && !alreadyVoted && voteOpen;
  // 投票已截止但还没到午夜 → 显示结果 + 截止提示
  const voteClosed = hasVote && !voteOpen;

  // 投票后的显示阶段：result → specialComment → 恢复喂食
  // 特殊日期AI感慨
  const specialDate = detectSpecialDate();

  useEffect(() => {
    if (!voteResultsVisible) return;
    // 先显示结果 2s
    const t1 = setTimeout(() => {
      if (specialDate && zhipuApiKey && !specialComment) {
        // 有特殊日期 → 请求AI感慨
        generateSpecialDateComment(zhipuApiKey, specialDate).then((c) => {
          if (c) {
            setSpecialComment(c);
            setTimeout(() => {
              setSpecialComment(null);
              setVoteResultsVisible(false);
            }, 3000);
          } else {
            setVoteResultsVisible(false);
          }
        });
      } else {
        // 无特殊日期 → 直接恢复
        setVoteResultsVisible(false);
      }
    }, 2000);
    return () => clearTimeout(t1);
  }, [voteResultsVisible]);

  const targetLandmarkId = usePigeonStore((s) => s.targetLandmarkId);
  const landmark = landmarks.find((l) => l.id === currentLandmarkId);
  const targetLandmark = targetLandmarkId ? landmarks.find((l) => l.id === targetLandmarkId) : null;

  const statusText = useMemo(() => {
    if (recentStatusText && Date.now() < statusExpiresAt) return recentStatusText;
    return getActivityLabel(activity, landmark?.name, targetLandmark?.name);
  }, [recentStatusText, statusExpiresAt, activity, landmark, targetLandmark]);

  const topMood = useMemo(() => {
    let maxK = 'slack'; let maxV = 0;
    for (const [k, v] of Object.entries(mood)) {
      if (v > maxV) { maxK = k; maxV = v; }
    }
    return { key: maxK, value: maxV, emoji: moodEmoji(maxK) };
  }, [mood]);

  // 心情标签（依赖 topMood）
  const moodLabel = useMemo(() => {
    const map: Record<string, string> = {
      warmth: '暖洋洋的', social: '想和大家一起', romance: '心里软软的', energy: '很有精神',
      academic: '专注', slack: '悠闲', loneliness: '有点安静', stress: '有点紧张',
    };
    return map[topMood.key] || '平静';
  }, [topMood.key]);

  const handleFeed = useCallback((itemId: FeedItemId, emoji: string, e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    feedPigeon(itemId);
    haptic('feed');
    setActiveFeedAnimation({ itemId, emoji, x, y });
    addRipple(e.clientX, e.clientY);
    const item = feedItems.find((f) => f.id === itemId);
    if (item) {
      const tb = item.thoughtBubbles[Math.floor(Math.random() * item.thoughtBubbles.length)];
      setPigeonBubble({ emoji, text: tb });
    }
    setTimeout(() => setActiveFeedAnimation(null), 600);
  }, [feedPigeon, setActiveFeedAnimation, setPigeonBubble, addRipple]);

  const handleVote = useCallback((index: number) => {
    haptic('feed');
    castVote(index);
    setVoteResultsVisible(true);
  }, [castVote]);

  // 气泡内容
  let bubbleContent: { emoji: string; text: string };
  let bubbleMultiline = false;
  let bubbleVariant: 'normal' | 'vote' | 'result' | 'special' = 'normal';
  let bottomPhase: 'vote' | 'result' | 'special' | 'feed' = 'feed';

  if (showVoting) {
    bubbleContent = { emoji: '🗳️', text: dailyVote!.question };
    bubbleMultiline = true;
    bubbleVariant = 'vote';
    bottomPhase = 'vote';
  } else if (voteClosed && !alreadyVoted) {
    // 投票截止但用户还没投
    bubbleContent = { emoji: '🔒', text: `投票已截止 · 明日再来` };
    bubbleMultiline = true;
    bubbleVariant = 'result';
    bottomPhase = 'result';
  } else if (specialComment) {
    bubbleContent = { emoji: specialDate?.emoji || '💬', text: specialComment };
    bubbleMultiline = true;
    bubbleVariant = 'special';
    bottomPhase = 'special';
  } else if (voteResultsVisible) {
    const vote = dailyVote!;
    const total = vote.totalVotes || 1;
    const maxIdx = vote.voteCounts.indexOf(Math.max(...vote.voteCounts));
    const pct = Math.round((vote.voteCounts[maxIdx] / total) * 100);
    bubbleContent = { emoji: vote.resultMood, text: `"${vote.options[maxIdx]?.text}" ${pct}% · ${vote.resultMood}` };
    bubbleMultiline = true;
    bubbleVariant = 'result';
    bottomPhase = 'result';
  } else {
    bubbleContent = { emoji: bubble?.emoji || topMood.emoji, text: bubble?.text || statusText };
    bottomPhase = 'feed';
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(180deg, #F8F0E5 0%, #F0E4D5 30%, #EAE0D0 60%, #E5DCC8 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', position: 'relative', overflow: 'hidden',
    }}>
      {/* 背景光晕 */}
      <div style={{
        position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)',
        width: 'min(72vw, 300px)', height: 'min(72vw, 300px)',
        background: 'radial-gradient(circle, rgba(255,242,225,0.55) 0%, rgba(255,235,210,0.2) 45%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      {/* 投喂统计 */}
      <div style={{ marginTop: 'clamp(40px, 5vh, 64px)', textAlign: 'center' }}>
        <div style={{ fontSize: 'clamp(12px, 1.1vw, 15px)', fontWeight: 500, color: '#8B7355', letterSpacing: 1, opacity: 0.7, marginBottom: 'clamp(6px, 1vh, 10px)' }}>
          今日投喂 <span style={{ fontWeight: 700, color: '#C4776B', fontSize: '1.15em' }}>{todayFeedCount}</span> 次
          {totalFeedCount > 0 && (
            <span style={{ marginLeft: 8, opacity: 0.5, fontSize: '0.85em' }}>
              · 累计 <span style={{ fontWeight: 600 }}>{totalFeedCount}</span> 次
            </span>
          )}
        </div>
        <img src={titleImg} alt="交大校园鸽" style={{
          width: 'clamp(220px, 56vw, 400px)', height: 'auto', display: 'block', margin: '0 auto',
          filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.12))',
        }} />
      </div>

      {/* 鸽子气泡 */}
      <div style={{
        marginTop: 'clamp(8px, 1.5vh, 16px)', zIndex: 5, pointerEvents: 'none', animation: 'fadeInUp 0.4s ease',
      }}>
        <div style={{
          background: bubbleVariant === 'special' ? 'linear-gradient(135deg, #FFF8E7, #FFE0D0)'
            : bubbleVariant === 'result' ? 'linear-gradient(135deg, rgba(232,248,232,0.95), rgba(220,240,220,0.92))'
            : bubbleVariant === 'vote' ? 'linear-gradient(135deg, rgba(255,248,231,0.95), rgba(255,240,208,0.92))'
            : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(6px)',
          borderRadius: 18,
          padding: bubbleMultiline ? '14px 22px' : '9px 20px',
          fontSize: 'clamp(13px, 1.2vw, 17px)',
          fontWeight: 600, color: '#4A3728',
          boxShadow: bubbleMultiline ? '0 4px 18px rgba(196,119,107,0.1)' : '0 3px 14px rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', gap: 8,
          border: bubbleMultiline ? '1.5px solid rgba(196,119,107,0.15)' : 'none',
          whiteSpace: bubbleMultiline ? 'normal' : 'nowrap',
          maxWidth: bubbleMultiline ? 'min(320px, 82vw)' : undefined,
          textAlign: bubbleMultiline ? 'center' : undefined,
          lineHeight: bubbleMultiline ? 1.6 : undefined,
        }}>
          <span style={{ fontSize: 'clamp(16px, 1.6vw, 22px)', flexShrink: 0 }}>{bubbleContent.emoji}</span>
          <span>{bubbleContent.text}</span>
        </div>
        <div style={{
          width: 0, height: 0,
          borderLeft: '7px solid transparent', borderRight: '7px solid transparent',
          borderTop: bubbleMultiline ? '7px solid rgba(255,248,231,0.92)' : '7px solid rgba(255,255,255,0.9)',
          margin: '0 auto',
        }} />
      </div>

      {/* 鸽子大图 */}
      <div style={{ position: 'relative', zIndex: 2, animation: 'gentleFloat 4s ease-in-out infinite', marginTop: 'clamp(4px, 1vh, 12px)' }}>
        <PigeonSprite activity={activity} width="clamp(180px, 40vw, 280px)" />
        <div style={{ width: '72%', height: 9, margin: '5px auto 0', background: 'radial-gradient(ellipse 65% 50%, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.03) 55%, transparent 100%)', borderRadius: '50%', filter: 'blur(2.5px)' }} />
      </div>

      {/* 状态标签 */}
      <div style={{ marginTop: 'clamp(14px, 2vh, 24px)', display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', zIndex: 3 }}>
        <Chip emoji={topMood.emoji} label={`心情 ${topMood.value}%`} />
        <Chip emoji={landmark?.emoji || '📍'} label={landmark?.name || '校园'} />
        {/* 心情瓶按钮 */}
        <button
          onPointerDown={() => setShowMoodBottle((v) => !v)}
          style={{
            border: 'none', borderRadius: 16,
            background: showMoodBottle ? 'rgba(196,119,107,0.1)' : 'rgba(255,252,245,0.85)',
            padding: '7px 14px', cursor: 'pointer',
            fontSize: 'clamp(13px, 1.1vw, 17px)',
            fontWeight: 600, color: '#6B5A4A',
            boxShadow: '0 2px 8px rgba(100,80,60,0.07)',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'background 0.2s ease',
          }}
        >
          🫙
        </button>
      </div>

      {/* 心情成分面板 — 在投喂层上方展开 */}
      {showMoodBottle && (
        <div style={{
          marginTop: 10, zIndex: 10, width: '100%', maxWidth: 320,
          alignSelf: 'center',
          background: 'rgba(255,252,245,0.97)',
          backdropFilter: 'blur(12px)',
          borderRadius: 18,
          padding: '16px 20px',
          boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
          border: '1px solid rgba(196,119,107,0.12)',
          animation: 'fadeInUp 0.3s ease both',
          textAlign: 'left',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#4A3728', marginBottom: 4 }}>
            🫙 今日心情 · {moodLabel}
          </div>
          <div style={{ fontSize: 11, color: '#8B7355', opacity: 0.6, marginBottom: 10 }}>
            {moodComposition.length > 0 ? '这些是今天影响它的因素：' : '今天还没有人来过。'}
          </div>
          {moodComposition.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {moodComposition.map((m, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 12, color: '#4A3728',
                }}>
                  <span style={{ fontSize: 16 }}>{m.emoji}</span>
                  <span style={{ flex: 1 }}>{m.label}</span>
                  <span style={{
                    color: m.delta > 0 ? '#A0B888' : '#D4A8A0',
                    fontWeight: 600, fontSize: 11,
                  }}>
                    {m.delta > 0 ? '+' : ''}{m.delta}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 底部区域 */}
      {bottomPhase === 'vote' && <VoteGrid options={dailyVote!.options} onSelect={handleVote} />}
      {bottomPhase === 'result' && dailyVote && <VoteResultBar vote={dailyVote} />}
      {bottomPhase === 'special' && <SpecialHint />}
      {bottomPhase === 'feed' && <FeedGrid items={feedItems.slice(0, 8)} colors={FEED_COLORS} onFeed={handleFeed} />}

      {/* 底部提示 */}
      <div style={{ marginTop: 'clamp(12px, 2vh, 20px)', marginBottom: 'clamp(8px, 1.5vh, 16px)', display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(74,55,40,0.3)', fontSize: 'clamp(10px, 0.85vw, 13px)', fontWeight: 500, letterSpacing: 0.5, pointerEvents: 'none' }}>
        <span>
          {showVoting
            ? `👆 投票后解锁投喂${voteCountdown <= 60 && voteCountdown > 0 ? ` · ${voteCountdown}分钟后截止` : ''}`
            : voteClosed && !alreadyVoted
              ? '🔒 今日投票已截止 · 明早再来'
              : '👈 左滑查看地图'}
        </span>
      </div>
    </div>
  );
}

// ── 投票选项网格 ──
function VoteGrid({ options, onSelect }: { options: DailyVote['options']; onSelect: (i: number) => void }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${Math.min(4, options.length)}, 1fr)`,
      gap: 'clamp(10px, 1.5vw, 16px)',
      marginTop: 'clamp(18px, 3vh, 32px)',
      padding: '0 clamp(16px, 3vw, 40px)',
      zIndex: 3, width: '100%', maxWidth: 420,
      animation: 'fadeInUp 0.4s ease',
    }}>
      {options.slice(0, 4).map((opt, i) => (
        <button key={i} onPointerDown={() => onSelect(i)} style={{
          width: 'clamp(64px, 16vw, 88px)', height: 'clamp(64px, 16vw, 88px)',
          borderRadius: 18, border: '2px solid rgba(196,119,107,0.25)',
          background: 'rgba(196,119,107,0.08)', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
          fontSize: 'clamp(26px, 5vw, 38px)',
          transition: 'transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease',
          boxShadow: '0 2px 12px rgba(196,119,107,0.08)',
          WebkitTapHighlightColor: 'transparent', padding: 0,
        }}>
          <span style={{ lineHeight: 1 }}>{opt.emoji}</span>
          <span style={{ fontSize: 'clamp(9px, 1.1vw, 11px)', fontWeight: 600, color: '#6B5A4A', lineHeight: 1 }}>{opt.text}</span>
        </button>
      ))}
    </div>
  );
}

// ── 投票结果 ──
function VoteResultBar({ vote }: { vote: DailyVote }) {
  const total = vote.totalVotes || 1;
  const maxCount = Math.max(1, ...vote.voteCounts);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'clamp(18px, 3vh, 32px)', padding: '0 clamp(16px, 3vw, 40px)', zIndex: 3, width: '100%', maxWidth: 400, animation: 'fadeInUp 0.4s ease' }}>
      {vote.options.map((opt, i) => {
        const count = vote.voteCounts[i] || 0;
        const pct = Math.round(count / total * 100);
        const isTop = count === maxCount;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: isTop ? 'rgba(196,119,107,0.08)' : 'rgba(139,115,85,0.03)', borderRadius: 14, border: isTop ? '1px solid rgba(196,119,107,0.18)' : '1px solid transparent', animation: `fadeInUp 0.3s ease ${i * 0.1}s both` }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>{opt.emoji}</span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#4A3728', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.text}</span>
            <div style={{ width: 'clamp(50px, 12vw, 90px)', height: 8, borderRadius: 4, background: 'rgba(139,115,85,0.08)', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ width: `${Math.max(3, pct)}%`, height: '100%', background: isTop ? 'linear-gradient(90deg, #C4776B, #D4947E)' : 'rgba(139,115,85,0.25)', borderRadius: 4, transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, minWidth: 36, textAlign: 'right', color: isTop ? '#C4776B' : '#8B7355' }}>{pct}%</span>
          </div>
        );
      })}
      <div style={{ textAlign: 'center', fontSize: 11, color: '#8B7355', opacity: 0.5, marginTop: 4 }}>共 {total} 人参与 · {vote.resultMood}</div>
      {vote.options[maxCount > 0 ? vote.voteCounts.indexOf(maxCount) : 0]?.targetLandmark ? (
        <div style={{ textAlign: 'center', fontSize: 11, color: '#C4776B', marginTop: 6, fontWeight: 500, animation: 'fadeInUp 0.6s ease 0.3s both' }}>
          🕊️ 明天咕咕将从这里出发
        </div>
      ) : null}
    </div>
  );
}

// ── 特殊日期感慨占位 ──
function SpecialHint() {
  return (
    <div style={{ marginTop: 'clamp(18px, 3vh, 32px)', textAlign: 'center', animation: 'fadeInUp 0.5s ease', fontSize: 13, color: '#8B7355', opacity: 0.6 }}>
      📰 鸽子有话要说...
    </div>
  );
}

// ── 投喂网格 ──
function FeedGrid({ items, colors, onFeed }: {
  items: typeof feedItems; colors: Record<string, { bg: string; border: string }>;
  onFeed: (id: FeedItemId, emoji: string, e: React.PointerEvent) => void;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'clamp(10px, 1.5vw, 16px)', marginTop: 'clamp(18px, 3vh, 32px)', padding: '0 clamp(16px, 3vw, 40px)', zIndex: 3 }}>
      {items.map((item) => {
        const c = colors[item.id] || { bg: '#F0E8D8', border: '#E0D0B8' };
        return (
          <button key={item.id} onPointerDown={(e) => onFeed(item.id, item.emoji, e)} style={{
            width: 'clamp(64px, 16vw, 88px)', height: 'clamp(64px, 16vw, 88px)',
            borderRadius: 18, border: `2px solid ${c.border}`, background: c.bg, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
            fontSize: 'clamp(26px, 5vw, 38px)',
            transition: 'transform 0.15s ease, box-shadow 0.2s ease',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            WebkitTapHighlightColor: 'transparent', padding: 0,
          }}>
            <span style={{ lineHeight: 1 }}>{item.emoji}</span>
            <span style={{ fontSize: 'clamp(9px, 1.1vw, 11px)', fontWeight: 600, color: '#6B5A4A', lineHeight: 1 }}>{item.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function Chip({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div style={{ background: 'rgba(255,252,245,0.85)', borderRadius: 16, padding: '7px 16px', fontSize: 'clamp(11px, 0.95vw, 14px)', fontWeight: 600, color: '#6B5A4A', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 2px 8px rgba(100,80,60,0.07)' }}>
      <span style={{ fontSize: 'clamp(15px, 1.4vw, 20px)' }}>{emoji}</span>
      <span>{label}</span>
    </div>
  );
}

function moodEmoji(key: string): string {
  const map: Record<string, string> = {
    stress: '😰', romance: '💕', social: '🗣️', loneliness: '🥺', energy: '⚡', warmth: '☀️', academic: '📖', slack: '🎮',
  };
  return map[key] || '💭';
}
