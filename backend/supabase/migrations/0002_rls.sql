-- ─────────────────────────────────────────────────────────────
-- ARISE//OS — 0002_rls.sql
-- RLS on every table. NO client write policies: all mutations go
-- through the Express backend (service-role key, bypasses RLS).
-- SELECT policies (user_id = auth.uid()) exist only on the tables
-- clients read/subscribe to via Supabase Realtime.
-- ─────────────────────────────────────────────────────────────

-- Enable RLS everywhere (service role bypasses all of it).
alter table users               enable row level security;
alter table user_settings       enable row level security;
alter table titles              enable row level security;
alter table player_profiles     enable row level security;
alter table level_progress      enable row level security;
alter table attributes          enable row level security;
alter table attribute_history   enable row level security;
alter table quest_templates     enable row level security;
alter table main_quests         enable row level security;
alter table main_quest_stages   enable row level security;
alter table bosses              enable row level security;
alter table boss_battles        enable row level security;
alter table quests              enable row level security;
alter table quest_completions   enable row level security;
alter table skill_trees         enable row level security;
alter table skill_nodes         enable row level security;
alter table skill_progress      enable row level security;
alter table habits              enable row level security;
alter table habit_logs          enable row level security;
alter table urge_logs           enable row level security;
alter table recovery_quests     enable row level security;
alter table focus_sessions      enable row level security;
alter table boss_battle_logs    enable row level security;
alter table achievements        enable row level security;
alter table user_achievements   enable row level security;
alter table user_titles         enable row level security;
alter table streaks             enable row level security;
alter table streak_shields      enable row level security;
alter table rewards             enable row level security;
alter table reward_purchases    enable row level security;
alter table coin_transactions   enable row level security;
alter table reports             enable row level security;
alter table activity_logs       enable row level security;
alter table notifications       enable row level security;
alter table timetable_blocks    enable row level security;
alter table timetable_block_logs enable row level security;
alter table study_logs          enable row level security;

-- SELECT-only policies for Realtime-subscribed / client-readable tables.
create policy "own profile"          on player_profiles      for select using (user_id = auth.uid());
create policy "own quests"           on quests               for select using (user_id = auth.uid());
create policy "own completions"      on quest_completions    for select using (user_id = auth.uid());
create policy "own attributes"       on attributes           for select using (user_id = auth.uid());
create policy "own streaks"          on streaks              for select using (user_id = auth.uid());
create policy "own notifications"    on notifications        for select using (user_id = auth.uid());
create policy "own timetable logs"   on timetable_block_logs for select using (user_id = auth.uid());
create policy "own focus sessions"   on focus_sessions       for select using (user_id = auth.uid());
create policy "own habit logs"       on habit_logs           for select using (user_id = auth.uid());
