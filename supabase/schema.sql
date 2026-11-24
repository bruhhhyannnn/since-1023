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
