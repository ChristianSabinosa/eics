alter table public.ics_211_resources
  add column if not exists operational_classification text,
  add column if not exists resource_status text not null default 'AVAILABLE';

alter table public.ics_211_resources
  drop constraint if exists ics_211_resources_operational_classification_check;

alter table public.ics_211_resources
  add constraint ics_211_resources_operational_classification_check
  check (operational_classification is null or operational_classification in ('IMT RESOURCE', 'TACTICAL RESOURCE'));

alter table public.ics_211_resources
  drop constraint if exists ics_211_resources_resource_status_check;

alter table public.ics_211_resources
  add constraint ics_211_resources_resource_status_check
  check (resource_status in ('AVAILABLE', 'ASSIGNED', 'OUT-OF-SERVICE', 'DEMOBILIZED'));

create unique index if not exists check_in_manifests_one_per_incident_resource_idx
  on public.check_in_manifests (incident_id, ics_211_resource_id)
  where ics_211_resource_id is not null;

create table if not exists public.ics_211_resource_assignments (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  ics_211_resource_id uuid not null references public.ics_211_resources(id) on delete cascade,
  assignment_status text not null default 'ASSIGNED',
  assigned_at timestamptz not null default now(),
  assigned_by uuid not null references auth.users(id),
  released_at timestamptz,
  released_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint ics_211_resource_assignment_status_check
    check (assignment_status in ('ASSIGNED', 'RELEASED'))
);

create unique index if not exists ics_211_resource_one_active_assignment_idx
  on public.ics_211_resource_assignments (ics_211_resource_id)
  where assignment_status = 'ASSIGNED';

create index if not exists ics_211_resource_assignments_incident_id_idx
  on public.ics_211_resource_assignments (incident_id, assigned_at desc);

alter table public.ics_211_resource_assignments enable row level security;

drop policy if exists "Authorized users can read resource assignments" on public.ics_211_resource_assignments;
create policy "Authorized users can read resource assignments"
  on public.ics_211_resource_assignments for select
  to authenticated
  using (exists (
    select 1
    from public.incidents i
    join public.profiles p on p.id = auth.uid()
    where i.id = ics_211_resource_assignments.incident_id
      and (
        p.role = 'administrator_trainer'
        or i.created_by = auth.uid()
        or i.incident_commander_id = auth.uid()
      )
  ));

create or replace function public.classify_ics_211_resource(
  p_resource_id uuid,
  p_classification text
)
returns public.ics_211_resources
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
  resource_record public.ics_211_resources%rowtype;
begin
  select role into actor_role from public.profiles where id = auth.uid();
  if actor_role not in ('administrator_trainer', 'incident_commander') then
    raise exception 'Only an administrator/trainer or Incident Commander can classify resources';
  end if;

  if p_classification not in ('IMT RESOURCE', 'TACTICAL RESOURCE') then
    raise exception 'Invalid resource classification';
  end if;

  update public.ics_211_resources
  set operational_classification = p_classification
  where id = p_resource_id
  returning * into resource_record;

  if resource_record.id is null then
    raise exception 'ICS 211 resource not found';
  end if;

  return resource_record;
end;
$$;

grant execute on function public.classify_ics_211_resource(uuid, text) to authenticated;

create or replace function public.assign_ics_211_resource(
  p_resource_id uuid
)
returns public.ics_211_resource_assignments
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
  resource_record public.ics_211_resources%rowtype;
  incident_id_value uuid;
  incident_status_value text;
  assignment_record public.ics_211_resource_assignments%rowtype;
begin
  select role into actor_role from public.profiles where id = auth.uid();
  if actor_role not in ('administrator_trainer', 'incident_commander') then
    raise exception 'Only an administrator/trainer or Incident Commander can assign resources';
  end if;

  select r
  into resource_record
  from public.ics_211_resources r
  where r.id = p_resource_id;

  if resource_record.id is null then
    raise exception 'ICS 211 resource not found';
  end if;

  select incident_id
  into incident_id_value
  from public.ics_211
  where id = resource_record.ics_211_id;

  select status
  into incident_status_value
  from public.incidents
  where id = incident_id_value;

  if incident_status_value <> 'active' then
    raise exception 'Resources can only be assigned for an active incident';
  end if;

  if resource_record.resource_status <> 'AVAILABLE' then
    raise exception 'Only AVAILABLE resources can be assigned';
  end if;

  if exists (
    select 1 from public.ics_211_resource_assignments a
    where a.ics_211_resource_id = p_resource_id
      and a.assignment_status = 'ASSIGNED'
  ) then
    raise exception 'This resource already has an active assignment';
  end if;

  insert into public.ics_211_resource_assignments (incident_id, ics_211_resource_id, assigned_by)
  values (incident_id_value, p_resource_id, auth.uid())
  returning * into assignment_record;

  update public.ics_211_resources
  set resource_status = 'ASSIGNED'
  where id = p_resource_id;

  return assignment_record;
end;
$$;

grant execute on function public.assign_ics_211_resource(uuid) to authenticated;

create or replace function public.release_ics_211_resource(
  p_resource_id uuid
)
returns public.ics_211_resource_assignments
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
  assignment_record public.ics_211_resource_assignments%rowtype;
begin
  select role into actor_role from public.profiles where id = auth.uid();
  if actor_role not in ('administrator_trainer', 'incident_commander') then
    raise exception 'Only an administrator/trainer or Incident Commander can release resources';
  end if;

  update public.ics_211_resource_assignments
  set assignment_status = 'RELEASED', released_at = now(), released_by = auth.uid()
  where ics_211_resource_id = p_resource_id
    and assignment_status = 'ASSIGNED'
  returning * into assignment_record;

  if assignment_record.id is null then
    raise exception 'No active assignment exists for this resource';
  end if;

  update public.ics_211_resources
  set resource_status = 'AVAILABLE'
  where id = p_resource_id;

  return assignment_record;
end;
$$;

grant execute on function public.release_ics_211_resource(uuid) to authenticated;
