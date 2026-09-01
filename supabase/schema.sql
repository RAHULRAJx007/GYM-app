-- Gym Management Schema - Run this in Supabase SQL Editor per client project
-- Supports Admin + Staff roles with approval workflow

create extension if not exists "pgcrypto";

-- Gym settings (single row)
create table if not exists gym_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My Gym',
  address text,
  phone text,
  email text,
  logo_url text,
  currency text default 'INR',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
insert into gym_settings (name) values ('My Gym') on conflict do nothing;

-- Profiles: role for each auth user (admin / staff)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin','staff')),
  display_name text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Membership plans (with category for gym vs PT)
create table if not exists membership_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price decimal(10,2) not null,
  duration_days integer not null,
  category text not null default 'membership' check (category in ('membership','personal_training')),
  features text[] default '{}',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- add category column if migrating from old schema
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='membership_plans' and column_name='category') then
    alter table membership_plans add column category text not null default 'membership' check (category in ('membership','personal_training'));
  end if;
end $$;

-- Members
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  date_of_birth date,
  gender text check (gender in ('male','female','other')),
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  medical_notes text,
  profile_photo_url text,
  status text default 'active' check (status in ('active','inactive','frozen','cancelled')),
  created_by uuid references profiles(id),
  joined_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_members_phone on members(phone);
create index if not exists idx_members_status on members(status);
create index if not exists idx_members_created on members(created_at);

-- Member memberships (plan assignment) with approval workflow
create table if not exists member_memberships (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade not null,
  plan_id uuid references membership_plans(id) on delete set null,
  start_date date not null,
  end_date date not null,
  status text default 'pending' check (status in ('pending','active','expired','cancelled','paused','rejected')),
  price_paid decimal(10,2),
  notes text,
  created_by uuid references profiles(id),
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_mm_member on member_memberships(member_id);
create index if not exists idx_mm_dates on member_memberships(start_date, end_date);
create index if not exists idx_mm_status on member_memberships(status);

-- Payments with approval workflow
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade not null,
  membership_id uuid references member_memberships(id) on delete set null,
  amount decimal(10,2) not null,
  payment_method text not null check (payment_method in ('cash','card','upi','bank_transfer','other')),
  payment_date date not null default current_date,
  period_start date,
  period_end date,
  status text default 'pending' check (status in ('pending','completed','failed','refunded','rejected')),
  receipt_number text unique default 'REC-' || substr(gen_random_uuid()::text,1,8),
  notes text,
  created_by uuid references profiles(id),
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_payments_member on payments(member_id);
create index if not exists idx_payments_date on payments(payment_date);
create index if not exists idx_payments_status on payments(status);

-- Updated at trigger
create or replace function update_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists trg_gym_settings_updated on gym_settings;
create trigger trg_gym_settings_updated before update on gym_settings for each row execute function update_updated_at();
drop trigger if exists trg_plans_updated on membership_plans;
create trigger trg_plans_updated before update on membership_plans for each row execute function update_updated_at();
drop trigger if exists trg_members_updated on members;
create trigger trg_members_updated before update on members for each row execute function update_updated_at();
drop trigger if exists trg_mm_updated on member_memberships;
create trigger trg_mm_updated before update on member_memberships for each row execute function update_updated_at();

-- Auto-create profile on signup
create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'role','staff'))
  on conflict (id) do nothing;
  return new;
end; $$ language plpgsql security definer;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Helper: get my role
create or replace function my_role() returns text as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer;

-- RLS
alter table gym_settings enable row level security;
alter table profiles enable row level security;
alter table membership_plans enable row level security;
alter table members enable row level security;
alter table member_memberships enable row level security;
alter table payments enable row level security;

drop policy if exists "allow all for authenticated" on gym_settings;
drop policy if exists "allow all for authenticated" on membership_plans;
drop policy if exists "allow all for authenticated" on members;
drop policy if exists "allow all for authenticated" on member_memberships;
drop policy if exists "allow all for authenticated" on payments;

-- Profiles: users can read all, update own, admin can update all
create policy "profiles read" on profiles for select to authenticated using (true);
create policy "profiles insert" on profiles for insert to authenticated with check (true);
create policy "profiles update own or admin" on profiles for update to authenticated using (auth.uid() = id or my_role() = 'admin');

-- Gym settings: all authenticated read, admin write
create policy "gym read" on gym_settings for select to authenticated using (true);
create policy "gym write admin" on gym_settings for all to authenticated using (my_role() = 'admin') with check (my_role() = 'admin');

-- Plans: all read, admin write
create policy "plans read" on membership_plans for select to authenticated using (true);
create policy "plans write admin" on membership_plans for all to authenticated using (my_role() = 'admin') with check (my_role() = 'admin');

-- Members: staff + admin can read/insert, admin can delete
create policy "members read" on members for select to authenticated using (true);
create policy "members insert" on members for insert to authenticated with check (true);
create policy "members update" on members for update to authenticated using (true);
create policy "members delete admin" on members for delete to authenticated using (my_role() = 'admin');

-- Memberships: staff can create pending, admin can approve; all can read
create policy "mm read" on member_memberships for select to authenticated using (true);
create policy "mm insert" on member_memberships for insert to authenticated with check (true);
create policy "mm update" on member_memberships for update to authenticated using (true);

-- Payments: same
create policy "payments read" on payments for select to authenticated using (true);
create policy "payments insert" on payments for insert to authenticated with check (true);
create policy "payments update" on payments for update to authenticated using (true);

-- Seed plans if empty (membership + PT)
insert into membership_plans (name, description, price, duration_days, category) 
select 'Monthly', 'Unlimited gym access for 1 month', 1500, 30, 'membership' where not exists (select 1 from membership_plans where name='Monthly' and category='membership');
insert into membership_plans (name, description, price, duration_days, category) 
select 'Quarterly', '3 months - save 10%', 4000, 90, 'membership' where not exists (select 1 from membership_plans where name='Quarterly' and category='membership');
insert into membership_plans (name, description, price, duration_days, category) 
select 'Yearly', '12 months - best value', 14000, 365, 'membership' where not exists (select 1 from membership_plans where name='Yearly' and category='membership');
insert into membership_plans (name, description, price, duration_days, category) 
select 'PT - 12 Sessions', 'Personal trainer 12 sessions / month', 5000, 30, 'personal_training' where not exists (select 1 from membership_plans where name='PT - 12 Sessions');
insert into membership_plans (name, description, price, duration_days, category) 
select 'PT - 8 Sessions', 'Personal trainer 8 sessions / month', 3500, 30, 'personal_training' where not exists (select 1 from membership_plans where name='PT - 8 Sessions');
insert into membership_plans (name, description, price, duration_days, category) 
select 'PT - Single Session', 'Personal trainer single session', 500, 7, 'personal_training' where not exists (select 1 from membership_plans where name='PT - Single Session');

-- Ensure existing admin user has profile with admin role (run after creating admin user)
-- Replace with actual admin email if needed, or run manually:
-- insert into profiles (id, email, role) select id, email, 'admin' from auth.users where email='admin@gym.local' on conflict (id) do update set role='admin';
