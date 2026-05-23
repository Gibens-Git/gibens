import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@gibens/supabase'
import type { User as AuthUser } from '@supabase/supabase-js'
import type { User } from '@gibens/supabase'

interface AuthContextType {
  authUser: AuthUser | null
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ authUser: null, user: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(id: string) {
    try {
      const fetchRow = supabase.from('users').select('*').eq('id', id).single()
      const timeoutErr = new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error('timeout')), 8000)
      )
      const { data } = await Promise.race([fetchRow, timeoutErr])
      setUser((data as User) ?? null)
    } catch (err) {
      console.error('[Auth] fetchProfile error:', err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ authUser, user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
