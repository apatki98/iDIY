-- iDIY Supabase schema (v2 — simplified, no pgvector)
-- Owner: Person 1 (feature/p1-ai-backend)

create table devices (
  id          text primary key,
  name        text not null,
  brand       text,
  manual_url  text,
  manual_text text,
  created_at  timestamptz default now()
);

create table sessions (
  id          uuid primary key default gen_random_uuid(),
  device_id   text references devices(id),
  started_at  timestamptz default now(),
  ended_at    timestamptz,
  cost_usd    numeric(6,4)
);
