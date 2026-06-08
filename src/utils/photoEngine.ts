import type { PhotoCard, CampusMood, TimeOfDay } from '../types';
import { landmarks } from '../data/landmarks';
import { TIME_GRADIENTS } from '../data/photoCaptions';
import { getTimeOfDay, getCampusState, usePigeonStore } from '../store/pigeonStore';
import { getWeatherCaptionPrefix } from './weather';
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
const nanDaMenPhotos = import.meta.glob('../assets/photos/nan-da-men/*.{jpg,png,JPG,PNG}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const siyuanMenPhotos = import.meta.glob('../assets/photos/siyuan-men/*.{jpg,png,JPG,PNG}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
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
  'nan-da-men': Object.values(nanDaMenPhotos),
  'siyuan-men': Object.values(siyuanMenPhotos),
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
  for (const [_id, photos] of Object.entries(LANDMARK_PHOTOS)) {
    total += photos.filter((p) => !GLOBAL_USED_PHOTOS.has(p)).length;
  }
  // 加上彩蛋照片
  total += EASTER_EGG_PHOTOS.filter((p) => !GLOBAL_USED_PHOTOS.has(p)).length;
  return total;
}

/**
 * 获取还有可用照片的地标ID列表
 * （合并全局已使用 + 传入已使用）
 */
export function getAvailableLandmarkIds(usedUrls: string[]): string[] {
  const usedSet = new Set([...GLOBAL_USED_PHOTOS, ...usedUrls]);
  const available: string[] = [];
  for (const [landmarkId, photos] of Object.entries(LANDMARK_PHOTOS)) {
    const hasUnused = photos.some((p) => !usedSet.has(p));
    if (hasUnused) available.push(landmarkId);
  }
  return available;
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
    dawn: '天刚亮，',
    morning: '上午，',
    afternoon: '午后，',
    evening: '傍晚，',
    night: '入夜了，',
  };

  const categoryStories: Record<string, string[]> = {
    nature: [
      `鸽子在${landmark.name}数今天的落叶。没数完，因为又掉下来一片。`,
      `${landmark.name}的水面很平。咕咕盯着看了很久——鱼大概以为鸽子在思考什么深刻的问题。`,
      `一只蝴蝶飞过${landmark.name}。鸽子追了三米，然后想起自己也会飞。`,
      `${landmark.name}今天很安静。咕咕在草地上压出了一个鸽子形状的印子，觉得这是今天的成就。`,
      `风从${landmark.name}的西边吹过来。鸽子为此思考了大约两分钟，结论是：确实是西边。`,
    ],
    gate: [
      `蹲在${landmark.name}上看人来人往。鸽子注意到每个人走路的速度不一样——这是一个观察了五分钟的结论。`,
      `${landmark.name}有人拍照。咕咕调整了三次站姿，但拍照的人并没有在拍鸽子。`,
      `${landmark.name}的风很大。鸽子的羽毛被吹乱了，但咕咕决定把这当作一种新发型。`,
      `在${landmark.name}的屋檐上站了一会儿。下面的人像小蚂蚁，咕咕想：它们大概也在觉得鸽子像一小片云。`,
    ],
    academic: [
      `飞到${landmark.name}的窗台上。里面的人在写东西，写了很久。咕咕不懂在写什么，但猜测应该不是关于面包的。`,
      `${landmark.name}的走廊里有人在背东西。鸽子听了一会儿，一句也没记住——但这不怪鸽子。`,
      `${landmark.name}的灯还亮着。都这么晚了。咕咕觉得人可能忘了天黑应该睡觉这件事。`,
      `停在${landmark.name}的窗边。里面在上课，鸽子在外面旁听（免费的）。`,
      `${landmark.name}楼下停满了自行车。咕咕在其中一辆的车筐里站了一会儿，体验了一下有车的感觉。`,
    ],
    culture: [
      `在${landmark.name}的窗台上晒太阳。翻书的声音从里面传出来——鸽子觉得这是仅次于面包屑的声音。`,
      `${landmark.name}的光线从大窗户照进来，在地板上画了一个金色的方块。咕咕在方块里站了一会儿，假装自己是一本书。`,
      `${landmark.name}有一种旧纸和木头混在一起的气味。鸽子觉得这是知识的味道——虽然鸽子不太确定知识是什么。`,
    ],
    dining: [
      `${landmark.name}飘出来的味道让鸽子在门口徘徊了六个来回。最终没有人请鸽子进去——意料之中。`,
      `有人在${landmark.name}掉了一根薯条。鸽子计算了最佳接近路线，成功获取。`,
      `咕咕在${landmark.name}附近巡逻。今天的菜单闻起来比昨天多了两种味道——鸽子对吃的东西记忆力很好。`,
      `${landmark.name}门口排了很长的队。鸽子从队伍上方飞过，下面没人抬头——他们在看手机，鸽子理解。`,
    ],
    sports: [
      `在${landmark.name}看人跑步。一圈又一圈。咕咕不太理解为什么要跑完了回到原来的地方，但尊重。`,
      `${landmark.name}有人在做拉伸，动作很慢。鸽子跟在旁边试了一下——不太适合有翅膀的身材。`,
      `${landmark.name}的草坪很软。咕咕在上面走了几步，留下了一串鸽子脚印。不知道明天还在不在。`,
      `${landmark.name}有球赛。鸽子在旁边的树上看了五分钟，然后想起来鸽子其实没有支持的队伍。`,
    ],
    dorm: [
      `飞过${landmark.name}的阳台。晾着的衣服五颜六色，咕咕觉得这比任何旗子都好看。`,
      `${landmark.name}的窗户里传出音乐声。鸽子歪头听了听——节奏不太适合跳鸽子舞。`,
      `路过${landmark.name}。有人在楼下取外卖。咕咕看了一眼包装袋——不认识那家店，但记下了位置。`,
    ],
    service: [
      `在${landmark.name}大厅里溜达了一圈。每个人都在忙，鸽子也在忙——忙着溜达。`,
      `${landmark.name}的公告栏贴了很多海报。咕咕看不懂字，但觉得配色可以更鸽子一点。`,
    ],
  };

  const stories = categoryStories[landmark.category] || categoryStories.academic;
  const story = stories[Math.floor(Math.random() * stories.length)];

  const outros = [
    '鸽子的一天，就这样吧。咕。',
    '没有什么特别的事。鸽子觉得没有特别的事本身就是一件特别的事。咕。',
    '总的来说，做鸽子比做人少了很多麻烦——虽然也少了很多薯条。',
    '以上就是鸽子今天的视觉记录。不一定准确，但确实是鸽子看到的。',
    '咕咕咕——意思是"还行"。',
    '这样的一天，鸽子给打几分？算了，鸽子没有评分系统。',
  ];

  const outro = outros[Math.floor(Math.random() * outros.length)];

  const weatherData = usePigeonStore.getState().weatherData;
  if (weatherData && Math.random() < 0.3) {
    const wxPrefix = getWeatherCaptionPrefix(weatherData);
    if (wxPrefix) return `${wxPrefix}。${timePrefix[tod]}${story} ${outro}`;
  }
  return `${timePrefix[tod]}${story} ${outro}`;
}

// ====== 彩蛋文案：鸽子在时间旁 ======
function generateEasterEggCaption(
  tod: TimeOfDay,
  _campusState: string,
  _mood: string,
): string {
  const eggStories = [
    `咕咕今天没有去任何地标。就停在时间的旁边，看指针一格一格走。鸽子不太确定时间是什么，但觉得它是校园里唯一不用翅膀也能飞的东西。`,
    `鸽子今天旷工了。不去湖边、不去草坪，就待在时间旁边。有时候停下来比到处跑更难——这是咕咕今天花了四十秒思考出来的结论。`,
    `时间是个奇怪的东西。鸽子站在它旁边，看到同一分钟里有人在笑、有人在跑、有人在看手机。时间谁也不等，但也谁都不落下。`,
    `咕咕发现了一个秘密：从时间的缝隙看过去，可以看到校园所有角落。不过鸽子没有告诉任何人——主要是没人能听懂鸽子说话。`,
    `人在赶路，鸽子在看时间。时间不理人，也不理鸽子。这让咕咕觉得时间大概是食物链最顶端的东西。`,
    `今天鸽子哪儿都没去。就停在时间旁边。太阳从东边挪到了西边——鸽子确认了一下，这不是鸽子的幻觉。`,
    `时间旁边的视野很好。鸽子看到了赶课的人、送外卖的人、和一只看起来很困惑的猫。热闹是他们的，观察是鸽子的。`,
    `咕咕今天被时间雇佣为守卫。薪酬是：可以一直待在时间旁边。鸽子觉得这个工资还不错。`,
  ];

  const timeFeel: Record<TimeOfDay, string> = {
    dawn: '清晨。天刚亮，时间好像走得很慢——也可能只是鸽子的错觉。',
    morning: '上午。大家都在赶路，时间跑得比人还快。',
    afternoon: '午后。时间变得黏黏的，鸽子也有点困了。',
    evening: '傍晚。时间把天空调成了橘色，然后大概准备下班。',
    night: '深夜。只有路灯和鸽子还醒着。时间是唯一不睡觉的东西，鸽子是第二。',
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
      `${landmarkName}的灯还亮着。鸽子路过，大概知道为什么人需要咖啡这种东西了。`,
      `都这么晚了，${landmarkName}还有人。鸽子觉得人类低估了睡觉这件事的重要性。`,
      `${landmarkName}窗户里的灯光像是星星掉进去了。鸽子在外面看了三秒，然后想起来星星不在窗户里。`,
    ],
    romance: [
      `${landmarkName}的风今天好像比昨天温柔一点。鸽子不太确定，因为鸽子没有测量仪器。`,
      `在${landmarkName}看到有人坐在一起。鸽子把视线移开了——不是不好意思，是鸽子正好要看别的地方。`,
      `${landmarkName}的晚霞今天橘得有点过分。鸽子认证：这个颜色在鸽子的审美体系里排前三。`,
    ],
    social: [
      `${landmarkName}今天人不少。鸽子混在其中，假装有自己的事要做。`,
      `在${landmarkName}认识了新朋友。好吧，是鸽子单方面宣布的。对方可能还没收到通知。`,
      `${landmarkName}有活动。鸽子在旁边看了全程，觉得人类搞活动的方式和鸽子搞活动的方式不太一样。`,
    ],
    loneliness: [
      `${timeWord[tod]}的${landmarkName}，只有鸽子一个。这样也挺好，空间利用率很高。`,
      `在${landmarkName}待了一会儿。安静有安静的好处——至少不用解释为什么鸽子的羽毛今天有点乱。`,
      `${landmarkName}下雨了。鸽子有防水羽毛，所以这不算什么问题。`,
    ],
    energy: [
      `在${landmarkName}飞了三圈。翅膀有点酸，但鸽子觉得这算是一次不错的运动。`,
      `${landmarkName}的气氛让鸽子多跳了两下。原因不明，但鸽子决定不分析。`,
      `今天在${landmarkName}的状态：想飞就飞，不需要理由。鸽子很少能这么果断。`,
    ],
    warmth: [
      `${landmarkName}的太阳暖洋洋的。鸽子在石阶上趴成了一片——从上方看大概像一块鸽子形状的饼干。`,
      `在${landmarkName}晒太阳。鸽子觉得晒太阳是少数不需要努力就能获得回报的事情。`,
      `${landmarkName}的午后很安静。鸽子几乎睡着了——说"几乎"是因为鸽子睡觉的时候一般不会承认自己在睡觉。`,
    ],
    academic: [
      `在${landmarkName}看人学习。鸽子看不懂书，但觉得能盯着纸看那么久也是一种能力。`,
      `${landmarkName}传来翻书声。鸽子轻轻咕了一声——大概没人听见，听见了也不会翻译。`,
      `停在${landmarkName}窗外。鸽子没有在旁听，只是恰好落在这里。至于落了多久，鸽子没有计时。`,
    ],
    slack: [
      `鸽子今天在${landmarkName}的最大成就是：什么都没干。`,
      `${landmarkName}的草坪很适合发呆。鸽子测试过了，可以发呆很久。`,
      `不去别的地方了。${landmarkName}就是今天的全部行程。鸽子对行程安排很满意。`,
    ],
    default: [
      `路过${landmarkName}。鸽子觉得停一下是对的。`,
      `在${landmarkName}停留了片刻。鸽子有鸽子的节奏，不需要向任何人解释。`,
      `${landmarkName}今天看起来和昨天差不多。鸽子觉得"差不多"其实是一种很高的评价。`,
    ],
  };

  const list = captions[dominantMood] || captions.default;
  const baseCaption = list[Math.floor(Math.random() * list.length)];

  const weatherData = usePigeonStore.getState().weatherData;
  if (weatherData && Math.random() < 0.4) {
    const wxPrefix = getWeatherCaptionPrefix(weatherData);
    if (wxPrefix) return `${wxPrefix}，${baseCaption}`;
  }
  return baseCaption;
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
