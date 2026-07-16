-- 0005: day-type timetables + excused-with-reason block logs.
--
-- * timetable_day_type — a schedule variant per kind of day (office / WFH /
--   weekend-or-holiday); 'ALL' keeps pre-existing single-schedule blocks valid.
-- * timetable_state gains 'EXCUSED' — a missed block explicitly excused by the
--   user for a valid reason (no XP, but not counted as a plain MISS).
-- * timetable_block_logs.exception_reason records that reason.
-- * timetable_category gains WORK / COMMUTE / NETWORKING for job-day blocks.
--
-- NOTE: new enum VALUES added here must not be referenced in this same
-- migration (Postgres forbids using them inside the adding transaction).

create type timetable_day_type as enum ('ALL', 'OFFICE', 'WFH', 'WEEKEND');

alter table timetable_blocks
  add column day_type timetable_day_type not null default 'ALL';

drop index if exists idx_timetable_blocks_user_order;
create index idx_timetable_blocks_user_day_order
  on timetable_blocks (user_id, day_type, "order");

alter type timetable_state add value if not exists 'EXCUSED';

alter type timetable_category add value if not exists 'WORK';
alter type timetable_category add value if not exists 'COMMUTE';
alter type timetable_category add value if not exists 'NETWORKING';

alter table timetable_block_logs
  add column exception_reason text not null default '';
