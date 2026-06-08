-- ============================================================
-- 一键修复全部同步问题
-- ============================================================

-- ① feed_totals 加 RLS（如果还没有）
alter table feed_totals enable row level security;
do $$ begin
  create policy "anon_all" on feed_totals for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

-- ② today_meta 加入 realtime（如果还没加）
do $$ begin
  alter publication supabase_realtime add table today_meta;
exception when duplicate_object then null;
end $$;

-- ③ 新表：每日投票
create table if not exists daily_votes (
  id text primary key, date text not null, question text not null,
  options jsonb not null default '[]',
  vote_counts jsonb not null default '[0,0,0,0]',
  total_votes integer not null default 0,
  winning_option integer not null default 0,
  result_mood text not null default '',
  result_behavior_modifier jsonb not null default '{}',
  generated_at bigint not null default 0
);
do $$ begin alter publication supabase_realtime add table daily_votes; exception when duplicate_object then null; end $$;
alter table daily_votes enable row level security;
do $$ begin create policy "anon_all" on daily_votes for all using (true) with check (true); exception when duplicate_object then null; end $$;

-- ④ 新表：用户投票记录
create table if not exists user_votes (
  id text primary key, user_id text not null, date text not null,
  vote_index integer not null, rumor_vote text, voted_at bigint not null default 0
);
alter table user_votes enable row level security;
do $$ begin create policy "anon_all" on user_votes for all using (true) with check (true); exception when duplicate_object then null; end $$;

-- ⑤ 新表：背包物品
create table if not exists backpack_items (
  id text primary key, name text not null, emoji text not null,
  landmark_id text not null, landmark_name text not null,
  collected_at text not null, description text not null default '',
  rarity text not null default 'common'
);
alter table backpack_items enable row level security;
do $$ begin create policy "anon_all" on backpack_items for all using (true) with check (true); exception when duplicate_object then null; end $$;

-- ⑥ 新表：校园传闻
create table if not exists campus_rumors (
  id text primary key, date text not null, content text not null,
  true_votes integer not null default 0, false_votes integer not null default 0,
  generated_at bigint not null default 0
);
do $$ begin alter publication supabase_realtime add table campus_rumors; exception when duplicate_object then null; end $$;
alter table campus_rumors enable row level security;
do $$ begin create policy "anon_all" on campus_rumors for all using (true) with check (true); exception when duplicate_object then null; end $$;

-- ⑦ 新表：校园日报
create table if not exists daily_newspapers (
  id text primary key, date text not null,
  location_name text not null default '', location_emoji text not null default '📍',
  itinerary jsonb not null default '[]', today_topic text not null default '',
  voting_result jsonb, photo_id text, collected_items jsonb not null default '[]',
  rumor_content text, pigeon_thought text not null default '',
  content text not null default '', created_at bigint not null default 0
);
alter table daily_newspapers enable row level security;
do $$ begin create policy "anon_all" on daily_newspapers for all using (true) with check (true); exception when duplicate_object then null; end $$;
