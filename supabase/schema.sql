-- Run this once in your Supabase project:
-- SQL Editor → New query → paste everything → Run.

-- One row per photo. The files themselves live in the "photos" storage bucket.
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  taken_at timestamptz not null,
  caption text check (char_length(caption) <= 300),
  favorite boolean not null default false,
  path text not null,
  thumb_path text not null,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  created_at timestamptz not null default now()
);

create index if not exists photos_taken_at_idx on public.photos (taken_at desc);

-- Row level security with no policies: only the website's server (which uses
-- the secret key) can read or change rows. Nobody can edit them from outside.
alter table public.photos enable row level security;

-- A public bucket, so photo links work on the public site.
-- Only the website's server can upload or delete files in it.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Love notes (also in supabase/love-notes.sql)
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
