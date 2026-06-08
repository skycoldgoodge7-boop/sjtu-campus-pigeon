-- ====== 010: 今日礼物标记持久化 ======
-- V2.0 礼物系统升级

alter table today_meta
  add column if not exists gift_flags jsonb not null default '{}';

-- 回填已有行
update today_meta set gift_flags = '{}' where gift_flags is null;
