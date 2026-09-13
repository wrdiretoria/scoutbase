-- Migração: conexões, feed social, mensagens diretas, vagas (marketplace) e entitlements.
-- Execute no Supabase Dashboard → SQL Editor.
-- Cria apenas tabelas novas — não altera, renomeia ou remove nenhuma tabela existente
-- (profiles, alunos, avaliacoes, turmas, presencas, eventos, highlights, observacoes,
--  pagamentos, visitas, uso_trial, rate_limits, aceite_termos).
--
-- Convenção deste projeto: `user_id`/`author_id`/`requester_id`/etc. guardam o mesmo uuid
-- de auth.users (== profiles.id), então as policies comparam essas colunas direto com auth.uid().

-- ─────────────────────────────────────────────────────────────────────────────
-- connections
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists connections (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null,
  addressee_id  uuid not null,
  status        text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at    timestamptz not null default now(),
  responded_at  timestamptz,
  unique (requester_id, addressee_id)
);

create index if not exists connections_requester_id_idx on connections (requester_id);
create index if not exists connections_addressee_id_idx on connections (addressee_id);

alter table connections enable row level security;

create policy "connections visible to either party"
  on connections for select
  using (requester_id = auth.uid() or addressee_id = auth.uid());

create policy "connections writable by requester"
  on connections for insert
  with check (requester_id = auth.uid());

create policy "connections updatable by requester"
  on connections for update
  using (requester_id = auth.uid());

create policy "connections deletable by requester"
  on connections for delete
  using (requester_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- follows
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists follows (
  id          uuid primary key default gen_random_uuid(),
  follower_id uuid not null,
  followee_id uuid not null,
  created_at  timestamptz not null default now(),
  unique (follower_id, followee_id)
);

create index if not exists follows_follower_id_idx on follows (follower_id);
create index if not exists follows_followee_id_idx on follows (followee_id);

alter table follows enable row level security;

create policy "follows visible to either party"
  on follows for select
  using (follower_id = auth.uid() or followee_id = auth.uid());

create policy "follows writable by follower"
  on follows for insert
  with check (follower_id = auth.uid());

create policy "follows deletable by follower"
  on follows for delete
  using (follower_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- recommendations
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists recommendations (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null,
  subject_id    uuid not null,
  role_label    text,
  body          text not null,
  created_at    timestamptz not null default now(),
  helpful_count int not null default 0
);

create index if not exists recommendations_subject_id_idx on recommendations (subject_id);
create index if not exists recommendations_author_id_idx on recommendations (author_id);

alter table recommendations enable row level security;

create policy "recommendations public read"
  on recommendations for select
  using (true);

create policy "recommendations insert by authenticated non-self author"
  on recommendations for insert
  with check (
    auth.uid() is not null
    and auth.uid() = author_id
    and subject_id <> author_id
  );

-- recommendation_reactions: not called out in the RLS spec — mirrors feed_reactions
-- (public read, write restricted to the reacting user) so the table isn't locked
-- with RLS enabled and zero usable policies.
create table if not exists recommendation_reactions (
  id                uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references recommendations(id),
  user_id           uuid not null,
  created_at        timestamptz not null default now(),
  unique (recommendation_id, user_id)
);

create index if not exists recommendation_reactions_recommendation_id_idx on recommendation_reactions (recommendation_id);

alter table recommendation_reactions enable row level security;

create policy "recommendation_reactions public read"
  on recommendation_reactions for select
  using (true);

create policy "recommendation_reactions writable by reacting user"
  on recommendation_reactions for insert
  with check (user_id = auth.uid());

create policy "recommendation_reactions deletable by reacting user"
  on recommendation_reactions for delete
  using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- feed_posts / feed_reactions / feed_comments
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists feed_posts (
  id             uuid primary key default gen_random_uuid(),
  author_id      uuid not null,
  author_type    text not null check (author_type in ('atleta','treinador','scout','clube')),
  type           text not null check (type in ('update','achievement','opportunity','recommendation_share')),
  body           text not null,
  media_url      text,
  opportunity_id uuid,
  created_at     timestamptz not null default now()
);

create index if not exists feed_posts_author_id_idx on feed_posts (author_id);

alter table feed_posts enable row level security;

create policy "feed_posts public read"
  on feed_posts for select
  using (true);

create policy "feed_posts writable by author"
  on feed_posts for insert
  with check (author_id = auth.uid());

create policy "feed_posts updatable by author"
  on feed_posts for update
  using (author_id = auth.uid());

create policy "feed_posts deletable by author"
  on feed_posts for delete
  using (author_id = auth.uid());

create table if not exists feed_reactions (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references feed_posts(id),
  user_id    uuid not null,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists feed_reactions_post_id_idx on feed_reactions (post_id);

alter table feed_reactions enable row level security;

create policy "feed_reactions public read"
  on feed_reactions for select
  using (true);

create policy "feed_reactions writable by author"
  on feed_reactions for insert
  with check (user_id = auth.uid());

create policy "feed_reactions deletable by author"
  on feed_reactions for delete
  using (user_id = auth.uid());

create table if not exists feed_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references feed_posts(id),
  user_id    uuid not null,
  body       text not null,
  created_at timestamptz not null default now()
);

create index if not exists feed_comments_post_id_idx on feed_comments (post_id);

alter table feed_comments enable row level security;

create policy "feed_comments public read"
  on feed_comments for select
  using (true);

create policy "feed_comments writable by author"
  on feed_comments for insert
  with check (user_id = auth.uid());

create policy "feed_comments updatable by author"
  on feed_comments for update
  using (user_id = auth.uid());

create policy "feed_comments deletable by author"
  on feed_comments for delete
  using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- conversations / conversation_participants / messages
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists conversations (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table conversations enable row level security;

create table if not exists conversation_participants (
  conversation_id uuid not null references conversations(id),
  user_id         uuid not null,
  primary key (conversation_id, user_id)
);

create index if not exists conversation_participants_user_id_idx on conversation_participants (user_id);

alter table conversation_participants enable row level security;

-- conversation_participants: not explicitly in the RLS spec, but conversations/messages
-- visibility depends on it, so it needs its own membership-based policies.
create policy "conversation_participants visible to fellow participants"
  on conversation_participants for select
  using (
    user_id = auth.uid()
    or conversation_id in (
      select cp.conversation_id from conversation_participants cp where cp.user_id = auth.uid()
    )
  );

create policy "conversation_participants insertable by existing participants"
  on conversation_participants for insert
  with check (
    user_id = auth.uid()
    or conversation_id in (
      select cp.conversation_id from conversation_participants cp where cp.user_id = auth.uid()
    )
  );

create policy "conversations visible to participants"
  on conversations for select
  using (
    id in (
      select cp.conversation_id from conversation_participants cp where cp.user_id = auth.uid()
    )
  );

create policy "conversations insertable by authenticated users"
  on conversations for insert
  with check (auth.uid() is not null);

create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id),
  sender_id       uuid not null,
  body            text not null,
  created_at      timestamptz not null default now(),
  read_at         timestamptz
);

create index if not exists messages_conversation_id_idx on messages (conversation_id);

alter table messages enable row level security;

create policy "messages visible to participants"
  on messages for select
  using (
    conversation_id in (
      select cp.conversation_id from conversation_participants cp where cp.user_id = auth.uid()
    )
  );

create policy "messages insertable by participants"
  on messages for insert
  with check (
    sender_id = auth.uid()
    and conversation_id in (
      select cp.conversation_id from conversation_participants cp where cp.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- opportunities / opportunity_applications
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists opportunities (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null,
  title       text not null,
  position    text,
  category    text,
  city        text,
  description text,
  status      text not null default 'open' check (status in ('open','closed')),
  created_at  timestamptz not null default now()
);

create index if not exists opportunities_club_id_idx on opportunities (club_id);

alter table opportunities enable row level security;

create policy "opportunities public read"
  on opportunities for select
  using (true);

create policy "opportunities insertable by club owner"
  on opportunities for insert
  with check (club_id = auth.uid());

create policy "opportunities updatable by club owner"
  on opportunities for update
  using (club_id = auth.uid());

create table if not exists opportunity_applications (
  id             uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities(id),
  athlete_id     uuid not null,
  status         text not null default 'submitted' check (status in ('submitted','viewed','accepted','rejected')),
  created_at     timestamptz not null default now(),
  unique (opportunity_id, athlete_id)
);

create index if not exists opportunity_applications_opportunity_id_idx on opportunity_applications (opportunity_id);
create index if not exists opportunity_applications_athlete_id_idx on opportunity_applications (athlete_id);

alter table opportunity_applications enable row level security;

create policy "opportunity_applications visible to athlete or club owner"
  on opportunity_applications for select
  using (
    athlete_id = auth.uid()
    or exists (
      select 1 from opportunities o
      where o.id = opportunity_applications.opportunity_id
        and o.club_id = auth.uid()
    )
  );

create policy "opportunity_applications insertable by applying athlete"
  on opportunity_applications for insert
  with check (athlete_id = auth.uid());

create policy "opportunity_applications updatable by athlete or club owner"
  on opportunity_applications for update
  using (
    athlete_id = auth.uid()
    or exists (
      select 1 from opportunities o
      where o.id = opportunity_applications.opportunity_id
        and o.club_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- profile_views
-- ─────────────────────────────────────────────────────────────────────────────
-- Not explicitly in the RLS spec. Modeled as a "who viewed my profile" log:
-- only the viewed subject can read their own views; anyone can log a view,
-- but only as themselves (or anonymously, viewer_id null).
create table if not exists profile_views (
  id         uuid primary key default gen_random_uuid(),
  viewer_id  uuid,
  subject_id uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists profile_views_subject_id_idx on profile_views (subject_id);

alter table profile_views enable row level security;

create policy "profile_views visible to subject"
  on profile_views for select
  using (subject_id = auth.uid());

create policy "profile_views insertable as self or anonymous"
  on profile_views for insert
  with check (viewer_id = auth.uid() or viewer_id is null);

-- ─────────────────────────────────────────────────────────────────────────────
-- entitlements
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists entitlements (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null,
  plan         text not null default 'free' check (plan in ('free','pro')),
  entity_type  text not null check (entity_type in ('atleta','treinador','scout','clube')),
  active_until timestamptz,
  source       text not null default 'manual' check (source in ('asaas','manual')),
  created_at   timestamptz not null default now()
);

create index if not exists entitlements_user_id_idx on entitlements (user_id);

alter table entitlements enable row level security;

create policy "entitlements visible to owner"
  on entitlements for select
  using (user_id = auth.uid());

-- No insert/update/delete policy: entitlements are only ever written by the
-- service role (billing webhook / admin action), which bypasses RLS entirely.

-- ─────────────────────────────────────────────────────────────────────────────
-- Verificação: confirmar que as tabelas foram criadas
-- ─────────────────────────────────────────────────────────────────────────────
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'connections','follows','recommendations','recommendation_reactions',
    'feed_posts','feed_reactions','feed_comments',
    'conversations','conversation_participants','messages',
    'opportunities','opportunity_applications','profile_views','entitlements'
  )
order by table_name;
