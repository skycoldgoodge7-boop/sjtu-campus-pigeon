// ====== 照片数据 ======
// 鸽子和朋友的合影（角色遇见解锁） + 地标打卡照片（按地标分组）
// 所有照片通过 Vite import.meta.glob 内联
// caption 统一使用咕咕第一人称视角

interface PhotoModule { default: string }

// ── 角色合影 ──
const encounterModules = import.meta.glob<PhotoModule>(
  '../assets/photos-gallery/encounters/*.{jpg,jpeg,png}',
  { eager: true }
);

const encounterMap: Record<string, string> = {};
for (const [p, mod] of Object.entries(encounterModules)) {
  const filename = p.split('/').pop() || '';
  encounterMap[filename] = mod.default;
}

export interface EncounterPhoto {
  characterId: string;
  path: string;
  caption: string;
}

/** 角色合影 — 遇见角色到 stage≥2 时在"遇见"tab卡片中展示 */
export const encounterPhotos: EncounterPhoto[] = [
  { characterId: 'sparrow-xiaoma',    path: encounterMap['鸽子和麻雀在电草.png'] || '',        caption: '小麻今天心情好像不错，我们一起在草里找了好久的东西。' },
  { characterId: 'cat-xiaohua',       path: encounterMap['鸽子和小猫在电草.jpg'] || '',        caption: '小花在草坪上晒太阳。我站在旁边，它没有赶我走。' },
  { characterId: 'duck-daqi',         path: encounterMap['大奇和咕咕在思源湖.jpg'] || '',      caption: '大奇游过来跟我打招呼。湖水很凉，它看起来很自在。' },
  { characterId: 'orange-cat',        path: encounterMap['咕咕依偎着橘猫.png'] || '',          caption: '橘猫的毛很软。我靠了一会儿，它咕噜咕噜地响。' },
  { characterId: 'orange-cat',        path: encounterMap['咕咕在庙门前与橘猫玩耍.png'] || '',  caption: '庙门前的橘猫伸了个懒腰。它好像在这里等什么人。' },
  { characterId: 'couple-by-lake',    path: encounterMap['咕咕在黄昏栏杆上看小情侣.png'] || '',caption: '黄昏的时候，栏杆那边有两个人。他们说了很久的话。' },
  { characterId: 'butterfly-xiaodie', path: encounterMap['鸽子在植物园追小蝶.jpg'] || '',      caption: '小蝶飞得很快。我追了两步就放弃了。它大概有很重要的事。' },
  { characterId: 'lakeside-band',     path: encounterMap['咕咕遇到湖边歌手.jpg'] || '',        caption: '湖边有人在唱歌。我停在旁边听了一会儿。风把歌声吹得很远。' },
].filter(p => p.path);

/** 根据角色ID获取合影 */
export function getEncounterPhoto(characterId: string): EncounterPhoto | undefined {
  return encounterPhotos.find((p) => p.characterId === characterId);
}

// ── 地标打卡照片 ──
const landmarkModules = import.meta.glob<PhotoModule>(
  '../assets/photos-gallery/landmarks/**/*.{jpg,jpeg,png}',
  { eager: true }
);

const landmarkMap: Record<string, string> = {};
for (const [p, mod] of Object.entries(landmarkModules)) {
  const parts = p.split('/');
  const folder = parts[parts.length - 2] || '';
  const filename = parts[parts.length - 1] || '';
  const key = `${folder}/${filename}`;
  landmarkMap[key] = mod.default;
}

export interface LandmarkPhoto {
  path: string;
  caption: string;
}

function photosFor(folder: string, filesAndCaptions: [string, string][]): LandmarkPhoto[] {
  return filesAndCaptions.map(([filename, caption]) => {
    const path = landmarkMap[`${folder}/${filename}`];
    if (!path) return null;
    return { path, caption };
  }).filter((p): p is LandmarkPhoto => p !== null);
}

/** 地标打卡照片 — 按中文地标名分组，caption 全部咕咕视角 */
export const landmarkPhotos: Record<string, LandmarkPhoto[]> = {
  '思源湖': photosFor('思源湖', [
    ['思源湖小树林鸽子打卡图.jpg', '树林里很安静。阳光从叶子缝里漏下来，一块一块的。'],
    ['思源湖湖心打卡图.jpg', '湖心的水比岸边更绿。站在这里能看到整个湖。'],
    ['思源湖维纳斯雕塑打卡图.jpg', '这座雕塑站了很久了。我每次来它都在。不知道它会不会累。'],
    ['思源湖雕塑鸽子打卡图.jpg', '雕塑上有我的同类。虽然是石头的，但我觉得它在看我。'],
  ]),
  '图书馆': photosFor('图书馆主馆', [
    ['229006e42db39ef091393565b8a04ca0.jpg', '书架之间很安静。只有翻页的声音。我喜欢这种声音。'],
    ['31feb873da2cbee519fdd85462f2b062.jpg', '这里的光线很柔和。适合想事情。'],
    ['8de3729435360743a60e989ac700ee83.jpg', '窗边的位置总是最受欢迎。阳光好，风景也好。'],
  ]),
  '庙门': photosFor('庙门', [
    ['122c3083bdee8eb1939ebecf0d9c78aa.jpg', '庙门比我想象的要高很多。站在下面有点渺小。'],
    ['可爱鸽子站在石狮子庙门上.png', '我站在石狮子的头上。视野很好。它应该不会介意。'],
    ['鸽子站在屋檐上(1).png', '屋檐是个好地方。能看见来来往往的人，也没人打扰。'],
  ]),
  '致远湖': photosFor('致远湖', [
    ['0284ad37fbdf3cdcf8ecf16f277951de.jpg', '清晨的湖面还没有完全醒来。雾很薄，像一层纱。'],
    ['23ef85f6f399f0deb30e6a0ecc1f2aa0.jpg', '这张长椅坐过很多人。我停在椅背上，感受了一下余温。'],
  ]),
  '植物园': photosFor('植物园', [
    ['可爱鸽子站在栏杆柱子上.png', '栏杆上能看到整个植物园。花在开，蜜蜂在忙。我在看。'],
  ]),
  '电院': photosFor('电院', [
    ['a6f4c5793ab1e5b791c421580eb991b2.jpg', '这栋楼有很多窗户。每个窗户后面都有一个人在写代码吧。'],
  ]),
  '电院大草坪': photosFor('电院大草坪', [
    ['1e63b3cbe3007b9db505f1a1af670b9f.jpg', '草坪踩上去软软的。躺下来能看到大片的天空。'],
  ]),
  '东下院': photosFor('东下院', [
    ['1c74108fa983a8a26f0c529125aac8ba.jpg', '东下院的走廊很长。走在上面能听到自己的脚步声。'],
  ]),
  '东中院': photosFor('东中院', [
    ['2c299b1c855c40ac79b09e399b799cad.jpg', '东中院的走廊有一种旧旧的味道。很好闻。'],
    ['咕咕依偎着橘猫(1).png', '又遇到橘猫了。它今天在东中院。看来它也有固定的动线。'],
  ]),
  '第一餐饮大楼': photosFor('第一餐饮大楼', [
    ['可爱鸽子站在玉兰花树上(1).png', '玉兰花开了。我站在枝头，花瓣就在旁边。很香。'],
  ]),
  '胡法光体育场': photosFor('胡法光体育场', [
    ['胡法光体育馆拔河打卡图.jpg', '有人在拔河。两边都很用力。我不知道应该给哪边加油。'],
  ]),
  '人文学院': photosFor('人文学院', [
    ['56cd0f1b760269c335d3453a5272f61b.jpg', '人文学院的走廊里有回声。我咕了一声，它响了很久。'],
    ['a30adaf00b15bf08f5c7646d82c51495.jpg', '门口很安静。可能大家都在里面看书。'],
  ]),
  '南区体育场': photosFor('南区体育场', [
    ['41fe422c50b4d0bb386e4dd74c154456.jpg', '跑道一圈一圈的。我飞了一圈，不用跑。'],
    ['4cd5b0796bbdd4f1c62206aceb6d656f.jpg', '从看台上望下去，操场像一个巨大的舞台。'],
  ]),
  '南大门': photosFor('南大门', [
    ['8097e1cfcdda4f9ae4ad6324c90696e9.jpg', '南大门总是很热闹。有人进来，有人出去。我停在门柱上看了一会儿。'],
  ]),
  '思源门': photosFor('思源门', [
    ['5429715f79700fe6ec20a816dca6a4d4.jpg', '思源门有种老老的质感。我喜欢停在这里看人来人往。'],
  ]),
  '设计学院': photosFor('设计学院', [
    ['c413bb285ef3c4837b11e02dfe0f0981.jpg', '设计学院有很多奇奇怪怪的东西。我看了半天也没看懂。但是很好看。'],
  ]),
  '图信大楼': photosFor('图信大楼', [
    ['403f4ab77d233ead3fb4fac09cf19e92.png', '图信大楼很高。从上面能看到很远的地方。'],
  ]),
  '彩蛋地点': photosFor('彩蛋地点', [
    ['ae1d20b20ea5d16c48c8783ed9eca1d1.jpg', '这里藏着一个秘密。不是什么大秘密。但能找到的人应该会笑。'],
  ]),
};

/** 根据地标名获取打卡照片 */
export function getLandmarkPhotos(landmarkName: string): LandmarkPhoto[] {
  return landmarkPhotos[landmarkName] || [];
}
