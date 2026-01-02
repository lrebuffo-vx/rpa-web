import Link from 'next/link'
import Image from 'next/image'
import { News } from '@/types/database'
import { formatDate } from '@/lib/utils'
import { Edit, Trash2, Pin } from 'lucide-react'

interface NewsCardProps {
    news: News
    isAdmin: boolean
    onEdit: (news: News) => void
    onDelete: (id: number) => void
}

export function NewsCard({ news, isAdmin, onEdit, onDelete }: NewsCardProps) {
    return (
        <article className="group relative flex flex-col overflow-hidden rounded-xl bg-glass-bg border border-glass-border backdrop-blur-sm transition-all hover:bg-glass-bg/80 hover:shadow-xl hover:-translate-y-1">
            <div className="relative h-48 w-full overflow-hidden">
                {news.image_url ? (
                    <Image
                        src={news.image_url}
                        alt={news.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="h-full w-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-gray-500">
                        Sin imagen
                    </div>
                )}

                {news.is_featured && (
                    <div className="absolute top-2 right-2 bg-yellow-500/90 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg backdrop-blur-md">
                        <Pin className="h-3 w-3" />
                        Destacado
                    </div>
                )}

                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded-md border border-white/10">
                    {news.category}
                </div>
            </div>

            <div className="flex flex-1 flex-col p-4">
                <div className="flex flex-wrap gap-2 mb-3">
                    {news.tags.map(tag => (
                        <span key={tag} className="text-xs bg-primary-500/10 text-primary-300 border border-primary-500/20 px-2 py-0.5 rounded-full">
                            #{tag}
                        </span>
                    ))}
                </div>

                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors">
                    {news.title}
                </h3>

                <p className="text-gray-400 text-sm line-clamp-3 mb-4 flex-1">
                    {news.content}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                    <span className="text-xs text-gray-500">
                        {formatDate(news.published_at)}
                    </span>

                    {isAdmin && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => onEdit(news)}
                                className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                                title="Editar"
                            >
                                <Edit className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => onDelete(news.news_id)}
                                className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                title="Eliminar"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </article>
    )
}
