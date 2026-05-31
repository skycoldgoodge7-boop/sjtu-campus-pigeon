import type { TimeOfDay, CampusState } from '../types';

interface CaptionTemplate {
  mood: string;
  time?: TimeOfDay;
  state?: CampusState;
  templates: string[];
}

export const photoCaptions: CaptionTemplate[] = [
  // 压力/学术 — 鸽子视角
  { mood: 'stress', time: 'night', templates: [
    '{landmark}的灯还亮着，咕咕替熬夜的人叹了口气',
    '凌晨了，{landmark}还有人。人，你们不困吗？咕咕先睡了。',
    '{landmark}的窗户像星星，咕咕在外面看着。',
  ]},
  { mood: 'academic', time: 'morning', templates: [
    '清晨的{landmark}已经有人在看书了。人好勤奋，鸽子佩服。',
    '在{landmark}遇到早起的人。咕咕打了个招呼，但对方没听见。',
    '{landmark}的早晨很安静，适合鸽子和人各自努力。',
  ]},
  { mood: 'academic', templates: [
    '咕咕停在{landmark}窗外，假装在旁听。',
    '{landmark}传来翻书声，咕咕轻轻咕了一声。',
    '在{landmark}看人学习。认认真真的样子真好看。',
  ]},
  // 浪漫
  { mood: 'romance', time: 'evening', templates: [
    '晚霞下的{landmark}美得像画一样。咕咕想分享给你看。',
    '在{landmark}看到了让人心动的画面。鸽子不好意思，把头扭过去了。',
    '夕阳把{landmark}染成了橘色。咕咕的心情也变得暖暖的。',
  ]},
  { mood: 'romance', state: 'spring', templates: [
    '{landmark}的花开了！咕咕在花瓣里打了个滚。',
    '春风拂过{landmark}，鸽子的羽毛被吹得乱七八糟。但很开心。',
    '在{landmark}闻到了花香。咕咕宣布：春天是最好的季节！',
  ]},
  { mood: 'romance', templates: [
    '{landmark}的风景好温柔。鸽子看了很久的云。',
    '停在{landmark}发呆。有时候什么都不做就是最好的事。',
    '在{landmark}吹风，鸽子的幸福就这么简单。',
  ]},
  // 社交/活力
  { mood: 'social', time: 'afternoon', templates: [
    '{landmark}好热闹！咕咕被人群包围了！',
    '{landmark}有活动。鸽子挤在人群里看热闹。',
    '今天{landmark}人特别多。咕咕交到了好多新朋友（鸽子单方面宣布的）。',
  ]},
  { mood: 'energy', templates: [
    '咕咕在{landmark}飞了三圈！翅膀好累但是好开心！',
    '{landmark}的运动气氛好棒。鸽子也想参加。',
    '今天活力满满！在{landmark}蹦蹦跳跳了一整天。',
  ]},
  // 孤独
  { mood: 'loneliness', time: 'night', templates: [
    '深夜的{landmark}，只有咕咕一个。安静也挺好的。',
    '{landmark}空荡荡的。鸽子在这里等天亮。',
    '在{landmark}独自看月亮。月亮也不说话，但它在。',
  ]},
  { mood: 'loneliness', templates: [
    '咕咕在{landmark}等了一会儿。没有人来，也没有关系。',
    '{landmark}下雨了。鸽子有羽毛不怕，但心里有点想念太阳。',
    '一个人也很好。鸽子在{landmark}学会了和自己相处。',
  ]},
  // 温暖/治愈
  { mood: 'warmth', time: 'dawn', templates: [
    '{landmark}的日出好美。咕咕觉得新的一天值得期待。',
    '清晨第一缕光照在{landmark}。鸽子醒了，世界也醒了。',
    '早安，{landmark}。早安，校园。咕。',
  ]},
  { mood: 'warmth', templates: [
    '在{landmark}晒太阳，暖洋洋的。鸽子变成了一张鸽子饼。',
    '{landmark}有人给咕咕让了位置。好人一生平安。',
    '{landmark}的午后太治愈了。幸福只需要阳光和一个好地方。',
  ]},
  // 摸鱼
  { mood: 'slack', time: 'afternoon', templates: [
    '在{landmark}草坪上躺平。鸽子今天不营业。',
    '{landmark}的午后真适合发呆。咕咕摸了。',
    '它又在{landmark}摸鱼了。鸽子的事情怎么能叫摸鱼呢。',
  ]},
  { mood: 'slack', templates: [
    '不去教室了，就在{landmark}待着。反正也没人选鸽子的课。',
    '在{landmark}看别人打球。当观众比较轻松。',
    '{landmark}的风好舒服～鸽子已经不想动了。',
  ]},
  // 通用
  { mood: 'default', templates: [
    '咕咕路过了{landmark}。只是路过。',
    '在{landmark}停留片刻。鸽子有鸽子的节奏。',
    '{landmark}今天天气不错。咕咕觉得是个好日子。',
  ]},
];

// Time gradients for photo cards
export const TIME_GRADIENTS: Record<TimeOfDay, [string, string]> = {
  dawn:    ['#FF9A9E', '#FECFEF'],
  morning: ['#A8E6CF', '#DCEDC1'],
  afternoon: ['#87CEEB', '#E0F7FA'],
  evening: ['#FF6B6B', '#FFA07A'],
  night:   ['#2C3E50', '#3498DB'],
};
