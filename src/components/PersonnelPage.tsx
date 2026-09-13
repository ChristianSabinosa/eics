import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { getPersonnelResourceName, getOrganizationLabel } from '../utils/helpers'
import type { Incident, IncidentPersonnel, PersonnelResource } from '../types'

export function PersonnelPage() {
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

  useEffect(() => {
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

      if (!isMounted) return

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

      if (!isMounted) return

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
    return () => { isMounted = false }
  }, [personnelRefreshKey, selectedPersonnelIncidentId])

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

    if (!resource) return

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

  return (
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
  )
}
