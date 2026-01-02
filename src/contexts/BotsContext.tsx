'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bot, Incident } from '@/types/database'
import { useAuth } from '@/hooks/useAuth'

interface BotsContextType {
    bots: Bot[]
    incidents: Incident[]
    loading: boolean
    refreshBots: () => Promise<void>
    createBot: (bot: Omit<Bot, 'bot_id' | 'created_at' | 'updated_at'>) => Promise<void>
    updateBot: (id: number, bot: Partial<Bot>) => Promise<void>
    deleteBot: (id: number) => Promise<void>
    createIncident: (incident: Omit<Incident, 'incident_id' | 'created_at' | 'resolved_at'>) => Promise<void>
    updateIncident: (id: number, incident: Partial<Incident>) => Promise<void>
    deleteIncident: (id: number) => Promise<void>
}

const BotsContext = createContext<BotsContextType | undefined>(undefined)

export function BotsProvider({ children }: { children: React.ReactNode }) {
    const [bots, setBots] = useState<Bot[]>([])
    const [incidents, setIncidents] = useState<Incident[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchData = async () => {
        setLoading(true)
        const { data: botsData } = await supabase.from('bots').select('*').order('name')
        const { data: incidentsData } = await supabase.from('incidents').select('*').order('reported_at', { ascending: false })

        setBots(botsData || [])
        setIncidents(incidentsData || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    const createBot = async (botData: Omit<Bot, 'bot_id' | 'created_at' | 'updated_at'>) => {
        const { error } = await supabase.from('bots').insert(botData)
        if (error) throw error
        await fetchData()
    }

    const updateBot = async (id: number, botData: Partial<Bot>) => {
        const { error } = await supabase.from('bots').update(botData).eq('bot_id', id)
        if (error) throw error
        await fetchData()
    }

    const deleteBot = async (id: number) => {
        const { error } = await supabase.from('bots').delete().eq('bot_id', id)
        if (error) throw error
        setBots(prev => prev.filter(b => b.bot_id !== id))
    }

    const createIncident = async (incident: Omit<Incident, 'incident_id' | 'created_at' | 'resolved_at'>) => {
        const { error } = await supabase.from('incidents').insert(incident)
        if (error) throw error
        await fetchData()
    }

    const updateIncident = async (id: number, incident: Partial<Incident>) => {
        const { error } = await supabase.from('incidents').update(incident).eq('incident_id', id)
        if (error) throw error
        await fetchData()
    }

    const deleteIncident = async (id: number) => {
        const { error } = await supabase.from('incidents').delete().eq('incident_id', id)
        if (error) throw error
        setIncidents(prev => prev.filter(i => i.incident_id !== id))
    }

    return (
        <BotsContext.Provider value={{
            bots,
            incidents,
            loading,
            refreshBots: fetchData,
            createBot,
            updateBot,
            deleteBot,
            createIncident,
            updateIncident,
            deleteIncident
        }}>
            {children}
        </BotsContext.Provider>
    )
}

export function useBots() {
    const context = useContext(BotsContext)
    if (context === undefined) {
        throw new Error('useBots must be used within a BotsProvider')
    }
    return context
}
