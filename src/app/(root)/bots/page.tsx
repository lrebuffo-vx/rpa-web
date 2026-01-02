'use client'

import { useState } from 'react'
import { BotsProvider, useBots } from '@/contexts/BotsContext'
import { useAuth } from '@/hooks/useAuth'
import { BotCard } from '@/components/bots/BotCard'
import { StatusSummary } from '@/components/bots/StatusSummary'
import { IncidentTimeline } from '@/components/bots/IncidentTimeline'
import { BotModal } from '@/components/bots/BotModal'
import { IncidentModal } from '@/components/bots/IncidentModal'
import { Button } from '@/components/ui/Button'
import { Plus, Search } from 'lucide-react'
import { Bot } from '@/types/database'

function BotsContent() {
    const { bots, incidents, createBot, updateBot, deleteBot, createIncident } = useBots()
    const { isAdmin } = useAuth()

    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('all') // all, opertivo, observacion, caido
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false)
    const [editingBot, setEditingBot] = useState<Bot | undefined>(undefined)
    const [actionLoading, setActionLoading] = useState(false)

    const filteredBots = bots.filter(bot => {
        const matchesSearch = bot.name.toLowerCase().includes(search.toLowerCase()) ||
            bot.client.toLowerCase().includes(search.toLowerCase()) ||
            bot.system.toLowerCase().includes(search.toLowerCase())
        const matchesFilter = filter === 'all' || bot.status === filter

        return matchesSearch && matchesFilter
    })

    const handleSubmit = async (data: any) => {
        setActionLoading(true)
        try {
            if (editingBot) {
                await updateBot(editingBot.bot_id, data)
            } else {
                // @ts-ignore
                await createBot(data)
            }
        } finally {
            setActionLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (confirm('¿Estás seguro de eliminar este bot?')) {
            await deleteBot(id)
        }
    }

    const handleEdit = (bot: Bot) => {
        setEditingBot(bot)
        setIsModalOpen(true)
    }

    const handleOpenCreate = () => {
        setEditingBot(undefined)
        setIsModalOpen(true)
    }

    const handleIncidentSubmit = async (data: any) => {
        setActionLoading(true)
        try {
            await createIncident(data)
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Monitoreo de Bots</h1>
                    <p className="text-gray-400">Estado en tiempo real de la fuerza digital.</p>
                </div>

                {isAdmin && (
                    <Button onClick={handleOpenCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Bot
                    </Button>
                )}
            </div>

            <StatusSummary bots={bots} />

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, cliente, sistema..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'operativo', 'observacion', 'caido'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === status
                                ? 'bg-primary-600 text-white'
                                : 'bg-white/5 text-gray-400 hover:text-white'
                                }`}
                        >
                            {status === 'all' ? 'Todos' : status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredBots.map(bot => (
                    <BotCard
                        key={bot.bot_id}
                        bot={bot}
                        isAdmin={isAdmin}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                ))}
            </div>

            <div className="flex justify-between items-center mt-12 mb-4">
                <h2 className="text-2xl font-bold text-white">Historial de Incidentes</h2>
                {isAdmin && (
                    <Button onClick={() => setIsIncidentModalOpen(true)} variant="secondary" size="sm">
                        Reportar Incidente
                    </Button>
                )}
            </div>

            <IncidentTimeline incidents={incidents} bots={bots} isAdmin={isAdmin} />

            <BotModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                initialData={editingBot}
                loading={actionLoading}
            />

            <IncidentModal
                isOpen={isIncidentModalOpen}
                onClose={() => setIsIncidentModalOpen(false)}
                onSubmit={handleIncidentSubmit}
                initialData={undefined} // TODO: Add edit support for incidents if needed
                bots={bots}
                loading={actionLoading}
            />
        </div>
    )
}

export default function BotsPage() {
    return (
        <BotsProvider>
            <BotsContent />
        </BotsProvider>
    )
}
