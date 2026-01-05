'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { RefreshCcw } from 'lucide-react'

export function SyncButton() {
    const [isLoading, setIsLoading] = useState(false)

    const handleSync = async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/sync-data', {
                method: 'POST',
            })
            const data = await response.json()

            if (!response.ok) throw new Error(data.error || 'Failed to sync')

            const entriesCount = data.time_entries_count ?? data.count ?? 0
            const planningCount = data.planning_entries_count ?? 0

            alert(`Sincronización exitosa:\n- ${entriesCount} registros de tiempo\n- ${planningCount} registros de planificación`)
            window.location.reload()
        } catch (error: any) {
            console.error('Sync failed:', error)
            alert(`Error al sincronizar: ${error.message}`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            variant="glass"
            size="sm"
            onClick={handleSync}
            isLoading={isLoading}
            disabled={isLoading}
        >
            <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Sincronizar
        </Button>
    )
}
