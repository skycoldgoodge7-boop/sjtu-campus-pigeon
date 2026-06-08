// ====== 校友记忆碎片 ======
// 校园各处随机浮现的回顾性记忆，由鸽子"看见"
// 不是漂流瓶 — 这是过去的人留下的痕迹
// ~100 条，分布在 14 个地标

export interface MemoryShard {
  id: string;
  landmarkId: string;
  year: string;
  text: string;
  emoji: string;
}

const SHARDS: MemoryShard[] = [
  // ═══════════ 思源湖 (10条) ═══════════
  { id: 'sl-01', landmarkId: 'siyuan-lake', year: '2018届', emoji: '🌅', text: '以前总在思源湖边背六级单词。现在一想，那时候的夕阳真好看。' },
  { id: 'sl-02', landmarkId: 'siyuan-lake', year: '2020届', emoji: '🎸', text: '毕业前最后一个晚上，和室友在湖边坐到凌晨三点。谁都没说话。' },
  { id: 'sl-03', landmarkId: 'siyuan-lake', year: '2019届', emoji: '💕', text: '大一的时候在湖边迷路了。后来发现，是故意走错的。' },
  { id: 'sl-04', landmarkId: 'siyuan-lake', year: '2022届', emoji: '📷', text: '每年春天湖边的花开了，我都会拍一张。现在手机里有四张了。' },
  { id: 'sl-05', landmarkId: 'siyuan-lake', year: '2017届', emoji: '🐟', text: '湖里的鱼认识我。每次去它们都会游过来。可能因为我总带面包。' },
  { id: 'sl-06', landmarkId: 'siyuan-lake', year: '2021届', emoji: '📖', text: '大一在湖边读完的第一本小说是《挪威的森林》。后来重读了好几次，每次感觉都不一样。' },
  { id: 'sl-07', landmarkId: 'siyuan-lake', year: '2016届', emoji: '🦆', text: '湖边的鸭子换了好几批了。但总有一只白色的，很凶，连鸽子都躲着它。' },
  { id: 'sl-08', landmarkId: 'siyuan-lake', year: '2023届', emoji: '🎵', text: '下雨天在湖边听雨声和风铃声混在一起，那是交大最好听的声音。' },
  { id: 'sl-09', landmarkId: 'siyuan-lake', year: '2019届', emoji: '🍂', text: '秋天湖面上漂满了落叶，像一幅画。有一片停在我的脚边。' },
  { id: 'sl-10', landmarkId: 'siyuan-lake', year: '2018届', emoji: '✨', text: '湖边的长椅上，曾经有人给我读过一首诗。后来再也没遇到过那个人。' },

  // ═══════════ 图书馆 (10条) ═══════════
  { id: 'lib-01', landmarkId: 'new-library', year: '2017届', emoji: '📚', text: '在图书馆三楼靠窗的位置复习了一整个考研季。那个座位，不知道现在是谁的。' },
  { id: 'lib-02', landmarkId: 'new-library', year: '2021届', emoji: '☕', text: '通宵复习的时候，最喜欢凌晨四点的图书馆。特别安静。' },
  { id: 'lib-03', landmarkId: 'new-library', year: '2019届', emoji: '📝', text: '有一次在书里夹了一张纸条。不知道后来的人有没有看到。' },
  { id: 'lib-04', landmarkId: 'new-library', year: '2020届', emoji: '❄️', text: '考试周图书馆门口排队，从五楼一直排到一楼。我前面的人在看《信号与系统》。' },
  { id: 'lib-05', landmarkId: 'new-library', year: '2018届', emoji: '🎧', text: '图书馆的空调总是开得很足。夏天带外套，冬天穿短袖——每个交大人都懂。' },
  { id: 'lib-06', landmarkId: 'new-library', year: '2016届', emoji: '💡', text: '图书馆走廊的灯是感应式的。半夜去上厕所要一路挥手，像在指挥交响乐。' },
  { id: 'lib-07', landmarkId: 'new-library', year: '2022届', emoji: '🧳', text: '毕业前把借的书全还了。图书管理员说"一路顺风"。那是图书馆对我说的最后一句话。' },
  { id: 'lib-08', landmarkId: 'new-library', year: '2019届', emoji: '🌧️', text: '下雨天图书馆的窗户会起雾。有人在上面画了一颗心。第二天还在。' },
  { id: 'lib-09', landmarkId: 'new-library', year: '2021届', emoji: '🍞', text: '偷偷在图书馆吃过面包。包装纸的声音太响了，对面的人抬头看了我一眼。我们都笑了。' },
  { id: 'lib-10', landmarkId: 'new-library', year: '2017届', emoji: '🌟', text: '图书馆最安静的地方不是阅览室，是四楼的楼梯间。那里可以看星星。' },

  // ═══════════ 庙门 (8条) ═══════════
  { id: 'tm-01', landmarkId: 'temple-gate', year: '2016届', emoji: '🏛️', text: '第一次来交大，就是从庙门进来的。站在门口看了好久。' },
  { id: 'tm-02', landmarkId: 'temple-gate', year: '2020届', emoji: '🎓', text: '毕业照就是在庙门拍的。那天太阳特别大，所有人都眯着眼。' },
  { id: 'tm-03', landmarkId: 'temple-gate', year: '2018届', emoji: '🌸', text: '庙门口的石狮子，好像一直在看我。' },
  { id: 'tm-04', landmarkId: 'temple-gate', year: '2021届', emoji: '☔', text: '新生报到那天在下雨。庙门的屋檐下站满了躲雨的人。我就这样认识了大学第一个朋友。' },
  { id: 'tm-05', landmarkId: 'temple-gate', year: '2017届', emoji: '🕊️', text: '庙门的鸽子比学生还多。有一只特别喜欢站在石狮子头顶。' },
  { id: 'tm-06', landmarkId: 'temple-gate', year: '2019届', emoji: '📸', text: '每年开学季庙门前都有人拍照。家长、新生、行李箱。热闹得像过节。' },
  { id: 'tm-07', landmarkId: 'temple-gate', year: '2022届', emoji: '🏮', text: '庙门灯笼亮起来的时候，整个校园就安静下来了。像在说"该回家了"。' },
  { id: 'tm-08', landmarkId: 'temple-gate', year: '2018届', emoji: '💭', text: '离开的前一天晚上，在庙门前坐了很久。石狮子还是那个样子。我也希望我还是。' },

  // ═══════════ 植物园 (7条) ═══════════
  { id: 'bg-01', landmarkId: 'botanical-garden', year: '2019届', emoji: '🌿', text: '压力大的时候就来植物园走走。什么都不想，只是走路。' },
  { id: 'bg-02', landmarkId: 'botanical-garden', year: '2021届', emoji: '🐱', text: '植物园里有一只猫，白色的。不知道它现在还在不在。' },
  { id: 'bg-03', landmarkId: 'botanical-garden', year: '2020届', emoji: '🦋', text: '植物园的蝴蝶特别多。有一次一只蓝色的停在我袖子上，很久才飞走。' },
  { id: 'bg-04', landmarkId: 'botanical-garden', year: '2017届', emoji: '🌺', text: '植物园的温室里有一株植物比我高。大一的时候它还没我高呢。' },
  { id: 'bg-05', landmarkId: 'botanical-garden', year: '2018届', emoji: '🍃', text: '下午四点的植物园，阳光从叶子间漏下来。什么都不做就是最好的事。' },
  { id: 'bg-06', landmarkId: 'botanical-garden', year: '2022届', emoji: '💐', text: '在植物园里认识了很多花的名字。但后来都忘了。只记得它们好看。' },
  { id: 'bg-07', landmarkId: 'botanical-garden', year: '2016届', emoji: '🐝', text: '蜜蜂比我先发现了那些花。它们每天都来，是植物园最忠实的访客。' },

  // ═══════════ 电院草坪 (7条) ═══════════
  { id: 'el-01', landmarkId: 'seiee-lawn', year: '2020届', emoji: '🪁', text: '春天的时候草坪上有人放风筝。我在旁边写完了毕设的最后一章。' },
  { id: 'el-02', landmarkId: 'seiee-lawn', year: '2018届', emoji: '😴', text: '有一次在草坪上睡着了。醒来的时候，天已经黑了。' },
  { id: 'el-03', landmarkId: 'seiee-lawn', year: '2019届', emoji: '🎸', text: '电院草坪的露天演出，吉他声能传很远。我在实验室三楼都能听到。' },
  { id: 'el-04', landmarkId: 'seiee-lawn', year: '2021届', emoji: '🌞', text: '草坪是最公平的地方。不管你是学霸还是学渣，躺下来都一样暖。' },
  { id: 'el-05', landmarkId: 'seiee-lawn', year: '2022届', emoji: '📱', text: '在草坪上用手机拍了一整个延时摄影。云从东边飘到西边，用了两个小时。' },
  { id: 'el-06', landmarkId: 'seiee-lawn', year: '2017届', emoji: '🐕', text: '有人在草坪上遛狗。一只柯基，跑起来耳朵飞起来。所有人都停下来看。' },
  { id: 'el-07', landmarkId: 'seiee-lawn', year: '2018届', emoji: '🍙', text: '和室友在草坪上野餐过一次。带了三明治和薯片。蚂蚁比我们先到。' },

  // ═══════════ 致远湖 (8条) ═══════════
  { id: 'zl-01', landmarkId: 'zhiyuan-lake', year: '2017届', emoji: '🌙', text: '晚上绕着致远湖跑步的时候，总觉得有人在湖心看着。' },
  { id: 'zl-02', landmarkId: 'zhiyuan-lake', year: '2022届', emoji: '📖', text: '致远湖边读过的每一本书，都还记得。' },
  { id: 'zl-03', landmarkId: 'zhiyuan-lake', year: '2019届', emoji: '🏃', text: '早上的致远湖特别安静。只有几个晨跑的人和一群鸟。我是其中一个。' },
  { id: 'zl-04', landmarkId: 'zhiyuan-lake', year: '2020届', emoji: '🦢', text: '湖边有一对天鹅。每年都来。连它们都比我更熟悉这个湖了。' },
  { id: 'zl-05', landmarkId: 'zhiyuan-lake', year: '2018届', emoji: '🎆', text: '有一年元旦在湖边看到了烟花。不是很多，但映在水面上特别好看。' },
  { id: 'zl-06', landmarkId: 'zhiyuan-lake', year: '2021届', emoji: '🌧️', text: '下雨的时候湖面会起雾。像一幅水墨画。在致远湖边看过的雨景，是交大最美的。' },
  { id: 'zl-07', landmarkId: 'zhiyuan-lake', year: '2016届', emoji: '💬', text: '在湖边和一个陌生人聊了三个小时。后来加了微信，现在还是好朋友。' },
  { id: 'zl-08', landmarkId: 'zhiyuan-lake', year: '2023届', emoji: '🧘', text: '考试前在湖边坐十分钟。什么都不想。深呼吸。然后回去继续刷题。' },

  // ═══════════ 食堂 (7条) ═══════════
  { id: 'dh-01', landmarkId: 'dining-hall-1', year: '2018届', emoji: '🍜', text: '一餐的牛肉面。毕业以后吃过很多碗，都不太一样。' },
  { id: 'dh-02', landmarkId: 'dining-hall-1', year: '2021届', emoji: '🫕', text: '食堂阿姨记得我不吃香菜。每次都会帮我挑出来。' },
  { id: 'dh-03', landmarkId: 'dining-hall-1', year: '2019届', emoji: '🥢', text: '一餐的麻辣香锅窗口永远排最长队。排了四年，还没腻。' },
  { id: 'dh-04', landmarkId: 'dining-hall-1', year: '2020届', emoji: '💳', text: '大一的时候总忘记带饭卡。阿姨说"下次再忘就不给你打饭了"。每次都给了。' },
  { id: 'dh-05', landmarkId: 'dining-hall-1', year: '2017届', emoji: '🍳', text: '食堂早餐的煎蛋，蛋黄是溏心的。每天早上去抢，晚了就没有了。' },
  { id: 'dh-06', landmarkId: 'dining-hall-1', year: '2022届', emoji: '🫖', text: '冬天食堂的免费热汤，是最温暖的记忆。端着一碗汤，整个下午都是暖的。' },
  { id: 'dh-07', landmarkId: 'dining-hall-1', year: '2016届', emoji: '🍽️', text: '最后一天在食堂吃饭，把每个窗口都走了一遍。阿姨问我"毕业了？"我说嗯。她说"常回来看看"。' },

  // ═══════════ 南区体育场 (7条) ═══════════
  { id: 'st-01', landmarkId: 'south-stadium', year: '2019届', emoji: '⚽', text: '体测八百米的时候，觉得自己可能跑不完。但还是跑完了。' },
  { id: 'st-02', landmarkId: 'south-stadium', year: '2020届', emoji: '🏃', text: '晚上在跑道上看到星星。不是很多，但是够亮。' },
  { id: 'st-03', landmarkId: 'south-stadium', year: '2018届', emoji: '🎵', text: '夜跑的时候循环了一首歌。现在每次听到那首歌，都想起操场的塑胶味。' },
  { id: 'st-04', landmarkId: 'south-stadium', year: '2021届', emoji: '🏅', text: '校运会的时候在看台上喊加油喊哑了嗓子。我们院拿了第三。' },
  { id: 'st-05', landmarkId: 'south-stadium', year: '2017届', emoji: '🌅', text: '操场上看到的日出比任何地方的都好看。可能是因为刚跑完5公里。' },
  { id: 'st-06', landmarkId: 'south-stadium', year: '2022届', emoji: '🌧️', text: '下雨天的体育场一个人都没有。跑道上的水洼映着天空，像一面面小镜子。' },
  { id: 'st-07', landmarkId: 'south-stadium', year: '2019届', emoji: '💪', text: '大一体测引体向上只能做3个。大四能做12个了。进步不止在实验室。' },

  // ═══════════ 东中院 (7条) ═══════════
  { id: 'em-01', landmarkId: 'east-middle', year: '2017届', emoji: '✏️', text: '东中院的黑板上偶尔会出现一行小诗。不知道是谁写的。' },
  { id: 'em-02', landmarkId: 'east-middle', year: '2022届', emoji: '🪟', text: '考试周的时候，东中院的每个教室都亮着灯。' },
  { id: 'em-03', landmarkId: 'east-middle', year: '2019届', emoji: '🪑', text: '东中院的椅子吱吱响。上课的时候如果有人动，整个教室都会听到。' },
  { id: 'em-04', landmarkId: 'east-middle', year: '2020届', emoji: '🌡️', text: '东中院夏天的空调像冰箱。冬天暖气得穿短袖。温度管理是一门玄学。' },
  { id: 'em-05', landmarkId: 'east-middle', year: '2018届', emoji: '📱', text: '在某个教室里丢过一个充电宝。后来在失物招领处找到了。谢谢那个交还的人。' },
  { id: 'em-06', landmarkId: 'east-middle', year: '2021届', emoji: '🌸', text: '窗外的樱花开了。那一整节高数课，我都在看窗外。' },
  { id: 'em-07', landmarkId: 'east-middle', year: '2016届', emoji: '🕰️', text: '东中院的钟走得比正常时间慢五分钟。大家都知道。大家都按钟来。' },

  // ═══════════ 南大门 (7条) ═══════════
  { id: 'nd-01', landmarkId: 'nan-da-men', year: '2016届', emoji: '🚪', text: '离开的那天，从南大门回头看了一眼。然后就走了。' },
  { id: 'nd-02', landmarkId: 'nan-da-men', year: '2021届', emoji: '✨', text: '第一次来报名的时候，南大门比想象中大多了。' },
  { id: 'nd-03', landmarkId: 'nan-da-men', year: '2019届', emoji: '🚗', text: '南大门外的堵车是交大的保留节目。周五下午尤甚。' },
  { id: 'nd-04', landmarkId: 'nan-da-men', year: '2018届', emoji: '📦', text: '双十一的南大门堆满了快递。像一个巨大的寻宝现场。' },
  { id: 'nd-05', landmarkId: 'nan-da-men', year: '2020届', emoji: '🌧️', text: '迎新那天从南大门进来的。下雨了。志愿者帮我提了箱子。后来我也成了志愿者。' },
  { id: 'nd-06', landmarkId: 'nan-da-men', year: '2017届', emoji: '🚌', text: '在南大门等校车是每天的必修课。等了四年，学会了在公交站看书。' },
  { id: 'nd-07', landmarkId: 'nan-da-men', year: '2022届', emoji: '🎓', text: '穿着学士服从南大门走出去的那一刻，突然鼻子有点酸。这条路走了四年，最后一次了。' },

  // ═══════════ 胡法光体育场 (6条) ═══════════
  { id: 'hf-01', landmarkId: 'hufaguang-stadium', year: '2022届', emoji: '🏀', text: '体育场的灯总是最后一个关。' },
  { id: 'hf-02', landmarkId: 'hufaguang-stadium', year: '2018届', emoji: '🏐', text: '排球场周末总有人。路过的时候偶尔会帮他们捡球。' },
  { id: 'hf-03', landmarkId: 'hufaguang-stadium', year: '2019届', emoji: '🎯', text: '军训的时候在体育馆前面站军姿。教官说"再动一下多站五分钟"。没敢动。' },
  { id: 'hf-04', landmarkId: 'hufaguang-stadium', year: '2020届', emoji: '🎵', text: '体育馆里办过十佳歌手。有人在台上唱《那些年》。全场都跟着唱。' },
  { id: 'hf-05', landmarkId: 'hufaguang-stadium', year: '2017届', emoji: '🏆', text: '新生杯篮球赛。我们系赢了第一场，也是唯一一场。但那天晚上大家都高兴得像冠军。' },
  { id: 'hf-06', landmarkId: 'hufaguang-stadium', year: '2021届', emoji: '🌙', text: '体育场跑完步躺着看天。有人也在旁边躺着。我们谁都没说话。' },

  // ═══════════ 人文学院 (6条) ═══════════
  { id: 'hs-01', landmarkId: 'humanities-school', year: '2018届', emoji: '🌸', text: '人文学院门口的樱花，每年都开。每年都有人站在树下。' },
  { id: 'hs-02', landmarkId: 'humanities-school', year: '2020届', emoji: '🎭', text: '人文学院的小剧场演过一出话剧。演的是我们自己的故事。' },
  { id: 'hs-03', landmarkId: 'humanities-school', year: '2019届', emoji: '📜', text: '学院走廊里挂着老照片。有一张是1978年的。那时候的校园，树还没这么高。' },
  { id: 'hs-04', landmarkId: 'humanities-school', year: '2021届', emoji: '☕', text: '人文学院的咖啡机是全交大最好用的。不是我说的，是公认的。' },
  { id: 'hs-05', landmarkId: 'humanities-school', year: '2017届', emoji: '🕊️', text: '有一只鸽子总停在人文学院的窗台上。不知道是不是同一只。还是它的后代。' },
  { id: 'hs-06', landmarkId: 'humanities-school', year: '2022届', emoji: '📝', text: '在人文学院的走廊里看过一场书法展。有一幅写的是"学无止境"。' },

  // ═══════════ 设计学院 (5条) ═══════════
  { id: 'ds-01', landmarkId: 'design-school', year: '2020届', emoji: '🎨', text: '设计学院的天台，能看到整个闵行校区。那是我最喜欢的地方。' },
  { id: 'ds-02', landmarkId: 'design-school', year: '2019届', emoji: '🖼️', text: '设计学院的毕业展每年都很好看。有人做了一只会飞的鸽子装置。' },
  { id: 'ds-03', landmarkId: 'design-school', year: '2018届', emoji: '📐', text: '在设计学院通宵过很多次。通宵的时候窗外有鸟叫。天亮的时候特别好听。' },
  { id: 'ds-04', landmarkId: 'design-school', year: '2021届', emoji: '🌇', text: '从设计学院六楼看到的落日，角度刚刚好。阳光会穿过整条走廊。' },
  { id: 'ds-05', landmarkId: 'design-school', year: '2017届', emoji: '🪑', text: '一楼的公共空间有一把特别舒服的沙发。抢到它需要运气。' },

  // ═══════════ 东下院 (5条) ═══════════
  { id: 'el2-01', landmarkId: 'east-lower', year: '2021届', emoji: '📊', text: '东下院的通宵自习室，见证过太多不眠的夜晚。' },
  { id: 'el2-02', landmarkId: 'east-lower', year: '2018届', emoji: '☕', text: '自习室的咖啡机半夜总是空的。后来大家都学会了带保温杯。' },
  { id: 'el2-03', landmarkId: 'east-lower', year: '2020届', emoji: '📝', text: '在自习室的黑板上，有人写过"坚持到最后的人都会有好结果"。"' },
  { id: 'el2-04', landmarkId: 'east-lower', year: '2019届', emoji: '🕛', text: '凌晨两点来自习室，发现还有十几个人。大家互相看了一眼，继续低头学习。' },
  { id: 'el2-05', landmarkId: 'east-lower', year: '2017届', emoji: '🍜', text: '自习室的泡面味是通宵的BGM。咸的、辣的、海鲜的，各有各的流派。' },

  // ═══════════ 思源门 (4条) ═══════════
  { id: 'sm-01', landmarkId: 'siyuan-men', year: '2019届', emoji: '🌆', text: '每天从思源门出去吃夜宵的路，现在闭着眼也能走。' },
  { id: 'sm-02', landmarkId: 'siyuan-men', year: '2020届', emoji: '🛵', text: '思源门外的外卖骑手是交大夜生活的守护者。' },
  { id: 'sm-03', landmarkId: 'siyuan-men', year: '2018届', emoji: '🌧️', text: '思源门的路一下雨就积水。每次都要跳过去。四年后终于不用跳了，反而有点怀念。' },
  { id: 'sm-04', landmarkId: 'siyuan-men', year: '2022届', emoji: '🚶', text: '出思源门的时候总感觉像要离开一个结界。外面的世界和里面不太一样。' },
];

export default SHARDS;

/** 根据地标获取该位置可能浮现的记忆 */
export function getShardsForLandmark(landmarkId: string): MemoryShard[] {
  return SHARDS.filter((s) => s.landmarkId === landmarkId);
}

/** 随机获取一条记忆碎片 */
export function getRandomShard(excludeIds?: string[]): MemoryShard | null {
  const pool = excludeIds
    ? SHARDS.filter((s) => !excludeIds.includes(s.id))
    : SHARDS;
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
