function App() {
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

        <div className="header-status">
          <span className="status-dot"></span>
          System Online
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
                Incident Command System overview
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
                <h4>No Active Incidents</h4>
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
                    <strong>Create ICS Form</strong>
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