export interface Landmark {
  id: string;
  name: string;
  category: 'gate' | 'academic' | 'nature' | 'sports' | 'culture' | 'dining' | 'service';
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  emoji: string;
  color: string;
}

// 仅保留 15 个地标，名称与手绘地图一致
export const landmarks: Landmark[] = [
  { id: 'zhiyuan-lake',        name: '致远湖',     category: 'nature',   description: '', difficulty: 'medium', emoji: '💧', color: '#A0BFCF' },
  { id: 'design-school',       name: '设计学院',   category: 'academic', description: '', difficulty: 'medium', emoji: '✏️', color: '#B0A090' },
  { id: 'humanities-school',   name: '人文学院',   category: 'academic', description: '', difficulty: 'medium', emoji: '📜', color: '#B0A098' },
  { id: 'siyuan-lake',         name: '思源湖',     category: 'nature',   description: '', difficulty: 'easy',   emoji: '💧', color: '#A8C4D4' },
  { id: 'seiee-complex',       name: '电院',       category: 'academic', description: '', difficulty: 'medium', emoji: '💻', color: '#7D8E9B' },
  { id: 'seiee-lawn',          name: '电院大草坪', category: 'nature',   description: '', difficulty: 'easy',   emoji: '🌿', color: '#A8BF8A' },
  { id: 'dining-hall-1',       name: '第一餐饮大楼', category: 'dining', description: '', difficulty: 'easy',   emoji: '🍜', color: '#C9A87A' },
  { id: 'new-library',         name: '图书馆主馆', category: 'culture',  description: '', difficulty: 'medium', emoji: '📖', color: '#8B9D9D' },
  { id: 'tuxin-building',      name: '图信大楼',   category: 'service',  description: '', difficulty: 'medium', emoji: '💻', color: '#8B9DAF' },
  { id: 'east-lower',          name: '东下院',     category: 'academic', description: '', difficulty: 'medium', emoji: '🏫', color: '#B5A89C' },
  { id: 'east-middle',         name: '东中院',     category: 'academic', description: '', difficulty: 'medium', emoji: '🏫', color: '#B5A89C' },
  { id: 'hufaguang-stadium',   name: '胡法光体育场', category: 'sports', description: '', difficulty: 'medium', emoji: '🏟️', color: '#B5A088' },
  { id: 'south-stadium',       name: '南区体育场', category: 'sports',  description: '', difficulty: 'medium', emoji: '⚽', color: '#B0A890' },
  { id: 'botanical-garden',    name: '植物园',     category: 'nature',   description: '', difficulty: 'hard',   emoji: '🌳', color: '#8AA87B' },
  { id: 'temple-gate',         name: '庙门',       category: 'gate',     description: '', difficulty: 'easy',   emoji: '🏛️', color: '#B8977B' },
  { id: 'nan-da-men',          name: '南大门',     category: 'gate',     description: '', difficulty: 'easy',   emoji: '🚪', color: '#B8977B' },
  { id: 'siyuan-men',          name: '思源门',     category: 'gate',     description: '', difficulty: 'easy',   emoji: '⛩️', color: '#C4A882' },
];
