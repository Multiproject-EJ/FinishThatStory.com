-- Core storytelling data model for FinishThatStory.com
-- Run inside the Supabase SQL editor or as part of your migration pipeline.

-- Reusable trigger to keep updated_at columns in sync
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create table if not exists public."Story" (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  slug text unique,
  summary text,
  cover_image text,
  language text default 'en',
  tags text[] default '{}'::text[],
  is_published boolean default false,
  published_at timestamptz,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create index if not exists story_author_idx on public."Story" (author_id);
create index if not exists story_language_idx on public."Story" (language);

create trigger story_touch_updated_at
  before update on public."Story"
  for each row execute procedure public.touch_updated_at();

alter table public."Story" enable row level security;

create policy if not exists "Published stories are readable"
  on public."Story"
  for select
  using (
    is_published
    or author_id = auth.uid()
  );

create policy if not exists "Authenticated users can create stories"
  on public."Story"
  for insert
  with check (auth.role() = 'authenticated' and author_id = auth.uid());

create policy if not exists "Story owners can update"
  on public."Story"
  for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy if not exists "Story owners can delete"
  on public."Story"
  for delete
  using (author_id = auth.uid());

create table if not exists public."Chapter" (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public."Story" (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  title text,
  summary text,
  content text not null,
  position integer not null,
  is_published boolean default true,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  constraint chapter_position_unique unique (story_id, position)
);

create index if not exists chapter_story_idx on public."Chapter" (story_id);
create index if not exists chapter_author_idx on public."Chapter" (author_id);

create trigger chapter_touch_updated_at
  before update on public."Chapter"
  for each row execute procedure public.touch_updated_at();

alter table public."Chapter" enable row level security;

create policy if not exists "Published chapters are readable"
  on public."Chapter"
  for select
  using (
    is_published
    or author_id = auth.uid()
    or exists (
      select 1
      from public."Story" s
      where s.id = story_id and s.author_id = auth.uid()
    )
  );

create policy if not exists "Story owners can manage chapters"
  on public."Chapter"
  for all
  using (
    exists (
      select 1
      from public."Story" s
      where s.id = story_id and s.author_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public."Story" s
      where s.id = story_id and s.author_id = auth.uid()
    )
  );

create table if not exists public."Comment" (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public."Story" (id) on delete cascade,
  chapter_id uuid references public."Chapter" (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  parent_comment_id uuid references public."Comment" (id) on delete cascade,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create index if not exists comment_story_idx on public."Comment" (story_id, created_at);
create index if not exists comment_chapter_idx on public."Comment" (chapter_id);
create index if not exists comment_parent_idx on public."Comment" (parent_comment_id);

create trigger comment_touch_updated_at
  before update on public."Comment"
  for each row execute procedure public.touch_updated_at();

alter table public."Comment" enable row level security;

create policy if not exists "Published comments are readable"
  on public."Comment"
  for select
  using (
    exists (
      select 1
      from public."Story" s
      where s.id = story_id
        and (s.is_published or s.author_id = auth.uid())
    )
    or author_id = auth.uid()
  );

create policy if not exists "Authenticated users can comment"
  on public."Comment"
  for insert
  with check (auth.role() = 'authenticated' and author_id = auth.uid());

create policy if not exists "Comment authors can update"
  on public."Comment"
  for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy if not exists "Comment authors can delete"
  on public."Comment"
  for delete
  using (author_id = auth.uid());

create table if not exists public."StoryLike" (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references public."Story" (id) on delete cascade,
  chapter_id uuid references public."Chapter" (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz default timezone('utc', now()),
  constraint story_or_chapter_like check (
    (story_id is not null)::int + (chapter_id is not null)::int = 1
  )
);

create unique index if not exists story_like_unique_story
  on public."StoryLike" (user_id, story_id)
  where story_id is not null;

create unique index if not exists story_like_unique_chapter
  on public."StoryLike" (user_id, chapter_id)
  where chapter_id is not null;

alter table public."StoryLike" enable row level security;

create policy if not exists "Likes are readable when parent content is readable"
  on public."StoryLike"
  for select
  using (
    exists (
      select 1
      from public."Story" s
      where s.id = coalesce(story_id, (
        select c.story_id from public."Chapter" c where c.id = chapter_id
      ))
        and (s.is_published or s.author_id = auth.uid())
    )
    or user_id = auth.uid()
  );

create policy if not exists "Users can manage their likes"
  on public."StoryLike"
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create table if not exists public."UserFollow" (
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz default timezone('utc', now()),
  primary key (follower_id, following_id),
  constraint follower_not_self check (follower_id <> following_id)
);

alter table public."UserFollow" enable row level security;

create policy if not exists "Followers are readable"
  on public."UserFollow"
  for select
  using (true);

create policy if not exists "Users manage their follow graph"
  on public."UserFollow"
  for all
  using (follower_id = auth.uid())
  with check (follower_id = auth.uid());

create type if not exists contribution_status as enum ('pending', 'accepted', 'rejected');

create table if not exists public."StoryContribution" (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public."Story" (id) on delete cascade,
  contributor_id uuid not null references auth.users (id) on delete cascade,
  chapter_id uuid references public."Chapter" (id) on delete set null,
  status contribution_status default 'pending',
  prompt text,
  content text,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  responded_at timestamptz
);

create index if not exists story_contribution_story_idx on public."StoryContribution" (story_id);
create index if not exists story_contribution_status_idx on public."StoryContribution" (status);

create trigger story_contribution_touch_updated_at
  before update on public."StoryContribution"
  for each row execute procedure public.touch_updated_at();

alter table public."StoryContribution" enable row level security;

create policy if not exists "Story owners manage contributions"
  on public."StoryContribution"
  for all
  using (
    exists (
      select 1
      from public."Story" s
      where s.id = story_id and s.author_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public."Story" s
      where s.id = story_id and s.author_id = auth.uid()
    )
  );

create policy if not exists "Contributors can read their submissions"
  on public."StoryContribution"
  for select
  using (
    contributor_id = auth.uid()
    or exists (
      select 1
      from public."Story" s
      where s.id = story_id and s.is_published
    )
  );

create policy if not exists "Contributors can submit"
  on public."StoryContribution"
  for insert
  with check (auth.role() = 'authenticated' and contributor_id = auth.uid());

-- Seed data for local testing. Adjust UUIDs to match your auth.users table when running manually.
insert into public."Story" (id, author_id, title, slug, summary, is_published, published_at)
values
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'The Clockwork Orchard', 'the-clockwork-orchard', 'A steampunk village tends to a mechanical forest that suddenly stops ticking.', true, timezone('utc', now()) - interval '7 days'),
  ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Echoes Beyond the Nebula', 'echoes-beyond-the-nebula', 'An exploration crew discovers that the alien signals they follow are future versions of themselves.', true, timezone('utc', now()) - interval '2 days')
on conflict (id) do nothing;

insert into public."Chapter" (id, story_id, author_id, title, content, position)
values
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'The Orchard Sleeps', 'Gears the size of oak trees shuddered into silence as dawn broke...', 1),
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Nebular Whispers', 'Captain Ibarra stared at the sensor logs, realizing the signal pattern matched their own heartbeat...', 1)
on conflict (id) do nothing;

insert into public."Comment" (id, story_id, chapter_id, author_id, body)
values
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'This twist made my gears turn!')
on conflict (id) do nothing;

insert into public."StoryLike" (id, story_id, user_id)
values
  ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
on conflict (id) do nothing;

insert into public."UserFollow" (follower_id, following_id)
values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111')
on conflict do nothing;

insert into public."StoryContribution" (id, story_id, contributor_id, status, prompt, content)
values
  ('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'pending', 'Offer a new caretaker for the orchard.', 'What if a wandering mechanic becomes the orchard''s new heart?')
on conflict (id) do nothing;
