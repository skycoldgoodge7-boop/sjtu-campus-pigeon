// ====== Supabase Edge Function: scrape-news ======
// 定时抓取 news.sjtu.edu.cn 校园热点
// 部署: supabase functions deploy scrape-news
// 定时触发: 在 Supabase Dashboard → Cron Jobs 中配置
//   SELECT cron.schedule('scrape-news', '*/30 * * * *', 'SELECT net.http_post(url:=''https://<project>.supabase.co/functions/v1/scrape-news'')');

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const NEWS_URL = "https://news.sjtu.edu.cn";
const BASE_URL = "https://news.sjtu.edu.cn";

// 栏目路由 → 名称 + emoji 映射
const CATEGORY_MAP: Record<string, { name: string; emoji: string }> = {
  jdyw:  { name: "交大要闻", emoji: "📢" },
  zhxw:  { name: "综合新闻", emoji: "📰" },
  tsfx:  { name: "特别分析", emoji: "📊" },
  hlxy:  { name: "合作交流", emoji: "🤝" },
  ztzl:  { name: "专题专栏", emoji: "📌" },
};

// 关键词 → 情绪影响
function computeMoodEffect(title: string, summary: string): Record<string, number> {
  const text = title + summary;
  const effect: Record<string, number> = {};

  // 学术相关
  if (/考试|成绩|答辩|论文|科研|学术|实验室|课题|成果|论文/.test(text)) {
    effect.academic = (effect.academic || 0) + 5;
    effect.stress = (effect.stress || 0) + 2;
  }
  // 活动相关
  if (/活动|比赛|演出|展览|论坛|讲座|峰会|年会|大会/.test(text)) {
    effect.social = (effect.social || 0) + 5;
    effect.energy = (effect.energy || 0) + 3;
  }
  // 毕业/就业
  if (/毕业|就业|招聘|离校|校友|返校/.test(text)) {
    effect.warmth = (effect.warmth || 0) + 3;
    effect.stress = (effect.stress || 0) + 3;
  }
  // 体育
  if (/体育|运动会|比赛|球|游泳|跑步|健身|马拉松/.test(text)) {
    effect.energy = (effect.energy || 0) + 5;
  }
  // 校园建设
  if (/建设|改造|修缮|新楼|开工|落成|竣工/.test(text)) {
    effect.warmth = (effect.warmth || 0) + 3;
  }
  // 国际交流
  if (/国际|外国|留学生|访问|交流|合作/.test(text)) {
    effect.social = (effect.social || 0) + 3;
  }
  // 科技/创新
  if (/科技|创新|突破|发布|AI|人工智能|量子|芯片/.test(text)) {
    effect.academic = (effect.academic || 0) + 3;
    effect.energy = (effect.energy || 0) + 2;
  }
  // 天气/季节
  if (/降温|升温|暴雨|台风|高温|寒潮|下雪|樱花|花开/.test(text)) {
    effect.slack = (effect.slack || 0) + 3;
  }

  // 确保每个值在 -5 ~ 5 之间
  for (const k of Object.keys(effect)) {
    effect[k] = Math.max(-5, Math.min(5, effect[k]));
  }
  return effect;
}

// 从 HTML 中提取某个栏目的新闻列表
function extractNewsList(html: string, columnPath: string): NewsItem[] {
  const items: NewsItem[] = [];

  // 找到栏目对应的区域，匹配 <a class="item" href="/column/...">
  const linkRegex = new RegExp(
    `<a\\s+class="item"\\s+href="(${escapeRegExp(columnPath)}/\\d+/\\d+\\.html)"[^>]*>([\\s\\S]*?)</a>`,
    "gi"
  );

  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const block = match[2];

    // 提取时间
    const timeMatch = block.match(/<div\s+class="time">([^<]+)<\/div>/);
    const date = timeMatch ? parseChineseDate(timeMatch[1]) : "";

    // 提取标题
    const dotMatch = block.match(/<div\s+class="dot">([^<]+)<\/div>/);
    const title = dotMatch ? dotMatch[1].trim() : "";

    // 提取摘要
    const desMatch = block.match(/<p\s+class="dot">([^<]+)<\/p>/);
    const summary = desMatch ? desMatch[1].trim().slice(0, 150) : "";

    // 提取封面图
    const imgMatch = block.match(/<img\s+src="([^"]+)"/);
    const imageUrl = imgMatch ? imgMatch[1] : undefined;

    if (title && date && href) {
      items.push({
        id: href.replace(/^\//, "").replace(/\.html$/, "").replace(/\//g, "-"),
        title,
        date,
        summary: summary || title,
        url: BASE_URL + href,
        imageUrl: imageUrl ? (imageUrl.startsWith("http") ? imageUrl : BASE_URL + imageUrl) : undefined,
      });
    }
  }

  return items;
}

// 解析中文日期 "2026年06月01日" → "2026-06-01"
function parseChineseDate(str: string): string {
  const m = str.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (!m) return "";
  return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface NewsItem {
  id: string;
  title: string;
  date: string;
  summary: string;
  url: string;
  imageUrl?: string;
}

// ====== 主处理函数 ======
Deno.serve(async (req: Request) => {
  try {
    // 验证请求（可选：检查 cron secret）
    const authHeader = req.headers.get("Authorization");
    // 允许无 auth 调用（公开匿名），也可配置 service_role key 保护

    // 1. 抓取页面
    console.log("Fetching", NEWS_URL);
    const resp = await fetch(NEWS_URL, {
      headers: { "User-Agent": "SJTU-CampusPigeon/1.0 (campus news scraper)" },
    });
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: `HTTP ${resp.status}` }), { status: 500 });
    }
    const html = await resp.text();

    // 2. 解析所有栏目
    const allItems: NewsItem[] = [];
    const columns = ["jdyw", "zhxw", "tsfx", "hlxy", "ztzl"];

    for (const col of columns) {
      const items = extractNewsList(html, col);
      console.log(`  ${col}: ${items.length} items`);
      allItems.push(...items);
    }

    // 如果正则解析失败，尝试更宽松的全局匹配
    if (allItems.length === 0) {
      // Fallback: 全局匹配所有新闻链接
      const fallbackRegex = /<a\s+class="item"\s+href="(\/[^"]+\/\d+\/\d+\.html)"[^>]*>([\s\S]*?)<\/a>/gi;
      let m;
      while ((m = fallbackRegex.exec(html)) !== null) {
        const href = m[1];
        const block = m[2];
        const timeMatch = block.match(/<div\s+class="time">([^<]+)<\/div>/);
        const dotMatch = block.match(/<div\s+class="dot">([^<]+)<\/div>/);
        if (timeMatch && dotMatch && href) {
          allItems.push({
            id: href.replace(/^\//, "").replace(/\.html$/, "").replace(/\//g, "-"),
            title: dotMatch[1].trim(),
            date: parseChineseDate(timeMatch[1]),
            summary: dotMatch[1].trim().slice(0, 150),
            url: BASE_URL + href,
          });
        }
      }
      console.log(`  fallback: ${allItems.length} total items`);
    }

    if (allItems.length === 0) {
      return new Response(JSON.stringify({ message: "No news items found" }), { status: 200 });
    }

    // 3. 去重 + 只保留最近7天的新闻
    const seen = new Set<string>();
    const unique = allItems.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      // 检查日期是否在7天内
      if (item.date) {
        const itemDate = new Date(item.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return itemDate >= weekAgo;
      }
      return true; // 无日期的保留
    });

    console.log(`  unique + recent: ${unique.length} items`);

    // 4. 连接 Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 5. 分类 + 写入
    let inserted = 0;
    const now = Date.now();

    for (const item of unique) {
      // 确定分类
      let category = "综合新闻";
      let categoryEmoji = "📰";
      for (const [col, info] of Object.entries(CATEGORY_MAP)) {
        if (item.url.includes(`/${col}/`)) {
          category = info.name;
          categoryEmoji = info.emoji;
          break;
        }
      }

      const moodEffect = computeMoodEffect(item.title, item.summary);

      const { error } = await supabase.from("campus_hotspots").upsert({
        id: item.id,
        title: item.title,
        date: item.date,
        summary: item.summary,
        url: item.url,
        image_url: item.imageUrl || null,
        category,
        category_emoji: categoryEmoji,
        mood_effect: moodEffect,
        scraped_at: now,
        is_active: true,
      }, { onConflict: "id" });

      if (error) {
        console.error(`  upsert error for ${item.id}:`, error.message);
      } else {
        inserted++;
      }
    }

    // 6. 清理过期热点
    await supabase.rpc("deactivate_old_hotspots");

    return new Response(JSON.stringify({
      success: true,
      total_fetched: allItems.length,
      inserted,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("scrape-news error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
