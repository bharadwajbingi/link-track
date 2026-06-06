-- SQL Schema for LinkTrack
-- Copy and run this script in your Supabase SQL Editor

-- 1. Create Companies Table
create table if not exists public.companies (
    id text primary key,
    name text not null,
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

-- 4. Create Policies for Public Anonymous Read/Write Access
-- Since the application operates on client-side environment keys, we allow public operations.
-- For production environments, consider configuring Supabase Auth.
create policy "Allow public read access" on public.companies for select using (true);
create policy "Allow public insert access" on public.companies for insert with check (true);
create policy "Allow public update access" on public.companies for update using (true);
create policy "Allow public delete access" on public.companies for delete using (true);

create policy "Allow public read access" on public.contacts for select using (true);
create policy "Allow public insert access" on public.contacts for insert with check (true);
create policy "Allow public update access" on public.contacts for update using (true);
create policy "Allow public delete access" on public.contacts for delete using (true);
