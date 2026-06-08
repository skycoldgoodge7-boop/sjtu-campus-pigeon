// ====== 今日发现 ======
// 每天随机一条，出现在地图上作为 ✨ 标记
// 不是任务、不是奖励 — 只是观察

export interface DailyDiscovery {
  id: string;
  text: string;
  emoji: string;
  landmarkId?: string; // 可选关联地标
}

const DISCOVERIES: DailyDiscovery[] = [
  { id: 'd01', emoji: '🍂', text: '操场边发现一片特别大的银杏叶' },
  { id: 'd02', emoji: '🎻', text: '湖边有人在练琴' },
  { id: 'd03', emoji: '📚', text: '图书馆门口堆满还书箱' },
  { id: 'd04', emoji: '☕', text: '有人把咖啡忘在了台阶上' },
  { id: 'd05', emoji: '🐿️', text: '一只松鼠在树上跳来跳去' },
  { id: 'd06', emoji: '🌧️', text: '雨后石板路上有彩虹颜色' },
  { id: 'd07', emoji: '🎓', text: '一群穿着学士服的人在拍照' },
  { id: 'd08', emoji: '📝', text: '石凳上有人用粉笔写了个公式' },
  { id: 'd09', emoji: '🌸', text: '风把花瓣吹了一地' },
  { id: 'd10', emoji: '🕊️', text: '另一只鸽子停在对面楼顶' },
  { id: 'd11', emoji: '🎵', text: '远处传来若隐若现的钢琴声' },
  { id: 'd12', emoji: '🌿', text: '草坪刚修剪过，空气里有青草味' },
  { id: 'd13', emoji: '📖', text: '有人坐在长椅上看了一下午书' },
  { id: 'd14', emoji: '🍞', text: '地上有一排面包屑，通向草丛' },
  { id: 'd15', emoji: '✨', text: '阳光穿过树叶落在地上，斑斑点点' },
  { id: 'd16', emoji: '🐱', text: '一只猫在窗台上晒太阳' },
  { id: 'd17', emoji: '🚲', text: '自行车倒了，有人把它扶起来了' },
  { id: 'd18', emoji: '🌙', text: '今天的月亮特别圆' },
  { id: 'd19', emoji: '✏️', text: '课桌上有人画了一只鸽子' },
  { id: 'd20', emoji: '🪟', text: '教室的窗户开着，风把窗帘吹起来' },
  { id: 'd21', emoji: '🧹', text: '保洁阿姨扫完了最后一片落叶' },
  { id: 'd22', emoji: '🏮', text: '庙门灯笼亮了，天色刚好暗下来' },
  { id: 'd23', emoji: '💧', text: '喷泉开了，水雾里有小彩虹' },
  { id: 'd24', emoji: '📻', text: '保安室的收音机放着评书' },
];

export default DISCOVERIES;

/** 根据日期获取今日发现（每日固定一条） */
export function getDailyDiscovery(): DailyDiscovery {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const index = seed % DISCOVERIES.length;
  return DISCOVERIES[index];
}
