// ====== 天气（重导出） ======
export type { WeatherData, WeatherCondition } from '../utils/weather';

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

// ====== 礼物行为标记 ======
export interface GiftFlags {
  hasUmbrella: boolean;
  hasCamera: boolean;
  hasHeadphone: boolean;
  hasScarf: boolean;
  hasFlower: boolean;
}

// ====== 投喂物品 ======
export type FeedItemId = 'bread' | 'coffee' | 'milkTea' | 'noodles' | 'fries' | 'flower' | 'umbrella' | 'headphone' | 'book' | 'scarf' | 'camera' | 'note';

export interface FeedItem {
  id: FeedItemId;
  name: string;
  emoji: string;
  moodEffect: Partial<CampusMood>;
  thoughtBubbles: string[];
  /** 喂食时的叙事反馈（替代"刚刚收到了X"） */
  reactions: string[];
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
  pickedNote?: string;     // 当天鸽子捡到的纸条内容
  pigeonReply?: string;    // 鸽子对纸条的回复
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

// ====== 校园热点 ======
export interface CampusHotspot {
  id: string;
  title: string;
  date: string;           // "YYYY-MM-DD"
  summary: string;
  url: string;
  image_url?: string;
  category: string;
  category_emoji: string;
  mood_effect: Partial<CampusMood>;
  landmark_hint?: string;
  scraped_at: number;
  is_active: boolean;
}

// ====== 每日投票 ======
export interface VoteOption {
  emoji: string;
  text: string;
  moodEffect: Partial<CampusMood>;
  targetLandmark?: string;         // 赢了→鸽子明天从此出发
}

export interface VoteBehaviorMod {
  moveChanceMod: number;       // 移动概率倍率
  activityWeights: Partial<Record<PigeonActivity, number>>;  // 活动权重偏置
}

export interface DailyVote {
  id: string;                  // "vote-YYYY-MM-DD"
  date: string;                // "YYYY-MM-DD"
  question: string;            // AI 生成的问题
  options: VoteOption[];       // 4 选项
  totalVotes: number;
  voteCounts: number[];        // 每选项票数
  winningOption: number;       // 胜出选项索引
  resultMood: string;          // emoji 标签：😊 开心 / 🤔 思考 / 😴 困倦 / 🥳 兴奋
  resultBehaviorModifier: VoteBehaviorMod;
  generatedAt: number;
  tomorrowLandmark?: string;   // 胜出选项的目的地
}

// ====== 用户投票记录 ======
export interface UserVoteRecord {
  date: string;                // "YYYY-MM-DD"
  voteIndex: number;
  rumorVote: 'true' | 'false' | null;       // @deprecated 用 topicVote
  topicVote: 'agree' | 'disagree' | null;   // 今日话题投票
}

// ====== 背包物品 ======
export interface BackpackItem {
  id: string;                  // "backpack-<landmarkId>"
  name: string;
  emoji: string;
  landmarkId: string;
  landmarkName: string;
  collectedAt: string;         // "YYYY-MM-DD"
  description: string;
  rarity: 'common' | 'uncommon' | 'rare';
  /** 预设故事，点击物品时展示 */
  story: string;
}

// ====== 校园传闻 / 今日话题 ======
export interface CampusRumor {
  id: string;                  // "rumor-YYYY-MM-DD"
  date: string;
  content: string;             // AI 生成的内容
  trueVotes: number;           // 认同数
  falseVotes: number;          // 不认同数
  generatedAt: number;
}

/** CampusRumor 的语义别名 — V2.0 后推荐使用 */
export type DailyTopic = CampusRumor;

// ====== 校园日报 ======
export interface DailyNewspaper {
  id: string;                  // "newspaper-YYYY-MM-DD"
  date: string;
  headline: string;            // AI 生成的抓人标题
  interactionCount: number;    // 当日互动总人次
  locationName: string;
  locationEmoji: string;
  itinerary: string[];         // 今日访问的地标名
  todayTopic: string;          // 投票问题
  votingResult: {
    question: string;
    winnerEmoji: string;
    winnerText: string;
    voteDistribution: number[]; // 百分比
    resultMood: string;
  } | null;
  photoId: string | null;
  collectedItems: BackpackItem[];
  rumorContent: string | null;
  pigeonThought: string;       // AI 生成的感悟
  content: string;             // 完整日报文本
}
