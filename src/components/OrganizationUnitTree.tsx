import type { OrganizationUnit, OrganizationAssignment, OrganizationPosition, OrganizationPersonnel } from '../types'
import { getOrganizationLabel, getAssignmentPosition, getAssignmentPersonnel, getAssignmentStatus, getResourceStatus } from '../utils/helpers'

export function OrganizationUnitTree({
  unit,
  units,
  assignments,
  positions,
  personnel,
  onAssign,
  onUnassign,
  assigningAssignmentId,
}: {
  unit: OrganizationUnit
  units: OrganizationUnit[]
  assignments: OrganizationAssignment[]
  positions: Map<string, OrganizationPosition>
  personnel: Map<string, OrganizationPersonnel>
  onAssign: (assignment: OrganizationAssignment) => void
  onUnassign: (assignment: OrganizationAssignment) => void
  assigningAssignmentId: string | null
}) {
  const childUnits = units.filter((child) => child.parent_unit_id === unit.id)
  const unitAssignments = assignments.filter(
    (assignment) => assignment.organizational_unit_id === unit.id,
  )

  return (
    <div className="organization-unit">
      <div className="organization-unit-card">
        <h4>{getOrganizationLabel(unit.name || unit.label || unit.title, 'Organizational Unit')}</h4>
        {unitAssignments.length > 0 && (
          <div className="organization-assignments">
            {unitAssignments.map((assignment) => (
              <div className="organization-assignment" key={assignment.id}>
                <strong>{getAssignmentPosition(assignment, positions)}</strong>
                <span>
                  {getAssignmentPersonnel(assignment, personnel)}
                  {assignment.personnel_id && personnel.get(assignment.personnel_id) && (
                    <small className="organization-resource-status">
                      {getResourceStatus(personnel.get(assignment.personnel_id)!)}
                    </small>
                  )}
                </span>
                <small>{getAssignmentStatus(assignment)}</small>
                <div className="organization-assignment-actions">
                  {assignment.personnel_id ? (
                    <button
                      className="organization-action-button"
                      type="button"
                      onClick={() => onUnassign(assignment)}
                      disabled={assigningAssignmentId === assignment.id}
                    >
                      Unassign
                    </button>
                  ) : (
                    <button
                      className="organization-action-button"
                      type="button"
                      onClick={() => onAssign(assignment)}
                      disabled={assigningAssignmentId === assignment.id}
                    >
                      {assigningAssignmentId === assignment.id ? 'Loading...' : 'Assign Personnel'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {childUnits.length > 0 && (
        <div className="organization-children">
          {childUnits.map((child) => (
            <OrganizationUnitTree
              key={child.id}
              unit={child}
              units={units}
              assignments={assignments}
              positions={positions}
              personnel={personnel}
              onAssign={onAssign}
              onUnassign={onUnassign}
              assigningAssignmentId={assigningAssignmentId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
