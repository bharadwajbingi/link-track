-- SQL Schema for LinkTrack
-- Copy and run this script in your Supabase SQL Editor

-- =========================================================================
-- OPTION A: UPGRADE EXISTING TABLES (If you already have tables in your DB)
-- =========================================================================
-- Safely add the user_id column if the companies table already exists:
alter table public.companies add column if not exists user_id uuid references auth.users(id) default auth.uid();

-- =========================================================================
-- OPTION B: CLEAN SLATE (Optional - uncomment to drop existing tables and start fresh)
-- =========================================================================
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

-- 2. Create Contacts Table
create table if not exists public.contacts (
    id text primary key,
    company_id text references public.companies(id) on delete cascade,
    name text not null,
    title text,
    linkedin_url text,
    status text not null check (status in ('pending', 'accepted', 'declined', 'no_response')),
    draft_message text,
    notes text,
    accepted_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 3. Enable Row Level Security (RLS)
alter table public.companies enable row level security;
alter table public.contacts enable row level security;

-- 4. Drop Old Policies if any exist
drop policy if exists "Allow public read access" on public.companies;
drop policy if exists "Allow public insert access" on public.companies;
drop policy if exists "Allow public update access" on public.companies;
drop policy if exists "Allow public delete access" on public.companies;

drop policy if exists "Allow public read access" on public.contacts;
drop policy if exists "Allow public insert access" on public.contacts;
drop policy if exists "Allow public update access" on public.contacts;
drop policy if exists "Allow public delete access" on public.contacts;

drop policy if exists "Allow users to read their own companies" on public.companies;
drop policy if exists "Allow users to insert their own companies" on public.companies;
drop policy if exists "Allow users to update their own companies" on public.companies;
drop policy if exists "Allow users to delete their own companies" on public.companies;

drop policy if exists "Allow users to read contacts of their companies" on public.contacts;
drop policy if exists "Allow users to insert contacts for their companies" on public.contacts;
drop policy if exists "Allow users to update contacts of their companies" on public.contacts;
drop policy if exists "Allow users to delete contacts of their companies" on public.contacts;

-- 5. Create Secure User-Isolated Policies for Companies
create policy "Allow users to read their own companies" on public.companies
    for select using (auth.uid() = user_id);

create policy "Allow users to insert their own companies" on public.companies
    for insert with check (auth.uid() = user_id);

create policy "Allow users to update their own companies" on public.companies
    for update using (auth.uid() = user_id);

create policy "Allow users to delete their own companies" on public.companies
    for delete using (auth.uid() = user_id);

-- 6. Create Secure User-Isolated Policies for Contacts
create policy "Allow users to read contacts of their companies" on public.contacts
    for select using (
        exists (
            select 1 from public.companies 
            where companies.id = contacts.company_id and companies.user_id = auth.uid()
        )
    );

create policy "Allow users to insert contacts for their companies" on public.contacts
    for insert with check (
        exists (
            select 1 from public.companies 
            where companies.id = contacts.company_id and companies.user_id = auth.uid()
        )
    );

create policy "Allow users to update contacts of their companies" on public.contacts
    for update using (
        exists (
            select 1 from public.companies 
            where companies.id = contacts.company_id and companies.user_id = auth.uid()
        )
    );

create policy "Allow users to delete contacts of their companies" on public.contacts
    for delete using (
        exists (
            select 1 from public.companies 
            where companies.id = contacts.company_id and companies.user_id = auth.uid()
        )
    );
