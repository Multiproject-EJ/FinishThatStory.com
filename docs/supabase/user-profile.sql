-- User profile table for FinishThatStory.com
-- Run inside the Supabase SQL editor or as part of your migration pipeline.

create table if not exists public."UserProfile" (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  avatar text,
  bio text,
  language text default 'en',
  updated_at timestamptz default timezone('utc', now())
);

alter table public."UserProfile" enable row level security;

create policy if not exists "Profiles are readable by everyone"
  on public."UserProfile"
  for select
  using (true);

create policy if not exists "Users can insert their profile"
  on public."UserProfile"
  for insert
  with check (auth.uid() = id);

create policy if not exists "Users can update their profile"
  on public."UserProfile"
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Optional helper to ensure a row exists when a new user signs in.
create or replace function public.ensure_user_profile()
returns trigger as $$
begin
  insert into public."UserProfile" (id, username)
  values (new.id, new.raw_user_meta_data->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.ensure_user_profile();
  end if;
end;
$$;
