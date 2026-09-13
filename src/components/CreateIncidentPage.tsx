import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAppContext } from '../contexts/AppContext'

export function CreateIncidentPage() {
  const { setActivePage } = useAppContext()
  const [incidentName, setIncidentName] = useState('')
  const [incidentType, setIncidentType] = useState('')
  const [incidentLocation, setIncidentLocation] = useState('')
  const [incidentDescription, setIncidentDescription] = useState('')
  const [incidentFormError, setIncidentFormError] = useState('')
  const [incidentFormMessage, setIncidentFormMessage] = useState('')
  const [isSavingIncident, setIsSavingIncident] = useState(false)

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

    const { data: incident, error } = await supabase
      .from('incidents')
      .insert({
        name: incidentName.trim(),
        incident_type: incidentType.trim(),
        location: incidentLocation.trim(),
        description: incidentDescription.trim(),
        created_by: session.user.id,
      })
      .select('id')
      .single()

    if (error || !incident) {
      setIncidentFormError(
        `Unable to create incident. ${error?.message || 'No incident ID was returned.'}`,
      )
      setIsSavingIncident(false)
      return
    }

    const { error: organizationError } = await supabase.rpc(
      'create_default_ics_organization',
      {
        p_incident_id: incident.id,
      },
    )

    if (organizationError) {
      setIncidentFormError(
        `Incident created, but the default ICS organization could not be created. ${organizationError.message}`,
      )
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

  return (
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
  )
}
