-- ====== 日期感知的 RPC 修复 ======
-- 解决跨天不重置的问题

-- ① 重置所有 feed_totals 的 today_count（跨天调用）
create or replace function reset_all_today_counts()
returns void
language plpgsql
security definer
as $$
begin
  update feed_totals set today_count = 0;
end;
$$;

-- ② 改进 increment_today_feed_count：跨天自动重置
create or replace function increment_today_feed_count()
returns void
language plpgsql
security definer
as $$
declare
  db_date text;
  today_date text;
begin
  today_date := to_char(now() at time zone 'Asia/Shanghai', 'YYYY-MM-DD');

  -- 检查当前数据库中的日期
  select today_date into db_date from today_meta where id = 1;

  -- 如果日期不匹配，重置所有今日数据
  if db_date is null or db_date != today_date then
    update today_meta
    set today_feed_count = 1,
        today_date = today_date,
        today_landmarks_visited = '[]'::jsonb,
        today_encounters = '[]'::jsonb
    where id = 1;
    -- 同时重置 feed_totals 的 today_count
    update feed_totals set today_count = 0;
  else
    update today_meta
    set today_feed_count = today_feed_count + 1
    where id = 1;
  end if;
end;
$$;

-- ③ 改进 increment_feed_total：跨天自动重置 today_count
create or replace function increment_feed_total(
  p_item_id text,
  p_count integer default 1
)
returns void
language plpgsql
security definer
as $$
declare
  db_date text;
  today_date text;
begin
  today_date := to_char(now() at time zone 'Asia/Shanghai', 'YYYY-MM-DD');

  -- 检查日期
  select today_date into db_date from today_meta where id = 1;

  -- 如果跨天了，先重置所有 today_count
  if db_date is null or db_date != today_date then
    update today_meta
    set today_feed_count = 0,
        today_date = today_date,
        today_landmarks_visited = '[]'::jsonb,
        today_encounters = '[]'::jsonb
    where id = 1;
    update feed_totals set today_count = 0;
  end if;

  -- 然后原子递增
  insert into feed_totals (item_id, count, today_count)
  values (p_item_id, p_count, p_count)
  on conflict (item_id) do update
  set count = feed_totals.count + p_count,
      today_count = feed_totals.today_count + p_count;
end;
$$;

-- ④ 重置 today_meta（保留，兼容旧调用）
create or replace function reset_today_feed()
returns void
language plpgsql
security definer
as $$
declare
  today_date text;
begin
  today_date := to_char(now() at time zone 'Asia/Shanghai', 'YYYY-MM-DD');
  update today_meta
  set today_feed_count = 0,
      today_date = today_date,
      today_landmarks_visited = '[]'::jsonb,
      today_encounters = '[]'::jsonb
  where id = 1;
  update feed_totals set today_count = 0;
end;
$$;
