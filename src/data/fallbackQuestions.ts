// ====== 兜底投票问题（AI 不可用时使用）======
// 14 条预设问题，按日期循环使用
import type { VoteOption } from '../types';

interface FallbackQuestion {
  question: string;
  options: VoteOption[];
  resultMood: string;
}

const FALLBACK_QUESTIONS: FallbackQuestion[] = [
  {
    question: '人，咕咕今天有点迷茫，你觉得鸽子应该去哪儿？',
    options: [
      { emoji: '🌿', text: '慢慢来', moodEffect: { slack: 8, stress: -5 }, targetLandmark: 'siyuan-lake' },
      { emoji: '🔥', text: '冲就完了', moodEffect: { energy: 8, academic: 4 }, targetLandmark: 'hufaguang-stadium' },
      { emoji: '🍜', text: '先去吃饭', moodEffect: { warmth: 6, social: 4 }, targetLandmark: 'dining-hall-1' },
      { emoji: '😴', text: '先睡一觉', moodEffect: { slack: 6, loneliness: -3 }, targetLandmark: 'botanical-garden' },
    ],
    resultMood: '😊',
  },
  {
    question: '人，今天阳光好好，鸽子想出去转转，该去哪儿？',
    options: [
      { emoji: '📖', text: '图书馆', moodEffect: { academic: 8, stress: 2 }, targetLandmark: 'new-library' },
      { emoji: '🌳', text: '植物园', moodEffect: { warmth: 6, romance: 4 }, targetLandmark: 'botanical-garden' },
      { emoji: '💧', text: '思源湖畔', moodEffect: { romance: 7, loneliness: -3 }, targetLandmark: 'siyuan-lake' },
      { emoji: '🍜', text: '食堂附近', moodEffect: { social: 7, energy: 3 }, targetLandmark: 'dining-hall-1' },
    ],
    resultMood: '🥳',
  },
  {
    question: '人，好多人在赶ddl。鸽子在旁边应该做点什么？',
    options: [
      { emoji: '📚', text: '默默陪伴', moodEffect: { academic: 5, warmth: 5 }, targetLandmark: 'new-library' },
      { emoji: '🍞', text: '讨点吃的', moodEffect: { social: 5, slack: 5 }, targetLandmark: 'dining-hall-1' },
      { emoji: '💤', text: '不打扰人', moodEffect: { loneliness: 5, stress: 3 }, targetLandmark: 'east-middle' },
      { emoji: '🎵', text: '唱首歌加油', moodEffect: { energy: 6, warmth: 4 }, targetLandmark: 'seiee-lawn' },
    ],
    resultMood: '🤔',
  },
  {
    question: '人，下雨了。咕咕躲在屋檐下，有点无聊，怎么办？',
    options: [
      { emoji: '☂️', text: '等雨停', moodEffect: { slack: 6, stress: -3 }, targetLandmark: 'temple-gate' },
      { emoji: '📖', text: '看会书吧', moodEffect: { academic: 7, loneliness: 2 }, targetLandmark: 'new-library' },
      { emoji: '💌', text: '捡张纸条', moodEffect: { romance: 5, social: 3 }, targetLandmark: 'siyuan-lake' },
      { emoji: '😴', text: '睡个午觉', moodEffect: { slack: 8, energy: -3 }, targetLandmark: 'east-lower' },
    ],
    resultMood: '😌',
  },
  {
    question: '人，咕咕今天特别想社交。帮鸽子想想该去找谁？',
    options: [
      { emoji: '🐱', text: '找小花猫', moodEffect: { social: 6, warmth: 4 }, targetLandmark: 'temple-gate' },
      { emoji: '🐿️', text: '找小松鼠', moodEffect: { energy: 6, social: 3 }, targetLandmark: 'botanical-garden' },
      { emoji: '🦆', text: '去湖边转转', moodEffect: { romance: 5, social: 5 }, targetLandmark: 'siyuan-lake' },
      { emoji: '👥', text: '去人多地方', moodEffect: { social: 8, energy: 2 }, targetLandmark: 'dining-hall-1' },
    ],
    resultMood: '🥳',
  },
  {
    question: '人，鸽子今天有点累。帮咕咕拿个主意？',
    options: [
      { emoji: '😴', text: '好好休息', moodEffect: { slack: 7, energy: -2 }, targetLandmark: 'east-lower' },
      { emoji: '☕', text: '喝杯咖啡', moodEffect: { energy: 8, stress: 4 }, targetLandmark: 'new-library' },
      { emoji: '🌿', text: '去草坪躺平', moodEffect: { slack: 5, warmth: 5 }, targetLandmark: 'seiee-lawn' },
      { emoji: '🍞', text: '吃点东西', moodEffect: { warmth: 6, energy: 4 }, targetLandmark: 'dining-hall-1' },
    ],
    resultMood: '😴',
  },
  {
    question: '人，做一只鸽子最重要的是什么？咕咕在想这个问题。',
    options: [
      { emoji: '🕊️', text: '自由飞翔', moodEffect: { energy: 7, social: 3 }, targetLandmark: 'siyuan-lake' },
      { emoji: '💕', text: '有人关心', moodEffect: { warmth: 7, loneliness: -5 }, targetLandmark: 'new-library' },
      { emoji: '🍞', text: '每天吃饱', moodEffect: { slack: 5, warmth: 5 }, targetLandmark: 'dining-hall-1' },
      { emoji: '🏠', text: '有个屋檐', moodEffect: { warmth: 4, stress: -4 }, targetLandmark: 'temple-gate' },
    ],
    resultMood: '🤔',
  },
  {
    question: '人，咕咕发现了一个新角落。要不要去探一下？',
    options: [
      { emoji: '🔍', text: '立刻出发', moodEffect: { energy: 8, academic: 2 }, targetLandmark: 'botanical-garden' },
      { emoji: '🗺️', text: '记在小本上', moodEffect: { academic: 6, slack: 2 }, targetLandmark: 'new-library' },
      { emoji: '👥', text: '告诉小花', moodEffect: { social: 7, warmth: 3 }, targetLandmark: 'temple-gate' },
      { emoji: '🤔', text: '明天再说', moodEffect: { slack: 7, stress: -3 }, targetLandmark: 'east-middle' },
    ],
    resultMood: '🥳',
  },
  {
    question: '人，考试季校园好安静，鸽子觉得有点冷清。',
    options: [
      { emoji: '📚', text: '在窗外守着', moodEffect: { academic: 6, warmth: 4 }, targetLandmark: 'new-library' },
      { emoji: '🍞', text: '送点吃的去', moodEffect: { warmth: 8, social: 2 }, targetLandmark: 'dining-hall-1' },
      { emoji: '🕊️', text: '安静陪着', moodEffect: { loneliness: 3, warmth: 4 }, targetLandmark: 'east-middle' },
      { emoji: '💪', text: '咕咕加油声', moodEffect: { energy: 6, social: 4 }, targetLandmark: 'hufaguang-stadium' },
    ],
    resultMood: '💪',
  },
  {
    question: '人，春天了，校园里开满了花。鸽子觉得今天不一样。',
    options: [
      { emoji: '🌸', text: '去看花', moodEffect: { romance: 8, warmth: 2 }, targetLandmark: 'botanical-garden' },
      { emoji: '📷', text: '拍张照片', moodEffect: { romance: 5, slack: 3 }, targetLandmark: 'siyuan-lake' },
      { emoji: '🎵', text: '哼个小曲', moodEffect: { energy: 7, social: 3 }, targetLandmark: 'seiee-lawn' },
      { emoji: '💤', text: '花下打盹', moodEffect: { slack: 6, romance: 4 }, targetLandmark: 'botanical-garden' },
    ],
    resultMood: '💕',
  },
  {
    question: '人，今天被喂了好多好吃的。鸽子该不该表示一下？',
    options: [
      { emoji: '💌', text: '写张纸条', moodEffect: { romance: 6, warmth: 4 }, targetLandmark: 'new-library' },
      { emoji: '🕊️', text: '表演飞行', moodEffect: { energy: 7, social: 3 }, targetLandmark: 'hufaguang-stadium' },
      { emoji: '🐦', text: '咕咕几声', moodEffect: { social: 5, warmth: 3 }, targetLandmark: 'siyuan-lake' },
      { emoji: '😴', text: '吃饱就睡', moodEffect: { slack: 8, warmth: 2 }, targetLandmark: 'east-lower' },
    ],
    resultMood: '😊',
  },
  {
    question: '人，毕业季了。鸽子看到好多穿学士服的人在拍照。',
    options: [
      { emoji: '🎓', text: '一起合影', moodEffect: { social: 6, warmth: 4 }, targetLandmark: 'temple-gate' },
      { emoji: '🕊️', text: '在旁边看', moodEffect: { warmth: 6, loneliness: 2 }, targetLandmark: 'siyuan-lake' },
      { emoji: '📷', text: '偷看照片', moodEffect: { romance: 4, slack: 4 }, targetLandmark: 'new-library' },
      { emoji: '💕', text: '捡个流苏', moodEffect: { romance: 7, warmth: 3 }, targetLandmark: 'seiee-lawn' },
    ],
    resultMood: '😊',
  },
  {
    question: '人，咕咕今天精力充沛。帮鸽子决定一下去哪儿消耗？',
    options: [
      { emoji: '✈️', text: '飞遍全校', moodEffect: { energy: 8, social: 2 }, targetLandmark: 'siyuan-lake' },
      { emoji: '🏟️', text: '去体育场', moodEffect: { energy: 7, social: 3 }, targetLandmark: 'south-stadium' },
      { emoji: '🌳', text: '探索植物园', moodEffect: { romance: 5, warmth: 3 }, targetLandmark: 'botanical-garden' },
      { emoji: '😌', text: '节约体力', moodEffect: { slack: 6, energy: -2 }, targetLandmark: 'east-middle' },
    ],
    resultMood: '🥳',
  },
  {
    question: '人，夕阳好美。鸽子在想这一刻该做点什么。',
    options: [
      { emoji: '🌅', text: '静静看完', moodEffect: { warmth: 6, loneliness: -3 }, targetLandmark: 'zhiyuan-lake' },
      { emoji: '📷', text: '记住就好', moodEffect: { romance: 6, slack: 2 }, targetLandmark: 'siyuan-lake' },
      { emoji: '🎵', text: '哼段小曲', moodEffect: { energy: 4, warmth: 4 }, targetLandmark: 'seiee-lawn' },
      { emoji: '💌', text: '写进日记', moodEffect: { academic: 4, romance: 4 }, targetLandmark: 'new-library' },
    ],
    resultMood: '😌',
  },
];

// V2.0: 今日话题（替代原传闻）
const FALLBACK_TOPICS = [
  '食堂某个窗口，其实藏着一道只有老生才知道的菜。新生吃完会沉默三秒。',
  '思源湖的夕阳，是交大最被低估的风景。鸽子每天看，可以作证。',
  '在图书馆趴着睡了二十分钟，不应该被算作摸鱼。',
  '植物园里的猫，比你更懂什么叫"你急你先走"。',
  '在电院草坪上躺一下午，算不算一种正经事？这是一个值得讨论的问题。',
  '图书馆里那本1978年的借书卡，上面最后一个名字现在已经是院士了。',
  '庙门的石狮子，可能比大多数学生更早来到这个校园——而且不用交学费。',
  '南大门外的小吃摊，见证过的深夜故事比心理咨询室还多。',
  '清晨六点的致远湖，有一种"全世界都在睡只有你和鸽子醒着"的安静。',
  '设计学院的天台，能看到整个闵行校区最美的落日。鸽子鉴定过了。',
  '胡法光体育场的跑道，见证过太多人的坚持——和更多人的"算了走一圈也行"。',
  '樱花季的交大，是全年唯一不用任何理由就可以在路上停下来发呆的时候。',
  '东中院某间教室的黑板上，偶尔会出现一行匿名的小诗——第二天还在，说明保洁阿姨也喜欢。',
  '毕业那天，你最想再去一次的校园角落——鸽子觉得应该是那个你从来没去过的角落。',
];

// ── 导出 ──

export function getFallbackQuestion(date: string): FallbackQuestion {
  // 简单 hash 日期到 0-13
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = ((hash << 5) - hash + date.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % FALLBACK_QUESTIONS.length;
  return FALLBACK_QUESTIONS[index];
}

export function getFallbackTopic(date: string): string {
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = ((hash << 5) - hash + date.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % FALLBACK_TOPICS.length;
  return FALLBACK_TOPICS[index];
}

/** @deprecated 使用 getFallbackTopic */
export const getFallbackRumor = getFallbackTopic;
