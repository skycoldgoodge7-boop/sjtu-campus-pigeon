import { create } from 'zustand';
import type {
  CampusMood, FeedItemId, PhotoCard, DriftBottle,
  FeedLogEntry, PigeonActivity, DailyJournal, FlightTrail,
  RememberedCharacter, CampusHotspot,
  DailyVote, BackpackItem, CampusRumor, DailyNewspaper, UserVoteRecord,
} from '../types';
import type { GiftFlags } from '../types';
import { feedItems } from '../data/feedItems';
import { landmarks } from '../data/landmarks';
import {
  LANDMARK_CONFIGS, STAY_TIMES, MAP_POSITIONS, ROAD_PATHS, getDistanceWeight,
} from '../data/mapLayout';
import { generateDailyPhoto, getAvailableLandmarkIds } from '../utils/photoEngine';
import { getTodayDateString, isVoteOpen, isNewspaperTime } from '../utils/time';
import { characters } from '../data/characters';
import type { CharacterInfluence } from '../data/characters';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import {
  fetchOpenMeteoWeather,
  getWeatherMoodEffect, getWeatherActivityModifiers,
  buildWeatherSummary,
  type WeatherData,
} from '../utils/weather';
import {
  enhanceJournalContent, generateDailyVoteQuestion,
  generateDailyTopicContent, enhanceNewspaperContent, generateNewspaperHeadline,
  generatePigeonNoteReply,
  type JournalContext, type VoteGenContext, type TopicGenContext, type NewspaperContext,
} from '../utils/ai';
import { getFallbackQuestion, getFallbackTopic } from '../data/fallbackQuestions';
import { getCollectibleForLandmark, findCollectibleStory, LANDMARK_ID_TO_NAME } from '../data/backpackItems';
import { landmarkPhotos } from '../data/photoGallery';

// ============================================================
// 数据库类型
// ============================================================
interface DbPigeonState {
  id: number;
  current_landmark_id: string;
  pigeon_activity: string;
  stay_until: number;
  last_tick_at: number;
  last_stay_start_time: number;
  mood: CampusMood;
  total_flights: number;
  landmark_stay_durations: Record<string, number>;
  used_photo_urls: string[];
  last_visited: string[];
  version: number;
}

interface DbTodayMeta {
  id: number;
  today_date: string;
  today_feed_count: number;
  today_landmarks_visited: string[];
  today_encounters: string[];
  character_traces: Record<string, number>;
  mood_streaks: Record<string, number>;
  gift_flags: GiftFlags;
  unlocked_footprints?: string[];
  // zhipu_api_key 字段已从数据库删除，不再同步
}

interface DbFeedTotal { item_id: string; count: number; today_count: number; }

interface DbJournal {
  id: string; date: string; content: string; feed_count: number;
  top_feed_item: string; top_feed_count: number;
  special_items: string[]; landmarks_visited: string[];
  most_stayed_landmark: string; night_activity: string | null;
  campus_state: string; has_umbrella: boolean;
  picked_note: string | null;
  pigeon_reply: string | null;
}

interface DbDailyPhoto {
  id: string; photo_url: string | null; caption: string;
  landmark_id: string; landmark_name: string; landmark_emoji: string;
  gradient_start: string; gradient_end: string;
  is_easter_egg: boolean; created_at: number;
}

interface DbMessage {
  id: string; text: string; emoji: string;
  status: string; timestamp: number; picked_by_pigeon: boolean;
}

interface DbCharacter {
  character_id: string; name: string; silhouette: string;
  type: string; stage: number; first_met: number; last_seen: number;
  encounter_count: number; landmark_id: string;
  disappeared: boolean; disappeared_at: number | null;
}

interface DbHotspot {
  id: string; title: string; date: string; summary: string;
  url: string; image_url: string | null;
  category: string; category_emoji: string;
  mood_effect: Partial<CampusMood>; landmark_hint: string | null;
  scraped_at: number; is_active: boolean;
}

interface DbDailyVote {
  id: string; date: string; question: string;
  options: Array<{ emoji: string; text: string; moodEffect: Partial<CampusMood> }>;
  vote_counts: number[]; total_votes: number;
  winning_option: number; result_mood: string;
  result_behavior_modifier: { moveChanceMod: number; activityWeights: Partial<Record<string, number>> };
  generated_at: number;
}

interface DbBackpackItem {
  id: string; name: string; emoji: string;
  landmark_id: string; landmark_name: string;
  collected_at: string; description: string; rarity: string;
  story?: string | null;
}

interface DbCampusRumor {
  id: string; date: string; content: string;
  true_votes: number; false_votes: number; generated_at: number;
}

interface DbDailyNewspaper {
  id: string; date: string;
  headline: string; interaction_count: number;
  location_name: string; location_emoji: string;
  itinerary: string[]; today_topic: string;
  voting_result: DailyNewspaper['votingResult'];
  photo_id: string | null;
  collected_items: Array<{ emoji: string; name: string; description: string; landmarkName: string }>;
  rumor_content: string | null;
  pigeon_thought: string; content: string;
  created_at: number;
}

// ============================================================
// 本地 localStorage 后备
// ============================================================
const LS_KEY = 'sjtu-campus-pigeon';

function loadLocalState(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const state = parsed.state || parsed;
      console.log('[pigeon] loadLocal — feedCount:', (state as any).todayFeedCount, 'totals:', JSON.stringify((state as any).todayFeedTotals), 'date:', (state as any).todayDate);
      return state;
    }
    console.log('[pigeon] loadLocalState — no data in localStorage');
    return {};
  } catch (e) {
    console.error('[pigeon] loadLocalState FAILED:', e);
    return {};
  }
}

function saveLocalState(state: Record<string, unknown>) {
  try {
    const json = JSON.stringify({ state, version: 0 });
    localStorage.setItem(LS_KEY, json);
    console.log('[pigeon] localSave — feedCount:', (state as any).todayFeedCount, 'totals:', JSON.stringify((state as any).todayFeedTotals));
  } catch (e) {
    console.error('[pigeon] localSave FAILED:', e);
    try {
      // 降级：只保存关键字段
      const slim = {
        state: {
          todayFeedCount: (state as any).todayFeedCount,
          todayFeedTotals: (state as any).todayFeedTotals,
          todayDate: (state as any).todayDate,
          feedTotals: (state as any).feedTotals,
        },
        version: 0,
      };
      localStorage.setItem(LS_KEY, JSON.stringify(slim));
      console.log('[pigeon] localSave FALLBACK OK (slim)');
    } catch (e2) {
      console.error('[pigeon] localSave FALLBACK also FAILED:', e2);
    }
  }
}

// Supabase client access
const sb = () => getSupabase();

// 全局同步定时器（模块级，不依赖 React）
let globalSyncTimer: ReturnType<typeof setInterval> | null = null;
function startGlobalSync() {
  if (globalSyncTimer) return; // 防止重复启动
  globalSyncTimer = setInterval(() => {
    const s = usePigeonStore.getState();
    if (!s.cloudReady) return;
    s.syncFeedTotalsFromCloud();
    s.syncDailyVoteFromCloud();
    s.syncRumorFromCloud();
    s.syncNewspaperFromCloud();
  }, 3000); // 改为3秒间隔，减少不必要的轮询
}

// BroadcastChannel 同源跨标签页即时同步
const bc = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('pigeon-sync')
  : null;
if (bc) {
  bc.onmessage = () => {
    const s = usePigeonStore.getState();
    if (s.cloudReady) {
      s.syncFeedTotalsFromCloud();
      s.syncDailyVoteFromCloud();
      s.syncRumorFromCloud();
      s.syncNewspaperFromCloud();
    }
  };
}

// Typed wrapper for upsert/insert (write operations)
const db = {
  upsertState: (data: Record<string, unknown>) => sb()?.from('pigeon_state').upsert(data as never),
  upsertTodayMeta: (data: Record<string, unknown>) => sb()?.from('today_meta').upsert(data as never),
  upsertFeedTotal: (data: Record<string, unknown>) => sb()?.from('feed_totals').upsert(data as never),
  upsertJournal: (data: Record<string, unknown>) => sb()?.from('journals').upsert(data as never),
  upsertPhoto: (data: Record<string, unknown>) => sb()?.from('daily_photos').upsert(data as never),
  upsertMessage: (data: Record<string, unknown>) => sb()?.from('messages').upsert(data as never),
  upsertCharacter: (data: Record<string, unknown>) => sb()?.from('remembered_characters').upsert(data as never),
  insertRecentFeed: (data: Record<string, unknown>) => sb()?.from('recent_feeds').insert(data as never),
  upsertDailyVote: (data: Record<string, unknown>) => sb()?.from('daily_votes').upsert(data as never),
  upsertUserVote: (data: Record<string, unknown>) => sb()?.from('user_votes').upsert(data as never),
  upsertBackpackItem: (data: Record<string, unknown>) => sb()?.from('backpack_items').upsert(data as never),
  upsertRumor: (data: Record<string, unknown>) => sb()?.from('campus_rumors').upsert(data as never),
  upsertNewspaper: (data: Record<string, unknown>) => sb()?.from('daily_newspapers').upsert(data as never),
};

// ============================================================
// 内部同步函数（模块级，非 store 方法）
// ============================================================

function localSave(s: PigeonStoreFull) {
  // 剥离 todayFeedTotals 中的 0 值条目，防止污染 localStorage
  const cleanTodayTotals: Record<string, number> = {};
  for (const [k, v] of Object.entries(s.todayFeedTotals)) {
    if (v > 0) cleanTodayTotals[k] = v;
  }
  // 始终写入 localStorage 作为终极兜底
  saveLocalState({
    currentLandmarkId: s.currentLandmarkId,
    targetLandmarkId: s.targetLandmarkId,
    stayUntil: s.stayUntil,
    feedTotals: s.feedTotals,
    todayFeedTotals: cleanTodayTotals,
    todayFeedCount: s.todayFeedCount,
    todayDate: s.todayDate,
    todayLandmarksVisited: s.todayLandmarksVisited,
    mood: s.mood,
    dailyPhotos: s.dailyPhotos.slice(0, 60),
    messages: s.messages.slice(0, 100),
    recentFeeds: s.recentFeeds.slice(-20),
    lastVisited: s.lastVisited,
    flightTrails: s.flightTrails.slice(0, 3),
    journalEntries: s.journalEntries.slice(0, 30),
    rememberedCharacters: s.rememberedCharacters,
    characterTraces: s.characterTraces,
    moodStreaks: s.moodStreaks,
    landmarkStayDurations: s.landmarkStayDurations,
    todayEncounters: s.todayEncounters,
    lastStayStartTime: s.lastStayStartTime,
    usedPhotoUrls: s.usedPhotoUrls.slice(-200),
    totalFlights: s.totalFlights,
    weatherData: s.weatherData,
    lastWeatherFetch: s.lastWeatherFetch,
    zhipuApiKey: s.zhipuApiKey,
    dailyVote: s.dailyVote,
    backpackItems: s.backpackItems.slice(0, 100),
    campusRumor: s.campusRumor,
    dailyNewspaper: s.dailyNewspaper,
    pastNewspapers: s.pastNewspapers.slice(0, 60),
    giftFlags: s.giftFlags,
    unlockedFootprints: s.unlockedFootprints,
    voteRitualDone: s.voteRitualDone,
  });
}

async function cloudSyncState(s: PigeonStoreFull) {
  if (!isSupabaseConfigured()) return;
  try {
    await db.upsertState({
      id: 1,
      current_landmark_id: s.currentLandmarkId,
      pigeon_activity: s.pigeonActivity,
      stay_until: s.stayUntil,
      last_tick_at: s.lastActivityTimestamp,
      last_stay_start_time: s.lastStayStartTime,
      mood: s.mood,
      total_flights: s.totalFlights,
      landmark_stay_durations: s.landmarkStayDurations,
      used_photo_urls: s.usedPhotoUrls,
      last_visited: s.lastVisited,
      version: 0,
    });
  } catch { /* silent */ }
}

async function cloudSyncTodayMeta(s: PigeonStoreFull) {
  if (!isSupabaseConfigured()) return;
  try {
    await db.upsertTodayMeta({
      id: 1,
      today_date: s.todayDate,
      today_feed_count: s.todayFeedCount,
      today_landmarks_visited: s.todayLandmarksVisited,
      today_encounters: s.todayEncounters,
      character_traces: s.characterTraces,
      mood_streaks: s.moodStreaks,
      gift_flags: s.giftFlags,
      unlocked_footprints: s.unlockedFootprints,
      // zhipu_api_key 故意不上传 — 仅本地存储，不共享到云端
    });
  } catch { /* silent */ }
}

async function cloudSyncFeedTotal(itemId: string, feedTotals: Record<string, number>, todayFeedTotals: Record<string, number>) {
  if (!isSupabaseConfigured()) return;
  try {
    await db.upsertFeedTotal({
      item_id: itemId, count: feedTotals[itemId] || 0, today_count: todayFeedTotals[itemId] || 0,
    });
  } catch { /* silent */ }
}

async function cloudSyncJournal(journal: DailyJournal) {
  if (!isSupabaseConfigured()) return;
  try {
    await db.upsertJournal({
      id: journal.id, date: journal.date, content: journal.content,
      feed_count: journal.feedCount, top_feed_item: journal.topFeedItem,
      top_feed_count: journal.topFeedCount, special_items: journal.specialItems,
      landmarks_visited: journal.landmarksVisited,
      most_stayed_landmark: journal.mostStayedLandmark,
      night_activity: journal.nightActivity, campus_state: journal.campusState,
      has_umbrella: journal.hasUmbrella,
      picked_note: journal.pickedNote || null,
      pigeon_reply: journal.pigeonReply || null,
    });
  } catch {
    // 如果 pigeon_reply 或 picked_note 列不存在（旧数据库），重试不带这些列
    try {
      await db.upsertJournal({
        id: journal.id, date: journal.date, content: journal.content,
        feed_count: journal.feedCount, top_feed_item: journal.topFeedItem,
        top_feed_count: journal.topFeedCount, special_items: journal.specialItems,
        landmarks_visited: journal.landmarksVisited,
        most_stayed_landmark: journal.mostStayedLandmark,
        night_activity: journal.nightActivity, campus_state: journal.campusState,
        has_umbrella: journal.hasUmbrella,
        picked_note: journal.pickedNote || null,
      });
    } catch { /* silent */ }
  }
}

async function cloudSyncPhoto(photo: PhotoCard) {
  if (!isSupabaseConfigured()) return;
  try {
    await db.upsertPhoto({
      id: photo.id, photo_url: photo.photoUrl || null, caption: photo.caption,
      landmark_id: photo.landmarkId, landmark_name: photo.landmarkName,
      landmark_emoji: photo.landmarkEmoji,
      gradient_start: photo.gradient[0], gradient_end: photo.gradient[1],
      is_easter_egg: photo.isEasterEgg || false, created_at: photo.timestamp,
    });
  } catch { /* silent */ }
}

async function cloudSyncMessage(msg: DriftBottle) {
  if (!isSupabaseConfigured()) return;
  try {
    await db.upsertMessage({
      id: msg.id, text: msg.text, emoji: msg.emoji,
      status: msg.status, timestamp: msg.timestamp, picked_by_pigeon: msg.pickedByPigeon,
    });
  } catch { /* silent */ }
}

async function cloudSyncCharacter(rc: RememberedCharacter) {
  if (!isSupabaseConfigured()) return;
  try {
    await db.upsertCharacter({
      character_id: rc.characterId, name: rc.name, silhouette: rc.silhouette,
      type: rc.type, stage: rc.stage, first_met: rc.firstMet, last_seen: rc.lastSeen,
      encounter_count: rc.encounterCount, landmark_id: rc.landmarkId,
      disappeared: rc.disappeared || false, disappeared_at: rc.disappearedAt || null,
    });
  } catch { /* silent */ }
}

async function cloudSyncRecentFeed(entry: FeedLogEntry) {
  if (!isSupabaseConfigured()) return;
  try {
    await db.insertRecentFeed({
      item_id: entry.itemId, item_emoji: entry.itemEmoji,
      item_name: entry.itemName, timestamp: entry.timestamp,
    });
    // Cleanup: delete feeds older than 100
    await sb()!.rpc('cleanup_old_feeds');
  } catch { /* silent */ }
}

async function cloudSyncDailyVote(vote: DailyVote) {
  if (!isSupabaseConfigured()) return;
  try {
    await db.upsertDailyVote({
      id: vote.id, date: vote.date, question: vote.question,
      options: vote.options, vote_counts: vote.voteCounts,
      total_votes: vote.totalVotes, winning_option: vote.winningOption,
      result_mood: vote.resultMood,
      result_behavior_modifier: vote.resultBehaviorModifier,
      generated_at: vote.generatedAt,
    });
  } catch { /* silent */ }
}

async function cloudSyncUserVote(userId: string, date: string, voteIndex: number, rumorVote: string | null) {
  if (!isSupabaseConfigured()) return;
  try {
    await db.upsertUserVote({
      id: `${userId}-${date}`,
      user_id: userId, date, vote_index: voteIndex,
      rumor_vote: rumorVote, voted_at: Date.now(),
    });
  } catch { /* silent */ }
}

async function cloudSyncBackpackItem(item: BackpackItem) {
  if (!isSupabaseConfigured()) return;
  try {
    await db.upsertBackpackItem({
      id: item.id, name: item.name, emoji: item.emoji,
      landmark_id: item.landmarkId, landmark_name: item.landmarkName,
      collected_at: item.collectedAt, description: item.description,
      rarity: item.rarity, story: item.story,
    });
  } catch { /* silent */ }
}

async function cloudSyncRumor(rumor: CampusRumor) {
  if (!isSupabaseConfigured()) return;
  try {
    await db.upsertRumor({
      id: rumor.id, date: rumor.date, content: rumor.content,
      true_votes: rumor.trueVotes, false_votes: rumor.falseVotes,
      generated_at: rumor.generatedAt,
    });
  } catch { /* silent */ }
}

async function cloudSyncNewspaper(np: DailyNewspaper) {
  if (!isSupabaseConfigured()) return;
  try {
    await db.upsertNewspaper({
      id: np.id, date: np.date,
      headline: np.headline, interaction_count: np.interactionCount,
      location_name: np.locationName, location_emoji: np.locationEmoji,
      itinerary: np.itinerary, today_topic: np.todayTopic,
      voting_result: np.votingResult, photo_id: np.photoId,
      collected_items: np.collectedItems,
      rumor_content: np.rumorContent,
      pigeon_thought: np.pigeonThought, content: np.content,
      created_at: Date.now(),
    });
  } catch { /* silent */ }
}

// ====== 匿名用户ID ======
const USER_ID_KEY = 'pigeon-user-id';
function getUserId(): string {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

// ====== 用户投票记录 (localStorage) ======
const USER_VOTE_KEY = 'pigeon-user-vote';
function loadUserVoteRecord(): UserVoteRecord | null {
  try {
    const raw = localStorage.getItem(USER_VOTE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const today = getTodayDateString();
    if (parsed.date !== today) return null; // stale
    // 向后兼容：旧 rumorVote 迁移到 topicVote
    if (parsed.rumorVote && !parsed.topicVote) {
      parsed.topicVote = parsed.rumorVote === 'true' ? 'agree' : parsed.rumorVote === 'false' ? 'disagree' : null;
    }
    return parsed as UserVoteRecord;
  } catch { return null; }
}
function saveUserVoteRecord(record: UserVoteRecord) {
  try { localStorage.setItem(USER_VOTE_KEY, JSON.stringify(record)); } catch { /* ok */ }
}

// ============================================================
// Store 接口
// ============================================================
type PigeonStoreFull = ReturnType<typeof usePigeonStore.getState>;

interface PigeonState {
  cloudReady: boolean;
  cloudError: boolean;

  currentLandmarkId: string;
  targetLandmarkId: string | null;  // 飞行目的地（与当前位置分离，防止地图穿帮）
  pigeonActivity: PigeonActivity;
  lastActivityTimestamp: number;
  stayUntil: number;
  currentPath: number[] | null;

  recentStatusText: string | null;
  statusTextExpiresAt: number;

  feedTotals: Record<string, number>;
  todayFeedTotals: Record<string, number>;
  todayFeedCount: number;
  todayDate: string;
  todayLandmarksVisited: string[];

  mood: CampusMood;

  photos: PhotoCard[];
  dailyPhotos: PhotoCard[];
  messages: DriftBottle[];
  recentFeeds: FeedLogEntry[];
  lastVisited: string[];
  flightTrails: FlightTrail[];
  journalEntries: DailyJournal[];
  rememberedCharacters: RememberedCharacter[];
  todayEncounters: string[];
  characterTraces: Record<string, number>;
  moodStreaks: Record<string, number>;
  landmarkStayDurations: Record<string, number>;
  lastStayStartTime: number;
  usedPhotoUrls: string[];
  totalFlights: number;
  hotspots: CampusHotspot[];
  weatherData: WeatherData | null;
  lastWeatherFetch: number;
  zhipuApiKey: string;

  // ── 新：每日投票 / 传闻 / 日报 / 背包 ──
  dailyVote: DailyVote | null;
  backpackItems: BackpackItem[];
  campusRumor: CampusRumor | null;
  dailyNewspaper: DailyNewspaper | null;
  pastNewspapers: DailyNewspaper[];
  userVoteRecord: UserVoteRecord | null;
  userId: string;
  lastBottleReply: { noteText: string; reply: string } | null;
  giftFlags: GiftFlags;

  // P2: 投票仪式
  voteRitualDone: boolean;
  voteRitualLabel: string;

  initFromCloud: () => Promise<void>;
  feedPigeon: (itemId: FeedItemId) => void;
  tickPigeonAI: () => void;
  postMessage: (emoji: string, text: string) => void;
  retrieveBottle: () => DriftBottle | null;
  decayMood: () => void;
  sinkOldBottles: () => void;
  resetTodayIfNeeded: () => void;
  generateDailyJournal: (forceDate?: string) => void;
  setStatusText: (text: string, durationMs?: number) => void;
  rememberCharacter: (characterId: string, landmarkId: string) => void;
  recordTrace: (characterId: string) => void;
  updateMoodStreaks: () => void;
  getActiveInfluences: () => CharacterInfluence[];
  checkDisappearances: () => void;
  syncHotspotsFromCloud: () => Promise<void>;
  fetchWeatherIfNeeded: () => Promise<void>;
  setApiKey: (key: string) => void;

  // ── 新：投票 / 传闻 / 日报 / 背包 ──
  castVote: (optionIndex: number) => Promise<void>;
  castRumorVote: (vote: 'true' | 'false') => Promise<void>;
  syncDailyVoteFromCloud: () => Promise<void>;
  syncRumorFromCloud: () => Promise<void>;
  syncBackpackFromCloud: () => Promise<void>;
  syncNewspaperFromCloud: () => Promise<void>;
  syncFeedTotalsFromCloud: () => Promise<void>;
  generateDailyVote: () => Promise<void>;
  generateDailyRumor: () => Promise<void>;
  generateDailyNewspaper: () => Promise<void>;
  collectBackpackItem: (landmarkId: string) => void;
  getPastNewspapers: () => DailyNewspaper[];
  unlockedFootprints: string[];
  unlockFootprintPhoto: (landmarkId: string) => void;
}

const DEFAULT_MOOD: CampusMood = {
  stress: 50, romance: 50, social: 50, loneliness: 50,
  energy: 50, warmth: 50, academic: 50, slack: 50,
};

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

// 对立情绪维度互斥耦合：当两个矛盾维度都高于50时，较弱的一方被拉回
const OPPOSING_PAIRS: [keyof CampusMood, keyof CampusMood, number][] = [
  ['social', 'loneliness', 0.6],
  ['academic', 'slack', 0.6],
  ['stress', 'warmth', 0.3],
  ['energy', 'slack', 0.2],
  ['romance', 'loneliness', 0.2],
];

function normalizeMood(mood: CampusMood): CampusMood {
  const normalized = { ...mood };
  for (const [dimA, dimB, ratio] of OPPOSING_PAIRS) {
    const a = normalized[dimA];
    const b = normalized[dimB];
    if (a > 50 && b > 50) {
      const excess = Math.min(a - 50, b - 50);
      const offset = Math.round(excess * ratio);
      if (a > b) {
        normalized[dimB] = clamp(b - offset);
      } else {
        normalized[dimA] = clamp(a - offset);
      }
    }
  }
  return normalized;
}

export function getActivityLabel(activity: PigeonActivity, landmarkName?: string, targetName?: string): string {
  const map: Record<PigeonActivity, string> = {
    idle: '正在发呆',
    walking: targetName ? `正在飞往${targetName}` : landmarkName ? `正在飞往${landmarkName}` : '正在赶路',
    eating: '正在吃点东西',
    sleeping: '正在睡觉',
    dancing: '兴奋地跳来跳去',
    thinking: '望着远方出神',
    preening: '正在整理羽毛',
    cooing: '咕咕地叫着',
    observing: '正在看路过的人',
    perching: '停在窗边休息',
    circling: '在低空盘旋',
    hopping: '一跳一跳地走着',
    approaching: '被人吸引，慢慢靠近',
    sheltering: '在屋檐下躲雨',
  };
  return map[activity] || '正在发呆';
}

export const usePigeonStore = create<PigeonState>()((set, get) => ({
  cloudReady: false,
  cloudError: false,

  currentLandmarkId: 'siyuan-lake',
  targetLandmarkId: null,
  pigeonActivity: 'idle',
  lastActivityTimestamp: Date.now(),
  stayUntil: Date.now() + 120000,
  currentPath: null,

  recentStatusText: null,
  statusTextExpiresAt: 0,

  feedTotals: {},
  todayFeedTotals: {},
  todayFeedCount: 0,
  todayDate: getTodayDateString(),
  todayLandmarksVisited: [],

  mood: { ...DEFAULT_MOOD },
  photos: [],
  dailyPhotos: [],
  messages: [],
  recentFeeds: [],
  lastVisited: [],
  flightTrails: [],
  journalEntries: [],
  rememberedCharacters: [],
  todayEncounters: [],
  characterTraces: {},
  moodStreaks: {},
  landmarkStayDurations: {},
  lastStayStartTime: Date.now(),
  usedPhotoUrls: [],
  totalFlights: 0,
  hotspots: [],
  weatherData: null,
  lastWeatherFetch: 0,
  zhipuApiKey: '',

  dailyVote: null,
  backpackItems: [],
  campusRumor: null,
  dailyNewspaper: null,
  pastNewspapers: [],
  unlockedFootprints: (() => { try { const r = localStorage.getItem('pigeon-footprints'); return r ? JSON.parse(r) : []; } catch { return []; } })(),
  userVoteRecord: loadUserVoteRecord(),
  userId: typeof window !== 'undefined' ? getUserId() : '',
  lastBottleReply: null,
  giftFlags: { hasUmbrella: false, hasCamera: false, hasHeadphone: false, hasScarf: false, hasFlower: false },

  voteRitualDone: false,
  voteRitualLabel: '',

  // ============ 从云端初始化 ============
  initFromCloud: async () => {
    // 始终先加载 localStorage 作为基础数据（不设 cloudReady，等 Supabase 完成）
    const local = loadLocalState();
    if (Object.keys(local).length > 0) {
      // 清理污染：移除 todayFeedTotals 中值为 0 的项（Supabase 全 0 行污染）
      const rawTotals = (local as any).todayFeedTotals;
      if (rawTotals && typeof rawTotals === 'object') {
        const cleaned: Record<string, number> = {};
        for (const [k, v] of Object.entries(rawTotals)) {
          if (typeof v === 'number' && v > 0) cleaned[k] = v;
        }
        (local as any).todayFeedTotals = cleaned;
      }
      set((s) => ({ ...s, ...local }));
      const merged = get();
      console.log('[pigeon] initFromCloud STEP1 localStorage merged — todayFeedCount:', merged.todayFeedCount, 'todayFeedTotals:', JSON.stringify(merged.todayFeedTotals), 'todayDate:', merged.todayDate);
    }

    // 如果 Supabase 未配置，直接用 localStorage 数据
    if (!isSupabaseConfigured()) {
      set({ cloudReady: true });
      startGlobalSync();
      return;
    }

    // CORS 检测：file:// 协议下 Supabase 请求全被拦截，云端同步无效
    if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
      console.warn('[pigeon] ⚠️ 检测到 file:// 协议打开 — Supabase 同步被 CORS 阻塞，数据仅保存在本地。请用 HTTP 服务器启动：npx serve dist');
      set({ cloudReady: true, cloudError: true });
      startGlobalSync();
      return;
    }

    // 尝试从 Supabase 加载云端数据，覆盖到已有 localStorage 上
    // 8秒超时：网络慢或不可达时回退到本地数据
    try {
      const [ps, tm, feedData, journalData, photoData, msgData, charData] = await Promise.race([
        Promise.all([
        sb()!.from('pigeon_state').select('*').eq('id', 1).single().then(
          (r: { data: DbPigeonState | null }) => r.data, () => null),
        sb()!.from('today_meta').select('*').eq('id', 1).single().then(
          (r: { data: DbTodayMeta | null }) => r.data, () => null),
        sb()!.from('feed_totals').select('*').then(
          (r: { data: DbFeedTotal[] | null }) => (r.data || []) as DbFeedTotal[]),
        sb()!.from('journals').select('*').order('date', { ascending: false }).then(
          (r: { data: DbJournal[] | null }) => (r.data || []) as DbJournal[]),
        sb()!.from('daily_photos').select('*').order('created_at', { ascending: false }).then(
          (r: { data: DbDailyPhoto[] | null }) => (r.data || []) as DbDailyPhoto[]),
        sb()!.from('messages').select('*').order('timestamp', { ascending: false }).then(
          (r: { data: DbMessage[] | null }) => (r.data || []) as DbMessage[]),
        sb()!.from('remembered_characters').select('*').then(
          (r: { data: DbCharacter[] | null }) => (r.data || []) as DbCharacter[]),
      ]),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
    ]);

      if (ps) {
        const cur = get();
        set({
          currentLandmarkId: ps.current_landmark_id || cur.currentLandmarkId || 'siyuan-lake',
          pigeonActivity: ps.pigeon_activity as PigeonActivity || 'idle',
          stayUntil: ps.stay_until || cur.stayUntil || Date.now() + 120000,
          lastStayStartTime: ps.last_stay_start_time || cur.lastStayStartTime || Date.now(),
          lastActivityTimestamp: ps.last_tick_at || cur.lastActivityTimestamp || Date.now(),
          mood: ps.mood || cur.mood || { ...DEFAULT_MOOD },
          totalFlights: Math.max(ps.total_flights || 0, cur.totalFlights || 0),
          landmarkStayDurations: ps.landmark_stay_durations || cur.landmarkStayDurations || {},
          usedPhotoUrls: (ps.used_photo_urls || []).length > (cur.usedPhotoUrls || []).length ? ps.used_photo_urls : (cur.usedPhotoUrls || []),
          lastVisited: (ps.last_visited || []).length > (cur.lastVisited || []).length ? ps.last_visited : (cur.lastVisited || []),
        });
      }

      if (feedData.length) {
        const cur = get();
        const totals = { ...cur.feedTotals };
        const todayTotals = { ...cur.todayFeedTotals };
        for (const f of feedData) {
          totals[f.item_id] = Math.max(totals[f.item_id] || 0, f.count);
          // 只合并云端有值的项（>0），避免用 0 污染本地
          if (f.today_count > 0) {
            todayTotals[f.item_id] = Math.max(todayTotals[f.item_id] || 0, f.today_count);
          }
        }
        set({ feedTotals: totals, todayFeedTotals: todayTotals });
        console.log('[pigeon] initFromCloud STEP2 feed_totals merged — todayFeedTotals:', JSON.stringify(todayTotals));
      }

      const cur = get();

      // 日记合并：Supabase + localStorage 去重合并
      if (journalData.length) {
        const existingIds = new Set(cur.journalEntries.map((j: DailyJournal) => j.id));
        const supabaseJournals = journalData.slice(0, 30).map((j: DbJournal) => ({
          id: j.id, date: j.date, content: j.content, feedCount: j.feed_count,
          topFeedItem: j.top_feed_item, topFeedCount: j.top_feed_count,
          specialItems: j.special_items, landmarksVisited: j.landmarks_visited,
          mostStayedLandmark: j.most_stayed_landmark,
          nightActivity: j.night_activity, campusState: j.campus_state as DailyJournal['campusState'],
          hasUmbrella: j.has_umbrella,
          pickedNote: j.picked_note ?? undefined,
          pigeonReply: j.pigeon_reply ?? undefined,
        }));
        const merged = [...cur.journalEntries];
        for (const sj of supabaseJournals) {
          if (!existingIds.has(sj.id)) merged.push(sj);
        }
        merged.sort((a, b) => b.date.localeCompare(a.date));
        set({ journalEntries: merged.slice(0, 30) });
      }

      // 照片合并
      if (photoData.length) {
        const existingIds = new Set(cur.dailyPhotos.map((p: PhotoCard) => p.id));
        const supabasePhotos = photoData.slice(0, 60).map((p: DbDailyPhoto) => ({
          id: p.id, timestamp: p.created_at, landmarkId: p.landmark_id,
          landmarkName: p.landmark_name, landmarkEmoji: p.landmark_emoji,
          timeOfDay: 'afternoon' as const, campusState: 'normal' as const,
          dominantMood: 'default', moodValue: 50, sceneEmojis: [],
          caption: p.caption, gradient: [p.gradient_start, p.gradient_end] as [string, string],
          photoUrl: p.photo_url ?? undefined, isEasterEgg: p.is_easter_egg,
        }));
        const mergedPhotos = [...cur.dailyPhotos];
        for (const sp of supabasePhotos) {
          if (!existingIds.has(sp.id)) mergedPhotos.push(sp);
        }
        mergedPhotos.sort((a, b) => b.timestamp - a.timestamp);
        set({ dailyPhotos: mergedPhotos.slice(0, 60) });
      }

      // 消息合并
      if (msgData.length) {
        const existingMsgIds = new Set(cur.messages.map((m: DriftBottle) => m.id));
        const supabaseMsgs = msgData.slice(0, 100).map((m: DbMessage) => ({
          id: m.id, text: m.text, emoji: m.emoji,
          status: m.status as DriftBottle['status'],
          timestamp: m.timestamp, pickedByPigeon: m.picked_by_pigeon,
        }));
        const mergedMsgs = [...cur.messages];
        for (const sm of supabaseMsgs) {
          if (!existingMsgIds.has(sm.id)) mergedMsgs.push(sm);
        }
        mergedMsgs.sort((a, b) => b.timestamp - a.timestamp);
        set({ messages: mergedMsgs.slice(0, 100) });
      }

      // P1: 漂流纸条冷启动 —— 如果没有任何消息，注入种子纸条
      if (get().messages.length === 0) {
        const now = Date.now();
        const SEED_MESSAGES: DriftBottle[] = [
          { id: 'seed-1', timestamp: now - 86400000 * 7, emoji: '🕊️', text: '今天在图书馆窗台上看到了一只蜻蜓，它比我还会发呆。', status: 'floating', pickedByPigeon: false },
          { id: 'seed-2', timestamp: now - 86400000 * 6, emoji: '🕊️', text: '思源湖的水面今天特别平静，像一面镜子。我在里面看到了一只很帅的鸽子。', status: 'floating', pickedByPigeon: false },
          { id: 'seed-3', timestamp: now - 86400000 * 5, emoji: '🕊️', text: '有人把半块面包落在了长椅上。我帮他解决了这个问题。', status: 'floating', pickedByPigeon: false },
          { id: 'seed-4', timestamp: now - 86400000 * 4, emoji: '🕊️', text: '今晚的夕阳是橘子味的。不要问我怎么知道的，我就是知道。', status: 'floating', pickedByPigeon: false },
          { id: 'seed-5', timestamp: now - 86400000 * 3, emoji: '🕊️', text: '植物园里新开了一种花，白色的，很小。我问了蜜蜂，它也不知道叫什么。', status: 'floating', pickedByPigeon: false },
          { id: 'seed-6', timestamp: now - 86400000 * 2, emoji: '🕊️', text: '考试周的人类看起来和平时不太一样。走路更快，笑容更少。希望他们都能考好。', status: 'floating', pickedByPigeon: false },
          { id: 'seed-7', timestamp: now - 86400000, emoji: '🕊️', text: '今天降温了。如果你也觉得很冷，记得加衣服——来自一只自带羽绒服的鸽子。', status: 'floating', pickedByPigeon: false },
        ];
        set({ messages: SEED_MESSAGES });
      }

      // 角色合并
      if (charData.length) {
        const existingCharIds = new Set(cur.rememberedCharacters.map((c: RememberedCharacter) => c.characterId));
        const supabaseChars = charData.map((c: DbCharacter) => ({
          characterId: c.character_id, name: c.name, silhouette: c.silhouette,
          type: c.type as 'animal' | 'person' | 'presence',
          stage: c.stage, firstMet: c.first_met, lastSeen: c.last_seen,
          encounterCount: c.encounter_count, landmarkId: c.landmark_id,
          disappeared: c.disappeared, disappearedAt: c.disappeared_at ?? undefined,
        }));
        const mergedChars = [...cur.rememberedCharacters];
        for (const sc of supabaseChars) {
          if (!existingCharIds.has(sc.characterId)) {
            mergedChars.push(sc);
          } else {
            // 对已有角色取最新 stage 和 encounterCount
            mergedChars.forEach((c, i) => {
              if (c.characterId === sc.characterId) {
                mergedChars[i] = { ...c, stage: Math.max(c.stage, sc.stage), encounterCount: Math.max(c.encounterCount, sc.encounterCount) };
              }
            });
          }
        }
        set({ rememberedCharacters: mergedChars });
      }

      if (tm) {
        // 云端 today_date 合并策略：永远不把日期往回调
        const cloudDate = tm.today_date || getTodayDateString();
        const today = getTodayDateString();
        const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); })();

        // 辅助：合并足迹（取并集）和 API key（取任意非空值）
        const mergedFootprints = [...new Set([
          ...cur.unlockedFootprints,
          ...(tm.unlocked_footprints || []),
        ])];
        // zhipuApiKey 仅本地保留，不从云端合并

        if (cloudDate === today) {
          const hasYesterdayJournal =
            cur.journalEntries.some((j: DailyJournal) => j.date === yesterday) ||
            journalData.some((j: DbJournal) => j.date === yesterday);
          if (!hasYesterdayJournal && cur.todayDate !== today) {
            set({
              characterTraces: { ...cur.characterTraces, ...(tm.character_traces || {}) },
              moodStreaks: { ...cur.moodStreaks, ...(tm.mood_streaks || {}) },
              unlockedFootprints: mergedFootprints,
            });
          } else {
            set({
              todayDate: today,
              todayFeedCount: Math.max(cur.todayFeedCount, tm.today_feed_count || 0),
              todayLandmarksVisited: tm.today_landmarks_visited || [],
              todayEncounters: tm.today_encounters || [],
              characterTraces: tm.character_traces || {},
              moodStreaks: tm.mood_streaks || {},
              unlockedFootprints: mergedFootprints,
            });
          }
        } else if (cloudDate === yesterday && cur.todayDate === today) {
          set({
            characterTraces: { ...cur.characterTraces, ...(tm.character_traces || {}) },
            moodStreaks: { ...cur.moodStreaks, ...(tm.mood_streaks || {}) },
            unlockedFootprints: mergedFootprints,
          });
        } else {
          set({
            todayDate: today,
            todayFeedCount: Math.max(cur.todayFeedCount, tm.today_feed_count || 0),
            todayLandmarksVisited: cur.todayLandmarksVisited,
            todayEncounters: cur.todayEncounters,
            characterTraces: tm.character_traces || {},
            moodStreaks: tm.mood_streaks || {},
            unlockedFootprints: mergedFootprints,
          });
        }
      }

      // 在标记 cloudReady 之前，先同步投票/传闻/背包/日报（防止 generateDailyRumor 等覆盖云端已有数据）
      await get().syncDailyVoteFromCloud();
      await get().syncRumorFromCloud();
      await get().syncBackpackFromCloud();
      await get().syncNewspaperFromCloud();
      await get().syncFeedTotalsFromCloud();
      console.log('[pigeon] initFromCloud STEP3 after cloud sync — todayFeedCount:', get().todayFeedCount, 'todayFeedTotals:', JSON.stringify(get().todayFeedTotals), 'todayDate:', get().todayDate);

      // 从云端恢复用户投票记录（跨设备同步）
      const uid = get().userId;
      const today = getTodayDateString();
      try {
        const { data: userVoteData } = await sb()!.from('user_votes')
          .select('*')
          .eq('user_id', uid)
          .eq('date', today)
          .single();
        if (userVoteData) {
          const uv = userVoteData as { vote_index: number; rumor_vote: string | null };
          const cloudRecord: UserVoteRecord = {
            date: today,
            voteIndex: uv.vote_index,
            rumorVote: (uv.rumor_vote as 'true' | 'false' | null) || null,
            topicVote: uv.rumor_vote === 'true' ? 'agree' : uv.rumor_vote === 'false' ? 'disagree' : null,
          };
          set({ userVoteRecord: cloudRecord });
          saveUserVoteRecord(cloudRecord);
        }
      } catch { /* no cloud record yet or error */ }

      // 回填：对缺少 story 的背包物品从预设数据补上
      const items = get().backpackItems;
      const patched: BackpackItem[] = [];
      for (const item of items) {
        if (!item.story) {
          const presetStory = findCollectibleStory(item.landmarkId, item.name);
          if (presetStory) { patched.push({ ...item, story: presetStory }); continue; }
        }
        patched.push(item);
      }
      if (patched.some((p, i) => p.story !== items[i]?.story)) {
        set({ backpackItems: patched });
        localSave(get());
        for (const item of patched) {
          if (item.story) setTimeout(() => cloudSyncBackpackItem(item), 100);
        }
      }

      set({ cloudReady: true });
      startGlobalSync();
      // 订阅所有表的实时更新
      const channel = sb()!.channel('pigeon-realtime');

      // pigeon_state 更新 → 鸽子位置/情绪同步
      channel.on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pigeon_state', filter: 'id=eq.1' },
        (payload: { new: DbPigeonState }) => {
          const ps = payload.new;
          if (ps) {
            const cur = get();
            set({
              currentLandmarkId: ps.current_landmark_id || cur.currentLandmarkId,
              pigeonActivity: (ps.pigeon_activity as PigeonActivity) || cur.pigeonActivity,
              stayUntil: Math.max(ps.stay_until || 0, cur.stayUntil || 0),
              mood: ps.mood || cur.mood,
              totalFlights: Math.max(ps.total_flights || 0, cur.totalFlights),
              landmarkStayDurations: ps.landmark_stay_durations || cur.landmarkStayDurations,
              usedPhotoUrls: ps.used_photo_urls || cur.usedPhotoUrls,
              lastVisited: ps.last_visited || cur.lastVisited,
              lastActivityTimestamp: ps.last_tick_at || get().lastActivityTimestamp,
              lastStayStartTime: ps.last_stay_start_time || get().lastStayStartTime,
            });
          }
        }
      );

      // today_meta → 投喂计数等多端同步
      const handleTodayMeta = (payload: { new: DbTodayMeta }) => {
        const tm = payload.new;
        if (tm) {
          const today = getTodayDateString();
          if (tm.today_date !== today) return;
          const cur = get();
          set({
            todayDate: tm.today_date || cur.todayDate,
            todayFeedCount: Math.max(tm.today_feed_count ?? 0, cur.todayFeedCount),
            todayLandmarksVisited: tm.today_landmarks_visited || cur.todayLandmarksVisited,
            todayEncounters: tm.today_encounters || cur.todayEncounters,
            characterTraces: tm.character_traces || cur.characterTraces,
            moodStreaks: tm.mood_streaks || cur.moodStreaks,
            // 足迹取并集（多设备各自解锁的不同照片合并）
            unlockedFootprints: [...new Set([...cur.unlockedFootprints, ...(tm.unlocked_footprints || [])])],
            // zhipuApiKey 仅本地保留，不从云端实时同步
          });
          setTimeout(() => get().syncFeedTotalsFromCloud(), 100);
        }
      };
      channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'today_meta', filter: 'id=eq.1' }, handleTodayMeta);
      channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'today_meta', filter: 'id=eq.1' }, handleTodayMeta);

      // feed_totals → 投喂统计多端同步
      const handleFeedTotals = (payload: { new: DbFeedTotal }) => {
        const ft = payload.new;
        if (ft) {
          set((s) => {
            const feedTotals = { ...s.feedTotals };
            feedTotals[ft.item_id] = Math.max(feedTotals[ft.item_id] || 0, ft.count);
            const todayFeedTotals = { ...s.todayFeedTotals };
            todayFeedTotals[ft.item_id] = Math.max(todayFeedTotals[ft.item_id] || 0, ft.today_count);
            return { feedTotals, todayFeedTotals };
          });
        }
      };
      channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'feed_totals' }, handleFeedTotals);
      channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_totals' }, handleFeedTotals);

      // messages 更新（INSERT/UPDATE）→ 漂流瓶实时同步
      channel.on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload: { new: DbMessage }) => {
          const m = payload.new;
          if (m) {
            set((s) => ({
              messages: [{
                id: m.id, text: m.text, emoji: m.emoji,
                status: m.status as DriftBottle['status'],
                timestamp: m.timestamp, pickedByPigeon: m.picked_by_pigeon,
              }, ...s.messages].slice(0, 100),
            }));
          }
        }
      );
      channel.on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload: { new: DbMessage }) => {
          const m = payload.new;
          if (m) {
            set((s) => ({
              messages: s.messages.map((msg) =>
                msg.id === m.id
                  ? { ...msg, status: m.status as DriftBottle['status'], pickedByPigeon: m.picked_by_pigeon }
                  : msg
              ),
            }));
          }
        }
      );

      // 每日投票实时更新（多端同步）
      const handleDailyVote = (payload: { new: DbDailyVote | null }) => {
        const dv = payload.new;
        if (!dv) return;
        const cur = get();
        if (dv.date === getTodayDateString()) {
          set({
            dailyVote: {
              id: dv.id, date: dv.date, question: dv.question,
              options: dv.options, totalVotes: dv.total_votes,
              voteCounts: dv.vote_counts, winningOption: dv.winning_option,
              resultMood: dv.result_mood,
              resultBehaviorModifier: dv.result_behavior_modifier,
              generatedAt: dv.generated_at,
            },
          });
          if (dv.total_votes > (cur.dailyVote?.totalVotes ?? 0)) {
            localSave(get());
          }
        }
      };
      // @ts-expect-error supabase-js types don't fully cover RealtimeChannel.on
      channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'daily_votes' }, handleDailyVote);
      // @ts-expect-error supabase-js types don't fully cover RealtimeChannel.on
      channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'daily_votes' }, handleDailyVote);

      // 校园传闻实时更新（多端投票同步）
      const handleRumorUpdate = (payload: { new: DbCampusRumor | null }) => {
        const cr = payload.new;
        if (!cr) return;
        if (cr.date === getTodayDateString()) {
          const cur = get();
          set({
            campusRumor: {
              id: cr.id, date: cr.date, content: cr.content,
              trueVotes: cr.true_votes, falseVotes: cr.false_votes,
              generatedAt: cr.generated_at,
            },
          });
          if (cr.true_votes + cr.false_votes > (cur.campusRumor?.trueVotes ?? 0) + (cur.campusRumor?.falseVotes ?? 0)) {
            localSave(get());
          }
        }
      };
      // @ts-expect-error supabase-js types
      channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'campus_rumors' }, handleRumorUpdate);
      // @ts-expect-error supabase-js types
      channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'campus_rumors' }, handleRumorUpdate);

      channel.subscribe();

      // 加载校园热点
      get().syncHotspotsFromCloud();

      // 补生成缺失的昨日记录（新安装 / 昨天未打开 / 跨设备同步时补齐）
      setTimeout(() => {
        const s = usePigeonStore.getState();
        const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); })();
        const hasJournal = s.journalEntries.some((j) => j.date === yesterday);
        const hasNewspaper = s.pastNewspapers.some((n) => n.date === yesterday) || s.dailyNewspaper?.date === yesterday;

        // 昨天有任何互动（投喂、访问地标、投票）都应该生成记录
        const hadActivity = s.todayFeedCount > 0
          || s.todayLandmarksVisited.length > 0
          || (s.dailyVote && s.dailyVote.totalVotes > 0)
          || s.journalEntries.length === 0; // 新用户也应该有一条初始记录

        if (!hasJournal && hadActivity) {
          // 显式传 yesterday，防止 state.todayDate 已被重置为今天
          s.generateDailyJournal(yesterday);
        }
        if (!hasNewspaper) {
          // 等日记生成完成后再生成日报
          setTimeout(() => {
            const s2 = usePigeonStore.getState();
            if (!s2.pastNewspapers.some((n) => n.date === yesterday)) {
              s2.generateDailyNewspaper();
            }
          }, 1500);
        }
      }, 2000);

      // 订阅校园热点实时更新
      const hotspotChannel = sb()!.channel('hotspot-realtime');
      hotspotChannel.on('postgres_changes',
        { event: '*', schema: 'public', table: 'campus_hotspots' },
        () => { get().syncHotspotsFromCloud(); }
      );
      hotspotChannel.subscribe();
    } catch {
      // Supabase 失败，localStorage 已在前面加载完毕
      set({ cloudReady: true, cloudError: true });
    }
  },

  setStatusText: (text, durationMs = 4000) => {
    set({ recentStatusText: text, statusTextExpiresAt: Date.now() + durationMs });
  },

  recordTrace: (characterId) => {
    const state = get();
    const traces = { ...state.characterTraces };
    traces[characterId] = (traces[characterId] || 0) + 1;
    set({ characterTraces: traces });
    localSave(get());
    setTimeout(() => cloudSyncTodayMeta(get()), 50);
  },

  rememberCharacter: (characterId, landmarkId) => {
    const state = get();
    const now = Date.now();
    const char = characters.find((c) => c.id === characterId);
    if (!char) return;

    const existing = state.rememberedCharacters.find((c) => c.characterId === characterId);
    const traceCount = state.characterTraces[characterId] || 0;

    let stage = 0;
    if (existing) {
      const count = existing.encounterCount + 1;
      if (count >= 5) stage = 3; else if (count >= 3) stage = 2; else stage = 1;
    } else {
      stage = traceCount >= char.traceThreshold ? 1 : 0;
    }

    let updated: RememberedCharacter[];
    let newChar: RememberedCharacter | undefined;
    if (existing) {
      updated = state.rememberedCharacters.map((c) =>
        c.characterId === characterId
          ? { ...c, lastSeen: now, encounterCount: c.encounterCount + 1, landmarkId, stage, disappeared: false }
          : c
      );
    } else {
      newChar = {
        characterId, name: char.name, silhouette: char.silhouette,
        type: char.type, stage, firstMet: now, lastSeen: now,
        encounterCount: 1, landmarkId,
      };
      updated = [...state.rememberedCharacters, newChar];
    }

    const todayEncounters = state.todayEncounters.includes(characterId)
      ? state.todayEncounters : [...state.todayEncounters, characterId];
    const newTraces = { ...state.characterTraces };
    delete newTraces[characterId];

    set({ rememberedCharacters: updated, todayEncounters, characterTraces: newTraces });
    localSave(get());
    const charToSync = newChar || updated.find((c) => c.characterId === characterId);
    if (charToSync) setTimeout(() => cloudSyncCharacter(charToSync), 50);
    setTimeout(() => cloudSyncTodayMeta(get()), 50);
  },

  updateMoodStreaks: () => {
    const state = get();
    const streaks = { ...state.moodStreaks };
    const mood = state.mood;
    const trackedDimensions: (keyof CampusMood)[] = ['academic', 'social', 'slack', 'romance'];
    for (const dim of trackedDimensions) {
      streaks[dim] = ((mood[dim] || 0) >= 50) ? (streaks[dim] || 0) + 1 : 0;
    }
    set({ moodStreaks: streaks });
    localSave(get());
    setTimeout(() => cloudSyncTodayMeta(get()), 50);
  },

  checkDisappearances: () => {
    const state = get();
    const campusState = getCampusState(state.mood);
    let updated = state.rememberedCharacters;
    for (const char of characters) {
      if (!char.disappearCondition) continue;
      const rc = updated.find((c) => c.characterId === char.id && !c.disappeared);
      if (!rc) continue;
      const cond = char.disappearCondition;
      let shouldDisappear = false;
      if (cond.campusState && cond.campusState.includes(campusState)) shouldDisappear = true;
      if (cond.moodMax) {
        for (const [key, val] of Object.entries(cond.moodMax)) {
          if ((state.mood[key as keyof CampusMood] || 0) > (val as number)) shouldDisappear = false;
        }
      }
      if (shouldDisappear) {
        updated = updated.map((c) =>
          c.characterId === char.id ? { ...c, disappeared: true, disappearedAt: Date.now() } : c
        );
      }
    }
    if (updated !== state.rememberedCharacters) {
      set({ rememberedCharacters: updated });
      localSave(get());
      for (const c of updated) { if (c.disappeared) setTimeout(() => cloudSyncCharacter(c), 50); }
    }
  },

  getActiveInfluences: () => {
    const state = get();
    const now = Date.now();
    return state.rememberedCharacters
      .filter((c) => now - c.lastSeen < 2 * 60 * 60 * 1000 && !c.disappeared)
      .map((rc) => characters.find((c) => c.id === rc.characterId)?.influence)
      .filter(Boolean) as CharacterInfluence[];
  },

  syncHotspotsFromCloud: async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data } = await sb()!.from('campus_hotspots')
        .select('*')
        .eq('is_active', true)
        .order('date', { ascending: false })
        .limit(20);
      if (data) {
        set({
          hotspots: (data as DbHotspot[]).map(h => ({
            id: h.id, title: h.title, date: h.date,
            summary: h.summary, url: h.url,
            image_url: h.image_url ?? undefined,
            category: h.category, category_emoji: h.category_emoji,
            mood_effect: h.mood_effect, landmark_hint: h.landmark_hint ?? undefined,
            scraped_at: h.scraped_at, is_active: h.is_active,
          })),
        });
      }
    } catch { /* silent */ }
  },

  fetchWeatherIfNeeded: async () => {
    const state = get();
    const now = Date.now();
    // 30分钟缓存
    if (state.weatherData && (now - state.lastWeatherFetch) < 30 * 60 * 1000) {
      return;
    }
    const data = await fetchOpenMeteoWeather();
    if (data) {
      set({ weatherData: data, lastWeatherFetch: now });
      localSave(get());
    }
  },

  setApiKey: (key: string) => {
    set({ zhipuApiKey: key });
    localSave(get());
  },

  // ============ 每日投票 ============

  syncDailyVoteFromCloud: async () => {
    if (!isSupabaseConfigured()) return;
    const today = getTodayDateString();
    try {
      const { data } = await sb()!.from('daily_votes').select('*').eq('date', today).single();
      const dv = data as DbDailyVote | null;
      if (dv) {
        set({
          dailyVote: {
            id: dv.id, date: dv.date, question: dv.question,
            options: dv.options, totalVotes: dv.total_votes,
            voteCounts: dv.vote_counts, winningOption: dv.winning_option,
            resultMood: dv.result_mood,
            resultBehaviorModifier: dv.result_behavior_modifier,
            generatedAt: dv.generated_at,
          },
        });
        localSave(get());
      }
    } catch { /* not found or error */ }
  },

  generateDailyVote: async () => {
    const state = get();
    const today = getTodayDateString();

    // Don't regenerate if already exists for today
    if (state.dailyVote?.date === today) return;

    // 先尝试从云端获取今天的投票（防止覆盖其他设备已生成的投票及数据）
    if (isSupabaseConfigured()) {
      try {
        const { data } = await sb()!.from('daily_votes').select('*').eq('date', today).single();
        const dv = data as DbDailyVote | null;
        if (dv) {
          set({
            dailyVote: {
              id: dv.id, date: dv.date, question: dv.question,
              options: dv.options, totalVotes: dv.total_votes,
              voteCounts: dv.vote_counts, winningOption: dv.winning_option,
              resultMood: dv.result_mood,
              resultBehaviorModifier: dv.result_behavior_modifier,
              generatedAt: dv.generated_at,
            },
          });
          localSave(get());
          return; // 使用云端已有数据
        }
      } catch { /* not found, generate new */ }
    }

    // 立即用兜底数据生成，确保每个端口都有投票
    const fallback = getFallbackQuestion(today);
    const vote: DailyVote = {
      id: `vote-${today}`,
      date: today,
      question: fallback.question,
      options: fallback.options,
      totalVotes: 0,
      voteCounts: [0, 0, 0, 0],
      winningOption: 0,
      resultMood: fallback.resultMood,
      resultBehaviorModifier: { moveChanceMod: 1.0, activityWeights: {} },
      generatedAt: Date.now(),
    };

    set({ dailyVote: vote });
    localSave(get());
    setTimeout(() => cloudSyncDailyVote(vote), 50);

    // 异步用 AI 升级问题（静默替换）
    const apiKey = state.zhipuApiKey;
    if (apiKey) {
      const domMood = (() => { let d = ''; let v = 0; for (const [k, val] of Object.entries(state.mood)) { if (val > v) { d = k; v = val; } } return d; })();
      const domVal = (() => { let v = 0; for (const val of Object.values(state.mood)) { if (val > v) v = val; } return v; })();
      const lm = landmarks.find((l) => l.id === state.currentLandmarkId);
      const ctx: VoteGenContext = {
        dominantMood: domMood,
        moodValue: domVal,
        weatherLabel: state.weatherData?.label || '未知',
        campusState: (() => {
          const m = new Date().getMonth() + 1;
          if ((m === 1) || (m === 6 && new Date().getDate() >= 15)) return 'exam';
          if (m === 3 || m === 4) return 'spring';
          if (m === 6 || m === 7) return 'graduation';
          return 'normal';
        })(),
        currentLocation: lm?.name || '校园',
        journalSnippet: state.journalEntries[0]?.content?.slice(0, 100) || null,
      };
      generateDailyVoteQuestion(apiKey, ctx).then((generated) => {
        if (!generated) return;
        const updated: DailyVote = {
          ...get().dailyVote!,
          question: generated.question,
          options: generated.options,
          resultMood: generated.resultMood,
          resultBehaviorModifier: generated.behaviorMod,
        };
        set({ dailyVote: updated });
        localSave(get());
        setTimeout(() => cloudSyncDailyVote(updated), 50);
      });
    }
  },

  castVote: async (optionIndex: number) => {
    const state = get();
    const today = getTodayDateString();
    if (state.userVoteRecord?.date === today) return; // already voted

    // 22:00 投票截止
    if (!isVoteOpen()) return;

    const vote = state.dailyVote;
    if (!vote || optionIndex < 0 || optionIndex >= vote.options.length) return;

    // 先在本地更新（乐观）
    const newCounts = [...vote.voteCounts];
    newCounts[optionIndex] = (newCounts[optionIndex] || 0) + 1;
    const newTotal = vote.totalVotes + 1;
    const updatedVote: DailyVote = { ...vote, voteCounts: newCounts, totalVotes: newTotal };
    const record: UserVoteRecord = { date: today, voteIndex: optionIndex, rumorVote: null, topicVote: null };

    set({ dailyVote: updatedVote, userVoteRecord: record });
    saveUserVoteRecord(record);
    localSave(get());

    // 写入云端：RPC 原子递增 + 立即拉回真实值
    const uid = get().userId;
    setTimeout(async () => {
      if (isSupabaseConfigured()) {
        try {
          await (sb()! as any).rpc('increment_vote_count', { p_vote_id: vote.id, p_vote_index: optionIndex });
          // RPC 成功 → 拉云端真实值覆盖本地
          await get().syncDailyVoteFromCloud();
        } catch {
          // RPC 失败 → upsert 兜底，不 sync
          cloudSyncDailyVote(updatedVote);
        }
      }
      cloudSyncUserVote(uid, today, optionIndex, null);
      // Broadcast 通知同设备其他标签页
      if (bc) bc.postMessage({ type: 'vote' });
    }, 50);
  },

  // ============ 校园传闻 ============

  syncRumorFromCloud: async () => {
    if (!isSupabaseConfigured()) return;
    const today = getTodayDateString();
    try {
      const { data } = await sb()!.from('campus_rumors').select('*').eq('date', today).single();
      const cr = data as DbCampusRumor | null;
      if (cr) {
        set({
          campusRumor: {
            id: cr.id, date: cr.date, content: cr.content,
            trueVotes: cr.true_votes, falseVotes: cr.false_votes,
            generatedAt: cr.generated_at,
          },
        });
        localSave(get());
      }
    } catch { /* not found */ }
  },

  generateDailyRumor: async () => {
    const state = get();
    const today = getTodayDateString();
    if (state.campusRumor?.date === today) return;

    // 先尝试从云端获取今天的传闻（可能其他设备已生成且已有投票）
    if (isSupabaseConfigured()) {
      try {
        const { data } = await sb()!.from('campus_rumors').select('*').eq('date', today).single();
        const cr = data as DbCampusRumor | null;
        if (cr) {
          set({
            campusRumor: {
              id: cr.id, date: cr.date, content: cr.content,
              trueVotes: cr.true_votes, falseVotes: cr.false_votes,
              generatedAt: cr.generated_at,
            },
          });
          localSave(get());
          return; // 使用云端已有数据，不覆盖
        }
      } catch { /* not found, generate new */ }
    }

    const landmarkNames = landmarks.map((l) => l.name);
    const activeHotspot = state.hotspots.find((h) => h.is_active);

    const ctx: TopicGenContext = {
      campusState: (() => {
        const m = new Date().getMonth() + 1;
        if ((m === 1) || (m === 6 && new Date().getDate() >= 15)) return 'exam';
        if (m === 3 || m === 4) return 'spring';
        if (m === 6 || m === 7) return 'graduation';
        return 'normal';
      })(),
      landmarkNames,
      recentHotspotTitle: activeHotspot?.title || null,
    };

    let content = state.zhipuApiKey ? await generateDailyTopicContent(state.zhipuApiKey, ctx) : null;
    if (!content) content = getFallbackTopic(today);

    const rumor: CampusRumor = {
      id: `rumor-${today}`,
      date: today,
      content,
      trueVotes: 0,
      falseVotes: 0,
      generatedAt: Date.now(),
    };

    set({ campusRumor: rumor });
    localSave(get());
    // 使用 INSERT 而非 UPSERT：如果云端已有记录就不覆盖（ON CONFLICT DO NOTHING）
    if (isSupabaseConfigured()) {
      try {
        await (sb()! as any).from('campus_rumors').insert({
          id: rumor.id, date: rumor.date, content: rumor.content,
          true_votes: 0, false_votes: 0, generated_at: rumor.generatedAt,
        });
      } catch {
        // 如果已存在（duplicate key），尝试 upsert 但只更新 content（保留投票数据）
        try {
          await (sb()! as any).rpc('upsert_rumor_content', {
            p_id: rumor.id, p_date: rumor.date, p_content: rumor.content,
          });
        } catch { /* silent */ }
      }
    } else {
      setTimeout(() => cloudSyncRumor(rumor), 50);
    }
  },

  castRumorVote: async (vote: 'true' | 'false') => {
    const state = get();
    const today = getTodayDateString();

    // 22:00 投票截止
    if (!isVoteOpen()) return;

    const record = state.userVoteRecord;
    if (record?.date === today && record.rumorVote) return;

    const newRecord: UserVoteRecord = {
      date: today,
      voteIndex: record?.voteIndex ?? 0,
      rumorVote: vote,
      topicVote: vote === 'true' ? 'agree' : 'disagree',
    };

    const rumor = state.campusRumor;
    if (rumor) {
      const isTrue = vote === 'true';
      const updatedRumor = {
        ...rumor,
        trueVotes: rumor.trueVotes + (isTrue ? 1 : 0),
        falseVotes: rumor.falseVotes + (isTrue ? 0 : 1),
      };
      set({ campusRumor: updatedRumor, userVoteRecord: newRecord });
      saveUserVoteRecord(newRecord);
      localSave(get());
      // RPC 原子递增 + 拉回
      setTimeout(async () => {
        if (isSupabaseConfigured()) {
          try {
            await (sb()! as any).rpc('increment_rumor_vote', { p_rumor_id: rumor.id, p_is_true: isTrue });
            await get().syncRumorFromCloud();
          } catch {
            cloudSyncRumor(updatedRumor);
          }
        }
      }, 50);
    }

    const uid = get().userId;
    setTimeout(() => cloudSyncUserVote(uid, today, newRecord.voteIndex, vote), 50);
  },

  // ============ 背包物品 ============

  syncBackpackFromCloud: async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data } = await sb()!.from('backpack_items').select('*').order('collected_at', { ascending: false }).limit(100);
      if (data) {
        const needsUpdate: BackpackItem[] = [];
        const items = (data as DbBackpackItem[]).map((bi) => {
          let story = bi.story || '';
          // 云端缺 story 则从预设数据回填
          if (!story) {
            const presetStory = findCollectibleStory(bi.landmark_id, bi.name);
            if (presetStory) {
              story = presetStory;
              needsUpdate.push({
                id: bi.id, name: bi.name, emoji: bi.emoji,
                landmarkId: bi.landmark_id, landmarkName: bi.landmark_name,
                collectedAt: bi.collected_at, description: bi.description,
                rarity: bi.rarity as BackpackItem['rarity'], story,
              });
            }
          }
          return {
            id: bi.id, name: bi.name, emoji: bi.emoji,
            landmarkId: bi.landmark_id, landmarkName: bi.landmark_name,
            collectedAt: bi.collected_at, description: bi.description,
            rarity: bi.rarity as BackpackItem['rarity'], story,
          };
        });
        set({ backpackItems: items });
        localSave(get());
        // 回填：将补上的 story 写回云端
        for (const item of needsUpdate) {
          setTimeout(() => cloudSyncBackpackItem(item), 50);
        }
      }
    } catch { /* silent */ }
  },

  collectBackpackItem: (landmarkId: string) => {
    const state = get();
    const today = getTodayDateString();

    const collectible = getCollectibleForLandmark(landmarkId);
    if (!collectible) return;

    // 每个具体物品全局唯一（不重复收集同一件）
    const itemId = `backpack-${landmarkId}-${collectible.name}`;
    if (state.backpackItems.some((bi) => bi.id === itemId)) return;

    const lm = landmarks.find((l) => l.id === landmarkId);
    const item: BackpackItem = {
      id: itemId,
      name: collectible.name,
      emoji: collectible.emoji,
      landmarkId,
      landmarkName: lm?.name || landmarkId,
      collectedAt: today,
      description: collectible.description,
      rarity: collectible.rarity,
      story: collectible.story,
    };

    set((s) => ({ backpackItems: [item, ...s.backpackItems].slice(0, 200) }));
    localSave(get());
    setTimeout(() => cloudSyncBackpackItem(item), 50);
  },

  // ============ 校园日报 ============

  syncNewspaperFromCloud: async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data } = await sb()!.from('daily_newspapers')
        .select('*')
        .order('date', { ascending: false })
        .limit(60);
      const npList = data as DbDailyNewspaper[] | null;
      if (npList && npList.length > 0) {
        const today = getTodayDateString();
        const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); })();

        // 转换所有报纸
        const allPapers: DailyNewspaper[] = npList.map((n) => ({
          id: n.id, date: n.date,
          headline: n.headline || '',
          interactionCount: n.interaction_count || 0,
          locationName: n.location_name, locationEmoji: n.location_emoji,
          itinerary: n.itinerary, todayTopic: n.today_topic,
          votingResult: n.voting_result,
          photoId: n.photo_id,
          collectedItems: (n.collected_items || []).map((ci) => ({
            id: '', name: ci.name, emoji: ci.emoji, landmarkId: '', landmarkName: ci.landmarkName || '',
            collectedAt: n.date, description: ci.description, rarity: 'common' as BackpackItem['rarity'],
            story: '',
          })),
          rumorContent: n.rumor_content,
          pigeonThought: n.pigeon_thought, content: n.content,
        }));

        // 合并：云端有就优先用云端的，但云端为空也不覆盖本地已生成的
        const cur = get();
        const merged = [...allPapers];
        // 把本地有但云端没有的报纸补充进去
        for (const p of cur.pastNewspapers) {
          if (!merged.some((m) => m.id === p.id)) merged.push(p);
        }
        merged.sort((a, b) => b.date.localeCompare(a.date));
        const finalPapers = merged.slice(0, 60);

        // 云端最新报纸如果是昨天/今天的 → 设为当前日报
        const latestPaper = allPapers[0];
        const isCurrent = latestPaper?.date === today || latestPaper?.date === yesterday;

        set({
          dailyNewspaper: isCurrent ? latestPaper : cur.dailyNewspaper, // 云端没有就不覆盖本地
          pastNewspapers: finalPapers,
        });
        localSave(get());
      }
      // 云端没数据 → 什么都不做，保留本地已生成的报纸
    } catch { /* silent */ }
  },

  getPastNewspapers: () => {
    return get().pastNewspapers;
  },

  // unlockFootprintPhoto 保留为工具函数（当前日记生成处内联了解锁逻辑，此函数作为备用入口）
  unlockFootprintPhoto: (landmarkId: string) => {
    const name = LANDMARK_ID_TO_NAME[landmarkId];
    if (!name || !landmarkPhotos[name]) return;

    const allPhotos = landmarkPhotos[name];
    const state = get();
    const unlocked = new Set(state.unlockedFootprints);

    // 找第一张还没解锁的照片
    const locked = allPhotos.find((p) => !unlocked.has(p.path));
    if (locked) {
      const next = [...state.unlockedFootprints, locked.path];
      set({ unlockedFootprints: next });
      try { localStorage.setItem('pigeon-footprints', JSON.stringify(next)); } catch {}
      localSave(get());
      setTimeout(() => cloudSyncTodayMeta(get()), 50);
    }
  },

  // 从云端拉取最新投喂数据（多端同步时使用）
  syncFeedTotalsFromCloud: async () => {
    if (!isSupabaseConfigured()) return;
    const today = getTodayDateString();
    try {
      const [totalsRes, metaRes] = await Promise.all([
        sb()!.from('feed_totals').select('*'),
        sb()!.from('today_meta').select('*').eq('id', 1).single(),
      ]);
      if (totalsRes.data) {
        const totals: Record<string, number> = {};
        const todayTotals: Record<string, number> = {};
        for (const f of totalsRes.data as DbFeedTotal[]) {
          totals[f.item_id] = f.count;
          todayTotals[f.item_id] = f.today_count;
        }
        const tm = metaRes.data as DbTodayMeta | null;
        // 检查云端日期是否与今天一致，不一致则重置今日数据
        const cloudDateMatches = tm?.today_date === today;
        set(() => {
          const cur = get();
          const merged: Record<string, number> = {};
          const mergedToday: Record<string, number> = {};
          const allKeys = new Set([...Object.keys(cur.feedTotals), ...Object.keys(totals)]);
          for (const k of allKeys) {
            merged[k] = Math.max(cur.feedTotals[k] || 0, totals[k] || 0);
            // 只合并云端日期匹配且值 >0 的项；不创建 0 值条目
            const cloudVal = todayTotals[k];
            if (cloudDateMatches && cloudVal > 0) {
              mergedToday[k] = Math.max(cur.todayFeedTotals[k] || 0, cloudVal);
            } else if (cur.todayFeedTotals[k] > 0) {
              mergedToday[k] = cur.todayFeedTotals[k];
            }
            // 否则不写键 —— 避免 0 值污染
          }
          return {
            feedTotals: merged,
            todayFeedTotals: mergedToday,
            todayFeedCount: cloudDateMatches
              ? (tm ? Math.max(cur.todayFeedCount, tm.today_feed_count ?? 0) : cur.todayFeedCount)
              : cur.todayFeedCount,
          };
        });
        localSave(get());
      }
    } catch { /* silent */ }
  },

  generateDailyNewspaper: async () => {
    const state = get();
    // 用真实日期算昨天，不依赖 state.todayDate（可能已被重置）
    const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); })();

    // 如果已有今天的日报就不用重复生成
    if (state.dailyNewspaper?.date === yesterday) return;

    const apiKey = state.zhipuApiKey;

    // V2.0: 日报不再依赖日记 — 直接从 state 提取数据
    const photo = state.dailyPhotos.find((p) => p.id.includes(yesterday));
    const vote = state.dailyVote;
    const rumor = state.campusRumor;

    // 驻留地点
    let mostStayed = state.currentLandmarkId; let maxDuration = 0;
    for (const [lid, dur] of Object.entries(state.landmarkStayDurations)) {
      if (dur > maxDuration) { maxDuration = dur; mostStayed = lid; }
    }
    const mostStayedLm = landmarks.find((l) => l.id === mostStayed);
    const locationName = mostStayedLm?.name || '校园';
    const locationEmoji = mostStayedLm?.emoji || '📍';

    // 行程
    const itinerary = state.todayLandmarksVisited.length > 0
      ? state.todayLandmarksVisited.map((lid) => landmarks.find((l) => l.id === lid)?.name || lid)
      : [locationName];

    // 投票
    const voteDist = vote && vote.totalVotes > 0
      ? vote.voteCounts.map((c) => Math.round((c / vote.totalVotes) * 100))
      : [25, 25, 25, 25];
    const winningIdx = vote?.winningOption ?? 0;

    // 互动人数
    const bottlesPicked = state.messages.filter((m) => m.status === 'picked' && m.pickedByPigeon).length;
    const interactionCount = state.todayFeedCount + (vote?.totalVotes || 0) + bottlesPicked;

    // 最受欢迎礼物
    let topGift = '面包'; let topGiftCount = 0;
    for (const [itemId, count] of Object.entries(state.todayFeedTotals)) {
      if (count > topGiftCount) {
        topGiftCount = count;
        const it = feedItems.find((f) => f.id === itemId);
        if (it) topGift = it.name;
      }
    }

    const ctx: NewspaperContext = {
      date: yesterday,
      locationName,
      locationEmoji,
      itinerary,
      todayTopic: vote?.question || '今天没有投票',
      voteWinnerEmoji: vote?.options[winningIdx]?.emoji || '❓',
      voteWinnerText: vote?.options[winningIdx]?.text || '未知',
      voteDistribution: voteDist,
      resultMood: vote?.resultMood || '😊',
      photoCaption: photo?.caption || '今天没有照片',
      collectedItems: state.backpackItems.filter((bi) => bi.collectedAt === yesterday).map((bi) => ({
        emoji: bi.emoji, name: bi.name, description: bi.description,
      })),
      rumorContent: rumor?.content || null,
      moodSummary: (() => { let d = ''; let v = 0; for (const [k, val] of Object.entries(state.mood)) { if (val > v) { d = k; v = val; } } return d; })(),
      weatherSummary: state.weatherData ? `${state.weatherData.emoji} ${state.weatherData.label} ${state.weatherData.temperature}°C` : '天气未知',
      interactionCount,
      feedCount: state.todayFeedCount,
      topGift,
    };

    // 生成 headline
    let headline = '';
    if (apiKey) {
      const h = await generateNewspaperHeadline(apiKey, ctx);
      if (h) headline = h;
    }
    if (!headline) {
      headline = `${yesterday.slice(5)} 校园鸽报`;
    }

    // 生成内容
    let content: string | null = null;
    if (apiKey) content = await enhanceNewspaperContent(apiKey, ctx);
    if (!content) {
      // Fallback: 结构化模板
      content = `📍 ${locationEmoji} 今日驻留：${locationName}\n\n🏆 今日投票：${vote?.question || '无'} — ${ctx.voteWinnerEmoji} "${ctx.voteWinnerText}" 胜出（${voteDist.map((p, i) => `选项${i + 1}: ${p}%`).join('，')}）\n\n🎁 今日收到 ${state.todayFeedCount} 次投喂，最受欢迎的是 ${topGift}\n\n💬 今日话题：${rumor?.content || '无'}\n\n🕊 今日点评：${state.weatherData ? `${state.weatherData.emoji} ${state.weatherData.label}` : ''}的一天`;
    }

    const np: DailyNewspaper = {
      id: `newspaper-${yesterday}`,
      date: yesterday,
      headline,
      interactionCount,
      locationName,
      locationEmoji,
      itinerary,
      todayTopic: ctx.todayTopic,
      votingResult: vote ? {
        question: vote.question,
        winnerEmoji: ctx.voteWinnerEmoji,
        winnerText: ctx.voteWinnerText,
        voteDistribution: voteDist,
        resultMood: vote.resultMood,
      } : null,
      photoId: photo?.id || null,
      collectedItems: state.backpackItems.filter((bi) => bi.collectedAt === yesterday),
      rumorContent: rumor?.content || null,
      pigeonThought: content || '',
      content: content || '',
    };

    set((s) => {
      const existing = s.pastNewspapers.filter((p) => p.id !== np.id);
      return {
        dailyNewspaper: np,
        pastNewspapers: [np, ...existing].slice(0, 60),
      };
    });
    localSave(get());
    setTimeout(() => cloudSyncNewspaper(np), 50);
  },

  feedPigeon: (itemId: FeedItemId) => {
    const state = get();
    state.resetTodayIfNeeded();
    const item = feedItems.find((f) => f.id === itemId);
    if (!item) return;

    const last10 = state.recentFeeds.slice(-10);
    const sameCount = last10.filter((f) => f.itemId === itemId).length;
    let penalty = 1.0;
    if (sameCount <= 2) penalty = 1.0; else if (sameCount <= 4) penalty = 0.5; else penalty = 0.1;

    const newMood = { ...state.mood };
    if (item.moodEffect) {
      for (const [key, delta] of Object.entries(item.moodEffect)) {
        if (delta) newMood[key as keyof CampusMood] = clamp(newMood[key as keyof CampusMood] + delta * penalty);
      }
    }
    const balancedMood = normalizeMood(newMood);

    const logEntry: FeedLogEntry = { itemId, itemEmoji: item.emoji, itemName: item.name, timestamp: Date.now() };
    const newTotals = { ...state.feedTotals, [itemId]: (state.feedTotals[itemId] || 0) + 1 };
    const newTodayTotals = { ...state.todayFeedTotals, [itemId]: (state.todayFeedTotals[itemId] || 0) + 1 };

    // 礼物行为标记
    const giftUpdates: Partial<GiftFlags> = {};
    if (itemId === 'umbrella') giftUpdates.hasUmbrella = true;
    else if (itemId === 'camera') giftUpdates.hasCamera = true;
    else if (itemId === 'headphone') giftUpdates.hasHeadphone = true;
    else if (itemId === 'scarf') giftUpdates.hasScarf = true;
    else if (itemId === 'flower') giftUpdates.hasFlower = true;
    const newGiftFlags = Object.keys(giftUpdates).length > 0
      ? { ...state.giftFlags, ...giftUpdates }
      : state.giftFlags;

    set({
      feedTotals: newTotals,
      todayFeedTotals: newTodayTotals,
      todayFeedCount: state.todayFeedCount + 1,
      mood: balancedMood,
      pigeonActivity: 'eating',
      lastActivityTimestamp: Date.now(),
      recentFeeds: [...state.recentFeeds.slice(-99), logEntry],
      recentStatusText: item.reactions[Math.floor(Math.random() * item.reactions.length)],
      statusTextExpiresAt: Date.now() + 5000,
      giftFlags: newGiftFlags,
    });

    const ns = get();
    localSave(ns);
    setTimeout(() => cloudSyncState(ns), 50);

    // 写入云端：RPC原子递增 → 拉回真实值；失败则 upsert 兜底
    setTimeout(async () => {
      if (!isSupabaseConfigured()) return;
      try {
        await (sb()! as any).rpc('increment_feed_total', { p_item_id: itemId, p_count: 1 });
        await (sb()! as any).rpc('increment_today_feed_count');
        // RPC 成功：拉回云端真实值，只同步 today_meta（feed_totals 由 RPC 维护）
        await get().syncFeedTotalsFromCloud();
        await cloudSyncTodayMeta(get());
      } catch {
        // RPC 失败：用本地值兜底写入
        const latest = get();
        await cloudSyncFeedTotal(itemId, latest.feedTotals, latest.todayFeedTotals);
        await cloudSyncTodayMeta(latest);
      }
      if (bc) bc.postMessage({ type: 'feed' });
    }, 50);
    setTimeout(() => cloudSyncRecentFeed(logEntry), 50);

    setTimeout(() => {
      if (get().pigeonActivity === 'eating') set({ pigeonActivity: 'idle' });
    }, 3000);
  },

  tickPigeonAI: () => {
    // 每日重置保险：确保跨天时触发日记生成和计数清零
    get().resetTodayIfNeeded();
    const state = get();
    const now = Date.now();
    const hour = new Date().getHours();

    // 23:00 提前生成明日报纸（错峰，不等午夜）
    if (isNewspaperTime()) {
      const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); })();
      if (!state.dailyNewspaper || state.dailyNewspaper.date !== yesterday) {
        get().generateDailyNewspaper();
      }
    }

    const stayElapsed = now - state.lastStayStartTime;
    const durations = { ...state.landmarkStayDurations };
    durations[state.currentLandmarkId] = (durations[state.currentLandmarkId] || 0) + stayElapsed;

    if (state.stayUntil > now && state.pigeonActivity !== 'walking') {
      const activity = selectStationaryActivity(state.mood, hour, state.currentLandmarkId);
      if (activity !== state.pigeonActivity && Math.random() < 0.3) set({ pigeonActivity: activity });
      set({ landmarkStayDurations: durations, lastStayStartTime: now });
      localSave(get());
      setTimeout(() => cloudSyncState(get()), 50);
      return;
    }

    if (hour >= 23 || hour < 6) {
      if (Math.random() < 0.92) {
        set({ pigeonActivity: 'sleeping', landmarkStayDurations: durations, lastStayStartTime: now });
        localSave(get());
        setTimeout(() => cloudSyncState(get()), 50);
        return;
      }
    }

    // P2: 投票仪式感 — 22:00 后鸽子飞向投票胜出地标
    if (hour >= 22 && !state.voteRitualDone && state.dailyVote && state.dailyVote.totalVotes > 0 && state.pigeonActivity !== 'walking') {
      const maxIdx = state.dailyVote.voteCounts.indexOf(Math.max(...state.dailyVote.voteCounts));
      const winner = state.dailyVote.options[maxIdx];
      if (winner?.targetLandmark && winner.targetLandmark !== state.currentLandmarkId) {
        const path = findPath(state.currentLandmarkId, winner.targetLandmark);
        const fromPos = MAP_POSITIONS.find((p) => p.landmarkId === state.currentLandmarkId);
        const toPos = MAP_POSITIONS.find((p) => p.landmarkId === winner.targetLandmark);
        if (fromPos && toPos) {
          set({ flightTrails: [{ fromId: state.currentLandmarkId, toId: winner.targetLandmark, fromX: fromPos.leftPercent, fromY: fromPos.topPercent, toX: toPos.leftPercent, toY: toPos.topPercent, timestamp: now }, ...state.flightTrails].slice(0, 3) });
        }
        const visited = [...state.lastVisited, winner.targetLandmark].slice(-5);
        const todayVisited = state.todayLandmarksVisited.includes(winner.targetLandmark)
          ? state.todayLandmarksVisited : [...state.todayLandmarksVisited, winner.targetLandmark];
        set({
          targetLandmarkId: winner.targetLandmark, pigeonActivity: 'walking', lastActivityTimestamp: now,
          stayUntil: now + 8000, currentPath: path, lastVisited: visited,
          todayLandmarksVisited: todayVisited, lastStayStartTime: now,
          landmarkStayDurations: durations, totalFlights: state.totalFlights + 1,
          voteRitualDone: true, voteRitualLabel: winner.text,
        });
        const ns = get();
        localSave(ns);
        setTimeout(() => cloudSyncState(ns), 50);
        setTimeout(() => cloudSyncTodayMeta(ns), 50);
        setTimeout(() => {
          if (get().targetLandmarkId === winner.targetLandmark && get().pigeonActivity === 'walking') {
            set({ currentLandmarkId: winner.targetLandmark!, targetLandmarkId: null, pigeonActivity: 'idle', currentPath: null });
            get().collectBackpackItem(winner.targetLandmark!);
            // 足迹照片在日记生成时统一解锁
            localSave(get());
            setTimeout(() => cloudSyncState(get()), 50);
          }
        }, 8000);
        return;
      }
      // 胜出选项没有 targetLandmark，仅标记完成
      set({ voteRitualDone: true });
      localSave(get());
    }

    let moveChance = 0.2;
    if (hour >= 7 && hour < 11) moveChance += 0.1;
    if (state.mood.energy > 70) moveChance += 0.08;
    if (state.mood.slack > 70) moveChance -= 0.08;
    if (state.recentFeeds.slice(-5).some((f) => f.itemId === 'coffee')) moveChance += 0.05;

    // 投票结果影响移动概率
    const behaviorMod = state.dailyVote?.resultBehaviorModifier;
    if (behaviorMod?.moveChanceMod) {
      moveChance *= behaviorMod.moveChanceMod;
    }
    moveChance = Math.max(0.05, Math.min(0.85, moveChance));

    // 校园热点情绪影响：活跃热点轻微推动情绪
    const activeHotspots = state.hotspots.filter(h => h.is_active && h.mood_effect && Object.keys(h.mood_effect).length > 0);
    if (activeHotspots.length > 0 && Math.random() < 0.3) {
      const hotMood = { ...state.mood };
      for (const hot of activeHotspots) {
        for (const [key, delta] of Object.entries(hot.mood_effect)) {
          if (delta) hotMood[key as keyof CampusMood] = clamp(hotMood[key as keyof CampusMood] + (delta as number) * 0.05);
        }
      }
      // Only update if changed
      let changed = false;
      for (const key of Object.keys(hotMood) as (keyof CampusMood)[]) {
        if (hotMood[key] !== state.mood[key]) changed = true;
      }
      if (changed) set({ mood: normalizeMood(hotMood) });
    }

    if (Math.random() < moveChance) {
      const dest = selectDestination(state);
      if (dest && dest !== state.currentLandmarkId) {
        const path = findPath(state.currentLandmarkId, dest);
        const fromPos = MAP_POSITIONS.find((p) => p.landmarkId === state.currentLandmarkId);
        const toPos = MAP_POSITIONS.find((p) => p.landmarkId === dest);
        if (fromPos && toPos) {
          set({ flightTrails: [{ fromId: state.currentLandmarkId, toId: dest, fromX: fromPos.leftPercent, fromY: fromPos.topPercent, toX: toPos.leftPercent, toY: toPos.topPercent, timestamp: now }, ...state.flightTrails].slice(0, 3) });
        }
        const config = LANDMARK_CONFIGS.find((l) => l.id === dest);
        const zone = config?.zone || 'medium';
        let stayDuration = STAY_TIMES[zone].min + Math.random() * (STAY_TIMES[zone].max - STAY_TIMES[zone].min);
        // 🎧 耳机效果：停留时间 x1.5
        if (state.giftFlags.hasHeadphone) stayDuration *= 1.5;
        const visited = [...state.lastVisited, dest].slice(-5);
        const todayVisited = state.todayLandmarksVisited.includes(dest) ? state.todayLandmarksVisited : [...state.todayLandmarksVisited, dest];

        set({
          targetLandmarkId: dest, pigeonActivity: 'walking', lastActivityTimestamp: now,
          stayUntil: now + stayDuration, currentPath: path, lastVisited: visited,
          todayLandmarksVisited: todayVisited, lastStayStartTime: now,
          landmarkStayDurations: durations, totalFlights: state.totalFlights + 1,
        });

        const ns = get();
        localSave(ns);
        setTimeout(() => cloudSyncState(ns), 50);
        setTimeout(() => cloudSyncTodayMeta(ns), 50);

        setTimeout(() => {
          if (get().targetLandmarkId === dest && get().pigeonActivity === 'walking') {
            // 鸽子到达目的地 — 更新当前位置，清除目标
            set({
              currentLandmarkId: dest,
              targetLandmarkId: null,
              pigeonActivity: 'idle',
              currentPath: null,
            });
            // 首次到达地标 → 收集背包物品
            get().collectBackpackItem(dest);
            // 足迹照片在日记生成时统一解锁
            localSave(get());
            setTimeout(() => cloudSyncState(get()), 50);
          }
        }, path ? 6000 + path.length * 200 : 8000);
        return;
      }
    }

    const activity = selectStationaryActivity(state.mood, hour, state.currentLandmarkId);
    set({ pigeonActivity: activity, lastActivityTimestamp: now, landmarkStayDurations: durations, lastStayStartTime: now });
    localSave(get());
    setTimeout(() => cloudSyncState(get()), 50);

    if (Math.random() < 0.10) {
      checkEncounters(get, state.currentLandmarkId, hour, state.mood);
    }
  },

  postMessage: (emoji: string, text: string) => {
    if (!text.trim()) return;
    const bottle: DriftBottle = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(), emoji, text: text.trim().slice(0, 30),
      status: 'floating', pickedByPigeon: false,
    };
    set((s) => ({ messages: [bottle, ...s.messages].slice(0, 100) }));
    localSave(get());
    setTimeout(() => cloudSyncMessage(bottle), 50);
  },

  retrieveBottle: () => {
    const state = get();
    const floating = state.messages.filter((m) => m.status === 'floating');
    if (floating.length === 0) return null;
    const picked = floating[Math.floor(Math.random() * floating.length)];

    // 标记纸条已被鸽子拾取
    const updated = state.messages.map((m) =>
      m.id === picked.id ? { ...m, status: 'picked' as const, pickedByPigeon: true } : m
    );
    set({ messages: updated });
    localSave(get());
    setTimeout(() => cloudSyncMessage(updated.find((m) => m.id === picked.id)!), 50);

    // 异步生成鸽子回复
    const apiKey = state.zhipuApiKey;
    const today = getTodayDateString();

    const storeReply = (reply: string) => {
      set({ lastBottleReply: { noteText: picked.text, reply } });
      // 5秒后清除
      setTimeout(() => {
        if (get().lastBottleReply?.noteText === picked.text) {
          set({ lastBottleReply: null });
        }
      }, 8000);

      // 更新或创建今日日记中的纸条和回复
      const curJournals = get().journalEntries;
      const journalId = `journal-${today}`;
      const existingIdx = curJournals.findIndex((j) => j.id === journalId);
      if (existingIdx >= 0) {
        const updatedJournal = {
          ...curJournals[existingIdx],
          pickedNote: curJournals[existingIdx].pickedNote || picked.text,
          pigeonReply: reply,
        };
        const newJournals = [...curJournals];
        newJournals[existingIdx] = updatedJournal;
        set({ journalEntries: newJournals });
        localSave(get());
        setTimeout(() => cloudSyncJournal(updatedJournal), 50);
      } else {
        const lm = landmarks.find((l) => l.id === state.currentLandmarkId);
        const tempJournal: DailyJournal = {
          id: journalId,
          date: today,
          feedCount: state.todayFeedCount,
          topFeedItem: '面包',
          topFeedCount: 0,
          specialItems: [],
          landmarksVisited: state.todayLandmarksVisited,
          mostStayedLandmark: lm?.name || '校园',
          nightActivity: null,
          campusState: 'normal',
          hasUmbrella: false,
          pickedNote: picked.text,
          pigeonReply: reply,
          content: `今天鸽子捡到了一张纸条：「${picked.text}」\n鸽子回复：「${reply}」`,
        };
        set((s) => ({ journalEntries: [tempJournal, ...s.journalEntries].slice(0, 30) }));
        localSave(get());
        setTimeout(() => cloudSyncJournal(tempJournal), 50);
      }
    };

    if (apiKey) {
      generatePigeonNoteReply(apiKey, picked.text, today).then((reply) => {
        if (reply) storeReply(reply);
      });
    } else {
      // 没有 API key 时使用兜底回复
      const fallbackReplies = [
        '咕咕看到了你的纸条！虽然不知道是谁写的，但希望你能开心。',
        '纸条收到了！鸽子觉得写得很好，给你点个赞！',
        '咕~ 这张纸条真有意思。鸽子会好好保存的。',
        '收到啦！鸽子在校园里飞来飞去的时候会想着这张纸条的。',
        '谢谢你分享这些。鸽子虽然不会说话，但它用翅膀给你比了个心。',
      ];
      storeReply(fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)]);
    }

    return picked;
  },

  decayMood: () => {
    const state = get();
    const newMood = { ...state.mood };
    for (const key of Object.keys(newMood) as (keyof CampusMood)[]) {
      const diff = newMood[key] - 50;
      newMood[key] = clamp(newMood[key] - diff * 0.004);
    }
    // 天气情绪偏置
    const weather = state.weatherData;
    if (weather) {
      const wxEffect = getWeatherMoodEffect(weather);
      for (const [key, delta] of Object.entries(wxEffect)) {
        if (delta) {
          newMood[key as keyof CampusMood] = clamp(newMood[key as keyof CampusMood] + (delta as number));
        }
      }
    }
    // 🌸 花的效果：持续 warmth 加成（上限 80）
    if (state.giftFlags.hasFlower) {
      newMood.warmth = clamp(Math.min(newMood.warmth + 1, 80));
    }
    // 🧣 围巾效果：冬季（12-2月）抑制寒冷带来的 energy 惩罚
    const month = new Date().getMonth() + 1;
    if (state.giftFlags.hasScarf && (month === 12 || month === 1 || month === 2)) {
      if (weather && weather.temperature < 10) {
        newMood.energy = clamp(newMood.energy + 1); // 抵消寒冷惩罚
      }
    }
    set({ mood: normalizeMood(newMood) });
    localSave(get());
    setTimeout(() => cloudSyncState(get()), 50);
    state.sinkOldBottles();
  },

  sinkOldBottles: () => {
    const state = get();
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const updated = state.messages.map((m) =>
      m.timestamp < cutoff && m.status === 'floating' ? { ...m, status: 'sunken' as const } : m
    );
    if (updated.some((m, i) => m.status !== state.messages[i].status)) {
      set({ messages: updated });
      localSave(get());
      for (const m of updated) {
        if (m.status === 'sunken') setTimeout(() => cloudSyncMessage(m), 50);
      }
    }
  },

  resetTodayIfNeeded: () => {
    const today = getTodayDateString();
    const state = get();
    if (state.todayDate !== today) {
      console.log('[pigeon] resetTodayIfNeeded TRIGGERED — state.todayDate:', state.todayDate, 'today:', today, '— ZEROING todayFeedCount:', state.todayFeedCount, 'todayFeedTotals:', JSON.stringify(state.todayFeedTotals));
      // 生成昨天的日记和日报
      state.generateDailyJournal();
      state.generateDailyNewspaper();
      state.updateMoodStreaks();
      state.checkDisappearances();

      // 每日清空漂流纸条：未被打捞的 floating 纸条标记为沉没，已捞取的 picked 纸条永久保留
      const clearedMessages = state.messages.map((m) =>
        m.status === 'floating' ? { ...m, status: 'sunken' as const } : m
      );
      const hasChanged = clearedMessages.some((m, i) => m.status !== state.messages[i].status);

      // 从昨天的投票中提取胜出选项的目的地
      let tomorrowLandmark: string | undefined;
      if (state.dailyVote && state.dailyVote.totalVotes > 0) {
        const maxIdx = state.dailyVote.voteCounts.indexOf(Math.max(...state.dailyVote.voteCounts));
        tomorrowLandmark = state.dailyVote.options[maxIdx]?.targetLandmark;
      }

      set({
        todayDate: today, todayFeedTotals: {}, todayFeedCount: 0,
        todayLandmarksVisited: [], todayEncounters: [],
        landmarkStayDurations: {}, lastStayStartTime: Date.now(),
        // 清除昨天的投票/传闻引用，等待新数据
        dailyVote: null,
        campusRumor: null,
        dailyNewspaper: null,
        messages: hasChanged ? clearedMessages : state.messages,
        // 重置礼物标记
        giftFlags: { hasUmbrella: false, hasCamera: false, hasHeadphone: false, hasScarf: false, hasFlower: false },
        // 重置投票仪式
        voteRitualDone: false, voteRitualLabel: '',
        // 投票决定明天出发点
        ...(tomorrowLandmark ? { currentLandmarkId: tomorrowLandmark } : {}),
      });
      localSave(get());
      setTimeout(() => cloudSyncTodayMeta(get()), 50);
      setTimeout(() => cloudSyncState(get()), 50);

      // 重置云端 today_feed_count 和 feed_totals.today_count（跨天清零）
      setTimeout(async () => {
        if (!isSupabaseConfigured()) return;
        try {
          // 调用已有 RPC 重置 today_meta
          await (sb()! as any).rpc('reset_today_feed');
        } catch { /* silent */ }
        // 重置所有 feed_totals 的 today_count 为 0
        try {
          const { data: allTotals } = await sb()!.from('feed_totals').select('item_id');
          if (allTotals) {
            for (const row of allTotals as { item_id: string }[]) {
              await db.upsertFeedTotal({ item_id: row.item_id, count: get().feedTotals[row.item_id] || 0, today_count: 0 });
            }
          }
        } catch { /* silent */ }
        // 通知同设备其他标签页
        if (bc) bc.postMessage({ type: 'date-change' });
      }, 100);

      // 同步沉没的纸条到云端
      if (hasChanged) {
        const ns = get();
        for (const m of ns.messages) {
          if (m.status === 'sunken') setTimeout(() => cloudSyncMessage(m), 50);
        }
      }
      // 立即生成今天的投票和传闻（先用兜底，再异步 AI 更新）
      get().generateDailyVote();
      get().generateDailyRumor();
    } else {
      if (!state.dailyVote) get().generateDailyVote();
      if (!state.campusRumor) get().generateDailyRumor();
    }
  },

  generateDailyJournal: (forceDate?: string) => {
    const state = get();
    const yesterday = forceDate || state.todayDate;
    const feedCount = state.todayFeedCount;
    const hadInteraction = feedCount > 0;

    let topItem = '面包'; let topCount = 0;
    for (const [itemId, count] of Object.entries(state.todayFeedTotals)) {
      if (count > topCount) { topItem = itemId; topCount = count; }
    }
    const specialItems: string[] = [];
    for (const id of ['umbrella', 'camera', 'note', 'scarf', 'flower']) {
      if (state.todayFeedTotals[id] && state.todayFeedTotals[id] > 0) {
        const it = feedItems.find((f) => f.id === id);
        if (it) specialItems.push(it.name);
      }
    }

    let mostStayed = state.currentLandmarkId; let maxDuration = 0;
    for (const [lid, dur] of Object.entries(state.landmarkStayDurations)) {
      if (dur > maxDuration) { maxDuration = dur; mostStayed = lid; }
    }
    if (maxDuration === 0) mostStayed = state.currentLandmarkId;
    const mostStayedLm = landmarks.find((l) => l.id === mostStayed);

    // 每日照片：先检查是否已有今日照片（云端来的），没有再生成
    const existingTodayPhoto = state.dailyPhotos.find((p) => p.id === `daily-photo-${yesterday}`);
    if (!existingTodayPhoto) {
      const availableIds = getAvailableLandmarkIds(state.usedPhotoUrls);
      const photoLandmarkId = availableIds.length > 0
        ? availableIds[Math.floor(Math.random() * availableIds.length)]
        : landmarks[Math.floor(Math.random() * landmarks.length)].id;
      const randomLm = landmarks.find((l) => l.id === photoLandmarkId);
      if (randomLm) {
        const dailyPhoto = generateDailyPhoto(randomLm.id, state.mood, yesterday, state.usedPhotoUrls);
        // 强制使用日期作为ID，多端共享同一张照片
        dailyPhoto.id = `daily-photo-${yesterday}`;
        const newUsedUrls = [...state.usedPhotoUrls];
        if (dailyPhoto.photoUrl && !newUsedUrls.includes(dailyPhoto.photoUrl)) newUsedUrls.push(dailyPhoto.photoUrl);
        // 替换已有同日期照片（如果有的话）
        const filtered = state.dailyPhotos.filter((p) => p.id !== dailyPhoto.id);
        set({ dailyPhotos: [dailyPhoto, ...filtered].slice(0, 60), usedPhotoUrls: newUsedUrls.slice(-200) });
        const ns = get();
        localSave(ns);
        setTimeout(() => cloudSyncPhoto(dailyPhoto), 50);
        setTimeout(() => cloudSyncState(ns), 50);
      }
    }

    let nightActivity: string | null = null;
    if (state.recentFeeds.some((f) => { const h = new Date(f.timestamp).getHours(); return h >= 23 || h < 6; })) {
      nightActivity = '今晚它没有太早睡。';
    }

    // 每天只捡一张漂流瓶 — 取最早未拾取的纸条
    let bottleLine = '';
    let pickedNote: string | undefined;
    let pigeonReply: string | undefined;
    const floatingBottles = state.messages.filter((m) => m.status === 'floating');
    if (floatingBottles.length > 0) {
      const picked = floatingBottles[floatingBottles.length - 1]; // 最早的那条
      const updated = state.messages.map((m) =>
        m.id === picked.id ? { ...m, status: 'picked' as const, pickedByPigeon: true } : m
      );
      set({ messages: updated });
      setTimeout(() => cloudSyncMessage(updated.find((m) => m.id === picked.id)!), 50);
      pickedNote = picked.text;
      bottleLine = `\n今天它捡到了一张纸条：\n"${picked.text}"\n`;

      // 生成鸽子对纸条的回复（异步，不阻塞日记生成）
      const noteReplyApiKey = state.zhipuApiKey;
      if (noteReplyApiKey) {
        generatePigeonNoteReply(noteReplyApiKey, picked.text, yesterday).then((reply) => {
          if (reply) {
            pigeonReply = reply;
            // 更新日记中的回复
            const curJournals = get().journalEntries;
            const targetIdx = curJournals.findIndex((j) => j.id === `journal-${yesterday}`);
            if (targetIdx >= 0) {
              const updatedJournal = { ...curJournals[targetIdx], pigeonReply: reply };
              const newJournals = [...curJournals];
              newJournals[targetIdx] = updatedJournal;
              set({ journalEntries: newJournals });
              localSave(get());
              setTimeout(() => cloudSyncJournal(updatedJournal), 50);
            }
          }
        });
      }
    }

    const topItemName = feedItems.find((f) => f.id === topItem)?.name || topItem;
    const campusState = getCampusState(state.mood);
    const dateLabel = yesterday.slice(5);

    // V2.2: 融合叙事 — 照片穿插在段落间
    let content = `「${dateLabel} 校园观察」\n\n`;

    // 氛围开场 — 更自然更随机
    const vibeOptions = (() => {
      const cat = mostStayedLm?.category;
      if (cat === 'nature') return [
        `风从水面吹过来，凉凉的。`,
        `树叶沙沙响着。`,
        `水面上有光在晃，一下一下的。`,
        `草地里不知道什么虫子在叫。`,
        `今天大部分时间都待在外面。`,
      ];
      if (cat === 'academic') return [
        `周围很安静，偶尔有人翻书。`,
        `窗台上积了一层薄薄的灰。`,
        `走廊里偶尔有脚步声，很快又安静下来。`,
        `灯很亮，比外面的天光还亮。`,
      ];
      if (cat === 'culture' || cat === 'gate') return [
        `这个地方很老了。石头知道很多事。`,
        `屋檐的影子落在地上，看着像睡着了一样。`,
        `很安静。安静了很久的那种安静。`,
        `路过的人会抬头看一眼。然后继续走。`,
      ];
      if (cat === 'sports') return [
        `远处有人在跑。一圈一圈的。`,
        `风里有草坪的味道。`,
        `很空旷。空旷得让人想飞。`,
        `有人在喊什么。听不太清。`,
      ];
      if (cat === 'dining') return [
        `空气里飘着食物的味道。`,
        `人来人往的，很热闹。`,
        `有人端着盘子走过。`,
        `这个时间，大家都在吃东西。`,
      ];
      return [
        `校园里很安静。`,
        `平常的一天。`,
        `鸽子在这里待了很久。`,
        `太阳慢慢挪着。`,
      ];
    })();
    content += `${vibeOptions[Math.floor(Math.random() * vibeOptions.length)]}\n\n`;

    // 天气 — 融进感受里，不独立陈述
    if (state.weatherData) {
      const w = state.weatherData;
      if (w.weatherCode <= 2) content += `阳光很好。暖和。\n\n`;
      else if (w.weatherCode >= 51 && w.weatherCode <= 82) content += `下雨了。雨打在树叶上，很好听。\n\n`;
      else if (w.weatherCode === 3 || w.weatherCode === 4) content += `云很厚。天灰灰的，但不闷。\n\n`;
      else content += `${buildWeatherSummary(state.weatherData)}\n\n`;
    }

    // 有人来过的痕迹
    if (hadInteraction) {
      const giftHints: string[] = [];
      if (state.giftFlags.hasUmbrella) giftHints.push('有人放了一把伞在旁边');
      if (state.giftFlags.hasFlower) giftHints.push('谁放了一朵花');
      if (state.giftFlags.hasCamera) giftHints.push('有台相机对着这边');
      if (state.giftFlags.hasHeadphone) giftHints.push('不知道谁给它戴上了耳机');
      if (state.giftFlags.hasScarf) giftHints.push('脖子上多了条围巾');
      if (giftHints.length > 0) {
        content += giftHints.join('。\n') + '。\n\n';
      } else {
        const interactionLines = [
          `今天有人来过。留下了些吃的。`,
          `有人在这停留了一会儿。`,
          `路过了几个人，其中一个停了一下。`,
        ];
        content += `${interactionLines[Math.floor(Math.random() * interactionLines.length)]}\n\n`;
      }
    } else {
      const quietLines = [
        `今天很安静。只有鸽子自己。`,
        `没什么人来。鸽子也乐得清静。`,
        `一整天都安安静静的。`,
      ];
      content += `${quietLines[Math.floor(Math.random() * quietLines.length)]}\n\n`;
    }

    // 纸条（简洁版）
    if (bottleLine) {
      content += `捡到了一张纸条。上面写着："${pickedNote}"\n\n`;
    }

    // 遇见 — 融入叙事
    if (state.todayEncounters.length > 0) {
      for (const cid of state.todayEncounters) {
        const ch = characters.find((c) => c.id === cid);
        if (ch) content += `看见了${ch.name}。${ch.silhouette}\n`;
      }
      content += '\n';
    }

    // 夜间
    if (nightActivity) content += `${nightActivity}\n\n`;

    // 收尾 — 更有温度
    const moodEnding = generateMoodEnding(state.mood);
    if (moodEnding) content += `${moodEnding}\n`;
    const streakNote = generateStreakNote(state.moodStreaks);
    if (streakNote) content += `${streakNote}\n`;
    const seasonalNote = generateSeasonalNote(campusState);
    if (seasonalNote) content += `${seasonalNote}\n`;
    // 加入一个随机的鸽子自言自语收尾
    const closings = [
      '咕。',
      '鸽子的一天。',
      '就这样吧。',
      '明天还会来的。',
      '鸽子也不知道明天会去哪。',
    ];
    content += `\n${closings[Math.floor(Math.random() * closings.length)]}`;

    // 按当天访问的地标解锁足迹照片（每天每地标一张）
    const visitedIds = state.todayLandmarksVisited.length > 0 ? state.todayLandmarksVisited : [state.currentLandmarkId];
    for (const vid of [...new Set(visitedIds)]) {
      const name = LANDMARK_ID_TO_NAME[vid];
      if (!name || !landmarkPhotos[name]) continue;
      const allPhotos = landmarkPhotos[name];
      const curUnlocked = new Set(get().unlockedFootprints);
      const locked = allPhotos.find((p) => !curUnlocked.has(p.path));
      if (locked) {
        const next = [...get().unlockedFootprints, locked.path];
        set({ unlockedFootprints: next });
        try { localStorage.setItem('pigeon-footprints', JSON.stringify(next)); } catch {}
      }
    }

    const journal: DailyJournal = {
      id: `journal-${yesterday}`, date: yesterday, feedCount,
      topFeedItem: topItemName, topFeedCount: topCount, specialItems,
      landmarksVisited: visitedIds,
      mostStayedLandmark: mostStayedLm?.name || '思源湖', nightActivity, campusState,
      hasUmbrella: (state.feedTotals['umbrella'] || 0) > 0, pickedNote, pigeonReply, content,
    };

    set((s) => ({ journalEntries: [journal, ...s.journalEntries].slice(0, 30) }));
    localSave(get());
    setTimeout(() => cloudSyncJournal(journal), 50);

    // AI 增强日记文案（异步，不阻塞，静默运行）
    const apiKey = state.zhipuApiKey;
    if (apiKey) {
      const ctx: JournalContext = {
        date: yesterday,
        feedCount,
        todayFeedTotals: state.todayFeedTotals,
        landmarksVisited: journal.landmarksVisited,
        mostStayedLandmark: journal.mostStayedLandmark,
        todayEncounters: state.todayEncounters,
        mood: state.mood,
        weatherData: state.weatherData,
        campusState,
        nightActivity,
        pickedNote,
        specialItems,
        giftFlags: state.giftFlags,
      };
      enhanceJournalContent(apiKey, ctx).then((aiContent) => {
        if (aiContent) {
          const curState = get();
          const existingJournal = curState.journalEntries.find((j) => j.id === journal.id);
          const enhanced: DailyJournal = {
            ...journal,
            content: aiContent,
            pigeonReply: existingJournal?.pigeonReply || journal.pigeonReply, // 保留异步生成的回复
          };
          set((s) => ({
            journalEntries: s.journalEntries.map((j) =>
              j.id === journal.id ? enhanced : j
            ),
          }));
          localSave(get());
          setTimeout(() => cloudSyncJournal(enhanced), 50);
        }
      });
    }
  },
}));

// ======== AI 辅助函数 ========

function findPath(fromId: string, toId: string): number[] | null {
  const direct = ROAD_PATHS.find((rp) => (rp.from === fromId && rp.to === toId) || (rp.from === toId && rp.to === fromId));
  if (direct) {
    if (direct.from === toId) { const rev: number[] = []; for (let i = direct.points.length - 2; i >= 0; i -= 2) rev.push(direct.points[i], direct.points[i + 1]); return rev; }
    return [...direct.points];
  }
  return null;
}

function selectDestination(state: PigeonState): string | null {
  const tod = getTimeOfDay();
  const campusState = getCampusState(state.mood);

  let bestId: string | null = null; let bestScore = -1;
  for (const lm of landmarks) {
    const config = LANDMARK_CONFIGS.find((c) => c.id === lm.id);
    const zone = config?.zone || 'medium';
    let score = 0.3 + Math.random() * 0.7;
    if (zone === 'core') score *= 2.0;
    else if (zone === 'medium') score *= 1.2;
    else score *= 0.5;
    score *= getDistanceWeight(state.currentLandmarkId, lm.id);

    if (state.mood.academic > 60 && (lm.category === 'academic' || lm.category === 'culture')) score *= 1.5;
    if (state.mood.romance > 60 && lm.category === 'nature') score *= 1.5;
    if (state.mood.energy > 60 && lm.category === 'sports') score *= 1.5;
    if (state.mood.social > 60 && (lm.category === 'dining' || lm.category === 'culture')) score *= 1.4;

    if (tod === 'dawn') score *= 1.2;
    if (tod === 'morning' && lm.category === 'academic') score *= 1.3;
    if (tod === 'afternoon' && lm.category === 'nature') score *= 1.3;
    if (tod === 'evening' && (lm.id === 'siyuan-lake' || lm.id === 'zhiyuan-lake')) score *= 1.5;
    if (tod === 'night' && (lm.category === 'academic' || lm.category === 'culture')) score *= 1.3;
    if (tod === 'night' && lm.id === 'siyuan-lake') score *= 1.3;

    if (campusState === 'exam' && (lm.category === 'academic' || lm.category === 'culture')) score *= 1.4;
    if (campusState === 'spring' && lm.category === 'nature') score *= 1.4;
    if (campusState === 'graduation' && lm.category === 'gate') score *= 1.5;

    if (lm.id === 'siyuan-lake') score *= 2.5;
    if ((tod === 'night' || tod === 'dawn') && lm.id === 'siyuan-lake') score *= 1.8;
    if (tod === 'morning' && lm.id === 'siyuan-lake' && state.currentLandmarkId === 'siyuan-lake') score *= 0.4;

    // 校园热点影响地标选择
    for (const hot of state.hotspots) {
      if (!hot.is_active || !hot.landmark_hint) continue;
      if (lm.id === hot.landmark_hint) score *= 1.8;
    }

    for (const inf of state.getActiveInfluences()) {
      if (inf.landmarkBonus?.landmarkId && lm.id === inf.landmarkBonus.landmarkId) score *= inf.landmarkBonus.multiplier;
      if (inf.landmarkBonus?.category && lm.category === inf.landmarkBonus.category) score *= inf.landmarkBonus.multiplier;
    }

    if (lm.id === state.currentLandmarkId) score *= 0.15;
    if (state.lastVisited.includes(lm.id)) score *= 0.35;
    if (score > bestScore) { bestScore = score; bestId = lm.id; }
  }
  return bestId;
}

function selectStationaryActivity(mood: CampusMood, hour: number, landmarkId: string): PigeonActivity {
  const lm = landmarks.find((l) => l.id === landmarkId);
  const category = lm?.category || 'building';
  const config = LANDMARK_CONFIGS.find((c) => c.id === landmarkId);
  const zone = config?.zone || 'medium';
  const pool: { activity: PigeonActivity; weight: number }[] = [
    { activity: 'idle', weight: 15 },
    { activity: 'preening', weight: 10 + (mood.warmth > 60 ? 5 : 0) },
    { activity: 'thinking', weight: 10 + (mood.academic > 60 ? 5 : 0) },
    { activity: 'eating', weight: zone === 'core' ? 10 : 6 },
    { activity: 'sleeping', weight: 5 + (mood.slack > 60 ? 10 : 0) + (hour >= 13 && hour <= 16 ? 6 : 0) + (hour >= 23 ? 20 : 0) },
  ];
  if (category === 'academic' || category === 'culture' || category === 'service') {
    pool.push({ activity: 'perching', weight: 8 + (mood.academic > 55 ? 6 : 0) });
    pool.push({ activity: 'thinking', weight: 5 + (mood.academic > 60 ? 5 : 0) });
  }
  if (category === 'nature' || category === 'dining') {
    pool.push({ activity: 'observing', weight: 8 + (mood.social > 55 ? 6 : 0) });
    pool.push({ activity: 'hopping', weight: 6 + (mood.warmth > 55 ? 4 : 0) });
    pool.push({ activity: 'cooing', weight: 6 + (mood.social > 50 ? 5 : 0) });
  }
  if (category === 'sports') {
    pool.push({ activity: 'circling', weight: 6 + (mood.energy > 60 ? 8 : 0) });
    pool.push({ activity: 'dancing', weight: 5 + (mood.energy > 70 ? 10 : 0) });
  }
  if (zone === 'core') pool.push({ activity: 'approaching', weight: 4 + (mood.social > 60 ? 6 : 0) });
  if (hour >= 21 || hour < 7) pool.push({ activity: 'sheltering', weight: 4 });

  // 天气活动偏置
  const weatherData = usePigeonStore.getState().weatherData;
  if (weatherData) {
    const modifiers = getWeatherActivityModifiers(weatherData);
    for (const entry of pool) {
      const m = modifiers[entry.activity];
      if (m !== undefined) {
        entry.weight = Math.max(0.3, entry.weight * m);
      }
    }
    // 雨天增加躲雨选项（☂️ 有伞则不影响）
    if (weatherData.weatherCode >= 51 && weatherData.weatherCode <= 82) {
      const hasUmbrella = usePigeonStore.getState().giftFlags.hasUmbrella;
      if (!hasUmbrella) {
        const existing = pool.find((e) => e.activity === 'sheltering');
        if (existing) {
          existing.weight *= 3;
        } else {
          pool.push({ activity: 'sheltering', weight: 10 });
        }
      }
    }
  }

  // 投票结果活动权重偏置
  const voteActivityWeights = usePigeonStore.getState().dailyVote?.resultBehaviorModifier?.activityWeights;
  if (voteActivityWeights) {
    for (const entry of pool) {
      const w = voteActivityWeights[entry.activity];
      if (w !== undefined && w !== 0) {
        entry.weight = Math.max(0.3, entry.weight + w);
      }
    }
  }

  const total = pool.reduce((s, a) => s + a.weight, 0);
  let r = Math.random() * total;
  for (const a of pool) { r -= a.weight; if (r <= 0) return a.activity; }
  return 'idle';
}

function checkEncounters(getState: () => PigeonState, currentLandmarkId: string, _hour: number, mood: CampusMood) {
  const state = getState();
  const tod = getTimeOfDay();
  const campusState = getCampusState(mood);
  for (const char of characters) {
    if (state.todayEncounters.includes(char.id)) continue;
    if (state.rememberedCharacters.find((c) => c.characterId === char.id)?.disappeared) continue;
    const cond = char.condition;
    if (cond.landmarks && !cond.landmarks.includes(currentLandmarkId)) continue;
    if (cond.timeOfDay && !cond.timeOfDay.includes(tod)) continue;
    if (cond.campusState && !cond.campusState.includes(campusState)) continue;
    if (cond.moodMin) {
      let moodMatch = true;
      for (const [key, val] of Object.entries(cond.moodMin)) { if ((mood[key as keyof CampusMood] || 0) < (val as number)) { moodMatch = false; break; } }
      if (!moodMatch) continue;
    }
    if (cond.consecutiveDays && ((state.moodStreaks[cond.consecutiveDays.mood] || 0) < cond.consecutiveDays.days || mood[cond.consecutiveDays.mood] < cond.consecutiveDays.threshold)) continue;

    if (Math.random() < 0.25) {
      const traceCount = state.characterTraces[char.id] || 0;
      if (char.isRumor || (!state.rememberedCharacters.find((c) => c.characterId === char.id) && traceCount < char.traceThreshold)) {
        usePigeonStore.getState().recordTrace(char.id);
        usePigeonStore.setState({ recentStatusText: char.traceHint, statusTextExpiresAt: Date.now() + 5000 });
      } else {
        usePigeonStore.getState().rememberCharacter(char.id, currentLandmarkId);
        const rc = getState().rememberedCharacters.find((c) => c.characterId === char.id);
        const count = rc?.encounterCount || 1;
        const landmark = landmarks.find((l) => l.id === currentLandmarkId);
        usePigeonStore.setState({ recentStatusText: count <= 1 ? char.firstMet : count <= 3 ? `它又在${landmark?.name || '附近'}看到了${char.name}` : char.observationLevels[Math.min(2, Math.floor((count - 1) / 3))], statusTextExpiresAt: Date.now() + 6000 });
      }
    }
  }
}

// ======== 日志叙事 ========

function generateMoodEnding(mood: CampusMood): string | null {
  let domKey = ''; let domVal = 0;
  for (const [key, val] of Object.entries(mood)) { if (val > domVal) { domKey = key; domVal = val; } }
  const pool = ({
    stress: [
      '最近压力好像有点大。鸽子也是。',
      '它注意到校园里每个人都很忙碌。鸽子想，有时候停一下也没关系的。',
      '也许明天会轻松一点。鸽子不太懂人类的烦恼，但它希望大家都好。',
      '累了就趴一会儿。鸽子经常这样，趴着趴着天就亮了。',
    ],
    romance: [
      '它觉得今天校园里的空气都是甜的。',
      '鸽子今天看到了很温柔的画面。',
      '湖边的风特别轻，鸽子觉得有人在等谁。它不太确定，但那种感觉很舒服。',
      '今天有人在长椅上坐了很久，鸽子在旁边陪着。一句话也没说，但好像什么都说了。',
    ],
    social: [
      '鸽子今天好像交到了新朋友。当然是它单方面宣布的。',
      '人多的地方真热闹。鸽子喜欢这种被包围的感觉。',
      '今天路过了好多人，每个人都有自己的方向。鸽子也有——虽然它也不知道要去哪。',
      '有人对着鸽子笑了。鸽子觉得这是今天最好的事情。',
    ],
    loneliness: [
      '它今天大部分时间都是一个人。但一个人也挺好的。',
      '安静的时候，鸽子会想很多事情。想着想着天就黑了。',
      '鸽子今天在天台上站了很久，看着云从南边飘到北边。没有谁来，也没有谁走。',
      '孤独不是不好的事。鸽子觉得，安静的时候能听到风说的话。',
    ],
    energy: [
      '它在校园里飞了好几圈，停不下来。',
      '今天精力旺盛得不像一只鸽子。',
      '从东区飞到西区，又从图书馆飞到植物园。鸽子的翅膀今天就没歇过。',
      '今天是展翅的好天气。鸽子飞过了每一个屋顶，像在巡视自己的王国。',
    ],
    warmth: [
      '今天阳光很好，鸽子心情也不错。',
      '暖洋洋的一天。鸽子在阳光里摊成了一张鸽子饼。',
      '石阶被太阳晒得热乎乎的，鸽子趴在上面，觉得这是世界上最好的位置。',
      '阳光从树叶缝里漏下来，斑斑点点落在鸽子身上。暖融融的，不想动了。',
    ],
    academic: [
      '它最近好像特别喜欢往图书馆跑。',
      '做一只爱学习的鸽子，也不错。',
      '窗外有人在刷题，鸽子在窗台上陪着。虽然看不懂，但这种认真的感觉很好。',
      '图书馆的灯亮到很晚。鸽子觉得那些亮着的窗子，像是地上长出来的星星。',
    ],
    slack: [
      '鸽子今天宣布：摸鱼是基本鸽权。',
      '今天的鸽子没有目标，没有计划，只有阳光和风。',
      '努力是人的事，鸽子只需要优雅地活着。这一直是鸽生信条。',
      '在草坪上躺了一下午，看着天空从蓝变成橙再变成紫。谁说这不算是正事呢。',
      '有时候什么都不做，比做什么都更需要天赋。鸽子在这方面是天才。',
    ],
  } as Record<string, string[]>)[domKey];
  if (domVal >= 55 && pool) return pool[Math.floor(Math.random() * pool.length)];
  if (Math.random() < 0.4) return ['咕咕的一天，就这样过去了。', '鸽子觉得，今天是个好日子。', '太阳下山了，鸽子也要回去休息了。明天又是新的一天。', '一天结束的时候，鸽子总会在屋顶上多看一会儿晚霞。'][Math.floor(Math.random() * 4)];
  return null;
}

function generateStreakNote(streaks: Record<string, number>): string | null {
  const notes: string[] = [];
  if ((streaks['academic'] || 0) === 3) notes.push('鸽子最近好像特别爱学习，已经连续三天往教学楼和图书馆跑了。');
  if ((streaks['academic'] || 0) === 5) notes.push('连续第五天往图书馆飞了！鸽子觉得自己快要能看懂人类的字了。');
  if ((streaks['academic'] || 0) >= 7) notes.push('学术鸽模式全开。它已经忘记自己是一只鸽子了——也许是一只会飞的学者。');

  if ((streaks['slack'] || 0) === 3) notes.push('鸽子最近三天都在晒太阳发呆，充分证明了"摸鱼是第一生产力"。');
  if ((streaks['slack'] || 0) === 5) notes.push('第五天的躺平。鸽子把"无所事事"变成了一门艺术。');
  if ((streaks['slack'] || 0) >= 7) notes.push('鸽子宣布进入深度躺平期。世界在转，鸽子在停。各得其所。');

  if ((streaks['social'] || 0) === 3) notes.push('最近每天都能在人多的地方找到它。鸽子好像越来越喜欢热闹了。');
  if ((streaks['social'] || 0) >= 5) notes.push('连续好几天往人堆里飞。鸽子已经把自己当成交大的一份子了。');

  if ((streaks['romance'] || 0) === 3) notes.push('最近鸽子总在湖边和长椅边徘徊，好像在等什么美好的事情发生。');
  if ((streaks['romance'] || 0) >= 5) notes.push('鸽子最近的心形飞行轨迹越来越频繁了。春天虽然过了，但鸽子的春天还在。');

  if (notes.length === 0) return null;
  return notes[Math.floor(Math.random() * notes.length)];
}

function generateSeasonalNote(campusState: string): string | null {
  if (Math.random() > 0.5) return null;
  const notes: Record<string, string[]> = {
    spring: ['校园里的花又开了。鸽子在花瓣里打了个滚。', '春天真好。风是暖的，花是香的，鸽子是开心的。'],
    exam: ['考试季的校园有种特别的安静。大家都在埋头努力，鸽子也在旁边默默加油。'],
    graduation: ['毕业季到了。鸽子看到很多人在拍照，想把校园的每一个角落都装进相机里。'],
    normal: ['平平常常的一天。但鸽子觉得，平常的日子最值得珍惜。'],
  };
  const pool = notes[campusState];
  return pool ? pool[Math.floor(Math.random() * pool.length)] : null;
}

// ======== 共享辅助 ========

export function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 7) return 'dawn' as const;
  if (hour >= 7 && hour < 12) return 'morning' as const;
  if (hour >= 12 && hour < 17) return 'afternoon' as const;
  if (hour >= 17 && hour < 21) return 'evening' as const;
  return 'night' as const;
}

export function getCampusState(_mood: CampusMood) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  if ((month === 1 && day <= 20) || (month === 6 && day >= 15) || (month === 7 && day <= 5)) return 'exam' as const;
  if ((month === 3 && day >= 15) || month === 4) return 'spring' as const;
  if (month === 6 || month === 7) return 'graduation' as const;
  return 'normal' as const;
}
