import type { CampusMood, TimeOfDay, CampusState } from '../types';

export interface CharacterCondition {
  landmarks?: string[];
  timeOfDay?: TimeOfDay[];
  moodMin?: Partial<CampusMood>;
  campusState?: CampusState[];
  consecutiveDays?: { mood: keyof CampusMood; threshold: number; days: number };
}

export interface CharacterInfluence {
  moodEffect?: Partial<CampusMood>;
  landmarkBonus?: { category?: string; landmarkId?: string; multiplier: number };
  activityBonus?: { activity: string; weightBoost: number };
  photoChanceMultiplier?: number;
  atmosphereEffect?: { landmarkId: string; description: string; moodShift?: Partial<CampusMood> };
}

export interface Character {
  id: string; name: string; type: 'animal' | 'person' | 'presence';
  silhouette: string; haunt: string;
  traceHint: string; traceThreshold: number;
  observationLevels: [string, string, string, string];
  defaultPresence?: string; firstMet: string;
  condition: CharacterCondition; influence?: CharacterInfluence;
  disappearCondition?: { campusState?: CampusState[]; moodMax?: Partial<CampusMood>; afterDays?: number; permanent?: boolean };
  disappearMessage?: string;
  isRumor?: boolean;
}

export const characters: Character[] = [

  // ═══════════ 🐾 动物（8 个）═══════════

  {
    id: 'sparrow-xiaoma', name: '小麻', type: 'animal', silhouette: '🐦',
    haunt: '电院大草坪',
    traceHint: '草坪那边传来叽叽喳喳的声音。', traceThreshold: 1,
    observationLevels: [
      '它总是在草坪上跳来跳去，嗓门很大。',
      '那只麻雀已经认识鸽子了，每次见到都会凑过来。',
      '今天鸽子刚到草坪，小麻就已经在等着了。',
      '小麻今天也在那里。',
    ],
    defaultPresence: '小麻今天也在草坪那边。',
    firstMet: '那天鸽子停在草坪边，一只麻雀凑了过来。',
    condition: { landmarks: ['seiee-lawn'], timeOfDay: ['morning', 'afternoon'] },
    influence: { moodEffect: { social: 3, energy: 2 } },
  },
  {
    id: 'cat-xiaohua', name: '小花', type: 'animal', silhouette: '🐱',
    haunt: '庙门附近',
    traceHint: '庙门的墙头好像有什么东西在动。', traceThreshold: 1,
    observationLevels: [
      '庙门那只校猫，傲娇但心软，偶尔会分鸽子一点吃的。',
      '小花现在看到鸽子不会走开了，有时还会一起晒太阳。',
      '今天鸽子刚到庙门，小花就从墙上跳了下来。',
      '小花今天也在庙门的墙头上。',
    ],
    defaultPresence: '庙门的墙头上蹲着一只猫。',
    firstMet: '鸽子在庙门附近踱步时，一只花猫从墙头探出头。',
    condition: { landmarks: ['temple-gate'], timeOfDay: ['afternoon', 'evening'] },
    influence: { moodEffect: { warmth: 3, slack: 5 } },
  },
  {
    id: 'squirrel-xiaosong', name: '小松', type: 'animal', silhouette: '🐿️',
    haunt: '植物园',
    traceHint: '树上有什么东西嗖地跑过去了。', traceThreshold: 1,
    observationLevels: [
      '它总是在收集坚果，跑得飞快。',
      '小松现在会停下来看看鸽子，然后再继续忙自己的事。',
      '今天鸽子在树枝上等了一会儿，小松就从树洞里探出头来。',
      '小松今天也在树上忙自己的。',
    ],
    defaultPresence: '树上有什么东西在动。',
    firstMet: '鸽子在植物园的一棵树上发现了它。',
    condition: { landmarks: ['botanical-garden'], timeOfDay: ['morning', 'afternoon'] },
    influence: { moodEffect: { energy: 3, warmth: 2 } },
  },
  {
    id: 'duck-daqi', name: '大奇', type: 'animal', silhouette: '🦆',
    haunt: '思源湖',
    traceHint: '湖面上有一圈圈的波纹。', traceThreshold: 1,
    observationLevels: [
      '游泳健将，性格憨厚，总在湖面上晃悠。',
      '大奇看到鸽子飞过来，会嘎嘎叫两声打招呼。',
      '今天鸽子停在湖边的石头上，大奇就游过来了。',
      '大奇今天也在湖里。',
    ],
    defaultPresence: '湖面上有一只鸭子。',
    firstMet: '鸽子停在思源湖边时，一只鸭子游了过来。',
    condition: { landmarks: ['siyuan-lake'], timeOfDay: ['morning', 'afternoon', 'evening'] },
    influence: { moodEffect: { social: 2, slack: 4 } },
  },
  {
    id: 'swan-baibai', name: '白白', type: 'animal', silhouette: '🦢',
    haunt: '致远湖',
    traceHint: '远处的湖面上有一个白色的影子。', traceThreshold: 1,
    observationLevels: [
      '优雅的黑天鹅，偶尔会游到湖心亭边。',
      '白白现在会朝鸽子微微点头。很轻，但鸽子记住了。',
      '今天鸽子刚到致远湖，白白就从湖心游过来了。',
      '白白今天也在湖心。',
    ],
    defaultPresence: '远处湖面上有一个白色的影子。',
    firstMet: '致远湖的水面上，一只黑天鹅缓缓靠近了鸽子。',
    condition: { landmarks: ['zhiyuan-lake'], timeOfDay: ['morning', 'evening'] },
    influence: { moodEffect: { romance: 3, warmth: 2 } },
  },
  {
    id: 'butterfly-xiaodie', name: '小蝶', type: 'animal', silhouette: '🦋',
    haunt: '植物园',
    traceHint: '有什么彩色的东西在花丛间飘过。', traceThreshold: 1,
    observationLevels: [
      '翅膀花纹很美，总是在花丛间飘。',
      '小蝶不怕鸽子了。鸽子停在花边的时候，它就在旁边飞。',
      '今天春天又来了，小蝶还是在那片花丛里。鸽子好像一眼就认出了它。',
      '小蝶今天也在花丛那边。',
    ],
    defaultPresence: '花丛那边好像有什么彩色的东西在飞。',
    firstMet: '鸽子在植物园的花丛边停了好久，一只凤蝶落在了旁边。',
    condition: { landmarks: ['botanical-garden'], campusState: ['spring'], timeOfDay: ['morning', 'afternoon'] },
    influence: { moodEffect: { romance: 3, energy: 2 } },
    disappearCondition: { campusState: ['exam', 'graduation', 'normal'] },
    disappearMessage: '天冷了以后，花丛里安静了很多。鸽子很久没看到那只凤蝶了。',
  },
  {
    id: 'orange-cat', name: '草坪橘猫', type: 'animal', silhouette: '🐈',
    haunt: '电院大草坪',
    traceHint: '草坪那边好像有个橘色的东西在晒太阳。', traceThreshold: 1,
    observationLevels: [
      '一只总在晒太阳的橘猫。今天它抢走了鸽子的面包。',
      '橘猫现在看到鸽子不会抢了。它们会一起在草坪上晒太阳。',
      '今天鸽子刚到草坪，橘猫就已经在那里了。旁边还留了半块面包。',
      '橘猫今天也在草坪上。',
    ],
    defaultPresence: '草坪那边有个橘色的身影。',
    firstMet: '鸽子在草坪上休息，一只胖橘猫大摇大摆地走过来。',
    condition: { landmarks: ['seiee-lawn'], timeOfDay: ['afternoon'], moodMin: { slack: 45 } },
    influence: { moodEffect: { slack: 6, warmth: 3 }, activityBonus: { activity: 'hopping', weightBoost: 4 }, atmosphereEffect: { landmarkId: 'seiee-lawn', description: '草坪的午后变得格外慵懒。' } },
  },

  // ═══════════ 🧑 人物（5 个）═══════════

  {
    id: 'night-researcher', name: '深夜研究生', type: 'person', silhouette: '💡',
    haunt: '电信群楼',
    traceHint: '实验楼有一扇窗还亮着。', traceThreshold: 1,
    observationLevels: [
      '凌晨两点，实验室的灯还亮着。',
      '鸽子已经习惯在深夜飞过实验楼时，看一眼那扇窗。有时候亮着，有时候暗了。',
      '今晚那扇窗又亮着。鸽子停在窗外的树枝上，里面有翻书的声音。',
      '它路过的时候，那扇窗已经亮着了。',
    ],
    defaultPresence: '实验楼有一扇窗还亮着。',
    firstMet: '那天深夜，鸽子飞过实验楼，看到一扇窗还亮着灯。',
    condition: { landmarks: ['seiee-complex'], timeOfDay: ['night'], moodMin: { academic: 45 }, consecutiveDays: { mood: 'academic', threshold: 40, days: 2 } },
    influence: { moodEffect: { academic: 5, stress: 3 }, landmarkBonus: { category: 'building', multiplier: 1.4 }, photoChanceMultiplier: 1.3, atmosphereEffect: { landmarkId: 'seiee-complex', description: '实验楼的夜晚，总有一扇窗亮着。' } },
    disappearCondition: { moodMax: { academic: 35 }, afterDays: 5, permanent: true },
    disappearMessage: '那扇窗后来再也没有在那个时间亮过。鸽子飞过的时候，总是暗的。',
  },
  {
    id: 'lakeside-band', name: '湖边乐队', type: 'person', silhouette: '🎸',
    haunt: '思源湖',
    traceHint: '今晚思源湖那边有很轻的吉他声。', traceThreshold: 1,
    observationLevels: [
      '今晚那里有很轻的吉他声。',
      '鸽子又听到了。它停在路灯下，风把音乐吹过来。',
      '今晚鸽子刚到思源湖，就听到了吉他声。它停在老地方。像是约好了一样。',
      '今晚湖边又有吉他的声音。',
    ],
    defaultPresence: '今晚思源湖那边有吉他声。',
    firstMet: '傍晚的思源湖边传来吉他声，鸽子停在路灯下听了一会儿。',
    condition: { landmarks: ['siyuan-lake'], timeOfDay: ['evening', 'night'], moodMin: { social: 45, romance: 35 } },
    influence: { moodEffect: { social: 6, romance: 4, energy: 3 }, photoChanceMultiplier: 1.5, atmosphereEffect: { landmarkId: 'siyuan-lake', description: '思源湖的夜晚偶尔有音乐飘过。', moodShift: { romance: 5 } } },
    disappearCondition: { campusState: ['exam', 'graduation'], permanent: true },
    disappearMessage: '它后来再也没在湖边听见那把吉他。夏天的晚上变得很安静。',
  },
  {
    id: 'security-guard', name: '保安大叔', type: 'person', silhouette: '👮',
    haunt: '庙门附近',
    traceHint: '远处有手电筒的光晃了一下。', traceThreshold: 1,
    observationLevels: [
      '他每晚都会在校园里转一圈，看到鸽子会点点头。',
      '保安大叔现在认得鸽子了。深夜遇见的时候，他会放慢脚步。',
      '今晚鸽子在庙门附近等他。他来了，看到鸽子，笑了笑。',
      '远处有手电筒的光晃了一下。鸽子知道是谁。',
    ],
    defaultPresence: '远处有手电筒的光。',
    firstMet: '深夜，鸽子在庙门附近遇到了巡逻的保安。他对鸽子笑了笑。',
    condition: { landmarks: ['temple-gate'], timeOfDay: ['night', 'dawn'] },
    influence: { moodEffect: { loneliness: -5, warmth: 3 } },
  },
  {
    id: 'cleaner', name: '清晨的扫地人', type: 'person', silhouette: '🧹',
    haunt: '校园各处',
    traceHint: '天还没亮，远处传来扫地的沙沙声。', traceThreshold: 1,
    observationLevels: [
      '天还没亮的时候，就能听到扫地的沙沙声。',
      '鸽子认得那个节奏。不急不慢，从东到西。',
      '今天黎明，鸽子停在灯柱上。那个扫地的人从下面经过，没有惊动它。',
      '天还没亮，沙沙声又从远处过来了。',
    ],
    defaultPresence: '远处传来扫地的沙沙声。',
    firstMet: '黎明时分，鸽子在薄雾中看到了一个扫地的人影。他没有惊动鸽子。',
    condition: { timeOfDay: ['dawn'] },
    influence: { moodEffect: { loneliness: -3, warmth: 4 } },
  },
  {
    id: 'couple-by-lake', name: '湖边散步的人', type: 'person', silhouette: '🚶‍♀️',
    haunt: '思源湖 / 致远湖',
    traceHint: '湖边有两个人的影子，走得很慢。', traceThreshold: 1,
    observationLevels: [
      '黄昏时，总有两个人沿着湖边慢慢走。鸽子停在远处看着。',
      '鸽子又看到他们了。还是那条路，还是那个速度。',
      '今天黄昏，鸽子停在老地方。那两个人也来了。他们停下来看了一会儿晚霞。',
      '黄昏的湖边，那两个人又在那里慢慢走着。',
    ],
    defaultPresence: '湖边有两个人的影子，走得很慢。',
    firstMet: '那天傍晚的晚霞特别美。鸽子看到两个人在湖边停留了很久。',
    condition: { landmarks: ['siyuan-lake', 'zhiyuan-lake'], timeOfDay: ['evening'], moodMin: { romance: 45 } },
    influence: { moodEffect: { romance: 6, warmth: 3 } },
  },

  // ═══════════ 🌫️ 存在（1 个）═══════════

  {
    id: 'library-lights', name: '图书馆的灯', type: 'presence', silhouette: '🪟',
    haunt: '新图书馆',
    traceHint: '图书馆有一排窗户还亮着。', traceThreshold: 1,
    observationLevels: [
      '考试季的夜晚，图书馆的灯总是亮到很晚。鸽子知道，里面有很多人还在努力。',
      '鸽子已经认得这排亮着的窗户了。每次深夜飞过，它都会看一会儿。',
      '今晚鸽子停在图书馆对面的树上。窗户里有人抬头看了它一眼，然后继续低头写字。',
      '今晚那排窗户又亮着。鸽子停在对面看了一会儿。',
    ],
    defaultPresence: '图书馆有一排窗户还亮着。',
    firstMet: '深夜飞过图书馆上空时，鸽子看到了一排排亮着灯的窗户。它停在对面的树上看了很久。',
    condition: { landmarks: ['new-library'], timeOfDay: ['night'], campusState: ['exam'], moodMin: { academic: 40 } },
    influence: { moodEffect: { academic: 5, stress: 5, loneliness: 3 }, landmarkBonus: { category: 'building', multiplier: 1.5 }, atmosphereEffect: { landmarkId: 'new-library', description: '深夜的图书馆，灯光像星星一样连成一片。' } },
    disappearCondition: { campusState: ['graduation', 'spring'] },
    disappearMessage: '考试季过去了。图书馆很早就熄灯了。鸽子飞过的时候，窗户是暗的。',
  },
];
