import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAppContext } from '../contexts/AppContext'
import { createManifestRowId } from '../utils/helpers'
import type { Ics211Resource, CheckInManifest, ManifestPersonnel, ManifestVehicle, ManifestEquipment, ManifestOther } from '../types'
import type { ManifestPersonnelDraft, ManifestVehicleDraft, ManifestEquipmentDraft } from '../types'
import { emptyManifestPersonnel, emptyManifestVehicle, emptyManifestEquipment } from '../types'

export function ManifestPage() {
  const { setActivePage, selectedIncidentId } = useAppContext()
  const [selectedIncident, setSelectedIncident] = useState<{ name: string; location: string | null; status: string } | null>(null)
  const [manifest, setManifest] = useState<CheckInManifest | null>(null)
  const [manifestResource, setManifestResource] = useState<Ics211Resource | null>(null)
  const [manifestResourceId] = useState<string | null>(null)
  const [manifestResourceOptions, setManifestResourceOptions] = useState<{ id: string; resource_identifier: string; kind: string; type: string; agency_office_home_base: string | null }[]>([])
  const [manifestPersonnel, setManifestPersonnel] = useState<ManifestPersonnel[]>([])
  const [manifestVehicles, setManifestVehicles] = useState<ManifestVehicle[]>([])
  const [manifestEquipment, setManifestEquipment] = useState<ManifestEquipment[]>([])
  const [manifestOthers, setManifestOthers] = useState<ManifestOther[]>([])
  const [manifestError, setManifestError] = useState('')
  const [manifestMessage, setManifestMessage] = useState('')
  const [isLoadingManifest, setIsLoadingManifest] = useState(false)
  const [isSavingManifest, setIsSavingManifest] = useState(false)
  const [manifestRefreshKey, setManifestRefreshKey] = useState(0)
  const [manifestDraft, setManifestDraft] = useState({ agency_office_home_base: '', leader_name: '', contact_details: '', ics_211_resource_id: '' })

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
    async function loadManifest() {
      setIsLoadingManifest(true)
      setManifestError('')
      setManifest(null)
      setManifestResource(null)
      setManifestResourceOptions([])
      setManifestPersonnel([])
      setManifestVehicles([])
      setManifestEquipment([])
      setManifestOthers([])
      let headerQuery = supabase
        .from('check_in_manifests')
        .select('id, incident_id, ics_211_resource_id, agency_office_home_base, leader_name, contact_details, total_personnel, total_vehicles, total_land_vehicles, total_water_vehicles, total_air_vehicles, total_equipment')
        .eq('incident_id', selectedIncidentId)
      if (manifestResourceId) {
        headerQuery = headerQuery.eq('ics_211_resource_id', manifestResourceId)
      } else {
        headerQuery = headerQuery.order('created_at', { ascending: false })
      }
      const { data: header, error: headerError } = await headerQuery.maybeSingle()
      if (!isMounted) return
      if (headerError) {
        setManifestError(`Unable to load the Check-In Manifest. ${headerError.message}`)
        setIsLoadingManifest(false)
        return
      }
      const { data: selectedResource } = manifestResourceId
        ? await supabase
          .from('ics_211_resources')
          .select('id, ics_211_id, order_request_no, check_in_at, kind, type, resource_identifier, resource_classification, agency_office_home_base, leader_name, contact_details, total_personnel, point_of_origin, departure_at, method_of_travel, with_manifest, incident_assignment, other_qualifications, data_sent_to_resl_at, manifest_reference, check_in_method')
          .eq('id', manifestResourceId)
          .maybeSingle()
        : { data: null }
      setManifestResource((selectedResource as Ics211Resource | null) || null)
      const { data: ics211 } = await supabase
        .from('ics_211')
        .select('id')
        .eq('incident_id', selectedIncidentId)
        .maybeSingle()
      const { data: resourceOptions } = ics211
        ? await supabase
          .from('ics_211_resources')
          .select('id, resource_identifier, kind, type, agency_office_home_base')
          .eq('ics_211_id', ics211.id)
          .order('resource_identifier')
        : { data: [] }
      setManifestResourceOptions(resourceOptions || [])
      setManifest(header as CheckInManifest | null)
      if (!header) {
        setManifestDraft({
          agency_office_home_base: '',
          leader_name: '',
          contact_details: '',
          ics_211_resource_id: manifestResourceId || '',
        })
        setIsLoadingManifest(false)
        return
      }
      setManifestDraft({
        agency_office_home_base: header.agency_office_home_base || '',
        leader_name: header.leader_name || '',
        contact_details: header.contact_details || '',
        ics_211_resource_id: header.ics_211_resource_id || '',
      })
      const [personnelResult, vehiclesResult, equipmentResult, othersResult] = await Promise.all([
        supabase.from('check_in_manifest_personnel').select('*').eq('manifest_id', header.id).order('created_at'),
        supabase.from('check_in_manifest_vehicles').select('*').eq('manifest_id', header.id).order('created_at'),
        supabase.from('check_in_manifest_equipment').select('*').eq('manifest_id', header.id).order('created_at'),
        supabase.from('check_in_manifest_others').select('id, manifest_id, description').eq('manifest_id', header.id).order('created_at'),
      ])
      if (!isMounted) return
      const queryError = personnelResult.error || vehiclesResult.error || equipmentResult.error || othersResult.error
      if (queryError) setManifestError(`Unable to load manifest details. ${queryError.message}`)
      setManifestPersonnel((personnelResult.data || []) as ManifestPersonnel[])
      setManifestVehicles((vehiclesResult.data || []) as ManifestVehicle[])
      setManifestEquipment((equipmentResult.data || []) as ManifestEquipment[])
      setManifestOthers((othersResult.data || []) as ManifestOther[])
      setIsLoadingManifest(false)
    }
    void loadManifest()
    return () => { isMounted = false }
  }, [selectedIncidentId, manifestResourceId, manifestRefreshKey])

  function addManifestPersonnelRow() {
    setManifestPersonnel((rows) => [...rows, { id: createManifestRowId(), manifest_id: manifest?.id || '', ...emptyManifestPersonnel }])
  }

  function addManifestVehicleRow() {
    setManifestVehicles((rows) => [...rows, { id: createManifestRowId(), manifest_id: manifest?.id || '', ...emptyManifestVehicle }])
  }

  function addManifestEquipmentRow() {
    setManifestEquipment((rows) => [...rows, { id: createManifestRowId(), manifest_id: manifest?.id || '', ...emptyManifestEquipment }])
  }

  function addManifestOtherRow() {
    setManifestOthers((rows) => [...rows, { id: createManifestRowId(), manifest_id: manifest?.id || '', description: '' }])
  }

  function updateManifestPersonnelRow(id: string, field: keyof ManifestPersonnelDraft, value: string | number | null) {
    setManifestPersonnel((rows) => rows.map((row) => row.id === id ? { ...row, [field]: value } : row))
  }

  function updateManifestVehicleRow(id: string, field: keyof ManifestVehicleDraft, value: string | number | null) {
    setManifestVehicles((rows) => rows.map((row) => row.id === id ? { ...row, [field]: value } : row))
  }

  function updateManifestEquipmentRow(id: string, field: keyof ManifestEquipmentDraft, value: string | number | null) {
    setManifestEquipment((rows) => rows.map((row) => row.id === id ? { ...row, [field]: value } : row))
  }

  function updateManifestOtherRow(id: string, description: string) {
    setManifestOthers((rows) => rows.map((row) => row.id === id ? { ...row, description } : row))
  }

  async function saveManifestRows<T extends { id: string; manifest_id: string }>(
    table: 'check_in_manifest_personnel' | 'check_in_manifest_vehicles' | 'check_in_manifest_equipment' | 'check_in_manifest_others',
    rows: T[],
    manifestId: string,
  ) {
    const { data: existingRows, error: existingError } = await supabase.from(table).select('id').eq('manifest_id', manifestId)
    if (existingError) throw existingError
    const currentPersistedIds = new Set(rows.filter((row) => !row.id.startsWith('draft-')).map((row) => row.id))
    const idsToDelete = (existingRows || []).map((row) => row.id).filter((id) => !currentPersistedIds.has(id))
    if (idsToDelete.length > 0) {
      const { error } = await supabase.from(table).delete().in('id', idsToDelete).eq('manifest_id', manifestId)
      if (error) throw error
    }
    const savedRows: T[] = []
    for (const row of rows) {
      const payload = { ...row } as Record<string, unknown>
      delete payload.id
      delete payload.manifest_id
      const result = row.id.startsWith('draft-')
        ? await supabase.from(table).insert({ ...payload, manifest_id: manifestId }).select('*').single()
        : await supabase.from(table).update(payload).eq('id', row.id).eq('manifest_id', manifestId).select('*').single()
      if (result.error || !result.data) throw result.error || new Error(`Unable to save ${table} row.`)
      savedRows.push(result.data as T)
    }
    return savedRows
  }

  async function saveManifest() {
    if (!selectedIncidentId) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setManifestError('Your session has expired. Please sign in again.')
      return
    }
    const invalidPersonnel = manifestPersonnel.some((row) => !row.name.trim())
    const invalidOthers = manifestOthers.some((row) => !row.description.trim())
    if (invalidPersonnel || invalidOthers) {
      setManifestError('Complete or remove empty Personnel and Others rows before saving.')
      return
    }
    setIsSavingManifest(true)
    setManifestError('')
    setManifestMessage('')
    try {
      const counts = {
        total_personnel: manifestPersonnel.length,
        total_vehicles: manifestVehicles.length,
        total_land_vehicles: manifestVehicles.filter((vehicle) => vehicle.vehicle_category === 'LAND').length,
        total_water_vehicles: manifestVehicles.filter((vehicle) => vehicle.vehicle_category === 'WATER').length,
        total_air_vehicles: manifestVehicles.filter((vehicle) => vehicle.vehicle_category === 'AIR').length,
        total_equipment: manifestEquipment.length,
      }
      const payload = {
        incident_id: selectedIncidentId,
        ics_211_resource_id: manifestResourceId || manifestDraft.ics_211_resource_id || null,
        agency_office_home_base: manifestDraft.agency_office_home_base.trim() || null,
        leader_name: manifestDraft.leader_name.trim() || null,
        contact_details: manifestDraft.contact_details.trim() || null,
        ...counts,
      }
      const headerResult = manifest
        ? await supabase.from('check_in_manifests').update(payload).eq('id', manifest.id).select('*').single()
        : await supabase.from('check_in_manifests').insert({ ...payload, created_by: session.user.id }).select('*').single()
      if (headerResult.error || !headerResult.data) throw headerResult.error || new Error('No manifest was returned.')
      const manifestId = headerResult.data.id as string
      await saveManifestRows('check_in_manifest_personnel', manifestPersonnel, manifestId)
      await saveManifestRows('check_in_manifest_vehicles', manifestVehicles, manifestId)
      await saveManifestRows('check_in_manifest_equipment', manifestEquipment, manifestId)
      await saveManifestRows('check_in_manifest_others', manifestOthers, manifestId)
      setManifestMessage('Manifest and all rows saved successfully. Reloading...')
      setManifestRefreshKey((currentKey) => currentKey + 1)
    } catch (error) {
      setManifestError(`Unable to save the complete manifest. ${error instanceof Error ? error.message : 'Please try again.'}`)
    } finally {
      setIsSavingManifest(false)
    }
  }

  function deleteManifestRow(table: string, id: string) {
    if (table === 'check_in_manifest_personnel') setManifestPersonnel((current) => current.filter((item) => item.id !== id))
    if (table === 'check_in_manifest_vehicles') setManifestVehicles((current) => current.filter((item) => item.id !== id))
    if (table === 'check_in_manifest_equipment') setManifestEquipment((current) => current.filter((item) => item.id !== id))
    if (table === 'check_in_manifest_others') setManifestOthers((current) => current.filter((item) => item.id !== id))
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="breadcrumb">eICS / Incidents / Check-In Manifest</p>
          <h2>Check-In Manifest</h2>
          <p className="page-description">Detailed personnel, vehicle, equipment, and other information for this incident resource.</p>
        </div>
        <button className="secondary-button" type="button" onClick={() => setActivePage('incident-details')}>Back to Incident</button>
      </div>
      {selectedIncident && <section className="panel incident-context-banner"><span>Incident</span><strong>{selectedIncident.name}</strong><small>{selectedIncident.location || 'Location not specified'} · {selectedIncident.status}</small>{manifestResource && <><span>ICS 211 Resource</span><strong>{manifestResource.resource_identifier} — {manifestResource.kind} — {manifestResource.type}</strong><small>{manifestResource.agency_office_home_base || 'Agency / Office / Home Base not specified'} · {manifestResource.leader_name || 'Leader not specified'}</small></>}</section>}
      {manifestMessage && <p className="form-message" role="status">{manifestMessage}</p>}
      {manifestError && <p className="form-error" role="alert">{manifestError}</p>}
      {isLoadingManifest ? <section className="panel"><div className="empty-state"><h4>Loading Check-In Manifest...</h4></div></section> : (
        <>
          <section className="panel incident-form-panel">
            <div className="panel-header"><div><h3>Manifest Information</h3><p>One manifest belongs to the selected incident. Totals are calculated from the rows below.</p></div></div>
            <div className="manifest-summary-grid">
              <div><span>Total Personnel</span><strong>{manifestPersonnel.length}</strong></div>
              <div><span>Total Vehicles</span><strong>{manifestVehicles.length}</strong></div>
              <div><span>Land</span><strong>{manifestVehicles.filter((item) => item.vehicle_category === 'LAND').length}</strong></div>
              <div><span>Water</span><strong>{manifestVehicles.filter((item) => item.vehicle_category === 'WATER').length}</strong></div>
              <div><span>Air</span><strong>{manifestVehicles.filter((item) => item.vehicle_category === 'AIR').length}</strong></div>
              <div><span>Total Equipment</span><strong>{manifestEquipment.length}</strong></div>
            </div>
            <div className="incident-form manifest-form-grid">
              <div className="form-field"><label htmlFor="manifest-agency">Agency / Office / Home Base</label><input id="manifest-agency" value={manifestDraft.agency_office_home_base} onChange={(event) => setManifestDraft({ ...manifestDraft, agency_office_home_base: event.target.value })} /></div>
              <div className="form-field"><label htmlFor="manifest-leader">Name of Leader</label><input id="manifest-leader" value={manifestDraft.leader_name} onChange={(event) => setManifestDraft({ ...manifestDraft, leader_name: event.target.value })} /></div>
              <div className="form-field"><label htmlFor="manifest-contact">Contact Details</label><input id="manifest-contact" value={manifestDraft.contact_details} onChange={(event) => setManifestDraft({ ...manifestDraft, contact_details: event.target.value })} /></div>
              <div className="form-field"><label htmlFor="manifest-resource">Link to ICS 211 Resource (Optional)</label>{manifestResource ? <><strong className="manifest-resource-reference">{manifestResource.resource_identifier} — {manifestResource.kind} — {manifestResource.type}</strong><small>{manifestResource.agency_office_home_base || 'Agency / Office / Home Base not specified'} · {manifestResource.leader_name || 'Leader not specified'}</small></> : <><select id="manifest-resource" value={manifestDraft.ics_211_resource_id} onChange={(event) => setManifestDraft({ ...manifestDraft, ics_211_resource_id: event.target.value })}><option value="">Not associated</option>{manifestResourceOptions.map((resource) => <option key={resource.id} value={resource.id}>{resource.resource_identifier} — {resource.kind} — {resource.type} — {resource.agency_office_home_base || 'Agency not specified'}</option>)}</select><small>Select an existing ICS 211 resource if this manifest represents the detailed composition of that resource.</small></>}</div>
            </div>
            <button className="primary-button" type="button" onClick={() => void saveManifest()} disabled={isSavingManifest}>{isSavingManifest ? 'Saving Manifest...' : 'Save Manifest'}</button>
          </section>

          <>
            <section className="panel incident-form-panel manifest-table-panel">
              <div className="panel-header"><div><h3>Personnel</h3><p>Total Number of Personnel: {manifestPersonnel.length}</p></div><button className="secondary-button" type="button" onClick={addManifestPersonnelRow}>+ Add Row</button></div>
              <div className="manifest-table-scroll"><table className="user-table manifest-entry-table"><thead><tr><th>Name</th><th>Age</th><th>Gender</th><th>Weight (kg)</th><th>Contact Details</th><th>Capabilities/Specialization</th><th>Others</th><th>Action</th></tr></thead><tbody>{manifestPersonnel.map((item) => <tr key={item.id}><td><input value={item.name} onChange={(event) => updateManifestPersonnelRow(item.id, 'name', event.target.value)} /></td><td><input type="number" min="0" value={item.age ?? ''} onChange={(event) => updateManifestPersonnelRow(item.id, 'age', event.target.value ? Number(event.target.value) : null)} /></td><td><input value={item.gender || ''} onChange={(event) => updateManifestPersonnelRow(item.id, 'gender', event.target.value)} /></td><td><input type="number" min="0" step="0.01" value={item.weight_kg ?? ''} onChange={(event) => updateManifestPersonnelRow(item.id, 'weight_kg', event.target.value ? Number(event.target.value) : null)} /></td><td><input value={item.contact_details || ''} onChange={(event) => updateManifestPersonnelRow(item.id, 'contact_details', event.target.value)} /></td><td><input value={item.capabilities_specialization || ''} onChange={(event) => updateManifestPersonnelRow(item.id, 'capabilities_specialization', event.target.value)} /></td><td><input value={item.others || ''} onChange={(event) => updateManifestPersonnelRow(item.id, 'others', event.target.value)} /></td><td><button className="secondary-button" type="button" onClick={() => deleteManifestRow('check_in_manifest_personnel', item.id)}>Remove</button></td></tr>)}</tbody></table></div>
            </section>

            <section className="panel incident-form-panel manifest-table-panel">
              <div className="panel-header"><div><h3>Vehicles</h3><p>Total Vehicles: {manifestVehicles.length} · Land: {manifestVehicles.filter((item) => item.vehicle_category === 'LAND').length} · Water: {manifestVehicles.filter((item) => item.vehicle_category === 'WATER').length} · Air: {manifestVehicles.filter((item) => item.vehicle_category === 'AIR').length}</p></div><button className="secondary-button" type="button" onClick={addManifestVehicleRow}>+ Add Row</button></div>
              <div className="manifest-table-scroll"><table className="user-table manifest-entry-table"><thead><tr><th>Name of Operator</th><th>Kind</th><th>Type</th><th>Plate Number</th><th>Fuel Type</th><th>Weight (kg)</th><th>Contact Details</th><th>Capabilities/Specialization</th><th>Others</th><th>Category</th><th>Action</th></tr></thead><tbody>{manifestVehicles.map((item) => <tr key={item.id}><td><input value={item.operator_name || ''} onChange={(event) => updateManifestVehicleRow(item.id, 'operator_name', event.target.value)} /></td><td><input value={item.kind || ''} onChange={(event) => updateManifestVehicleRow(item.id, 'kind', event.target.value)} /></td><td><input value={item.type || ''} onChange={(event) => updateManifestVehicleRow(item.id, 'type', event.target.value)} /></td><td><input value={item.plate_number || ''} onChange={(event) => updateManifestVehicleRow(item.id, 'plate_number', event.target.value)} /></td><td><input value={item.fuel_type || ''} onChange={(event) => updateManifestVehicleRow(item.id, 'fuel_type', event.target.value)} /></td><td><input type="number" min="0" step="0.01" value={item.weight_kg ?? ''} onChange={(event) => updateManifestVehicleRow(item.id, 'weight_kg', event.target.value ? Number(event.target.value) : null)} /></td><td><input value={item.contact_details || ''} onChange={(event) => updateManifestVehicleRow(item.id, 'contact_details', event.target.value)} /></td><td><input value={item.capabilities_specialization || ''} onChange={(event) => updateManifestVehicleRow(item.id, 'capabilities_specialization', event.target.value)} /></td><td><input value={item.others || ''} onChange={(event) => updateManifestVehicleRow(item.id, 'others', event.target.value)} /></td><td><select value={item.vehicle_category} onChange={(event) => updateManifestVehicleRow(item.id, 'vehicle_category', event.target.value as ManifestVehicle['vehicle_category'])}><option value="LAND">LAND</option><option value="WATER">WATER</option><option value="AIR">AIR</option></select></td><td><button className="secondary-button" type="button" onClick={() => deleteManifestRow('check_in_manifest_vehicles', item.id)}>Remove</button></td></tr>)}</tbody></table></div>
            </section>

            <section className="panel incident-form-panel manifest-table-panel">
              <div className="panel-header"><div><h3>Equipment</h3><p>Total Number of Equipment: {manifestEquipment.length}</p></div><button className="secondary-button" type="button" onClick={addManifestEquipmentRow}>+ Add Row</button></div>
              <div className="manifest-table-scroll"><table className="user-table manifest-entry-table"><thead><tr><th>Name of Operator</th><th>Kind</th><th>Type</th><th>Source of Power</th><th>Fuel Type</th><th>Weight (kg)</th><th>Contact Details</th><th>Capabilities/Specialization</th><th>Others</th><th>Action</th></tr></thead><tbody>{manifestEquipment.map((item) => <tr key={item.id}><td><input value={item.operator_name || ''} onChange={(event) => updateManifestEquipmentRow(item.id, 'operator_name', event.target.value)} /></td><td><input value={item.kind || ''} onChange={(event) => updateManifestEquipmentRow(item.id, 'kind', event.target.value)} /></td><td><input value={item.type || ''} onChange={(event) => updateManifestEquipmentRow(item.id, 'type', event.target.value)} /></td><td><input value={item.source_of_power || ''} onChange={(event) => updateManifestEquipmentRow(item.id, 'source_of_power', event.target.value)} /></td><td><input value={item.fuel_type || ''} onChange={(event) => updateManifestEquipmentRow(item.id, 'fuel_type', event.target.value)} /></td><td><input type="number" min="0" step="0.01" value={item.weight_kg ?? ''} onChange={(event) => updateManifestEquipmentRow(item.id, 'weight_kg', event.target.value ? Number(event.target.value) : null)} /></td><td><input value={item.contact_details || ''} onChange={(event) => updateManifestEquipmentRow(item.id, 'contact_details', event.target.value)} /></td><td><input value={item.capabilities_specialization || ''} onChange={(event) => updateManifestEquipmentRow(item.id, 'capabilities_specialization', event.target.value)} /></td><td><input value={item.others || ''} onChange={(event) => updateManifestEquipmentRow(item.id, 'others', event.target.value)} /></td><td><button className="secondary-button" type="button" onClick={() => deleteManifestRow('check_in_manifest_equipment', item.id)}>Remove</button></td></tr>)}</tbody></table></div>
            </section>

            <section className="panel incident-form-panel manifest-table-panel">
              <div className="panel-header"><div><h3>Others</h3><p>Additional information and continuation-sheet entries.</p></div><button className="secondary-button" type="button" onClick={addManifestOtherRow}>+ Add Row</button></div>
              <div className="manifest-table-scroll"><table className="user-table manifest-entry-table"><thead><tr><th>Description</th><th>Action</th></tr></thead><tbody>{manifestOthers.map((item) => <tr key={item.id}><td><input value={item.description} onChange={(event) => updateManifestOtherRow(item.id, event.target.value)} /></td><td><button className="secondary-button" type="button" onClick={() => deleteManifestRow('check_in_manifest_others', item.id)}>Remove</button></td></tr>)}</tbody></table></div>
            </section>
          </>
        </>
      )}
    </>
  )
}
