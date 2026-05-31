import type { MapPosition } from '../types';

// ====== 频率分区 ======
export type ZoneLevel = 'core' | 'medium' | 'rare';
export type LandmarkCategory = 'gate' | 'academic' | 'nature' | 'sports' | 'culture' | 'dining' | 'dorm' | 'service';

export interface LandmarkConfig {
  id: string;
  zone: ZoneLevel;
  category: LandmarkCategory;
}

// ====== 地标三级视觉权重 ======
export type TierLevel = 1 | 2 | 3;

export interface TierConfig {
  tier: TierLevel;
  scale: number;
  opacity: number;
  fontWeight: number;
  paddingBox: number; // 周围安全距离 %
}

export const TIER_CONFIGS: Record<TierLevel, TierConfig> = {
  1: { tier: 1, scale: 1.20, opacity: 1.0,  fontWeight: 700, paddingBox: 8 },
  2: { tier: 2, scale: 1.0,  opacity: 0.85, fontWeight: 500, paddingBox: 5 },
  3: { tier: 3, scale: 0.68, opacity: 0.55, fontWeight: 400, paddingBox: 3 },
};

// ====== 地标权重分级 ======
export const LANDMARK_TIERS: Record<string, TierLevel> = {
  // ── Tier 1: 核心地标（5个）—— 更大留白、更明显文字 ──
  'siyuan-lake':          1,
  'baoyugang-library':    1,
  'jingjing-hall':        1,
  'new-library':          1,
  'seiee-lawn':           1,

  // ── Tier 2: 主要地标（~25个）—— 正常显示 ──
  'siyuan-gate':          2,
  'temple-gate':          2,
  'triumph-gate':         2,
  'guangming-stadium':    2,
  'minhang-gym':          2,
  'upper-hall':           2,
  'middle-hall':          2,
  'lower-hall':           2,
  'east-upper':           2,
  'east-middle':          2,
  'east-lower':           2,
  'seiee-complex':        2,
  'chenruiqiu-building':  2,
  'ai-school':            2,
  'dining-hall-1':        2,
  'dining-hall-2':        2,
  'dining-hall-3':        2,
  'zhiyuan-lake':         2,
  'student-center':       2,
  'tsungdao-library':     2,
  'koguan-law':           2,
  'antai-school':         2,
  'dorm-area':            2,
  'student-service':      2,

  // ── Tier 3: 边缘地标（~18个）—— 缩小、淡化 ──
  'east-gate':            3,
  'chengji-museum':       3,
  'zhiyuan-tree':         3,
  'rose-garden':          3,
  'botanical-garden':     3,
  'me-school':            3,
  'mse-school':           3,
  'naoce-school':         3,
  'physics-school':       3,
  'chemistry-school':     3,
  'math-school':          3,
  'sfl-school':           3,
  'design-school':        3,
  'media-school':         3,
  'sipa-school':          3,
  'agri-school':          3,
  'life-science-school':  3,
  'pharmacy-school':      3,
  'student-innovation':   3,
  'hufaguang-stadium':    2,
  'south-stadium':        3,
  'humanities-school':    2,
  'tuxin-building':       3,
};

// ====== 地点频率配置 ======
export const LANDMARK_CONFIGS: LandmarkConfig[] = [
  // ── 核心区（高频，停留60-120min）──
  { id: 'siyuan-lake',          zone: 'core', category: 'nature' },
  { id: 'baoyugang-library',    zone: 'core', category: 'culture' },
  { id: 'seiee-lawn',           zone: 'core', category: 'nature' },
  { id: 'dining-hall-2',        zone: 'core', category: 'dining' },
  { id: 'student-center',       zone: 'core', category: 'service' },
  { id: 'new-library',          zone: 'core', category: 'culture' },

  // ── 中频区（偶尔探索，停留40-90min）──
  { id: 'guangming-stadium',    zone: 'medium', category: 'sports' },
  { id: 'rose-garden',          zone: 'medium', category: 'nature' },
  { id: 'dorm-area',            zone: 'medium', category: 'dorm' },
  { id: 'zhiyuan-lake',         zone: 'medium', category: 'nature' },
  { id: 'botanical-garden',     zone: 'medium', category: 'nature' },
  { id: 'dining-hall-1',        zone: 'medium', category: 'dining' },
  { id: 'dining-hall-3',        zone: 'medium', category: 'dining' },
  { id: 'jingjing-hall',        zone: 'medium', category: 'culture' },
  { id: 'minhang-gym',          zone: 'medium', category: 'sports' },
  { id: 'tsungdao-library',     zone: 'medium', category: 'culture' },
  { id: 'student-innovation',   zone: 'medium', category: 'service' },
  // 教学建筑
  { id: 'east-upper',           zone: 'medium', category: 'academic' },
  { id: 'east-middle',          zone: 'medium', category: 'academic' },
  { id: 'east-lower',           zone: 'medium', category: 'academic' },
  { id: 'upper-hall',           zone: 'medium', category: 'academic' },
  { id: 'middle-hall',          zone: 'medium', category: 'academic' },
  { id: 'lower-hall',           zone: 'medium', category: 'academic' },
  { id: 'seiee-complex',        zone: 'medium', category: 'academic' },
  { id: 'chenruiqiu-building',  zone: 'medium', category: 'academic' },
  // 学院
  { id: 'me-school',            zone: 'medium', category: 'academic' },
  { id: 'mse-school',           zone: 'medium', category: 'academic' },
  { id: 'naoce-school',         zone: 'medium', category: 'academic' },
  { id: 'ai-school',            zone: 'medium', category: 'academic' },
  { id: 'design-school',        zone: 'medium', category: 'academic' },
  { id: 'sfl-school',           zone: 'medium', category: 'academic' },
  { id: 'antai-school',         zone: 'medium', category: 'academic' },
  { id: 'media-school',         zone: 'medium', category: 'academic' },
  { id: 'sipa-school',          zone: 'medium', category: 'academic' },
  { id: 'koguan-law',           zone: 'medium', category: 'academic' },

  // ── 低频区（罕见，停留30-60min）──
  { id: 'siyuan-gate',          zone: 'rare', category: 'gate' },
  { id: 'temple-gate',          zone: 'rare', category: 'gate' },
  { id: 'triumph-gate',         zone: 'rare', category: 'gate' },
  { id: 'east-gate',            zone: 'rare', category: 'gate' },
  { id: 'chengji-museum',       zone: 'rare', category: 'culture' },
  { id: 'math-school',          zone: 'rare', category: 'academic' },
  { id: 'physics-school',       zone: 'rare', category: 'academic' },
  { id: 'chemistry-school',     zone: 'rare', category: 'academic' },
  { id: 'agri-school',          zone: 'rare', category: 'academic' },
  { id: 'life-science-school',  zone: 'rare', category: 'academic' },
  { id: 'pharmacy-school',      zone: 'rare', category: 'academic' },
  { id: 'student-service',      zone: 'rare', category: 'service' },
  { id: 'zhiyuan-tree',         zone: 'rare', category: 'nature' },
  { id: 'hufaguang-stadium',    zone: 'medium', category: 'sports' },
  { id: 'south-stadium',        zone: 'rare', category: 'sports' },
  { id: 'humanities-school',    zone: 'medium', category: 'academic' },
  { id: 'tuxin-building',       zone: 'rare', category: 'service' },
];

// ====== 停留时间（毫秒） ======
export const STAY_TIMES: Record<ZoneLevel, { min: number; max: number }> = {
  core:   { min: 3600000, max: 7200000 },   // 60-120 min
  medium: { min: 2400000, max: 5400000 },   // 40-90 min
  rare:   { min: 1800000, max: 3600000 },   // 30-60 min
};

// ====== 屏幕坐标（绘本式有机布局） ======
// 布局原则：
// · 南区思源湖核心 — 稀疏、大留白
// · 中区教学集群 — 相对密集、标签交替避让
// · 北区宿舍生活 — 适中密度
// · 东区校门/体育 — 边缘分布
// · 湖面、草坪、天空区域留白呼吸
export const MAP_POSITIONS: MapPosition[] = [

  // ═══════════ 北区：宿舍/生活 (y:22-28) — 避开InfoBar时钟+StatusLine ═══════════
  { landmarkId: 'temple-gate',          leftPercent: 48, topPercent: 22, labelPosition: 'bottom' },
  { landmarkId: 'zhiyuan-lake',         leftPercent: 18, topPercent: 25, labelPosition: 'bottom' },
  { landmarkId: 'zhiyuan-tree',         leftPercent: 26, topPercent: 28, labelPosition: 'right' },
  { landmarkId: 'student-center',       leftPercent: 38, topPercent: 27, labelPosition: 'bottom' },
  { landmarkId: 'dining-hall-3',        leftPercent: 50, topPercent: 25, labelPosition: 'bottom' },
  { landmarkId: 'dorm-area',            leftPercent: 62, topPercent: 23, labelPosition: 'bottom' },
  { landmarkId: 'rose-garden',          leftPercent: 74, topPercent: 25, labelPosition: 'right' },
  { landmarkId: 'botanical-garden',     leftPercent: 88, topPercent: 23, labelPosition: 'right' },

  // ═══════════ 北中区：图书馆/生命医药 (y:30-38) ═══════════
  { landmarkId: 'design-school',        leftPercent: 16, topPercent: 31, labelPosition: 'left' },
  { landmarkId: 'tsungdao-library',     leftPercent: 46, topPercent: 33, labelPosition: 'bottom' },
  { landmarkId: 'pharmacy-school',      leftPercent: 68, topPercent: 31, labelPosition: 'right' },
  { landmarkId: 'life-science-school',  leftPercent: 78, topPercent: 35, labelPosition: 'right' },
  { landmarkId: 'agri-school',          leftPercent: 88, topPercent: 31, labelPosition: 'bottom' },

  // ═══════════ 中西区：理学/外语 (y:34-42) ═══════════
  { landmarkId: 'physics-school',       leftPercent: 10, topPercent: 36, labelPosition: 'left' },
  { landmarkId: 'chemistry-school',     leftPercent: 20, topPercent: 34, labelPosition: 'bottom' },
  { landmarkId: 'math-school',          leftPercent: 22, topPercent: 40, labelPosition: 'right' },
  { landmarkId: 'sfl-school',           leftPercent: 34, topPercent: 36, labelPosition: 'bottom' },
  { landmarkId: 'media-school',         leftPercent: 40, topPercent: 40, labelPosition: 'right' },
  { landmarkId: 'sipa-school',          leftPercent: 52, topPercent: 40, labelPosition: 'bottom' },
  { landmarkId: 'humanities-school',    leftPercent: 46, topPercent: 34, labelPosition: 'top' },
  { landmarkId: 'me-school',            leftPercent: 80, topPercent: 36, labelPosition: 'right' },
  { landmarkId: 'naoce-school',         leftPercent: 90, topPercent: 36, labelPosition: 'bottom' },

  // ═══════════ 中区：核心教学集群 (y:42-54) ═══════════
  { landmarkId: 'upper-hall',           leftPercent: 28, topPercent: 43, labelPosition: 'left' },
  { landmarkId: 'middle-hall',          leftPercent: 28, topPercent: 49, labelPosition: 'left' },
  { landmarkId: 'lower-hall',           leftPercent: 28, topPercent: 55, labelPosition: 'left' },
  { landmarkId: 'chenruiqiu-building',  leftPercent: 42, topPercent: 43, labelPosition: 'top' },
  { landmarkId: 'antai-school',         leftPercent: 48, topPercent: 51, labelPosition: 'bottom' },
  { landmarkId: 'seiee-lawn',           leftPercent: 56, topPercent: 47, labelPosition: 'bottom' },
  { landmarkId: 'koguan-law',           leftPercent: 54, topPercent: 55, labelPosition: 'right' },
  { landmarkId: 'ai-school',            leftPercent: 68, topPercent: 43, labelPosition: 'right' },
  { landmarkId: 'seiee-complex',        leftPercent: 78, topPercent: 45, labelPosition: 'right' },
  { landmarkId: 'mse-school',           leftPercent: 76, topPercent: 51, labelPosition: 'right' },
  { landmarkId: 'new-library',          leftPercent: 68, topPercent: 53, labelPosition: 'bottom' },

  // ═══════════ 中东区：东区教学 (y:50-62) ═══════════
  { landmarkId: 'east-upper',           leftPercent: 84, topPercent: 51, labelPosition: 'right' },
  { landmarkId: 'east-middle',          leftPercent: 84, topPercent: 57, labelPosition: 'right' },
  { landmarkId: 'east-lower',           leftPercent: 84, topPercent: 63, labelPosition: 'right' },
  { landmarkId: 'student-innovation',   leftPercent: 62, topPercent: 59, labelPosition: 'bottom' },
  { landmarkId: 'student-service',      leftPercent: 44, topPercent: 59, labelPosition: 'left' },

  // ═══════════ 南中区：餐饮/体育 (y:60-72) ═══════════
  { landmarkId: 'dining-hall-1',        leftPercent: 38, topPercent: 63, labelPosition: 'bottom' },
  { landmarkId: 'dining-hall-2',        leftPercent: 72, topPercent: 63, labelPosition: 'bottom' },
  { landmarkId: 'minhang-gym',          leftPercent: 82, topPercent: 69, labelPosition: 'left' },
  { landmarkId: 'guangming-stadium',    leftPercent: 36, topPercent: 76, labelPosition: 'left' },
  { landmarkId: 'hufaguang-stadium',   leftPercent: 26, topPercent: 70, labelPosition: 'left' },
  { landmarkId: 'south-stadium',       leftPercent: 52, topPercent: 76, labelPosition: 'right' },

  // ═══════════ 南区：思源湖核心 (y:64-84) — 稀疏大留白 ═══════════
  { landmarkId: 'chengji-museum',       leftPercent: 46, topPercent: 65, labelPosition: 'bottom' },
  { landmarkId: 'jingjing-hall',        leftPercent: 20, topPercent: 69, labelPosition: 'left' },
  { landmarkId: 'siyuan-lake',          leftPercent: 38, topPercent: 74, labelPosition: 'bottom' },
  { landmarkId: 'baoyugang-library',    leftPercent: 55, topPercent: 72, labelPosition: 'right' },
  { landmarkId: 'siyuan-gate',          leftPercent: 18, topPercent: 82, labelPosition: 'bottom' },

  // ═══════════ 东区：校门 (y:58-80) ═══════════
  { landmarkId: 'triumph-gate',         leftPercent: 92, topPercent: 59, labelPosition: 'bottom' },
  { landmarkId: 'east-gate',            leftPercent: 94, topPercent: 78, labelPosition: 'bottom' },
  { landmarkId: 'tuxin-building',       leftPercent: 64, topPercent: 56, labelPosition: 'bottom' },
];

// ====== 道路路径（用于鸽子移动） ======
export interface RoadPath {
  from: string;
  to: string;
  points: number[];
}

export const ROAD_PATHS: RoadPath[] = [
  // ── 南北主干道 ──
  // 西线
  { from: 'siyuan-gate',       to: 'siyuan-lake',       points: [18,80, 24,76, 38,72] },
  { from: 'siyuan-lake',       to: 'lower-hall',        points: [38,72, 32,62, 28,52] },
  { from: 'lower-hall',        to: 'upper-hall',        points: [28,52, 28,46, 28,40] },
  { from: 'upper-hall',        to: 'sfl-school',        points: [28,40, 30,37, 34,34] },
  { from: 'sfl-school',        to: 'student-center',    points: [34,34, 35,26, 36,18] },
  { from: 'student-center',    to: 'zhiyuan-lake',      points: [36,18, 28,15, 18,13] },

  // 中线
  { from: 'guangming-stadium', to: 'lower-hall',        points: [36,74, 32,62, 28,52] },
  { from: 'lower-hall',        to: 'seiee-lawn',        points: [28,52, 42,48, 56,44] },
  { from: 'seiee-lawn',        to: 'new-library',       points: [56,44, 62,47, 68,50] },
  { from: 'new-library',       to: 'tsungdao-library',  points: [68,50, 56,38, 44,28] },
  { from: 'tsungdao-library',  to: 'dorm-area',         points: [44,28, 52,20, 60,14] },
  { from: 'dorm-area',         to: 'temple-gate',       points: [60,14, 54,10, 48,7] },

  // 东线
  { from: 'east-gate',         to: 'east-lower',        points: [94,76, 88,68, 84,60] },
  { from: 'east-lower',        to: 'east-upper',        points: [84,60, 84,54, 84,48] },
  { from: 'east-upper',        to: 'seiee-complex',     points: [84,48, 80,44, 78,42] },
  { from: 'seiee-complex',     to: 'mse-school',        points: [78,42, 77,45, 76,48] },

  // ── 东西主干道 ──
  // 南线
  { from: 'siyuan-gate',       to: 'baoyugang-library', points: [18,80, 36,76, 55,70] },
  { from: 'baoyugang-library', to: 'koguan-law',        points: [55,70, 54,60, 54,52] },
  { from: 'koguan-law',        to: 'seiee-lawn',        points: [54,52, 55,48, 56,44] },
  { from: 'seiee-lawn',        to: 'east-upper',        points: [56,44, 68,46, 84,48] },
  { from: 'east-upper',        to: 'triumph-gate',      points: [84,48, 88,52, 92,56] },

  // 中线
  { from: 'jingjing-hall',     to: 'sfl-school',        points: [20,66, 26,50, 34,34] },
  { from: 'sfl-school',        to: 'upper-hall',        points: [34,34, 32,38, 28,40] },
  { from: 'upper-hall',        to: 'chenruiqiu-building', points: [28,40, 34,40, 42,40] },
  { from: 'chenruiqiu-building', to: 'new-library',     points: [42,40, 54,46, 68,50] },
  { from: 'new-library',       to: 'east-middle',       points: [68,50, 76,52, 84,54] },
  { from: 'east-middle',       to: 'dining-hall-2',     points: [84,54, 78,56, 72,60] },

  // 北线
  { from: 'zhiyuan-lake',      to: 'dining-hall-3',     points: [18,13, 30,15, 48,16] },
  { from: 'dining-hall-3',     to: 'dorm-area',         points: [48,16, 54,15, 60,14] },
  { from: 'dorm-area',         to: 'rose-garden',       points: [60,14, 66,15, 72,16] },
  { from: 'rose-garden',       to: 'botanical-garden',  points: [72,16, 78,15, 86,14] },

  // ── 支路 ──
  { from: 'siyuan-lake',       to: 'chengji-museum',    points: [38,72, 42,68, 46,62] },
  { from: 'siyuan-lake',       to: 'jingjing-hall',     points: [38,72, 28,68, 20,66] },
  { from: 'baoyugang-library', to: 'siyuan-lake',       points: [55,70, 46,71, 38,72] },
  { from: 'baoyugang-library', to: 'guangming-stadium', points: [55,70, 44,72, 36,74] },
  { from: 'design-school',     to: 'physics-school',    points: [14,26, 12,30, 10,34] },
  { from: 'math-school',       to: 'sipa-school',       points: [22,38, 36,38, 52,38] },
  { from: 'koguan-law',        to: 'dining-hall-1',     points: [54,52, 46,56, 38,60] },
  { from: 'seiee-lawn',        to: 'student-innovation', points: [56,44, 58,50, 62,56] },
  { from: 'new-library',       to: 'student-service',   points: [68,50, 56,54, 44,56] },
  { from: 'tsungdao-library',  to: 'student-center',    points: [44,28, 40,22, 36,18] },
  { from: 'tsungdao-library',  to: 'chenruiqiu-building', points: [44,28, 43,34, 42,40] },
  { from: 'temple-gate',       to: 'zhiyuan-lake',      points: [48,7, 34,10, 18,13] },
  { from: 'pharmacy-school',   to: 'life-science-school', points: [66,26, 70,28, 78,30] },
  { from: 'life-science-school', to: 'agri-school',     points: [78,30, 82,28, 86,26] },
  { from: 'dorm-area',         to: 'seiee-complex',     points: [60,14, 68,28, 78,42] },
  { from: 'guangming-stadium', to: 'hufaguang-stadium',  points: [36,76, 30,72, 26,68] },
  { from: 'guangming-stadium', to: 'south-stadium',      points: [36,76, 44,76, 52,74] },
  { from: 'sipa-school',       to: 'humanities-school',  points: [52,40, 50,36, 46,32] },
  { from: 'new-library',       to: 'tuxin-building',    points: [68,50, 66,52, 64,54] },
  { from: 'tuxin-building',    to: 'student-service',   points: [64,54, 56,56, 44,56] },
];

// ====== 获取地点到核心区的距离权重 ======
export function getDistanceWeight(fromId: string, toId: string): number {
  const fromConfig = LANDMARK_CONFIGS.find((l) => l.id === fromId);
  const toConfig = LANDMARK_CONFIGS.find((l) => l.id === toId);
  if (!fromConfig || !toConfig) return 1;

  if (fromConfig.zone === toConfig.zone && fromConfig.zone === 'core') return 2.0;
  if (fromConfig.zone === toConfig.zone) return 1.5;

  const zoneOrder = { core: 0, medium: 1, rare: 2 };
  const diff = Math.abs(zoneOrder[fromConfig.zone] - zoneOrder[toConfig.zone]);
  if (diff === 1) return 0.6;
  return 0.2;
}
