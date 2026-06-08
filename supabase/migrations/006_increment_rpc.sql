-- ====== 原子递增 RPC ======
-- 解决多端喂食覆盖问题

create or replace function increment_feed_total(
  p_item_id text,
  p_count integer default 1
)
returns void
language plpgsql
security definer
as $$
begin
  insert into feed_totals (item_id, count, today_count)
  values (p_item_id, p_count, p_count)
  on conflict (item_id) do update
  set count = feed_totals.count + p_count,
      today_count = feed_totals.today_count + p_count;
end;
$$;

-- today_meta 原子递增
create or replace function increment_today_feed_count()
returns void
language plpgsql
security definer
as $$
begin
  update today_meta
  set today_feed_count = today_feed_count + 1
  where id = 1;
end;
$$;

-- today_meta 重置（跨天时调用）
create or replace function reset_today_feed()
returns void
language plpgsql
security definer
as $$
begin
  update today_meta
  set today_feed_count = 0,
      today_landmarks_visited = '[]'::jsonb,
      today_encounters = '[]'::jsonb
  where id = 1;
end;
$$;
