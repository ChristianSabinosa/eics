import { useAppContext } from '../contexts/AppContext'


export function Sidebar() {
  const { profile, profileError, isLoadingProfile, activePage, setActivePage, isAdministrator } = useAppContext()

  function openIncidents() {
    setActivePage('incidents')
  }

  function openPersonnel() {
    setActivePage('personnel')
  }

  return (
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
  )
}
