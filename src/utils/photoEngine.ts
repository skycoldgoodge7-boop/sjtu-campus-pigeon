import type { PhotoCard, CampusMood, TimeOfDay } from '../types';
import { landmarks } from '../data/landmarks';
import { TIME_GRADIENTS } from '../data/photoCaptions';
import { getTimeOfDay, getCampusState } from '../store/pigeonStore';
import {
  PHOTO_METADATA, scorePhotoMeta, extractFilename,
  type SelectionContext,
} from '../data/photoMetadata';

// ====== 所有地标照片 glob 导入 ======
const templeGatePhotos = import.meta.glob('../assets/photos/temple-gate/*.{jpg,png,JPG,PNG}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const siyuanLakePhotos = import.meta.glob('../assets/photos/siyuan-lake/*.{jpg,png,JPG,PNG}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const seieeComplexPhotos = import.meta.glob('../assets/photos/seiee-complex/*.{jpg,png,JPG,PNG}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const seieeLawnPhotos = import.meta.glob('../assets/photos/seiee-lawn/*.{jpg,png,JPG,PNG}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const eastLowerPhotos = import.meta.glob('../assets/photos/east-lower/*.{jpg,png,JPG,PNG}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const eastMiddlePhotos = import.meta.glob('../assets/photos/east-middle/*.{jpg,png,JPG,PNG}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const diningHall1Photos = import.meta.glob('../assets/photos/dining-hall-1/*.{jpg,png,JPG,PNG}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const hufaguangStadiumPhotos = import.meta.glob('../assets/photos/hufaguang-stadium/*.{jpg,png,JPG,PNG}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const humanitiesSchoolPhotos = import.meta.glob('../assets/photos/humanities-school/*.{jpg,png,JPG,PNG}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const newLibraryPhotos = import.meta.glob('../assets/photos/new-library/*.{jpg,png,JPG,PNG}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const botanicalGardenPhotos = import.meta.glob('../assets/photos/botanical-garden/*.{jpg,png,JPG,PNG}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const zhiyuanLakePhotos = import.meta.glob('../assets/photos/zhiyuan-lake/*.{jpg,png,JPG,PNG}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const southStadiumPhotos = import.meta.glob('../assets/photos/south-stadium/*.{jpg,png,JPG,PNG}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const designSchoolPhotos = import.meta.glob('../assets/photos/design-school/*.{jpg,png,JPG,PNG}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const tuxinBuildingPhotos = import.meta.glob('../assets/photos/tuxin-building/*.{jpg,png,JPG,PNG}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const easterEggPhotos = import.meta.glob('../assets/photos/easter-egg/*.{jpg,png,JPG,PNG}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

const LANDMARK_PHOTOS: Record<string, string[]> = {
  'temple-gate': Object.values(templeGatePhotos),
  'siyuan-lake': Object.values(siyuanLakePhotos),
  'seiee-complex': Object.values(seieeComplexPhotos),
  'seiee-lawn': Object.values(seieeLawnPhotos),
  'east-lower': Object.values(eastLowerPhotos),
  'east-middle': Object.values(eastMiddlePhotos),
  'dining-hall-1': Object.values(diningHall1Photos),
  'hufaguang-stadium': Object.values(hufaguangStadiumPhotos),
  'humanities-school': Object.values(humanitiesSchoolPhotos),
  'new-library': Object.values(newLibraryPhotos),
  'botanical-garden': Object.values(botanicalGardenPhotos),
  'zhiyuan-lake': Object.values(zhiyuanLakePhotos),
  'south-stadium': Object.values(southStadiumPhotos),
  'design-school': Object.values(designSchoolPhotos),
  'tuxin-building': Object.values(tuxinBuildingPhotos),
};

const EASTER_EGG_PHOTOS = Object.values(easterEggPhotos);

// ====== 彩蛋触发概率 ======
const EASTER_EGG_CHANCE = 0.08; // 8%

// ====== 全局照片使用追踪（永不重复） ======
// 在应用生命周期内追踪所有已使用的照片URL
const GLOBAL_USED_PHOTOS = new Set<string>();

/**
 * 记录照片已被使用
 */
export function markPhotoUsed(url: string): void {
  GLOBAL_USED_PHOTOS.add(url);
}

/**
 * 获取某地标还剩多少未使用的照片
 */
export function getRemainingPhotoCount(landmarkId: string): number {
  const photos = LANDMARK_PHOTOS[landmarkId];
  if (!photos || photos.length === 0) return 0;
  return photos.filter((p) => !GLOBAL_USED_PHOTOS.has(p)).length;
}

/**
 * 获取所有地标的剩余照片总数
 */
export function getTotalRemainingPhotos(): number {
  let total = 0;
  for (const [id, photos] of Object.entries(LANDMARK_PHOTOS)) {
    total += photos.filter((p) => !GLOBAL_USED_PHOTOS.has(p)).length;
  }
  // 加上彩蛋照片
  total += EASTER_EGG_PHOTOS.filter((p) => !GLOBAL_USED_PHOTOS.has(p)).length;
  return total;
}

// ====== 智能照片选取（永不重复，优先匹配场景） ======
function pickPhotoUrl(
  landmarkId: string,
  usedUrls: string[],
  context?: SelectionContext,
): string | undefined {
  const photos = LANDMARK_PHOTOS[landmarkId];
  if (!photos || photos.length === 0) return undefined;

  // 合并全局已使用 + 传入已使用
  const usedSet = new Set([...GLOBAL_USED_PHOTOS, ...usedUrls]);
  const available = photos.filter((p) => !usedSet.has(p));

  // 如果全部用过，不再重复使用 —— 返回 undefined
  if (available.length === 0) return undefined;

  // 如果有场景上下文，进行智能匹配
  if (context && available.length > 1) {
    const metadataList = PHOTO_METADATA[landmarkId];
    if (metadataList && metadataList.length > 0) {
      // 为每张可用照片打分
      const scored = available.map((url) => {
        const filename = extractFilename(url);
        const meta = metadataList.find((m) => m.filename === filename);
        let score = 1.0;
        if (meta) {
          score = scorePhotoMeta(meta, context);
        }
        // 加入一点随机性（±15%），避免同一场景永远选同一张
        score *= 0.85 + Math.random() * 0.3;
        return { url, score };
      });

      // 按分数排序，取最高的
      scored.sort((a, b) => b.score - a.score);

      // 从top 2中随机选一张（增加多样性）
      const topN = Math.min(2, scored.length);
      const picked = scored[Math.floor(Math.random() * topN)];
      GLOBAL_USED_PHOTOS.add(picked.url);
      return picked.url;
    }
  }

  // 无上下文或无元数据时，随机选一张
  const picked = available[Math.floor(Math.random() * available.length)];
  GLOBAL_USED_PHOTOS.add(picked);
  return picked;
}

function pickEasterEggUrl(usedUrls: string[]): string | undefined {
  if (EASTER_EGG_PHOTOS.length === 0) return undefined;
  const usedSet = new Set([...GLOBAL_USED_PHOTOS, ...usedUrls]);
  const available = EASTER_EGG_PHOTOS.filter((p) => !usedSet.has(p));
  if (available.length === 0) return undefined;
  const picked = available[Math.floor(Math.random() * available.length)];
  GLOBAL_USED_PHOTOS.add(picked);
  return picked;
}

// ====== 生成照片卡片 ======
export function generatePhotoCard(
  landmarkId: string,
  mood: CampusMood,
  usedUrls: string[] = [],
): PhotoCard {
  const landmark = landmarks.find((l) => l.id === landmarkId)!;
  const tod = getTimeOfDay();
  const campusState = getCampusState(mood);

  let dominantMood = 'default';
  let maxVal = 45;
  for (const [key, val] of Object.entries(mood)) {
    if (val > maxVal) { dominantMood = key; maxVal = val; }
  }

  const moodEmoji = getMoodEmoji(dominantMood);
  const timeEmoji = getTimeEmoji(tod);
  const bonusEmoji = getBonusEmoji(campusState);
  const sceneEmojis = [landmark.emoji, '🕊️', moodEmoji, timeEmoji, bonusEmoji].filter(Boolean);

  const caption = generatePigeonCaption(dominantMood, tod, campusState, landmark.name);

  // 智能选择照片：传入场景上下文
  const selectionContext: SelectionContext = {
    dominantMood,
    timeOfDay: tod,
    campusState,
    landmarkCategory: landmark.category,
  };
  const photoUrl = pickPhotoUrl(landmark.id, usedUrls, selectionContext);

  const gradient = TIME_GRADIENTS[tod];

  return {
    id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    landmarkId: landmark.id,
    landmarkName: landmark.name,
    landmarkEmoji: landmark.emoji,
    timeOfDay: tod,
    campusState,
    dominantMood,
    moodValue: maxVal,
    sceneEmojis,
    caption,
    gradient,
    photoUrl,
    isEasterEgg: false,
  };
}

// ====== 每日照片（含彩蛋判定） ======
export function generateDailyPhoto(
  landmarkId: string,
  mood: CampusMood,
  dateStr: string,
  usedUrls: string[] = [],
): PhotoCard {
  const tod = getTimeOfDay();
  const campusState = getCampusState(mood);

  let dominantMood = 'default';
  let maxVal = 45;
  for (const [key, val] of Object.entries(mood)) {
    if (val > maxVal) { dominantMood = key; maxVal = val; }
  }

  // 彩蛋判定
  const isEasterEgg = Math.random() < EASTER_EGG_CHANCE;

  if (isEasterEgg) {
    const eggUrl = pickEasterEggUrl(usedUrls);
    const caption = generateEasterEggCaption(tod, campusState, dominantMood);
    const gradient: [string, string] = ['#FFD700', '#FF8C00']; // 金色渐变

    return {
      id: `daily-photo-${dateStr}`,
      timestamp: Date.now(),
      landmarkId: '__easter_egg__',
      landmarkName: '时间旁',
      landmarkEmoji: '⏰',
      timeOfDay: tod,
      campusState,
      dominantMood,
      moodValue: maxVal,
      sceneEmojis: ['⏰', '🕊️', '✨'],
      caption,
      gradient,
      photoUrl: eggUrl,
      isEasterEgg: true,
    };
  }

  // 正常每日照片
  const landmark = landmarks.find((l) => l.id === landmarkId);
  if (!landmark) {
    return generatePhotoCard(landmarkId, mood, usedUrls);
  }

  const caption = generateDailyPigeonCaption(landmark, dominantMood, tod, campusState);

  // 智能选择照片：传入场景上下文
  const selectionContext: SelectionContext = {
    dominantMood,
    timeOfDay: tod,
    campusState,
    landmarkCategory: landmark.category,
  };
  const photoUrl = pickPhotoUrl(landmark.id, usedUrls, selectionContext);

  const gradient = TIME_GRADIENTS[tod];

  return {
    id: `daily-photo-${dateStr}`,
    timestamp: Date.now(),
    landmarkId: landmark.id,
    landmarkName: landmark.name,
    landmarkEmoji: landmark.emoji,
    timeOfDay: tod,
    campusState,
    dominantMood,
    moodValue: maxVal,
    sceneEmojis: [landmark.emoji, '🕊️'],
    caption,
    gradient,
    photoUrl,
    isEasterEgg: false,
  };
}

// ====== 鸽子视角每日文案 ======
function generateDailyPigeonCaption(
  landmark: { name: string; category: string; description: string },
  _mood: string,
  tod: TimeOfDay,
  _state: string,
): string {
  const timePrefix: Record<TimeOfDay, string> = {
    dawn: '天刚蒙蒙亮，',
    morning: '早上好！',
    afternoon: '午后的阳光暖暖的，',
    evening: '傍晚的风很温柔，',
    night: '夜深了，',
  };

  const categoryStories: Record<string, string[]> = {
    nature: [
      `咕咕今天在${landmark.name}待了好久。树叶沙沙响，风里还有花的味道。`,
      `${landmark.name}的风景真好呀！咕咕在草地上蹦蹦跳跳，开心得不得了。`,
      `人，你猜咕咕在${landmark.name}看到了什么？一只蝴蝶！追了它好久好久。`,
      `${landmark.name}今天特别安静。咕咕在水边发了很久的呆，看云从一头飘到另一头。`,
      `咕咕宣布：${landmark.name}是今天最舒服的地方！在草地上晒太阳，差点睡着了。`,
    ],
    gate: [
      `咕咕蹲在${landmark.name}上看人来人往。他们走得好快，都不抬头看看鸽子。`,
      `${landmark.name}今天好热闹！有人拍照，有人等人，咕咕就在旁边看着。`,
      `人，咕咕今天飞到了${landmark.name}。校门口的风很大，鸽子的羽毛被吹得乱七八糟。`,
      `在${landmark.name}的屋檐上站了一会儿。下面的人像小蚂蚁一样走来走去。`,
    ],
    academic: [
      `咕咕飞到${landmark.name}的窗台上。里面的人在写东西，写了很久很久。人好辛苦哦。`,
      `${landmark.name}的走廊里有人走来走去。咕咕从这头跳到那头，没人发现我。`,
      `人，咕咕今天在${landmark.name}看到了好多亮着的灯。都这么晚了，你们不困吗？`,
      `悄悄停在${landmark.name}的窗边。里面在上课，咕咕听不懂，但是觉得声音很好听。`,
      `${landmark.name}楼下停满了自行车。咕咕在一辆车上站了一会儿，车上还有坐垫的余温。`,
    ],
    culture: [
      `咕咕在${landmark.name}的窗台上晒太阳。里面安安静静的，翻书的声音很好听。`,
      `${landmark.name}的光线好好看。阳光从大窗户照进来，在地板上画了一块金色的方块。`,
      `人，${landmark.name}有一种特别的味道。旧书和木头的味道，咕咕很喜欢。`,
    ],
    dining: [
      `人！咕咕今天在${landmark.name}吃到了好多薯条！有人掉了一根，咕咕叼起来就跑了。`,
      `${landmark.name}飘出来的香味好馋人。咕咕在门口等了好久，终于等到面包屑。`,
      `咕咕在${landmark.name}附近巡逻。今天的菜单闻起来不错，但没人请鸽子吃饭。`,
      `${landmark.name}门口排了好长的队。咕咕从队伍上面飞过去，所有人都在看我。`,
    ],
    sports: [
      `咕咕在${landmark.name}看人跑步。一圈又一圈，鸽子看不懂但觉得好厉害。`,
      `${landmark.name}今天有比赛！咕咕在旁边的树上看了全场，差点被球砸到。`,
      `人，${landmark.name}的草坪好软。咕咕在上面散步，假装自己也是运动员。`,
      `${landmark.name}有人在拉伸，动作很慢。咕咕学了一下，差点摔倒。`,
    ],
    dorm: [
      `咕咕飞过${landmark.name}的阳台。晾着的衣服五颜六色，像一面面小旗子。`,
      `${landmark.name}的窗户里传出音乐声。咕咕跟着节奏点点头。`,
      `人，咕咕在${landmark.name}楼下看到有人在取外卖。好香，好香。`,
    ],
    service: [
      `咕咕在${landmark.name}的大厅里溜达了一圈。每个人都在忙自己的事，鸽子也是。`,
      `${landmark.name}的公告栏上贴了好多海报。咕咕看不懂，但觉得花花绿绿的很好看。`,
    ],
  };

  const stories = categoryStories[landmark.category] || categoryStories.academic;
  const story = stories[Math.floor(Math.random() * stories.length)];

  const outros = [
    '作为一只交大鸽子，咕咕觉得今天过得不错。',
    '鸽子的一天，这样就挺好。咕。',
    '明天咕咕又会去哪里呢？反正都在这个校园里，不会迷路的。',
    '有时候觉得做鸽子比做人轻松多了。咕咕。',
    '不知道有没有人注意到咕咕在这里待了一天。',
    '咕咕咕——今天的心情大概就是这样。',
    '好啦，今天的鸽子日报就到这里。晚安，人。',
    '人，你也要像鸽子一样开开心心的哦。',
  ];

  const outro = outros[Math.floor(Math.random() * outros.length)];

  return `${timePrefix[tod]}${story} ${outro}`;
}

// ====== 彩蛋文案：鸽子在时间旁 ======
function generateEasterEggCaption(
  tod: TimeOfDay,
  _campusState: string,
  _mood: string,
): string {
  const eggStories = [
    `咦？咕咕今天没有去任何地标。只是站在时间旁边，看着指针一格一格地走。时间过得好慢，又好快。`,
    `人，你发现了吗？咕咕今天不在思源湖，也不在教学楼。我停在时间的边上，看你们匆匆忙忙地赶路。`,
    `咕咕今天决定旷工。不去任何地方，就待在时间旁边。有时候停下来，比到处跑更需要勇气。`,
    `时间是个很神奇的东西。咕咕站在它旁边，看着同一分钟里有人在笑、有人在跑、有人在发呆。`,
    `嘘——不要告诉别人。咕咕发现了一个秘密地点：时间的缝隙里，可以看到校园所有角落同时发生的所有事。`,
    `咕咕今天不只是鸽子。我是时间的守卫。每一个路过的人，都被时间记下来了。`,
    `人在赶路，鸽子在看时间。时间不理人，也不理鸽子。但它会等所有人。`,
    `今天咕咕哪儿都没去。就停在时间旁边。看着太阳从东边跑到西边，像一颗滚动的橙子。`,
  ];

  const timeFeel: Record<TimeOfDay, string> = {
    dawn: '现在是清晨。天刚亮，时间好像走得特别慢。',
    morning: '上午的时间跑得飞快，大家都在上课。',
    afternoon: '午后的时间变得黏黏的，像融化的太妃糖。',
    evening: '傍晚了。时间把天空染成了橘色，然后准备下班。',
    night: '深夜的时间静悄悄的。只有路灯和鸽子还醒着。',
  };

  const story = eggStories[Math.floor(Math.random() * eggStories.length)];
  return `${timeFeel[tod]} ${story}`;
}

// ====== 短文案（照片卡片用） ======
function generatePigeonCaption(
  dominantMood: string,
  tod: TimeOfDay,
  _campusState: string,
  landmarkName: string,
): string {
  const timeWord: Record<TimeOfDay, string> = {
    dawn: '清晨', morning: '上午', afternoon: '午后', evening: '傍晚', night: '深夜',
  };

  const captions: Record<string, string[]> = {
    stress: [
      `${landmarkName}的灯还亮着。咕咕路过，替熬夜的人叹了口气。`,
      `都这么晚了，${landmarkName}还有人。人，你们不睡觉的吗？咕咕先睡了。`,
      `${landmarkName}窗户里的灯光，咕咕觉得像是星星掉进去了。`,
    ],
    romance: [
      `${landmarkName}的风都是甜的！咕咕的心情好得像飞起来一样。`,
      `在${landmarkName}看到了好温柔的画面，咕咕不好意思看，把头扭过去了。`,
      `今天${landmarkName}的晚霞特别美。咕咕想分享给你看。`,
    ],
    social: [
      `${landmarkName}今天好热闹！咕咕被人群包围了，好多人！`,
      `咕咕在${landmarkName}交到了新朋友！好吧，是鸽子单方面宣布的。`,
      `${landmarkName}有活动！咕咕挤在人群中，假装自己也被邀请了。`,
    ],
    loneliness: [
      `${timeWord[tod]}的${landmarkName}，只有咕咕一个。`,
      `咕咕在${landmarkName}待了一会儿。安静也挺好的。`,
      `${landmarkName}下雨了。鸽子有羽毛不怕，但心里有点想念太阳。`,
    ],
    energy: [
      `咕咕在${landmarkName}飞了三圈！翅膀好累但是好开心！`,
      `${landmarkName}的运动气氛好棒，咕咕也想加入。`,
      `今天活力满满！在${landmarkName}蹦蹦跳跳了一整天。`,
    ],
    warmth: [
      `${landmarkName}的太阳暖洋洋的。咕咕在石阶上趴成了一张鸽子饼。`,
      `在${landmarkName}晒太阳，有人给咕咕让了位置。好人一生平安。`,
      `${landmarkName}的午后太治愈了。咕咕的幸福只需要阳光和一个好地方。`,
    ],
    academic: [
      `在${landmarkName}看人学习。咕咕虽然看不懂书，但觉得认真的样子很好看。`,
      `${landmarkName}传来翻书声。咕咕轻轻咕了一声，没人听见。`,
      `它停在${landmarkName}窗外，假装自己在旁听。其实只是想要一个落脚的地方。`,
    ],
    slack: [
      `咕咕今天不想努力了。就在${landmarkName}躺平。`,
      `${landmarkName}的草坪真适合发呆。鸽子摸了。`,
      `不去别的地方了，${landmarkName}就是今天的全部。咕。`,
    ],
    default: [
      `咕咕路过了${landmarkName}。就只是路过而已。`,
      `在${landmarkName}停留了片刻。鸽子有鸽子的节奏。`,
      `${landmarkName}今天天气不错。咕咕觉得是个好日子。`,
    ],
  };

  const list = captions[dominantMood] || captions.default;
  return list[Math.floor(Math.random() * list.length)];
}

// ====== 表情辅助 ======
function getMoodEmoji(mood: string): string {
  const map: Record<string, string> = {
    stress: '💦', romance: '💕', social: '🎉', loneliness: '🌙',
    energy: '⚡', warmth: '☀️', academic: '📝', slack: '😴',
  };
  return map[mood] || '✨';
}

function getTimeEmoji(tod: TimeOfDay): string {
  const map: Record<TimeOfDay, string> = {
    dawn: '🌅', morning: '☀️', afternoon: '🌤️', evening: '🌇', night: '🌙',
  };
  return map[tod];
}

function getBonusEmoji(campusState: string): string {
  const map: Record<string, string> = {
    exam: '📖', spring: '🌸', graduation: '🎓', normal: '🍃',
  };
  return map[campusState] || '';
}
