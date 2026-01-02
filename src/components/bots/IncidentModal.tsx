'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Incident, Bot } from '@/types/database'

interface IncidentModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: any) => Promise<void>
    initialData?: Incident
    bots: Bot[]
    loading?: boolean
}

export function IncidentModal({ isOpen, onClose, onSubmit, initialData, bots, loading }: IncidentModalProps) {
    const [formData, setFormData] = useState({
        bot_id: '',
        title: '',
        description: '',
        impact: 'Bajo',
        status: 'Abierto',
        root_cause: '',
        resolution: '',
    })

    useEffect(() => {
        if (initialData) {
            setFormData({
                bot_id: initialData.bot_id.toString(),
                title: initialData.title,
                description: initialData.description || '',
                impact: initialData.impact,
                status: initialData.status,
                root_cause: initialData.root_cause || '',
                resolution: initialData.resolution || '',
            })
        } else {
            setFormData({
                bot_id: '',
                title: '',
                description: '',
                impact: 'Bajo',
                status: 'Abierto',
                root_cause: '',
                resolution: '',
            })
        }
    }, [initialData, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // Int parse bot_id
        const data = {
            ...formData,
            bot_id: parseInt(formData.bot_id)
        }
        await onSubmit(data)
        onClose()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Editar Incidente' : 'Reportar Incidente'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Bot Afectado</label>
                    <select
                        required
                        value={formData.bot_id}
                        onChange={e => setFormData({ ...formData, bot_id: e.target.value })}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                        disabled={!!initialData}
                    >
                        <option value="">Seleccionar Bot...</option>
                        {bots.map(bot => (
                            <option key={bot.bot_id} value={bot.bot_id}>{bot.name} ({bot.client})</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Título del Incidente</label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Impacto</label>
                        <select
                            value={formData.impact}
                            onChange={e => setFormData({ ...formData, impact: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                        >
                            <option value="Bajo">🟢 Bajo</option>
                            <option value="Medio">🟡 Medio</option>
                            <option value="Alto">🟠 Alto</option>
                            <option value="Crítico">🔴 Crítico</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Estado</label>
                        <select
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                        >
                            <option value="Abierto">🚨 Abierto</option>
                            <option value="En Progreso">🚧 En Progreso</option>
                            <option value="Resuelto">✅ Resuelto</option>
                            <option value="Cerrado">🔒 Cerrado</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
                    <textarea
                        rows={3}
                        required
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                    />
                </div>

                {formData.status !== 'Abierto' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Causa Raíz</label>
                            <textarea
                                rows={2}
                                value={formData.root_cause}
                                onChange={e => setFormData({ ...formData, root_cause: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Resolución</label>
                            <textarea
                                rows={2}
                                value={formData.resolution}
                                onChange={e => setFormData({ ...formData, resolution: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                            />
                        </div>
                    </>
                )}

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" isLoading={loading}>Guardar Incidente</Button>
                </div>
            </form>
        </Modal>
    )
}
