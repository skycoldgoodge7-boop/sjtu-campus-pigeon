// ====== 特殊日期检测 ======
export interface SpecialDate {
  name: string;
  emoji: string;
  prompt: string; // 传给 AI 的上下文
}

export function detectSpecialDate(): SpecialDate | null {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();

  // 高考 (6月7-9日)
  if (m === 6 && d >= 7 && d <= 9) {
    return { name: '高考', emoji: '✍️', prompt: '今天是高考的日子，全国的高中生都在考场上。鸽子作为一只校园鸽子，对高考有什么有趣的感慨？（比如：忘记报名、想在考场窗外咕咕叫、替考生紧张等等，幽默温暖）' };
  }
  // 毕业季
  if (m === 6 && d >= 20 && d <= 30) {
    return { name: '毕业季', emoji: '🎓', prompt: '毕业季到了，校园里到处是穿着学士服拍照的人。鸽子对毕业有什么感慨？' };
  }
  // 国庆
  if (m === 10 && d >= 1 && d <= 7) {
    return { name: '国庆假期', emoji: '🇨🇳', prompt: '国庆假期，校园里比平时安静了很多。鸽子发现人少了，有什么想法？' };
  }
  // 中秋
  if (m === 9 && d === 17 || m === 10 && d === 6) {
    // approximate 2026 dates
    return { name: '中秋', emoji: '🥮', prompt: '中秋节，月亮特别圆。鸽子在天台上看月亮，想对校园里还在奋斗的人说点什么？' };
  }
  // 元旦
  if (m === 1 && d === 1) {
    return { name: '元旦', emoji: '🎉', prompt: '新的一年开始了！鸽子作为校园的常驻居民，对新的一年有什么期待？' };
  }
  // 愚人节
  if (m === 4 && d === 1) {
    return { name: '愚人节', emoji: '🤡', prompt: '愚人节！鸽子今天听到的所有消息都可能是假的。鸽子觉得校园里最离谱的愚人节玩笑会是什么？' };
  }
  // 双十一
  if (m === 11 && d === 11) {
    return { name: '双十一', emoji: '🛒', prompt: '双十一到了！虽然鸽子不需要买东西，但它看到快递站爆满，有什么有趣的观察？' };
  }
  // 寒假前
  if (m === 1 && d >= 5 && d <= 15) {
    return { name: '期末季', emoji: '📚', prompt: '期末季，图书馆通宵亮灯。鸽子看着大家复习，有什么想说的？' };
  }
  // 樱花季
  if (m === 3 && d >= 20 && d <= 31 || m === 4 && d <= 10) {
    return { name: '樱花季', emoji: '🌸', prompt: '校园里的樱花开得正好！鸽子在樱花树下，有什么浪漫或有趣的想法？' };
  }

  return null;
}

// ====== 特殊日期感慨生成 ======
export async function generateSpecialDateComment(
  apiKey: string,
  specialDate: SpecialDate,
): Promise<string | null> {
  const system = `你是上海交大校园鸽"咕咕"。今天是一个特殊的日子：${specialDate.name}。
请用鸽子/咕咕自称，说一句关于今天的有趣感慨（20-40字）。
要求：
- 自称"鸽子"或"咕咕"，不用"我"
- 鸽子视角的冷幽默——把一件大事用鸽子逻辑轻松地带过
- 只用纯文字，不要emoji标题
${specialDate.prompt}`;

  const user = `今天是${specialDate.name}，请用鸽子的口吻说一段感慨：`;
  return callGLM4Flash(apiKey, system, user);
}

import type { CampusMood } from '../types';
import type { WeatherData } from './weather';
import { characters } from '../data/characters';

// ====== 智谱AI GLM-4-Flash 配置 ======
const ZHIPU_API = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const MODEL = 'glm-4-flash';

// ====== 日记增强上下文 ======
export interface JournalContext {
  date: string;
  feedCount: number;
  todayFeedTotals: Record<string, number>;
  landmarksVisited: string[];
  mostStayedLandmark: string;
  todayEncounters: string[];
  mood: CampusMood;
  weatherData: WeatherData | null;
  campusState: string;
  nightActivity: string | null;
  pickedNote: string | undefined;
  specialItems: string[];
  giftFlags?: { hasUmbrella: boolean; hasCamera: boolean; hasHeadphone: boolean; hasScarf: boolean; hasFlower: boolean };
}

function buildJournalPrompt(ctx: JournalContext): { system: string; user: string } {
  const dateLabel = ctx.date.slice(5);

  // 有人来过吗（布尔级别，不提具体数字）
  const hadVisitors = ctx.feedCount > 0;
  const giftLine = buildGiftNarrative(ctx);

  // 天气
  let weatherLine = '';
  if (ctx.weatherData) {
    weatherLine = `${ctx.weatherData.emoji} ${ctx.weatherData.label}，${ctx.weatherData.temperature}°C`;
  }

  // 情绪
  let domMood = ''; let domVal = 0;
  for (const [key, val] of Object.entries(ctx.mood)) {
    if (val > domVal) { domMood = key; domVal = val; }
  }
  const moodLabels: Record<string, string> = {
    stress: '有些紧张', romance: '心里暖暖的', social: '想和大家待在一起', loneliness: '有点想自己静静',
    energy: '精力充沛', warmth: '暖洋洋的', academic: '想学点东西', slack: '什么都不想做',
  };

  // 遇见
  const encounterNames = ctx.todayEncounters
    .map((cid) => characters.find((c) => c.id === cid)?.name)
    .filter(Boolean);

  // 纸条
  let noteLine = '';
  if (ctx.pickedNote) {
    noteLine = `捡到了一张纸条："${ctx.pickedNote}"`;
  }

  // 夜间活动
  let nightLine = ctx.nightActivity || '';

  const system = `你是上海交大闵行校区的鸽子，名字叫"咕咕"。你每天写一篇私人观察日记。

自称用"鸽子"或"咕咕"交替，不用"我"。

最重要的规则：绝不写地点名。
地图已经告诉用户鸽子在哪了。日记不需要重复"我去了思源湖"、"今天在图书馆"。

日记应该写：
- 那里的风是什么感觉
- 光线是什么样的
- 听到了什么声音
- 闻到了什么气味
- 看到了什么样的人

幽默来自错位感——鸽子用一本正经的语气对待完全不必认真的事。
语感参考：
- 转折 + 歪理："食堂飘出很香的味道，可惜没有人请鸽子吃饭。咕咕觉得这不太公平。"
- 小题大做："今天最大的成就是成功盯着一只蚂蚁走了十七步。蚂蚁应该没发现。"
- 单方面关系："和窗台上的猫对视了三秒。咕咕觉得这是友谊的开始，猫大概不这么认为。"
- 认真思考無用之事："风从东边吹来。鸽子为此思考了大约五分钟，结论是：确实是东风。"
- 承认局限但理直气壮："书上的字鸽子一个也看不懂。但咕咕觉得，看不懂不代表不能评价这本书的封面——封面的蓝色很好看。"
- 鸽子逻辑："石狮子从来不回答鸽子的问好。咕咕推测石狮子可能是上夜班的，白天在睡觉。"

禁止的行为：
- 禁止写任何地标名称（思源湖、图书馆、植物园、庙门、食堂……一律禁止）
- 禁止写"今天去了X"、"在X待得最久"、"从X飞到Y"
- 禁止写任何数字、统计、百分比、排名
- 禁止写煽情结尾（"希望大家……""愿每个人……"）
- 禁止写励志升华（"在知识的海洋里……""青春真美好……"）
- 禁止刻意搞笑——不要用语气词（"哈哈""嘻嘻"），不要夸张，幽默是藏在叙述里的

写作风格：
- 自称"鸽子"和"咕咕"交替
- 每段2-3句话，总共3-5段
- 要自然地提到天气和光线——但不提"温度"数字
- 如果捡到了纸条，回应要具体，不能泛泛
- 如果收到了礼物，自然融入叙事——不说"感动""谢谢"；可以歪理比如"这把伞比鸽子的翅膀大很多，有点浪费"
- 如果遇见了其他小动物或人，描述动作和样子——不说"在X地点遇见了Y"
- 如果有人来过，只说痕迹（落叶上的脚印、台阶上的面包屑），不提人数
- 幽默感要淡淡地融在观察里，不是讲笑话——读者要顿一下才觉得"这只鸽子有点好笑"
- 结尾轻轻收，像顺手合上一本小本子

格式：纯文字日记，不需要标题和日期。`;

  const user = `写一下${dateLabel}的校园观察日记。

今天的氛围：
- 它在${ctx.mostStayedLandmark ? '一个' + getPlaceType(ctx.mostStayedLandmark) : '校园某处'}待了很久
- 天气：${weatherLine}
- 它感到${moodLabels[domMood] || '平静'}
${hadVisitors ? '- 有人来看过它' : '- 今天很安静'}
${giftLine ? `- ${giftLine}` : ''}
${encounterNames.length > 0 ? `- 看见了一些熟悉的身影` : ''}
${noteLine ? `- ${noteLine}` : ''}
${nightLine ? `- ${nightLine}` : ''}

（注意：以上只是背景信息。日记里不要提地名——只写感受和观察到的细节。）

请用鸽子的口吻写今天的观察日记：`;

  return { system, user };
}

/** 将地标名转为氛围类型（不泄露具体地点） */
function getPlaceType(landmarkName: string): string {
  const map: Record<string, string> = {
    '思源湖': '湖边', '致远湖': '湖边',
    '图书馆': '有很多书的地方', '新图书馆': '有很多书的地方',
    '庙门': '有石狮子的地方', '南大门': '校门附近',
    '植物园': '花草很多的地方', '电院草坪': '草坪上',
    '胡法光体育场': '运动场旁边', '南区体育场': '运动场旁边',
    '一餐': '飘着饭香的地方', '二餐': '飘着饭香的地方',
    '人文学院': '安静的楼里', '设计学院': '安静的楼里',
    '电信群楼': '有很多窗户的大楼', '图信楼': '有很多窗户的大楼',
    '东中院': '有很多教室的地方', '东下院': '有很多教室的地方',
    '思源门': '校门附近',
  };
  return map[landmarkName] || '校园里';
}
function buildGiftNarrative(ctx: JournalContext): string {
  const f = ctx.giftFlags;
  if (!f) return '';
  const parts: string[] = [];
  if (f.hasUmbrella) parts.push('有人给了它一把伞');
  if (f.hasFlower) parts.push('有人送了一朵花');
  if (f.hasCamera) parts.push('有人把相机借给了它');
  if (f.hasHeadphone) parts.push('有人给它戴上了耳机');
  if (f.hasScarf) parts.push('有人给它系了条围巾');
  return parts.join('；');
}

// ====== API 调用 ======
export async function callGLM4Flash(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<string | null> {
  if (!apiKey || apiKey.length < 10) return null;
  // P0: 离线时直接返回 null，避免 15s 超时等待
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(ZHIPU_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.9,
        max_tokens: 800,
        top_p: 0.95,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') return null;

    return content.trim();
  } catch {
    return null;
  }
}

// ====== 日记增强入口 ======
export async function enhanceJournalContent(
  apiKey: string,
  ctx: JournalContext,
): Promise<string | null> {
  const { system, user } = buildJournalPrompt(ctx);
  return callGLM4Flash(apiKey, system, user);
}

// ====================================================================
// 每日投票问题生成
// ====================================================================

export interface VoteGenContext {
  dominantMood: string;
  moodValue: number;
  weatherLabel: string;
  campusState: string;
  currentLocation: string;
  journalSnippet: string | null;
}

function buildVotePrompt(ctx: VoteGenContext): { system: string; user: string } {
  const system = `你是交大校园鸽"咕咕"的小助手，负责生成每日投票问题。

问题用"咕咕"或"鸽子"自称，直接称呼用户为"人"。

语感参考——淡淡的幽默，鸽子认真地问一件不太需要认真的事：
- "人，咕咕今天数了数自己的羽毛，没数完就忘了数到哪了。你觉得鸽子还要重新数吗？"
- "人，下雨了。鸽子在屋檐下待着，但咕咕开始怀疑屋檐也在躲雨。你觉得呢？"
- "人，今天有只蝴蝶飞过去了。鸽子追了三米，然后想起自己会飞。帮咕咕决定接下来干什么？"
- "人，咕咕刚才打了一个哈欠。鸽子觉得这件事值得记录，你觉得接下来该做点什么？"

要求：
- 4个选项，每项带一个emoji和简短文字（不超过6个字）
- 每个选项暗示不同的情绪影响方向（有的让鸽子放松、有的振奋、有的浪漫、有的学术等）
- 每个选项可以包含一个 targetLandmark（可选的交大地标ID），表示如果这个选项赢了，鸽子明天会从这里出发
- 可用地标ID：siyuan-lake, new-library, temple-gate, botanical-garden, dining-hall-1, hufaguang-stadium, seiee-lawn, zhiyuan-lake, south-stadium, humanities-school, design-school, tuxin-building, east-middle, east-lower, siyuan-men, nan-da-men
- targetLandmark 不是必填，但如果有明确的地点指向就应该填上
- 问题可以带一点小委屈或鸽子式的认真（把小事当大事）
- 选项里最好有一个"算了""不干了""躺平"方向
- 不要用感叹号堆叠，语气自然，幽默藏在问题本身

返回标准JSON（不要markdown包裹）：
{
  "question": "鸽子的问题（自称咕咕/鸽子，称用户为人，带淡淡的幽默）",
  "options": [
    {"emoji": "🌿", "text": "慢慢来", "moodEffect": {"slack": 8, "stress": -5}},
    {"emoji": "📚", "text": "去图书馆", "moodEffect": {"academic": 8, "energy": 3}, "targetLandmark": "new-library"},
    {"emoji": "🍜", "text": "先去吃饭", "moodEffect": {"warmth": 6, "social": 4}, "targetLandmark": "dining-hall-1"},
    {"emoji": "😴", "text": "不干了", "moodEffect": {"slack": 6, "loneliness": -3}}
  ],
  "resultMood": "😊",
  "behaviorMod": {"moveChanceMod": 1.0, "activityWeights": {}}
}

moodEffect 的可用维度：stress, romance, social, loneliness, energy, warmth, academic, slack。数值范围 -10 到 +10。
resultMood 根据整体情绪倾向选：😊 开心 / 🤔 思考 / 😴 困倦 / 🥳 兴奋 / 😌 平静 / 💪 有干劲 / 💕 浪漫 / 📚 学霸模式
behaviorMod.moveChanceMod：开心/兴奋 1.3~1.8，困倦/平静 0.3~0.6，默认 1.0。
behaviorMod.activityWeights：可选的额外活动权重，如 {"sleeping": 10, "dancing": 5}。`;

  const user = `鸽子今天的状态：
- 主导情绪：${ctx.dominantMood} (${ctx.moodValue}/100)
- 天气：${ctx.weatherLabel}
- 校园状态：${ctx.campusState === 'spring' ? '春天' : ctx.campusState === 'exam' ? '考试季' : ctx.campusState === 'graduation' ? '毕业季' : '平日'}
- 现在在：${ctx.currentLocation}
${ctx.journalSnippet ? `- 最近日记片段：${ctx.journalSnippet}` : ''}

请生成今天适合投票的问题和选项：`;

  return { system, user };
}

export interface GeneratedVote {
  question: string;
  options: Array<{ emoji: string; text: string; moodEffect: Partial<Record<string, number>>; targetLandmark?: string }>;
  resultMood: string;
  behaviorMod: { moveChanceMod: number; activityWeights: Partial<Record<string, number>> };
}

export async function generateDailyVoteQuestion(
  apiKey: string,
  ctx: VoteGenContext,
): Promise<GeneratedVote | null> {
  const { system, user } = buildVotePrompt(ctx);
  const raw = await callGLM4Flash(apiKey, system, user);
  if (!raw) return null;
  try {
    // 清理可能的 markdown 代码块包裹
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned) as GeneratedVote;
  } catch {
    return null;
  }
}

// ====================================================================
// 今日话题生成（原"校园传闻"，V2.0 改名）
// ====================================================================

export interface TopicGenContext {
  campusState: string;
  landmarkNames: string[];
  recentHotspotTitle: string | null;
}

/** @deprecated 使用 TopicGenContext */
export type RumorGenContext = TopicGenContext;

function buildTopicPrompt(ctx: TopicGenContext): { system: string; user: string } {
  const system = `你是交大校园鸽子"咕咕"的小助手。每天你会提出一个关于校园生活的"今日话题"。

话题是一个陈述句或反问句，像一个观察了很久的人说了一句不咸不淡但细想有点对的话。

例如：
- "食堂某个窗口，其实藏着一道只有老生才知道的菜——新生吃完第一口会沉默三秒。"
- "致远湖的夕阳，全校最被低估的风景。鸽子每天看，可以作证。"
- "考试周的通宵教室，空调温度和心态稳定性呈反比。"
- "交大的猫比你更懂哪条路晒太阳最舒服。"

要求：
- 话题覆盖范围：考试周、樱花季、食堂、图书馆、社团活动、选课、毕业、校庆、校友回忆、体育、校园角落、自习、夜宵、猫咪、天气等
- 让人想投票（认同/不认同）
- 不能涉及真实人物姓名或敏感话题
- 20-40个字
- 不要在话题里出现"咕咕""鸽子"——话题是校园的，不是鸽子的
- 风格：有一点点观察家的冷幽默，不说破，像贴在公告栏角落的一张便签
- 偶尔可以有一个温柔的小反驳，比如"在图书馆趴着睡了二十分钟，不应该被算作摸鱼"

只返回话题文字，不要"今日话题："前缀，不要任何其他内容。`;

  const user = `今天的校园背景：
- 状态：${ctx.campusState === 'spring' ? '春天，花开校园' : ctx.campusState === 'exam' ? '考试季，大家埋头复习' : ctx.campusState === 'graduation' ? '毕业季，离别的季节' : '日常学期'}
- 校园地标：${ctx.landmarkNames.slice(0, 5).join('、')}等
${ctx.recentHotspotTitle ? `- 最近校园热点：${ctx.recentHotspotTitle}` : ''}

请生成今天的校园话题：`;

  return { system, user };
}

export async function generateDailyTopicContent(
  apiKey: string,
  ctx: TopicGenContext,
): Promise<string | null> {
  const { system, user } = buildTopicPrompt(ctx);
  return callGLM4Flash(apiKey, system, user);
}

/** @deprecated 使用 generateDailyTopicContent */
export const generateDailyRumorContent = generateDailyTopicContent;

// ====================================================================
// 校园日报生成
// ====================================================================

export interface NewspaperContext {
  date: string;
  locationName: string;
  locationEmoji: string;
  itinerary: string[];
  todayTopic: string;
  voteWinnerEmoji: string;
  voteWinnerText: string;
  voteDistribution: number[];   // 百分比
  resultMood: string;
  photoCaption: string;
  collectedItems: Array<{ emoji: string; name: string; description: string }>;
  rumorContent: string | null;
  moodSummary: string;
  weatherSummary: string;
  interactionCount: number;     // 今日互动总人次
  feedCount: number;
  topGift: string;              // 最受欢迎的礼物
}

function buildNewspaperPrompt(ctx: NewspaperContext): { system: string; user: string } {
  const dateLabel = ctx.date.slice(5);

  const system = `你是上海交大闵行校区的鸽子"咕咕"，也是《校园鸽报》的主编。请根据今天校园里发生的一切，写一份日报。

自称用"鸽子"或"咕咕"交替，不用"我"。

日报固定栏目（按顺序，用emoji做小标题）：
1. 📍 今日驻留：今天在哪待得最久，那里的氛围怎么样
2. 🏆 今日投票：今天投票的问题和结果（哪个选项赢了，多少比例）
3. 🎁 今日礼物：收到了什么（列出礼物及其意义）
4. 📸 今日照片：鸽子作为"摄影师"的点评。照片 caption 已在别处展示，这里不要复述 caption 的内容。
      改为鸽子式歪理点评构图或拍摄花絮。一句话。例："咕咕觉得这张光线不错，虽然鸽子不太确定什么是光线。"或"拍这张时风突然来了，画面歪了——鸽子称为动态构图。"
5. 💬 今日话题：今天的校园话题是什么，大家的看法
6. 🕊 鸽子的话：鸽子对今天校园氛围的一句话总结

写作风格：
- 像动物森友会的晨间广播，但更克制——少一点元气，多一点鸽子式歪理
- 每段2-3句
- 播报数据时可以加一点鸽子式点评，比如"得票率最高的选项是'去图书馆'——鸽子认为这是一个很有学术追求的选择，虽然鸽子不知道学术是什么意思"
- 对参与投票和投喂的人可以提一句——称他们为"人"
  例如："人，今天有这么多人来投票，鸽子有点受宠若惊。鸽子只有核桃大的大脑，暂时处理不了这么多善意。"
- 不要煽情，不要"同学们""大家"
- 结尾"鸽子的话"可以是一句鸽子式总结——半认真半跑偏
- 整体要有"今天就是这样"的感觉

格式：每段用emoji标题开头，无需额外装饰。`;

  const itemsText = ctx.collectedItems.length > 0
    ? ctx.collectedItems.map((i) => `${i.emoji} ${i.name}`).join('、')
    : '今天没有捡到新东西';

  const user = `写一下 ${dateLabel} 的校园鸽报。

今日数据：
- 📍 驻留：${ctx.locationEmoji} ${ctx.locationName}
- 🕊️ 行程：${ctx.itinerary.join(' → ') || '一直待在' + ctx.locationName}
- 🏆 投票问题："${ctx.todayTopic}"
- 🏆 投票结果：${ctx.voteWinnerEmoji} "${ctx.voteWinnerText}" 胜出（${ctx.voteDistribution.map((p, i) => `选项${i + 1}: ${p}%`).join('，')}），共 ${ctx.interactionCount} 人参与互动
- 🎁 今日收到 ${ctx.feedCount} 次投喂，最受欢迎的是 ${ctx.topGift}
- 🎁 具体礼物：${itemsText}
- 📸 照片 caption（已单独展示，不要复述）：${ctx.photoCaption}
- 💬 今日话题：${ctx.rumorContent || '今天没有特别的话题'}
- 天气：${ctx.weatherSummary}
- 鸽子心情：${ctx.moodSummary}

请写一份温暖的校园鸽报：`;

  return { system, user };
}

export async function enhanceNewspaperContent(
  apiKey: string,
  ctx: NewspaperContext,
): Promise<string | null> {
  const { system, user } = buildNewspaperPrompt(ctx);
  return callGLM4Flash(apiKey, system, user);
}

// ====== 日报标题生成 ======
export async function generateNewspaperHeadline(
  apiKey: string,
  ctx: NewspaperContext,
): Promise<string | null> {
  const system = `你是《校园鸽报》的标题编辑。根据今天的数据，生成一个10-18字的报纸标题。

要求：
- 带一点点鸽子式的歪理或冷幽默，不是纯粹的新闻标题
- 参考格式：《思源湖三连冠：人类对湖边的执念鸽子不太理解》《今日47人投票决定鸽子去向——鸽子服从安排》《图书馆险胜食堂一票，知识暂时战胜了食欲》
- 可以概括今天的亮点（投票结果、热闹程度、天气），但要用鸽子的角度
- 只用纯文字，一个标题`;

  const user = `今天的亮点：${ctx.locationName}待得最久，${ctx.voteWinnerText}赢了投票（${ctx.interactionCount}人参与），收到了${ctx.feedCount}次投喂。请生成今日鸽报标题：`;

  return callGLM4Flash(apiKey, system, user);
}
