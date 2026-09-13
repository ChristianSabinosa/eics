import { supabase } from '../lib/supabase'
import type { ManagedUser } from '../types'

export async function loadAllProfiles() {
  const pageSize = 1000
  const profiles: ManagedUser[] = []
  let page = 0

  while (true) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .order('full_name')
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) {
      return { data: null, error }
    }

    profiles.push(...(data ?? []))

    if (!data || data.length < pageSize) {
      return { data: profiles, error: null }
    }

    page += 1
  }
}
