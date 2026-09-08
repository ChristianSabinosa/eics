create table if not exists public.check_in_manifests (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  ics_211_resource_id uuid references public.ics_211_resources(id) on delete set null,
  agency_office_home_base text,
  leader_name text,
  contact_details text,
  total_personnel integer not null default 0 check (total_personnel >= 0),
  total_vehicles integer not null default 0 check (total_vehicles >= 0),
  total_land_vehicles integer not null default 0 check (total_land_vehicles >= 0),
  total_water_vehicles integer not null default 0 check (total_water_vehicles >= 0),
  total_air_vehicles integer not null default 0 check (total_air_vehicles >= 0),
  total_equipment integer not null default 0 check (total_equipment >= 0),
  others text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.check_in_manifest_personnel (
  id uuid primary key default gen_random_uuid(),
  manifest_id uuid not null references public.check_in_manifests(id) on delete cascade,
  name text not null,
  age integer check (age is null or age >= 0),
  gender text,
  weight_kg numeric(10, 2) check (weight_kg is null or weight_kg >= 0),
  contact_details text,
  capabilities_specialization text,
  others text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.check_in_manifest_vehicles (
  id uuid primary key default gen_random_uuid(),
  manifest_id uuid not null references public.check_in_manifests(id) on delete cascade,
  operator_name text,
  kind text,
  type text,
  plate_number text,
  fuel_type text,
  weight_kg numeric(10, 2) check (weight_kg is null or weight_kg >= 0),
  contact_details text,
  capabilities_specialization text,
  others text,
  vehicle_category text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint check_in_manifest_vehicle_category_check check (vehicle_category in ('LAND', 'WATER', 'AIR'))
);

create table if not exists public.check_in_manifest_equipment (
  id uuid primary key default gen_random_uuid(),
  manifest_id uuid not null references public.check_in_manifests(id) on delete cascade,
  operator_name text,
  kind text,
  type text,
  source_of_power text,
  fuel_type text,
  weight_kg numeric(10, 2) check (weight_kg is null or weight_kg >= 0),
  contact_details text,
  capabilities_specialization text,
  others text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.check_in_manifest_others (
  id uuid primary key default gen_random_uuid(),
  manifest_id uuid not null references public.check_in_manifests(id) on delete cascade,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.check_in_manifests enable row level security;
alter table public.check_in_manifest_personnel enable row level security;
alter table public.check_in_manifest_vehicles enable row level security;
alter table public.check_in_manifest_equipment enable row level security;
alter table public.check_in_manifest_others enable row level security;

drop policy if exists "Authorized users can read incident manifests" on public.check_in_manifests;
drop policy if exists "Authenticated users can read incident manifests" on public.check_in_manifests;
create policy "Authorized users can read incident manifests"
  on public.check_in_manifests for select
  to authenticated
  using (exists (
    select 1
    from public.incidents i
    join public.profiles p on p.id = auth.uid()
    where i.id = check_in_manifests.incident_id
      and (
        p.role = 'administrator_trainer'
        or i.created_by = auth.uid()
        or i.incident_commander_id = auth.uid()
      )
  ));

drop policy if exists "Authorized users can create incident manifests" on public.check_in_manifests;
drop policy if exists "Authenticated users can create incident manifests" on public.check_in_manifests;
create policy "Authorized users can create incident manifests"
  on public.check_in_manifests for insert
  to authenticated
  with check (
    auth.uid() = created_by
    and exists (
      select 1
      from public.incidents i
      join public.profiles p on p.id = auth.uid()
      where i.id = check_in_manifests.incident_id
        and (
          p.role = 'administrator_trainer'
          or i.created_by = auth.uid()
          or i.incident_commander_id = auth.uid()
        )
    )
  );

drop policy if exists "Authorized users can update incident manifests" on public.check_in_manifests;
drop policy if exists "Authenticated users can update incident manifests" on public.check_in_manifests;
create policy "Authorized users can update incident manifests"
  on public.check_in_manifests for update
  to authenticated
  using (exists (
    select 1
    from public.incidents i
    join public.profiles p on p.id = auth.uid()
    where i.id = check_in_manifests.incident_id
      and (
        p.role = 'administrator_trainer'
        or i.created_by = auth.uid()
        or i.incident_commander_id = auth.uid()
      )
  ))
  with check (exists (
    select 1
    from public.incidents i
    join public.profiles p on p.id = auth.uid()
    where i.id = check_in_manifests.incident_id
      and (
        p.role = 'administrator_trainer'
        or i.created_by = auth.uid()
        or i.incident_commander_id = auth.uid()
      )
  ));

drop policy if exists "Authorized users can delete incident manifests" on public.check_in_manifests;
drop policy if exists "Authenticated users can delete incident manifests" on public.check_in_manifests;
create policy "Authorized users can delete incident manifests"
  on public.check_in_manifests for delete
  to authenticated
  using (exists (
    select 1
    from public.incidents i
    join public.profiles p on p.id = auth.uid()
    where i.id = check_in_manifests.incident_id
      and (
        p.role = 'administrator_trainer'
        or i.created_by = auth.uid()
        or i.incident_commander_id = auth.uid()
      )
  ));

drop policy if exists "Authorized users can read manifest personnel" on public.check_in_manifest_personnel;
drop policy if exists "Authenticated users can read manifest personnel" on public.check_in_manifest_personnel;
create policy "Authorized users can read manifest personnel"
  on public.check_in_manifest_personnel for select
  to authenticated
  using (exists (
    select 1
    from public.check_in_manifests m
    join public.incidents i on i.id = m.incident_id
    join public.profiles p on p.id = auth.uid()
    where m.id = check_in_manifest_personnel.manifest_id
      and (
        p.role = 'administrator_trainer'
        or i.created_by = auth.uid()
        or i.incident_commander_id = auth.uid()
      )
  ));

drop policy if exists "Authorized users can manage manifest personnel" on public.check_in_manifest_personnel;
drop policy if exists "Authenticated users can manage manifest personnel" on public.check_in_manifest_personnel;
create policy "Authorized users can manage manifest personnel"
  on public.check_in_manifest_personnel for all
  to authenticated
  using (exists (
    select 1
    from public.check_in_manifests m
    join public.incidents i on i.id = m.incident_id
    join public.profiles p on p.id = auth.uid()
    where m.id = check_in_manifest_personnel.manifest_id
      and (
        p.role = 'administrator_trainer'
        or i.created_by = auth.uid()
        or i.incident_commander_id = auth.uid()
      )
  ))
  with check (exists (
    select 1
    from public.check_in_manifests m
    join public.incidents i on i.id = m.incident_id
    join public.profiles p on p.id = auth.uid()
    where m.id = check_in_manifest_personnel.manifest_id
      and (
        p.role = 'administrator_trainer'
        or i.created_by = auth.uid()
        or i.incident_commander_id = auth.uid()
      )
  ));

drop policy if exists "Authorized users can read manifest vehicles" on public.check_in_manifest_vehicles;
drop policy if exists "Authenticated users can read manifest vehicles" on public.check_in_manifest_vehicles;
create policy "Authorized users can read manifest vehicles"
  on public.check_in_manifest_vehicles for select
  to authenticated
  using (exists (
    select 1
    from public.check_in_manifests m
    join public.incidents i on i.id = m.incident_id
    join public.profiles p on p.id = auth.uid()
    where m.id = check_in_manifest_vehicles.manifest_id
      and (
        p.role = 'administrator_trainer'
        or i.created_by = auth.uid()
        or i.incident_commander_id = auth.uid()
      )
  ));

drop policy if exists "Authorized users can manage manifest vehicles" on public.check_in_manifest_vehicles;
drop policy if exists "Authenticated users can manage manifest vehicles" on public.check_in_manifest_vehicles;
create policy "Authorized users can manage manifest vehicles"
  on public.check_in_manifest_vehicles for all
  to authenticated
  using (exists (
    select 1
    from public.check_in_manifests m
    join public.incidents i on i.id = m.incident_id
    join public.profiles p on p.id = auth.uid()
    where m.id = check_in_manifest_vehicles.manifest_id
      and (
        p.role = 'administrator_trainer'
        or i.created_by = auth.uid()
        or i.incident_commander_id = auth.uid()
      )
  ))
  with check (exists (
    select 1
    from public.check_in_manifests m
    join public.incidents i on i.id = m.incident_id
    join public.profiles p on p.id = auth.uid()
    where m.id = check_in_manifest_vehicles.manifest_id
      and (
        p.role = 'administrator_trainer'
        or i.created_by = auth.uid()
        or i.incident_commander_id = auth.uid()
      )
  ));

drop policy if exists "Authorized users can read manifest equipment" on public.check_in_manifest_equipment;
drop policy if exists "Authenticated users can read manifest equipment" on public.check_in_manifest_equipment;
create policy "Authorized users can read manifest equipment"
  on public.check_in_manifest_equipment for select
  to authenticated
  using (exists (
    select 1
    from public.check_in_manifests m
    join public.incidents i on i.id = m.incident_id
    join public.profiles p on p.id = auth.uid()
    where m.id = check_in_manifest_equipment.manifest_id
      and (
        p.role = 'administrator_trainer'
        or i.created_by = auth.uid()
        or i.incident_commander_id = auth.uid()
      )
  ));

drop policy if exists "Authorized users can manage manifest equipment" on public.check_in_manifest_equipment;
drop policy if exists "Authenticated users can manage manifest equipment" on public.check_in_manifest_equipment;
create policy "Authorized users can manage manifest equipment"
  on public.check_in_manifest_equipment for all
  to authenticated
  using (exists (
    select 1
    from public.check_in_manifests m
    join public.incidents i on i.id = m.incident_id
    join public.profiles p on p.id = auth.uid()
    where m.id = check_in_manifest_equipment.manifest_id
      and (
        p.role = 'administrator_trainer'
        or i.created_by = auth.uid()
        or i.incident_commander_id = auth.uid()
      )
  ))
  with check (exists (
    select 1
    from public.check_in_manifests m
    join public.incidents i on i.id = m.incident_id
    join public.profiles p on p.id = auth.uid()
    where m.id = check_in_manifest_equipment.manifest_id
      and (
        p.role = 'administrator_trainer'
        or i.created_by = auth.uid()
        or i.incident_commander_id = auth.uid()
      )
  ));

drop policy if exists "Authorized users can read manifest others" on public.check_in_manifest_others;
drop policy if exists "Authenticated users can read manifest others" on public.check_in_manifest_others;
create policy "Authorized users can read manifest others"
  on public.check_in_manifest_others for select
  to authenticated
  using (exists (
    select 1
    from public.check_in_manifests m
    join public.incidents i on i.id = m.incident_id
    join public.profiles p on p.id = auth.uid()
    where m.id = check_in_manifest_others.manifest_id
      and (
        p.role = 'administrator_trainer'
        or i.created_by = auth.uid()
        or i.incident_commander_id = auth.uid()
      )
  ));

drop policy if exists "Authorized users can manage manifest others" on public.check_in_manifest_others;
drop policy if exists "Authenticated users can manage manifest others" on public.check_in_manifest_others;
create policy "Authorized users can manage manifest others"
  on public.check_in_manifest_others for all
  to authenticated
  using (exists (
    select 1
    from public.check_in_manifests m
    join public.incidents i on i.id = m.incident_id
    join public.profiles p on p.id = auth.uid()
    where m.id = check_in_manifest_others.manifest_id
      and (
        p.role = 'administrator_trainer'
        or i.created_by = auth.uid()
        or i.incident_commander_id = auth.uid()
      )
  ))
  with check (exists (
    select 1
    from public.check_in_manifests m
    join public.incidents i on i.id = m.incident_id
    join public.profiles p on p.id = auth.uid()
    where m.id = check_in_manifest_others.manifest_id
      and (
        p.role = 'administrator_trainer'
        or i.created_by = auth.uid()
        or i.incident_commander_id = auth.uid()
      )
  ));
