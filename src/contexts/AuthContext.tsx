'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { User } from '@/types/database'

interface AuthContextType {
    user: User | null
    authUser: SupabaseUser | null
    loading: boolean
    signOut: () => Promise<void>
    isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [authUser, setAuthUser] = useState<SupabaseUser | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser()

            if (authUser) {
                // En un escenario real verificaríamos si el usuario existe en public.users
                // Por ahora asumimos que el trigger lo creó o lo creamos manual
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', authUser.id)
                    .single()

                setUser(profile)
                setAuthUser(authUser)
            }

            setLoading(false)
        }

        fetchUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    const { data: profile } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', session.user.id)
                        .single()

                    setUser(profile)
                    setAuthUser(session.user)
                } else {
                    setUser(null)
                    setAuthUser(null)
                }
                setLoading(false)
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setAuthUser(null)
        // Redirigir al usuario al login
        window.location.href = '/'
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                authUser,
                loading,
                signOut,
                isAdmin: user?.role === 'admin',
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
