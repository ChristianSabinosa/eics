import './App.css'
import { useState } from 'react'
import type { FormEvent } from 'react'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (username === 'admin' && password === 'eics123') {
      setIsLoggedIn(true)
      setLoginError('')
      return
    }

    setLoginError('Invalid username or password.')
  }

  function handleLogout() {
    setIsLoggedIn(false)
    setUsername('')
    setPassword('')
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
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
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

            <button className="login-button" type="submit">
              Login
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

            <button className="nav-item active">
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

            <button className="nav-item">
              <span>⚙</span>
              Settings
            </button>
          </div>

          <div className="sidebar-footer">
            <strong>eICS</strong>
            <span>Version 0.1.0</span>
          </div>
        </aside>

        <main className="main-content">
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
        </main>
      </div>
    </div>
  )
}

export default App