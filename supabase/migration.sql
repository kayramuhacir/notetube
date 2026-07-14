-- NoteTube schema. Run this once in the Supabase SQL editor
-- (Dashboard -> SQL Editor -> New query) after creating the project.

-- Profile table, mirrors auth.users
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  stripe_customer_id text,
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Daily usage counters, one row per user per day
create table if not exists public.usage (
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null default current_date,
  count integer not null default 0,
  primary key (user_id, date)
);

alter table public.usage enable row level security;

create policy "Users can view own usage" on public.usage
  for select using (auth.uid() = user_id);

-- Generated notes / PDFs
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  video_title text not null,
  video_url text not null,
  mode text not null check (mode in ('steps', 'summary')),
  pdf_path text not null,
  created_at timestamptz not null default now()
);

alter table public.notes enable row level security;

create policy "Users can view own notes" on public.notes
  for select using (auth.uid() = user_id);

-- Private storage bucket for generated PDFs
insert into storage.buckets (id, name, public)
values ('notes-pdfs', 'notes-pdfs', false)
on conflict (id) do nothing;

create policy "Users can read own pdfs"
  on storage.objects for select
  using (
    bucket_id = 'notes-pdfs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Note: inserts/updates to usage, notes, and storage.objects are performed
-- server-side using the service_role key (bypasses RLS), so no insert
-- policies are needed for regular users.
