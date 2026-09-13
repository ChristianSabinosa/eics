import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Ics211ResourceDraft } from '../types'
import { emptyIcs211ResourceDraft } from '../types'

export function GuestCheckIn({ token }: { token: string }) {
  const [context, setContext] = useState<{ incident_name: string; incident_location: string | null; ics_211_id: string | null; expires_at: string | null } | null>(null)
  const [resource, setResource] = useState<Ics211ResourceDraft>({ ...emptyIcs211ResourceDraft })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function loadContext() {
      const { data, error: contextError } = await supabase.rpc('get_guest_checkin_context', { p_token: token })
      if (contextError || !data?.[0]) {
        setError('This incident check-in link is invalid, expired, or no longer active.')
      } else {
        setContext(data[0])
      }
      setIsLoading(false)
    }

    void loadContext()
  }, [token])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSaving(true)

    const { error: submitError } = await supabase.rpc('submit_guest_ics211_resource', {
      p_token: token,
      p_order_request_no: resource.order_request_no?.trim() || null,
      p_kind: resource.kind.trim(),
      p_type: resource.type.trim(),
      p_resource_identifier: resource.resource_identifier.trim(),
      p_resource_classification: resource.resource_classification,
      p_agency_office_home_base: resource.agency_office_home_base?.trim() || null,
      p_leader_name: resource.leader_name?.trim() || null,
      p_contact_details: resource.contact_details?.trim() || null,
      p_total_personnel: resource.total_personnel,
      p_point_of_origin: resource.point_of_origin?.trim() || null,
      p_departure_at: resource.departure_at || null,
      p_method_of_travel: resource.method_of_travel?.trim() || null,
      p_with_manifest: resource.with_manifest,
      p_incident_assignment: resource.incident_assignment?.trim() || null,
      p_other_qualifications: resource.other_qualifications?.trim() || null,
    })

    if (submitError) {
      setError(submitError.message)
    } else {
      setMessage('Resource checked in successfully. The incident team can now review it in ICS 211.')
      setResource({ ...emptyIcs211ResourceDraft })
    }
    setIsSaving(false)
  }

  return (
    <main className="guest-check-in-page">
      <section className="login-card guest-check-in-card">
        <div className="login-brand">
          <div className="login-brand-mark">eICS</div>
          <div>
            <h1>Incident Resource Check-In</h1>
            <p>ICS Form 211</p>
          </div>
        </div>
        {isLoading && <div className="empty-state"><h4>Validating incident link...</h4></div>}
        {!isLoading && error && !context && <p className="form-error" role="alert">{error}</p>}
        {!isLoading && context && (
          <>
            <div className="guest-incident-summary">
              <span>Authorized incident</span>
              <strong>{context.incident_name}</strong>
              <small>{context.incident_location || 'Location not specified'}</small>
            </div>
            <form className="login-form" onSubmit={handleSubmit}>
              <label htmlFor="guest-order-request">Order / Request No.</label>
              <input id="guest-order-request" value={resource.order_request_no || ''} onChange={(event) => setResource({ ...resource, order_request_no: event.target.value })} />
              <label htmlFor="guest-kind">Kind</label>
              <input id="guest-kind" value={resource.kind} onChange={(event) => setResource({ ...resource, kind: event.target.value })} required />
              <label htmlFor="guest-type">Type</label>
              <input id="guest-type" value={resource.type} onChange={(event) => setResource({ ...resource, type: event.target.value })} required />
              <label htmlFor="guest-resource-identifier">Resource Identifier</label>
              <input id="guest-resource-identifier" value={resource.resource_identifier} onChange={(event) => setResource({ ...resource, resource_identifier: event.target.value })} required />
              <label htmlFor="guest-resource-classification">Resource Classification</label>
              <select id="guest-resource-classification" value={resource.resource_classification} onChange={(event) => setResource({ ...resource, resource_classification: event.target.value })}>
                <option value="Single">Single</option><option value="TF">TF</option><option value="ST">ST</option>
              </select>
              <label htmlFor="guest-agency">Agency / Office / Home Base</label>
              <input id="guest-agency" value={resource.agency_office_home_base || ''} onChange={(event) => setResource({ ...resource, agency_office_home_base: event.target.value })} />
              <label htmlFor="guest-leader">Leader</label>
              <input id="guest-leader" value={resource.leader_name || ''} onChange={(event) => setResource({ ...resource, leader_name: event.target.value })} />
              <label htmlFor="guest-contact">Contact Details</label>
              <input id="guest-contact" value={resource.contact_details || ''} onChange={(event) => setResource({ ...resource, contact_details: event.target.value })} />
              <label htmlFor="guest-total-personnel">Total No. of Personnel</label>
              <input id="guest-total-personnel" type="number" min="0" value={resource.total_personnel ?? ''} onChange={(event) => setResource({ ...resource, total_personnel: event.target.value ? Number(event.target.value) : null })} />
              <label htmlFor="guest-assignment">Incident Assignment</label>
              <input id="guest-assignment" value={resource.incident_assignment || ''} onChange={(event) => setResource({ ...resource, incident_assignment: event.target.value })} />
              <label htmlFor="guest-qualifications">Other Qualifications</label>
              <input id="guest-qualifications" value={resource.other_qualifications || ''} onChange={(event) => setResource({ ...resource, other_qualifications: event.target.value })} />
              <label htmlFor="guest-manifest">With Manifest?</label>
              <select id="guest-manifest" value={resource.with_manifest ? 'yes' : 'no'} onChange={(event) => setResource({ ...resource, with_manifest: event.target.value === 'yes' })}>
                <option value="no">No</option><option value="yes">Yes</option>
              </select>
              {message && <p className="form-message" role="status">{message}</p>}
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="login-button" type="submit" disabled={isSaving}>{isSaving ? 'Checking In...' : 'Check In Resource'}</button>
            </form>
          </>
        )}
        <p className="login-footer">No eICS account is required for this incident-specific check-in.</p>
      </section>
    </main>
  )
}
