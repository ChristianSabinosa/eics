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

const roleOptions = [
  { value: 'administrator_trainer', label: 'Administrator / Trainer' },
  { value: 'incident_commander', label: 'Incident Commander' },
  { value: 'personnel', label: 'Personnel' },
  { value: 'tactical_resource', label: 'Tactical Resource' },
] as const

function getRoleLabel(role: string | null) {
  return roleOptions.find((option) => option.value === role)?.label ?? role ?? 'Personnel'
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
  const [activePage, setActivePage] = useState<'dashboard' | 'user-management'>('dashboard')
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [usersError, setUsersError] = useState('')
  const [roleOverrides, setRoleOverrides] = useState<Record<string, string>>({})
  const [savingRoleFor, setSavingRoleFor] = useState<string | null>(null)
  const [roleSaveErrors, setRoleSaveErrors] = useState<Record<string, string>>({})

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

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .order('full_name')

      if (!isMounted) {
        return
      }

      if (error) {
        setManagedUsers([])
        setUsersError('Unable to load users.')
      } else {
        setManagedUsers(data ?? [])
      }

      setIsLoadingUsers(false)
    }

    void loadUsers()

    return () => {
      isMounted = false
    }
  }, [activePage, isLoggedIn])

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
    setManagedUsers([])
    setUsersError('')
    setRoleOverrides({})
    setSavingRoleFor(null)
    setRoleSaveErrors({})
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

    const { data, error: refreshError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .order('full_name')

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

            <button className="nav-item">
              <span>⚠</span>
              Incidents
            </button>

            <button className="nav-item">
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

            <button className="primary-button">
              + Create Incident
            </button>
          </div>

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
              <strong>0</strong>
              <span className="stat-note">No active incidents</span>
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

              <div className="empty-state">
                <div className="empty-icon">✓</div>
                <h4>No active incidents</h4>
                <p>
                  Create an incident to begin using the Incident Command
                  System.
                </p>
                <button className="secondary-button">
                  Create First Incident
                </button>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <h3>Quick Actions</h3>
                  <p>Common ICS activities</p>
                </div>
              </div>

              <div className="quick-actions">
                <button className="quick-action">
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
          ) : (
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
                              <span className="user-role-display">
                                {roleOverrides[user.id] || getRoleLabel(user.role)}
                              </span>
                              <select
                                className="role-select"
                                value={roleOverrides[user.id] || getRoleLabel(user.role)}
                                onChange={(event) => void handleRoleChange(user, event.target.value)}
                                disabled={savingRoleFor === user.id}
                                aria-label={`Role for ${user.full_name || 'user'}`}
                              >
                                {roleOptions.map((option) => (
                                  <option key={option.value} value={option.label}>
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
          )}
        </main>
      </div>
    </div>
  )
}

export default App