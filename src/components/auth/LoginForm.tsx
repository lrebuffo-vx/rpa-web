'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function LoginForm() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    const handleLogin = async () => {
        try {
            setLoading(true)
            const redirectUrl = `${location.origin}/auth/callback`
            console.log('Intended Redirect URL:', redirectUrl)

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${location.origin}/auth/callback`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            })
            if (error) throw error
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md p-8 rounded-2xl bg-glass-bg border border-glass-border backdrop-blur-xl shadow-xl">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Bienvenido a Vortex</h1>
                <p className="text-gray-300">Accede a las últimas novedades</p>
            </div>

            <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <span className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                    <img
                        src="https://www.svgrepo.com/show/475656/google-color.svg"
                        alt="Google"
                        className="w-5 h-5"
                    />
                )}
                Iniciar con Google
            </button>

            {error && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
                    {error}
                </div>
            )}

            <div className="mt-8 text-center">
                <p className="text-xs text-gray-400">Ahora integrado con <b>Supabase Auth</b></p>
            </div>
        </div>
    )
}
