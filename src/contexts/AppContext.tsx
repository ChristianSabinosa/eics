import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { UserProfile, ActivePage } from '../types'

type AppContextValue = {
  isLoggedIn: boolean
  isAuthenticating: boolean
  profile: UserProfile | null
  profileError: string
  isLoadingProfile: boolean
  activePage: ActivePage
  setActivePage: (page: ActivePage) => void
  selectedIncidentId: string | null
  setSelectedIncidentId: (id: string | null) => void
  isAdministrator: boolean
  handleLogout: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileError, setProfileError] = useState('')
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [activePage, setActivePage] = useState<ActivePage>('dashboard')
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null)

  const isAdministrator = profile?.role === 'administrator_trainer'

  useEffect(() => {
    let isMounted = true

    async function loadProfile(userId: string) {
      setIsLoadingProfile(true)
      setProfileError('')

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', userId)
        .single()

      if (!isMounted) return

      if (error) {
        setProfile(null)
        setProfileError('Unable to load your profile.')
      } else if (!data) {
        setProfile(null)
        setProfileError('No profile found for this account.')
      } else {
        setProfile(data)
      }

      setIsLoadingProfile(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return

      setIsLoggedIn(Boolean(session))
      setIsAuthenticating(false)

      if (session) {
        void loadProfile(session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setIsLoggedIn(Boolean(session))

        if (session) {
          void loadProfile(session.user.id)
        } else {
          setProfile(null)
          setProfileError('')
        }
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  function handleLogout() {
    void supabase.auth.signOut()
    setIsLoggedIn(false)
    setProfile(null)
    setProfileError('')
    setSelectedIncidentId(null)
    setActivePage('dashboard')
  }

  const value: AppContextValue = {
    isLoggedIn,
    isAuthenticating,
    profile,
    profileError,
    isLoadingProfile,
    activePage,
    setActivePage,
    selectedIncidentId,
    setSelectedIncidentId,
    isAdministrator,
    handleLogout,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
