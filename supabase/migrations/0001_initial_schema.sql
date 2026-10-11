create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.prompts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  local_id text,
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '',
  body text not null default '',
  category text not null default 'General',
  tags text[] not null default '{}',
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prompts_local_id_unique_per_user unique(owner_id, local_id)
  deferrable initially deferred
);
create index prompts_owner_updated_idx on public.prompts(owner_id, updated_at desc);
create index prompts_owner_category_idx on public.prompts(owner_id, category);
create index prompts_tags_idx on public.prompts using gin(tags);
create unique index prompts_owner_local_id_unique on public.prompts(owner_id, local_id) where local_id is not null;

create table public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  local_id text,
  version_number integer not null check (version_number > 0),
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique(prompt_id, version_number),
  unique(prompt_id, local_id)
);
create unique index prompt_versions_owner_local_id_unique on public.prompt_versions(owner_id, local_id) where local_id is not null;

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  local_id text,
  name text not null check (char_length(name) between 1 and 100),
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, name),
  constraint collections_local_id_unique_per_user unique(owner_id, local_id)
  deferrable initially deferred
);
create unique index collections_owner_local_id_unique on public.collections(owner_id, local_id) where local_id is not null;

create table public.collection_prompts (
  collection_id uuid not null references public.collections(id) on delete cascade,
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(collection_id, prompt_id)
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  type text not null check(type in ('bug', 'feature', 'general')),
  subject text not null check(char_length(subject) between 1 and 160),
  message text not null check(char_length(message) between 10 and 5000),
  contact_email text,
  status text not null default 'new' check(status in ('new', 'reviewing', 'resolved', 'rejected')),
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger prompts_updated_at before update on public.prompts for each row execute function public.set_updated_at();
create trigger collections_updated_at before update on public.collections for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.prompts enable row level security;
alter table public.prompt_versions enable row level security;
alter table public.collections enable row level security;
alter table public.collection_prompts enable row level security;
alter table public.feedback enable row level security;

create policy "Users can read their profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "Users can create their profile" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "Users can update their profile" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "Users manage their prompts" on public.prompts for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "Users manage their versions" on public.prompt_versions for all to authenticated using (owner_id = (select auth.uid()) and exists (select 1 from public.prompts p where p.id = prompt_id and p.owner_id = (select auth.uid()))) with check (owner_id = (select auth.uid()) and exists (select 1 from public.prompts p where p.id = prompt_id and p.owner_id = (select auth.uid())));
create policy "Users manage their collections" on public.collections for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "Users manage their collection links" on public.collection_prompts for all to authenticated using (owner_id = (select auth.uid()) and exists (select 1 from public.collections c where c.id = collection_id and c.owner_id = (select auth.uid())) and exists (select 1 from public.prompts p where p.id = prompt_id and p.owner_id = (select auth.uid()))) with check (owner_id = (select auth.uid()) and exists (select 1 from public.collections c where c.id = collection_id and c.owner_id = (select auth.uid())) and exists (select 1 from public.prompts p where p.id = prompt_id and p.owner_id = (select auth.uid())));
create policy "Anyone can submit feedback" on public.feedback for insert to anon, authenticated with check ((user_id is null or user_id = (select auth.uid())) and status = 'new');
create policy "Users can read their own feedback" on public.feedback for select to authenticated using (user_id = (select auth.uid()));
