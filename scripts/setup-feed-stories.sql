-- Stories are visible only to authenticated community members for 24 hours.
create table public.feed_stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  media_type text not null check (media_type in ('image','video')),
  caption text not null default '' check (char_length(caption) <= 240),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  constraint story_lifetime check (expires_at > created_at and expires_at <= created_at + interval '24 hours')
);
create index feed_stories_expiry on public.feed_stories(expires_at);
create index feed_stories_author_created on public.feed_stories(author_id,created_at desc);
alter table public.feed_stories enable row level security;
grant select on public.feed_stories to authenticated;
revoke all on public.feed_stories from anon;
revoke insert,update,delete,truncate,references,trigger on public.feed_stories from authenticated;
grant all on public.feed_stories to service_role;
create policy stories_read_active on public.feed_stories for select to authenticated using (expires_at > now());
-- Writes go through server routes, which derive ownership from auth.getUser().
create table public.feed_story_views (
  story_id uuid not null references public.feed_stories(id) on delete cascade,
  viewer_id uuid not null references auth.users(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (story_id,viewer_id)
);
create index feed_story_views_viewer on public.feed_story_views(viewer_id,story_id);
alter table public.feed_story_views enable row level security;
grant select on public.feed_story_views to authenticated;
revoke all on public.feed_story_views from anon;
revoke insert,update,delete,truncate,references,trigger on public.feed_story_views from authenticated;
grant all on public.feed_story_views to service_role;
create policy story_views_read_own on public.feed_story_views for select to authenticated using (viewer_id = (select auth.uid()));
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('feed-stories','feed-stories',false,8388608,array['image/jpeg','image/png','image/webp','video/mp4','video/webm']);
-- No client storage policies: only validated server routes upload and sign media.
