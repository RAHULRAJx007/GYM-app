# Gym Management SaaS - Specification

## Overview
Multi-tenant gym management platform sold to individual gym owners. Each gym gets isolated data via separate Supabase project. Built with Next.js 14 (App Router), Tailwind CSS, shadcn/ui, deployed on Vercel.

## Tech Stack
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- Backend: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- Deployment: Vercel (frontend), Supabase (database per tenant)
- Email: Resend or SendGrid (for notifications)
- Charts: Recharts or Tremor for dashboard analytics

## Multi-Tenancy Strategy: Separate Database per Gym
Each gym owner gets their own Supabase project created during onboarding. The main SaaS admin manages tenant provisioning.

### Provisioning Flow
1. SaaS admin creates new tenant via admin panel
2. Script creates new Supabase project via Management API
3. Runs migration to set up schema
4. Creates gym owner auth user
5. Sends credentials to gym owner

## Database Schema (per tenant)

-- Gym settings
CREATE TABLE gym_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Membership plans
CREATE TABLE membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_days INTEGER NOT NULL,
  features TEXT[],
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Members
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  medical_notes TEXT,
  profile_photo_url TEXT,
  status TEXT DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Member memberships
CREATE TABLE member_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES membership_plans(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active',
  auto_renew BOOLEAN DEFAULT false,
  price_paid DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Payment records
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  membership_id UUID REFERENCES member_memberships(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_date DATE NOT NULL,
  period_start DATE,
  period_end DATE,
  status TEXT DEFAULT 'completed',
  received_by TEXT,
  notes TEXT,
  receipt_number TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Attendance / Check-ins
CREATE TABLE attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  check_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out_at TIMESTAMPTZ,
  method TEXT DEFAULT 'manual',
  notes TEXT
);

-- Notifications log
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  channel TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_phone ON members(phone);
CREATE INDEX idx_member_memberships_member ON member_memberships(member_id);
CREATE INDEX idx_member_memberships_dates ON member_memberships(start_date, end_date);
CREATE INDEX idx_payments_member ON payments(member_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_attendances_member_date ON attendances(member_id, check_in_at);

## Core Features

### 1. Authentication
- Supabase Auth per tenant (email/password)
- Single owner role per gym
- Magic link or password login
- Session management with SSR

### 2. Member Management
- CRUD: Create, read, update, delete members
- Profile photo upload (Supabase Storage)
- Search/filter by name, email, phone, status
- Member detail view with membership history, payments, attendance

### 3. Membership Plans
- Create/edit/delete plans
- Set price, duration, features
- Activate/deactivate plans
- Assign plan to member

### 4. Payment Tracking (Manual)
- Record payment for member
- Link to specific membership period
- Multiple payment methods
- Generate receipt numbers
- Payment history per member
- Overdue detection

### 5. Dashboard / Analytics
- Key Metrics: Active members, new this month, expiring soon, revenue MTD/YTD
- Charts: Revenue trend, Member growth, Plan distribution, Attendance heatmap, Payment method breakdown
- Alerts: Members expiring in 7 days, overdue payments

### 6. Notifications (Email)
- Automated: Membership expiring (7 days, 1 day), payment overdue
- Manual: Send custom email to member(s)
- Template system with variables
- Log all notifications

### 7. Attendance (Optional but Recommended)
- Quick check-in (search member, click check-in)
- QR code generation for members
- Attendance reports

## UI Structure (App Router)

/ (landing/marketing)
/admin (SaaS admin - tenant management)
/login
/[gym-slug] (tenant-specific routes)
  /dashboard
  /members
  /members/[id]
  /members/new
  /plans
  /plans/new
  /payments
  /payments/new
  /attendance
  /reports
  /settings
  /notifications

## Deployment Architecture

Vercel (Next.js) --> Supabase (per tenant)
                          |- Database
                          |- Auth
                          |- Storage
                          |- Edge Functions
                          |
                          v
                       Resend (Email)

## Development Phases (10 weeks)

### Phase 1: Foundation (Week 1-2)
- Next.js + Supabase setup with TypeScript
- shadcn/ui component library setup
- Auth flow (login, logout, protected routes)
- Database schema + migrations
- Tenant provisioning script (Supabase Management API)

### Phase 2: Core Features (Week 3-5)
- Member management (CRUD, search, detail view)
- Membership plans CRUD
- Member membership assignment
- Payment recording + history

### Phase 3: Dashboard & Analytics (Week 6-7)
- Dashboard with key metrics
- Revenue/member charts
- Expiring/overdue alerts

### Phase 4: Notifications & Polish (Week 8)
- Email notifications (Resend)
- Notification templates
- Settings page (gym info, branding)
- Attendance/check-in (basic)

### Phase 5: SaaS Admin & Launch Prep (Week 9-10)
- Admin panel for tenant management
- Automated provisioning
- Documentation
- Testing & bug fixes
- Deploy to production

## Future Enhancements (Post-Launch)
- Member portal (self-service)
- Stripe integration for online payments
- Mobile app (React Native)
- Class scheduling
- Inventory/POS
- Multi-location support per tenant
- API for integrations
