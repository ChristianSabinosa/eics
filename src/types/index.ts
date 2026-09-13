export type UserProfile = {
  full_name: string | null
  role: string | null
}

export type ManagedUser = UserProfile & {
  id: string
}

export type Incident = {
  id: string
  name: string
  incident_type: string | null
  location: string | null
  status: string
  created_at: string
}

export type IncidentDetails = Incident & {
  description: string | null
  incident_commander_id: string | null
}

export type CommanderProfile = {
  id: string
  full_name: string | null
}

export type IncidentPersonnel = {
  id: string
  full_name: string
  organization: string | null
  position: string | null
  check_in_time: string
  check_out_time: string | null
  status: string
}

export type Ics211Resource = {
  id: string
  ics_211_id: string
  order_request_no: string | null
  check_in_at: string
  kind: string
  type: string
  resource_identifier: string
  resource_classification: string
  agency_office_home_base: string | null
  leader_name: string | null
  contact_details: string | null
  total_personnel: number | null
  point_of_origin: string | null
  departure_at: string | null
  method_of_travel: string | null
  with_manifest: boolean
  incident_assignment: string | null
  other_qualifications: string | null
  data_sent_to_resl_at: string | null
  manifest_reference: string | null
  check_in_method: string
  manifest_id?: string | null
  operational_classification?: 'IMT RESOURCE' | 'TACTICAL RESOURCE' | null
  resource_status?: 'AVAILABLE' | 'ASSIGNED' | 'OUT-OF-SERVICE' | 'DEMOBILIZED' | null
}

export type Stage7Resource = Ics211Resource & {
  incident_id: string
  manifest_personnel_count: number
  manifest_vehicle_count: number
  manifest_equipment_count: number
  has_manifest: boolean
  assignment_id: string | null
  assigned_at: string | null
  assigned_by: string | null
}

export type Ics211Header = {
  id: string
  incident_id: string
  incident_start_date: string
  incident_start_time: string
  check_in_location: string
  check_in_location_other: string | null
  prepared_by_name: string | null
  prepared_by_signature: string | null
  date_prepared: string | null
  time_prepared: string | null
  page_number: number
  total_pages: number
}

export type Ics211ResourceDraft = Omit<Ics211Resource, 'id' | 'ics_211_id' | 'check_in_method'>

export type CheckInManifest = {
  id: string
  incident_id: string
  ics_211_resource_id: string | null
  agency_office_home_base: string | null
  leader_name: string | null
  contact_details: string | null
  total_personnel: number
  total_vehicles: number
  total_land_vehicles: number
  total_water_vehicles: number
  total_air_vehicles: number
  total_equipment: number
}

export type ManifestPersonnel = {
  id: string
  manifest_id: string
  name: string
  age: number | null
  gender: string | null
  weight_kg: number | null
  contact_details: string | null
  capabilities_specialization: string | null
  others: string | null
}

export type ManifestVehicle = {
  id: string
  manifest_id: string
  operator_name: string | null
  kind: string | null
  type: string | null
  plate_number: string | null
  fuel_type: string | null
  weight_kg: number | null
  contact_details: string | null
  capabilities_specialization: string | null
  others: string | null
  vehicle_category: 'LAND' | 'WATER' | 'AIR'
}

export type ManifestEquipment = {
  id: string
  manifest_id: string
  operator_name: string | null
  kind: string | null
  type: string | null
  source_of_power: string | null
  fuel_type: string | null
  weight_kg: number | null
  contact_details: string | null
  capabilities_specialization: string | null
  others: string | null
}

export type ManifestOther = {
  id: string
  manifest_id: string
  description: string
}

export type ManifestPersonnelDraft = Omit<ManifestPersonnel, 'id' | 'manifest_id'>
export type ManifestVehicleDraft = Omit<ManifestVehicle, 'id' | 'manifest_id'>
export type ManifestEquipmentDraft = Omit<ManifestEquipment, 'id' | 'manifest_id'>

export type PersonnelResource = Record<string, unknown> & {
  id: string
  profile_id?: string | null
  first_name?: string | null
  middle_name?: string | null
  last_name?: string | null
  full_name?: string | null
  name?: string | null
  email?: string | null
  organization?: string | null
  agency?: string | null
  position?: string | null
  contact_number?: string | null
  resource_status?: string | null
}

export type OrganizationUnit = Record<string, unknown> & {
  id: string
  name?: string | null
  parent_unit_id?: string | null
}

export type OrganizationAssignment = Record<string, unknown> & {
  id: string
  organizational_unit_id: string
  position_id: string | null
  personnel_id: string | null
  assignment_status?: string | null
  status?: string | null
}

export type OrganizationPosition = Record<string, unknown> & {
  id: string
  name?: string | null
  title?: string | null
}

export type OrganizationPersonnel = Record<string, unknown> & {
  id: string
  full_name?: string | null
  name?: string | null
  resource_status?: string | null
}

export type OrganizationData = {
  units: OrganizationUnit[]
  assignments: OrganizationAssignment[]
  positions: OrganizationPosition[]
  personnel: OrganizationPersonnel[]
}

export const roleOptions = [
  { value: 'administrator_trainer', label: 'Administrator / Trainer' },
  { value: 'incident_commander', label: 'Incident Commander' },
  { value: 'personnel', label: 'Personnel' },
  { value: 'tactical_resource', label: 'Tactical Resource' },
] as const

export type ActivePage =
  | 'dashboard'
  | 'incidents'
  | 'personnel'
  | 'user-management'
  | 'system-dashboard'
  | 'create-incident'
  | 'incident-details'
  | 'organization'
  | 'ics-211'
  | 'check-in-manifest'
  | 'resource-review'

export const emptyManifestPersonnel: ManifestPersonnelDraft = { name: '', age: null, gender: '', weight_kg: null, contact_details: '', capabilities_specialization: '', others: '' }
export const emptyManifestVehicle: ManifestVehicleDraft = { operator_name: '', kind: '', type: '', plate_number: '', fuel_type: '', weight_kg: null, contact_details: '', capabilities_specialization: '', others: '', vehicle_category: 'LAND' }
export const emptyManifestEquipment: ManifestEquipmentDraft = { operator_name: '', kind: '', type: '', source_of_power: '', fuel_type: '', weight_kg: null, contact_details: '', capabilities_specialization: '', others: '' }

export const emptyIcs211ResourceDraft: Ics211ResourceDraft = {
  order_request_no: '',
  check_in_at: new Date().toISOString().slice(0, 16),
  kind: '',
  type: '',
  resource_identifier: '',
  resource_classification: 'Single',
  agency_office_home_base: '',
  leader_name: '',
  contact_details: '',
  total_personnel: null,
  point_of_origin: '',
  departure_at: null,
  method_of_travel: '',
  with_manifest: false,
  incident_assignment: '',
  other_qualifications: '',
  data_sent_to_resl_at: null,
  manifest_reference: '',
}
