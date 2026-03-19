-- Phase 4: Validations table for storing validation history
create table if not exists public.validations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  input_data jsonb not null,
  results jsonb not null,
  overall_status text not null check (overall_status in ('clean', 'issues_found')),
  errors_found integer not null default 0,
  warnings_found integer not null default 0,
  created_at timestamptz default now() not null
);

alter table public.validations enable row level security;

create policy "Users can view own validations"
  on public.validations for select
  using (auth.uid() = user_id);

create policy "Users can insert own validations"
  on public.validations for insert
  with check (auth.uid() = user_id);

-- Phase 5 (pre-created): User profiles for trial tracking
create table if not exists public.user_profiles (
  id uuid references auth.users(id) primary key,
  trial_start timestamptz default now() not null,
  plan text default 'trial' check (plan in ('trial', 'founding_partner', 'starter', 'professional', 'business', 'enterprise')),
  created_at timestamptz default now() not null
);

alter table public.user_profiles enable row level security;

create policy "Users can view own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup via trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, trial_start)
  values (new.id, now());
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
