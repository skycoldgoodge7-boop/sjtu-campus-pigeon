import type { MapPosition } from '../types';

export type ZoneLevel = 'core' | 'medium' | 'rare';
export type LandmarkCategory = 'gate' | 'academic' | 'nature' | 'sports' | 'culture' | 'dining' | 'service';

export interface LandmarkConfig {
  id: string;
  zone: ZoneLevel;
  category: LandmarkCategory;
}

// ====== 三级视觉权重 ======
export type TierLevel = 1 | 2 | 3;
export interface TierConfig {
  tier: TierLevel;
  scale: number;
  opacity: number;
  fontWeight: number;
  paddingBox: number;
}

export const TIER_CONFIGS: Record<TierLevel, TierConfig> = {
  1: { tier: 1, scale: 1.30, opacity: 1.0,  fontWeight: 700, paddingBox: 12 },
  2: { tier: 2, scale: 1.05, opacity: 0.90, fontWeight: 500, paddingBox: 7 },
  3: { tier: 3, scale: 0.80, opacity: 0.65, fontWeight: 400, paddingBox: 5 },
};

// ── 15 地标 ──
export const LANDMARK_TIERS: Record<string, TierLevel> = {
  'siyuan-lake':          1,
  'new-library':          1,
  'seiee-lawn':           1,
  'temple-gate':          2,
  'seiee-complex':        2,
  'dining-hall-1':        2,
  'zhiyuan-lake':         2,
  'hufaguang-stadium':    2,
  'humanities-school':    2,
  'east-middle':          3,
  'east-lower':           3,
  'botanical-garden':     3,
  'design-school':        3,
  'south-stadium':        3,
  'tuxin-building':       3,
  'nan-da-men':           3,
  'siyuan-men':           3,
};

// ── 频率配置 ──
export const LANDMARK_CONFIGS: LandmarkConfig[] = [
  { id: 'siyuan-lake',          zone: 'core',   category: 'nature' },
  { id: 'seiee-lawn',           zone: 'core',   category: 'nature' },
  { id: 'new-library',          zone: 'core',   category: 'culture' },
  { id: 'temple-gate',          zone: 'medium', category: 'gate' },
  { id: 'zhiyuan-lake',         zone: 'medium', category: 'nature' },
  { id: 'botanical-garden',     zone: 'medium', category: 'nature' },
  { id: 'dining-hall-1',        zone: 'medium', category: 'dining' },
  { id: 'seiee-complex',        zone: 'medium', category: 'academic' },
  { id: 'east-middle',          zone: 'medium', category: 'academic' },
  { id: 'east-lower',           zone: 'medium', category: 'academic' },
  { id: 'design-school',        zone: 'medium', category: 'academic' },
  { id: 'humanities-school',    zone: 'medium', category: 'academic' },
  { id: 'hufaguang-stadium',    zone: 'rare',   category: 'sports' },
  { id: 'south-stadium',        zone: 'rare',   category: 'sports' },
  { id: 'tuxin-building',       zone: 'rare',   category: 'service' },
  { id: 'nan-da-men',           zone: 'rare',   category: 'gate' },
  { id: 'siyuan-men',           zone: 'rare',   category: 'gate' },
];

// ── 停留时间 ──
export const STAY_TIMES: Record<ZoneLevel, { min: number; max: number }> = {
  core:   { min: 600000,  max: 1500000 },  // 10-25分钟
  medium: { min: 900000,  max: 2100000 },  // 15-35分钟
  rare:   { min: 600000,  max: 1500000 },  // 10-25分钟
};

// ── 屏幕坐标 — 基于手绘地图底图精确标注 ──
export const MAP_POSITIONS: MapPosition[] = [
  { landmarkId: 'zhiyuan-lake',       leftPercent: 15.5, topPercent: 17.8, labelPosition: 'bottom' },
  { landmarkId: 'design-school',      leftPercent: 14.3, topPercent: 36.8, labelPosition: 'bottom' },
  { landmarkId: 'humanities-school',  leftPercent: 17.2, topPercent: 52.5, labelPosition: 'bottom' },
  { landmarkId: 'siyuan-lake',        leftPercent: 47.3, topPercent: 39.5, labelPosition: 'bottom' },
  { landmarkId: 'seiee-complex',      leftPercent: 77.8, topPercent: 25.3, labelPosition: 'bottom' },
  { landmarkId: 'seiee-lawn',         leftPercent: 77.8, topPercent: 42.5, labelPosition: 'bottom' },
  { landmarkId: 'dining-hall-1',      leftPercent: 83.2, topPercent: 57.6, labelPosition: 'bottom' },
  { landmarkId: 'new-library',        leftPercent: 47.1, topPercent: 66.8, labelPosition: 'bottom' },
  { landmarkId: 'tuxin-building',     leftPercent: 64.1, topPercent: 77.3, labelPosition: 'bottom' },
  { landmarkId: 'east-lower',         leftPercent: 88.2, topPercent: 71.8, labelPosition: 'bottom' },
  { landmarkId: 'east-middle',        leftPercent: 89.5, topPercent: 80.5, labelPosition: 'bottom' },
  { landmarkId: 'hufaguang-stadium',  leftPercent: 11.5, topPercent: 80.2, labelPosition: 'bottom' },
  { landmarkId: 'south-stadium',      leftPercent: 66.2, topPercent: 91.2, labelPosition: 'bottom' },
  { landmarkId: 'botanical-garden',   leftPercent: 84.6, topPercent: 91.5, labelPosition: 'bottom' },
  { landmarkId: 'temple-gate',        leftPercent: 50.0, topPercent: 94.5, labelPosition: 'bottom' },
  { landmarkId: 'nan-da-men',         leftPercent: 50.0, topPercent: 93.0, labelPosition: 'bottom' },
  { landmarkId: 'siyuan-men',         leftPercent: 42.0, topPercent: 42.0, labelPosition: 'bottom' },
];

// ── 道路路径 ──
export interface RoadPath {
  from: string;
  to: string;
  points: number[];
}

export const ROAD_PATHS: RoadPath[] = [
  { from: 'zhiyuan-lake',      to: 'design-school',      points: [15.5,17.8, 14.9,27, 14.3,36.8] },
  { from: 'design-school',     to: 'humanities-school',  points: [14.3,36.8, 15.8,44, 17.2,52.5] },
  { from: 'humanities-school', to: 'siyuan-lake',        points: [17.2,52.5, 32,46, 47.3,39.5] },
  { from: 'siyuan-lake',       to: 'seiee-complex',      points: [47.3,39.5, 62,32, 77.8,25.3] },
  { from: 'seiee-complex',     to: 'seiee-lawn',         points: [77.8,25.3, 77.8,34, 77.8,42.5] },
  { from: 'seiee-lawn',        to: 'dining-hall-1',      points: [77.8,42.5, 80.5,50, 83.2,57.6] },
  { from: 'dining-hall-1',     to: 'new-library',        points: [83.2,57.6, 65,62, 47.1,66.8] },
  { from: 'new-library',       to: 'tuxin-building',     points: [47.1,66.8, 55.6,72, 64.1,77.3] },
  { from: 'tuxin-building',    to: 'east-lower',         points: [64.1,77.3, 76,74.5, 88.2,71.8] },
  { from: 'east-lower',        to: 'east-middle',        points: [88.2,71.8, 88.8,76, 89.5,80.5] },
  { from: 'east-middle',       to: 'south-stadium',      points: [89.5,80.5, 78,86, 66.2,91.2] },
  { from: 'south-stadium',     to: 'temple-gate',        points: [66.2,91.2, 58,93, 50,94.5] },
  { from: 'temple-gate',       to: 'hufaguang-stadium',  points: [50,94.5, 30,87, 11.5,80.2] },
  { from: 'hufaguang-stadium', to: 'new-library',        points: [11.5,80.2, 29,73, 47.1,66.8] },
  { from: 'siyuan-lake',       to: 'new-library',        points: [47.3,39.5, 47.2,53, 47.1,66.8] },
  { from: 'botanical-garden',  to: 'south-stadium',      points: [84.6,91.5, 75.4,91.3, 66.2,91.2] },
  { from: 'east-middle',       to: 'botanical-garden',   points: [89.5,80.5, 87,86, 84.6,91.5] },
  { from: 'seiee-complex',     to: 'design-school',      points: [77.8,25.3, 46,31, 14.3,36.8] },
  // 南大门周边
  { from: 'nan-da-men',        to: 'south-stadium',      points: [50,93, 58,92, 66.2,91.2] },
  { from: 'nan-da-men',        to: 'botanical-garden',   points: [50,93, 67,92.2, 84.6,91.5] },
  { from: 'nan-da-men',        to: 'temple-gate',        points: [50,93, 50,93.7, 50,94.5] },
  { from: 'nan-da-men',        to: 'hufaguang-stadium',  points: [50,93, 31,86.5, 11.5,80.2] },
  // 思源门周边
  { from: 'siyuan-men',        to: 'siyuan-lake',        points: [42,42, 44.6,40.7, 47.3,39.5] },
  { from: 'siyuan-men',        to: 'humanities-school',  points: [42,42, 29.6,47.2, 17.2,52.5] },
  { from: 'siyuan-men',        to: 'new-library',        points: [42,42, 44.5,54.4, 47.1,66.8] },
  { from: 'siyuan-men',        to: 'design-school',      points: [42,42, 28.1,39.4, 14.3,36.8] },
];

// ── 距离权重 ──
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
