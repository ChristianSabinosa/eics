import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { loadAllProfiles } from '../utils/api'
import type { ManagedUser } from '../types'
import { roleOptions } from '../types'

export function UserManagementPage() {
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [usersError, setUsersError] = useState('')
  const [roleOverrides, setRoleOverrides] = useState<Record<string, string>>({})
  const [savingRoleFor, setSavingRoleFor] = useState<string | null>(null)
  const [roleSaveErrors, setRoleSaveErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    let isMounted = true

    async function loadUsers() {
      setIsLoadingUsers(true)
      setUsersError('')

      const { data: profiles, error } = await loadAllProfiles()

      if (!isMounted) return

      if (error) {
        setManagedUsers([])
        setUsersError('Unable to load users.')
      } else {
        setManagedUsers(profiles)
      }

      setIsLoadingUsers(false)
    }

    void loadUsers()
    return () => { isMounted = false }
  }, [])

  async function handleRoleChange(user: ManagedUser, selectedRole: string) {
    const selectedOption = roleOptions.find((option) => option.label === selectedRole)

    if (!selectedOption) return

    const previousOverride = roleOverrides[user.id]

    setRoleOverrides((currentOverrides) => ({
      ...currentOverrides,
      [user.id]: selectedRole,
    }))
    setRoleSaveErrors((currentErrors) => {
      const nextErrors = { ...currentErrors }
      delete nextErrors[user.id]
      return nextErrors
    })
    setSavingRoleFor(user.id)

    const { error } = await supabase.rpc('update_user_role', {
      target_user_id: user.id,
      new_role: selectedOption.value,
    })

    if (error) {
      setRoleOverrides((currentOverrides) => {
        const nextOverrides = { ...currentOverrides }
        if (previousOverride) {
          nextOverrides[user.id] = previousOverride
        } else {
          delete nextOverrides[user.id]
        }
        return nextOverrides
      })
      setRoleSaveErrors((currentErrors) => ({
        ...currentErrors,
        [user.id]: `Unable to update role. ${error.message}`,
      }))
      setSavingRoleFor(null)
      return
    }

    const { data, error: refreshError } = await loadAllProfiles()

    if (refreshError) {
      setUsersError('Role updated, but users could not be refreshed.')
    } else {
      setManagedUsers(data ?? [])
      setRoleOverrides((currentOverrides) => {
        const nextOverrides = { ...currentOverrides }
        delete nextOverrides[user.id]
        return nextOverrides
      })
    }

    setRoleSaveErrors((currentErrors) => {
      const nextErrors = { ...currentErrors }
      delete nextErrors[user.id]
      return nextErrors
    })
    setSavingRoleFor(null)
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="breadcrumb">eICS / User Management</p>
          <h2>User Management</h2>
          <p className="page-description">
            Manage eICS users and their assigned roles.
          </p>
        </div>
      </div>

      <section className="panel">
        {isLoadingUsers && (
          <div className="empty-state">
            <h4>Loading users...</h4>
          </div>
        )}
        {!isLoadingUsers && usersError && (
          <div className="empty-state">
            <h4>{usersError}</h4>
          </div>
        )}
        {!isLoadingUsers && !usersError && managedUsers.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">◎</div>
            <h4>No users to display yet.</h4>
          </div>
        )}
        {!isLoadingUsers && !usersError && managedUsers.length > 0 && (
          <div className="user-table-wrapper">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Account ID</th>
                </tr>
              </thead>
              <tbody>
                {managedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.full_name || 'Name unavailable'}</td>
                    <td>
                      <select
                        className="role-select"
                        value={roleOverrides[user.id] || user.role || 'personnel'}
                        onChange={(event) => void handleRoleChange(user, event.target.value)}
                        disabled={savingRoleFor === user.id}
                        aria-label={`Role for ${user.full_name || 'user'}`}
                      >
                        {roleOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {savingRoleFor === user.id && (
                        <span className="role-save-status">Saving...</span>
                      )}
                      {roleSaveErrors[user.id] && (
                        <span className="role-save-error" role="alert">
                          {roleSaveErrors[user.id]}
                        </span>
                      )}
                    </td>
                    <td>{user.id}</td>
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
