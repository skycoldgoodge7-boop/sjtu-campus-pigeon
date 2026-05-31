// ====== 情绪维度 ======
export interface CampusMood {
  stress: number;      // 压力
  romance: number;     // 浪漫
  social: number;      // 社交
  loneliness: number;  // 孤独
  energy: number;      // 活力
  warmth: number;      // 温暖
  academic: number;    // 学术
  slack: number;       // 摸鱼
}

// ====== 投喂物品 ======
export type FeedItemId = 'bread' | 'coffee' | 'milkTea' | 'noodles' | 'fries' | 'flower' | 'umbrella' | 'headphone' | 'book' | 'scarf' | 'camera' | 'note';

export interface FeedItem {
  id: FeedItemId;
  name: string;
  emoji: string;
  moodEffect: Partial<CampusMood>;
  thoughtBubbles: string[];
}

// ====== 地图地标位置 ======
export interface MapPosition {
  landmarkId: string;
  leftPercent: number;
  topPercent: number;
  labelPosition: 'top' | 'bottom' | 'left' | 'right';
}

// ====== 校园状态 ======
export type CampusState = 'normal' | 'exam' | 'spring' | 'graduation';

// ====== 时间 ======
export type TimeOfDay = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';

// ====== 鸽子活动 ======
export type PigeonActivity =
  | 'idle' | 'walking' | 'eating' | 'sleeping' | 'dancing'
  | 'thinking' | 'preening' | 'cooing'
  | 'observing' | 'perching' | 'circling' | 'hopping' | 'approaching' | 'sheltering';

// ====== 每日记录 ======
export interface DailyJournal {
  id: string;
  date: string;           // YYYY-MM-DD
  feedCount: number;
  topFeedItem: string;
  topFeedCount: number;
  specialItems: string[];
  landmarksVisited: string[];
  mostStayedLandmark: string;
  nightActivity: string | null;
  campusState: CampusState;
  hasUmbrella: boolean;
  content: string;         // Generated text
}

// ====== 照片卡片 ======
export interface PhotoCard {
  id: string;
  timestamp: number;
  landmarkId: string;
  landmarkName: string;
  landmarkEmoji: string;
  timeOfDay: TimeOfDay;
  campusState: CampusState;
  dominantMood: string;
  moodValue: number;
  sceneEmojis: string[];
  caption: string;
  gradient: [string, string];
  photoUrl?: string;
  isEasterEgg?: boolean;
}

// ====== 漂流瓶留言 ======
export interface DriftBottle {
  id: string;
  timestamp: number;
  emoji: string;
  text: string;
  status: 'floating' | 'picked' | 'sunken';
  pickedByPigeon: boolean;
}

// ====== 飞行轨迹 ======
export interface FlightTrail {
  fromId: string;
  toId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  timestamp: number;
}

// ====== 投喂日志 ======
export interface FeedLogEntry {
  itemId: FeedItemId;
  itemEmoji: string;
  itemName: string;
  timestamp: number;
}

// ====== 校园观察档案 ======
export interface RememberedCharacter {
  characterId: string;
  name: string;
  silhouette: string;
  type: 'animal' | 'person' | 'presence';
  /** 0=仅痕迹 1=观察到 2=认识 3=熟悉 */
  stage: number;
  firstMet: number;
  lastSeen: number;
  encounterCount: number;
  landmarkId: string;
  /** 是否已消失 */
  disappeared?: boolean;
  /** 消失时间戳 */
  disappearedAt?: number;
}

// ====== 想法气泡 ======
export interface PigeonBubble {
  text: string;
  emoji: string;
  expiresAt: number;
}
