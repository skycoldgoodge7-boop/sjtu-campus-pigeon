export interface Friend {
  id: string;
  name: string;
  species: string;
  emoji: string;
  description: string;
  giftEmoji: string;
  giftName: string;
  rarity: 'common' | 'uncommon' | 'rare';
  greeting: string;
}

export const friends: Friend[] = [
  {
    id: 'sparrow-xiaoma',
    name: '小麻',
    species: '麻雀',
    emoji: '🐦',
    description: '住在电院大草坪附近的麻雀，是个话痨。',
    giftEmoji: '🌾',
    giftName: '稻穗',
    rarity: 'common',
    greeting: '啾啾！鸽子哥/姐，我又来找你玩啦！今天有什么好吃的吗？',
  },
  {
    id: 'cat-xiaohua',
    name: '小花',
    species: '猫咪',
    emoji: '🐱',
    description: '庙门附近的校猫，傲娇但心软。',
    giftEmoji: '🐟',
    giftName: '小鱼干',
    rarity: 'common',
    greeting: '喵～路过顺便来看看你。别误会，我才不是特意来找你的呢！',
  },
  {
    id: 'squirrel-xiaosong',
    name: '小松',
    species: '松鼠',
    emoji: '🐿️',
    description: '植物园的小松鼠，特别爱收集各种坚果。',
    giftEmoji: '🥜',
    giftName: '花生',
    rarity: 'common',
    greeting: '吱吱！我带了好吃的坚果来分享！你上次说的那个故事后来怎样了？',
  },
  {
    id: 'duck-daqi',
    name: '大奇',
    species: '鸭子',
    emoji: '🦆',
    description: '思源湖的鸭子，游泳健将，性格憨厚。',
    giftEmoji: '🪷',
    giftName: '小莲花',
    rarity: 'uncommon',
    greeting: '嘎嘎！今天天气真好！我从湖里给你带了点好东西！',
  },
  {
    id: 'swan-baibai',
    name: '白白',
    species: '天鹅',
    emoji: '🦢',
    description: '致远湖的黑天鹅，优雅高贵但很友好。',
    giftEmoji: '🪶',
    giftName: '天鹅羽毛',
    rarity: 'uncommon',
    greeting: '亲爱的鸽子，我在湖心亭等了你一天，你怎么没来呀？只好我来找你了。',
  },
  {
    id: 'rabbit-tuantuan',
    name: '团团',
    species: '兔子',
    emoji: '🐰',
    description: '蔷薇园附近的兔子，跳得飞快，性格软萌。',
    giftEmoji: '🥕',
    giftName: '胡萝卜',
    rarity: 'common',
    greeting: '蹦蹦跳跳来找鸽子玩！今天蔷薇园的fafa又开了新的，超好看！',
  },
  {
    id: 'butterfly-xiaodie',
    name: '小蝶',
    species: '蝴蝶',
    emoji: '🦋',
    description: '植物园的凤蝶，翅膀花纹超美。',
    giftEmoji: '🌺',
    giftName: '花蜜',
    rarity: 'uncommon',
    greeting: '翩翩飞来了～鸽子你看我的新翅膀好看吗？刚从植物园那边飘过来的！',
  },
  {
    id: 'owl-boshi',
    name: '博士',
    species: '猫头鹰',
    emoji: '🦉',
    description: '住在图书馆附近的猫头鹰，知识渊博。',
    giftEmoji: '📜',
    giftName: '古籍残页',
    rarity: 'rare',
    greeting: '咕咕咕...（推了推眼镜）我今天读了很有趣的书，特意来跟你分享。',
  },
  {
    id: 'redbird-honghong',
    name: '红红',
    species: '朱雀',
    emoji: '🐤',
    description: '神秘的红色小鸟，据说能带来好运。',
    giftEmoji: '🍒',
    giftName: '红豆',
    rarity: 'rare',
    greeting: '啾～听说你是个旅行家？我也想听听你的故事！这是我珍藏的红豆，送你一颗！',
  },
];
