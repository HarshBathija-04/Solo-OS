-- ─────────────────────────────────────────────────────────────
-- ARISE//OS — 0001_schema.sql
-- Translated from Website/prisma/schema.prisma (Prisma 6 → plain SQL).
-- Dropped: GameStateSnapshot (dead snapshot sync), users.password_hash
-- (Supabase Auth owns credentials). users.id is now the auth.users uuid.
-- ─────────────────────────────────────────────────────────────

-- ─────────────────────────── ENUMS ───────────────────────────

create type quest_type as enum ('MAIN','DAILY','SIDE','EMERGENCY','RECOVERY','BOSS','HIDDEN');
create type difficulty as enum ('E','D','C','B','A','S','SS');
create type quest_status as enum ('ACTIVE','COMPLETED','PARTIAL','FAILED','EXPIRED');
create type attribute_key as enum ('STR','INT','FOC','DIS','END','CON','SKL','VIT');
create type skill_status as enum ('LOCKED','AVAILABLE','IN_PROGRESS','MASTERED');
create type habit_kind as enum ('BUILD','SHADOW');
create type habit_log_result as enum ('DONE','MISSED','CLEAN','RELAPSE');
create type rarity as enum ('COMMON','RARE','EPIC','LEGENDARY','MYTHIC');
create type boss_status as enum ('LOCKED','ACTIVE','DEFEATED');
create type focus_category as enum ('GATE','DSA','AIML','FULLSTACK','DATASCIENCE','SYSTEMDESIGN','PROJECT');
create type focus_result as enum ('COMPLETE','PARTIAL','ABANDONED');
create type coin_reason as enum ('QUEST','FOCUS','ACHIEVEMENT','BOSS','STREAK','PENALTY','PURCHASE','MANUAL');
create type notification_type as enum (
  'QUEST_GENERATED','QUEST_COMPLETED','LEVEL_UP','ATTRIBUTE_UP','TITLE_ACQUIRED',
  'BOSS_ENCOUNTER','BOSS_DEFEATED','STREAK_AT_RISK','RECOVERY_ACTIVATED','ACHIEVEMENT_UNLOCKED','SYSTEM'
);
create type report_type as enum ('DAILY','WEEKLY');
create type timetable_category as enum (
  'STUDY','EXERCISE','MORNING_ROUTINE','BATH','BREAKFAST','LUNCH','DINNER','GAMING','BREAK','SLEEP'
);
create type timetable_state as enum (
  'UPCOMING','ACTIVE','COMPLETED','MISSED','SKIPPED','PAUSED','LATE','FINISHED_EARLY'
);

-- ─────────────────────────── updated_at trigger ───────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────── CORE / AUTH ───────────────────────────

-- Thin mirror of auth.users; game tables FK here.
create table users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null unique,
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_users_updated before update on users
  for each row execute function set_updated_at();

-- Auto-create the public.users row when a Supabase Auth user signs up.
create or replace function handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

create table user_settings (
  id                text primary key default gen_random_uuid()::text,
  user_id           uuid not null unique references users(id) on delete cascade,
  wake_target       text not null default '05:00',
  sleep_target      text not null default '23:00',
  min_sleep_hours   double precision not null default 6,
  daily_xp_soft_cap integer not null default 1200,
  difficulty_bias   double precision not null default 1.0,
  ai_provider       text not null default 'none',
  ai_model          text not null default 'claude-opus-4-8',
  theme             text not null default 'void',
  reduce_motion     boolean not null default false,
  timezone          text not null default 'Asia/Kolkata',
  updated_at        timestamptz not null default now()
);
create trigger trg_user_settings_updated before update on user_settings
  for each row execute function set_updated_at();

-- ─────────────────────────── PLAYER / PROGRESSION ───────────────────────────

create table titles (
  id           text primary key default gen_random_uuid()::text,
  key          text not null unique,
  name         text not null,
  description  text not null,
  rarity       rarity not null default 'COMMON',
  xp_bonus_pct double precision not null default 0
);

create table player_profiles (
  id                text primary key default gen_random_uuid()::text,
  user_id           uuid not null unique references users(id) on delete cascade,
  display_name      text not null,
  level             integer not null default 1,
  total_xp          integer not null default 0,
  current_xp        integer not null default 0,
  rank              text not null default 'Initiate',
  coins             integer not null default 0,
  active_days       integer not null default 0,
  current_streak    integer not null default 0,
  longest_streak    integer not null default 0,
  last_active_date  timestamptz,
  discipline_score  double precision not null default 0,
  knowledge_score   double precision not null default 0,
  physical_score    double precision not null default 0,
  focus_score       double precision not null default 0,
  recovery_score    double precision not null default 0,
  life_score        double precision not null default 0,
  equipped_title_id text references titles(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger trg_player_profiles_updated before update on player_profiles
  for each row execute function set_updated_at();

create table level_progress (
  id          text primary key default gen_random_uuid()::text,
  user_id     uuid not null references users(id) on delete cascade,
  from_level  integer not null,
  to_level    integer not null,
  rank        text not null,
  total_xp_at integer not null,
  created_at  timestamptz not null default now()
);
create index idx_level_progress_user_created on level_progress (user_id, created_at);

-- ─────────────────────────── ATTRIBUTES ───────────────────────────

create table attributes (
  id         text primary key default gen_random_uuid()::text,
  user_id    uuid not null references users(id) on delete cascade,
  key        attribute_key not null,
  level      integer not null default 1,
  xp         integer not null default 0,
  total_xp   integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);
create index idx_attributes_user on attributes (user_id);
create trigger trg_attributes_updated before update on attributes
  for each row execute function set_updated_at();

create table attribute_history (
  id           text primary key default gen_random_uuid()::text,
  user_id      uuid not null references users(id) on delete cascade,
  attribute_id text not null references attributes(id) on delete cascade,
  key          attribute_key not null,
  xp_delta     integer not null,
  total_xp_at  integer not null,
  level_at     integer not null,
  source       text not null,
  created_at   timestamptz not null default now()
);
create index idx_attribute_history_user_key_created on attribute_history (user_id, key, created_at);

-- ─────────────────────────── QUESTS ───────────────────────────

create table quest_templates (
  id           text primary key default gen_random_uuid()::text,
  key          text not null unique,
  title        text not null,
  description  text not null,
  type         quest_type not null,
  difficulty   difficulty not null,
  category     text not null,
  est_minutes  integer not null,
  base_xp      integer not null,
  attribute_xp jsonb not null,
  coin_reward  integer not null default 0,
  streak_key   text,
  failure_note text not null default '',
  repeatable   boolean not null default true,
  active       boolean not null default true
);

create table main_quests (
  id          text primary key default gen_random_uuid()::text,
  user_id     uuid not null references users(id) on delete cascade,
  key         text not null,
  title       text not null,
  description text not null,
  theme       text not null,
  "order"     integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (user_id, key)
);
create index idx_main_quests_user on main_quests (user_id);

create table main_quest_stages (
  id            text primary key default gen_random_uuid()::text,
  main_quest_id text not null references main_quests(id) on delete cascade,
  key           text not null,
  title         text not null,
  description   text not null,
  "order"       integer not null,
  target_units  integer not null default 100,
  progress      integer not null default 0,
  completed     boolean not null default false,
  completed_at  timestamptz,
  unique (main_quest_id, key)
);
create index idx_main_quest_stages_quest_order on main_quest_stages (main_quest_id, "order");

create table bosses (
  id           text primary key default gen_random_uuid()::text,
  key          text not null unique,
  name         text not null,
  tagline      text not null,
  description  text not null,
  max_hp       integer not null,
  phases       jsonb not null,
  reward_xp    integer not null default 0,
  reward_coins integer not null default 0,
  reward_title text,
  rarity       rarity not null default 'RARE'
);

create table boss_battles (
  id         text primary key default gen_random_uuid()::text,
  user_id    uuid not null references users(id) on delete cascade,
  boss_id    text not null references bosses(id),
  status     boss_status not null default 'ACTIVE',
  current_hp integer not null,
  max_hp     integer not null,
  phase      integer not null default 0,
  started_at timestamptz not null default now(),
  ended_at   timestamptz,
  unique (user_id, boss_id)
);
create index idx_boss_battles_user_status on boss_battles (user_id, status);

create table quests (
  id                  text primary key default gen_random_uuid()::text,
  user_id             uuid not null references users(id) on delete cascade,
  template_id         text references quest_templates(id),
  title               text not null,
  description         text not null,
  type                quest_type not null,
  difficulty          difficulty not null,
  category            text not null,
  est_minutes         integer not null,
  base_xp             integer not null,
  attribute_xp        jsonb not null,
  coin_reward         integer not null default 0,
  streak_key          text,
  failure_note        text not null default '',
  status              quest_status not null default 'ACTIVE',
  assigned_date       timestamptz not null,
  deadline            timestamptz,
  main_quest_stage_id text references main_quest_stages(id),
  boss_battle_id      text references boss_battles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index idx_quests_user_assigned on quests (user_id, assigned_date);
create index idx_quests_user_status on quests (user_id, status);
create index idx_quests_user_type on quests (user_id, type);
create trigger trg_quests_updated before update on quests
  for each row execute function set_updated_at();

create table quest_completions (
  id            text primary key default gen_random_uuid()::text,
  user_id       uuid not null references users(id) on delete cascade,
  quest_id      text not null unique references quests(id) on delete cascade,
  result        quest_status not null,
  xp_awarded    integer not null,
  coins_awarded integer not null,
  attribute_xp  jsonb not null,
  quality_ratio double precision not null default 1,
  note          text not null default '',
  completed_at  timestamptz not null default now()
);
create index idx_quest_completions_user_completed on quest_completions (user_id, completed_at);

-- ─────────────────────────── SKILL TREES ───────────────────────────

create table skill_trees (
  id         text primary key default gen_random_uuid()::text,
  user_id    uuid not null references users(id) on delete cascade,
  key        text not null,
  title      text not null,
  domain     text not null,
  created_at timestamptz not null default now(),
  unique (user_id, key)
);

create table skill_nodes (
  id           text primary key default gen_random_uuid()::text,
  tree_id      text not null references skill_trees(id) on delete cascade,
  key          text not null,
  title        text not null,
  description  text not null,
  tier         integer not null,
  "order"      integer not null default 0,
  parent_key   text,
  target_units integer not null default 100,
  unique (tree_id, key)
);
create index idx_skill_nodes_tree_tier on skill_nodes (tree_id, tier);

create table skill_progress (
  id         text primary key default gen_random_uuid()::text,
  user_id    uuid not null references users(id) on delete cascade,
  node_id    text not null unique references skill_nodes(id) on delete cascade,
  status     skill_status not null default 'LOCKED',
  units      integer not null default 0,
  updated_at timestamptz not null default now()
);
create index idx_skill_progress_user_status on skill_progress (user_id, status);
create trigger trg_skill_progress_updated before update on skill_progress
  for each row execute function set_updated_at();

-- ─────────────────────────── HABITS & SHADOW SYSTEM ───────────────────────────

create table habits (
  id         text primary key default gen_random_uuid()::text,
  user_id    uuid not null references users(id) on delete cascade,
  key        text not null,
  title      text not null,
  kind       habit_kind not null,
  streak_key text,
  private    boolean not null default false,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, key)
);
create index idx_habits_user_kind on habits (user_id, kind);

create table habit_logs (
  id         text primary key default gen_random_uuid()::text,
  user_id    uuid not null references users(id) on delete cascade,
  habit_id   text not null references habits(id) on delete cascade,
  date       timestamptz not null,
  result     habit_log_result not null,
  note       text not null default '',
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);
create index idx_habit_logs_user_date on habit_logs (user_id, date);

create table urge_logs (
  id         text primary key default gen_random_uuid()::text,
  user_id    uuid not null references users(id) on delete cascade,
  habit_key  text not null,
  resisted   boolean not null,
  trigger    text not null default '',
  mood       text not null default '',
  location   text not null default '',
  reason     text not null default '',
  created_at timestamptz not null default now()
);
create index idx_urge_logs_user_created on urge_logs (user_id, created_at);

create table recovery_quests (
  id           text primary key default gen_random_uuid()::text,
  user_id      uuid not null references users(id) on delete cascade,
  reason       text not null,
  steps        jsonb not null,
  completed    boolean not null default false,
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);
create index idx_recovery_quests_user_completed on recovery_quests (user_id, completed);

-- ─────────────────────────── FOCUS MODE ───────────────────────────

create table focus_sessions (
  id          text primary key default gen_random_uuid()::text,
  user_id     uuid not null references users(id) on delete cascade,
  category    focus_category not null,
  planned_min integer not null,
  actual_min  integer not null default 0,
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  result      focus_result,
  xp_awarded  integer not null default 0,
  quest_id    text,
  note        text not null default ''
);
create index idx_focus_sessions_user_started on focus_sessions (user_id, started_at);
create index idx_focus_sessions_user_category on focus_sessions (user_id, category);

-- ─────────────────────────── BOSS BATTLE LOGS ───────────────────────────

create table boss_battle_logs (
  id         text primary key default gen_random_uuid()::text,
  battle_id  text not null references boss_battles(id) on delete cascade,
  action     text not null,
  damage     integer not null,
  critical   boolean not null default false,
  hp_after   integer not null,
  created_at timestamptz not null default now()
);
create index idx_boss_battle_logs_battle_created on boss_battle_logs (battle_id, created_at);

-- ─────────────────────────── ACHIEVEMENTS & TITLES ───────────────────────────

create table achievements (
  id           text primary key default gen_random_uuid()::text,
  key          text not null unique,
  title        text not null,
  description  text not null,
  rarity       rarity not null,
  category     text not null,
  target_value integer not null default 1,
  metric       text not null,
  xp_reward    integer not null default 0,
  coin_reward  integer not null default 0,
  title_key    text,
  hidden       boolean not null default false
);

create table user_achievements (
  id             text primary key default gen_random_uuid()::text,
  user_id        uuid not null references users(id) on delete cascade,
  achievement_id text not null references achievements(id) on delete cascade,
  progress       integer not null default 0,
  unlocked       boolean not null default false,
  unlocked_at    timestamptz,
  unique (user_id, achievement_id)
);
create index idx_user_achievements_user_unlocked on user_achievements (user_id, unlocked);

create table user_titles (
  id          text primary key default gen_random_uuid()::text,
  user_id     uuid not null references users(id) on delete cascade,
  title_id    text not null references titles(id) on delete cascade,
  acquired_at timestamptz not null default now(),
  unique (user_id, title_id)
);
create index idx_user_titles_user on user_titles (user_id);

-- ─────────────────────────── STREAKS ───────────────────────────

create table streaks (
  id           text primary key default gen_random_uuid()::text,
  user_id      uuid not null references users(id) on delete cascade,
  key          text not null,
  title        text not null,
  current      integer not null default 0,
  longest      integer not null default 0,
  last_date    timestamptz,
  shields_used integer not null default 0,
  updated_at   timestamptz not null default now(),
  unique (user_id, key)
);
create index idx_streaks_user on streaks (user_id);
create trigger trg_streaks_updated before update on streaks
  for each row execute function set_updated_at();

create table streak_shields (
  id          text primary key default gen_random_uuid()::text,
  user_id     uuid not null references users(id) on delete cascade,
  earned_at   timestamptz not null default now(),
  used_at     timestamptz,
  used_on_key text
);
create index idx_streak_shields_user_used on streak_shields (user_id, used_at);

-- ─────────────────────────── REWARDS & ECONOMY ───────────────────────────

create table rewards (
  id          text primary key default gen_random_uuid()::text,
  user_id     uuid not null references users(id) on delete cascade,
  title       text not null,
  description text not null default '',
  cost        integer not null,
  icon        text not null default 'gift',
  custom      boolean not null default true,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index idx_rewards_user_active on rewards (user_id, active);

create table reward_purchases (
  id         text primary key default gen_random_uuid()::text,
  user_id    uuid not null references users(id) on delete cascade,
  reward_id  text not null references rewards(id) on delete cascade,
  cost       integer not null,
  created_at timestamptz not null default now()
);
create index idx_reward_purchases_user_created on reward_purchases (user_id, created_at);

create table coin_transactions (
  id         text primary key default gen_random_uuid()::text,
  user_id    uuid not null references users(id) on delete cascade,
  amount     integer not null,
  reason     coin_reason not null,
  source     text not null default '',
  balance    integer not null,
  created_at timestamptz not null default now()
);
create index idx_coin_transactions_user_created on coin_transactions (user_id, created_at);

-- ─────────────────────────── REPORTS & ANALYTICS ───────────────────────────

create table reports (
  id         text primary key default gen_random_uuid()::text,
  user_id    uuid not null references users(id) on delete cascade,
  type       report_type not null,
  period_key text not null,
  data       jsonb not null,
  summary    text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, type, period_key)
);
create index idx_reports_user_type_created on reports (user_id, type, created_at);

create table activity_logs (
  id         text primary key default gen_random_uuid()::text,
  user_id    uuid not null references users(id) on delete cascade,
  date       timestamptz not null,
  kind       text not null,
  value      double precision not null,
  meta       jsonb,
  created_at timestamptz not null default now()
);
create index idx_activity_logs_user_date on activity_logs (user_id, date);
create index idx_activity_logs_user_kind_date on activity_logs (user_id, kind, date);

create table notifications (
  id         text primary key default gen_random_uuid()::text,
  user_id    uuid not null references users(id) on delete cascade,
  type       notification_type not null,
  title      text not null,
  body       text not null default '',
  read       boolean not null default false,
  meta       jsonb,
  created_at timestamptz not null default now()
);
create index idx_notifications_user_read_created on notifications (user_id, read, created_at);

-- ─────────────────────────── TIMETABLE ───────────────────────────

create table timetable_blocks (
  id         text primary key default gen_random_uuid()::text,
  user_id    uuid not null references users(id) on delete cascade,
  "order"    integer not null default 0,
  start_hour integer not null,
  start_min  integer not null,
  end_hour   integer not null,
  end_min    integer not null,
  activity   text not null,
  category   timetable_category not null,
  xp_reward  integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_timetable_blocks_user_order on timetable_blocks (user_id, "order");
create trigger trg_timetable_blocks_updated before update on timetable_blocks
  for each row execute function set_updated_at();

create table timetable_block_logs (
  id         text primary key default gen_random_uuid()::text,
  user_id    uuid not null references users(id) on delete cascade,
  block_id   text not null references timetable_blocks(id) on delete cascade,
  date       timestamptz not null,
  state      timetable_state not null default 'UPCOMING',
  updated_at timestamptz not null default now(),
  unique (user_id, block_id, date)
);
create index idx_timetable_block_logs_user_date on timetable_block_logs (user_id, date);
create trigger trg_timetable_block_logs_updated before update on timetable_block_logs
  for each row execute function set_updated_at();

create table study_logs (
  id               text primary key default gen_random_uuid()::text,
  user_id          uuid not null references users(id) on delete cascade,
  block_id         text not null,
  subject          text not null,
  duration_minutes integer not null,
  deep_work_score  integer not null default 5,
  distractions     integer not null default 0,
  notes            text not null default '',
  mission_linked   text not null default '',
  xp_earned        integer not null default 0,
  created_at       timestamptz not null default now()
);
create index idx_study_logs_user_created on study_logs (user_id, created_at);
