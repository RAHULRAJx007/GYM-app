-- Gym Management Schema - Run this in Supabase SQL Editor per client project
-- Single gym per project (client's own Supabase free tier)

-- Enable UUID
create extension if not exists "pgcrypto";

-- Gym settings (single row)
create table gym_settings (
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
insert into gym_settings (name) values ('My Gym');

-- Membership plans
create table membership_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price decimal(10,2) not null,
  duration_days integer not null,
  features text[] default '{}',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Members
create table members (
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
  joined_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_members_phone on members(phone);
create index idx_members_status on members(status);
create index idx_members_created on members(created_at);

-- Member memberships (plan assignment)
create table member_memberships (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade not null,
  plan_id uuid references membership_plans(id) on delete set null,
  start_date date not null,
  end_date date not null,
  status text default 'active' check (status in ('active','expired','cancelled','paused')),
  price_paid decimal(10,2),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_mm_member on member_memberships(member_id);
create index idx_mm_dates on member_memberships(start_date, end_date);
create index idx_mm_status on member_memberships(status);

-- Payments (manual cash/card)
create table payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade not null,
  membership_id uuid references member_memberships(id) on delete set null,
  amount decimal(10,2) not null,
  payment_method text not null check (payment_method in ('cash','card','upi','bank_transfer','other')),
  payment_date date not null default current_date,
  period_start date,
  period_end date,
  status text default 'completed' check (status in ('completed','pending','failed','refunded')),
  receipt_number text unique default 'REC-' || substr(gen_random_uuid()::text,1,8),
  notes text,
  created_at timestamptz default now()
);
create index idx_payments_member on payments(member_id);
create index idx_payments_date on payments(payment_date);

-- Attendances
create table attendances (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade not null,
  check_in_at timestamptz not null default now(),
  check_out_at timestamptz,
  method text default 'manual'
);
create index idx_att_member_date on attendances(member_id, check_in_at);

-- Updated at trigger
create or replace function update_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
create trigger trg_gym_settings_updated before update on gym_settings for each row execute function update_updated_at();
create trigger trg_plans_updated before update on membership_plans for each row execute function update_updated_at();
create trigger trg_members_updated before update on members for each row execute function update_updated_at();
create trigger trg_mm_updated before update on member_memberships for each row execute function update_updated_at();

-- RLS: enable but allow all for authenticated users (single owner per gym)
alter table gym_settings enable row level security;
alter table membership_plans enable row level security;
alter table members enable row level security;
alter table member_memberships enable row level security;
alter table payments enable row level security;
alter table attendances enable row level security;

create policy "allow all for authenticated" on gym_settings for all to authenticated using (true) with check (true);
create policy "allow all for authenticated" on membership_plans for all to authenticated using (true) with check (true);
create policy "allow all for authenticated" on members for all to authenticated using (true) with check (true);
create policy "allow all for authenticated" on member_memberships for all to authenticated using (true) with check (true);
create policy "allow all for authenticated" on payments for all to authenticated using (true) with check (true);
create policy "allow all for authenticated" on attendances for all to authenticated using (true) with check (true);

-- Seed example plans
insert into membership_plans (name, description, price, duration_days) values
('Monthly', 'Unlimited gym access for 1 month', 1500, 30),
('Quarterly', '3 months - save 10%', 4000, 90),
('Yearly', '12 months - best value', 14000, 365);
