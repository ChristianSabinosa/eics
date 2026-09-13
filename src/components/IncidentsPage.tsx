import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAppContext } from '../contexts/AppContext'
import type { Incident } from '../types'

export function IncidentsPage() {
  const { setActivePage, setSelectedIncidentId } = useAppContext()
  const [allIncidents, setAllIncidents] = useState<Incident[]>([])
  const [isLoadingAllIncidents, setIsLoadingAllIncidents] = useState(false)
  const [allIncidentsError, setAllIncidentsError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadAllIncidents() {
      setIsLoadingAllIncidents(true)
      setAllIncidentsError('')

      const { data, error } = await supabase
        .from('incidents')
        .select('id, name, incident_type, location, status, created_at')
        .order('created_at', { ascending: false })

      if (!isMounted) return

      if (error) {
        setAllIncidents([])
        setAllIncidentsError('Unable to load incidents.')
      } else {
        setAllIncidents(data ?? [])
      }

      setIsLoadingAllIncidents(false)
    }

    void loadAllIncidents()
    return () => { isMounted = false }
  }, [])

  function openCreateIncident() {
    setActivePage('create-incident')
  }

  function openIncidentDetails(incidentId: string) {
    setSelectedIncidentId(incidentId)
    setActivePage('incident-details')
  }

  return (
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
  )
}
