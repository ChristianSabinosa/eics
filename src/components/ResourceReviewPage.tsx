import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAppContext } from '../contexts/AppContext'
import type { Stage7Resource } from '../types'

export function ResourceReviewPage() {
  const { setActivePage, selectedIncidentId, isAdministrator } = useAppContext()
  const [selectedIncident, setSelectedIncident] = useState<{ name: string; location: string | null; status: string } | null>(null)
  const [stage7Resources, setStage7Resources] = useState<Stage7Resource[]>([])
  const [isLoadingStage7, setIsLoadingStage7] = useState(false)
  const [stage7Error, setStage7Error] = useState('')
  const [stage7Message, setStage7Message] = useState('')
  const [stage7BusyResourceId, setStage7BusyResourceId] = useState<string | null>(null)

  const canReviewResources = isAdministrator

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
    async function loadStage7Resources() {
      setIsLoadingStage7(true)
      setStage7Error('')
      setStage7Message('')
      const { data: header, error: headerError } = await supabase
        .from('ics_211')
        .select('id')
        .eq('incident_id', selectedIncidentId)
        .maybeSingle()
      if (headerError || !header) {
        setStage7Resources([])
        setStage7Error(headerError ? `Unable to load ICS 211 resources. ${headerError.message}` : 'No ICS 211 header exists for this incident.')
        setIsLoadingStage7(false)
        return
      }
      const { data: resources, error: resourcesError } = await supabase
        .from('ics_211_resources')
        .select('id, ics_211_id, order_request_no, check_in_at, kind, type, resource_identifier, resource_classification, agency_office_home_base, leader_name, contact_details, total_personnel, point_of_origin, departure_at, method_of_travel, with_manifest, incident_assignment, other_qualifications, data_sent_to_resl_at, manifest_reference, check_in_method, operational_classification, resource_status')
        .eq('ics_211_id', header.id)
        .order('check_in_at', { ascending: false })
      if (resourcesError) {
        setStage7Resources([])
        setStage7Error(`Unable to load resources. ${resourcesError.message}`)
        setIsLoadingStage7(false)
        return
      }
      const resourceIds = (resources ?? []).map((resource) => resource.id)
      const { data: manifests, error: manifestsError } = resourceIds.length > 0
        ? await supabase.from('check_in_manifests').select('id, ics_211_resource_id').eq('incident_id', selectedIncidentId).in('ics_211_resource_id', resourceIds)
        : { data: [], error: null }
      if (manifestsError) {
        setStage7Resources([])
        setStage7Error(`Unable to load resource manifests. ${manifestsError.message}`)
        setIsLoadingStage7(false)
        return
      }
      const manifestIds = (manifests ?? []).map((manifest) => manifest.id)
      const [personnelResult, vehiclesResult, equipmentResult, assignmentsResult] = await Promise.all([
        manifestIds.length > 0 ? supabase.from('check_in_manifest_personnel').select('manifest_id').in('manifest_id', manifestIds) : Promise.resolve({ data: [], error: null }),
        manifestIds.length > 0 ? supabase.from('check_in_manifest_vehicles').select('manifest_id').in('manifest_id', manifestIds) : Promise.resolve({ data: [], error: null }),
        manifestIds.length > 0 ? supabase.from('check_in_manifest_equipment').select('manifest_id').in('manifest_id', manifestIds) : Promise.resolve({ data: [], error: null }),
        supabase.from('ics_211_resource_assignments').select('id, ics_211_resource_id, assigned_at, assigned_by, assignment_status').eq('incident_id', selectedIncidentId).eq('assignment_status', 'ASSIGNED'),
      ])
      if (!isMounted) return
      const queryError = personnelResult.error || vehiclesResult.error || equipmentResult.error || assignmentsResult.error
      if (queryError) {
        setStage7Resources([])
        setStage7Error(`Unable to load the consolidated resource view. ${queryError.message}`)
        setIsLoadingStage7(false)
        return
      }
      const manifestByResource = new Map((manifests ?? []).map((manifest) => [manifest.ics_211_resource_id, manifest]))
      const assignmentByResource = new Map((assignmentsResult.data ?? []).map((assignment) => [assignment.ics_211_resource_id, assignment]))
      const countByManifest = (rows: { manifest_id: string }[]) => rows.reduce<Record<string, number>>((counts, row) => ({ ...counts, [row.manifest_id]: (counts[row.manifest_id] || 0) + 1 }), {})
      const personnelCounts = countByManifest((personnelResult.data ?? []) as { manifest_id: string }[])
      const vehicleCounts = countByManifest((vehiclesResult.data ?? []) as { manifest_id: string }[])
      const equipmentCounts = countByManifest((equipmentResult.data ?? []) as { manifest_id: string }[])
      setStage7Resources((resources ?? []).map((resource) => {
        const manifest = manifestByResource.get(resource.id)
        const assignment = assignmentByResource.get(resource.id)
        return {
          ...resource,
          incident_id: selectedIncidentId,
          manifest_id: manifest?.id || null,
          has_manifest: Boolean(manifest),
          manifest_personnel_count: manifest ? personnelCounts[manifest.id] || 0 : 0,
          manifest_vehicle_count: manifest ? vehicleCounts[manifest.id] || 0 : 0,
          manifest_equipment_count: manifest ? equipmentCounts[manifest.id] || 0 : 0,
          assignment_id: assignment?.id || null,
          assigned_at: assignment?.assigned_at || null,
          assigned_by: assignment?.assigned_by || null,
        }
      }) as Stage7Resource[])
      setIsLoadingStage7(false)
    }
    void loadStage7Resources()
    return () => { isMounted = false }
  }, [selectedIncidentId])

  async function classifyStage7Resource(resource: Stage7Resource, classification: 'IMT RESOURCE' | 'TACTICAL RESOURCE') {
    if (!canReviewResources) return
    setStage7BusyResourceId(resource.id)
    setStage7Error('')
    setStage7Message('')
    const { error } = await supabase.rpc('classify_ics_211_resource', {
      p_resource_id: resource.id,
      p_classification: classification,
    })
    if (error) {
      setStage7Error(`Unable to classify resource. ${error.message}`)
    } else {
      setStage7Resources((current) => current.map((item) => item.id === resource.id ? { ...item, operational_classification: classification } : item))
      setStage7Message('Resource classification saved.')
    }
    setStage7BusyResourceId(null)
  }

  async function assignStage7Resource(resource: Stage7Resource) {
    if (!canReviewResources || resource.resource_status !== 'AVAILABLE') return
    if (!window.confirm(`Assign ${resource.resource_identifier}?`)) return
    setStage7BusyResourceId(resource.id)
    setStage7Error('')
    setStage7Message('')
    const { data, error } = await supabase.rpc('assign_ics_211_resource', { p_resource_id: resource.id })
    if (error) {
      setStage7Error(`Unable to assign resource. ${error.message}`)
    } else {
      setStage7Resources((current) => current.map((item) => item.id === resource.id ? { ...item, resource_status: 'ASSIGNED', assignment_id: data?.id || 'assigned', assigned_at: data?.assigned_at || new Date().toISOString() } : item))
      setStage7Message('Resource assigned successfully.')
    }
    setStage7BusyResourceId(null)
  }

  async function releaseStage7Resource(resource: Stage7Resource) {
    if (!canReviewResources || resource.resource_status !== 'ASSIGNED') return
    if (!window.confirm(`Release ${resource.resource_identifier}?`)) return
    setStage7BusyResourceId(resource.id)
    setStage7Error('')
    setStage7Message('')
    const { error } = await supabase.rpc('release_ics_211_resource', { p_resource_id: resource.id })
    if (error) {
      setStage7Error(`Unable to release resource. ${error.message}`)
    } else {
      setStage7Resources((current) => current.map((item) => item.id === resource.id ? { ...item, resource_status: 'AVAILABLE', assignment_id: null, assigned_at: null, assigned_by: null } : item))
      setStage7Message('Resource released and returned to AVAILABLE.')
    }
    setStage7BusyResourceId(null)
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="breadcrumb">eICS / Incidents / Resource Review</p>
          <h2>Resource Assignment / Classification</h2>
          <p className="page-description">Consolidated ICS 211 resources for RESL / PSC review.</p>
        </div>
        <button className="secondary-button" type="button" onClick={() => setActivePage('incident-details')}>Back to Incident</button>
      </div>
      {selectedIncident && <section className="panel incident-context-banner"><span>Incident</span><strong>{selectedIncident.name}</strong><small>{selectedIncident.location || 'Location not specified'} · {selectedIncident.status}</small></section>}
      {stage7Message && <p className="form-message" role="status">{stage7Message}</p>}
      {stage7Error && <p className="form-error" role="alert">{stage7Error}</p>}
      {isLoadingStage7 ? <section className="panel"><div className="empty-state"><h4>Loading consolidated resources...</h4></div></section> : stage7Resources.length === 0 ? <section className="panel"><div className="empty-state"><h4>No ICS 211 resources found</h4><p>Check in a resource through ICS 211 before reviewing assignments.</p></div></section> : (
        <section className="panel personnel-list-panel">
          <div className="panel-header"><div><h3>Consolidated Resources</h3><p>Checked-in resources, manifest composition, classification, and assignment status.</p></div></div>
          <div className="user-table-wrapper">
            <table className="user-table resource-review-table">
              <thead><tr><th>Resource</th><th>Kind / Type</th><th>Manifest</th><th>Classification</th><th>Status</th><th>Assignment</th><th>Actions</th></tr></thead>
              <tbody>{stage7Resources.map((resource) => {
                const status = resource.resource_status || 'AVAILABLE'
                const busy = stage7BusyResourceId === resource.id
                return <tr key={resource.id}>
                  <td><strong>{resource.resource_identifier}</strong><small>{resource.agency_office_home_base || 'Agency not specified'}{resource.leader_name ? ` · ${resource.leader_name}` : ''}</small></td>
                  <td>{resource.kind}<small>{resource.type}</small></td>
                  <td>{resource.has_manifest ? `${resource.manifest_personnel_count} personnel · ${resource.manifest_vehicle_count} vehicles · ${resource.manifest_equipment_count} equipment` : 'No manifest'}</td>
                  <td><select value={resource.operational_classification || ''} disabled={!canReviewResources || busy} onChange={(event) => { const value = event.target.value as 'IMT RESOURCE' | 'TACTICAL RESOURCE'; if (value) void classifyStage7Resource(resource, value) }}><option value="">Unclassified</option><option value="IMT RESOURCE">IMT RESOURCE</option><option value="TACTICAL RESOURCE">TACTICAL RESOURCE</option></select></td>
                  <td><span className={`resource-status-badge resource-status-${status.toLowerCase().replaceAll('-', '-')}`}>{status}</span></td>
                  <td>{resource.assignment_id ? `Assigned ${resource.assigned_at ? new Date(resource.assigned_at).toLocaleString() : ''}` : 'Not assigned'}</td>
                  <td>{status === 'AVAILABLE' && <button className="primary-button" type="button" disabled={!canReviewResources || busy} onClick={() => void assignStage7Resource(resource)}>{busy ? 'Saving...' : 'Assign'}</button>}{status === 'ASSIGNED' && <button className="secondary-button" type="button" disabled={!canReviewResources || busy} onClick={() => void releaseStage7Resource(resource)}>{busy ? 'Saving...' : 'Release'}</button>}{(status === 'OUT-OF-SERVICE' || status === 'DEMOBILIZED') && <span>Unavailable</span>}</td>
                </tr>
              })}</tbody>
            </table>
          </div>
        </section>
      )}
    </>
  )
}
