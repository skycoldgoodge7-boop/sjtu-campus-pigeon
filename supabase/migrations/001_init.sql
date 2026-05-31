-- ============================================
-- 交大鸽子共享计划 — Supabase 数据库迁移
-- 在 Supabase SQL Editor 中执行此文件
-- ============================================

-- 启用 realtime（默认启用，显式声明）
alter publication supabase_realtime add table pigeon_state;
alter publication supabase_realtime add table feed_totals;
alter publication supabase_realtime add table journals;
alter publication supabase_realtime add table daily_photos;
alter publication supabase_realtime add table messages;

-- 1. 鸽子当前状态（单行共享）
create table if not exists pigeon_state (
  id                    integer primary key default 1 check (id = 1),
  current_landmark_id   text not null default 'siyuan-lake',
  pigeon_activity       text not null default 'idle',
  stay_until            bigint not null default 0,
  last_tick_at          bigint not null default 0,
  last_stay_start_time  bigint not null default 0,
  mood                  jsonb not null default '{"stress":50,"romance":50,"social":50,"loneliness":50,"energy":50,"warmth":50,"academic":50,"slack":50}',
  total_flights         integer not null default 0,
  landmark_stay_durations jsonb not null default '{}',
  used_photo_urls       jsonb not null default '[]',
  last_visited          jsonb not null default '[]',
  version               integer not null default 0
);

-- 初始行
insert into pigeon_state (id) values (1) on conflict (id) do nothing;

-- 2. 投喂累计
create table if not exists feed_totals (
  item_id      text primary key,
  count        integer not null default 0,
  today_count  integer not null default 0
);

-- 3. 每日记录
create table if not exists journals (
  id                    text primary key,
  date                  text not null,
  content               text not null default '',
  feed_count            integer not null default 0,
  top_feed_item         text not null default '面包',
  top_feed_count        integer not null default 0,
  special_items         jsonb not null default '[]',
  landmarks_visited     jsonb not null default '[]',
  most_stayed_landmark  text not null default '思源湖',
  night_activity        text,
  campus_state          text not null default 'normal',
  has_umbrella          boolean not null default false
);

-- 4. 每日照片
create table if not exists daily_photos (
  id              text primary key,
  photo_url       text,
  caption         text not null default '',
  landmark_id     text not null default '',
  landmark_name   text not null default '',
  landmark_emoji  text not null default '📍',
  gradient_start  text not null default '#87CEEB',
  gradient_end    text not null default '#E0F7FA',
  is_easter_egg   boolean not null default false,
  created_at      bigint not null default 0
);

-- 5. 漂流瓶
create table if not exists messages (
  id               text primary key,
  text             text not null default '',
  emoji            text not null default '💌',
  status           text not null default 'floating',
  timestamp        bigint not null default 0,
  picked_by_pigeon boolean not null default false
);

-- 6. 认识的角色
create table if not exists remembered_characters (
  character_id    text primary key,
  name            text not null default '',
  silhouette      text not null default '?',
  type            text not null default 'presence',
  stage           integer not null default 0,
  first_met       bigint not null default 0,
  last_seen       bigint not null default 0,
  encounter_count integer not null default 0,
  landmark_id     text not null default '',
  disappeared     boolean not null default false,
  disappeared_at  bigint
);

-- 7. 今日元数据
create table if not exists today_meta (
  id                       integer primary key default 1 check (id = 1),
  today_date               text not null default '',
  today_feed_count         integer not null default 0,
  today_landmarks_visited  jsonb not null default '[]',
  today_encounters         jsonb not null default '[]',
  character_traces         jsonb not null default '{}',
  mood_streaks             jsonb not null default '{}'
);

insert into today_meta (id) values (1) on conflict (id) do nothing;

-- 8. 最近投喂日志
create table if not exists recent_feeds (
  id         bigserial primary key,
  item_id    text not null,
  item_emoji text not null default '',
  item_name  text not null default '',
  timestamp  bigint not null default 0
);

-- 保留最近100条
create index if not exists idx_recent_feeds_timestamp on recent_feeds (timestamp desc);

-- ============================================
-- RLS 策略：允许匿名访问（公开共享模式）
-- ============================================
alter table pigeon_state enable row level security;
alter table feed_totals enable row level security;
alter table journals enable row level security;
alter table daily_photos enable row level security;
alter table messages enable row level security;
alter table remembered_characters enable row level security;
alter table today_meta enable row level security;
alter table recent_feeds enable row level security;

-- 所有表允许匿名读写
create policy "anon_all" on pigeon_state for all using (true) with check (true);
create policy "anon_all" on feed_totals for all using (true) with check (true);
create policy "anon_all" on journals for all using (true) with check (true);
create policy "anon_all" on daily_photos for all using (true) with check (true);
create policy "anon_all" on messages for all using (true) with check (true);
create policy "anon_all" on remembered_characters for all using (true) with check (true);
create policy "anon_all" on today_meta for all using (true) with check (true);
create policy "anon_all" on recent_feeds for all using (true) with check (true);
