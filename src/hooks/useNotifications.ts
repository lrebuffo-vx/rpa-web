import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default')
    const [isSupported, setIsSupported] = useState(false)

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true)
            setPermission(Notification.permission)

            // Register SW
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW Registered:', registration)
                })
                .catch(error => {
                    console.error('SW Registration failed:', error)
                })
        }
    }, [])

    const requestPermission = async () => {
        if (!isSupported) return 'denied'

        const result = await Notification.requestPermission()
        setPermission(result)
        return result
    }

    return {
        permission,
        isSupported,
        requestPermission
    }
}
