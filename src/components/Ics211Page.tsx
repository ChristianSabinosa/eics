import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAppContext } from '../contexts/AppContext'
import type { Ics211Resource, Ics211Header, Ics211ResourceDraft } from '../types'
import { emptyIcs211ResourceDraft } from '../types'

export function Ics211Page() {
  const { setActivePage, selectedIncidentId, isAdministrator } = useAppContext()
  const [selectedIncident, setSelectedIncident] = useState<{ name: string; location: string | null; status: string } | null>(null)
  const [ics211Header, setIcs211Header] = useState<Ics211Header | null>(null)
  const [isLoadingIcs211Header, setIsLoadingIcs211Header] = useState(false)
  const [ics211HeaderError, setIcs211HeaderError] = useState('')
  const [ics211HeaderMessage, setIcs211HeaderMessage] = useState('')
  const [isSavingIcs211Header, setIsSavingIcs211Header] = useState(false)
  const [ics211HeaderDraft, setIcs211HeaderDraft] = useState({
    incident_start_date: '',
    incident_start_time: '',
    check_in_location: 'Base',
    check_in_location_other: '',
    prepared_by_name: '',
    prepared_by_signature: '',
    date_prepared: '',
    time_prepared: '',
    page_number: 1,
    total_pages: 1,
  })
  const [ics211ResourceDraft, setIcs211ResourceDraft] = useState<Ics211ResourceDraft>({ ...emptyIcs211ResourceDraft })
  const [editingIcs211ResourceId, setEditingIcs211ResourceId] = useState<string | null>(null)
  const [isSavingIcs211Resource, setIsSavingIcs211Resource] = useState(false)
  const [ics211Resources, setIcs211Resources] = useState<Ics211Resource[]>([])
  const [isLoadingIcs211, setIsLoadingIcs211] = useState(false)
  const [ics211Error, setIcs211Error] = useState('')
  const [ics211FormError, setIcs211FormError] = useState('')
  const [ics211Message, setIcs211Message] = useState('')
  const [guestCheckInLink, setGuestCheckInLink] = useState('')
  const [isCreatingGuestLink, setIsCreatingGuestLink] = useState(false)

  useEffect(() => {
    if (!selectedIncidentId) return

    let isMounted = true

    async function loadIncident() {
      const { data } = await supabase
        .from('incidents')
        .select('name, location, status')
        .eq('id', selectedIncidentId)
        .maybeSingle()
      if (isMounted && data) setSelectedIncident(data)
    }

    void loadIncident()
    return () => { isMounted = false }
  }, [selectedIncidentId])

  useEffect(() => {
    if (!selectedIncidentId) return

    let isMounted = true

    async function loadIcs211Resources() {
      setIsLoadingIcs211(true)
      setIcs211Error('')
      setIsLoadingIcs211Header(true)
      const { data: header, error: headerError } = await supabase
        .from('ics_211')
        .select('id, incident_id, incident_start_date, incident_start_time, check_in_location, check_in_location_other, prepared_by_name, prepared_by_signature, date_prepared, time_prepared, page_number, total_pages')
        .eq('incident_id', selectedIncidentId)
        .maybeSingle()

      if (!isMounted) return
      if (headerError) {
        setIcs211HeaderError(`Unable to load the ICS 211 header. ${headerError.message}`)
      } else if (header) {
        setIcs211Header(header as Ics211Header)
        setIcs211HeaderDraft({
          incident_start_date: header.incident_start_date,
          incident_start_time: header.incident_start_time,
          check_in_location: header.check_in_location,
          check_in_location_other: header.check_in_location_other || '',
          prepared_by_name: header.prepared_by_name || '',
          prepared_by_signature: header.prepared_by_signature || '',
          date_prepared: header.date_prepared || '',
          time_prepared: header.time_prepared || '',
          page_number: header.page_number,
          total_pages: header.total_pages,
        })
      }
      setIsLoadingIcs211Header(false)

      if (headerError || !header) {
        setIcs211Resources([])
        setIsLoadingIcs211(false)
        return
      }

      const { data, error } = await supabase
        .from('ics_211_resources')
        .select('id, ics_211_id, order_request_no, check_in_at, kind, type, resource_identifier, resource_classification, agency_office_home_base, leader_name, contact_details, total_personnel, point_of_origin, departure_at, method_of_travel, with_manifest, incident_assignment, other_qualifications, data_sent_to_resl_at, manifest_reference, check_in_method')
        .eq('ics_211_id', header.id)
        .order('check_in_at', { ascending: false })

      if (!isMounted) return
      if (error) {
        setIcs211Resources([])
        setIcs211Error(`Unable to load ICS 211 resources. ${error.message}`)
      } else {
        const resources = (data ?? []) as Ics211Resource[]
        const { data: manifests } = await supabase
          .from('check_in_manifests')
          .select('id, ics_211_resource_id')
          .eq('incident_id', selectedIncidentId)
          .not('ics_211_resource_id', 'is', null)
        const manifestIds = new Map((manifests ?? []).map((item) => [item.ics_211_resource_id, item.id]))
        setIcs211Resources(resources.map((resource) => ({ ...resource, manifest_id: manifestIds.get(resource.id) || null })))
      }
      setIsLoadingIcs211(false)
    }

    void loadIcs211Resources()
    return () => { isMounted = false }
  }, [selectedIncidentId])

  async function handleSaveIcs211Header(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedIncidentId || !ics211HeaderDraft.incident_start_date || !ics211HeaderDraft.incident_start_time) {
      setIcs211HeaderError('Incident start date and time are required.')
      return
    }

    setIsSavingIcs211Header(true)
    setIcs211HeaderError('')
    setIcs211HeaderMessage('')
    const headerPayload = {
      ...ics211HeaderDraft,
      check_in_location_other: ics211HeaderDraft.check_in_location === 'Others' ? ics211HeaderDraft.check_in_location_other.trim() : null,
      prepared_by_name: ics211HeaderDraft.prepared_by_name.trim() || null,
      prepared_by_signature: ics211HeaderDraft.prepared_by_signature.trim() || null,
      date_prepared: ics211HeaderDraft.date_prepared || null,
      time_prepared: ics211HeaderDraft.time_prepared || null,
    }
    const result = ics211Header
      ? await supabase.from('ics_211').update(headerPayload).eq('id', ics211Header.id).select('id, incident_id, incident_start_date, incident_start_time, check_in_location, check_in_location_other, prepared_by_name, prepared_by_signature, date_prepared, time_prepared, page_number, total_pages').single()
      : await supabase.from('ics_211').insert({ incident_id: selectedIncidentId, ...headerPayload }).select('id, incident_id, incident_start_date, incident_start_time, check_in_location, check_in_location_other, prepared_by_name, prepared_by_signature, date_prepared, time_prepared, page_number, total_pages').single()

    if (result.error || !result.data) {
      setIcs211HeaderError(`Unable to save the ICS 211 header. ${result.error?.message || 'No header was returned.'}`)
    } else {
      setIcs211Header(result.data as Ics211Header)
      setIcs211HeaderMessage('ICS 211 header saved successfully.')
    }
    setIsSavingIcs211Header(false)
  }

  async function handleSaveIcs211Resource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ics211Header || !ics211ResourceDraft.kind.trim() || !ics211ResourceDraft.type.trim() || !ics211ResourceDraft.resource_identifier.trim()) {
      setIcs211FormError('Kind, Type, and Resource Identifier are required.')
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setIcs211FormError('Your session has expired. Please sign in again.')
      return
    }

    setIsSavingIcs211Resource(true)
    setIcs211FormError('')
    setIcs211Message('')
    const resourcePayload = {
      ...ics211ResourceDraft,
      order_request_no: ics211ResourceDraft.order_request_no?.trim() || null,
      check_in_at: ics211ResourceDraft.check_in_at || new Date().toISOString(),
      agency_office_home_base: ics211ResourceDraft.agency_office_home_base?.trim() || null,
      leader_name: ics211ResourceDraft.leader_name?.trim() || null,
      contact_details: ics211ResourceDraft.contact_details?.trim() || null,
      point_of_origin: ics211ResourceDraft.point_of_origin?.trim() || null,
      method_of_travel: ics211ResourceDraft.method_of_travel?.trim() || null,
      incident_assignment: ics211ResourceDraft.incident_assignment?.trim() || null,
      other_qualifications: ics211ResourceDraft.other_qualifications?.trim() || null,
      data_sent_to_resl_at: ics211ResourceDraft.data_sent_to_resl_at || null,
      manifest_reference: ics211ResourceDraft.manifest_reference?.trim() || null,
      ics_211_id: ics211Header.id,
      check_in_method: 'authenticated',
      checked_in_by: session.user.id,
    }
    const result = editingIcs211ResourceId
      ? await supabase.from('ics_211_resources').update(resourcePayload).eq('id', editingIcs211ResourceId).select('*').single()
      : await supabase.from('ics_211_resources').insert(resourcePayload).select('*').single()

    if (result.error || !result.data) {
      setIcs211FormError(`Unable to save resource. ${result.error?.message || 'No resource was returned.'}`)
    } else {
      setIcs211Resources((current) => editingIcs211ResourceId
        ? current.map((resource) => resource.id === editingIcs211ResourceId ? result.data as Ics211Resource : resource)
        : [result.data as Ics211Resource, ...current])
      setIcs211ResourceDraft({ ...emptyIcs211ResourceDraft })
      setEditingIcs211ResourceId(null)
      setIcs211Message(editingIcs211ResourceId ? 'Resource updated successfully.' : 'Resource checked in successfully.')
    }
    setIsSavingIcs211Resource(false)
  }

  function editIcs211Resource(resource: Ics211Resource) {
    setEditingIcs211ResourceId(resource.id)
    setIcs211ResourceDraft({
      order_request_no: resource.order_request_no,
      check_in_at: resource.check_in_at?.slice(0, 16) || '',
      kind: resource.kind,
      type: resource.type,
      resource_identifier: resource.resource_identifier,
      resource_classification: resource.resource_classification,
      agency_office_home_base: resource.agency_office_home_base,
      leader_name: resource.leader_name,
      contact_details: resource.contact_details,
      total_personnel: resource.total_personnel,
      point_of_origin: resource.point_of_origin,
      departure_at: resource.departure_at?.slice(0, 16) || null,
      method_of_travel: resource.method_of_travel,
      with_manifest: resource.with_manifest,
      incident_assignment: resource.incident_assignment,
      other_qualifications: resource.other_qualifications,
      data_sent_to_resl_at: resource.data_sent_to_resl_at?.slice(0, 16) || null,
      manifest_reference: resource.manifest_reference,
    })
  }

  function openManifestForResource() {
    setActivePage('check-in-manifest')
  }

  async function createGuestCheckInLink() {
    if (!selectedIncidentId || !isAdministrator) return
    setIsCreatingGuestLink(true)
    setIcs211FormError('')
    const { data, error } = await supabase.rpc('create_incident_guest_checkin_link', {
      p_incident_id: selectedIncidentId,
      p_expires_at: null,
    })
    if (error || !data) {
      setIcs211FormError(`Unable to create guest check-in link. ${error?.message || 'No link was returned.'}`)
    } else {
      setGuestCheckInLink(`${window.location.origin}${window.location.pathname}?checkin=${data}`)
    }
    setIsCreatingGuestLink(false)
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="breadcrumb">eICS / Incidents / Check-In / ICS 211</p>
          <h2>ICS Form 211 Resource Check-In</h2>
          <p className="page-description">Incident-specific resource check-in. Personnel manifests can be linked later.</p>
        </div>
        <button className="secondary-button" type="button" onClick={() => setActivePage('incident-details')}>Back to Incident</button>
      </div>

      {selectedIncident && (
        <section className="panel incident-context-banner">
          <span>Active incident</span>
          <strong>{selectedIncident.name}</strong>
          <small>{selectedIncident.location || 'Location not specified'} · {selectedIncident.status}</small>
        </section>
      )}
      {ics211Message && <p className="form-message" role="status">{ics211Message}</p>}
      {ics211Error && <p className="form-error" role="alert">{ics211Error}</p>}

      {isLoadingIcs211Header && <section className="panel"><div className="empty-state"><h4>Loading ICS 211 header...</h4></div></section>}
      {!isLoadingIcs211Header && (
        <section className="panel incident-form-panel">
          <div className="panel-header"><div><h3>Incident Check-In List Header</h3><p>{selectedIncident?.name || 'Incident'} · Philippine ICS 211</p></div></div>
          <form className="incident-form" onSubmit={handleSaveIcs211Header}>
            <div className="form-field"><label htmlFor="ics211-start-date">Start Date</label><input id="ics211-start-date" type="date" value={ics211HeaderDraft.incident_start_date} onChange={(event) => setIcs211HeaderDraft({ ...ics211HeaderDraft, incident_start_date: event.target.value })} required /></div>
            <div className="form-field"><label htmlFor="ics211-start-time">Start Time</label><input id="ics211-start-time" type="time" value={ics211HeaderDraft.incident_start_time} onChange={(event) => setIcs211HeaderDraft({ ...ics211HeaderDraft, incident_start_time: event.target.value })} required /></div>
            <div className="form-field"><label htmlFor="ics211-check-in-location">Check-In Location</label><select id="ics211-check-in-location" value={ics211HeaderDraft.check_in_location} onChange={(event) => setIcs211HeaderDraft({ ...ics211HeaderDraft, check_in_location: event.target.value })}><option>Base</option><option>Camp</option><option>Staging Area</option><option>ICP</option><option>Others</option></select></div>
            {ics211HeaderDraft.check_in_location === 'Others' && <div className="form-field"><label htmlFor="ics211-other-location">Other Location</label><input id="ics211-other-location" value={ics211HeaderDraft.check_in_location_other} onChange={(event) => setIcs211HeaderDraft({ ...ics211HeaderDraft, check_in_location_other: event.target.value })} required /></div>}
            <div className="form-field"><label htmlFor="ics211-prepared-by">Name and Signature</label><input id="ics211-prepared-by" value={ics211HeaderDraft.prepared_by_name} onChange={(event) => setIcs211HeaderDraft({ ...ics211HeaderDraft, prepared_by_name: event.target.value })} /></div>
            <div className="form-field"><label htmlFor="ics211-signature">Signature Reference</label><input id="ics211-signature" value={ics211HeaderDraft.prepared_by_signature} onChange={(event) => setIcs211HeaderDraft({ ...ics211HeaderDraft, prepared_by_signature: event.target.value })} /></div>
            <div className="form-field"><label htmlFor="ics211-date-prepared">Date Prepared</label><input id="ics211-date-prepared" type="date" value={ics211HeaderDraft.date_prepared} onChange={(event) => setIcs211HeaderDraft({ ...ics211HeaderDraft, date_prepared: event.target.value })} /></div>
            <div className="form-field"><label htmlFor="ics211-time-prepared">Time Prepared</label><input id="ics211-time-prepared" type="time" value={ics211HeaderDraft.time_prepared} onChange={(event) => setIcs211HeaderDraft({ ...ics211HeaderDraft, time_prepared: event.target.value })} /></div>
            <div className="form-field"><label htmlFor="ics211-page-number">Page Number</label><input id="ics211-page-number" type="number" min="1" value={ics211HeaderDraft.page_number} onChange={(event) => setIcs211HeaderDraft({ ...ics211HeaderDraft, page_number: Number(event.target.value) })} /></div>
            <div className="form-field"><label htmlFor="ics211-total-pages">Total Pages</label><input id="ics211-total-pages" type="number" min="1" value={ics211HeaderDraft.total_pages} onChange={(event) => setIcs211HeaderDraft({ ...ics211HeaderDraft, total_pages: Number(event.target.value) })} /></div>
            {ics211HeaderError && <p className="form-error" role="alert">{ics211HeaderError}</p>}
            {ics211HeaderMessage && <p className="form-message" role="status">{ics211HeaderMessage}</p>}
            <div className="form-actions"><button className="primary-button" type="submit" disabled={isSavingIcs211Header}>{isSavingIcs211Header ? 'Saving...' : 'Save / Update Header'}</button></div>
          </form>
        </section>
      )}

      {ics211Header && <section className="panel incident-form-panel">
        <div className="panel-header"><div><h3>{editingIcs211ResourceId ? 'Edit Resource Check-In' : 'Add Resource Check-In'}</h3><p>Resource check-in records remain separate from the future personnel manifest.</p></div></div>
        <form className="incident-form" onSubmit={handleSaveIcs211Resource}>
          <div className="form-field"><label htmlFor="ics211-order">Order / Request No.</label><input id="ics211-order" value={ics211ResourceDraft.order_request_no || ''} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, order_request_no: event.target.value })} /></div>
          <div className="form-field"><label htmlFor="ics211-check-in">Check-In Date and Time</label><input id="ics211-check-in" type="datetime-local" value={ics211ResourceDraft.check_in_at?.slice(0, 16) || ''} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, check_in_at: event.target.value })} required /></div>
          <div className="form-field"><label htmlFor="ics211-kind">Kind</label><input id="ics211-kind" value={ics211ResourceDraft.kind} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, kind: event.target.value })} required /></div>
          <div className="form-field"><label htmlFor="ics211-type">Type</label><input id="ics211-type" value={ics211ResourceDraft.type} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, type: event.target.value })} required /></div>
          <div className="form-field"><label htmlFor="ics211-identifier">Resource Identifier</label><input id="ics211-identifier" value={ics211ResourceDraft.resource_identifier} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, resource_identifier: event.target.value })} placeholder="TF-1, ST-1, SAR-1, AMB-1" required /></div>
          <div className="form-field"><label htmlFor="ics211-classification">Resource Classification</label><select id="ics211-classification" value={ics211ResourceDraft.resource_classification} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, resource_classification: event.target.value })}><option value="Single">Single</option><option value="TF">TF</option><option value="ST">ST</option></select></div>
          <div className="form-field"><label htmlFor="ics211-agency">Agency / Office / Home Base</label><input id="ics211-agency" value={ics211ResourceDraft.agency_office_home_base || ''} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, agency_office_home_base: event.target.value })} /></div>
          <div className="form-field"><label htmlFor="ics211-leader">Name of Leader</label><input id="ics211-leader" value={ics211ResourceDraft.leader_name || ''} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, leader_name: event.target.value })} /></div>
          <div className="form-field"><label htmlFor="ics211-contact">Contact Details</label><input id="ics211-contact" value={ics211ResourceDraft.contact_details || ''} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, contact_details: event.target.value })} /></div>
          <div className="form-field"><label htmlFor="ics211-personnel-total">Total No. of Personnel</label><input id="ics211-personnel-total" type="number" min="0" value={ics211ResourceDraft.total_personnel ?? ''} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, total_personnel: event.target.value ? Number(event.target.value) : null })} /></div>
          <div className="form-field"><label htmlFor="ics211-origin">Point of Origin</label><input id="ics211-origin" value={ics211ResourceDraft.point_of_origin || ''} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, point_of_origin: event.target.value })} /></div>
          <div className="form-field"><label htmlFor="ics211-departure">Departure Date and Time</label><input id="ics211-departure" type="datetime-local" value={ics211ResourceDraft.departure_at?.slice(0, 16) || ''} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, departure_at: event.target.value || null })} /></div>
          <div className="form-field"><label htmlFor="ics211-travel">Method of Travel</label><input id="ics211-travel" value={ics211ResourceDraft.method_of_travel || ''} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, method_of_travel: event.target.value })} /></div>
          <div className="form-field"><label htmlFor="ics211-manifest">With Manifest?</label><select id="ics211-manifest" value={ics211ResourceDraft.with_manifest ? 'yes' : 'no'} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, with_manifest: event.target.value === 'yes' })}><option value="no">No</option><option value="yes">Yes</option></select></div>
          <div className="form-field"><label htmlFor="ics211-assignment">Incident Assignment</label><input id="ics211-assignment" value={ics211ResourceDraft.incident_assignment || ''} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, incident_assignment: event.target.value })} /></div>
          <div className="form-field"><label htmlFor="ics211-qualifications">Other Qualifications</label><input id="ics211-qualifications" value={ics211ResourceDraft.other_qualifications || ''} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, other_qualifications: event.target.value })} /></div>
          <div className="form-field"><label htmlFor="ics211-resl">Data Sent to RESL</label><input id="ics211-resl" type="datetime-local" value={ics211ResourceDraft.data_sent_to_resl_at?.slice(0, 16) || ''} onChange={(event) => setIcs211ResourceDraft({ ...ics211ResourceDraft, data_sent_to_resl_at: event.target.value || null })} /></div>
          {ics211FormError && <p className="form-error" role="alert">{ics211FormError}</p>}
          <div className="form-actions"><button className="primary-button" type="submit" disabled={isSavingIcs211Resource}>{isSavingIcs211Resource ? 'Saving...' : editingIcs211ResourceId ? 'Update Resource' : 'Add Resource'}</button>{editingIcs211ResourceId && <button className="secondary-button" type="button" onClick={() => { setEditingIcs211ResourceId(null); setIcs211ResourceDraft({ ...emptyIcs211ResourceDraft }) }}>Cancel Edit</button>}</div>
        </form>
      </section>}

      {isAdministrator && (
        <section className="panel guest-link-panel">
          <div className="panel-header"><div><h3>Guest Tactical Resource Check-In</h3><p>Create an incident-specific link for non-IMT resources without eICS accounts.</p></div></div>
          <button className="secondary-button" type="button" onClick={() => void createGuestCheckInLink()} disabled={isCreatingGuestLink}>
            {isCreatingGuestLink ? 'Creating Link...' : 'Create Guest Check-In Link'}
          </button>
          {guestCheckInLink && <input className="guest-link-output" readOnly value={guestCheckInLink} aria-label="Incident guest check-in link" />}
        </section>
      )}

      <section className="panel personnel-list-panel">
        <div className="panel-header"><div><h3>ICS 211 Resources</h3><p>Resources checked into this incident. Each record is ready for future manifest association.</p></div></div>
        {isLoadingIcs211Header || isLoadingIcs211 ? <div className="empty-state"><h4>Loading ICS 211 resources...</h4></div> : ics211Resources.length === 0 ? <div className="empty-state"><h4>No resources checked in</h4><p>Use Add Resource above or provide the incident-specific guest link.</p></div> : (
          <div className="user-table-wrapper">
            <table className="user-table personnel-table">
              <thead><tr><th>Order / Request</th><th>Kind</th><th>Type</th><th>Resource</th><th>Class</th><th>Agency / Home Base</th><th>Leader</th><th>Personnel</th><th>Check-In</th><th>RESL</th><th>Manifest</th><th>Actions</th></tr></thead>
              <tbody>{ics211Resources.map((resource) => (
                <tr key={resource.id}>
                  <td>{resource.order_request_no || 'Not specified'}</td>
                  <td>{resource.kind}</td>
                  <td>{resource.type}</td>
                  <td>{resource.resource_identifier}</td>
                  <td>{resource.resource_classification}</td>
                  <td>{resource.agency_office_home_base || 'Not specified'}</td>
                  <td>{resource.leader_name || 'Not specified'}</td>
                  <td>{resource.total_personnel ?? 'Not specified'}</td>
                  <td>{new Date(resource.check_in_at).toLocaleString()}</td>
                  <td>{resource.data_sent_to_resl_at ? new Date(resource.data_sent_to_resl_at).toLocaleString() : 'Not sent'}</td>
                  <td>{resource.manifest_id ? 'Linked' : resource.manifest_reference || 'Not linked'}</td>
                  <td>
                    <button className="secondary-button" type="button" onClick={() => editIcs211Resource(resource)}>Edit</button>
                    <button className="primary-button" type="button" onClick={() => openManifestForResource()}>
                      {resource.manifest_id ? 'View/Edit Manifest' : 'Create Manifest'}
                    </button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
