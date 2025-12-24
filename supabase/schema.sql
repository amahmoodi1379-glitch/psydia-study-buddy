-- ============================================================
-- psydia schema (Mini-App v1.8.1 + Admin v1.3.2 compatible)
-- ============================================================

-- 1) Extensions (uuid)
create extension if not exists "pgcrypto";

-- 2) Updated-at trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 3) Content tables: subjects -> topics -> subtopics -> questions
-- ============================================================

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  title_fa text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_subjects_updated_at
before update on public.subjects
for each row execute function public.set_updated_at();


create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete restrict,
  title_fa text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_topics_subject_order
on public.topics(subject_id, display_order);

create trigger trg_topics_updated_at
before update on public.topics
for each row execute function public.set_updated_at();


create table if not exists public.subtopics (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete restrict,
  title_fa text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subtopics_topic_order
on public.subtopics(topic_id, display_order);

create trigger trg_subtopics_updated_at
before update on public.subtopics
for each row execute function public.set_updated_at();


create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  subtopic_id uuid not null references public.subtopics(id) on delete restrict,
  stem_text text not null,
  choices_json jsonb not null,
  correct_choice_index smallint not null,
  explanation_text text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- basic DB-level validation
  constraint chk_questions_choices_is_array check (jsonb_typeof(choices_json) = 'array'),
  constraint chk_questions_choices_len_4 check (jsonb_array_length(choices_json) = 4),
  constraint chk_questions_correct_index check (correct_choice_index between 0 and 3)
);

-- Duplicate detection support (Admin import): normalized stem (generated)
-- collapse spaces + trim + lower
alter table public.questions
  add column if not exists normalized_stem text
  generated always as (
    lower(
      regexp_replace(
        btrim(stem_text),
        '\s+',
        ' ',
        'g'
      )
    )
  ) stored;

create index if not exists idx_questions_subtopic_active
on public.questions(subtopic_id, is_active);

create index if not exists idx_questions_subtopic_normstem
on public.questions(subtopic_id, normalized_stem);

create trigger trg_questions_updated_at
before update on public.questions
for each row execute function public.set_updated_at();


-- ============================================================
-- 4) Users & learning data
-- ============================================================

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null unique,

  display_name text not null default 'کاربر',
  avatar_id integer not null default 1,
  theme text not null default 'light' check (theme in ('light','dark')),

  is_disabled boolean not null default false,

  -- activity / product metrics
  last_active_at timestamptz null,
  total_questions_answered integer not null default 0,

  -- UX shortcuts
  last_opened_subtopic_id uuid null references public.subtopics(id) on delete set null,

  -- streak (UTC-based; computed by backend later)
  last_practice_date date null,
  streak_current integer not null default 0,
  streak_best integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_last_active
on public.users(last_active_at);

create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();


-- Per-user per-question SRS state (SM-2 Binary-Advanced)
create table if not exists public.user_question_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete restrict,
  question_id uuid not null references public.questions(id) on delete restrict,
  subtopic_id uuid not null references public.subtopics(id) on delete restrict,

  ef numeric(4,2) not null default 2.50,
  interval_days integer not null default 0,
  box_number smallint not null default 1,

  next_due_at timestamptz null,
  last_review_at timestamptz null,

  total_attempts integer not null default 0,
  correct_attempts integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint uq_user_question unique (user_id, question_id),
  constraint chk_ef_min check (ef >= 1.30),
  constraint chk_box_range check (box_number between 1 and 6)
);

create index if not exists idx_uqs_user_subtopic_due
on public.user_question_state(user_id, subtopic_id, next_due_at);

create index if not exists idx_uqs_user_due
on public.user_question_state(user_id, next_due_at);

create trigger trg_uqs_updated_at
before update on public.user_question_state
for each row execute function public.set_updated_at();


-- Attempts log (idempotency by (user_id, attempt_id))
-- IMPORTANT: attempt_id is TEXT because frontend sends "sessionId:questionId"
create table if not exists public.user_question_attempt (
  id uuid primary key default gen_random_uuid(),

  attempt_id text not null,
  user_id uuid not null references public.users(id) on delete restrict,
  question_id uuid not null references public.questions(id) on delete restrict,
  subtopic_id uuid not null references public.subtopics(id) on delete restrict,

  chosen_index smallint null check (chosen_index between 0 and 3),
  was_correct boolean not null default false,
  was_dont_know boolean not null default false,

  -- optional before/after snapshots for debugging & analytics
  ef_before numeric(4,2) null,
  ef_after numeric(4,2) null,
  interval_before integer null,
  interval_after integer null,
  box_before smallint null,
  box_after smallint null,

  created_at timestamptz not null default now(),

  constraint uq_user_attempt unique (user_id, attempt_id),
  constraint chk_dont_know_choice check (
    -- if dont_know then chosen_index must be null
    (was_dont_know = true and chosen_index is null)
    or
    (was_dont_know = false)
  )
);

create index if not exists idx_uqa_user_created
on public.user_question_attempt(user_id, created_at desc);

create index if not exists idx_uqa_user_subtopic_created
on public.user_question_attempt(user_id, subtopic_id, created_at desc);


-- Bookmarks
create table if not exists public.user_bookmark (
  user_id uuid not null references public.users(id) on delete restrict,
  question_id uuid not null references public.questions(id) on delete restrict,
  created_at timestamptz not null default now(),

  primary key (user_id, question_id)
);

create index if not exists idx_bookmark_user_created
on public.user_bookmark(user_id, created_at desc);


-- Reports (Issue inbox for admin)
create table if not exists public.question_report (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references public.users(id) on delete restrict,
  question_id uuid not null references public.questions(id) on delete restrict,

  report_type text not null check (report_type in ('wrong_key','typo','ambiguous','other')),
  message text null,

  status text not null default 'open' check (status in ('open','resolved','ignored')),
  resolved_at timestamptz null,
  resolved_by text null,

  created_at timestamptz not null default now()
);

create index if not exists idx_report_status_created
on public.question_report(status, created_at desc);

create index if not exists idx_report_question
on public.question_report(question_id);


-- Optional: daily stats (cheap sparkline/heatmap)
create table if not exists public.user_daily_stats (
  user_id uuid not null references public.users(id) on delete restrict,
  day_date date not null, -- should be UTC date by backend
  attempts integer not null default 0,
  correct integer not null default 0,
  dont_know integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, day_date)
);

create trigger trg_uds_updated_at
before update on public.user_daily_stats
for each row execute function public.set_updated_at();


-- ============================================================
-- 5) Admin tables
-- ============================================================

-- allowlist for admin API
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_admin_users_updated_at
before update on public.admin_users
for each row execute function public.set_updated_at();


create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  action_type text not null,
  entity_type text not null,
  entity_id uuid null,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_created
on public.admin_audit_log(created_at desc);


-- ============================================================
-- 6) RLS (safe default: ON for sensitive tables)
-- Note: Service role (used by Worker) bypasses RLS.
-- ============================================================

alter table public.users enable row level security;
alter table public.user_question_state enable row level security;
alter table public.user_question_attempt enable row level security;
alter table public.user_bookmark enable row level security;
alter table public.question_report enable row level security;
alter table public.user_daily_stats enable row level security;

-- Content tables can also be protected (optional but safe)
alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.subtopics enable row level security;
alter table public.questions enable row level security;

-- Admin tables protected too
alter table public.admin_users enable row level security;
alter table public.admin_audit_log enable row level security;

-- Intentionally no policies in MVP (client never queries Supabase directly).
-- Worker uses Service Role and is not blocked by RLS.
