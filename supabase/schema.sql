-- iDIY Supabase schema
-- Owner: Person 1 (feature/p1-ai-backend)

create extension if not exists vector;

create table manual_chunks (
  id          uuid primary key default gen_random_uuid(),
  device_id   text not null,
  chunk_text  text not null,
  embedding   vector(1024),
  page        int,
  created_at  timestamptz default now()
);

create index on manual_chunks using ivfflat (embedding vector_cosine_ops);

create table devices (
  id          text primary key,
  name        text not null,
  brand       text,
  manual_url  text,
  created_at  timestamptz default now()
);

create table sessions (
  id          uuid primary key default gen_random_uuid(),
  device_id   text references devices(id),
  started_at  timestamptz default now(),
  ended_at    timestamptz,
  cost_usd    numeric(6,4)
);
