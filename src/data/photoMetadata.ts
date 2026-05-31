// ====== 照片内容元数据 ======
// 为每张照片标注内容描述、标签和情绪倾向
// 用于智能匹配照片到场景

export interface PhotoMeta {
  /** 文件名（用于匹配） */
  filename: string;
  /** 照片内容简述 */
  description: string;
  /** 内容标签 */
  tags: string[];
  /** 适配的情绪维度 */
  moodMatch: string[];
  /** 适配的时间段 */
  timeMatch: string[];
  /** 适配的校园状态 */
  stateMatch: string[];
}

// ====== 所有照片的内容元数据 ======
export const PHOTO_METADATA: Record<string, PhotoMeta[]> = {

  // ── 思源湖：鸽子的大本营 ──
  'siyuan-lake': [
    {
      filename: '思源湖雕塑鸽子打卡图.jpg',
      description: '思源湖畔的雕塑旁，鸽子在这里驻足',
      tags: ['雕塑', '湖边', '驻足', '打卡'],
      moodMatch: ['warmth', 'romance', 'social'],
      timeMatch: ['morning', 'afternoon', 'evening'],
      stateMatch: ['normal', 'spring'],
    },
    {
      filename: '思源湖湖心打卡图.jpg',
      description: '思源湖湖心景色，水面波光粼粼',
      tags: ['湖心', '水面', '波光', '远景'],
      moodMatch: ['romance', 'warmth', 'loneliness'],
      timeMatch: ['dawn', 'evening', 'afternoon'],
      stateMatch: ['normal', 'spring', 'graduation'],
    },
    {
      filename: '思源湖维纳斯雕塑打卡图.jpg',
      description: '维纳斯雕塑静静立在思源湖边',
      tags: ['维纳斯', '雕塑', '艺术', '湖边'],
      moodMatch: ['romance', 'academic', 'loneliness'],
      timeMatch: ['morning', 'afternoon', 'evening'],
      stateMatch: ['normal', 'exam'],
    },
    {
      filename: '思源湖小树林鸽子打卡图.jpg',
      description: '思源湖边小树林，鸽子在树影下休息',
      tags: ['树林', '树影', '休息', '自然'],
      moodMatch: ['warmth', 'slack', 'energy'],
      timeMatch: ['morning', 'afternoon'],
      stateMatch: ['normal', 'spring'],
    },
  ],

  // ── 庙门 ──
  'temple-gate': [
    {
      filename: '122c3083bdee8eb1939ebecf0d9c78aa.jpg',
      description: '庙门的传统建筑风貌',
      tags: ['庙门', '传统', '建筑', '风貌'],
      moodMatch: ['academic', 'loneliness'],
      timeMatch: ['morning', 'afternoon'],
      stateMatch: ['normal', 'graduation'],
    },
    {
      filename: '鸽子站在屋檐上(1).png',
      description: '鸽子站在庙门的屋檐上眺望',
      tags: ['屋檐', '鸽子', '眺望', '高处'],
      moodMatch: ['energy', 'social', 'romance'],
      timeMatch: ['morning', 'afternoon', 'evening'],
      stateMatch: ['normal', 'spring'],
    },
    {
      filename: '可爱鸽子站在石狮子庙门上.png',
      description: '鸽子停在庙门石狮子上，憨态可掬',
      tags: ['石狮子', '庙门', '可爱', '停留'],
      moodMatch: ['warmth', 'social', 'slack'],
      timeMatch: ['morning', 'afternoon'],
      stateMatch: ['normal', 'spring', 'graduation'],
    },
  ],

  // ── 电院大草坪 ──
  'seiee-lawn': [
    {
      filename: '1e63b3cbe3007b9db505f1a1af670b9f.jpg',
      description: '电院大草坪的宽阔绿地',
      tags: ['草坪', '绿地', '开阔', '阳光'],
      moodMatch: ['warmth', 'energy', 'slack', 'social'],
      timeMatch: ['morning', 'afternoon'],
      stateMatch: ['normal', 'spring'],
    },
  ],

  // ── 电信群楼 ──
  'seiee-complex': [
    {
      filename: 'a6f4c5793ab1e5b791c421580eb991b2.jpg',
      description: '电信群楼的建筑外观',
      tags: ['建筑', '学院', '教学楼', '群楼'],
      moodMatch: ['academic', 'stress'],
      timeMatch: ['morning', 'afternoon', 'night'],
      stateMatch: ['normal', 'exam'],
    },
  ],

  // ── 东下院 ──
  'east-lower': [
    {
      filename: '1c74108fa983a8a26f0c529125aac8ba.jpg',
      description: '东下院教学楼',
      tags: ['教学楼', '东区', '学院'],
      moodMatch: ['academic', 'stress'],
      timeMatch: ['morning', 'afternoon'],
      stateMatch: ['normal', 'exam'],
    },
  ],

  // ── 东中院 ──
  'east-middle': [
    {
      filename: '2c299b1c855c40ac79b09e399b799cad.jpg',
      description: '东中院教学楼',
      tags: ['教学楼', '东区', '中院'],
      moodMatch: ['academic', 'social'],
      timeMatch: ['morning', 'afternoon'],
      stateMatch: ['normal', 'exam'],
    },
  ],

  // ── 第一餐饮大楼 ──
  'dining-hall-1': [
    {
      filename: '可爱鸽子站在玉兰花树上(1).png',
      description: '鸽子站在玉兰花树上，春天花开正好',
      tags: ['玉兰花', '树', '花开', '春天', '餐饮'],
      moodMatch: ['warmth', 'romance', 'social'],
      timeMatch: ['morning', 'afternoon'],
      stateMatch: ['spring', 'normal'],
    },
  ],

  // ── 胡法光体育场 ──
  'hufaguang-stadium': [
    {
      filename: '胡法光体育馆拔河打卡图.jpg',
      description: '胡法光体育场拔河比赛的热闹场面',
      tags: ['体育场', '拔河', '比赛', '热闹', '运动'],
      moodMatch: ['energy', 'social'],
      timeMatch: ['afternoon', 'morning'],
      stateMatch: ['normal', 'graduation'],
    },
  ],

  // ── 人文学院 ──
  'humanities-school': [
    {
      filename: '56cd0f1b760269c335d3453a5272f61b.jpg',
      description: '人文学院的古朴建筑',
      tags: ['人文', '学院', '古朴', '建筑'],
      moodMatch: ['academic', 'romance', 'loneliness'],
      timeMatch: ['morning', 'afternoon', 'evening'],
      stateMatch: ['normal', 'exam', 'spring'],
    },
    {
      filename: 'a30adaf00b15bf08f5c7646d82c51495.jpg',
      description: '人文学院的一角，书香氤氲',
      tags: ['人文', '学院', '书香', '安静'],
      moodMatch: ['academic', 'loneliness', 'warmth'],
      timeMatch: ['morning', 'afternoon', 'night'],
      stateMatch: ['normal', 'exam'],
    },
  ],

  // ── 新图书馆（图书馆主馆） ──
  'new-library': [
    {
      filename: '31feb873da2cbee519fdd85462f2b062.jpg',
      description: '图书馆主馆外观，知识殿堂',
      tags: ['图书馆', '主馆', '知识', '建筑'],
      moodMatch: ['academic', 'stress'],
      timeMatch: ['morning', 'afternoon', 'night'],
      stateMatch: ['normal', 'exam'],
    },
    {
      filename: '229006e42db39ef091393565b8a04ca0.jpg',
      description: '图书馆内的阅读空间',
      tags: ['图书馆', '阅读', '室内', '安静'],
      moodMatch: ['academic', 'loneliness', 'warmth'],
      timeMatch: ['afternoon', 'evening', 'night'],
      stateMatch: ['exam', 'normal'],
    },
    {
      filename: '8de3729435360743a60e989ac700ee83.jpg',
      description: '图书馆窗边的学习角落',
      tags: ['图书馆', '窗边', '学习', '角落'],
      moodMatch: ['academic', 'stress', 'loneliness'],
      timeMatch: ['night', 'evening', 'dawn'],
      stateMatch: ['exam', 'normal'],
    },
  ],

  // ── 植物园 ──
  'botanical-garden': [
    {
      filename: '可爱鸽子站在栏杆柱子上.png',
      description: '鸽子站在植物园的栏杆柱子上',
      tags: ['栏杆', '柱子', '植物园', '停留'],
      moodMatch: ['warmth', 'slack', 'energy'],
      timeMatch: ['morning', 'afternoon'],
      stateMatch: ['normal', 'spring'],
    },
  ],

  // ── 致远湖 ──
  'zhiyuan-lake': [
    {
      filename: '0284ad37fbdf3cdcf8ecf16f277951de.jpg',
      description: '致远湖的湖光水色',
      tags: ['湖', '水色', '致远', '风景'],
      moodMatch: ['romance', 'warmth', 'loneliness'],
      timeMatch: ['dawn', 'evening', 'afternoon'],
      stateMatch: ['normal', 'spring', 'graduation'],
    },
    {
      filename: '23ef85f6f399f0deb30e6a0ecc1f2aa0.jpg',
      description: '致远湖畔的宁静时光',
      tags: ['湖畔', '宁静', '致远', '亭子'],
      moodMatch: ['loneliness', 'romance', 'warmth'],
      timeMatch: ['afternoon', 'evening'],
      stateMatch: ['normal', 'spring'],
    },
  ],

  // ── 南区体育场 ──
  'south-stadium': [
    {
      filename: '41fe422c50b4d0bb386e4dd74c154456.jpg',
      description: '南区体育场的运动场地',
      tags: ['体育场', '南区', '运动', '跑道'],
      moodMatch: ['energy', 'social'],
      timeMatch: ['morning', 'afternoon', 'evening'],
      stateMatch: ['normal'],
    },
    {
      filename: '4cd5b0796bbdd4f1c62206aceb6d656f.jpg',
      description: '傍晚时分的南区体育场',
      tags: ['体育场', '傍晚', '南区', '夕阳'],
      moodMatch: ['energy', 'romance', 'warmth'],
      timeMatch: ['evening', 'afternoon'],
      stateMatch: ['normal', 'graduation'],
    },
  ],

  // ── 设计学院 ──
  'design-school': [
    {
      filename: 'c413bb285ef3c4837b11e02dfe0f0981.jpg',
      description: '设计学院的创意空间',
      tags: ['设计', '学院', '创意', '艺术'],
      moodMatch: ['academic', 'social', 'energy'],
      timeMatch: ['morning', 'afternoon'],
      stateMatch: ['normal', 'spring'],
    },
  ],

  // ── 图信大楼 ──
  'tuxin-building': [
    {
      filename: '403f4ab77d233ead3fb4fac09cf19e92.png',
      description: '图书信息大楼，科技与知识的交汇',
      tags: ['图信', '图书', '信息', '大楼', '科技'],
      moodMatch: ['academic', 'stress', 'social'],
      timeMatch: ['morning', 'afternoon', 'night'],
      stateMatch: ['normal', 'exam'],
    },
  ],

  // ── 彩蛋照片 ──
  'easter-egg': [
    {
      filename: 'ae1d20b20ea5d16c48c8783ed9eca1d1.jpg',
      description: '神秘的彩蛋瞬间',
      tags: ['彩蛋', '神秘', '特别', '惊喜'],
      moodMatch: ['warmth', 'romance', 'energy'],
      timeMatch: ['dawn', 'evening'],
      stateMatch: ['normal', 'spring', 'graduation'],
    },
  ],
};

// ====== 智能照片选择 ======
// 根据当前情绪、时间、校园状态，从可用照片中选择最匹配的

export interface SelectionContext {
  dominantMood: string;
  timeOfDay: string;
  campusState: string;
  landmarkCategory?: string;
}

/**
 * 为照片打分：越高越匹配当前场景
 */
export function scorePhotoMeta(
  meta: PhotoMeta,
  context: SelectionContext
): number {
  let score = 1.0;

  // 情绪匹配加分
  if (meta.moodMatch.includes(context.dominantMood)) {
    score += 1.5;
  }
  // 如果情绪是default（没有突出情绪），不额外加分
  if (context.dominantMood === 'default') {
    score += 0.5; // 所有照片都还ok
  }

  // 时间匹配加分
  if (meta.timeMatch.includes(context.timeOfDay)) {
    score += 1.0;
  }

  // 校园状态匹配加分
  if (meta.stateMatch.includes(context.campusState)) {
    score += 1.0;
  }

  return score;
}

/**
 * 根据内容标签推断照片是否匹配当前地标的类别
 */
export function getCategoryTags(category: string): string[] {
  const map: Record<string, string[]> = {
    nature: ['湖', '水', '树', '花', '草坪', '自然', '风景', '植物', '树林'],
    gate: ['门', '校门', '入口', '建筑', '风貌', '屋檐'],
    academic: ['教学楼', '学院', '教室', '学习', '实验室', '学术', '设计', '创意', '科技', '信息', '图书'],
    culture: ['图书馆', '阅读', '知识', '书香', '艺术', '文化', '雕塑'],
    sports: ['体育', '运动', '跑道', '比赛', '拔河'],
    dining: ['餐饮', '食堂', '美食', '玉兰花'],
    dorm: ['宿舍', '生活'],
    service: ['服务', '中心', '活动'],
  };
  return map[category] || [];
}

// ====== 照片文件名规范化 ======
// Vite import.meta.glob 导入的路径格式可能是 /src/assets/photos/xxx/filename.jpg
// 也可能是相对路径。我们需要从中提取文件名。
export function extractFilename(fullPath: string): string {
  // 处理各种可能的路径格式
  const parts = fullPath.replace(/\\/g, '/').split('/');
  return decodeURIComponent(parts[parts.length - 1]);
}
