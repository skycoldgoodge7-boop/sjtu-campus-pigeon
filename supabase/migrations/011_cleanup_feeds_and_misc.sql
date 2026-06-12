-- ====== 011_cleanup_feeds_and_misc.sql ======
-- 补充缺失的 RPC 和修复

-- ① 清理旧投喂记录（保留最近 500 条）
create or replace function cleanup_old_feeds()
returns void
language plpgsql
security definer
as $$
begin
  delete from recent_feeds
  where id not in (
    select id from recent_feeds
    order by timestamp desc
    limit 500
  );
end;
$$;

-- ② 确保 newspaper 的 headline 列存在（旧数据库可能缺失）
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'daily_newspapers' and column_name = 'headline'
  ) then
    alter table daily_newspapers add column headline text;
  end if;
end $$;

-- ③ 确保 pigeon_reply 和 picked_note 列存在（旧数据库可能缺失）
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'journals' and column_name = 'pigeon_reply'
  ) then
    alter table journals add column pigeon_reply text;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'journals' and column_name = 'picked_note'
  ) then
    alter table journals add column picked_note text;
  end if;
end $$;

-- ④ 确保 unlocked_footprints 列存在
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'today_meta' and column_name = 'unlocked_footprints'
  ) then
    alter table today_meta add column unlocked_footprints text[] default '{}';
  end if;
end $$;
