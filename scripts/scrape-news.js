// 校园热点抓取脚本 — 本地运行版
// 用法: node scripts/scrape-news.js
// 从 news.sjtu.edu.cn 抓取最新新闻 → 写入 Supabase

const SUPABASE_URL = 'https://ksbjrgjpjottykkogxvo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzYmpyZ2pwam90dHlra29neHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMzYxMTEsImV4cCI6MjA5NTgxMjExMX0.sU6Fe-HAIp86hUkmaNX5Of7grrTTnXM7fHo9y6wpH50';

async function main() {
  console.log('📡 正在抓取 news.sjtu.edu.cn ...');

  // 1. 抓取首页 HTML
  const resp = await fetch('https://news.sjtu.edu.cn', {
    headers: { 'User-Agent': 'Mozilla/5.0 CampusPigeon/1.0' }
  });
  if (!resp.ok) {
    console.error('❌ 抓取失败 HTTP', resp.status);
    process.exit(1);
  }
  const html = await resp.text();
  console.log('   HTML 长度:', html.length, '字节');

  // 2. 解析所有新闻链接
  const items = [];
  const linkRegex = /<a\s+class="item"\s+href="(\/[^"]+\/\d+\/\d+\.html)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const block = match[2];

    const timeMatch = block.match(/<div\s+class="time">([^<]+)<\/div>/);
    const dotMatch = block.match(/<div\s+class="dot">([^<]+)<\/div>/);
    if (!timeMatch || !dotMatch) continue;

    const dateRaw = timeMatch[1]; // "2026年06月01日"
    const dateM = dateRaw.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (!dateM) continue;
    const date = `${dateM[1]}-${dateM[2].padStart(2, '0')}-${dateM[3].padStart(2, '0')}`;

    // 只保留 7 天内的
    const itemDate = new Date(date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    if (itemDate < weekAgo) continue;

    const title = dotMatch[1].trim();
    const desMatch = block.match(/<p\s+class="dot">([^<]+)<\/p>/);
    const summary = desMatch ? desMatch[1].trim().slice(0, 150) : title;
    const imgMatch = block.match(/<img\s+src="([^"]+)"/);
    let imageUrl = imgMatch ? imgMatch[1] : null;
    if (imageUrl && !imageUrl.startsWith('http')) imageUrl = 'https://news.sjtu.edu.cn' + imageUrl;

    const id = href.replace(/^\//, '').replace(/\.html$/, '').replace(/\//g, '-');
    const url = 'https://news.sjtu.edu.cn' + href;

    // 确定分类
    let category = '综合新闻';
    let categoryEmoji = '📰';
    if (href.includes('/jdyw/')) { category = '交大要闻'; categoryEmoji = '📢'; }
    else if (href.includes('/zhxw/')) { category = '综合新闻'; categoryEmoji = '📰'; }
    else if (href.includes('/tsfx/')) { category = '特别分析'; categoryEmoji = '📊'; }
    else if (href.includes('/hlxy/')) { category = '合作交流'; categoryEmoji = '🤝'; }
    else if (href.includes('/ztzl/')) { category = '专题专栏'; categoryEmoji = '📌'; }

    // 情绪影响
    const moodEffect = {};
    const text = title + summary;
    if (/考试|成绩|答辩|论文|科研|学术|实验室|成果/.test(text)) { moodEffect.academic = 5; moodEffect.stress = 2; }
    if (/活动|比赛|演出|展览|论坛|讲座|峰会|大会|开放日/.test(text)) { moodEffect.social = 5; moodEffect.energy = 3; }
    if (/毕业|就业|招聘|离校|校友|返校/.test(text)) { moodEffect.warmth = 3; moodEffect.stress = 3; }
    if (/体育|运动会|球|跑步|健身|马拉松/.test(text)) { moodEffect.energy = 5; }
    if (/国际|外国|留学生|访问|交流|合作/.test(text)) { moodEffect.social = 3; }
    if (/科技|创新|突破|发布|AI|人工智能|芯片/.test(text)) { moodEffect.academic = 3; moodEffect.energy = 2; }

    items.push({
      id, title, date, summary, url,
      image_url: imageUrl,
      category, category_emoji: categoryEmoji,
      mood_effect: moodEffect,
      scraped_at: Date.now(),
      is_active: true,
    });
  }

  // 去重
  const seen = new Set();
  const unique = items.filter(i => seen.has(i.id) ? false : (seen.add(i.id), true));
  console.log(`   解析到 ${items.length} 条，去重后 ${unique.length} 条（7天内）`);

  if (unique.length === 0) {
    console.log('✅ 没有新内容需要同步');
    return;
  }

  // 3. 写入 Supabase
  console.log('📤 正在写入 Supabase ...');
  for (const item of unique) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/campus_hotspots?id=eq.${encodeURIComponent(item.id)}`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
    });
    const existing = await res.json();

    const method = existing.length > 0 ? 'PATCH' : 'POST';
    const endpoint = existing.length > 0
      ? `${SUPABASE_URL}/rest/v1/campus_hotspots?id=eq.${encodeURIComponent(item.id)}`
      : `${SUPABASE_URL}/rest/v1/campus_hotspots`;

    await fetch(endpoint, {
      method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(method === 'POST' ? item : {
        date: item.date, summary: item.summary, url: item.url,
        image_url: item.image_url, category: item.category,
        category_emoji: item.category_emoji, mood_effect: item.mood_effect,
        scraped_at: item.scraped_at, is_active: item.is_active,
      }),
    });

    console.log(`   ${existing.length > 0 ? '更新' : '新增'}: ${item.title.slice(0, 40)}...`);
  }

  console.log(`✅ 完成！${unique.length} 条热点已写入`);
}

main().catch(err => {
  console.error('❌ 错误:', err.message);
  process.exit(1);
});
