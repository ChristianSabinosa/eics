import './App.css'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from './lib/supabase'

type UserProfile = {
  full_name: string | null
  role: string | null
}

type ManagedUser = UserProfile & {
  id: string
}

type Incident = {
  id: string
  name: string
  incident_type: string | null
  location: string | null
  status: string
  created_at: string
}

type IncidentDetails = Incident & {
  description: string | null
  incident_commander_id: string | null
}

type CommanderProfile = {
  id: string
  full_name: string | null
}

type IncidentPersonnel = {
  id: string
  full_name: string
  organization: string | null
  position: string | null
  check_in_time: string
  check_out_time: string | null
  status: string
}

type Ics211Resource = {
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

type Stage7Resource = Ics211Resource & {
  incident_id: string
  manifest_personnel_count: number
  manifest_vehicle_count: number
  manifest_equipment_count: number
  has_manifest: boolean
  assignment_id: string | null
  assigned_at: string | null
  assigned_by: string | null
}

type Ics211Header = {
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

type Ics211ResourceDraft = Omit<Ics211Resource, 'id' | 'ics_211_id' | 'check_in_method'>

type CheckInManifest = {
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

type ManifestPersonnel = {
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

type ManifestVehicle = {
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

type ManifestEquipment = {
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

type ManifestOther = {
  id: string
  manifest_id: string
  description: string
}

type ManifestPersonnelDraft = Omit<ManifestPersonnel, 'id' | 'manifest_id'>
type ManifestVehicleDraft = Omit<ManifestVehicle, 'id' | 'manifest_id'>
type ManifestEquipmentDraft = Omit<ManifestEquipment, 'id' | 'manifest_id'>

const emptyManifestPersonnel: ManifestPersonnelDraft = { name: '', age: null, gender: '', weight_kg: null, contact_details: '', capabilities_specialization: '', others: '' }
const emptyManifestVehicle: ManifestVehicleDraft = { operator_name: '', kind: '', type: '', plate_number: '', fuel_type: '', weight_kg: null, contact_details: '', capabilities_specialization: '', others: '', vehicle_category: 'LAND' }
const emptyManifestEquipment: ManifestEquipmentDraft = { operator_name: '', kind: '', type: '', source_of_power: '', fuel_type: '', weight_kg: null, contact_details: '', capabilities_specialization: '', others: '' }

const emptyIcs211ResourceDraft: Ics211ResourceDraft = {
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

type PersonnelResource = Record<string, unknown> & {
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

type OrganizationUnit = Record<string, unknown> & {
  id: string
  name?: string | null
  parent_unit_id?: string | null
}

type OrganizationAssignment = Record<string, unknown> & {
  id: string
  organizational_unit_id: string
  position_id: string | null
  personnel_id: string | null
  assignment_status?: string | null
  status?: string | null
}

type OrganizationPosition = Record<string, unknown> & {
  id: string
  name?: string | null
  title?: string | null
}

type OrganizationPersonnel = Record<string, unknown> & {
  id: string
  full_name?: string | null
  name?: string | null
  resource_status?: string | null
}

type OrganizationData = {
  units: OrganizationUnit[]
  assignments: OrganizationAssignment[]
  positions: OrganizationPosition[]
  personnel: OrganizationPersonnel[]
}

const roleOptions = [
  { value: 'administrator_trainer', label: 'Administrator / Trainer' },
  { value: 'incident_commander', label: 'Incident Commander' },
  { value: 'personnel', label: 'Personnel' },
  { value: 'tactical_resource', label: 'Tactical Resource' },
] as const

async function loadAllProfiles() {
  const pageSize = 1000
  const profiles: ManagedUser[] = []
  let page = 0

  while (true) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .order('full_name')
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) {
      return { data: null, error }
    }

    profiles.push(...(data ?? []))

    if (!data || data.length < pageSize) {
      return { data: profiles, error: null }
    }

    page += 1
  }
}

function getOrganizationLabel(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function getPersonnelResourceName(person: PersonnelResource) {
  const nameParts = [person.first_name, person.middle_name, person.last_name]
    .filter((part): part is string => Boolean(part?.trim()))

  return getOrganizationLabel(
    nameParts.length > 0 ? nameParts.join(' ') : person.full_name || person.name,
    'Unnamed personnel',
  )
}

function getAssignmentPosition(
  assignment: OrganizationAssignment,
  positions: Map<string, OrganizationPosition>,
) {
  const position = assignment.position_id ? positions.get(assignment.position_id) : undefined
  return getOrganizationLabel(position?.name || position?.title, 'Unassigned position')
}

function getAssignmentPersonnel(
  assignment: OrganizationAssignment,
  personnel: Map<string, OrganizationPersonnel>,
) {
  if (!assignment.personnel_id) {
    return 'Unassigned'
  }

  const person = personnel.get(assignment.personnel_id)
  return getOrganizationLabel(person?.full_name || person?.name, 'Unassigned')
}

function getAssignmentStatus(assignment: OrganizationAssignment) {
  return getOrganizationLabel(assignment.assignment_status, 'ASSIGNED')
}

function getResourceStatus(person: OrganizationPersonnel) {
  return getOrganizationLabel(person.resource_status, 'AVAILABLE')
}

function GuestCheckIn({ token }: { token: string }) {
  const [context, setContext] = useState<{ incident_name: string; incident_location: string | null; ics_211_id: string | null; expires_at: string | null } | null>(null)
  const [resource, setResource] = useState<Ics211ResourceDraft>({ ...emptyIcs211ResourceDraft })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function loadContext() {
      const { data, error: contextError } = await supabase.rpc('get_guest_checkin_context', { p_token: token })
      if (contextError || !data?.[0]) {
        setError('This incident check-in link is invalid, expired, or no longer active.')
      } else {
        setContext(data[0])
      }
      setIsLoading(false)
    }

    void loadContext()
  }, [token])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSaving(true)

    const { error: submitError } = await supabase.rpc('submit_guest_ics211_resource', {
      p_token: token,
      p_order_request_no: resource.order_request_no?.trim() || null,
      p_kind: resource.kind.trim(),
      p_type: resource.type.trim(),
      p_resource_identifier: resource.resource_identifier.trim(),
      p_resource_classification: resource.resource_classification,
      p_agency_office_home_base: resource.agency_office_home_base?.trim() || null,
      p_leader_name: resource.leader_name?.trim() || null,
      p_contact_details: resource.contact_details?.trim() || null,
      p_total_personnel: resource.total_personnel,
      p_point_of_origin: resource.point_of_origin?.trim() || null,
      p_departure_at: resource.departure_at || null,
      p_method_of_travel: resource.method_of_travel?.trim() || null,
      p_with_manifest: resource.with_manifest,
      p_incident_assignment: resource.incident_assignment?.trim() || null,
      p_other_qualifications: resource.other_qualifications?.trim() || null,
    })

    if (submitError) {
      setError(submitError.message)
    } else {
      setMessage('Resource checked in successfully. The incident team can now review it in ICS 211.')
      setResource({ ...emptyIcs211ResourceDraft })
    }
    setIsSaving(false)
  }

  return (
    <main className="guest-check-in-page">
      <section className="login-card guest-check-in-card">
        <div className="login-brand">
          <div className="login-brand-mark">eICS</div>
          <div>
            <h1>Incident Resource Check-In</h1>
            <p>ICS Form 211</p>
          </div>
        </div>
        {isLoading && <div className="empty-state"><h4>Validating incident link...</h4></div>}
        {!isLoading && error && !context && <p className="form-error" role="alert">{error}</p>}
        {!isLoading && context && (
          <>
            <div className="guest-incident-summary">
              <span>Authorized incident</span>
              <strong>{context.incident_name}</strong>
              <small>{context.incident_location || 'Location not specified'}</small>
            </div>
            <form className="login-form" onSubmit={handleSubmit}>
              <label htmlFor="guest-order-request">Order / Request No.</label>
              <input id="guest-order-request" value={resource.order_request_no || ''} onChange={(event) => setResource({ ...resource, order_request_no: event.target.value })} />
              <label htmlFor="guest-kind">Kind</label>
              <input id="guest-kind" value={resource.kind} onChange={(event) => setResource({ ...resource, kind: event.target.value })} required />
              <label htmlFor="guest-type">Type</label>
              <input id="guest-type" value={resource.type} onChange={(event) => setResource({ ...resource, type: event.target.value })} required />
              <label htmlFor="guest-resource-identifier">Resource Identifier</label>
              <input id="guest-resource-identifier" value={resource.resource_identifier} onChange={(event) => setResource({ ...resource, resource_identifier: event.target.value })} required />
              <label htmlFor="guest-resource-classification">Resource Classification</label>
              <select id="guest-resource-classification" value={resource.resource_classification} onChange={(event) => setResource({ ...resource, resource_classification: event.target.value })}>
                <option value="Single">Single</option><option value="TF">TF</option><option value="ST">ST</option>
              </select>
              <label htmlFor="guest-agency">Agency / Office / Home Base</label>
              <input id="guest-agency" value={resource.agency_office_home_base || ''} onChange={(event) => setResource({ ...resource, agency_office_home_base: event.target.value })} />
              <label htmlFor="guest-leader">Leader</label>
              <input id="guest-leader" value={resource.leader_name || ''} onChange={(event) => setResource({ ...resource, leader_name: event.target.value })} />
              <label htmlFor="guest-contact">Contact Details</label>
              <input id="guest-contact" value={resource.contact_details || ''} onChange={(event) => setResource({ ...resource, contact_details: event.target.value })} />
              <label htmlFor="guest-total-personnel">Total No. of Personnel</label>
              <input id="guest-total-personnel" type="number" min="0" value={resource.total_personnel ?? ''} onChange={(event) => setResource({ ...resource, total_personnel: event.target.value ? Number(event.target.value) : null })} />
              <label htmlFor="guest-assignment">Incident Assignment</label>
              <input id="guest-assignment" value={resource.incident_assignment || ''} onChange={(event) => setResource({ ...resource, incident_assignment: event.target.value })} />
              <label htmlFor="guest-qualifications">Other Qualifications</label>
              <input id="guest-qualifications" value={resource.other_qualifications || ''} onChange={(event) => setResource({ ...resource, other_qualifications: event.target.value })} />
              <label htmlFor="guest-manifest">With Manifest?</label>
              <select id="guest-manifest" value={resource.with_manifest ? 'yes' : 'no'} onChange={(event) => setResource({ ...resource, with_manifest: event.target.value === 'yes' })}>
                <option value="no">No</option><option value="yes">Yes</option>
              </select>
              {message && <p className="form-message" role="status">{message}</p>}
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="login-button" type="submit" disabled={isSaving}>{isSaving ? 'Checking In...' : 'Check In Resource'}</button>
            </form>
          </>
        )}
        <p className="login-footer">No eICS account is required for this incident-specific check-in.</p>
      </section>
    </main>
  )
}

function OrganizationUnitTree({
  unit,
  units,
  assignments,
  positions,
  personnel,
  onAssign,
  onUnassign,
  assigningAssignmentId,
}: {
  unit: OrganizationUnit
  units: OrganizationUnit[]
  assignments: OrganizationAssignment[]
  positions: Map<string, OrganizationPosition>
  personnel: Map<string, OrganizationPersonnel>
  onAssign: (assignment: OrganizationAssignment) => void
  onUnassign: (assignment: OrganizationAssignment) => void
  assigningAssignmentId: string | null
}) {
  const childUnits = units.filter((child) => child.parent_unit_id === unit.id)
  const unitAssignments = assignments.filter(
    (assignment) => assignment.organizational_unit_id === unit.id,
  )

  return (
    <div className="organization-unit">
      <div className="organization-unit-card">
        <h4>{getOrganizationLabel(unit.name || unit.label || unit.title, 'Organizational Unit')}</h4>
        {unitAssignments.length > 0 && (
          <div className="organization-assignments">
            {unitAssignments.map((assignment) => (
              <div className="organization-assignment" key={assignment.id}>
                <strong>{getAssignmentPosition(assignment, positions)}</strong>
                <span>
                  {getAssignmentPersonnel(assignment, personnel)}
                  {assignment.personnel_id && personnel.get(assignment.personnel_id) && (
                    <small className="organization-resource-status">
                      {getResourceStatus(personnel.get(assignment.personnel_id)!)}
                    </small>
                  )}
                </span>
                <small>{getAssignmentStatus(assignment)}</small>
                <div className="organization-assignment-actions">
                  {assignment.personnel_id ? (
                    <button
                      className="organization-action-button"
                      type="button"
                      onClick={() => onUnassign(assignment)}
                      disabled={assigningAssignmentId === assignment.id}
                    >
                      Unassign
                    </button>
                  ) : (
                    <button
                      className="organization-action-button"
                      type="button"
                      onClick={() => onAssign(assignment)}
                      disabled={assigningAssignmentId === assignment.id}
                    >
                      {assigningAssignmentId === assignment.id ? 'Loading...' : 'Assign Personnel'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {childUnits.length > 0 && (
        <div className="organization-children">
          {childUnits.map((child) => (
            <OrganizationUnitTree
              key={child.id}
              unit={child}
              units={units}
              assignments={assignments}
              positions={positions}
              personnel={personnel}
              onAssign={onAssign}
              onUnassign={onUnassign}
              assigningAssignmentId={assigningAssignmentId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isAuthenticating, setIsAuthenticating] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileError, setProfileError] = useState('')
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [activePage, setActivePage] = useState<'dashboard' | 'incidents' | 'personnel' | 'user-management' | 'system-dashboard' | 'create-incident' | 'incident-details' | 'organization' | 'ics-211' | 'check-in-manifest' | 'resource-review'>('dashboard')
  const [incidentName, setIncidentName] = useState('')
  const [incidentType, setIncidentType] = useState('')
  const [incidentLocation, setIncidentLocation] = useState('')
  const [incidentDescription, setIncidentDescription] = useState('')
  const [incidentFormError, setIncidentFormError] = useState('')
  const [incidentFormMessage, setIncidentFormMessage] = useState('')
  const [isSavingIncident, setIsSavingIncident] = useState(false)
  const [activeIncidents, setActiveIncidents] = useState<Incident[]>([])
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(false)
  const [incidentsError, setIncidentsError] = useState('')
  const [allIncidents, setAllIncidents] = useState<Incident[]>([])
  const [isLoadingAllIncidents, setIsLoadingAllIncidents] = useState(false)
  const [allIncidentsError, setAllIncidentsError] = useState('')
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null)
  const [selectedIncident, setSelectedIncident] = useState<IncidentDetails | null>(null)
  const [incidentCommanderName, setIncidentCommanderName] = useState<string | null>(null)
  const [isLoadingIncidentDetails, setIsLoadingIncidentDetails] = useState(false)
  const [incidentDetailsError, setIncidentDetailsError] = useState('')
  const [commanderProfiles, setCommanderProfiles] = useState<CommanderProfile[]>([])
  const [isLoadingCommanderProfiles, setIsLoadingCommanderProfiles] = useState(false)
  const [commanderProfilesError, setCommanderProfilesError] = useState('')
  const [selectedCommanderId, setSelectedCommanderId] = useState('')
  const [isSavingCommander, setIsSavingCommander] = useState(false)
  const [commanderSaveMessage, setCommanderSaveMessage] = useState('')
  const [commanderSaveError, setCommanderSaveError] = useState('')
  const [incidentDetailsRefreshKey, setIncidentDetailsRefreshKey] = useState(0)
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [usersError, setUsersError] = useState('')
  const [roleOverrides, setRoleOverrides] = useState<Record<string, string>>({})
  const [savingRoleFor, setSavingRoleFor] = useState<string | null>(null)
  const [roleSaveErrors, setRoleSaveErrors] = useState<Record<string, string>>({})
  const [personnelIncident, setPersonnelIncident] = useState<Incident | null>(null)
  const [personnelIncidents, setPersonnelIncidents] = useState<Incident[]>([])
  const [selectedPersonnelIncidentId, setSelectedPersonnelIncidentId] = useState('')
  const [incidentPersonnel, setIncidentPersonnel] = useState<IncidentPersonnel[]>([])
  const [isLoadingPersonnel, setIsLoadingPersonnel] = useState(false)
  const [personnelError, setPersonnelError] = useState('')
  const [isCheckInFormOpen, setIsCheckInFormOpen] = useState(false)
  const [personnelName, setPersonnelName] = useState('')
  const [personnelOrganization, setPersonnelOrganization] = useState('')
  const [personnelPosition, setPersonnelPosition] = useState('')
  const [personnelContactNumber, setPersonnelContactNumber] = useState('')
  const [personnelFormError, setPersonnelFormError] = useState('')
  const [personnelMessage, setPersonnelMessage] = useState('')
  const [isSavingPersonnel, setIsSavingPersonnel] = useState(false)
  const [personnelRefreshKey, setPersonnelRefreshKey] = useState(0)
  const [personnelResources, setPersonnelResources] = useState<PersonnelResource[]>([])
  const [personnelRosterSearch, setPersonnelRosterSearch] = useState('')
  const [selectedPersonnelResourceId, setSelectedPersonnelResourceId] = useState('')
  const [isLoadingPersonnelResources, setIsLoadingPersonnelResources] = useState(false)
  const [personnelResourcesError, setPersonnelResourcesError] = useState('')
  const [isPersonnelRegistrationOpen, setIsPersonnelRegistrationOpen] = useState(false)
  const [registrationFirstName, setRegistrationFirstName] = useState('')
  const [registrationMiddleName, setRegistrationMiddleName] = useState('')
  const [registrationLastName, setRegistrationLastName] = useState('')
  const [registrationEmail, setRegistrationEmail] = useState('')
  const [registrationOrganization, setRegistrationOrganization] = useState('')
  const [registrationContactNumber, setRegistrationContactNumber] = useState('')
  const [registrationResourceStatus, setRegistrationResourceStatus] = useState('AVAILABLE')
  const [registrationError, setRegistrationError] = useState('')
  const [registrationMessage, setRegistrationMessage] = useState('')
  const [isSavingRegistration, setIsSavingRegistration] = useState(false)
  const [checkingOutPersonnelId, setCheckingOutPersonnelId] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState('')
  const [organizationData, setOrganizationData] = useState<OrganizationData | null>(null)
  const [isLoadingOrganization, setIsLoadingOrganization] = useState(false)
  const [organizationError, setOrganizationError] = useState('')
  const [assignmentToUpdate, setAssignmentToUpdate] = useState<OrganizationAssignment | null>(null)
  const [personnelSearch, setPersonnelSearch] = useState('')
  const [selectedPersonnelId, setSelectedPersonnelId] = useState('')
  const [assignmentError, setAssignmentError] = useState('')
  const [assignmentMessage, setAssignmentMessage] = useState('')
  const [isSavingAssignment, setIsSavingAssignment] = useState(false)
  const [assigningAssignmentId, setAssigningAssignmentId] = useState<string | null>(null)
  const [manifest, setManifest] = useState<CheckInManifest | null>(null)
  const [manifestResource, setManifestResource] = useState<Ics211Resource | null>(null)
  const [manifestResourceId, setManifestResourceId] = useState<string | null>(null)
  const [manifestResourceOptions, setManifestResourceOptions] = useState<{ id: string; resource_identifier: string; kind: string; type: string; agency_office_home_base: string | null }[]>([])
  const [manifestPersonnel, setManifestPersonnel] = useState<ManifestPersonnel[]>([])
  const [manifestVehicles, setManifestVehicles] = useState<ManifestVehicle[]>([])
  const [manifestEquipment, setManifestEquipment] = useState<ManifestEquipment[]>([])
  const [manifestOthers, setManifestOthers] = useState<ManifestOther[]>([])
  const [manifestError, setManifestError] = useState('')
  const [manifestMessage, setManifestMessage] = useState('')
  const [isLoadingManifest, setIsLoadingManifest] = useState(false)
  const [isSavingManifest, setIsSavingManifest] = useState(false)
  const [manifestRefreshKey, setManifestRefreshKey] = useState(0)
  const [manifestDraft, setManifestDraft] = useState({ agency_office_home_base: '', leader_name: '', contact_details: '', ics_211_resource_id: '' })

  useEffect(() => {
    if (!isLoggedIn || activePage !== 'check-in-manifest' || !selectedIncidentId) return
    let isMounted = true
    async function loadManifest() {
      setIsLoadingManifest(true)
      setManifestError('')
      setManifest(null)
      setManifestResource(null)
      setManifestResourceOptions([])
      setManifestPersonnel([])
      setManifestVehicles([])
      setManifestEquipment([])
      setManifestOthers([])
      let headerQuery = supabase
        .from('check_in_manifests')
        .select('id, incident_id, ics_211_resource_id, agency_office_home_base, leader_name, contact_details, total_personnel, total_vehicles, total_land_vehicles, total_water_vehicles, total_air_vehicles, total_equipment')
        .eq('incident_id', selectedIncidentId)
      if (manifestResourceId) {
        headerQuery = headerQuery.eq('ics_211_resource_id', manifestResourceId)
      } else {
        headerQuery = headerQuery.order('created_at', { ascending: false })
      }
      const { data: header, error: headerError } = await headerQuery.maybeSingle()
      if (!isMounted) return
      if (headerError) {
        setManifestError(`Unable to load the Check-In Manifest. ${headerError.message}`)
        setIsLoadingManifest(false)
        return
      }
      const { data: selectedResource } = manifestResourceId
        ? await supabase
          .from('ics_211_resources')
          .select('id, ics_211_id, order_request_no, check_in_at, kind, type, resource_identifier, resource_classification, agency_office_home_base, leader_name, contact_details, total_personnel, point_of_origin, departure_at, method_of_travel, with_manifest, incident_assignment, other_qualifications, data_sent_to_resl_at, manifest_reference, check_in_method')
          .eq('id', manifestResourceId)
          .maybeSingle()
        : { data: null }
      setManifestResource((selectedResource as Ics211Resource | null) || null)
      const { data: ics211 } = await supabase
        .from('ics_211')
        .select('id')
        .eq('incident_id', selectedIncidentId)
        .maybeSingle()
      const { data: resourceOptions } = ics211
        ? await supabase
          .from('ics_211_resources')
          .select('id, resource_identifier, kind, type, agency_office_home_base')
          .eq('ics_211_id', ics211.id)
          .order('resource_identifier')
        : { data: [] }
      setManifestResourceOptions(resourceOptions || [])
      setManifest(header as CheckInManifest | null)
      if (!header) {
        setManifestDraft({
          agency_office_home_base: '',
          leader_name: '',
          contact_details: '',
          ics_211_resource_id: manifestResourceId || '',
        })
        setIsLoadingManifest(false)
        return
      }
      setManifestDraft({
        agency_office_home_base: header.agency_office_home_base || '',
        leader_name: header.leader_name || '',
        contact_details: header.contact_details || '',
        ics_211_resource_id: header.ics_211_resource_id || '',
      })
      const [personnelResult, vehiclesResult, equipmentResult, othersResult] = await Promise.all([
        supabase.from('check_in_manifest_personnel').select('*').eq('manifest_id', header.id).order('created_at'),
        supabase.from('check_in_manifest_vehicles').select('*').eq('manifest_id', header.id).order('created_at'),
        supabase.from('check_in_manifest_equipment').select('*').eq('manifest_id', header.id).order('created_at'),
        supabase.from('check_in_manifest_others').select('id, manifest_id, description').eq('manifest_id', header.id).order('created_at'),
      ])
      if (!isMounted) return
      const queryError = personnelResult.error || vehiclesResult.error || equipmentResult.error || othersResult.error
      if (queryError) setManifestError(`Unable to load manifest details. ${queryError.message}`)
      setManifestPersonnel((personnelResult.data || []) as ManifestPersonnel[])
      setManifestVehicles((vehiclesResult.data || []) as ManifestVehicle[])
      setManifestEquipment((equipmentResult.data || []) as ManifestEquipment[])
      setManifestOthers((othersResult.data || []) as ManifestOther[])
      setIsLoadingManifest(false)
    }
    void loadManifest()
    return () => { isMounted = false }
  }, [activePage, isLoggedIn, selectedIncidentId, manifestResourceId, manifestRefreshKey])
  const [ics211Header, setIcs211Header] = useState<Ics211Header | null>(null)
  const [isLoadingIcs211Header, setIsLoadingIcs211Header] = useState(false)
  const [ics211HeaderError, setIcs211HeaderError] = useState('')
  const [ics211HeaderMessage, setIcs211HeaderMessage] = useState('')
  const [isSavingIcs211Header, setIsSavingIcs211Header] = useState(false)
  const [ics211HeaderDraft, setIcs211HeaderDraft] = useState({
    incident_start_date: '',
    incident_start_time: '',
    check_in_location: 'Base',
    check_in_location_other: '',
    prepared_by_name: '',
    prepared_by_signature: '',
    date_prepared: '',
    time_prepared: '',
    page_number: 1,
    total_pages: 1,
  })
  const [ics211ResourceDraft, setIcs211ResourceDraft] = useState<Ics211ResourceDraft>({ ...emptyIcs211ResourceDraft })
  const [editingIcs211ResourceId, setEditingIcs211ResourceId] = useState<string | null>(null)
  const [isSavingIcs211Resource, setIsSavingIcs211Resource] = useState(false)
  const [ics211Resources, setIcs211Resources] = useState<Ics211Resource[]>([])
  const [isLoadingIcs211, setIsLoadingIcs211] = useState(false)
  const [ics211Error, setIcs211Error] = useState('')
  const [ics211FormError, setIcs211FormError] = useState('')
  const [ics211Message, setIcs211Message] = useState('')
  const [guestCheckInLink, setGuestCheckInLink] = useState('')
  const [isCreatingGuestLink, setIsCreatingGuestLink] = useState(false)
  const [stage7Resources, setStage7Resources] = useState<Stage7Resource[]>([])
  const [isLoadingStage7, setIsLoadingStage7] = useState(false)
  const [stage7Error, setStage7Error] = useState('')
  const [stage7Message, setStage7Message] = useState('')
  const [stage7BusyResourceId, setStage7BusyResourceId] = useState<string | null>(null)

  const canReviewResources = profile?.role === 'administrator_trainer' || profile?.role === 'incident_commander'

  useEffect(() => {
    if (!isLoggedIn || activePage !== 'resource-review' || !selectedIncidentId) return
    let isMounted = true
    async function loadStage7Resources() {
      setIsLoadingStage7(true)
      setStage7Error('')
      setStage7Message('')
      const { data: header, error: headerError } = await supabase
        .from('ics_211')
        .select('id')
        .eq('incident_id', selectedIncidentId)
        .maybeSingle()
      if (headerError || !header) {
        setStage7Resources([])
        setStage7Error(headerError ? `Unable to load ICS 211 resources. ${headerError.message}` : 'No ICS 211 header exists for this incident.')
        setIsLoadingStage7(false)
        return
      }
      const { data: resources, error: resourcesError } = await supabase
        .from('ics_211_resources')
        .select('id, ics_211_id, order_request_no, check_in_at, kind, type, resource_identifier, resource_classification, agency_office_home_base, leader_name, contact_details, total_personnel, point_of_origin, departure_at, method_of_travel, with_manifest, incident_assignment, other_qualifications, data_sent_to_resl_at, manifest_reference, check_in_method, operational_classification, resource_status')
        .eq('ics_211_id', header.id)
        .order('check_in_at', { ascending: false })
      if (resourcesError) {
        setStage7Resources([])
        setStage7Error(`Unable to load resources. ${resourcesError.message}`)
        setIsLoadingStage7(false)
        return
      }
      const resourceIds = (resources ?? []).map((resource) => resource.id)
      const { data: manifests, error: manifestsError } = resourceIds.length > 0
        ? await supabase.from('check_in_manifests').select('id, ics_211_resource_id').eq('incident_id', selectedIncidentId).in('ics_211_resource_id', resourceIds)
        : { data: [], error: null }
      if (manifestsError) {
        setStage7Resources([])
        setStage7Error(`Unable to load resource manifests. ${manifestsError.message}`)
        setIsLoadingStage7(false)
        return
      }
      const manifestIds = (manifests ?? []).map((manifest) => manifest.id)
      const [personnelResult, vehiclesResult, equipmentResult, assignmentsResult] = await Promise.all([
        manifestIds.length > 0 ? supabase.from('check_in_manifest_personnel').select('manifest_id').in('manifest_id', manifestIds) : Promise.resolve({ data: [], error: null }),
        manifestIds.length > 0 ? supabase.from('check_in_manifest_vehicles').select('manifest_id').in('manifest_id', manifestIds) : Promise.resolve({ data: [], error: null }),
        manifestIds.length > 0 ? supabase.from('check_in_manifest_equipment').select('manifest_id').in('manifest_id', manifestIds) : Promise.resolve({ data: [], error: null }),
        supabase.from('ics_211_resource_assignments').select('id, ics_211_resource_id, assigned_at, assigned_by, assignment_status').eq('incident_id', selectedIncidentId).eq('assignment_status', 'ASSIGNED'),
      ])
      if (!isMounted) return
      const queryError = personnelResult.error || vehiclesResult.error || equipmentResult.error || assignmentsResult.error
      if (queryError) {
        setStage7Resources([])
        setStage7Error(`Unable to load the consolidated resource view. ${queryError.message}`)
        setIsLoadingStage7(false)
        return
      }
      const manifestByResource = new Map((manifests ?? []).map((manifest) => [manifest.ics_211_resource_id, manifest]))
      const assignmentByResource = new Map((assignmentsResult.data ?? []).map((assignment) => [assignment.ics_211_resource_id, assignment]))
      const countByManifest = (rows: { manifest_id: string }[]) => rows.reduce<Record<string, number>>((counts, row) => ({ ...counts, [row.manifest_id]: (counts[row.manifest_id] || 0) + 1 }), {})
      const personnelCounts = countByManifest((personnelResult.data ?? []) as { manifest_id: string }[])
      const vehicleCounts = countByManifest((vehiclesResult.data ?? []) as { manifest_id: string }[])
      const equipmentCounts = countByManifest((equipmentResult.data ?? []) as { manifest_id: string }[])
      setStage7Resources((resources ?? []).map((resource) => {
        const manifest = manifestByResource.get(resource.id)
        const assignment = assignmentByResource.get(resource.id)
        return {
          ...resource,
          incident_id: selectedIncidentId,
          manifest_id: manifest?.id || null,
          has_manifest: Boolean(manifest),
          manifest_personnel_count: manifest ? personnelCounts[manifest.id] || 0 : 0,
          manifest_vehicle_count: manifest ? vehicleCounts[manifest.id] || 0 : 0,
          manifest_equipment_count: manifest ? equipmentCounts[manifest.id] || 0 : 0,
          assignment_id: assignment?.id || null,
          assigned_at: assignment?.assigned_at || null,
          assigned_by: assignment?.assigned_by || null,
        }
      }) as Stage7Resource[])
      setIsLoadingStage7(false)
    }
    void loadStage7Resources()
    return () => { isMounted = false }
  }, [activePage, isLoggedIn, selectedIncidentId])

  const isAdministrator = profile?.role === 'administrator_trainer'

  useEffect(() => {
    if (!isLoggedIn || activePage !== 'ics-211' || !selectedIncidentId) {
      return
    }

    let isMounted = true
    async function loadIcs211Resources() {
      setIsLoadingIcs211(true)
      setIcs211Error('')
      setIsLoadingIcs211Header(true)
      const { data: header, error: headerError } = await supabase
        .from('ics_211')
        .select('id, incident_id, incident_start_date, incident_start_time, check_in_location, check_in_location_other, prepared_by_name, prepared_by_signature, date_prepared, time_prepared, page_number, total_pages')
        .eq('incident_id', selectedIncidentId)
        .maybeSingle()

      if (!isMounted) return
      if (headerError) {
        setIcs211HeaderError(`Unable to load the ICS 211 header. ${headerError.message}`)
      } else if (header) {
        setIcs211Header(header as Ics211Header)
        setIcs211HeaderDraft({
          incident_start_date: header.incident_start_date,
          incident_start_time: header.incident_start_time,
          check_in_location: header.check_in_location,
          check_in_location_other: header.check_in_location_other || '',
          prepared_by_name: header.prepared_by_name || '',
          prepared_by_signature: header.prepared_by_signature || '',
          date_prepared: header.date_prepared || '',
          time_prepared: header.time_prepared || '',
          page_number: header.page_number,
          total_pages: header.total_pages,
        })
      }
      setIsLoadingIcs211Header(false)

      if (headerError || !header) {
        setIcs211Resources([])
        setIsLoadingIcs211(false)
        return
      }

      const { data, error } = await supabase
        .from('ics_211_resources')
        .select('id, ics_211_id, order_request_no, check_in_at, kind, type, resource_identifier, resource_classification, agency_office_home_base, leader_name, contact_details, total_personnel, point_of_origin, departure_at, method_of_travel, with_manifest, incident_assignment, other_qualifications, data_sent_to_resl_at, manifest_reference, check_in_method')
        .eq('ics_211_id', header.id)
        .order('check_in_at', { ascending: false })

      if (!isMounted) return
      if (error) {
        setIcs211Resources([])
        setIcs211Error(`Unable to load ICS 211 resources. ${error.message}`)
      } else {
        const resources = (data ?? []) as Ics211Resource[]
        const { data: manifests } = await supabase
          .from('check_in_manifests')
          .select('id, ics_211_resource_id')
          .eq('incident_id', selectedIncidentId)
          .not('ics_211_resource_id', 'is', null)
        const manifestIds = new Map((manifests ?? []).map((item) => [item.ics_211_resource_id, item.id]))
        setIcs211Resources(resources.map((resource) => ({ ...resource, manifest_id: manifestIds.get(resource.id) || null })))
      }
      setIsLoadingIcs211(false)
    }

    void loadIcs211Resources()
    return () => { isMounted = false }
  }, [activePage, isLoggedIn, selectedIncidentId])

  useEffect(() => {
    let isMounted = true

    async function loadProfile(userId: string) {
      setIsLoadingProfile(true)
      setProfileError('')

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', userId)
        .single()

      if (!isMounted) {
        return
      }

      if (error) {
        setProfile(null)
        setProfileError('Unable to load your profile.')
      } else if (!data) {
        setProfile(null)
        setProfileError('No profile found for this account.')
      } else {
        setProfile(data)
      }

      setIsLoadingProfile(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) {
        return
      }

      setIsLoggedIn(Boolean(session))
      setIsAuthenticating(false)

      if (session) {
        void loadProfile(session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setIsLoggedIn(Boolean(session))

        if (session) {
          void loadProfile(session.user.id)
        } else {
          setProfile(null)
          setProfileError('')
        }
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!isLoggedIn || activePage !== 'user-management' || !isAdministrator) {
      return
    }

    let isMounted = true

    async function loadUsers() {
      setIsLoadingUsers(true)
      setUsersError('')

      const { data: profiles, error } = await loadAllProfiles()

      if (!isMounted) {
        return
      }

      if (error) {
        setManagedUsers([])
        setUsersError('Unable to load users.')
      } else {
        setManagedUsers(profiles)
      }

      setIsLoadingUsers(false)
    }

    void loadUsers()

    return () => {
      isMounted = false
    }
  }, [activePage, isAdministrator, isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn || activePage !== 'incident-details' || !selectedIncidentId) {
      return
    }

    let isMounted = true

    async function loadIncidentDetails() {
      setIsLoadingIncidentDetails(true)
      setIncidentDetailsError('')
      setSelectedIncident(null)
      setIncidentCommanderName(null)
      setSelectedCommanderId('')

      const { data, error } = await supabase
        .from('incidents')
        .select('id, name, incident_type, location, description, status, incident_commander_id, created_at')
        .eq('id', selectedIncidentId)
        .maybeSingle()

      if (!isMounted) {
        return
      }

      if (error || !data) {
        setIncidentDetailsError(error ? 'Unable to load this incident.' : 'Incident not found.')
        setIsLoadingIncidentDetails(false)
        return
      }

      let commanderName: string | null = null
      if (data.incident_commander_id) {
        const { data: commander } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.incident_commander_id)
          .maybeSingle()

        commanderName = commander?.full_name ?? null
      }

      if (!isMounted) {
        return
      }

      setSelectedIncident(data)
      setIncidentCommanderName(commanderName)
      setSelectedCommanderId(data.incident_commander_id ?? '')
      setIsLoadingIncidentDetails(false)
    }

    void loadIncidentDetails()

    return () => {
      isMounted = false
    }
  }, [activePage, isLoggedIn, selectedIncidentId, incidentDetailsRefreshKey])

  useEffect(() => {
    if (!isLoggedIn || activePage !== 'organization' || !selectedIncidentId) {
      return
    }

    let isMounted = true

    async function loadOrganization() {
      setIsLoadingOrganization(true)
      setOrganizationError('')
      setOrganizationData(null)

      const [unitsResult, assignmentsResult, positionsResult, personnelResult] = await Promise.all([
        supabase
          .from('organizational_units')
          .select('*')
          .eq('incident_id', selectedIncidentId),
        supabase
          .from('incident_assignments')
          .select('*')
          .eq('incident_id', selectedIncidentId),
        supabase.from('positions').select('*'),
        supabase.from('personnel').select('*'),
      ])

      if (!isMounted) {
        return
      }

      const queryError = unitsResult.error || assignmentsResult.error || positionsResult.error || personnelResult.error
      if (queryError) {
        setOrganizationError(`Unable to load the ICS organization. ${queryError.message}`)
      } else {
        setOrganizationData({
          units: (unitsResult.data ?? []) as OrganizationUnit[],
          assignments: (assignmentsResult.data ?? []) as OrganizationAssignment[],
          positions: (positionsResult.data ?? []) as OrganizationPosition[],
          personnel: (personnelResult.data ?? []) as OrganizationPersonnel[],
        })
      }

      setIsLoadingOrganization(false)
    }

    void loadOrganization()

    return () => {
      isMounted = false
    }
  }, [activePage, isLoggedIn, selectedIncidentId])

  useEffect(() => {
    if (!isLoggedIn || activePage !== 'incident-details' || profile?.role !== 'administrator_trainer') {
      return
    }

    let isMounted = true

    async function loadCommanderProfiles() {
      setIsLoadingCommanderProfiles(true)
      setCommanderProfilesError('')

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'incident_commander')
        .order('full_name')

      if (!isMounted) {
        return
      }

      if (error) {
        setCommanderProfiles([])
        setCommanderProfilesError('Unable to load Incident Commander profiles.')
      } else {
        setCommanderProfiles(data ?? [])
      }

      setIsLoadingCommanderProfiles(false)
    }

    void loadCommanderProfiles()

    return () => {
      isMounted = false
    }
  }, [activePage, isLoggedIn, profile?.role])

  useEffect(() => {
    if (!isLoggedIn || activePage !== 'dashboard') {
      return
    }

    let isMounted = true

    async function loadActiveIncidents() {
      setIsLoadingIncidents(true)
      setIncidentsError('')

      const { data, error } = await supabase
        .from('incidents')
        .select('id, name, incident_type, location, status, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (!isMounted) {
        return
      }

      if (error) {
        setActiveIncidents([])
        setIncidentsError('Unable to load active incidents.')
      } else {
        setActiveIncidents(data ?? [])
      }

      setIsLoadingIncidents(false)
    }

    void loadActiveIncidents()

    return () => {
      isMounted = false
    }
  }, [activePage, isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn || activePage !== 'incidents') {
      return
    }

    let isMounted = true

    async function loadAllIncidents() {
      setIsLoadingAllIncidents(true)
      setAllIncidentsError('')

      const { data, error } = await supabase
        .from('incidents')
        .select('id, name, incident_type, location, status, created_at')
        .order('created_at', { ascending: false })

      if (!isMounted) {
        return
      }

      if (error) {
        setAllIncidents([])
        setAllIncidentsError('Unable to load incidents.')
      } else {
        setAllIncidents(data ?? [])
      }

      setIsLoadingAllIncidents(false)
    }

    void loadAllIncidents()

    return () => {
      isMounted = false
    }
  }, [activePage, isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn || activePage !== 'personnel') {
      return
    }

    let isMounted = true

    async function loadPersonnel() {
      setIsLoadingPersonnel(true)
      setPersonnelError('')
      setIsLoadingPersonnelResources(true)
      setPersonnelResourcesError('')

      const [{ data: activeIncidentsForPersonnel, error: incidentError }, { data: resources, error: resourcesError }] = await Promise.all([
        supabase
          .from('incidents')
          .select('id, name, incident_type, location, status, created_at')
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
        supabase.from('personnel').select('*').order('last_name').order('first_name'),
      ])

      if (!isMounted) {
        return
      }

      if (incidentError) {
        setPersonnelIncident(null)
        setPersonnelIncidents([])
        setIncidentPersonnel([])
        setPersonnelError('Unable to load the active incident.')
        setPersonnelResources([])
        setPersonnelResourcesError(resourcesError ? 'Unable to load the personnel roster.' : '')
        setIsLoadingPersonnelResources(false)
        setIsLoadingPersonnel(false)
        return
      }

      const availableIncidents = activeIncidentsForPersonnel ?? []
      const selectedIncident = availableIncidents.find((incident) => incident.id === selectedPersonnelIncidentId)
        ?? availableIncidents[0]

      setPersonnelIncidents(availableIncidents)
      if (selectedIncident && selectedIncident.id !== selectedPersonnelIncidentId) {
        setSelectedPersonnelIncidentId(selectedIncident.id)
      }

      if (!selectedIncident) {
        setPersonnelIncident(null)
        setIncidentPersonnel([])
        setPersonnelError('No active incident is available for check-in.')
        setPersonnelResources(resourcesError ? [] : (resources ?? []) as PersonnelResource[])
        setPersonnelResourcesError(resourcesError ? 'Unable to load the personnel roster.' : '')
        setIsLoadingPersonnelResources(false)
        setIsLoadingPersonnel(false)
        return
      }

      const { data: personnel, error: personnelLoadError } = await supabase
        .from('incident_personnel')
        .select('id, full_name, organization, position, check_in_time, check_out_time, status')
        .eq('incident_id', selectedIncident.id)
        .order('check_in_time', { ascending: false })

      if (!isMounted) {
        return
      }

      setPersonnelIncident(selectedIncident)
      if (personnelLoadError) {
        setIncidentPersonnel([])
        setPersonnelError('Unable to load checked-in personnel.')
      } else {
        setIncidentPersonnel(personnel ?? [])
      }
      if (resourcesError) {
        setPersonnelResources([])
        setPersonnelResourcesError('Unable to load the personnel roster.')
      } else {
        setPersonnelResources((resources ?? []) as PersonnelResource[])
      }
      setIsLoadingPersonnelResources(false)
      setIsLoadingPersonnel(false)
    }

    void loadPersonnel()

    return () => {
      isMounted = false
    }
  }, [activePage, isLoggedIn, personnelRefreshKey, selectedPersonnelIncidentId])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoginError('')
    setIsAuthenticating(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setLoginError(error.message)
    }

    setIsAuthenticating(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setEmail('')
    setPassword('')
    setProfile(null)
    setProfileError('')
    setActiveIncidents([])
    setIncidentsError('')
    setAllIncidents([])
    setAllIncidentsError('')
    setSelectedIncidentId(null)
    setSelectedIncident(null)
    setIncidentCommanderName(null)
    setIncidentDetailsError('')
    setCommanderProfiles([])
    setCommanderProfilesError('')
    setSelectedCommanderId('')
    setCommanderSaveMessage('')
    setCommanderSaveError('')
    setOrganizationData(null)
    setOrganizationError('')
    setAssignmentToUpdate(null)
    setAssignmentError('')
    setAssignmentMessage('')
    setAssignmentToUpdate(null)
    setAssignmentError('')
    setAssignmentMessage('')
    setManagedUsers([])
    setUsersError('')
    setRoleOverrides({})
    setSavingRoleFor(null)
    setRoleSaveErrors({})
    setPersonnelIncident(null)
    setPersonnelIncidents([])
    setSelectedPersonnelIncidentId('')
    setIncidentPersonnel([])
    setPersonnelError('')
    setIsCheckInFormOpen(false)
    setPersonnelResources([])
    setPersonnelRosterSearch('')
    setSelectedPersonnelResourceId('')
    setPersonnelResourcesError('')
    setIsPersonnelRegistrationOpen(false)
    setRegistrationError('')
    setRegistrationMessage('')
    setCheckingOutPersonnelId(null)
    setCheckoutError('')
  }

  async function handleRoleChange(user: ManagedUser, selectedRole: string) {
    const selectedOption = roleOptions.find((option) => option.label === selectedRole)

    if (!selectedOption) {
      return
    }

    const previousOverride = roleOverrides[user.id]

    setRoleOverrides((currentOverrides) => ({
      ...currentOverrides,
      [user.id]: selectedRole,
    }))
    setRoleSaveErrors((currentErrors) => {
      const nextErrors = { ...currentErrors }
      delete nextErrors[user.id]
      return nextErrors
    })
    setSavingRoleFor(user.id)

    const { error } = await supabase.rpc('update_user_role', {
      target_user_id: user.id,
      new_role: selectedOption.value,
    })

    if (error) {
      setRoleOverrides((currentOverrides) => {
        const nextOverrides = { ...currentOverrides }
        if (previousOverride) {
          nextOverrides[user.id] = previousOverride
        } else {
          delete nextOverrides[user.id]
        }
        return nextOverrides
      })
      setRoleSaveErrors((currentErrors) => ({
        ...currentErrors,
        [user.id]: `Unable to update role. ${error.message}`,
      }))
      setSavingRoleFor(null)
      return
    }

    const { data, error: refreshError } = await loadAllProfiles()

    if (refreshError) {
      setUsersError('Role updated, but users could not be refreshed.')
    } else {
      setManagedUsers(data ?? [])
      setRoleOverrides((currentOverrides) => {
        const nextOverrides = { ...currentOverrides }
        delete nextOverrides[user.id]
        return nextOverrides
      })
    }

    setRoleSaveErrors((currentErrors) => {
      const nextErrors = { ...currentErrors }
      delete nextErrors[user.id]
      return nextErrors
    })
    setSavingRoleFor(null)
  }

  async function handleCreateIncident(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!incidentName.trim()) {
      setIncidentFormError('Incident Name is required.')
      setIncidentFormMessage('')
      return
    }

    setIsSavingIncident(true)
    setIncidentFormError('')

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      setIncidentFormError('Your session has expired. Please sign in again.')
      setIsSavingIncident(false)
      return
    }

    const { data: incident, error } = await supabase
      .from('incidents')
      .insert({
        name: incidentName.trim(),
        incident_type: incidentType.trim(),
        location: incidentLocation.trim(),
        description: incidentDescription.trim(),
        created_by: session.user.id,
      })
      .select('id')
      .single()

    if (error || !incident) {
      setIncidentFormError(
        `Unable to create incident. ${error?.message || 'No incident ID was returned.'}`,
      )
      setIsSavingIncident(false)
      return
    }

    const { error: organizationError } = await supabase.rpc(
      'create_default_ics_organization',
      {
        p_incident_id: incident.id,
      },
    )

    if (organizationError) {
      setIncidentFormError(
        `Incident created, but the default ICS organization could not be created. ${organizationError.message}`,
      )
      setIsSavingIncident(false)
      return
    }

    setIncidentName('')
    setIncidentType('')
    setIncidentLocation('')
    setIncidentDescription('')
    setIncidentFormMessage('Incident created successfully.')
    setIsSavingIncident(false)
    setActivePage('dashboard')
  }

  function handleCancelIncident() {
    setIncidentName('')
    setIncidentType('')
    setIncidentLocation('')
    setIncidentDescription('')
    setIncidentFormError('')
    setIncidentFormMessage('')
    setIsSavingIncident(false)
    setActivePage('dashboard')
  }

  function openCreateIncident() {
    setIncidentFormError('')
    setIncidentFormMessage('')
    setActivePage('create-incident')
  }

  function openIncidents() {
    setActivePage('incidents')
  }

  function openPersonnel() {
    setPersonnelFormError('')
    setPersonnelMessage('')
    setRegistrationError('')
    setRegistrationMessage('')
    setActivePage('personnel')
  }

  function resetRegistrationForm() {
    setRegistrationFirstName('')
    setRegistrationMiddleName('')
    setRegistrationLastName('')
    setRegistrationEmail('')
    setRegistrationOrganization('')
    setRegistrationContactNumber('')
    setRegistrationResourceStatus('AVAILABLE')
    setRegistrationError('')
    setIsPersonnelRegistrationOpen(false)
  }

  async function handleRegisterPersonnel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!registrationFirstName.trim() || !registrationLastName.trim()) {
      setRegistrationError('First Name and Last Name are required.')
      return
    }

    setIsSavingRegistration(true)
    setRegistrationError('')
    setRegistrationMessage('')

    const { error } = await supabase.from('personnel').insert({
      first_name: registrationFirstName.trim(),
      middle_name: registrationMiddleName.trim() || null,
      last_name: registrationLastName.trim(),
      email: registrationEmail.trim() || null,
      organization: registrationOrganization.trim() || null,
      contact_number: registrationContactNumber.trim() || null,
      resource_status: registrationResourceStatus,
    })

    if (error) {
      setRegistrationError(`Unable to register personnel. ${error.message}`)
      setIsSavingRegistration(false)
      return
    }

    resetRegistrationForm()
    setRegistrationMessage('Personnel registered successfully.')
    setIsSavingRegistration(false)
    setPersonnelRefreshKey((currentKey) => currentKey + 1)
  }

  function resetPersonnelForm() {
    setPersonnelName('')
    setPersonnelOrganization('')
    setPersonnelPosition('')
    setPersonnelContactNumber('')
    setPersonnelFormError('')
    setPersonnelRosterSearch('')
    setSelectedPersonnelResourceId('')
    setIsCheckInFormOpen(false)
  }

  function selectPersonnelResource(personnelId: string) {
    const resource = personnelResources.find((person) => person.id === personnelId)
    setSelectedPersonnelResourceId(personnelId)

    if (!resource) {
      return
    }

    setPersonnelName(getPersonnelResourceName(resource))
    setPersonnelOrganization(resource.organization || resource.agency || '')
    setPersonnelPosition(resource.position || '')
    setPersonnelContactNumber(resource.contact_number || '')
  }

  async function handlePersonnelCheckIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!personnelName.trim()) {
      setPersonnelFormError('Full Name is required.')
      return
    }

    if (!selectedPersonnelResourceId) {
      setPersonnelFormError('Select a personnel record before checking in.')
      return
    }

    if (!personnelIncident) {
      setPersonnelFormError('No active incident is available for check-in.')
      return
    }

    setIsSavingPersonnel(true)
    setPersonnelFormError('')
    setPersonnelMessage('')

    const { data: { session } } = await supabase.auth.getSession()
    const selectedResource = personnelResources.find((person) => person.id === selectedPersonnelResourceId)
    let profileId: string | null = selectedResource?.profile_id ?? null

    if (!profileId && session && session.user.id === selectedPersonnelResourceId) {
      const { data: matchingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle()

      profileId = matchingProfile?.id ?? null
    }

    const { error } = await supabase.from('incident_personnel').insert({
      incident_id: personnelIncident.id,
      profile_id: profileId,
      full_name: personnelName.trim(),
      organization: personnelOrganization.trim(),
      position: personnelPosition.trim(),
      contact_number: personnelContactNumber.trim(),
    })

    if (error) {
      setPersonnelFormError(`Unable to check in personnel. ${error.message}`)
      setIsSavingPersonnel(false)
      return
    }

    resetPersonnelForm()
    setPersonnelMessage('Personnel checked in successfully.')
    setIsSavingPersonnel(false)
    setPersonnelRefreshKey((currentKey) => currentKey + 1)
  }

  async function handlePersonnelCheckOut(personnelId: string) {
    setCheckingOutPersonnelId(personnelId)
    setCheckoutError('')
    setPersonnelMessage('')

    const { error } = await supabase
      .from('incident_personnel')
      .update({
        status: 'checked_out',
        check_out_time: new Date().toISOString(),
      })
      .eq('id', personnelId)

    if (error) {
      setCheckoutError(`Unable to check out personnel. ${error.message}`)
      setCheckingOutPersonnelId(null)
      return
    }

    setPersonnelMessage('Personnel checked out successfully.')
    setCheckingOutPersonnelId(null)
    setPersonnelRefreshKey((currentKey) => currentKey + 1)
  }

  async function handleSaveIcs211Header(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedIncidentId || !ics211HeaderDraft.incident_start_date || !ics211HeaderDraft.incident_start_time) {
      setIcs211HeaderError('Incident start date and time are required.')
      return
    }

    setIsSavingIcs211Header(true)
    setIcs211HeaderError('')
    setIcs211HeaderMessage('')
    const headerPayload = {
      ...ics211HeaderDraft,
      check_in_location_other: ics211HeaderDraft.check_in_location === 'Others' ? ics211HeaderDraft.check_in_location_other.trim() : null,
      prepared_by_name: ics211HeaderDraft.prepared_by_name.trim() || null,
      prepared_by_signature: ics211HeaderDraft.prepared_by_signature.trim() || null,
      date_prepared: ics211HeaderDraft.date_prepared || null,
      time_prepared: ics211HeaderDraft.time_prepared || null,
    }
    const result = ics211Header
      ? await supabase.from('ics_211').update(headerPayload).eq('id', ics211Header.id).select('id, incident_id, incident_start_date, incident_start_time, check_in_location, check_in_location_other, prepared_by_name, prepared_by_signature, date_prepared, time_prepared, page_number, total_pages').single()
      : await supabase.from('ics_211').insert({ incident_id: selectedIncidentId, ...headerPayload }).select('id, incident_id, incident_start_date, incident_start_time, check_in_location, check_in_location_other, prepared_by_name, prepared_by_signature, date_prepared, time_prepared, page_number, total_pages').single()

    if (result.error || !result.data) {
      setIcs211HeaderError(`Unable to save the ICS 211 header. ${result.error?.message || 'No header was returned.'}`)
    } else {
      setIcs211Header(result.data as Ics211Header)
      setIcs211HeaderMessage('ICS 211 header saved successfully.')
    }
    setIsSavingIcs211Header(false)
  }

  async function handleSaveIcs211Resource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ics211Header || !ics211ResourceDraft.kind.trim() || !ics211ResourceDraft.type.trim() || !ics211ResourceDraft.resource_identifier.trim()) {
      setIcs211FormError('Kind, Type, and Resource Identifier are required.')
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setIcs211FormError('Your session has expired. Please sign in again.')
      return
    }

    setIsSavingIcs211Resource(true)
    setIcs211FormError('')
    setIcs211Message('')
    const resourcePayload = {
      ...ics211ResourceDraft,
      order_request_no: ics211ResourceDraft.order_request_no?.trim() || null,
      check_in_at: ics211ResourceDraft.check_in_at || new Date().toISOString(),
      agency_office_home_base: ics211ResourceDraft.agency_office_home_base?.trim() || null,
      leader_name: ics211ResourceDraft.leader_name?.trim() || null,
      contact_details: ics211ResourceDraft.contact_details?.trim() || null,
      point_of_origin: ics211ResourceDraft.point_of_origin?.trim() || null,
      method_of_travel: ics211ResourceDraft.method_of_travel?.trim() || null,
      incident_assignment: ics211ResourceDraft.incident_assignment?.trim() || null,
      other_qualifications: ics211ResourceDraft.other_qualifications?.trim() || null,
      data_sent_to_resl_at: ics211ResourceDraft.data_sent_to_resl_at || null,
      manifest_reference: ics211ResourceDraft.manifest_reference?.trim() || null,
      ics_211_id: ics211Header.id,
      check_in_method: 'authenticated',
      checked_in_by: session.user.id,
    }
    const result = editingIcs211ResourceId
      ? await supabase.from('ics_211_resources').update(resourcePayload).eq('id', editingIcs211ResourceId).select('*').single()
      : await supabase.from('ics_211_resources').insert(resourcePayload).select('*').single()

    if (result.error || !result.data) {
      setIcs211FormError(`Unable to save resource. ${result.error?.message || 'No resource was returned.'}`)
    } else {
      setIcs211Resources((current) => editingIcs211ResourceId
        ? current.map((resource) => resource.id === editingIcs211ResourceId ? result.data as Ics211Resource : resource)
        : [result.data as Ics211Resource, ...current])
      setIcs211ResourceDraft({ ...emptyIcs211ResourceDraft })
      setEditingIcs211ResourceId(null)
      setIcs211Message(editingIcs211ResourceId ? 'Resource updated successfully.' : 'Resource checked in successfully.')
    }
    setIsSavingIcs211Resource(false)
  }

  function editIcs211Resource(resource: Ics211Resource) {
    setEditingIcs211ResourceId(resource.id)
    setIcs211ResourceDraft({
      order_request_no: resource.order_request_no,
      check_in_at: resource.check_in_at?.slice(0, 16) || '',
      kind: resource.kind,
      type: resource.type,
      resource_identifier: resource.resource_identifier,
      resource_classification: resource.resource_classification,
      agency_office_home_base: resource.agency_office_home_base,
      leader_name: resource.leader_name,
      contact_details: resource.contact_details,
      total_personnel: resource.total_personnel,
      point_of_origin: resource.point_of_origin,
      departure_at: resource.departure_at?.slice(0, 16) || null,
      method_of_travel: resource.method_of_travel,
      with_manifest: resource.with_manifest,
      incident_assignment: resource.incident_assignment,
      other_qualifications: resource.other_qualifications,
      data_sent_to_resl_at: resource.data_sent_to_resl_at?.slice(0, 16) || null,
      manifest_reference: resource.manifest_reference,
    })
  }

  function openIncidentDetails(incidentId: string) {
    setSelectedIncidentId(incidentId)
    setIncidentDetailsError('')
    setCommanderSaveMessage('')
    setCommanderSaveError('')
    setActivePage('incident-details')
  }

  function openOrganization(incidentId: string) {
    setSelectedIncidentId(incidentId)
    setOrganizationError('')
    setOrganizationData(null)
    setAssignmentMessage('')
    setAssignmentError('')
    setActivePage('organization')
  }

  function openIcs211(incidentId: string) {
    setSelectedIncidentId(incidentId)
    setIcs211Error('')
    setIcs211FormError('')
    setIcs211Message('')
    setActivePage('ics-211')
  }

  function openCheckInManifest(incidentId: string) {
    setSelectedIncidentId(incidentId)
    setManifestResourceId(null)
    setManifestError('')
    setManifestMessage('')
    setActivePage('check-in-manifest')
  }

  function openResourceReview(incidentId: string) {
    setSelectedIncidentId(incidentId)
    setStage7Error('')
    setStage7Message('')
    setActivePage('resource-review')
  }

  async function classifyStage7Resource(resource: Stage7Resource, classification: 'IMT RESOURCE' | 'TACTICAL RESOURCE') {
    if (!canReviewResources) return
    setStage7BusyResourceId(resource.id)
    setStage7Error('')
    setStage7Message('')
    const { error } = await supabase.rpc('classify_ics_211_resource', {
      p_resource_id: resource.id,
      p_classification: classification,
    })
    if (error) {
      setStage7Error(`Unable to classify resource. ${error.message}`)
    } else {
      setStage7Resources((current) => current.map((item) => item.id === resource.id ? { ...item, operational_classification: classification } : item))
      setStage7Message('Resource classification saved.')
    }
    setStage7BusyResourceId(null)
  }

  async function assignStage7Resource(resource: Stage7Resource) {
    if (!canReviewResources || resource.resource_status !== 'AVAILABLE') return
    if (!window.confirm(`Assign ${resource.resource_identifier}?`)) return
    setStage7BusyResourceId(resource.id)
    setStage7Error('')
    setStage7Message('')
    const { data, error } = await supabase.rpc('assign_ics_211_resource', { p_resource_id: resource.id })
    if (error) {
      setStage7Error(`Unable to assign resource. ${error.message}`)
    } else {
      setStage7Resources((current) => current.map((item) => item.id === resource.id ? { ...item, resource_status: 'ASSIGNED', assignment_id: data?.id || 'assigned', assigned_at: data?.assigned_at || new Date().toISOString() } : item))
      setStage7Message('Resource assigned successfully.')
    }
    setStage7BusyResourceId(null)
  }

  async function releaseStage7Resource(resource: Stage7Resource) {
    if (!canReviewResources || resource.resource_status !== 'ASSIGNED') return
    if (!window.confirm(`Release ${resource.resource_identifier}?`)) return
    setStage7BusyResourceId(resource.id)
    setStage7Error('')
    setStage7Message('')
    const { error } = await supabase.rpc('release_ics_211_resource', { p_resource_id: resource.id })
    if (error) {
      setStage7Error(`Unable to release resource. ${error.message}`)
    } else {
      setStage7Resources((current) => current.map((item) => item.id === resource.id ? { ...item, resource_status: 'AVAILABLE', assignment_id: null, assigned_at: null, assigned_by: null } : item))
      setStage7Message('Resource released and returned to AVAILABLE.')
    }
    setStage7BusyResourceId(null)
  }

  async function openManifestForResource(resource: Ics211Resource, incidentId: string) {
    setSelectedIncidentId(incidentId)
    setManifestResourceId(resource.id)
    setManifestError('')
    setManifestMessage('')
    setActivePage('check-in-manifest')
  }

  function createManifestRowId() {
    return `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }

  function addManifestPersonnelRow() {
    setManifestPersonnel((rows) => [...rows, { id: createManifestRowId(), manifest_id: manifest?.id || '', ...emptyManifestPersonnel }])
  }

  function addManifestVehicleRow() {
    setManifestVehicles((rows) => [...rows, { id: createManifestRowId(), manifest_id: manifest?.id || '', ...emptyManifestVehicle }])
  }

  function addManifestEquipmentRow() {
    setManifestEquipment((rows) => [...rows, { id: createManifestRowId(), manifest_id: manifest?.id || '', ...emptyManifestEquipment }])
  }

  function addManifestOtherRow() {
    setManifestOthers((rows) => [...rows, { id: createManifestRowId(), manifest_id: manifest?.id || '', description: '' }])
  }

  function updateManifestPersonnelRow(id: string, field: keyof ManifestPersonnelDraft, value: string | number | null) {
    setManifestPersonnel((rows) => rows.map((row) => row.id === id ? { ...row, [field]: value } : row))
  }

  function updateManifestVehicleRow(id: string, field: keyof ManifestVehicleDraft, value: string | number | null) {
    setManifestVehicles((rows) => rows.map((row) => row.id === id ? { ...row, [field]: value } : row))
  }

  function updateManifestEquipmentRow(id: string, field: keyof ManifestEquipmentDraft, value: string | number | null) {
    setManifestEquipment((rows) => rows.map((row) => row.id === id ? { ...row, [field]: value } : row))
  }

  function updateManifestOtherRow(id: string, description: string) {
    setManifestOthers((rows) => rows.map((row) => row.id === id ? { ...row, description } : row))
  }

  async function saveManifestRows<T extends { id: string; manifest_id: string }>(
    table: 'check_in_manifest_personnel' | 'check_in_manifest_vehicles' | 'check_in_manifest_equipment' | 'check_in_manifest_others',
    rows: T[],
    manifestId: string,
  ) {
    const { data: existingRows, error: existingError } = await supabase.from(table).select('id').eq('manifest_id', manifestId)
    if (existingError) throw existingError
    const currentPersistedIds = new Set(rows.filter((row) => !row.id.startsWith('draft-')).map((row) => row.id))
    const idsToDelete = (existingRows || []).map((row) => row.id).filter((id) => !currentPersistedIds.has(id))
    if (idsToDelete.length > 0) {
      const { error } = await supabase.from(table).delete().in('id', idsToDelete).eq('manifest_id', manifestId)
      if (error) throw error
    }
    const savedRows: T[] = []
    for (const row of rows) {
      const payload = { ...row } as Record<string, unknown>
      delete payload.id
      delete payload.manifest_id
      const result = row.id.startsWith('draft-')
        ? await supabase.from(table).insert({ ...payload, manifest_id: manifestId }).select('*').single()
        : await supabase.from(table).update(payload).eq('id', row.id).eq('manifest_id', manifestId).select('*').single()
      if (result.error || !result.data) throw result.error || new Error(`Unable to save ${table} row.`)
      savedRows.push(result.data as T)
    }
    return savedRows
  }

  async function saveManifest() {
    if (!selectedIncidentId) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setManifestError('Your session has expired. Please sign in again.')
      return
    }
    const invalidPersonnel = manifestPersonnel.some((row) => !row.name.trim())
    const invalidOthers = manifestOthers.some((row) => !row.description.trim())
    if (invalidPersonnel || invalidOthers) {
      setManifestError('Complete or remove empty Personnel and Others rows before saving.')
      return
    }
    setIsSavingManifest(true)
    setManifestError('')
    setManifestMessage('')
    try {
      const counts = {
        total_personnel: manifestPersonnel.length,
        total_vehicles: manifestVehicles.length,
        total_land_vehicles: manifestVehicles.filter((vehicle) => vehicle.vehicle_category === 'LAND').length,
        total_water_vehicles: manifestVehicles.filter((vehicle) => vehicle.vehicle_category === 'WATER').length,
        total_air_vehicles: manifestVehicles.filter((vehicle) => vehicle.vehicle_category === 'AIR').length,
        total_equipment: manifestEquipment.length,
      }
      const payload = {
        incident_id: selectedIncidentId,
        ics_211_resource_id: manifestResourceId || manifestDraft.ics_211_resource_id || null,
        agency_office_home_base: manifestDraft.agency_office_home_base.trim() || null,
        leader_name: manifestDraft.leader_name.trim() || null,
        contact_details: manifestDraft.contact_details.trim() || null,
        ...counts,
      }
      const headerResult = manifest
        ? await supabase.from('check_in_manifests').update(payload).eq('id', manifest.id).select('*').single()
        : await supabase.from('check_in_manifests').insert({ ...payload, created_by: session.user.id }).select('*').single()
      if (headerResult.error || !headerResult.data) throw headerResult.error || new Error('No manifest was returned.')
      const manifestId = headerResult.data.id as string
      await saveManifestRows('check_in_manifest_personnel', manifestPersonnel, manifestId)
      await saveManifestRows('check_in_manifest_vehicles', manifestVehicles, manifestId)
      await saveManifestRows('check_in_manifest_equipment', manifestEquipment, manifestId)
      await saveManifestRows('check_in_manifest_others', manifestOthers, manifestId)
      setManifestMessage('Manifest and all rows saved successfully. Reloading...')
      setManifestRefreshKey((currentKey) => currentKey + 1)
    } catch (error) {
      setManifestError(`Unable to save the complete manifest. ${error instanceof Error ? error.message : 'Please try again.'}`)
    } finally {
      setIsSavingManifest(false)
    }
  }

  function deleteManifestRow(table: string, id: string) {
    if (table === 'check_in_manifest_personnel') setManifestPersonnel((current) => current.filter((item) => item.id !== id))
    if (table === 'check_in_manifest_vehicles') setManifestVehicles((current) => current.filter((item) => item.id !== id))
    if (table === 'check_in_manifest_equipment') setManifestEquipment((current) => current.filter((item) => item.id !== id))
    if (table === 'check_in_manifest_others') setManifestOthers((current) => current.filter((item) => item.id !== id))
  }

  async function createGuestCheckInLink() {
    if (!selectedIncidentId || !isAdministrator) return
    setIsCreatingGuestLink(true)
    setIcs211FormError('')
    const { data, error } = await supabase.rpc('create_incident_guest_checkin_link', {
      p_incident_id: selectedIncidentId,
      p_expires_at: null,
    })
    if (error || !data) {
      setIcs211FormError(`Unable to create guest check-in link. ${error?.message || 'No link was returned.'}`)
    } else {
      setGuestCheckInLink(`${window.location.origin}${window.location.pathname}?checkin=${data}`)
    }
    setIsCreatingGuestLink(false)
  }

  function openAssignmentDialog(assignment: OrganizationAssignment) {
    setAssignmentToUpdate(assignment)
    setPersonnelSearch('')
    setSelectedPersonnelId('')
    setAssignmentError('')
  }

  function closeAssignmentDialog() {
    if (!isSavingAssignment) {
      setAssignmentToUpdate(null)
    }
  }

  async function handleAssignPersonnel() {
    if (!assignmentToUpdate || !organizationData || !selectedPersonnelId) {
      setAssignmentError('Select a personnel record before assigning.')
      return
    }

    const selectedPersonnel = organizationData.personnel.find((person) => person.id === selectedPersonnelId)
    if (!selectedPersonnel) {
      setAssignmentError('The selected personnel record is no longer available.')
      return
    }

    const resourceStatus = getResourceStatus(selectedPersonnel)
    if (resourceStatus !== 'AVAILABLE') {
      setAssignmentError(`${resourceStatus} personnel cannot be assigned to a new position.`)
      return
    }

    const { data: existingAssignments, error: existingAssignmentsError } = await supabase
      .from('incident_assignments')
      .select('id')
      .eq('personnel_id', selectedPersonnelId)
      .eq('assignment_status', 'ASSIGNED')
      .neq('id', assignmentToUpdate.id)

    if (existingAssignmentsError) {
      setAssignmentError(`Unable to verify personnel availability. ${existingAssignmentsError.message}`)
      return
    }

    if (existingAssignments && existingAssignments.length > 0) {
      setAssignmentError('This personnel record is already assigned to another active position.')
      return
    }

    const conflictingAssignment = organizationData.assignments.find(
      (assignment) =>
        assignment.id !== assignmentToUpdate.id &&
        assignment.personnel_id === selectedPersonnelId &&
        getAssignmentStatus(assignment) === 'ASSIGNED',
    )

    if (conflictingAssignment) {
      setAssignmentError('This personnel record is already assigned to another active position in this incident.')
      return
    }

    setIsSavingAssignment(true)
    setAssigningAssignmentId(assignmentToUpdate.id)
    setAssignmentError('')
    setAssignmentMessage('')

    const { error } = await supabase
      .from('incident_assignments')
      .update({ personnel_id: selectedPersonnelId, assignment_status: 'ASSIGNED' })
      .eq('id', assignmentToUpdate.id)

    if (error) {
      setAssignmentError(`Unable to assign personnel. ${error.message}`)
      setIsSavingAssignment(false)
      setAssigningAssignmentId(null)
      return
    }

    const { error: personnelError } = await supabase
      .from('personnel')
      .update({ resource_status: 'ASSIGNED' })
      .eq('id', selectedPersonnelId)

    if (personnelError) {
      await supabase
        .from('incident_assignments')
        .update({ personnel_id: null, assignment_status: 'ASSIGNED' })
        .eq('id', assignmentToUpdate.id)
      setAssignmentError(`Unable to update personnel resource status. ${personnelError.message}`)
      setIsSavingAssignment(false)
      setAssigningAssignmentId(null)
      return
    }

    setAssignmentMessage('Personnel assigned successfully.')
    setAssignmentToUpdate(null)
    setIsSavingAssignment(false)
    setAssigningAssignmentId(null)
    setOrganizationData((currentData) => currentData
      ? {
          ...currentData,
          assignments: currentData.assignments.map((assignment) =>
            assignment.id === assignmentToUpdate.id
              ? { ...assignment, personnel_id: selectedPersonnelId, assignment_status: 'ASSIGNED' }
              : assignment,
          ),
          personnel: currentData.personnel.map((person) =>
            person.id === selectedPersonnelId
              ? { ...person, resource_status: 'ASSIGNED' }
              : person,
          ),
        }
      : currentData)
  }

  async function handleUnassignPersonnel(assignment: OrganizationAssignment) {
    if (!window.confirm('Unassign this personnel from the position?')) {
      return
    }

    setAssigningAssignmentId(assignment.id)
    setAssignmentError('')
    setAssignmentMessage('')

    const previousPersonnelId = assignment.personnel_id
    const { error } = await supabase
      .from('incident_assignments')
      .update({ personnel_id: null, assignment_status: 'ASSIGNED' })
      .eq('id', assignment.id)

    if (error) {
      setAssignmentError(`Unable to unassign personnel. ${error.message}`)
      setAssigningAssignmentId(null)
      return
    }

    let otherAssignments: { id: string }[] | null = null
    if (previousPersonnelId) {
      const { data, error: assignmentLookupError } = await supabase
        .from('incident_assignments')
        .select('id')
        .eq('personnel_id', previousPersonnelId)
        .eq('assignment_status', 'ASSIGNED')

      otherAssignments = data

      if (assignmentLookupError) {
        setAssignmentError(`Personnel was unassigned, but resource status could not be checked. ${assignmentLookupError.message}`)
        setAssigningAssignmentId(null)
        return
      }

      if (!otherAssignments || otherAssignments.length === 0) {
        const { error: personnelError } = await supabase
          .from('personnel')
          .update({ resource_status: 'AVAILABLE' })
          .eq('id', previousPersonnelId)

        if (personnelError) {
          setAssignmentError(`Personnel was unassigned, but resource status could not be updated. ${personnelError.message}`)
          setAssigningAssignmentId(null)
          return
        }
      }
    }

    setAssignmentMessage('Personnel unassigned successfully.')
    setAssigningAssignmentId(null)
    setOrganizationData((currentData) => currentData
      ? {
          ...currentData,
          assignments: currentData.assignments.map((currentAssignment) =>
            currentAssignment.id === assignment.id
              ? { ...currentAssignment, personnel_id: null, assignment_status: 'ASSIGNED' }
              : currentAssignment,
          ),
          personnel: previousPersonnelId && !otherAssignments?.length
            ? currentData.personnel.map((person) =>
                person.id === previousPersonnelId
                  ? { ...person, resource_status: 'AVAILABLE' }
                  : person,
              )
            : currentData.personnel,
        }
      : currentData)
  }

  function handleBackToDashboard() {
    setSelectedIncidentId(null)
    setSelectedIncident(null)
    setIncidentCommanderName(null)
    setIncidentDetailsError('')
    setCommanderSaveMessage('')
    setCommanderSaveError('')
    setOrganizationData(null)
    setOrganizationError('')
    setActivePage('dashboard')
  }

  async function handleSaveCommander() {
    if (!selectedIncidentId) {
      return
    }

    setIsSavingCommander(true)
    setCommanderSaveMessage('')
    setCommanderSaveError('')

    const { error } = await supabase
      .from('incidents')
      .update({ incident_commander_id: selectedCommanderId })
      .eq('id', selectedIncidentId)
      .select()

    if (error) {
      setCommanderSaveError(`Unable to save Incident Commander. ${error.message}`)
      setIsSavingCommander(false)
      return
    }

    setCommanderSaveMessage('Incident Commander saved successfully.')
    setIsSavingCommander(false)
    setIncidentDetailsRefreshKey((currentKey) => currentKey + 1)
  }

  const guestToken = new URLSearchParams(window.location.search).get('checkin')
  if (guestToken) {
    return <GuestCheckIn token={guestToken} />
  }

  if (!isLoggedIn) {
    return (
      <main className="login-page">
        <section className="login-card" aria-labelledby="login-title">
          <div className="login-brand">
            <div className="login-brand-mark">eICS</div>
            <div>
              <h1 id="login-title">Electronic Incident Command System</h1>
              <p>Incident Management &amp; Information System</p>
            </div>
          </div>

          <div className="login-heading">
            <p className="eyebrow">SECURE ACCESS</p>
            <h2>Sign in to eICS</h2>
            <p>Enter your credentials to access the dashboard.</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />

            {loginError && (
              <p className="login-error" role="alert">
                {loginError}
              </p>
            )}

            <button className="login-button" type="submit" disabled={isAuthenticating}>
              {isAuthenticating ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <p className="login-footer">Electronic Incident Command System</p>
        </section>
      </main>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">eICS</div>
          <div>
            <h1>Electronic Incident Command System</h1>
            <p>Incident Management &amp; Information System</p>
          </div>
        </div>

        <div className="header-status" aria-label="System status: online">
          <span className="status-dot"></span>
          System Online
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <div className="sidebar-section">
            <p className="sidebar-title">MAIN</p>

            <button
              className={`nav-item ${activePage === 'incidents' ? 'active' : ''}`}
              onClick={openIncidents}
            >
              <span>⚠</span>
              Incidents
            </button>

            <button
              className={`nav-item ${activePage === 'personnel' ? 'active' : ''}`}
              onClick={openPersonnel}
            >
              <span>♟</span>
              Personnel
            </button>

            <button className="nav-item">
              <span>▤</span>
              ICS Forms
            </button>
          </div>

          {isAdministrator && (
            <div className="sidebar-section">
              <p className="sidebar-title">SYSTEM DASHBOARD</p>
              <button
                className={`nav-item ${activePage === 'system-dashboard' ? 'active' : ''}`}
                onClick={() => setActivePage('system-dashboard')}
              >
                <span>⚙</span>
                System Dashboard
              </button>
            </div>
          )}

          <div className="sidebar-footer">
            {isLoadingProfile && <span>Loading profile...</span>}
            {!isLoadingProfile && profile && (
              <>
                <strong>{profile.full_name || 'eICS User'}</strong>
                <span>
                  {profile.role === 'administrator_trainer'
                    ? 'Administrator / Trainer'
                    : profile.role || 'Role unavailable'}
                </span>
              </>
            )}
            {!isLoadingProfile && !profile && (
              <span>{profileError || 'Profile unavailable.'}</span>
            )}
            <span>Version 0.1.0</span>
          </div>
        </aside>

        <main className="main-content">
          {activePage === 'system-dashboard' && isAdministrator ? (
            <>
              <div className="page-heading">
                <div>
                  <p className="breadcrumb">eICS / System Dashboard</p>
                  <h2>System Dashboard</h2>
                  <p className="page-description">Administrative and system functions.</p>
                </div>
              </div>
              <section className="content-grid">
                <div className="panel">
                  <div className="panel-header"><h3>Settings</h3><p>System configuration</p></div>
                  <p>System settings are available to Admin / Trainer users.</p>
                </div>
                <div className="panel">
                  <div className="panel-header"><h3>User Management</h3><p>Manage eICS roles and access</p></div>
                  <button className="primary-button" type="button" onClick={() => setActivePage('user-management')}>Open User Management</button>
                </div>
              </section>
            </>
          ) : activePage === 'dashboard' ? (
            <>
              <div className="page-heading">
            <div>
              <p className="breadcrumb">eICS / Dashboard</p>
              <h2>Dashboard</h2>
              <p className="page-description">
                Incident Management Overview
              </p>
            </div>

            <button className="primary-button" onClick={openCreateIncident}>
              + Create Incident
            </button>
          </div>

          {incidentFormMessage && (
            <p className="form-message" role="status">
              {incidentFormMessage}
            </p>
          )}

          <section className="welcome-card">
            <div>
              <p className="eyebrow">ELECTRONIC INCIDENT COMMAND SYSTEM</p>
              <h3>Welcome to eICS</h3>
              <p>
                A centralized platform for managing incidents, personnel,
                resources, and Incident Action Plans.
              </p>
            </div>

            <div className="welcome-icon">ICS</div>
          </section>

          <section className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Active Incidents</span>
              <strong>{isLoadingIncidents ? '...' : activeIncidents.length}</strong>
              <span className="stat-note">
                {incidentsError
                  ? 'Unable to load incidents'
                  : activeIncidents.length === 0
                    ? 'No active incidents'
                    : 'Current active incidents'}
              </span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Personnel</span>
              <strong>0</strong>
              <span className="stat-note">No personnel checked in</span>
            </div>

            <div className="stat-card">
              <span className="stat-label">ICS Forms</span>
              <strong>0</strong>
              <span className="stat-note">No forms created</span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Operational Period</span>
              <strong>—</strong>
              <span className="stat-note">No active incident</span>
            </div>
          </section>

          <section className="content-grid">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h3>Active Incidents</h3>
                  <p>Current incidents requiring management</p>
                </div>
              </div>

              {isLoadingIncidents && (
                <div className="empty-state">
                  <h4>Loading active incidents...</h4>
                </div>
              )}
              {!isLoadingIncidents && incidentsError && (
                <div className="empty-state">
                  <h4>{incidentsError}</h4>
                </div>
              )}
              {!isLoadingIncidents && !incidentsError && activeIncidents.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">✓</div>
                  <h4>No active incidents</h4>
                  <p>
                    Create an incident to begin using the Incident Command
                    System.
                  </p>
                  <button className="secondary-button" onClick={openCreateIncident}>
                    Create First Incident
                  </button>
                </div>
              )}
              {!isLoadingIncidents && !incidentsError && activeIncidents.length > 0 && (
                <div className="user-table-wrapper">
                  <table className="user-table incident-table">
                    <thead>
                      <tr>
                        <th>Incident Name</th>
                        <th>Incident Type</th>
                        <th>Location</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeIncidents.map((incident) => (
                        <tr key={incident.id}>
                            <td>
                              <button
                                className="incident-link"
                                type="button"
                                onClick={() => openIncidentDetails(incident.id)}
                              >
                                {incident.name}
                              </button>
                            </td>
                          <td>{incident.incident_type || 'Not specified'}</td>
                          <td>{incident.location || 'Not specified'}</td>
                          <td>
                            <span className="incident-status">{incident.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <h3>Quick Actions</h3>
                  <p>Common ICS activities</p>
                </div>
              </div>

              <div className="quick-actions">
                <button className="quick-action" onClick={openCreateIncident}>
                  <span>＋</span>
                  <div>
                    <strong>Create Incident</strong>
                    <small>Start a new incident</small>
                  </div>
                </button>

                <button className="quick-action" onClick={openIncidents}>
                  <span>♟</span>
                  <div>
                    <strong>Open Incident Check-In</strong>
                    <small>Select an incident to open ICS 211</small>
                  </div>
                </button>

                <button className="quick-action">
                  <span>▤</span>
                  <div>
                    <strong>ICS Forms</strong>
                    <small>Build an Incident Action Plan</small>
                  </div>
                </button>
              </div>
            </div>
              </section>
            </>
          ) : activePage === 'incidents' ? (
            <>
              <div className="page-heading">
                <div>
                  <p className="breadcrumb">eICS / Incidents</p>
                  <h2>Incidents</h2>
                  <p className="page-description">
                    Review all incidents recorded in eICS.
                  </p>
                </div>
                <button className="primary-button" onClick={openCreateIncident}>
                  + Create Incident
                </button>
              </div>

              <section className="panel">
                {isLoadingAllIncidents && (
                  <div className="empty-state">
                    <h4>Loading incidents...</h4>
                  </div>
                )}
                {!isLoadingAllIncidents && allIncidentsError && (
                  <div className="empty-state">
                    <h4>{allIncidentsError}</h4>
                  </div>
                )}
                {!isLoadingAllIncidents && !allIncidentsError && allIncidents.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">✓</div>
                    <h4>No incidents to display</h4>
                    <p>Create an incident to begin using the Incident Command System.</p>
                    <button className="secondary-button" onClick={openCreateIncident}>
                      Create Incident
                    </button>
                  </div>
                )}
                {!isLoadingAllIncidents && !allIncidentsError && allIncidents.length > 0 && (
                  <div className="user-table-wrapper">
                    <table className="user-table incident-table">
                      <thead>
                        <tr>
                          <th>Incident Name</th>
                          <th>Incident Type</th>
                          <th>Location</th>
                          <th>Status</th>
                          <th>Created Date/Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allIncidents.map((incident) => (
                          <tr key={incident.id}>
                            <td>
                              <button
                                className="incident-link"
                                type="button"
                                onClick={() => openIncidentDetails(incident.id)}
                              >
                                {incident.name}
                              </button>
                            </td>
                            <td>{incident.incident_type || 'Not specified'}</td>
                            <td>{incident.location || 'Not specified'}</td>
                            <td>
                              <span className="incident-status">{incident.status}</span>
                            </td>
                            <td>{new Date(incident.created_at).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          ) : activePage === 'personnel' ? (
            <>
              <div className="page-heading">
                <div>
                  <p className="breadcrumb">eICS / Personnel</p>
                  <h2>Personnel</h2>
                  <p className="page-description">
                    Check in and monitor personnel for the active incident.
                  </p>
                </div>
                <div className="personnel-page-actions">
                  {profile?.role === 'administrator_trainer' && (
                    <button
                      className="secondary-button"
                      onClick={() => {
                        setRegistrationError('')
                        setRegistrationMessage('')
                        setIsPersonnelRegistrationOpen(true)
                      }}
                    >
                      Register Personnel
                    </button>
                  )}
                  <button
                    className="primary-button"
                    onClick={() => {
                      setPersonnelFormError('')
                      setPersonnelMessage('')
                      setIsCheckInFormOpen(true)
                    }}
                    disabled={!personnelIncident || isLoadingPersonnel}
                  >
                    Check In Personnel
                  </button>
                </div>
              </div>

              {personnelMessage && (
                <p className="form-message" role="status">
                  {personnelMessage}
                </p>
              )}
              {registrationMessage && (
                <p className="form-message" role="status">
                  {registrationMessage}
                </p>
              )}
              {checkoutError && (
                <p className="form-error" role="alert">
                  {checkoutError}
                </p>
              )}

              {isLoadingPersonnel && (
                <section className="panel">
                  <div className="empty-state">
                    <h4>Loading personnel...</h4>
                  </div>
                </section>
              )}
              {!isLoadingPersonnel && personnelError && (
                <section className="panel">
                  <div className="empty-state">
                    <h4>{personnelError}</h4>
                  </div>
                </section>
              )}
              {!isLoadingPersonnel && !personnelError && personnelIncident && (
                <>
                  <section className="panel personnel-incident-context">
                    <div className="panel-header">
                      <h3>Active Incident</h3>
                      <select
                        className="role-select personnel-incident-select"
                        value={selectedPersonnelIncidentId}
                        onChange={(event) => {
                          setSelectedPersonnelIncidentId(event.target.value)
                          setIsCheckInFormOpen(false)
                          setPersonnelMessage('')
                        }}
                        aria-label="Select active incident for check-in"
                      >
                        {personnelIncidents.map((incident) => (
                          <option key={incident.id} value={incident.id}>
                            {incident.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </section>

                  {isPersonnelRegistrationOpen && (
                    <section className="panel incident-form-panel personnel-form-panel">
                      <div className="panel-header">
                        <h3>Register Personnel</h3>
                      </div>
                      <form className="incident-form" onSubmit={handleRegisterPersonnel}>
                        <div className="form-field">
                          <label htmlFor="registration-first-name">First Name</label>
                          <input id="registration-first-name" value={registrationFirstName} onChange={(event) => setRegistrationFirstName(event.target.value)} required />
                        </div>
                        <div className="form-field">
                          <label htmlFor="registration-middle-name">Middle Name</label>
                          <input id="registration-middle-name" value={registrationMiddleName} onChange={(event) => setRegistrationMiddleName(event.target.value)} />
                        </div>
                        <div className="form-field">
                          <label htmlFor="registration-last-name">Last Name</label>
                          <input id="registration-last-name" value={registrationLastName} onChange={(event) => setRegistrationLastName(event.target.value)} required />
                        </div>
                        <div className="form-field">
                          <label htmlFor="registration-email">Email</label>
                          <input id="registration-email" type="email" value={registrationEmail} onChange={(event) => setRegistrationEmail(event.target.value)} />
                        </div>
                        <div className="form-field">
                          <label htmlFor="registration-organization">Organization / Agency</label>
                          <input id="registration-organization" value={registrationOrganization} onChange={(event) => setRegistrationOrganization(event.target.value)} />
                        </div>
                        <div className="form-field">
                          <label htmlFor="registration-contact">Contact Number</label>
                          <input id="registration-contact" type="tel" value={registrationContactNumber} onChange={(event) => setRegistrationContactNumber(event.target.value)} />
                        </div>
                        <div className="form-field">
                          <label htmlFor="registration-resource-status">Resource Status</label>
                          <select id="registration-resource-status" className="role-select" value={registrationResourceStatus} onChange={(event) => setRegistrationResourceStatus(event.target.value)}>
                            <option value="AVAILABLE">AVAILABLE</option>
                            <option value="ASSIGNED">ASSIGNED</option>
                            <option value="OUT-OF-SERVICE">OUT-OF-SERVICE</option>
                            <option value="DEMOBILIZED">DEMOBILIZED</option>
                          </select>
                        </div>
                        {registrationError && <p className="form-error" role="alert">{registrationError}</p>}
                        <div className="form-actions">
                          <button className="primary-button" type="submit" disabled={isSavingRegistration}>{isSavingRegistration ? 'Registering...' : 'Register Personnel'}</button>
                          <button className="secondary-button" type="button" onClick={resetRegistrationForm} disabled={isSavingRegistration}>Cancel</button>
                        </div>
                      </form>
                    </section>
                  )}

                  <section className="panel personnel-list-panel">
                    <div className="panel-header">
                      <h3>Personnel Roster</h3>
                      <p>Registered personnel and current resource status</p>
                    </div>
                    {personnelResources.length === 0 ? (
                      <div className="empty-state"><h4>No personnel registered</h4><p>Use Register Personnel to add a resource.</p></div>
                    ) : (
                      <div className="user-table-wrapper">
                        <table className="user-table personnel-table">
                          <thead><tr><th>Name</th><th>Email</th><th>Organization</th><th>Contact</th><th>Resource Status</th></tr></thead>
                          <tbody>
                            {personnelResources.map((person) => (
                              <tr key={person.id}>
                                <td>{getPersonnelResourceName(person)}</td>
                                <td>{person.email || 'Not specified'}</td>
                                <td>{person.organization || person.agency || 'Not specified'}</td>
                                <td>{person.contact_number || 'Not specified'}</td>
                                <td><span className="incident-status">{getOrganizationLabel(person.resource_status, 'AVAILABLE')}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {isCheckInFormOpen && (
                    <section className="panel incident-form-panel personnel-form-panel">
                      <div className="panel-header">
                        <h3>Check In Personnel</h3>
                      </div>
                      <form className="incident-form" onSubmit={handlePersonnelCheckIn}>
                        <div className="form-field">
                          <label htmlFor="personnel-search">Select Personnel</label>
                          <input
                            id="personnel-search"
                            type="search"
                            placeholder="Search personnel by name"
                            value={personnelRosterSearch}
                            onChange={(event) => setPersonnelRosterSearch(event.target.value)}
                          />
                          {isLoadingPersonnelResources && <span className="role-save-status">Loading personnel roster...</span>}
                          {personnelResourcesError && <span className="role-save-error" role="alert">{personnelResourcesError}</span>}
                          {!isLoadingPersonnelResources && !personnelResourcesError && personnelResources.length === 0 && (
                            <span className="role-save-error">No personnel records available.</span>
                          )}
                          {!isLoadingPersonnelResources && !personnelResourcesError && personnelResources.length > 0 && (
                            <select
                              className="role-select personnel-resource-select"
                              value={selectedPersonnelResourceId}
                              onChange={(event) => selectPersonnelResource(event.target.value)}
                              required
                            >
                              <option value="">Select a personnel record</option>
                              {personnelResources
                                .filter((person) => getPersonnelResourceName(person).toLowerCase().includes(personnelRosterSearch.toLowerCase()))
                                .map((person) => (
                                  <option key={person.id} value={person.id}>
                                    {getPersonnelResourceName(person)} ({getOrganizationLabel(person.resource_status, 'AVAILABLE')})
                                  </option>
                                ))}
                            </select>
                          )}
                        </div>
                        <div className="form-field">
                          <label htmlFor="personnel-name">Full Name</label>
                          <input
                            id="personnel-name"
                            type="text"
                            value={personnelName}
                            onChange={(event) => setPersonnelName(event.target.value)}
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label htmlFor="personnel-organization">Organization / Agency</label>
                          <input
                            id="personnel-organization"
                            type="text"
                            value={personnelOrganization}
                            onChange={(event) => setPersonnelOrganization(event.target.value)}
                          />
                        </div>
                        <div className="form-field">
                          <label htmlFor="personnel-position">Position / Role</label>
                          <input
                            id="personnel-position"
                            type="text"
                            value={personnelPosition}
                            onChange={(event) => setPersonnelPosition(event.target.value)}
                          />
                        </div>
                        <div className="form-field">
                          <label htmlFor="personnel-contact">Contact Number</label>
                          <input
                            id="personnel-contact"
                            type="tel"
                            value={personnelContactNumber}
                            onChange={(event) => setPersonnelContactNumber(event.target.value)}
                          />
                        </div>
                        {personnelFormError && (
                          <p className="form-error" role="alert">{personnelFormError}</p>
                        )}
                        <div className="form-actions">
                          <button className="primary-button" type="submit" disabled={isSavingPersonnel}>
                            {isSavingPersonnel ? 'Checking In...' : 'Check In Personnel'}
                          </button>
                          <button className="secondary-button" type="button" onClick={resetPersonnelForm}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    </section>
                  )}

                  <section className="panel personnel-list-panel">
                    <div className="panel-header">
                      <h3>Checked-in Personnel</h3>
                      <p>Personnel currently associated with this incident</p>
                    </div>
                    {incidentPersonnel.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">♟</div>
                        <h4>No personnel checked in</h4>
                        <p>Use Check In Personnel to add the first person.</p>
                      </div>
                    ) : (
                      <div className="user-table-wrapper">
                        <table className="user-table personnel-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Organization</th>
                              <th>Position</th>
                              <th>Check-in Time</th>
                              <th>Check-out Time</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {incidentPersonnel.map((person) => (
                              <tr key={person.id}>
                                <td>{person.full_name}</td>
                                <td>{person.organization || 'Not specified'}</td>
                                <td>{person.position || 'Not specified'}</td>
                                <td>{new Date(person.check_in_time).toLocaleString()}</td>
                                <td>
                                  {person.check_out_time
                                    ? new Date(person.check_out_time).toLocaleString()
                                    : '—'}
                                </td>
                                <td><span className="incident-status">{person.status}</span></td>
                                <td>
                                  {person.status === 'checked_in' && (
                                    <button
                                      className="secondary-button personnel-checkout-button"
                                      type="button"
                                      onClick={() => void handlePersonnelCheckOut(person.id)}
                                      disabled={checkingOutPersonnelId === person.id}
                                    >
                                      {checkingOutPersonnelId === person.id ? 'Checking Out...' : 'Check Out'}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                </>
              )}
            </>
          ) : activePage === 'ics-211' ? (
            <>
              <div className="page-heading">
                <div>
                  <p className="breadcrumb">eICS / Incidents / Check-In / ICS 211</p>
                  <h2>ICS Form 211 Resource Check-In</h2>
                  <p className="page-description">Incident-specific resource check-in. Personnel manifests can be linked later.</p>
                </div>
                <button className="secondary-button" type="button" onClick={() => setActivePage('incident-details')}>Back to Incident</button>
              </div>

              {selectedIncident && (
                <section className="panel incident-context-banner">
                  <span>Active incident</span>
                  <strong>{selectedIncident.name}</strong>
                  <small>{selectedIncident.location || 'Location not specified'} · {selectedIncident.status}</small>
                </section>
              )}
              {ics211Message && <p className="form-message" role="status">{ics211Message}</p>}
              {ics211Error && <p className="form-error" role="alert">{ics211Error}</p>}

              {isLoadingIcs211Header && <section className="panel"><div className="empty-state"><h4>Loading ICS 211 header...</h4></div></section>}
              {!isLoadingIcs211Header && (
                <section className="panel incident-form-panel">
                  <div className="panel-header"><div><h3>Incident Check-In List Header</h3><p>{selectedIncident?.name || 'Incident'} · Philippine ICS 211</p></div></div>
                  <form className="incident-form" onSubmit={handleSaveIcs211Header}>
                    <div className="form-field"><label htmlFor="ics211-start-date">Start Date</label><input id="ics211-start-date" type="date" value={ics211HeaderDraft.incident_start_date} onChange={(event) => setIcs211HeaderDraft({ ...ics211HeaderDraft, incident_start_date: event.target.value })} required /></div>
                    <div className="form-field"><label htmlFor="ics211-start-time">Start Time</label><input id="ics211-start-time" type="time" value={ics211HeaderDraft.incident_start_time} onChange={(event) => setIcs211HeaderDraft({ ...ics211HeaderDraft, incident_start_time: event.target.value })} required /></div>
                    <div className="form-field"><label htmlFor="ics211-check-in-location">Check-In Location</label><select id="ics211-check-in-location" value={ics211HeaderDraft.check_in_location} onChange={(event) => setIcs211HeaderDraft({ ...ics211HeaderDraft, check_in_location: event.target.value })}><option>Base</option><option>Camp</option><option>Staging Area</option><option>ICP</option><option>Others</option></select></div>
                    {ics211HeaderDraft.check_in_location === 'Others' && <div className="form-field"><label htmlFor="ics211-other-location">Other Location</label><input id="ics211-other-location" value={ics211HeaderDraft.check_in_location_other} onChange={(event) => setIcs211HeaderDraft({ ...ics211HeaderDraft, check_in_location_other: event.target.value })} required /></div>}
                    <div className="form-field"><label htmlFor="ics211-prepared-by">Name and Signature</label><input id="ics211-prepared-by" value={ics211HeaderDraft.prepared_by_name} onChange={(event) => setIcs211HeaderDraft({ ...ics211HeaderDraft, prepared_by_name: event.target.value })} /></div>
                    <div className="form-field"><label htmlFor="ics211-signature">Signature Reference</label><input id="ics211-signature" value={ics211HeaderDraft.prepared_by_signature} onChange={(event) => setIcs211HeaderDraft({ ...ics211HeaderDraft, prepared_by_signature: event.target.value })} /></div>
                    <div className="form-field"><label htmlFor="ics211-date-prepared">Date Prepared</label><input id="ics211-date-prepared" type="date" value={ics211HeaderDraft.date_prepared} onChange={(event) => setIcs211HeaderDraft({ ...ics211HeaderDraft, date_prepared: event.target.value })} /></div>
                    <div className="form-field"><label htmlFor="ics211-time-prepared">Time Prepared</label><input id="ics211-time-prepared" type="time" value={ics211HeaderDraft.time_prepared} onChange={(event) => setIcs211HeaderDraft({ ...ics211HeaderDraft, time_prepared: event.target.value })} /></div>
                    <div className="form-field"><label htmlFor="ics211-page-number">Page Number</label><input id="ics211-page-number" type="number" min="1" value={ics211HeaderDraft.page_number} onChange={(event) => setIcs211HeaderDraft({ ...ics211HeaderDraft, page_number: Number(event.target.value) })} /></div>
                    <div className="form-field"><label htmlFor="ics211-total-pages">Total Pages</label><input id="ics211-total-pages" type="number" min="1" value={ics211HeaderDraft.total_pages} onChange={(event) => setIcs211HeaderDraft({ ...ics211HeaderDraft, total_pages: Number(event.target.value) })} /></div>
                    {ics211HeaderError && <p className="form-error" role="alert">{ics211HeaderError}</p>}
                    {ics211HeaderMessage && <p className="form-message" role="status">{ics211HeaderMessage}</p>}
                    <div className="form-actions"><button className="primary-button" type="submit" disabled={isSavingIcs211Header}>{isSavingIcs211Header ? 'Saving...' : 'Save / Update Header'}</button></div>
                  </form>
                </section>
              )}

              {ics211Header && <section className="panel incident-form-panel">
                <div className="panel-header"><div><h3>{editingIcs211ResourceId ? 'Edit Resource Check-In' : 'Add Resource Check-In'}</h3><p>Resource check-in records remain separate from the future personnel manifest.</p></div></div>
                <form className="incident-form" onSubmit={handleSaveIcs211Resource}>
                  <div className="form-field"><label htmlFor="ics211-order">Order / Request No.</label><input id="ics211-order" value={ics211ResourceDraft.order_request_no || ''} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, order_request_no: event.target.value })} /></div>
                  <div className="form-field"><label htmlFor="ics211-check-in">Check-In Date and Time</label><input id="ics211-check-in" type="datetime-local" value={ics211ResourceDraft.check_in_at?.slice(0, 16) || ''} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, check_in_at: event.target.value })} required /></div>
                  <div className="form-field"><label htmlFor="ics211-kind">Kind</label><input id="ics211-kind" value={ics211ResourceDraft.kind} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, kind: event.target.value })} required /></div>
                  <div className="form-field"><label htmlFor="ics211-type">Type</label><input id="ics211-type" value={ics211ResourceDraft.type} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, type: event.target.value })} required /></div>
                  <div className="form-field"><label htmlFor="ics211-identifier">Resource Identifier</label><input id="ics211-identifier" value={ics211ResourceDraft.resource_identifier} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, resource_identifier: event.target.value })} placeholder="TF-1, ST-1, SAR-1, AMB-1" required /></div>
                  <div className="form-field"><label htmlFor="ics211-classification">Resource Classification</label><select id="ics211-classification" value={ics211ResourceDraft.resource_classification} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, resource_classification: event.target.value })}><option value="Single">Single</option><option value="TF">TF</option><option value="ST">ST</option></select></div>
                  <div className="form-field"><label htmlFor="ics211-agency">Agency / Office / Home Base</label><input id="ics211-agency" value={ics211ResourceDraft.agency_office_home_base || ''} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, agency_office_home_base: event.target.value })} /></div>
                  <div className="form-field"><label htmlFor="ics211-leader">Name of Leader</label><input id="ics211-leader" value={ics211ResourceDraft.leader_name || ''} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, leader_name: event.target.value })} /></div>
                  <div className="form-field"><label htmlFor="ics211-contact">Contact Details</label><input id="ics211-contact" value={ics211ResourceDraft.contact_details || ''} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, contact_details: event.target.value })} /></div>
                  <div className="form-field"><label htmlFor="ics211-personnel-total">Total No. of Personnel</label><input id="ics211-personnel-total" type="number" min="0" value={ics211ResourceDraft.total_personnel ?? ''} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, total_personnel: event.target.value ? Number(event.target.value) : null })} /></div>
                  <div className="form-field"><label htmlFor="ics211-origin">Point of Origin</label><input id="ics211-origin" value={ics211ResourceDraft.point_of_origin || ''} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, point_of_origin: event.target.value })} /></div>
                  <div className="form-field"><label htmlFor="ics211-departure">Departure Date and Time</label><input id="ics211-departure" type="datetime-local" value={ics211ResourceDraft.departure_at?.slice(0, 16) || ''} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, departure_at: event.target.value || null })} /></div>
                  <div className="form-field"><label htmlFor="ics211-travel">Method of Travel</label><input id="ics211-travel" value={ics211ResourceDraft.method_of_travel || ''} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, method_of_travel: event.target.value })} /></div>
                  <div className="form-field"><label htmlFor="ics211-manifest">With Manifest?</label><select id="ics211-manifest" value={ics211ResourceDraft.with_manifest ? 'yes' : 'no'} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, with_manifest: event.target.value === 'yes' })}><option value="no">No</option><option value="yes">Yes</option></select></div>
                  <div className="form-field"><label htmlFor="ics211-assignment">Incident Assignment</label><input id="ics211-assignment" value={ics211ResourceDraft.incident_assignment || ''} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, incident_assignment: event.target.value })} /></div>
                  <div className="form-field"><label htmlFor="ics211-qualifications">Other Qualifications</label><input id="ics211-qualifications" value={ics211ResourceDraft.other_qualifications || ''} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, other_qualifications: event.target.value })} /></div>
                  <div className="form-field"><label htmlFor="ics211-resl">Data Sent to RESL</label><input id="ics211-resl" type="datetime-local" value={ics211ResourceDraft.data_sent_to_resl_at?.slice(0, 16) || ''} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, data_sent_to_resl_at: event.target.value || null })} /></div>
                  {ics211FormError && <p className="form-error" role="alert">{ics211FormError}</p>}
                  <div className="form-actions"><button className="primary-button" type="submit" disabled={isSavingIcs211Resource}>{isSavingIcs211Resource ? 'Saving...' : editingIcs211ResourceId ? 'Update Resource' : 'Add Resource'}</button>{editingIcs211ResourceId && <button className="secondary-button" type="button" onClick={() => { setEditingIcs211ResourceId(null); setIcs211ResourceDraft({ ...emptyIcs211ResourceDraft }) }}>Cancel Edit</button>}</div>
                </form>
              </section>}

              {isAdministrator && (
                <section className="panel guest-link-panel">
                  <div className="panel-header"><div><h3>Guest Tactical Resource Check-In</h3><p>Create an incident-specific link for non-IMT resources without eICS accounts.</p></div></div>
                  <button className="secondary-button" type="button" onClick={() => void createGuestCheckInLink()} disabled={isCreatingGuestLink}>
                    {isCreatingGuestLink ? 'Creating Link...' : 'Create Guest Check-In Link'}
                  </button>
                  {guestCheckInLink && <input className="guest-link-output" readOnly value={guestCheckInLink} aria-label="Incident guest check-in link" />}
                </section>
              )}

              <section className="panel personnel-list-panel">
                <div className="panel-header"><div><h3>ICS 211 Resources</h3><p>Resources checked into this incident. Each record is ready for future manifest association.</p></div></div>
                {isLoadingIcs211Header || isLoadingIcs211 ? <div className="empty-state"><h4>Loading ICS 211 resources...</h4></div> : ics211Resources.length === 0 ? <div className="empty-state"><h4>No resources checked in</h4><p>Use Add Resource above or provide the incident-specific guest link.</p></div> : (
                  <div className="user-table-wrapper">
                    <table className="user-table personnel-table">
                      <thead><tr><th>Order / Request</th><th>Kind</th><th>Type</th><th>Resource</th><th>Class</th><th>Agency / Home Base</th><th>Leader</th><th>Personnel</th><th>Check-In</th><th>RESL</th><th>Manifest</th><th>Actions</th></tr></thead>
                      <tbody>{ics211Resources.map((resource) => (
                        <tr key={resource.id}>
                          <td>{resource.order_request_no || 'Not specified'}</td>
                          <td>{resource.kind}</td>
                          <td>{resource.type}</td>
                          <td>{resource.resource_identifier}</td>
                          <td>{resource.resource_classification}</td>
                          <td>{resource.agency_office_home_base || 'Not specified'}</td>
                          <td>{resource.leader_name || 'Not specified'}</td>
                          <td>{resource.total_personnel ?? 'Not specified'}</td>
                          <td>{new Date(resource.check_in_at).toLocaleString()}</td>
                          <td>{resource.data_sent_to_resl_at ? new Date(resource.data_sent_to_resl_at).toLocaleString() : 'Not sent'}</td>
                          <td>{resource.manifest_id ? 'Linked' : resource.manifest_reference || 'Not linked'}</td>
                          <td>
                            <button className="secondary-button" type="button" onClick={() => editIcs211Resource(resource)}>Edit</button>
                            <button className="primary-button" type="button" onClick={() => void openManifestForResource(resource, selectedIncidentId!)}>
                              {resource.manifest_id ? 'View/Edit Manifest' : 'Create Manifest'}
                            </button>
                          </td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          ) : activePage === 'resource-review' ? (
            <>
              <div className="page-heading">
                <div>
                  <p className="breadcrumb">eICS / Incidents / Resource Review</p>
                  <h2>Resource Assignment / Classification</h2>
                  <p className="page-description">Consolidated ICS 211 resources for RESL / PSC review.</p>
                </div>
                <button className="secondary-button" type="button" onClick={() => setActivePage('incident-details')}>Back to Incident</button>
              </div>
              {selectedIncident && <section className="panel incident-context-banner"><span>Incident</span><strong>{selectedIncident.name}</strong><small>{selectedIncident.location || 'Location not specified'} · {selectedIncident.status}</small></section>}
              {stage7Message && <p className="form-message" role="status">{stage7Message}</p>}
              {stage7Error && <p className="form-error" role="alert">{stage7Error}</p>}
              {isLoadingStage7 ? <section className="panel"><div className="empty-state"><h4>Loading consolidated resources...</h4></div></section> : stage7Resources.length === 0 ? <section className="panel"><div className="empty-state"><h4>No ICS 211 resources found</h4><p>Check in a resource through ICS 211 before reviewing assignments.</p></div></section> : (
                <section className="panel personnel-list-panel">
                  <div className="panel-header"><div><h3>Consolidated Resources</h3><p>Checked-in resources, manifest composition, classification, and assignment status.</p></div></div>
                  <div className="user-table-wrapper">
                    <table className="user-table resource-review-table">
                      <thead><tr><th>Resource</th><th>Kind / Type</th><th>Manifest</th><th>Classification</th><th>Status</th><th>Assignment</th><th>Actions</th></tr></thead>
                      <tbody>{stage7Resources.map((resource) => {
                        const status = resource.resource_status || 'AVAILABLE'
                        const busy = stage7BusyResourceId === resource.id
                        return <tr key={resource.id}>
                          <td><strong>{resource.resource_identifier}</strong><small>{resource.agency_office_home_base || 'Agency not specified'}{resource.leader_name ? ` · ${resource.leader_name}` : ''}</small></td>
                          <td>{resource.kind}<small>{resource.type}</small></td>
                          <td>{resource.has_manifest ? `${resource.manifest_personnel_count} personnel · ${resource.manifest_vehicle_count} vehicles · ${resource.manifest_equipment_count} equipment` : 'No manifest'}</td>
                          <td><select value={resource.operational_classification || ''} disabled={!canReviewResources || busy} onChange={(event) => { const value = event.target.value as 'IMT RESOURCE' | 'TACTICAL RESOURCE'; if (value) void classifyStage7Resource(resource, value) }}><option value="">Unclassified</option><option value="IMT RESOURCE">IMT RESOURCE</option><option value="TACTICAL RESOURCE">TACTICAL RESOURCE</option></select></td>
                          <td><span className={`resource-status-badge resource-status-${status.toLowerCase().replaceAll('-', '-')}`}>{status}</span></td>
                          <td>{resource.assignment_id ? `Assigned ${resource.assigned_at ? new Date(resource.assigned_at).toLocaleString() : ''}` : 'Not assigned'}</td>
                          <td>{status === 'AVAILABLE' && <button className="primary-button" type="button" disabled={!canReviewResources || busy} onClick={() => void assignStage7Resource(resource)}>{busy ? 'Saving...' : 'Assign'}</button>}{status === 'ASSIGNED' && <button className="secondary-button" type="button" disabled={!canReviewResources || busy} onClick={() => void releaseStage7Resource(resource)}>{busy ? 'Saving...' : 'Release'}</button>}{(status === 'OUT-OF-SERVICE' || status === 'DEMOBILIZED') && <span>Unavailable</span>}</td>
                        </tr>
                      })}</tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          ) : activePage === 'check-in-manifest' ? (
            <>
              <div className="page-heading">
                <div>
                  <p className="breadcrumb">eICS / Incidents / Check-In Manifest</p>
                  <h2>Check-In Manifest</h2>
                  <p className="page-description">Detailed personnel, vehicle, equipment, and other information for this incident resource.</p>
                </div>
                <button className="secondary-button" type="button" onClick={() => setActivePage('incident-details')}>Back to Incident</button>
              </div>
              {selectedIncident && <section className="panel incident-context-banner"><span>Incident</span><strong>{selectedIncident.name}</strong><small>{selectedIncident.location || 'Location not specified'} · {selectedIncident.status}</small>{manifestResource && <><span>ICS 211 Resource</span><strong>{manifestResource.resource_identifier} — {manifestResource.kind} — {manifestResource.type}</strong><small>{manifestResource.agency_office_home_base || 'Agency / Office / Home Base not specified'} · {manifestResource.leader_name || 'Leader not specified'}</small></>}</section>}
              {manifestMessage && <p className="form-message" role="status">{manifestMessage}</p>}
              {manifestError && <p className="form-error" role="alert">{manifestError}</p>}
              {isLoadingManifest ? <section className="panel"><div className="empty-state"><h4>Loading Check-In Manifest...</h4></div></section> : (
                <>
                  <section className="panel incident-form-panel">
                    <div className="panel-header"><div><h3>Manifest Information</h3><p>One manifest belongs to the selected incident. Totals are calculated from the rows below.</p></div></div>
                    <div className="manifest-summary-grid">
                      <div><span>Total Personnel</span><strong>{manifestPersonnel.length}</strong></div>
                      <div><span>Total Vehicles</span><strong>{manifestVehicles.length}</strong></div>
                      <div><span>Land</span><strong>{manifestVehicles.filter((item) => item.vehicle_category === 'LAND').length}</strong></div>
                      <div><span>Water</span><strong>{manifestVehicles.filter((item) => item.vehicle_category === 'WATER').length}</strong></div>
                      <div><span>Air</span><strong>{manifestVehicles.filter((item) => item.vehicle_category === 'AIR').length}</strong></div>
                      <div><span>Total Equipment</span><strong>{manifestEquipment.length}</strong></div>
                    </div>
                    <div className="incident-form manifest-form-grid">
                      <div className="form-field"><label htmlFor="manifest-agency">Agency / Office / Home Base</label><input id="manifest-agency" value={manifestDraft.agency_office_home_base} onChange={(event) => setManifestDraft({ ...manifestDraft, agency_office_home_base: event.target.value })} /></div>
                      <div className="form-field"><label htmlFor="manifest-leader">Name of Leader</label><input id="manifest-leader" value={manifestDraft.leader_name} onChange={(event) => setManifestDraft({ ...manifestDraft, leader_name: event.target.value })} /></div>
                      <div className="form-field"><label htmlFor="manifest-contact">Contact Details</label><input id="manifest-contact" value={manifestDraft.contact_details} onChange={(event) => setManifestDraft({ ...manifestDraft, contact_details: event.target.value })} /></div>
                      <div className="form-field"><label htmlFor="manifest-resource">Link to ICS 211 Resource (Optional)</label>{manifestResource ? <><strong className="manifest-resource-reference">{manifestResource.resource_identifier} — {manifestResource.kind} — {manifestResource.type}</strong><small>{manifestResource.agency_office_home_base || 'Agency / Office / Home Base not specified'} · {manifestResource.leader_name || 'Leader not specified'}</small></> : <><select id="manifest-resource" value={manifestDraft.ics_211_resource_id} onChange={(event) => setManifestDraft({ ...manifestDraft, ics_211_resource_id: event.target.value })}><option value="">Not associated</option>{manifestResourceOptions.map((resource) => <option key={resource.id} value={resource.id}>{resource.resource_identifier} — {resource.kind} — {resource.type} — {resource.agency_office_home_base || 'Agency not specified'}</option>)}</select><small>Select an existing ICS 211 resource if this manifest represents the detailed composition of that resource.</small></>}</div>
                    </div>
                    <button className="primary-button" type="button" onClick={() => void saveManifest()} disabled={isSavingManifest}>{isSavingManifest ? 'Saving Manifest...' : 'Save Manifest'}</button>
                  </section>

                  <>
                    <section className="panel incident-form-panel manifest-table-panel">
                      <div className="panel-header"><div><h3>Personnel</h3><p>Total Number of Personnel: {manifestPersonnel.length}</p></div><button className="secondary-button" type="button" onClick={addManifestPersonnelRow}>+ Add Row</button></div>
                      <div className="manifest-table-scroll"><table className="user-table manifest-entry-table"><thead><tr><th>Name</th><th>Age</th><th>Gender</th><th>Weight (kg)</th><th>Contact Details</th><th>Capabilities/Specialization</th><th>Others</th><th>Action</th></tr></thead><tbody>{manifestPersonnel.map((item) => <tr key={item.id}><td><input value={item.name} onChange={(event) => updateManifestPersonnelRow(item.id, 'name', event.target.value)} /></td><td><input type="number" min="0" value={item.age ?? ''} onChange={(event) => updateManifestPersonnelRow(item.id, 'age', event.target.value ? Number(event.target.value) : null)} /></td><td><input value={item.gender || ''} onChange={(event) => updateManifestPersonnelRow(item.id, 'gender', event.target.value)} /></td><td><input type="number" min="0" step="0.01" value={item.weight_kg ?? ''} onChange={(event) => updateManifestPersonnelRow(item.id, 'weight_kg', event.target.value ? Number(event.target.value) : null)} /></td><td><input value={item.contact_details || ''} onChange={(event) => updateManifestPersonnelRow(item.id, 'contact_details', event.target.value)} /></td><td><input value={item.capabilities_specialization || ''} onChange={(event) => updateManifestPersonnelRow(item.id, 'capabilities_specialization', event.target.value)} /></td><td><input value={item.others || ''} onChange={(event) => updateManifestPersonnelRow(item.id, 'others', event.target.value)} /></td><td><button className="secondary-button" type="button" onClick={() => deleteManifestRow('check_in_manifest_personnel', item.id)}>Remove</button></td></tr>)}</tbody></table></div>
                    </section>

                    <section className="panel incident-form-panel manifest-table-panel">
                      <div className="panel-header"><div><h3>Vehicles</h3><p>Total Vehicles: {manifestVehicles.length} · Land: {manifestVehicles.filter((item) => item.vehicle_category === 'LAND').length} · Water: {manifestVehicles.filter((item) => item.vehicle_category === 'WATER').length} · Air: {manifestVehicles.filter((item) => item.vehicle_category === 'AIR').length}</p></div><button className="secondary-button" type="button" onClick={addManifestVehicleRow}>+ Add Row</button></div>
                      <div className="manifest-table-scroll"><table className="user-table manifest-entry-table"><thead><tr><th>Name of Operator</th><th>Kind</th><th>Type</th><th>Plate Number</th><th>Fuel Type</th><th>Weight (kg)</th><th>Contact Details</th><th>Capabilities/Specialization</th><th>Others</th><th>Category</th><th>Action</th></tr></thead><tbody>{manifestVehicles.map((item) => <tr key={item.id}><td><input value={item.operator_name || ''} onChange={(event) => updateManifestVehicleRow(item.id, 'operator_name', event.target.value)} /></td><td><input value={item.kind || ''} onChange={(event) => updateManifestVehicleRow(item.id, 'kind', event.target.value)} /></td><td><input value={item.type || ''} onChange={(event) => updateManifestVehicleRow(item.id, 'type', event.target.value)} /></td><td><input value={item.plate_number || ''} onChange={(event) => updateManifestVehicleRow(item.id, 'plate_number', event.target.value)} /></td><td><input value={item.fuel_type || ''} onChange={(event) => updateManifestVehicleRow(item.id, 'fuel_type', event.target.value)} /></td><td><input type="number" min="0" step="0.01" value={item.weight_kg ?? ''} onChange={(event) => updateManifestVehicleRow(item.id, 'weight_kg', event.target.value ? Number(event.target.value) : null)} /></td><td><input value={item.contact_details || ''} onChange={(event) => updateManifestVehicleRow(item.id, 'contact_details', event.target.value)} /></td><td><input value={item.capabilities_specialization || ''} onChange={(event) => updateManifestVehicleRow(item.id, 'capabilities_specialization', event.target.value)} /></td><td><input value={item.others || ''} onChange={(event) => updateManifestVehicleRow(item.id, 'others', event.target.value)} /></td><td><select value={item.vehicle_category} onChange={(event) => updateManifestVehicleRow(item.id, 'vehicle_category', event.target.value as ManifestVehicle['vehicle_category'])}><option value="LAND">LAND</option><option value="WATER">WATER</option><option value="AIR">AIR</option></select></td><td><button className="secondary-button" type="button" onClick={() => deleteManifestRow('check_in_manifest_vehicles', item.id)}>Remove</button></td></tr>)}</tbody></table></div>
                    </section>

                    <section className="panel incident-form-panel manifest-table-panel">
                      <div className="panel-header"><div><h3>Equipment</h3><p>Total Number of Equipment: {manifestEquipment.length}</p></div><button className="secondary-button" type="button" onClick={addManifestEquipmentRow}>+ Add Row</button></div>
                      <div className="manifest-table-scroll"><table className="user-table manifest-entry-table"><thead><tr><th>Name of Operator</th><th>Kind</th><th>Type</th><th>Source of Power</th><th>Fuel Type</th><th>Weight (kg)</th><th>Contact Details</th><th>Capabilities/Specialization</th><th>Others</th><th>Action</th></tr></thead><tbody>{manifestEquipment.map((item) => <tr key={item.id}><td><input value={item.operator_name || ''} onChange={(event) => updateManifestEquipmentRow(item.id, 'operator_name', event.target.value)} /></td><td><input value={item.kind || ''} onChange={(event) => updateManifestEquipmentRow(item.id, 'kind', event.target.value)} /></td><td><input value={item.type || ''} onChange={(event) => updateManifestEquipmentRow(item.id, 'type', event.target.value)} /></td><td><input value={item.source_of_power || ''} onChange={(event) => updateManifestEquipmentRow(item.id, 'source_of_power', event.target.value)} /></td><td><input value={item.fuel_type || ''} onChange={(event) => updateManifestEquipmentRow(item.id, 'fuel_type', event.target.value)} /></td><td><input type="number" min="0" step="0.01" value={item.weight_kg ?? ''} onChange={(event) => updateManifestEquipmentRow(item.id, 'weight_kg', event.target.value ? Number(event.target.value) : null)} /></td><td><input value={item.contact_details || ''} onChange={(event) => updateManifestEquipmentRow(item.id, 'contact_details', event.target.value)} /></td><td><input value={item.capabilities_specialization || ''} onChange={(event) => updateManifestEquipmentRow(item.id, 'capabilities_specialization', event.target.value)} /></td><td><input value={item.others || ''} onChange={(event) => updateManifestEquipmentRow(item.id, 'others', event.target.value)} /></td><td><button className="secondary-button" type="button" onClick={() => deleteManifestRow('check_in_manifest_equipment', item.id)}>Remove</button></td></tr>)}</tbody></table></div>
                    </section>

                    <section className="panel incident-form-panel manifest-table-panel">
                      <div className="panel-header"><div><h3>Others</h3><p>Additional information and continuation-sheet entries.</p></div><button className="secondary-button" type="button" onClick={addManifestOtherRow}>+ Add Row</button></div>
                      <div className="manifest-table-scroll"><table className="user-table manifest-entry-table"><thead><tr><th>Description</th><th>Action</th></tr></thead><tbody>{manifestOthers.map((item) => <tr key={item.id}><td><input value={item.description} onChange={(event) => updateManifestOtherRow(item.id, event.target.value)} /></td><td><button className="secondary-button" type="button" onClick={() => deleteManifestRow('check_in_manifest_others', item.id)}>Remove</button></td></tr>)}</tbody></table></div>
                    </section>
                  </>
                </>
              )}
            </>
          ) : activePage === 'user-management' && isAdministrator ? (
            <>
              <div className="page-heading">
                <div>
                  <p className="breadcrumb">eICS / User Management</p>
                  <h2>User Management</h2>
                  <p className="page-description">
                    Manage eICS users and their assigned roles.
                  </p>
                </div>
              </div>

              <section className="panel">
                {isLoadingUsers && (
                  <div className="empty-state">
                    <h4>Loading users...</h4>
                  </div>
                )}
                {!isLoadingUsers && usersError && (
                  <div className="empty-state">
                    <h4>{usersError}</h4>
                  </div>
                )}
                {!isLoadingUsers && !usersError && managedUsers.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">◎</div>
                    <h4>No users to display yet.</h4>
                  </div>
                )}
                {!isLoadingUsers && !usersError && managedUsers.length > 0 && (
                  <div className="user-table-wrapper">
                    <table className="user-table">
                      <thead>
                        <tr>
                          <th>Full Name</th>
                          <th>Role</th>
                          <th>Account ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {managedUsers.map((user) => (
                          <tr key={user.id}>
                            <td>{user.full_name || 'Name unavailable'}</td>
                            <td>
                              <select
                                className="role-select"
                                value={roleOverrides[user.id] || user.role || 'personnel'}
                                onChange={(event) => void handleRoleChange(user, event.target.value)}
                                disabled={savingRoleFor === user.id}
                                aria-label={`Role for ${user.full_name || 'user'}`}
                              >
                                {roleOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              {savingRoleFor === user.id && (
                                <span className="role-save-status">Saving...</span>
                              )}
                              {roleSaveErrors[user.id] && (
                                <span className="role-save-error" role="alert">
                                  {roleSaveErrors[user.id]}
                                </span>
                              )}
                            </td>
                            <td>{user.id}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          ) : activePage === 'incident-details' ? (
            <>
              <div className="page-heading">
                <div>
                  <p className="breadcrumb">eICS / Incident Details</p>
                  <h2>Incident Details</h2>
                  <p className="page-description">
                    Review incident information and current status.
                  </p>
                </div>
                <div className="incident-detail-actions">
                  <button className="secondary-button" onClick={handleBackToDashboard}>
                    Back to Dashboard
                  </button>
                  <button
                    className="primary-button"
                    onClick={() => selectedIncidentId && openIcs211(selectedIncidentId)}
                  >
                    Check-In / ICS 211
                  </button>
                  <button
                    className="primary-button"
                    onClick={() => selectedIncidentId && openCheckInManifest(selectedIncidentId)}
                  >
                    Check-In Manifest
                  </button>
                  {canReviewResources && (
                    <button
                      className="primary-button"
                      onClick={() => selectedIncidentId && openResourceReview(selectedIncidentId)}
                    >
                      Resource Review
                    </button>
                  )}
                  <button
                    className="primary-button"
                    onClick={() => selectedIncidentId && openOrganization(selectedIncidentId)}
                  >
                    Organization / ICS 203
                  </button>
                </div>
              </div>

              {isLoadingIncidentDetails && (
                <section className="panel">
                  <div className="empty-state">
                    <h4>Loading incident details...</h4>
                  </div>
                </section>
              )}
              {!isLoadingIncidentDetails && incidentDetailsError && (
                <section className="panel">
                  <div className="empty-state">
                    <h4>{incidentDetailsError}</h4>
                    <button className="secondary-button" onClick={handleBackToDashboard}>
                      Back to Dashboard
                    </button>
                  </div>
                </section>
              )}
              {!isLoadingIncidentDetails && !incidentDetailsError && selectedIncident && (
                <div className="incident-details-stack">
                  <section className="panel incident-details-panel">
                    <div className="panel-header">
                      <h3>Incident Information</h3>
                    </div>
                    <div className="incident-details-grid">
                    <div className="incident-detail-item">
                      <span>Incident Name</span>
                      <strong>{selectedIncident.name}</strong>
                    </div>
                    <div className="incident-detail-item">
                      <span>Incident Type</span>
                      <strong>{selectedIncident.incident_type || 'Not specified'}</strong>
                    </div>
                    <div className="incident-detail-item">
                      <span>Location</span>
                      <strong>{selectedIncident.location || 'Not specified'}</strong>
                    </div>
                    <div className="incident-detail-item">
                      <span>Status</span>
                      <strong>
                        <span className="incident-status">{selectedIncident.status}</span>
                      </strong>
                    </div>
                    </div>
                  </section>

                  <section className="panel incident-details-panel incident-commander-panel">
                    <div className="panel-header">
                      <h3>Incident Commander</h3>
                    </div>
                    <div className="incident-commander-content">
                      {profile?.role === 'administrator_trainer' ? (
                        <div className="commander-assignment">
                          <select
                            className="role-select"
                            value={selectedCommanderId}
                            onChange={(event) => setSelectedCommanderId(event.target.value)}
                            disabled={isLoadingCommanderProfiles || isSavingCommander}
                            aria-label="Incident Commander"
                          >
                            <option value="">Not assigned</option>
                            {commanderProfiles.map((commander) => (
                              <option key={commander.id} value={commander.id}>
                                {commander.full_name || 'Unnamed user'}
                              </option>
                            ))}
                          </select>
                          <button
                            className="primary-button"
                            type="button"
                            onClick={() => void handleSaveCommander()}
                            disabled={isLoadingCommanderProfiles || isSavingCommander}
                          >
                            {isSavingCommander ? 'Saving...' : 'Save'}
                          </button>
                          {isLoadingCommanderProfiles && (
                            <span className="role-save-status">Loading commanders...</span>
                          )}
                          {commanderProfilesError && (
                            <span className="role-save-error" role="alert">
                              {commanderProfilesError}
                            </span>
                          )}
                          {commanderSaveMessage && (
                            <span className="role-save-status" role="status">
                              {commanderSaveMessage}
                            </span>
                          )}
                          {commanderSaveError && (
                            <span className="role-save-error" role="alert">
                              {commanderSaveError}
                            </span>
                          )}
                        </div>
                      ) : (
                        <strong className="incident-commander-readonly">
                          {selectedIncident.incident_commander_id
                            ? incidentCommanderName || 'Profile unavailable'
                            : 'Not assigned'}
                        </strong>
                      )}
                    </div>
                  </section>

                  <section className="panel incident-details-panel incident-description-panel">
                    <div className="panel-header">
                      <h3>Description</h3>
                    </div>
                    <div className="incident-detail-item incident-detail-description">
                      <p>{selectedIncident.description || 'No description provided.'}</p>
                    </div>
                  </section>
                </div>
              )}
            </>
          ) : activePage === 'organization' ? (
            <>
              <div className="page-heading">
                <div>
                  <p className="breadcrumb">eICS / Organization / ICS 203</p>
                  <h2>Organization / ICS 203</h2>
                  <p className="page-description">
                    Incident organization and assigned personnel.
                  </p>
                </div>
                <button className="secondary-button" onClick={() => setActivePage('incident-details')}>
                  Back to Incident Details
                </button>
              </div>

              {isLoadingOrganization && (
                <section className="panel organization-state-panel">
                  <div className="empty-state">
                    <h4>Loading ICS organization...</h4>
                  </div>
                </section>
              )}
              {!isLoadingOrganization && organizationError && (
                <section className="panel organization-state-panel">
                  <div className="empty-state">
                    <h4>{organizationError}</h4>
                  </div>
                </section>
              )}
              {!isLoadingOrganization && !organizationError && organizationData && (
                <>
                {organizationData.units.length === 0 ? (
                  <section className="panel organization-state-panel">
                    <div className="empty-state">
                      <h4>No organization has been initialized for this incident.</h4>
                    </div>
                  </section>
                ) : (
                  <section className="panel organization-chart-panel">
                    <div className="organization-chart-print-header">
                      <p className="eyebrow">INCIDENT COMMAND SYSTEM</p>
                      <h3>ICS 203 Organization Assignment List</h3>
                    </div>
                    <div className="organization-chart">
                      {organizationData.units
                        .filter((unit) => !unit.parent_unit_id)
                        .map((unit) => (
                          <OrganizationUnitTree
                            key={unit.id}
                            unit={unit}
                            units={organizationData.units}
                            assignments={organizationData.assignments}
                            positions={new Map(organizationData.positions.map((position) => [position.id, position]))}
                            personnel={new Map(organizationData.personnel.map((person) => [person.id, person]))}
                            onAssign={openAssignmentDialog}
                            onUnassign={(assignment) => void handleUnassignPersonnel(assignment)}
                            assigningAssignmentId={assigningAssignmentId}
                          />
                        ))}
                    </div>
                  </section>
                )}
                {assignmentMessage && (
                  <p className="form-message organization-feedback" role="status">
                    {assignmentMessage}
                  </p>
                )}
                {assignmentError && !assignmentToUpdate && (
                  <p className="form-error organization-feedback" role="alert">
                    {assignmentError}
                  </p>
                )}
                {assignmentToUpdate && (
                  <div className="assignment-modal-backdrop" role="presentation">
                    <section className="assignment-modal" role="dialog" aria-modal="true" aria-labelledby="assignment-modal-title">
                      <div className="panel-header">
                        <h3 id="assignment-modal-title">Assign Personnel</h3>
                        <p>Select an available personnel record for this position.</p>
                      </div>
                      <div className="assignment-modal-content">
                        <input
                          className="personnel-search-input"
                          type="search"
                          placeholder="Search personnel by name"
                          value={personnelSearch}
                          onChange={(event) => setPersonnelSearch(event.target.value)}
                          aria-label="Search personnel by name"
                        />
                        {organizationData.personnel.length === 0 ? (
                          <p className="empty-state-inline">No personnel available.</p>
                        ) : (
                          <div className="assignment-personnel-list">
                            {organizationData.personnel
                              .filter((person) => getOrganizationLabel(person.full_name || person.name, '').toLowerCase().includes(personnelSearch.toLowerCase()))
                              .map((person) => (
                                <label
                                  className={`assignment-personnel-option ${getResourceStatus(person) !== 'AVAILABLE' ? 'unavailable' : ''}`}
                                  key={person.id}
                                >
                                  <input
                                    type="radio"
                                    name="assignment-personnel"
                                    value={person.id}
                                    checked={selectedPersonnelId === person.id}
                                    onChange={() => setSelectedPersonnelId(person.id)}
                                    disabled={getResourceStatus(person) !== 'AVAILABLE'}
                                  />
                                  <span>
                                    {getOrganizationLabel(person.full_name || person.name, 'Unnamed personnel')}
                                    <small className="personnel-resource-status">{getResourceStatus(person)}</small>
                                  </span>
                                </label>
                              ))}
                          </div>
                        )}
                        {assignmentError && (
                          <p className="form-error" role="alert">{assignmentError}</p>
                        )}
                        <div className="form-actions">
                          <button className="primary-button" type="button" onClick={() => void handleAssignPersonnel()} disabled={isSavingAssignment}>
                            {isSavingAssignment ? 'Saving...' : 'Confirm Assignment'}
                          </button>
                          <button className="secondary-button" type="button" onClick={closeAssignmentDialog} disabled={isSavingAssignment}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    </section>
                  </div>
                )}
                </>
              )}
            </>
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <p className="breadcrumb">eICS / Create Incident</p>
                  <h2>Create Incident</h2>
                  <p className="page-description">
                    Record the initial details for a new incident.
                  </p>
                </div>
              </div>

              <section className="panel incident-form-panel">
                <form className="incident-form" onSubmit={handleCreateIncident}>
                  <div className="form-field">
                    <label htmlFor="incident-name">Incident Name</label>
                    <input
                      id="incident-name"
                      type="text"
                      value={incidentName}
                      onChange={(event) => setIncidentName(event.target.value)}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="incident-type">Incident Type</label>
                    <input
                      id="incident-type"
                      type="text"
                      value={incidentType}
                      onChange={(event) => setIncidentType(event.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="incident-location">Location</label>
                    <input
                      id="incident-location"
                      type="text"
                      value={incidentLocation}
                      onChange={(event) => setIncidentLocation(event.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="incident-description">Description</label>
                    <textarea
                      id="incident-description"
                      value={incidentDescription}
                      onChange={(event) => setIncidentDescription(event.target.value)}
                      rows={5}
                    />
                  </div>

                  {incidentFormError && (
                    <p className="form-error" role="alert">
                      {incidentFormError}
                    </p>
                  )}
                  {incidentFormMessage && (
                    <p className="form-message" role="status">
                      {incidentFormMessage}
                    </p>
                  )}

                  <div className="form-actions">
                    <button className="primary-button" type="submit" disabled={isSavingIncident}>
                      {isSavingIncident ? 'Creating...' : 'Create Incident'}
                    </button>
                    <button className="secondary-button" type="button" onClick={handleCancelIncident}>
                      Cancel
                    </button>
                  </div>
                </form>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default App