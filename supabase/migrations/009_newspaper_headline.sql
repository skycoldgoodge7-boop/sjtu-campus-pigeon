-- ====== 009: 鸽报新增 headline 和 interaction_count ======
-- V2.0 日报结构升级

alter table daily_newspapers
  add column if not exists headline text not null default '',
  add column if not exists interaction_count integer not null default 0;

-- 回填已有行
update daily_newspapers set headline = '' where headline is null;
update daily_newspapers set interaction_count = 0 where interaction_count is null;
