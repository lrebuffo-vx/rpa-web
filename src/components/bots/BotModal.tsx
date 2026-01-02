'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Bot } from '@/types/database'

interface BotModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: any) => Promise<void>
    initialData?: Bot
    loading?: boolean
}

export function BotModal({ isOpen, onClose, onSubmit, initialData, loading }: BotModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        system: '',
        environment: 'Producción',
        client: '',
        status: 'operativo',
        responsible_name: '',
        responsible_email: '',
    })

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                description: initialData.description || '',
                system: initialData.system,
                environment: initialData.environment,
                client: initialData.client,
                status: initialData.status,
                responsible_name: initialData.responsible_name || '',
                responsible_email: initialData.responsible_email || '',
            })
        } else {
            setFormData({
                name: '',
                description: '',
                system: '',
                environment: 'Producción',
                client: '',
                status: 'operativo',
                responsible_name: '',
                responsible_email: '',
            })
        }
    }, [initialData, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit(formData)
        onClose()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Editar Bot' : 'Nuevo Bot'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Cliente</label>
                        <input
                            type="text"
                            required
                            value={formData.client}
                            onChange={e => setFormData({ ...formData, client: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Sistema</label>
                        <input
                            type="text"
                            required
                            value={formData.system}
                            onChange={e => setFormData({ ...formData, system: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Ambiente</label>
                        <select
                            value={formData.environment}
                            onChange={e => setFormData({ ...formData, environment: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                        >
                            <option value="Producción">Producción</option>
                            <option value="QA">QA</option>
                            <option value="Desarrollo">Desarrollo</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Estado</label>
                    <select
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                    >
                        <option value="operativo">🟢 Operativo</option>
                        <option value="observacion">🟡 Observación</option>
                        <option value="caido">🔴 Caído</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
                    <textarea
                        rows={3}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Responsable</label>
                        <input
                            type="text"
                            value={formData.responsible_name}
                            onChange={e => setFormData({ ...formData, responsible_name: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Email Responsable</label>
                        <input
                            type="email"
                            value={formData.responsible_email}
                            onChange={e => setFormData({ ...formData, responsible_email: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" isLoading={loading}>Guardar</Button>
                </div>
            </form>
        </Modal>
    )
}
