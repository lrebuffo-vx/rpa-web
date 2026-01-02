'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Bell, Mail } from 'lucide-react'
import { urlBase64ToUint8Array } from '@/lib/utils'

interface SubscriptionModalProps {
    isOpen: boolean
    onClose: () => void
}

export function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
    const { user } = useAuth()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)

    const [preferences, setPreferences] = useState({
        news: true,
        bot_status: false,
        incidents: true,
    })

    useEffect(() => {
        if (user && isOpen) {
            loadSubscription()
        }
    }, [user, isOpen])

    const loadSubscription = async () => {
        if (!user) return
        const { data } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (data) {
            setPreferences({
                news: data.subscription_type.includes('news'),
                bot_status: data.subscription_type.includes('bot_status'),
                incidents: data.subscription_type.includes('incidents'),
            })
        }
    }

    const handlePushPermission = async () => {
        if (!('serviceWorker' in navigator)) return;

        // Check for VAPID key
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidKey) {
            console.warn('VAPID public key not found in environment variables. Push notifications disabled.')
            return null
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidKey)
                });
            }
            return subscription
        } catch (error) {
            console.error('Error enabling push:', error);
            return null;
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (!user) return

            const subscription = await handlePushPermission()
            const types = Object.entries(preferences)
                .filter(([_, enabled]) => enabled)
                .map(([type]) => type)

            const { error } = await supabase.from('subscriptions').upsert({
                user_id: user.id,
                subscription_type: types,
                push_subscription: subscription ? JSON.parse(JSON.stringify(subscription)) : null,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })

            if (error) throw error
            onClose()
        } catch (error: any) {
            console.error('Error saving subscription:', JSON.stringify(error, null, 2))
            alert(`Error al guardar suscripción: ${error.message || 'Unknown error'}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Configurar Notificaciones"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                        <Bell className="h-5 w-5 text-primary-400 mt-0.5" />
                        <div>
                            <h4 className="text-white font-medium text-sm">Notificaciones Push</h4>
                            <p className="text-gray-400 text-xs mt-1">
                                Recibe alertas instantáneas en tu navegador cuando ocurran eventos importantes.
                                Es necesario dar permisos al navegador.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-white font-medium">¿Qué deseas recibir?</h3>

                    <label className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                        <input
                            type="checkbox"
                            checked={preferences.news}
                            onChange={e => setPreferences({ ...preferences, news: e.target.checked })}
                            className="rounded border-gray-600 bg-black/20 text-primary-600 h-5 w-5"
                        />
                        <div>
                            <span className="block text-gray-200">Noticias y Comunicados</span>
                            <span className="text-xs text-gray-500">Nuevas publicaciones en el dashboard</span>
                        </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                        <input
                            type="checkbox"
                            checked={preferences.incidents}
                            onChange={e => setPreferences({ ...preferences, incidents: e.target.checked })}
                            className="rounded border-gray-600 bg-black/20 text-primary-600 h-5 w-5"
                        />
                        <div>
                            <span className="block text-gray-200">Incidentes Críticos</span>
                            <span className="text-xs text-gray-500">Alertas sobre fallos o problemas reportados</span>
                        </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                        <input
                            type="checkbox"
                            checked={preferences.bot_status}
                            onChange={e => setPreferences({ ...preferences, bot_status: e.target.checked })}
                            className="rounded border-gray-600 bg-black/20 text-primary-600 h-5 w-5"
                        />
                        <div>
                            <span className="block text-gray-200">Cambios de Estado de Bots</span>
                            <span className="text-xs text-gray-500">Cuando un bot cambia a Caído o en Observación</span>
                        </div>
                    </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" isLoading={loading}>Guardar Preferencias</Button>
                </div>
            </form>
        </Modal>
    )
}
