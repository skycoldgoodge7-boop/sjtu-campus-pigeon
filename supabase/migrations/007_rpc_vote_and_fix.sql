-- ====== 原子投票 + 修复全部竞态 ======

-- ① 投票原子递增（替代覆盖写入）
create or replace function increment_vote_count(
  p_vote_id text,
  p_vote_index integer
)
returns void language plpgsql security definer as $$
begin
  update daily_votes
  set
    vote_counts = jsonb_set(
      vote_counts,
      array[p_vote_index::text],
      to_jsonb((coalesce((vote_counts->>p_vote_index::integer)::integer, 0)) + 1)
    ),
    total_votes = total_votes + 1
  where id = p_vote_id;
end;
$$;

-- ② 传闻投票原子递增
create or replace function increment_rumor_vote(
  p_rumor_id text,
  p_is_true boolean
)
returns void language plpgsql security definer as $$
begin
  if p_is_true then
    update campus_rumors set true_votes = true_votes + 1 where id = p_rumor_id;
  else
    update campus_rumors set false_votes = false_votes + 1 where id = p_rumor_id;
  end if;
end;
$$;

-- ③ 地标访问数组合并（替代覆盖）
create or replace function merge_landmarks_visited(
  p_landmarks text[]
)
returns void language plpgsql security definer as $$
begin
  update today_meta
  set today_landmarks_visited = (
    select coalesce(array_agg(distinct e), array[]::text[])
    from unnest(today_landmarks_visited || p_landmarks) as e
  )
  where id = 1;
end;
$$;
