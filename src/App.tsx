import './App.css'
import { AppProvider, useAppContext } from './contexts/AppContext'
import { GuestCheckIn } from './components/GuestCheckIn'
import { LoginPage } from './components/LoginPage'
import { Sidebar } from './components/Sidebar'
import { DashboardPage } from './components/DashboardPage'
import { IncidentsPage } from './components/IncidentsPage'
import { PersonnelPage } from './components/PersonnelPage'
import { CreateIncidentPage } from './components/CreateIncidentPage'
import { IncidentDetailsPage } from './components/IncidentDetailsPage'
import { Ics211Page } from './components/Ics211Page'
import { ManifestPage } from './components/ManifestPage'
import { ResourceReviewPage } from './components/ResourceReviewPage'
import { UserManagementPage } from './components/UserManagementPage'
import { SystemDashboardPage } from './components/SystemDashboardPage'

function AppContent() {
  const { isLoggedIn, isAuthenticating, activePage, isAdministrator, handleLogout } = useAppContext()

  const guestToken = new URLSearchParams(window.location.search).get('checkin')
  if (guestToken) {
    return <GuestCheckIn token={guestToken} />
  }

  if (isAuthenticating) {
    return (
      <main className="login-page">
        <section className="login-card">
          <div className="empty-state"><h4>Loading...</h4></div>
        </section>
      </main>
    )
  }

  if (!isLoggedIn) {
    return <LoginPage />
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
        <Sidebar />

        <main className="main-content">
          {activePage === 'dashboard' && <DashboardPage />}
          {activePage === 'incidents' && <IncidentsPage />}
          {activePage === 'personnel' && <PersonnelPage />}
          {activePage === 'create-incident' && <CreateIncidentPage />}
          {activePage === 'incident-details' && <IncidentDetailsPage />}
          {activePage === 'ics-211' && <Ics211Page />}
          {activePage === 'check-in-manifest' && <ManifestPage />}
          {activePage === 'resource-review' && <ResourceReviewPage />}
          {activePage === 'organization' && <p>Organization page placeholder</p>}
          {activePage === 'user-management' && isAdministrator && <UserManagementPage />}
          {activePage === 'system-dashboard' && isAdministrator && <SystemDashboardPage />}
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
