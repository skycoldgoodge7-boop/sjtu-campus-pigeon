import { create } from 'zustand';
import type {
  CampusMood, FeedItemId, PhotoCard, DriftBottle,
  FeedLogEntry, PigeonActivity, DailyJournal, FlightTrail,
  RememberedCharacter,
} from '../types';
import { feedItems } from '../data/feedItems';
import { landmarks } from '../data/landmarks';
import {
  LANDMARK_CONFIGS, STAY_TIMES, MAP_POSITIONS, ROAD_PATHS, getDistanceWeight,
} from '../data/mapLayout';
import { generateDailyPhoto } from '../utils/photoEngine';
import { getTodayDateString } from '../utils/time';
import { characters } from '../data/characters';
import type { CharacterInfluence } from '../data/characters';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

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
}

interface DbFeedTotal { item_id: string; count: number; today_count: number; }

interface DbJournal {
  id: string; date: string; content: string; feed_count: number;
  top_feed_item: string; top_feed_count: number;
  special_items: string[]; landmarks_visited: string[];
  most_stayed_landmark: string; night_activity: string | null;
  campus_state: string; has_umbrella: boolean;
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

// ============================================================
// 本地 localStorage 后备
// ============================================================
const LS_KEY = 'sjtu-campus-pigeon';

function loadLocalState(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw).state || JSON.parse(raw)) : {};
  } catch { return {}; }
}

function saveLocalState(state: Record<string, unknown>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ state, version: 0 })); } catch { /* ok */ }
}

// Supabase client access
const sb = () => getSupabase();

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
};

// ============================================================
// 内部同步函数（模块级，非 store 方法）
// ============================================================

function localSave(s: PigeonStoreFull) {
  if (isSupabaseConfigured()) return;
  saveLocalState({
    currentLandmarkId: s.currentLandmarkId,
    stayUntil: s.stayUntil,
    feedTotals: s.feedTotals,
    todayFeedTotals: s.todayFeedTotals,
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
    });
  } catch { /* silent */ }
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

// ============================================================
// Store 接口
// ============================================================
type PigeonStoreFull = ReturnType<typeof usePigeonStore.getState>;

interface PigeonState {
  cloudReady: boolean;
  cloudError: boolean;

  currentLandmarkId: string;
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

  initFromCloud: () => Promise<void>;
  feedPigeon: (itemId: FeedItemId) => void;
  tickPigeonAI: () => void;
  postMessage: (emoji: string, text: string) => void;
  retrieveBottle: () => DriftBottle | null;
  decayMood: () => void;
  sinkOldBottles: () => void;
  resetTodayIfNeeded: () => void;
  generateDailyJournal: () => void;
  setStatusText: (text: string, durationMs?: number) => void;
  rememberCharacter: (characterId: string, landmarkId: string) => void;
  recordTrace: (characterId: string) => void;
  updateMoodStreaks: () => void;
  getActiveInfluences: () => CharacterInfluence[];
  checkDisappearances: () => void;
}

const DEFAULT_MOOD: CampusMood = {
  stress: 50, romance: 50, social: 50, loneliness: 50,
  energy: 50, warmth: 50, academic: 50, slack: 50,
};

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function getActivityLabel(activity: PigeonActivity, landmarkName?: string): string {
  const map: Record<PigeonActivity, string> = {
    idle: '正在发呆',
    walking: landmarkName ? `正在飞往${landmarkName}` : '正在赶路',
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
  pigeonActivity: 'idle',
  lastActivityTimestamp: Date.now(),
  stayUntil: Date.now() + 360000,
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

  // ============ 从云端初始化 ============
  initFromCloud: async () => {
    if (!isSupabaseConfigured()) {
      const local = loadLocalState();
      if (Object.keys(local).length > 0) set((s) => ({ ...s, ...local }));
      set({ cloudReady: true });
      return;
    }

    try {
      const [ps, tm, feedData, journalData, photoData, msgData, charData] = await Promise.all([
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
      ]);

      if (ps) {
        set({
          currentLandmarkId: ps.current_landmark_id || 'siyuan-lake',
          pigeonActivity: ps.pigeon_activity as PigeonActivity || 'idle',
          stayUntil: ps.stay_until || Date.now() + 360000,
          lastStayStartTime: ps.last_stay_start_time || Date.now(),
          lastActivityTimestamp: ps.last_tick_at || Date.now(),
          mood: ps.mood || { ...DEFAULT_MOOD },
          totalFlights: ps.total_flights || 0,
          landmarkStayDurations: ps.landmark_stay_durations || {},
          usedPhotoUrls: ps.used_photo_urls || [],
          lastVisited: ps.last_visited || [],
        });
      }

      if (feedData.length) {
        const totals: Record<string, number> = {};
        const todayTotals: Record<string, number> = {};
        for (const f of feedData) { totals[f.item_id] = f.count; todayTotals[f.item_id] = f.today_count; }
        set({ feedTotals: totals, todayFeedTotals: todayTotals });
      }

      if (journalData.length) {
        set({ journalEntries: journalData.slice(0, 30).map((j: DbJournal) => ({
          id: j.id, date: j.date, content: j.content, feedCount: j.feed_count,
          topFeedItem: j.top_feed_item, topFeedCount: j.top_feed_count,
          specialItems: j.special_items, landmarksVisited: j.landmarks_visited,
          mostStayedLandmark: j.most_stayed_landmark,
          nightActivity: j.night_activity, campusState: j.campus_state as DailyJournal['campusState'],
          hasUmbrella: j.has_umbrella,
        })) });
      }

      if (photoData.length) {
        set({ dailyPhotos: photoData.slice(0, 60).map((p: DbDailyPhoto) => ({
          id: p.id, timestamp: p.created_at, landmarkId: p.landmark_id,
          landmarkName: p.landmark_name, landmarkEmoji: p.landmark_emoji,
          timeOfDay: 'afternoon' as const, campusState: 'normal' as const,
          dominantMood: 'default', moodValue: 50, sceneEmojis: [],
          caption: p.caption, gradient: [p.gradient_start, p.gradient_end] as [string, string],
          photoUrl: p.photo_url ?? undefined, isEasterEgg: p.is_easter_egg,
        })) });
      }

      if (msgData.length) {
        set({ messages: msgData.slice(0, 100).map((m: DbMessage) => ({
          id: m.id, text: m.text, emoji: m.emoji,
          status: m.status as DriftBottle['status'],
          timestamp: m.timestamp, pickedByPigeon: m.picked_by_pigeon,
        })) });
      }

      if (charData.length) {
        set({ rememberedCharacters: charData.map((c: DbCharacter) => ({
          characterId: c.character_id, name: c.name, silhouette: c.silhouette,
          type: c.type as 'animal' | 'person' | 'presence',
          stage: c.stage, firstMet: c.first_met, lastSeen: c.last_seen,
          encounterCount: c.encounter_count, landmarkId: c.landmark_id,
          disappeared: c.disappeared, disappearedAt: c.disappeared_at ?? undefined,
        })) });
      }

      if (tm) {
        set({
          todayDate: tm.today_date || getTodayDateString(),
          todayFeedCount: tm.today_feed_count || 0,
          todayLandmarksVisited: tm.today_landmarks_visited || [],
          todayEncounters: tm.today_encounters || [],
          characterTraces: tm.character_traces || {},
          moodStreaks: tm.mood_streaks || {},
        });
      }

      set({ cloudReady: true });

      // 订阅实时更新
      sb()!.channel('pigeon-realtime')
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'pigeon_state', filter: 'id=eq.1' },
          (payload: { new: DbPigeonState }) => {
            const ps = payload.new;
            if (ps) {
              set({
                currentLandmarkId: ps.current_landmark_id || get().currentLandmarkId,
                pigeonActivity: (ps.pigeon_activity as PigeonActivity) || get().pigeonActivity,
                stayUntil: ps.stay_until || get().stayUntil,
                mood: ps.mood || get().mood,
                totalFlights: ps.total_flights ?? get().totalFlights,
                landmarkStayDurations: ps.landmark_stay_durations || get().landmarkStayDurations,
                usedPhotoUrls: ps.used_photo_urls || get().usedPhotoUrls,
                lastVisited: ps.last_visited || get().lastVisited,
                lastActivityTimestamp: ps.last_tick_at || get().lastActivityTimestamp,
                lastStayStartTime: ps.last_stay_start_time || get().lastStayStartTime,
              });
            }
          }
        )
        .subscribe();
    } catch {
      // Supabase 失败，回退 localStorage
      const local = loadLocalState();
      if (Object.keys(local).length > 0) set((s) => ({ ...s, ...local }));
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

    const logEntry: FeedLogEntry = { itemId, itemEmoji: item.emoji, itemName: item.name, timestamp: Date.now() };
    const newTotals = { ...state.feedTotals, [itemId]: (state.feedTotals[itemId] || 0) + 1 };
    const newTodayTotals = { ...state.todayFeedTotals, [itemId]: (state.todayFeedTotals[itemId] || 0) + 1 };

    set({
      feedTotals: newTotals,
      todayFeedTotals: newTodayTotals,
      todayFeedCount: state.todayFeedCount + 1,
      mood: newMood,
      pigeonActivity: 'eating',
      lastActivityTimestamp: Date.now(),
      recentFeeds: [...state.recentFeeds.slice(-99), logEntry],
      recentStatusText: `刚刚收到了${item.name}`,
      statusTextExpiresAt: Date.now() + 5000,
    });

    const ns = get();
    localSave(ns);
    setTimeout(() => cloudSyncState(ns), 50);
    setTimeout(() => cloudSyncFeedTotal(itemId, ns.feedTotals, ns.todayFeedTotals), 50);
    setTimeout(() => cloudSyncTodayMeta(ns), 50);
    setTimeout(() => cloudSyncRecentFeed(logEntry), 50);

    setTimeout(() => {
      if (get().pigeonActivity === 'eating') set({ pigeonActivity: 'idle' });
    }, 3000);
  },

  tickPigeonAI: () => {
    const state = get();
    const now = Date.now();
    const hour = new Date().getHours();

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

    let moveChance = 0.2;
    if (hour >= 7 && hour < 11) moveChance += 0.1;
    if (state.mood.energy > 70) moveChance += 0.08;
    if (state.mood.slack > 70) moveChance -= 0.08;
    if (state.recentFeeds.slice(-5).some((f) => f.itemId === 'coffee')) moveChance += 0.05;

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
        const stayDuration = STAY_TIMES[zone].min + Math.random() * (STAY_TIMES[zone].max - STAY_TIMES[zone].min);
        const visited = [...state.lastVisited, dest].slice(-5);
        const todayVisited = state.todayLandmarksVisited.includes(dest) ? state.todayLandmarksVisited : [...state.todayLandmarksVisited, dest];

        set({
          currentLandmarkId: dest, pigeonActivity: 'walking', lastActivityTimestamp: now,
          stayUntil: now + stayDuration, currentPath: path, lastVisited: visited,
          todayLandmarksVisited: todayVisited, lastStayStartTime: now,
          landmarkStayDurations: durations, totalFlights: state.totalFlights + 1,
        });

        const ns = get();
        localSave(ns);
        setTimeout(() => cloudSyncState(ns), 50);
        setTimeout(() => cloudSyncTodayMeta(ns), 50);

        setTimeout(() => {
          if (get().currentLandmarkId === dest && get().pigeonActivity === 'walking') {
            set({ pigeonActivity: 'idle', currentPath: null });
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

    if (Math.random() < 0.05) {
      const floating = state.messages.filter((m) => m.status === 'floating');
      if (floating.length > 0) {
        const bottle = floating[Math.floor(Math.random() * floating.length)];
        const updated = state.messages.map((m) => m.id === bottle.id ? { ...m, status: 'picked' as const, pickedByPigeon: true } : m);
        set({ messages: updated, recentStatusText: '它捡到了一张纸条', statusTextExpiresAt: Date.now() + 6000 });
        localSave(get());
        const synced = updated.find((m) => m.id === bottle.id);
        if (synced) setTimeout(() => cloudSyncMessage(synced), 50);
      }
    }

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
    const floating = get().messages.filter((m) => m.status === 'floating');
    return floating.length === 0 ? null : floating[Math.floor(Math.random() * floating.length)];
  },

  decayMood: () => {
    const state = get();
    const newMood = { ...state.mood };
    for (const key of Object.keys(newMood) as (keyof CampusMood)[]) {
      const diff = newMood[key] - 50;
      newMood[key] = clamp(newMood[key] - diff * 0.004);
    }
    set({ mood: newMood });
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
      state.generateDailyJournal();
      state.updateMoodStreaks();
      state.checkDisappearances();
      set({
        todayDate: today, todayFeedTotals: {}, todayFeedCount: 0,
        todayLandmarksVisited: [], todayEncounters: [],
        landmarkStayDurations: {}, lastStayStartTime: Date.now(),
      });
      localSave(get());
      setTimeout(() => cloudSyncTodayMeta(get()), 50);
      setTimeout(() => cloudSyncState(get()), 50);
    }
  },

  generateDailyJournal: () => {
    const state = get();
    const yesterday = state.todayDate;
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

    if (mostStayedLm) {
      const dailyPhoto = generateDailyPhoto(mostStayed, state.mood, yesterday, state.usedPhotoUrls);
      const newUsedUrls = [...state.usedPhotoUrls];
      if (dailyPhoto.photoUrl && !newUsedUrls.includes(dailyPhoto.photoUrl)) newUsedUrls.push(dailyPhoto.photoUrl);
      set((s) => ({ dailyPhotos: [dailyPhoto, ...s.dailyPhotos].slice(0, 60), usedPhotoUrls: newUsedUrls.slice(-200) }));
      const ns = get();
      localSave(ns);
      setTimeout(() => cloudSyncPhoto(dailyPhoto), 50);
      setTimeout(() => cloudSyncState(ns), 50);
    }

    let nightActivity: string | null = null;
    if (state.recentFeeds.some((f) => { const h = new Date(f.timestamp).getHours(); return h >= 23 || h < 6; })) {
      nightActivity = '今晚它没有太早睡。';
    }

    let bottleLine = '';
    const todayStart = new Date(yesterday + 'T00:00:00+08:00').getTime();
    const todayBottles = state.messages.filter((m) => m.timestamp >= todayStart && m.timestamp < todayStart + 86400000);
    if (todayBottles.length > 0) {
      bottleLine = `\n它今天捡到了一张纸条：\n"${todayBottles[Math.floor(Math.random() * todayBottles.length)].text}"\n`;
    }

    const topItemName = feedItems.find((f) => f.id === topItem)?.name || topItem;
    const campusState = getCampusState(state.mood);
    const dateLabel = yesterday.slice(5);

    let content = `「${dateLabel} 校园记录」\n\n`;
    if (hadInteraction) {
      content += `今天共有 ${feedCount} 人次投喂。\n`;
      if (topCount > 0) content += `${topItemName}被投喂了 ${topCount} 次。\n`;
      if (specialItems.length > 0) content += `有人留下了${specialItems.join('、')}。\n`;
    } else {
      content += `今天没有人来投喂，校园里安安静静的。\n但鸽子依然按照自己的节奏生活着。\n`;
    }

    if (state.todayLandmarksVisited.length > 0) {
      content += `\n它今天去了 ${state.todayLandmarksVisited.length} 个地方`;
      if (mostStayedLm) content += `，\n在${mostStayedLm.name}待得最久。`;
      content += '\n';
    } else if (mostStayedLm) {
      content += `\n它今天一直待在${mostStayedLm.name}。\n`;
    }
    if (nightActivity) content += `\n${nightActivity}\n`;
    if (bottleLine) { content += bottleLine; if (mostStayedLm) content += `它后来在${mostStayedLm.name}停留了一会儿。\n`; }

    if (state.todayEncounters.length > 0) {
      content += '\n它今天遇见了：\n';
      for (const cid of state.todayEncounters) { const ch = characters.find((c) => c.id === cid); if (ch) content += `· ${ch.name}\n`; }
    }

    const newlyRemembered = state.rememberedCharacters.filter((c) => c.firstMet >= todayStart);
    if (newlyRemembered.length > 0) {
      content += '\n它今天认识了：\n';
      for (const rc of newlyRemembered) content += `· ${rc.name} — ${rc.silhouette}\n`;
    }

    const moodEnding = generateMoodEnding(state.mood);
    if (moodEnding) content += `\n${moodEnding}\n`;
    const streakNote = generateStreakNote(state.moodStreaks);
    if (streakNote) content += `\n${streakNote}\n`;
    const seasonalNote = generateSeasonalNote(campusState);
    if (seasonalNote) content += `\n${seasonalNote}\n`;

    const journal: DailyJournal = {
      id: `journal-${yesterday}`, date: yesterday, feedCount,
      topFeedItem: topItemName, topFeedCount: topCount, specialItems,
      landmarksVisited: state.todayLandmarksVisited.length > 0 ? state.todayLandmarksVisited : [state.currentLandmarkId],
      mostStayedLandmark: mostStayedLm?.name || '思源湖', nightActivity, campusState,
      hasUmbrella: (state.feedTotals['umbrella'] || 0) > 0, content,
    };

    set((s) => ({ journalEntries: [journal, ...s.journalEntries].slice(0, 30) }));
    localSave(get());
    setTimeout(() => cloudSyncJournal(journal), 50);
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

  let bottleInfluence: string | null = null;
  const recentlyPicked = state.messages.find((m) => m.pickedByPigeon && m.status === 'picked' && Date.now() - m.timestamp < 300000);
  if (recentlyPicked) {
    if (/包图|图书馆|书|学习/.test(recentlyPicked.text)) bottleInfluence = 'library';
    else if (/湖|晚霞|傍晚|风|水/.test(recentlyPicked.text)) bottleInfluence = 'lake';
    else if (/回家|离开|校门|走/.test(recentlyPicked.text)) bottleInfluence = 'gate';
    else if (/草坪|太阳|暖|草地|晒太阳/.test(recentlyPicked.text)) bottleInfluence = 'lawn';
  }

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

    if (tod === 'dawn' && lm.id === 'east-gate') score *= 1.8;
    if (tod === 'morning' && lm.category === 'academic') score *= 1.3;
    if (tod === 'afternoon' && lm.category === 'nature') score *= 1.3;
    if (tod === 'evening' && (lm.id === 'siyuan-lake' || lm.id === 'zhiyuan-lake')) score *= 1.5;
    if (tod === 'night' && (lm.category === 'academic' || lm.category === 'culture')) score *= 1.3;
    if (tod === 'night' && lm.id === 'dorm-area') score *= 1.5;

    if (campusState === 'exam' && (lm.category === 'academic' || lm.category === 'culture')) score *= 1.4;
    if (campusState === 'spring' && lm.category === 'nature') score *= 1.4;
    if (campusState === 'graduation' && lm.category === 'gate') score *= 1.5;

    if (lm.id === 'siyuan-lake') score *= 2.5;
    if ((tod === 'night' || tod === 'dawn') && lm.id === 'siyuan-lake') score *= 1.8;
    if (tod === 'morning' && lm.id === 'siyuan-lake' && state.currentLandmarkId === 'siyuan-lake') score *= 0.4;

    if (bottleInfluence === 'library' && lm.id === 'baoyugang-library') score *= 3.0;
    if (bottleInfluence === 'lake' && (lm.id === 'siyuan-lake' || lm.id === 'zhiyuan-lake')) score *= 3.0;
    if (bottleInfluence === 'gate' && lm.category === 'gate') score *= 3.0;
    if (bottleInfluence === 'lawn' && lm.id === 'seiee-lawn') score *= 3.0;

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
    stress: ['最近压力好像有点大。鸽子也是。', '它注意到校园里每个人都很忙碌。鸽子想，有时候停一下也没关系的。'],
    romance: ['它觉得今天校园里的空气都是甜的。', '鸽子今天看到了很温柔的画面。'],
    social: ['鸽子今天好像交到了新朋友。当然是它单方面宣布的。', '人多的地方真热闹。鸽子喜欢这种被包围的感觉。'],
    loneliness: ['它今天大部分时间都是一个人。但一个人也挺好的。', '安静的时候，鸽子会想很多事情。想着想着天就黑了。'],
    energy: ['它在校园里飞了好几圈，停不下来。', '今天精力旺盛得不像一只鸽子。'],
    warmth: ['今天阳光很好，鸽子心情也不错。', '暖洋洋的一天。鸽子在阳光里摊成了一张鸽子饼。'],
    academic: ['它最近好像特别喜欢往图书馆跑。', '做一只爱学习的鸽子，也不错。'],
    slack: ['鸽子今天宣布：摸鱼是基本鸽权。', '今天的鸽子没有目标，没有计划，只有阳光和风。'],
  } as Record<string, string[]>)[domKey];
  if (domVal >= 55 && pool) return pool[Math.floor(Math.random() * pool.length)];
  if (Math.random() < 0.4) return ['咕咕的一天，就这样过去了。', '鸽子觉得，今天是个好日子。'][Math.floor(Math.random() * 2)];
  return null;
}

function generateStreakNote(streaks: Record<string, number>): string | null {
  const notes: string[] = [];
  if ((streaks['academic'] || 0) >= 3) notes.push('鸽子最近好像特别爱学习。已经连续几天往教学楼和图书馆跑了。');
  if ((streaks['slack'] || 0) >= 3) notes.push('鸽子最近摸鱼摸得有点过分了。但它觉得没关系——放松也是生活的一部分。');
  if ((streaks['social'] || 0) >= 3) notes.push('它最近每天都往人多的地方去。好像在人群中找到了属于自己的位置。');
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
