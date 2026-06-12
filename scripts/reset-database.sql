-- ============================================================
-- 交大鸽子共享计划 · 数据重置脚本
-- 6.13 正式上线前清空测试数据
-- 在 Supabase SQL Editor 中执行
-- ============================================================

-- 1. 清空所有表
DELETE FROM feed_totals;
DELETE FROM today_meta;
DELETE FROM pigeon_state;
DELETE FROM journals;
DELETE FROM daily_photos;
DELETE FROM messages;
DELETE FROM recent_feeds;
DELETE FROM remembered_characters;
DELETE FROM user_votes;
DELETE FROM daily_votes;
DELETE FROM campus_rumors;
DELETE FROM daily_newspapers;
DELETE FROM backpack_items;

-- 2. 初始化 today_meta（必填行）
INSERT INTO today_meta (
  id, today_date, today_feed_count,
  today_landmarks_visited, today_encounters,
  character_traces, mood_streaks, gift_flags
) VALUES (
  1, '2026-06-13', 0,
  '[]', '[]',
  '{}', '{}',
  '{"hasUmbrella":false,"hasCamera":false,"hasHeadphone":false,"hasScarf":false,"hasFlower":false}'
);

-- 3. 初始化 pigeon_state（必填行）
INSERT INTO pigeon_state (
  id, current_landmark_id, pigeon_activity,
  stay_until, last_tick_at, last_stay_start_time,
  mood, total_flights, landmark_stay_durations,
  used_photo_urls, last_visited, version
) VALUES (
  1, 'siyuan-lake', 'idle',
  0, 0, 0,
  '{"stress":50,"romance":50,"social":50,"loneliness":50,"energy":50,"warmth":50,"academic":50,"slack":50}',
  0, '{}',
  '[]', '[]', 0
);

-- 4. 确认结果
SELECT 'today_meta' AS table_name, count(*) AS rows FROM today_meta
UNION ALL SELECT 'pigeon_state', count(*) FROM pigeon_state
UNION ALL SELECT 'feed_totals', count(*) FROM feed_totals
UNION ALL SELECT 'journals', count(*) FROM journals
UNION ALL SELECT 'daily_photos', count(*) FROM daily_photos
UNION ALL SELECT 'messages', count(*) FROM messages
UNION ALL SELECT 'remembered_characters', count(*) FROM remembered_characters
UNION ALL SELECT 'daily_votes', count(*) FROM daily_votes
UNION ALL SELECT 'campus_rumors', count(*) FROM campus_rumors
UNION ALL SELECT 'daily_newspapers', count(*) FROM daily_newspapers
UNION ALL SELECT 'backpack_items', count(*) FROM backpack_items;
