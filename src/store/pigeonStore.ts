import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

interface PigeonState {
  // Pigeon location
  currentLandmarkId: string;
  pigeonActivity: PigeonActivity;
  lastActivityTimestamp: number;
  stayUntil: number;           // Cannot move before this timestamp
  currentPath: number[] | null;  // Current road path points

  // Status text
  recentStatusText: string | null;
  statusTextExpiresAt: number;

  // Feeding data
  feedTotals: Record<string, number>;
  todayFeedTotals: Record<string, number>;
  todayFeedCount: number;
  todayDate: string;
  todayLandmarksVisited: string[];

  // Mood
  mood: CampusMood;

  // Content
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

  // Actions
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

export const usePigeonStore = create<PigeonState>()(
  persist(
    (set, get) => ({
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

      setStatusText: (text, durationMs = 4000) => {
        set({ recentStatusText: text, statusTextExpiresAt: Date.now() + durationMs });
      },

      // ======== 偶遇 / 留下印象 ========
      recordTrace: (characterId) => {
        const state = get();
        const traces = { ...state.characterTraces };
        traces[characterId] = (traces[characterId] || 0) + 1;
        set({ characterTraces: traces });
      },

      rememberCharacter: (characterId, landmarkId) => {
        const state = get();
        const now = Date.now();
        const char = characters.find((c) => c.id === characterId);
        if (!char) return;

        const existing = state.rememberedCharacters.find((c) => c.characterId === characterId);
        const traceCount = state.characterTraces[characterId] || 0;

        // Determine stage: 0=trace 1=observed 2=known 3=familiar
        let stage = 0;
        if (existing) {
          const count = existing.encounterCount + 1;
          if (count >= 5) stage = 3;
          else if (count >= 3) stage = 2;
          else stage = 1;
        } else {
          stage = traceCount >= char.traceThreshold ? 1 : 0;
        }

        let updated: RememberedCharacter[];
        if (existing) {
          updated = state.rememberedCharacters.map((c) =>
            c.characterId === characterId
              ? { ...c, lastSeen: now, encounterCount: c.encounterCount + 1, landmarkId, stage, disappeared: false }
              : c
          );
        } else {
          updated = [
            ...state.rememberedCharacters,
            {
              characterId, name: char.name, silhouette: char.silhouette,
              type: char.type, stage, firstMet: now, lastSeen: now,
              encounterCount: 1, landmarkId,
            },
          ];
        }

        const todayEncounters = state.todayEncounters.includes(characterId)
          ? state.todayEncounters
          : [...state.todayEncounters, characterId];

        // Clear traces once recognized
        const newTraces = { ...state.characterTraces };
        delete newTraces[characterId];

        set({ rememberedCharacters: updated, todayEncounters, characterTraces: newTraces });
      },

      updateMoodStreaks: () => {
        const state = get();
        const streaks = { ...state.moodStreaks };
        const mood = state.mood;

        // For each tracked mood dimension, increment or reset streak
        const trackedDimensions: (keyof CampusMood)[] = ['academic', 'social', 'slack', 'romance'];
        for (const dim of trackedDimensions) {
          if ((mood[dim] || 0) >= 50) {
            streaks[dim] = (streaks[dim] || 0) + 1;
          } else {
            streaks[dim] = 0;
          }
        }

        set({ moodStreaks: streaks });
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

          if (cond.campusState && cond.campusState.includes(campusState)) {
            shouldDisappear = true;
          }
          if (cond.moodMax) {
            for (const [key, val] of Object.entries(cond.moodMax)) {
              if ((state.mood[key as keyof CampusMood] || 0) > (val as number)) {
                shouldDisappear = false;
              }
            }
          }

          if (shouldDisappear) {
            updated = updated.map((c) =>
              c.characterId === char.id
                ? { ...c, disappeared: true, disappearedAt: Date.now() }
                : c
            );
          }
        }

        if (updated !== state.rememberedCharacters) {
          set({ rememberedCharacters: updated });
        }
      },

      getActiveInfluences: () => {
        const state = get();
        const now = Date.now();
        const recent = state.rememberedCharacters.filter(
          (c) => now - c.lastSeen < 2 * 60 * 60 * 1000 && !c.disappeared
        );
        return recent
          .map((rc) => characters.find((c) => c.id === rc.characterId)?.influence)
          .filter(Boolean) as CharacterInfluence[];
      },

      // ======== 投喂 ========
      feedPigeon: (itemId: FeedItemId) => {
        const state = get();
        state.resetTodayIfNeeded();

        const item = feedItems.find((f) => f.id === itemId);
        if (!item) return;

        const last10 = state.recentFeeds.slice(-10);
        const sameCount = last10.filter((f) => f.itemId === itemId).length;
        let penalty = 1.0;
        if (sameCount <= 2) penalty = 1.0;
        else if (sameCount <= 4) penalty = 0.5;
        else penalty = 0.1;

        const newTotals = { ...state.feedTotals };
        newTotals[itemId] = (newTotals[itemId] || 0) + 1;

        const newTodayTotals = { ...state.todayFeedTotals };
        newTodayTotals[itemId] = (newTodayTotals[itemId] || 0) + 1;

        const newMood = { ...state.mood };
        if (item.moodEffect) {
          for (const [key, delta] of Object.entries(item.moodEffect)) {
            if (delta) {
              newMood[key as keyof CampusMood] = clamp(
                newMood[key as keyof CampusMood] + delta * penalty
              );
            }
          }
        }

        const logEntry: FeedLogEntry = {
          itemId, itemEmoji: item.emoji, itemName: item.name, timestamp: Date.now(),
        };

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

        setTimeout(() => {
          const s = get();
          if (s.pigeonActivity === 'eating') set({ pigeonActivity: 'idle' });
        }, 3000);
      },

      // ======== 鸽子AI (慢速真实版) ========
      tickPigeonAI: () => {
        const state = get();
        const now = Date.now();
        const hour = new Date().getHours();

        // Track stay duration at current landmark
        const stayElapsed = now - state.lastStayStartTime;
        const durations = { ...state.landmarkStayDurations };
        durations[state.currentLandmarkId] = (durations[state.currentLandmarkId] || 0) + stayElapsed;

        // If still in stay period, don't move
        if (state.stayUntil > now && state.pigeonActivity !== 'walking') {
          // Only update activity, don't move
          const activity = selectStationaryActivity(state.mood, hour, state.currentLandmarkId);
          if (activity !== state.pigeonActivity && Math.random() < 0.3) {
            set({ pigeonActivity: activity });
          }
          set({ landmarkStayDurations: durations, lastStayStartTime: now });
          return;
        }

        // Night: mostly sleeping
        if (hour >= 23 || hour < 6) {
          if (Math.random() < 0.92) {
            set({ pigeonActivity: 'sleeping' });
            return;
          }
        }

        // Move decision — much lower probability
        let moveChance = 0.2; // Base: only 20% per tick (was 35%)
        if (hour >= 7 && hour < 11) moveChance += 0.1;
        if (state.mood.energy > 70) moveChance += 0.08;
        if (state.mood.slack > 70) moveChance -= 0.08;

        // If recently fed with energy items, slightly more active
        const recentFeeds5 = state.recentFeeds.slice(-5);
        if (recentFeeds5.some((f) => f.itemId === 'coffee')) moveChance += 0.05;

        if (Math.random() < moveChance) {
          const dest = selectDestination(state);
          if (dest && dest !== state.currentLandmarkId) {
            // Find road path between current and destination
            const path = findPath(state.currentLandmarkId, dest);
            const fromPos = MAP_POSITIONS.find((p) => p.landmarkId === state.currentLandmarkId);
            const toPos = MAP_POSITIONS.find((p) => p.landmarkId === dest);

            // Record flight trail
            if (fromPos && toPos) {
              const trail: FlightTrail = {
                fromId: state.currentLandmarkId, toId: dest,
                fromX: fromPos.leftPercent, fromY: fromPos.topPercent,
                toX: toPos.leftPercent, toY: toPos.topPercent,
                timestamp: now,
              };
              set({ flightTrails: [trail, ...state.flightTrails].slice(0, 3) });
            }

            // Calculate stay duration for new location
            const config = LANDMARK_CONFIGS.find((l) => l.id === dest);
            const zone = config?.zone || 'medium';
            const stayRange = STAY_TIMES[zone];
            const stayDuration = stayRange.min + Math.random() * (stayRange.max - stayRange.min);

            const visited = [...state.lastVisited, dest].slice(-5);
            const todayVisited = state.todayLandmarksVisited.includes(dest)
              ? state.todayLandmarksVisited
              : [...state.todayLandmarksVisited, dest];

            set({
              currentLandmarkId: dest,
              pigeonActivity: 'walking',
              lastActivityTimestamp: now,
              stayUntil: now + stayDuration,
              currentPath: path,
              lastVisited: visited,
              todayLandmarksVisited: todayVisited,
              lastStayStartTime: now,
              landmarkStayDurations: durations,
              totalFlights: state.totalFlights + 1,
            });

            // Arrive after transition (slower for longer paths)
            const travelTime = path ? 6000 + path.length * 200 : 8000;
            setTimeout(() => {
              const cur = get();
              if (cur.currentLandmarkId === dest && cur.pigeonActivity === 'walking') {
                set({ pigeonActivity: 'idle', currentPath: null });
              }
            }, travelTime);

            return;
          }
        }

        // Stay in place — update activity
        const activity = selectStationaryActivity(state.mood, hour, state.currentLandmarkId);
        set({ pigeonActivity: activity, lastActivityTimestamp: now, landmarkStayDurations: durations, lastStayStartTime: now });

        // Maybe interact with a drift bottle (5% chance)
        if (Math.random() < 0.05) {
          const floatingBottles = state.messages.filter((m) => m.status === 'floating');
          if (floatingBottles.length > 0) {
            const bottle = floatingBottles[Math.floor(Math.random() * floatingBottles.length)];
            const updatedMessages = state.messages.map((m) =>
              m.id === bottle.id ? { ...m, status: 'picked' as const, pickedByPigeon: true } : m
            );
            set({
              messages: updatedMessages,
              recentStatusText: '它捡到了一张纸条',
              statusTextExpiresAt: Date.now() + 6000,
            });
          }
        }

        // Maybe encounter a character (10% chance per tick)
        if (Math.random() < 0.10) {
          checkEncounters(get, state.currentLandmarkId, hour, state.mood);
        }
      },

      // ======== 漂流瓶：投放 ========
      postMessage: (emoji: string, text: string) => {
        if (!text.trim()) return;
        const bottle: DriftBottle = {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(), emoji, text: text.trim().slice(0, 30),
          status: 'floating', pickedByPigeon: false,
        };
        set((s) => ({ messages: [bottle, ...s.messages].slice(0, 100) }));
      },

      // ======== 漂流瓶：捞取 ========
      retrieveBottle: () => {
        const state = get();
        const floating = state.messages.filter((m) => m.status === 'floating');
        if (floating.length === 0) return null;
        const bottle = floating[Math.floor(Math.random() * floating.length)];
        return bottle;
      },

      // ======== 情绪衰减 + 漂流瓶沉没 ========
      decayMood: () => {
        const state = get();
        const newMood = { ...state.mood };
        for (const key of Object.keys(newMood) as (keyof CampusMood)[]) {
          const diff = newMood[key] - 50;
          newMood[key] = clamp(newMood[key] - diff * 0.004);
        }
        set({ mood: newMood });
        state.sinkOldBottles();
      },

      // ======== 24h沉没 ========
      sinkOldBottles: () => {
        const state = get();
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        const updated = state.messages.map((m) =>
          m.timestamp < cutoff && m.status === 'floating'
            ? { ...m, status: 'sunken' as const }
            : m
        );
        if (updated.some((m, i) => m.status !== state.messages[i].status)) {
          set({ messages: updated });
        }
      },

      // ======== 日期重置 ========
      resetTodayIfNeeded: () => {
        const today = getTodayDateString();
        const state = get();
        if (state.todayDate !== today) {
          // Always generate a daily journal — even with no human interaction
          // The pigeon lives its own life regardless
          state.generateDailyJournal();
          state.updateMoodStreaks();
          state.checkDisappearances();
          set({
            todayDate: today, todayFeedTotals: {}, todayFeedCount: 0,
            todayLandmarksVisited: [], todayEncounters: [],
            landmarkStayDurations: {}, lastStayStartTime: Date.now(),
          });
        }
      },

      // ======== 每日记录（含漂流瓶） ========
      generateDailyJournal: () => {
        const state = get();
        const yesterday = state.todayDate;
        const feedCount = state.todayFeedCount;
        const hadInteraction = feedCount > 0;

        let topItem = '面包';
        let topCount = 0;
        const specialItems: string[] = [];
        for (const [itemId, count] of Object.entries(state.todayFeedTotals)) {
          if (count > topCount) { topItem = itemId; topCount = count; }
        }
        for (const id of ['umbrella', 'camera', 'note', 'scarf', 'flower']) {
          if (state.todayFeedTotals[id] && state.todayFeedTotals[id] > 0) {
            const item = feedItems.find((f) => f.id === id);
            if (item) specialItems.push(item.name);
          }
        }

        // Find most-stayed landmark from actual duration tracking
        // Prioritize landmarks that have photo cards (user-uploaded photos)
        let mostStayed = state.currentLandmarkId;
        let maxDuration = 0;
        for (const [lid, dur] of Object.entries(state.landmarkStayDurations)) {
          if (dur > maxDuration) { maxDuration = dur; mostStayed = lid; }
        }
        // If no duration data (pigeon stayed in one place), use current location
        if (maxDuration === 0) {
          mostStayed = state.currentLandmarkId;
        }
        const mostStayedLm = landmarks.find((l) => l.id === mostStayed);

        // Generate daily photo for the most-stayed place
        // The photo comes from the photo card upload location
        if (mostStayedLm) {
          const dailyPhoto = generateDailyPhoto(mostStayed, state.mood, yesterday, state.usedPhotoUrls);
          const newUsedUrls = [...state.usedPhotoUrls];
          if (dailyPhoto.photoUrl && !newUsedUrls.includes(dailyPhoto.photoUrl)) {
            newUsedUrls.push(dailyPhoto.photoUrl);
          }
          set((s) => ({
            dailyPhotos: [dailyPhoto, ...s.dailyPhotos].slice(0, 60),
            usedPhotoUrls: newUsedUrls.slice(-200),
          }));
        }

        let nightActivity: string | null = null;
        const nightFeeds = state.recentFeeds.filter((f) => {
          const h = new Date(f.timestamp).getHours();
          return h >= 23 || h < 6;
        });
        if (nightFeeds.length > 0) {
          nightActivity = '今晚它没有太早睡。';
        }

        // Pick a random bottle from today
        let bottleLine = '';
        const todayStart = new Date(yesterday + 'T00:00:00+08:00').getTime();
        const todayBottles = state.messages.filter(
          (m) => m.timestamp >= todayStart && m.timestamp < todayStart + 86400000
        );
        if (todayBottles.length > 0) {
          const randomBottle = todayBottles[Math.floor(Math.random() * todayBottles.length)];
          bottleLine = `\n它今天捡到了一张纸条：\n"${randomBottle.text}"\n`;
        }

        const topItemName = feedItems.find((f) => f.id === topItem)?.name || topItem;
        const dateLabel = yesterday.slice(5);
        const campusState = getCampusState(state.mood);

        let content = `「${dateLabel} 校园记录」\n\n`;

        if (hadInteraction) {
          // Normal day with human interaction
          content += `今天共有 ${feedCount} 人次投喂。\n`;
          if (topCount > 0) {
            content += `${topItemName}被投喂了 ${topCount} 次。\n`;
          }
          if (specialItems.length > 0) {
            content += `有人留下了${specialItems.join('、')}。\n`;
          }
        } else {
          // Day with no human interaction — pigeon still lives its life
          content += `今天没有人来投喂，校园里安安静静的。\n`;
          content += `但鸽子依然按照自己的节奏生活着。\n`;
        }

        const visitedCount = state.todayLandmarksVisited.length;
        if (visitedCount > 0) {
          content += `\n它今天去了 ${visitedCount} 个地方`;
          if (mostStayedLm) {
            content += `，\n在${mostStayedLm.name}待得最久。`;
          }
          content += '\n';
        } else if (mostStayedLm) {
          content += `\n它今天一直待在${mostStayedLm.name}。\n`;
        }
        if (nightActivity) content += `\n${nightActivity}\n`;

        // Add bottle quote
        if (bottleLine) {
          content += bottleLine;
          if (mostStayedLm) {
            content += `它后来在${mostStayedLm.name}停留了一会儿。\n`;
          }
        }

        // Add today's encounters
        if (state.todayEncounters.length > 0) {
          content += '\n它今天遇见了：\n';
          for (const cid of state.todayEncounters) {
            const char = characters.find((c) => c.id === cid);
            if (char) content += `· ${char.name}\n`;
          }
        }

        // Add newly remembered characters
        const newlyRemembered = state.rememberedCharacters.filter(
          (c) => c.firstMet >= todayStart
        );
        if (newlyRemembered.length > 0) {
          content += '\n它今天认识了：\n';
          for (const rc of newlyRemembered) {
            content += `· ${rc.name} — ${rc.silhouette}\n`;
          }
        }

        // ──── 鸽子的小情绪 ────
        const moodEnding = generateMoodEnding(state.mood);
        if (moodEnding) {
          content += `\n${moodEnding}\n`;
        }

        // ──── 特殊日子检测 ────
        const streakNote = generateStreakNote(state.moodStreaks);
        if (streakNote) {
          content += `\n${streakNote}\n`;
        }

        // ──── 季节性点缀 ────
        const seasonalNote = generateSeasonalNote(campusState);
        if (seasonalNote) {
          content += `\n${seasonalNote}\n`;
        }

        const journal: DailyJournal = {
          id: `journal-${yesterday}`,
          date: yesterday, feedCount, topFeedItem: topItemName, topFeedCount: topCount,
          specialItems,
          landmarksVisited: state.todayLandmarksVisited.length > 0
            ? state.todayLandmarksVisited
            : [state.currentLandmarkId],
          mostStayedLandmark: mostStayedLm?.name || '思源湖',
          nightActivity, campusState,
          hasUmbrella: (state.feedTotals['umbrella'] || 0) > 0,
          content,
        };

        set((s) => ({
          journalEntries: [journal, ...s.journalEntries].slice(0, 30),
        }));
      },
    }),
    {
      name: 'sjtu-campus-pigeon',
      partialize: (state) => ({
        currentLandmarkId: state.currentLandmarkId,
        stayUntil: state.stayUntil,
        feedTotals: state.feedTotals,
        todayFeedTotals: state.todayFeedTotals,
        todayFeedCount: state.todayFeedCount,
        todayDate: state.todayDate,
        todayLandmarksVisited: state.todayLandmarksVisited,
        mood: state.mood,
        photos: state.photos.slice(0, 80),
        dailyPhotos: state.dailyPhotos.slice(0, 60),
        messages: state.messages.slice(0, 100),
        recentFeeds: state.recentFeeds.slice(-20),
        lastVisited: state.lastVisited,
        flightTrails: state.flightTrails.slice(0, 3),
        journalEntries: state.journalEntries.slice(0, 30),
        rememberedCharacters: state.rememberedCharacters,
        characterTraces: state.characterTraces,
        moodStreaks: state.moodStreaks,
        landmarkStayDurations: state.landmarkStayDurations,
        lastStayStartTime: state.lastStayStartTime,
        usedPhotoUrls: state.usedPhotoUrls.slice(-200),
        totalFlights: state.totalFlights,
      }),
    }
  )
);

// ======== AI Helpers ========

function findPath(fromId: string, toId: string): number[] | null {
  // Direct path
  const direct = ROAD_PATHS.find(
    (rp) => (rp.from === fromId && rp.to === toId) || (rp.from === toId && rp.to === fromId)
  );
  if (direct) {
    // If reversed, reverse the points
    if (direct.from === toId) {
      const reversed: number[] = [];
      for (let i = direct.points.length - 2; i >= 0; i -= 2) {
        reversed.push(direct.points[i], direct.points[i + 1]);
      }
      return reversed;
    }
    return [...direct.points];
  }

  // No path — return null (direct flight)
  return null;
}

function selectDestination(state: PigeonState): string | null {
  const tod = getTimeOfDay();
  const campusState = getCampusState(state.mood);

  // Check if pigeon recently picked up a bottle → influence destination
  let bottleInfluence: string | null = null;
  const recentlyPicked = state.messages.find(
    (m) => m.pickedByPigeon && m.status === 'picked' && Date.now() - m.timestamp < 300000
  );
  if (recentlyPicked) {
    const text = recentlyPicked.text;
    if (/包图|图书馆|书|学习/.test(text)) bottleInfluence = 'library';
    else if (/湖|晚霞|傍晚|风|水/.test(text)) bottleInfluence = 'lake';
    else if (/回家|离开|校门|走/.test(text)) bottleInfluence = 'gate';
    else if (/草坪|太阳|暖|草地|晒太阳/.test(text)) bottleInfluence = 'lawn';
  }

  let bestId: string | null = null;
  let bestScore = -1;

  for (const lm of landmarks) {
    const config = LANDMARK_CONFIGS.find((c) => c.id === lm.id);
    const zone = config?.zone || 'medium';

    let score = 0.3 + Math.random() * 0.7;

    // Zone preference: core locations more likely
    if (zone === 'core') score *= 2.0;
    else if (zone === 'medium') score *= 1.2;
    else score *= 0.5;

    // Distance from current
    const distWeight = getDistanceWeight(state.currentLandmarkId, lm.id);
    score *= distWeight;

    // Mood
    if (state.mood.academic > 60 && (lm.category === 'academic' || lm.category === 'culture')) score *= 1.5;
    if (state.mood.romance > 60 && lm.category === 'nature') score *= 1.5;
    if (state.mood.energy > 60 && lm.category === 'sports') score *= 1.5;
    if (state.mood.social > 60 && (lm.category === 'dining' || lm.category === 'culture')) score *= 1.4;

    // Time
    if (tod === 'dawn' && lm.id === 'east-gate') score *= 1.8;
    if (tod === 'morning' && lm.category === 'academic') score *= 1.3;
    if (tod === 'afternoon' && lm.category === 'nature') score *= 1.3;
    if (tod === 'evening' && (lm.id === 'siyuan-lake' || lm.id === 'zhiyuan-lake')) score *= 1.5;
    if (tod === 'night' && (lm.category === 'academic' || lm.category === 'culture')) score *= 1.3;
    if (tod === 'night' && lm.id === 'dorm-area') score *= 1.5;

    // Campus state
    if (campusState === 'exam' && (lm.category === 'academic' || lm.category === 'culture')) score *= 1.4;
    if (campusState === 'spring' && lm.category === 'nature') score *= 1.4;
    if (campusState === 'graduation' && lm.category === 'gate') score *= 1.5;

    // Home base: Siyuan Lake is the pigeon's primary gathering place
    if (lm.id === 'siyuan-lake') score *= 2.5;
    // Return home at night
    if ((tod === 'night' || tod === 'dawn') && lm.id === 'siyuan-lake') score *= 1.8;
    // Morning start from home
    if (tod === 'morning' && lm.id === 'siyuan-lake' && state.currentLandmarkId === 'siyuan-lake') score *= 0.4;

    // Bottle influence
    if (bottleInfluence === 'library' && lm.id === 'baoyugang-library') score *= 3.0;
    if (bottleInfluence === 'lake' && (lm.id === 'siyuan-lake' || lm.id === 'zhiyuan-lake')) score *= 3.0;
    if (bottleInfluence === 'gate' && lm.category === 'gate') score *= 3.0;
    if (bottleInfluence === 'lawn' && lm.id === 'seiee-lawn') score *= 3.0;

    // Character influences on destination choice
    for (const inf of state.getActiveInfluences()) {
      if (inf.landmarkBonus) {
        if (inf.landmarkBonus.landmarkId && lm.id === inf.landmarkBonus.landmarkId) {
          score *= inf.landmarkBonus.multiplier;
        }
        if (inf.landmarkBonus.category && lm.category === inf.landmarkBonus.category) {
          score *= inf.landmarkBonus.multiplier;
        }
      }
    }

    // Penalize current and recent
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
    { activity: 'idle',       weight: 15 },
    { activity: 'preening',   weight: 10 + (mood.warmth > 60 ? 5 : 0) },
    { activity: 'thinking',   weight: 10 + (mood.academic > 60 ? 5 : 0) },
    { activity: 'eating',     weight: zone === 'core' ? 10 : 6 },
    { activity: 'sleeping',   weight: 5 + (mood.slack > 60 ? 10 : 0) + (hour >= 13 && hour <= 16 ? 6 : 0) + (hour >= 23 ? 20 : 0) },
  ];

  // Category-specific behaviors
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
  if (zone === 'core') {
    pool.push({ activity: 'approaching', weight: 4 + (mood.social > 60 ? 6 : 0) });
  }
  if (hour >= 21 || hour < 7) {
    pool.push({ activity: 'sheltering', weight: 4 });
  }

  const total = pool.reduce((s, a) => s + a.weight, 0);
  let r = Math.random() * total;
  for (const a of pool) {
    r -= a.weight;
    if (r <= 0) return a.activity;
  }
  return 'idle';
}

function checkEncounters(
  get: () => PigeonState,
  currentLandmarkId: string,
  _hour: number,
  mood: CampusMood
) {
  const state = get();
  const tod = getTimeOfDay();
  const campusState = getCampusState(mood);

  for (const char of characters) {
    // Skip if already fully encountered today
    if (state.todayEncounters.includes(char.id)) continue;
    // Skip disappeared characters
    const existing = state.rememberedCharacters.find((c) => c.characterId === char.id);
    if (existing?.disappeared) continue;

    const cond = char.condition;

    // Check landmark
    if (cond.landmarks && !cond.landmarks.includes(currentLandmarkId)) continue;
    // Check time of day
    if (cond.timeOfDay && !cond.timeOfDay.includes(tod)) continue;
    // Check campus state
    if (cond.campusState && !cond.campusState.includes(campusState)) continue;
    // Check mood minimums
    if (cond.moodMin) {
      let moodMatch = true;
      for (const [key, val] of Object.entries(cond.moodMin)) {
        if ((mood[key as keyof CampusMood] || 0) < (val as number)) {
          moodMatch = false; break;
        }
      }
      if (!moodMatch) continue;
    }

    // Check consecutive days via mood streaks
    if (cond.consecutiveDays) {
      const { mood: targetMood, threshold, days } = cond.consecutiveDays;
      const streakDays = state.moodStreaks[targetMood] || 0;
      if (streakDays < days || mood[targetMood] < threshold) continue;
    }

    // Random encounter chance
    if (Math.random() < 0.25) {
      const traceCount = state.characterTraces[char.id] || 0;
      const threshold = char.traceThreshold;

      if (char.isRumor || (!existing && traceCount < threshold)) {
        // Level 1: trace — record it but don't reveal who
        // Rumors always stay as traces, never recognized
        usePigeonStore.getState().recordTrace(char.id);
        usePigeonStore.setState({
          recentStatusText: char.traceHint,
          statusTextExpiresAt: Date.now() + 5000,
        });
      } else {
        // Level 2+: full encounter — reveal character
        const landmark = landmarks.find((l) => l.id === currentLandmarkId);
        usePigeonStore.getState().rememberCharacter(char.id, currentLandmarkId);

        // Different status text based on familiarity
        const afterRemembered = get().rememberedCharacters.find((c) => c.characterId === char.id);
        const count = (afterRemembered?.encounterCount || 1);
        let statusText: string;
        if (count <= 1) {
          statusText = char.firstMet;
        } else if (count <= 3) {
          statusText = `它又在${landmark?.name || '附近'}看到了${char.name}`;
        } else {
          statusText = char.observationLevels[Math.min(2, Math.floor((count - 1) / 3))];
        }

        usePigeonStore.setState({
          recentStatusText: statusText,
          statusTextExpiresAt: Date.now() + 6000,
        });
      }
    }
  }
}

// ======== 日志叙事辅助 ========

function generateMoodEnding(mood: CampusMood): string | null {
  // Find dominant mood
  let domKey = '';
  let domVal = 0;
  for (const [key, val] of Object.entries(mood)) {
    if (val > domVal) { domKey = key; domVal = val; }
  }

  const endings: Record<string, string[]> = {
    stress: [
      '最近压力好像有点大。鸽子也是。',
      '它注意到校园里每个人都很忙碌。鸽子想，有时候停一下也没关系的。',
      '鸽子觉得，忙碌的日子总会过去。天还是会亮。',
    ],
    romance: [
      '它觉得今天校园里的空气都是甜的。',
      '鸽子今天看到了很温柔的画面。它的心跳快了一点点。',
      '春天好像还没走远。鸽子觉得一切都刚刚好。',
    ],
    social: [
      '鸽子今天好像交到了新朋友。当然是它单方面宣布的。',
      '人多的地方真热闹。鸽子喜欢这种被包围的感觉。',
      '它今天在人群里穿梭，每个人都行色匆匆，只有鸽子不赶时间。',
    ],
    loneliness: [
      '它今天大部分时间都是一个人。但一个人也挺好的。',
      '安静的时候，鸽子会想很多事情。想着想着天就黑了。',
      '鸽子学会了一个人看日落。日落不需要说话，它只需要被看见。',
    ],
    energy: [
      '它在校园里飞了好几圈，停不下来。',
      '今天精力旺盛得不像一只鸽子。也许明天会累，但今天先飞够。',
      '鸽子觉得自己的翅膀今天特别有力。它飞得很高，风从羽毛间穿过。',
    ],
    warmth: [
      '今天阳光很好，鸽子心情也不错。',
      '暖洋洋的一天。鸽子在阳光里摊成了一张鸽子饼。',
      '它觉得今天遇到的每个人都很温柔。也许鸽子只是心情好。',
    ],
    academic: [
      '它最近好像特别喜欢往图书馆跑。',
      '鸽子虽然看不懂书，但它喜欢那种安静认真的气氛。',
      '做一只爱学习的鸽子，也不错。',
    ],
    slack: [
      '鸽子今天宣布：摸鱼是基本鸽权。',
      '它觉得偶尔什么都不做，就是最好的事。',
      '今天的鸽子没有目标，没有计划，只有阳光和风。',
    ],
  };

  const pool = endings[domKey];
  if (!pool || domVal < 55) {
    // No strong mood — use a generic ending sometimes
    if (Math.random() < 0.4) {
      const generic = [
        '咕咕的一天，就这样过去了。',
        '鸽子觉得，今天是个好日子。',
        '它闭上眼睛。明天又是新的一天。咕。',
      ];
      return generic[Math.floor(Math.random() * generic.length)];
    }
    return null;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

function generateStreakNote(streaks: Record<string, number>): string | null {
  // Check for notable streaks (3+ days)
  const notes: string[] = [];

  if ((streaks['academic'] || 0) >= 3) {
    notes.push('鸽子最近好像特别爱学习。已经连续几天往教学楼和图书馆跑了。');
  }
  if ((streaks['slack'] || 0) >= 3) {
    notes.push('鸽子最近摸鱼摸得有点过分了。但它觉得没关系——放松也是生活的一部分。');
  }
  if ((streaks['social'] || 0) >= 3) {
    notes.push('它最近每天都往人多的地方去。好像在人群中找到了属于自己的位置。');
  }
  if ((streaks['romance'] || 0) >= 3) {
    notes.push('鸽子最近心情一直很好。校园里的风、花、阳光——每一样都让它觉得美好。');
  }

  if (notes.length === 0) return null;
  // Pick one random note if multiple match
  return notes[Math.floor(Math.random() * notes.length)];
}

function generateSeasonalNote(campusState: string): string | null {
  const chance = 0.5; // 50% chance to add seasonal touch
  if (Math.random() > chance) return null;

  const notes: Record<string, string[]> = {
    spring: [
      '校园里的花又开了。鸽子在花瓣里打了个滚，身上沾满了花香。',
      '春天真好。风是暖的，花是香的，鸽子是开心的。',
      '鸽子宣布：春天是最好的季节！证据就是到处都是花。',
    ],
    exam: [
      '考试季的校园有种特别的安静。大家都在埋头努力，鸽子也在旁边默默加油。',
      '它飞过图书馆的时候，看到里面的灯亮到很晚。人，加油啊。',
      '考试季总会过去的。鸽子停在窗台上，等着你们考完出来晒太阳。',
    ],
    graduation: [
      '毕业季到了。鸽子看到很多人在拍照，想把校园的每一个角落都装进相机里。',
      '有人穿着学士袍在校园里走来走去。鸽子想，他们是在跟校园说再见吧。',
      '鸽子不太懂告别。但它知道，飞走的人有时候也会飞回来。',
    ],
    normal: [
      '平平常常的一天。但鸽子觉得，平常的日子最值得珍惜。',
    ],
  };

  const pool = notes[campusState];
  if (!pool) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ======== Shared Helpers ========

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
