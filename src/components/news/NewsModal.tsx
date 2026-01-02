'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { News } from '@/types/database'
import { useAuth } from '@/hooks/useAuth'

interface NewsModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: any, image: File) => Promise<void>
    initialData?: News
    loading?: boolean
}

export function NewsModal({ isOpen, onClose, onSubmit, initialData, loading }: NewsModalProps) {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [category, setCategory] = useState('Comunicados')
    const [tags, setTags] = useState('')
    const [isFeatured, setIsFeatured] = useState(false)
    const [priority, setPriority] = useState(0)
    const [image, setImage] = useState<File | null>(null)

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title)
            setContent(initialData.content)
            setCategory(initialData.category)
            setTags(initialData.tags.join(', '))
            setIsFeatured(initialData.is_featured)
            setPriority(initialData.priority)
        } else {
            // Reset form
            setTitle('')
            setContent('')
            setCategory('Comunicados')
            setTags('')
            setIsFeatured(false)
            setPriority(0)
            setImage(null)
        }
    }, [initialData, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!image && !initialData) {
            alert('La imagen es obligatoria para nuevas noticias')
            return
        }

        const data = {
            title,
            content,
            category,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            is_featured: isFeatured,
            priority
        }

        // @ts-ignore - Validated above
        await onSubmit(data, image)
        onClose()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Editar Noticia' : 'Nueva Noticia'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Título</label>
                    <input
                        type="text"
                        required
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Categoría</label>
                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                    >
                        <option value="Comunicados">📢 Comunicados</option>
                        <option value="Bots">🤖 Bots</option>
                        <option value="Incidentes">⚠️ Incidentes</option>
                        <option value="Mejoras">✨ Mejoras</option>
                        <option value="Release">🚀 Release</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Tags (separados por coma)</label>
                    <input
                        type="text"
                        value={tags}
                        onChange={e => setTags(e.target.value)}
                        placeholder="Ej: UiPath, SAP, Producción"
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Imagen de Portada</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={e => setImage(e.target.files?.[0] || null)}
                        required={!initialData}
                        className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-600/20 file:text-primary-400 hover:file:bg-primary-600/30"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Contenido</label>
                    <textarea
                        required
                        rows={5}
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                    />
                </div>

                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isFeatured}
                            onChange={e => setIsFeatured(e.target.checked)}
                            className="rounded border-gray-600 bg-black/20 text-primary-600"
                        />
                        <span className="text-sm text-gray-300">Destacar Noticia</span>
                    </label>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Prioridad (0-10)</label>
                    <input
                        type="number"
                        min="0"
                        max="10"
                        value={priority}
                        onChange={e => setPriority(parseInt(e.target.value))}
                        className="w-20 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" isLoading={loading}>Guardar</Button>
                </div>
            </form>
        </Modal>
    )
}
