import type { OrganizationAssignment, OrganizationPosition, OrganizationPersonnel, PersonnelResource } from '../types'

export function getOrganizationLabel(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback
}

export function getPersonnelResourceName(person: PersonnelResource) {
  const nameParts = [person.first_name, person.middle_name, person.last_name]
    .filter((part): part is string => Boolean(part?.trim()))

  return getOrganizationLabel(
    nameParts.length > 0 ? nameParts.join(' ') : person.full_name || person.name,
    'Unnamed personnel',
  )
}

export function getAssignmentPosition(
  assignment: OrganizationAssignment,
  positions: Map<string, OrganizationPosition>,
) {
  const position = assignment.position_id ? positions.get(assignment.position_id) : undefined
  return getOrganizationLabel(position?.name || position?.title, 'Unassigned position')
}

export function getAssignmentPersonnel(
  assignment: OrganizationAssignment,
  personnel: Map<string, OrganizationPersonnel>,
) {
  if (!assignment.personnel_id) {
    return 'Unassigned'
  }

  const person = personnel.get(assignment.personnel_id)
  return getOrganizationLabel(person?.full_name || person?.name, 'Unassigned')
}

export function getAssignmentStatus(assignment: OrganizationAssignment) {
  return getOrganizationLabel(assignment.assignment_status, 'ASSIGNED')
}

export function getResourceStatus(person: OrganizationPersonnel) {
  return getOrganizationLabel(person.resource_status, 'AVAILABLE')
}

export function createManifestRowId() {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
