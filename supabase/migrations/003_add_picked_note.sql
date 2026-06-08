-- ============================================
-- 003: journals 表增加 picked_note 列
-- 在 Supabase SQL Editor 中执行此文件
-- ============================================

alter table journals add column if not exists picked_note text;
