import { useAppContext } from '../contexts/AppContext'

export function SystemDashboardPage() {
  const { setActivePage } = useAppContext()

  return (
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
  )
}
