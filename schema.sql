-- SQL Schema for LinkTrack (SaaS Upgrade)
-- Run this script in your Supabase SQL Editor

-- =========================================================================
-- OPTION A: UPGRADE EXISTING TABLES
-- =========================================================================
alter table public.companies add column if not exists user_id uuid references auth.users(id) default auth.uid();

-- =========================================================================
-- OPTION B: CLEAN SLATE (Optional - uncomment to drop existing tables)
-- =========================================================================
-- drop table if exists public.activity_notes cascade;
-- drop table if exists public.reminders cascade;
-- drop table if exists public.contact_tags cascade;
-- drop table if exists public.tags cascade;
-- drop table if exists public.contacts cascade;
-- drop table if exists public.companies cascade;

-- 1. Create Companies Table
create table if not exists public.companies (
    id text primary key,
    name text not null,
    user_id uuid references auth.users(id) default auth.uid(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. Create Contacts Table (with pipeline_stage and tags)
create table if not exists public.contacts (
    id text primary key,
    company_id text references public.companies(id) on delete cascade,
    name text not null,
    title text,
    linkedin_url text,
    status text not null check (status in ('pending', 'accepted', 'declined', 'no_response')),
    pipeline_stage text not null default 'cold_email' check (pipeline_stage in ('cold_email', 'applied', 'phone_screen', 'interview', 'offer', 'rejected')),
    draft_message text,
    notes text,
    tags text[] default '{}',
    accepted_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Add pipeline_stage column if upgrading existing table
alter table public.contacts add column if not exists pipeline_stage text not null default 'cold_email';
alter table public.contacts add column if not exists tags text[] default '{}';

-- 3. Create Tags Table
create table if not exists public.tags (
    id text primary key,
    user_id uuid references auth.users(id) default auth.uid(),
    name text not null,
    color text not null default '#3b82f6',
    created_at timestamptz not null default now()
);

-- 4. Create Activity Notes Table
create table if not exists public.activity_notes (
    id text primary key,
    contact_id text references public.contacts(id) on delete cascade,
    user_id uuid references auth.users(id) default auth.uid(),
    text text not null,
    type text not null default 'note' check (type in ('note', 'email_sent', 'reply_received', 'call_scheduled', 'meeting', 'follow_up', 'other')),
    created_at timestamptz not null default now()
);

-- 5. Create Reminders Table
create table if not exists public.reminders (
    id text primary key,
    contact_id text references public.contacts(id) on delete cascade,
    user_id uuid references auth.users(id) default auth.uid(),
    due_date timestamptz not null,
    note text,
    completed boolean not null default false,
    created_at timestamptz not null default now()
);

-- 6. Enable Row Level Security (RLS)
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.tags enable row level security;
alter table public.activity_notes enable row level security;
alter table public.reminders enable row level security;

-- 7. Drop Old Policies
drop policy if exists "Allow users to read their own companies" on public.companies;
drop policy if exists "Allow users to insert their own companies" on public.companies;
drop policy if exists "Allow users to update their own companies" on public.companies;
drop policy if exists "Allow users to delete their own companies" on public.companies;

drop policy if exists "Allow users to read contacts of their companies" on public.contacts;
drop policy if exists "Allow users to insert contacts for their companies" on public.contacts;
drop policy if exists "Allow users to update contacts of their companies" on public.contacts;
drop policy if exists "Allow users to delete contacts of their companies" on public.contacts;

drop policy if exists "Allow users to read their own tags" on public.tags;
drop policy if exists "Allow users to insert their own tags" on public.tags;
drop policy if exists "Allow users to update their own tags" on public.tags;
drop policy if exists "Allow users to delete their own tags" on public.tags;

drop policy if exists "Allow users to read their own activity_notes" on public.activity_notes;
drop policy if exists "Allow users to insert their own activity_notes" on public.activity_notes;
drop policy if exists "Allow users to delete their own activity_notes" on public.activity_notes;

drop policy if exists "Allow users to read their own reminders" on public.reminders;
drop policy if exists "Allow users to insert their own reminders" on public.reminders;
drop policy if exists "Allow users to update their own reminders" on public.reminders;
drop policy if exists "Allow users to delete their own reminders" on public.reminders;

-- 8. Companies Policies
create policy "Allow users to read their own companies" on public.companies
    for select using (auth.uid() = user_id);
create policy "Allow users to insert their own companies" on public.companies
    for insert with check (auth.uid() = user_id);
create policy "Allow users to update their own companies" on public.companies
    for update using (auth.uid() = user_id);
create policy "Allow users to delete their own companies" on public.companies
    for delete using (auth.uid() = user_id);

-- 9. Contacts Policies
create policy "Allow users to read contacts of their companies" on public.contacts
    for select using (
        exists (select 1 from public.companies where companies.id = contacts.company_id and companies.user_id = auth.uid())
    );
create policy "Allow users to insert contacts for their companies" on public.contacts
    for insert with check (
        exists (select 1 from public.companies where companies.id = contacts.company_id and companies.user_id = auth.uid())
    );
create policy "Allow users to update contacts of their companies" on public.contacts
    for update using (
        exists (select 1 from public.companies where companies.id = contacts.company_id and companies.user_id = auth.uid())
    );
create policy "Allow users to delete contacts of their companies" on public.contacts
    for delete using (
        exists (select 1 from public.companies where companies.id = contacts.company_id and companies.user_id = auth.uid())
    );

-- 10. Tags Policies
create policy "Allow users to read their own tags" on public.tags
    for select using (auth.uid() = user_id);
create policy "Allow users to insert their own tags" on public.tags
    for insert with check (auth.uid() = user_id);
create policy "Allow users to update their own tags" on public.tags
    for update using (auth.uid() = user_id);
create policy "Allow users to delete their own tags" on public.tags
    for delete using (auth.uid() = user_id);

-- 11. Activity Notes Policies
create policy "Allow users to read their own activity_notes" on public.activity_notes
    for select using (auth.uid() = user_id);
create policy "Allow users to insert their own activity_notes" on public.activity_notes
    for insert with check (auth.uid() = user_id);
create policy "Allow users to delete their own activity_notes" on public.activity_notes
    for delete using (auth.uid() = user_id);

-- 12. Reminders Policies
create policy "Allow users to read their own reminders" on public.reminders
    for select using (auth.uid() = user_id);
create policy "Allow users to insert their own reminders" on public.reminders
    for insert with check (auth.uid() = user_id);
create policy "Allow users to update their own reminders" on public.reminders
    for update using (auth.uid() = user_id);
create policy "Allow users to delete their own reminders" on public.reminders
    for delete using (auth.uid() = user_id);
