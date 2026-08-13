begin;

create table public.atlas_categories (
  slug text primary key check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  short_name text not null,
  description text not null default '',
  topics jsonb not null default '[]'::jsonb check (jsonb_typeof(topics) = 'array'),
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.atlas_content (
  id text primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  content_type text not null check (content_type in ('article','playbook','academia-lesson','update')),
  category_slug text references public.atlas_categories(slug) on update cascade,
  title text not null,
  summary text not null default '',
  topic text not null default '',
  status text not null default 'current' check (status in ('draft','under-review','current','superseded','archived')),
  version text not null default '1.0',
  audience jsonb not null default '["All internal users"]'::jsonb check (jsonb_typeof(audience) = 'array'),
  permissions jsonb not null default '["internal"]'::jsonb check (jsonb_typeof(permissions) = 'array'),
  keywords jsonb not null default '[]'::jsonb check (jsonb_typeof(keywords) = 'array'),
  reading_minutes integer check (reading_minutes is null or reading_minutes >= 0),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  document jsonb not null default '{}'::jsonb check (jsonb_typeof(document) = 'object'),
  is_demo boolean not null default false,
  published_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(topic, '') || ' ' || coalesce(keywords::text, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(document::text, '')), 'D')
  ) stored
);
create index atlas_content_search_idx on public.atlas_content using gin(search_vector);
create index atlas_content_category_idx on public.atlas_content(category_slug);
create index atlas_content_type_status_idx on public.atlas_content(content_type, status);

create table public.atlas_courses (
  id text primary key,
  slug text not null unique,
  title text not null,
  area text not null default '',
  summary text not null default '',
  status text not null default 'current',
  sort_order integer not null default 100,
  audience jsonb not null default '["All internal users"]'::jsonb,
  document jsonb not null default '{}'::jsonb,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.atlas_bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  content_id text not null references public.atlas_content(id) on delete cascade,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, content_id)
);

create table public.atlas_progress (
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  content_id text not null references public.atlas_content(id) on delete cascade,
  progress numeric(5,4) not null default 0 check (progress between 0 and 1),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, content_id)
);

create table public.atlas_acknowledgements (
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  content_id text not null references public.atlas_content(id) on delete cascade,
  version text not null,
  acknowledged_at timestamptz not null default now(),
  primary key (user_id, content_id, version)
);

create table public.atlas_slack_deliveries (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references public.profiles(id),
  content_id text not null references public.atlas_content(id),
  notification_kind text not null check (notification_kind in ('important','required')),
  channel_route text not null,
  slack_ts text,
  status text not null check (status in ('sent','failed')),
  error_code text,
  created_at timestamptz not null default now()
);

alter table public.atlas_categories enable row level security;
alter table public.atlas_content enable row level security;
alter table public.atlas_courses enable row level security;
alter table public.atlas_bookmarks enable row level security;
alter table public.atlas_progress enable row level security;
alter table public.atlas_acknowledgements enable row level security;
alter table public.atlas_slack_deliveries enable row level security;

revoke all on public.atlas_categories, public.atlas_content, public.atlas_courses, public.atlas_bookmarks, public.atlas_progress, public.atlas_acknowledgements, public.atlas_slack_deliveries from anon, public;
grant select on public.atlas_categories, public.atlas_content, public.atlas_courses to authenticated;
grant select, insert, delete on public.atlas_bookmarks to authenticated;
grant select, insert, update on public.atlas_progress to authenticated;
grant select, insert, update on public.atlas_acknowledgements to authenticated;
grant select on public.atlas_slack_deliveries to authenticated;

create policy atlas_categories_read_internal on public.atlas_categories for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_active)
);
create policy atlas_content_read_internal on public.atlas_content for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_active)
);
create policy atlas_courses_read_internal on public.atlas_courses for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_active)
);
create policy atlas_bookmarks_own on public.atlas_bookmarks for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy atlas_progress_own on public.atlas_progress for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy atlas_acknowledgements_own on public.atlas_acknowledgements for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy atlas_slack_deliveries_read_own_or_founder on public.atlas_slack_deliveries for select to authenticated using (
  requested_by = (select auth.uid()) or exists (
    select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_active and p.role = 'founder'
  )
);

create or replace function public.atlas_search(search_query text, result_limit integer default 20)
returns table (
  id text, slug text, content_type text, category_slug text, title text, summary text,
  topic text, status text, version text, audience jsonb, permissions jsonb, keywords jsonb,
  reading_minutes integer, metadata jsonb, document jsonb, is_demo boolean, rank real
)
language sql stable security invoker set search_path = '' as $$
  select c.id, c.slug, c.content_type, c.category_slug, c.title, c.summary, c.topic,
    c.status, c.version, c.audience, c.permissions, c.keywords, c.reading_minutes,
    c.metadata, c.document, c.is_demo,
    ts_rank_cd(c.search_vector, websearch_to_tsquery('english', search_query)) as rank
  from public.atlas_content c
  where nullif(btrim(search_query), '') is not null
    and c.search_vector @@ websearch_to_tsquery('english', search_query)
  order by rank desc, c.title asc
  limit least(greatest(coalesce(result_limit, 20), 1), 100)
$$;
revoke all on function public.atlas_search(text, integer) from public, anon;
grant execute on function public.atlas_search(text, integer) to authenticated;

commit;
