-- Love notes. Run this once in your Supabase project:
-- SQL Editor → New query → paste everything → Run. (Safe to run again.)

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  -- 'me' or 'her', as named in src/lib/us.ts
  author text not null check (author in ('me', 'her')),
  body text not null check (char_length(body) between 1 and 1000),
  color text not null default 'cream' check (color in ('cream', 'wheat', 'blush', 'burgundy')),
  -- Private notes are only shown when one of us is signed in.
  is_private boolean not null default true,
  loved boolean not null default false,
  author_email text,
  created_at timestamptz not null default now()
);

create index if not exists notes_created_at_idx on public.notes (created_at desc);

-- Only the website's server (using the secret key) can read or change notes.
alter table public.notes enable row level security;
