-- ─────────────────────────────────────────────────────────────
-- ARISE//OS — 0003_realtime.sql
-- Publish user-facing tables on the Realtime publication so web +
-- Flutter clients receive postgres_changes events (RLS-filtered by
-- the SELECT policies in 0002). Events are cache-invalidation
-- signals only — clients refetch view models from the Express API.
-- ─────────────────────────────────────────────────────────────

alter publication supabase_realtime add table player_profiles;
alter publication supabase_realtime add table quests;
alter publication supabase_realtime add table quest_completions;
alter publication supabase_realtime add table attributes;
alter publication supabase_realtime add table streaks;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table timetable_block_logs;
alter publication supabase_realtime add table focus_sessions;
alter publication supabase_realtime add table habit_logs;

-- Full row images so UPDATE events carry user_id for client-side filters.
alter table player_profiles      replica identity full;
alter table quests               replica identity full;
alter table quest_completions    replica identity full;
alter table attributes           replica identity full;
alter table streaks              replica identity full;
alter table notifications        replica identity full;
alter table timetable_block_logs replica identity full;
alter table focus_sessions       replica identity full;
alter table habit_logs           replica identity full;
