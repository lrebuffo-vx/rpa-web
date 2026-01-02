'use client'

import { useState } from 'react'
import { NewsProvider, useNews } from '@/contexts/NewsContext'
import { useAuth } from '@/hooks/useAuth'
import { NewsCard } from '@/components/news/NewsCard'
import { NewsFilters } from '@/components/news/NewsFilters'
import { NewsModal } from '@/components/news/NewsModal'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'
import { News } from '@/types/database'

function DashboardContent() {
    const { news, loading, createNews, updateNews, deleteNews } = useNews()
    const { isAdmin } = useAuth()

    const [filters, setFilters] = useState({ search: '', category: '', tag: '' })
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingNews, setEditingNews] = useState<News | undefined>(undefined)
    const [actionLoading, setActionLoading] = useState(false)

    const filteredNews = news.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            item.content.toLowerCase().includes(filters.search.toLowerCase())
        const matchesCategory = filters.category ? item.category === filters.category : true
        const matchesTag = filters.tag ? item.tags.includes(filters.tag) : true

        return matchesSearch && matchesCategory && matchesTag
    })

    const handleEdit = (newsItem: News) => {
        setEditingNews(newsItem)
        setIsModalOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (confirm('¿Estás seguro de eliminar esta noticia?')) {
            await deleteNews(id)
        }
    }

    const handleSubmit = async (data: any, image: File) => {
        setActionLoading(true)
        try {
            if (editingNews) {
                await updateNews(editingNews.news_id, data, image)
            } else {
                await createNews(data, image)
            }
        } finally {
            setActionLoading(false)
        }
    }

    const handleOpenCreate = () => {
        setEditingNews(undefined)
        setIsModalOpen(true)
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Novedades y Noticias</h1>
                    <p className="text-gray-400">Mantente al día con los últimos acontecimientos.</p>
                </div>

                {isAdmin && (
                    <Button onClick={handleOpenCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Noticia
                    </Button>
                )}
            </div>

            <NewsFilters onFilterChange={setFilters} />

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredNews.map(item => (
                        <NewsCard
                            key={item.news_id}
                            news={item}
                            isAdmin={isAdmin}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                    {filteredNews.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No se encontraron noticias con los filtros seleccionados.
                        </div>
                    )}
                </div>
            )}

            <NewsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                initialData={editingNews}
                loading={actionLoading}
            />
        </div>
    )
}

export default function DashboardPage() {
    return (
        <NewsProvider>
            <DashboardContent />
        </NewsProvider>
    )
}
