import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAppContext } from '../contexts/AppContext'
import type { IncidentDetails, CommanderProfile } from '../types'

export function IncidentDetailsPage() {
  const { setActivePage, selectedIncidentId, setSelectedIncidentId, isAdministrator } = useAppContext()
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

  const canReviewResources = isAdministrator

  useEffect(() => {
    if (!selectedIncidentId) return

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

      if (!isMounted) return

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

      if (!isMounted) return

      setSelectedIncident(data)
      setIncidentCommanderName(commanderName)
      setSelectedCommanderId(data.incident_commander_id ?? '')
      setIsLoadingIncidentDetails(false)
    }

    void loadIncidentDetails()
    return () => { isMounted = false }
  }, [selectedIncidentId, incidentDetailsRefreshKey])

  useEffect(() => {
    if (!selectedIncidentId || !isAdministrator) return

    let isMounted = true

    async function loadCommanderProfiles() {
      setIsLoadingCommanderProfiles(true)
      setCommanderProfilesError('')

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'incident_commander')
        .order('full_name')

      if (!isMounted) return

      if (error) {
        setCommanderProfiles([])
        setCommanderProfilesError('Unable to load Incident Commander profiles.')
      } else {
        setCommanderProfiles(data ?? [])
      }

      setIsLoadingCommanderProfiles(false)
    }

    void loadCommanderProfiles()
    return () => { isMounted = false }
  }, [selectedIncidentId, isAdministrator])

  async function handleSaveCommander() {
    if (!selectedIncidentId) return

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

  function handleBackToDashboard() {
    setSelectedIncidentId(null)
    setActivePage('dashboard')
  }

  function openIcs211() {
    setActivePage('ics-211')
  }

  function openCheckInManifest() {
    setActivePage('check-in-manifest')
  }

  function openResourceReview() {
    setActivePage('resource-review')
  }

  function openOrganization() {
    setActivePage('organization')
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="breadcrumb">eICS / Incident Details</p>
          <h2>Incident Details</h2>
          <p className="page-description">
            Review incident information and current status.
          </p>
        </div>
        <div className="incident-detail-actions">
          <button className="secondary-button" onClick={handleBackToDashboard}>
            Back to Dashboard
          </button>
          <button className="primary-button" onClick={openIcs211}>
            Check-In / ICS 211
          </button>
          <button className="primary-button" onClick={openCheckInManifest}>
            Check-In Manifest
          </button>
          {canReviewResources && (
            <button className="primary-button" onClick={openResourceReview}>
              Resource Review
            </button>
          )}
          <button className="primary-button" onClick={openOrganization}>
            Organization / ICS 203
          </button>
        </div>
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
              {isAdministrator ? (
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
  )
}
