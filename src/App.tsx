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

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isAuthenticating, setIsAuthenticating] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileError, setProfileError] = useState('')
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [activePage, setActivePage] = useState<'dashboard' | 'incidents' | 'personnel' | 'user-management' | 'create-incident' | 'incident-details'>('dashboard')
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
  const [checkingOutPersonnelId, setCheckingOutPersonnelId] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState('')

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
    if (!isLoggedIn || activePage !== 'user-management') {
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
  }, [activePage, isLoggedIn])

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

      const { data: activeIncident, error: incidentError } = await supabase
        .from('incidents')
        .select('id, name, incident_type, location, status, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!isMounted) {
        return
      }

      if (incidentError) {
        setPersonnelIncident(null)
        setIncidentPersonnel([])
        setPersonnelError('Unable to load the active incident.')
        setIsLoadingPersonnel(false)
        return
      }

      if (!activeIncident) {
        setPersonnelIncident(null)
        setIncidentPersonnel([])
        setPersonnelError('No active incident is available for check-in.')
        setIsLoadingPersonnel(false)
        return
      }

      const { data: personnel, error: personnelLoadError } = await supabase
        .from('incident_personnel')
        .select('id, full_name, organization, position, check_in_time, check_out_time, status')
        .eq('incident_id', activeIncident.id)
        .order('check_in_time', { ascending: false })

      if (!isMounted) {
        return
      }

      setPersonnelIncident(activeIncident)
      if (personnelLoadError) {
        setIncidentPersonnel([])
        setPersonnelError('Unable to load checked-in personnel.')
      } else {
        setIncidentPersonnel(personnel ?? [])
      }
      setIsLoadingPersonnel(false)
    }

    void loadPersonnel()

    return () => {
      isMounted = false
    }
  }, [activePage, isLoggedIn, personnelRefreshKey])

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
    setManagedUsers([])
    setUsersError('')
    setRoleOverrides({})
    setSavingRoleFor(null)
    setRoleSaveErrors({})
    setPersonnelIncident(null)
    setIncidentPersonnel([])
    setPersonnelError('')
    setIsCheckInFormOpen(false)
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

    const { error } = await supabase.from('incidents').insert({
      name: incidentName.trim(),
      incident_type: incidentType.trim(),
      location: incidentLocation.trim(),
      description: incidentDescription.trim(),
      created_by: session.user.id,
    })

    if (error) {
      setIncidentFormError(`Unable to create incident. ${error.message}`)
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
    setActivePage('personnel')
  }

  function resetPersonnelForm() {
    setPersonnelName('')
    setPersonnelOrganization('')
    setPersonnelPosition('')
    setPersonnelContactNumber('')
    setPersonnelFormError('')
    setIsCheckInFormOpen(false)
  }

  async function handlePersonnelCheckIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!personnelName.trim()) {
      setPersonnelFormError('Full Name is required.')
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
    let profileId: string | null = null

    if (session) {
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

  function openIncidentDetails(incidentId: string) {
    setSelectedIncidentId(incidentId)
    setIncidentDetailsError('')
    setCommanderSaveMessage('')
    setCommanderSaveError('')
    setActivePage('incident-details')
  }

  function handleBackToDashboard() {
    setSelectedIncidentId(null)
    setSelectedIncident(null)
    setIncidentCommanderName(null)
    setIncidentDetailsError('')
    setCommanderSaveMessage('')
    setCommanderSaveError('')
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
              className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActivePage('dashboard')}
            >
              <span>▦</span>
              Dashboard
            </button>

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

          <div className="sidebar-section">
            <p className="sidebar-title">SYSTEM</p>

            <button
              className="nav-item"
              onClick={() => setActivePage('dashboard')}
            >
              <span>⚙</span>
              Settings
            </button>

            <button
              className={`nav-item ${activePage === 'user-management' ? 'active' : ''}`}
              onClick={() => setActivePage('user-management')}
            >
              <span>♙</span>
              User Management
            </button>
          </div>

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
          {activePage === 'dashboard' ? (
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

                <button className="quick-action">
                  <span>♟</span>
                  <div>
                    <strong>Check-in Personnel</strong>
                    <small>ICS Form 211</small>
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

              {personnelMessage && (
                <p className="form-message" role="status">
                  {personnelMessage}
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
                      <p>{personnelIncident.name}</p>
                    </div>
                  </section>

                  {isCheckInFormOpen && (
                    <section className="panel incident-form-panel personnel-form-panel">
                      <div className="panel-header">
                        <h3>Check In Personnel</h3>
                      </div>
                      <form className="incident-form" onSubmit={handlePersonnelCheckIn}>
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
          ) : activePage === 'user-management' ? (
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
                <button className="secondary-button" onClick={handleBackToDashboard}>
                  Back to Dashboard
                </button>
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