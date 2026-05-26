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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthUser(session?.user ?? null)
      if (session?.user) {
        if (event !== 'TOKEN_REFRESHED') setLoading(true)
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
      const { data } = await supabase.from('users').select('*').eq('id', id).maybeSingle()

      if (data) {
        setUser(data as User)
        return
      }

      const { data: { user: au } } = await supabase.auth.getUser()
      if (!au) { setUser(null); return }

      const meta = au.user_metadata ?? {}
      const fullName = (meta.full_name as string) || (meta.name as string) || au.email || 'User'
      const { data: upserted } = await supabase
        .from('users')
        .upsert({ id, role: ((meta.role as string) ?? 'vendor') as User['role'], full_name: fullName }, { onConflict: 'id' })
        .select()
        .single()

      if (upserted) {
        setUser(upserted as User)
      } else {
        const { data: refetched } = await supabase.from('users').select('*').eq('id', id).maybeSingle()
        setUser((refetched as User) ?? null)
      }
    } catch (err) {
      console.error('[Auth] fetchProfile error:', err)
      const { data } = await supabase.from('users').select('*').eq('id', id).maybeSingle()
      setUser((data as User) ?? null)
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
