import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAppContext } from '../contexts/AppContext'
import type { Incident } from '../types'

export function DashboardPage() {
  const { setActivePage, setSelectedIncidentId } = useAppContext()
  const [activeIncidents, setActiveIncidents] = useState<Incident[]>([])
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(false)
  const [incidentsError, setIncidentsError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadActiveIncidents() {
      setIsLoadingIncidents(true)
      setIncidentsError('')

      const { data, error } = await supabase
        .from('incidents')
        .select('id, name, incident_type, location, status, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (!isMounted) return

      if (error) {
        setActiveIncidents([])
        setIncidentsError('Unable to load active incidents.')
      } else {
        setActiveIncidents(data ?? [])
      }

      setIsLoadingIncidents(false)
    }

    void loadActiveIncidents()
    return () => { isMounted = false }
  }, [])

  function openCreateIncident() {
    setActivePage('create-incident')
  }

  function openIncidents() {
    setActivePage('incidents')
  }

  function openIncidentDetails(incidentId: string) {
    setSelectedIncidentId(incidentId)
    setActivePage('incident-details')
  }

  return (
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
  )
}
