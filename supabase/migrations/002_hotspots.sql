-- ============================================
-- 校园热点抓取 — campus_hotspots 表
-- 存储从 news.sjtu.edu.cn 抓取的新闻
-- 在 Supabase SQL Editor 中执行此文件
-- ============================================

-- 启用 realtime
alter publication supabase_realtime add table campus_hotspots;

-- 校园热点表
create table if not exists campus_hotspots (
  id              text primary key,                    -- URL 路径 hash（如 "jdyw/20260601/223331"）
  title           text not null,                       -- 新闻标题
  date            text not null,                       -- 发布日期 "YYYY-MM-DD"
  summary         text not null default '',            -- 摘要（截取前150字）
  url             text not null,                       -- 完整链接
  image_url       text,                                -- 封面图
  category        text not null default '综合新闻',     -- 栏目名
  category_emoji  text not null default '📰',          -- 栏目图标
  mood_effect     jsonb not null default '{}',         -- 对鸽子情绪的影响 {"academic":5, "stress":3}
  landmark_hint   text,                                -- 相关地标 ID（可选）
  scraped_at      bigint not null default 0,           -- 抓取时间戳
  is_active       boolean not null default true        -- 是否仍在活跃期（7天内）
);

-- 索引
create index if not exists idx_hotspots_date on campus_hotspots (date desc);
create index if not exists idx_hotspots_active on campus_hotspots (is_active) where is_active = true;

-- RLS
alter table campus_hotspots enable row level security;
create policy "anon_all" on campus_hotspots for all using (true) with check (true);

-- 自动清理：超过 14 天的热点标记为不活跃
create or replace function deactivate_old_hotspots()
returns void as $$
begin
  update campus_hotspots
  set is_active = false
  where is_active = true
    and date < to_char(current_date - interval '14 days', 'YYYY-MM-DD');
end;
$$ language plpgsql;
