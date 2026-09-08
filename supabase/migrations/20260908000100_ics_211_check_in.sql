create extension if not exists pgcrypto;

create table if not exists public.ics_211 (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null unique references public.incidents(id) on delete cascade,
  incident_start_date date not null,
  incident_start_time time not null,
  check_in_location text not null,
  check_in_location_other text,
  prepared_by_name text,
  prepared_by_signature text,
  date_prepared date,
  time_prepared time,
  page_number integer not null default 1 check (page_number > 0),
  total_pages integer not null default 1 check (total_pages > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ics_211_check_in_location_check check (
    check_in_location in ('Base', 'Camp', 'Staging Area', 'ICP', 'Others')
  ),
  constraint ics_211_other_location_check check (
    (check_in_location = 'Others' and nullif(trim(check_in_location_other), '') is not null)
    or (check_in_location <> 'Others' and check_in_location_other is null)
  ),
  constraint ics_211_page_count_check check (page_number <= total_pages)
);

create table if not exists public.ics_211_resources (
  id uuid primary key default gen_random_uuid(),
  ics_211_id uuid not null references public.ics_211(id) on delete cascade,
  order_request_no text,
  check_in_at timestamptz not null default now(),
  kind text not null,
  type text not null,
  resource_identifier text not null,
  resource_classification text not null,
  agency_office_home_base text,
  leader_name text,
  contact_details text,
  total_personnel integer check (total_personnel is null or total_personnel >= 0),
  point_of_origin text,
  departure_at timestamptz,
  method_of_travel text,
  with_manifest boolean not null default false,
  incident_assignment text,
  other_qualifications text,
  data_sent_to_resl_at timestamptz,
  manifest_id uuid,
  manifest_reference text,
  checked_in_by uuid references auth.users(id),
  check_in_method text not null default 'authenticated',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ics_211_resource_classification_check check (
    resource_classification in ('Single', 'TF', 'ST')
  )
);

create index if not exists ics_211_resources_ics_211_id_idx
  on public.ics_211_resources (ics_211_id, check_in_at desc);

create table if not exists public.incident_guest_checkin_links (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists incident_guest_checkin_links_incident_id_idx
  on public.incident_guest_checkin_links (incident_id);

alter table public.ics_211 enable row level security;
alter table public.ics_211_resources enable row level security;
alter table public.incident_guest_checkin_links enable row level security;

drop policy if exists "Authenticated users can read ICS 211" on public.ics_211;
create policy "Authenticated users can read ICS 211"
  on public.ics_211 for select
  to authenticated
  using (exists (
    select 1 from public.incidents i
    where i.id = ics_211.incident_id
  ));

drop policy if exists "Authenticated users can create ICS 211" on public.ics_211;
create policy "Authenticated users can create ICS 211"
  on public.ics_211 for insert
  to authenticated
  with check (exists (
    select 1 from public.incidents i
    where i.id = ics_211.incident_id
  ));

drop policy if exists "Authenticated users can update ICS 211" on public.ics_211;
create policy "Authenticated users can update ICS 211"
  on public.ics_211 for update
  to authenticated
  using (exists (
    select 1 from public.incidents i
    where i.id = ics_211.incident_id
  ))
  with check (exists (
    select 1 from public.incidents i
    where i.id = ics_211.incident_id
  ));

drop policy if exists "Authenticated users can read ICS 211 resources" on public.ics_211_resources;
create policy "Authenticated users can read ICS 211 resources"
  on public.ics_211_resources for select
  to authenticated
  using (exists (
    select 1
    from public.ics_211 h
    join public.incidents i on i.id = h.incident_id
    where h.id = ics_211_resources.ics_211_id
  ));

drop policy if exists "Authenticated users can create ICS 211 resources" on public.ics_211_resources;
create policy "Authenticated users can create ICS 211 resources"
  on public.ics_211_resources for insert
  to authenticated
  with check (auth.uid() = checked_in_by and exists (
    select 1
    from public.ics_211 h
    join public.incidents i on i.id = h.incident_id
    where h.id = ics_211_resources.ics_211_id
  ));

drop policy if exists "Authenticated users can update ICS 211 resources" on public.ics_211_resources;
create policy "Authenticated users can update ICS 211 resources"
  on public.ics_211_resources for update
  to authenticated
  using (exists (
    select 1 from public.ics_211 h
    where h.id = ics_211_resources.ics_211_id
  ))
  with check (exists (
    select 1 from public.ics_211 h
    where h.id = ics_211_resources.ics_211_id
  ));

create or replace function public.create_incident_guest_checkin_link(
  p_incident_id uuid,
  p_expires_at timestamptz default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_token text := encode(gen_random_bytes(32), 'hex');
  actor_role text;
begin
  select role into actor_role from public.profiles where id = auth.uid();
  if actor_role <> 'administrator_trainer' then
    raise exception 'Only an administrator/trainer can create guest check-in links';
  end if;

  if not exists (select 1 from public.incidents where id = p_incident_id and status = 'active') then
    raise exception 'The incident is not active or does not exist';
  end if;

  insert into public.incident_guest_checkin_links (incident_id, token_hash, expires_at, created_by)
  values (p_incident_id, encode(digest(raw_token, 'sha256'), 'hex'), p_expires_at, auth.uid());

  return raw_token;
end;
$$;

grant execute on function public.create_incident_guest_checkin_link(uuid, timestamptz) to authenticated;

create or replace function public.get_guest_checkin_context(p_token text)
returns table (
  incident_id uuid,
  incident_name text,
  incident_location text,
  ics_211_id uuid,
  incident_start_date date,
  incident_start_time time,
  expires_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select i.id, i.name, i.location, h.id, h.incident_start_date, h.incident_start_time, l.expires_at
  from public.incident_guest_checkin_links l
  join public.incidents i on i.id = l.incident_id
  left join public.ics_211 h on h.incident_id = i.id
  where l.token_hash = encode(digest(p_token, 'sha256'), 'hex')
    and l.is_active
    and i.status = 'active'
    and (l.expires_at is null or l.expires_at > now());
$$;

grant execute on function public.get_guest_checkin_context(text) to anon, authenticated;

create or replace function public.submit_guest_ics211_resource(
  p_token text,
  p_order_request_no text,
  p_kind text,
  p_type text,
  p_resource_identifier text,
  p_resource_classification text,
  p_agency_office_home_base text default null,
  p_leader_name text default null,
  p_contact_details text default null,
  p_total_personnel integer default null,
  p_point_of_origin text default null,
  p_departure_at timestamptz default null,
  p_method_of_travel text default null,
  p_with_manifest boolean default false,
  p_incident_assignment text default null,
  p_other_qualifications text default null
)
returns table (resource_id uuid, incident_id uuid, ics_211_id uuid, resource_identifier text)
language plpgsql
security definer
set search_path = public
as $$
declare
  link_record public.incident_guest_checkin_links%rowtype;
  ics_211_record public.ics_211%rowtype;
  inserted_id uuid;
begin
  select l.* into link_record
  from public.incident_guest_checkin_links l
  where l.token_hash = encode(digest(p_token, 'sha256'), 'hex')
    and l.is_active
    and (l.expires_at is null or l.expires_at > now());

  if link_record.id is null then
    raise exception 'This incident check-in link is invalid or expired';
  end if;

  if not exists (select 1 from public.incidents where id = link_record.incident_id and status = 'active') then
    raise exception 'This incident is not accepting check-ins';
  end if;

  select * into ics_211_record
  from public.ics_211
  where incident_id = link_record.incident_id;

  if ics_211_record.id is null then
    raise exception 'The ICS 211 header has not been prepared for this incident';
  end if;

  insert into public.ics_211_resources (
    ics_211_id, order_request_no, kind, type, resource_identifier,
    resource_classification, agency_office_home_base, leader_name,
    contact_details, total_personnel, point_of_origin, departure_at,
    method_of_travel, with_manifest, incident_assignment,
    other_qualifications, check_in_method
  ) values (
    ics_211_record.id, nullif(trim(p_order_request_no), ''), trim(p_kind), trim(p_type),
    trim(p_resource_identifier), trim(p_resource_classification),
    nullif(trim(p_agency_office_home_base), ''), nullif(trim(p_leader_name), ''),
    nullif(trim(p_contact_details), ''), p_total_personnel,
    nullif(trim(p_point_of_origin), ''), p_departure_at,
    nullif(trim(p_method_of_travel), ''), coalesce(p_with_manifest, false),
    nullif(trim(p_incident_assignment), ''), nullif(trim(p_other_qualifications), ''),
    'guest'
  ) returning id into inserted_id;

  return query select inserted_id, link_record.incident_id, ics_211_record.id, trim(p_resource_identifier);
end;
$$;

grant execute on function public.submit_guest_ics211_resource(
  text, text, text, text, text, text, text, text, text, integer,
  text, timestamptz, text, boolean, text, text
) to anon, authenticated;
