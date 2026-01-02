'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { News } from '@/types/database'
import { useAuth } from '@/hooks/useAuth'

interface NewsContextType {
    news: News[]
    loading: boolean
    createNews: (news: Omit<News, 'news_id' | 'created_at' | 'published_at' | 'author_id'>, imageFile: File) => Promise<void>
    updateNews: (id: number, news: Partial<News>, imageFile?: File) => Promise<void>
    deleteNews: (id: number) => Promise<void>
    refreshNews: () => Promise<void>
}

const NewsContext = createContext<NewsContextType | undefined>(undefined)

export function NewsProvider({ children }: { children: React.ReactNode }) {
    const [news, setNews] = useState<News[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()
    const { user } = useAuth()

    const fetchNews = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('news')
            .select('*')
            .order('is_featured', { ascending: false })
            .order('priority', { ascending: false })
            .order('published_at', { ascending: false })

        if (error) {
            console.error('Error fetching news:', JSON.stringify(error, null, 2))
            console.error('Error details:', error.message, error.details, error.hint)
        }
        else setNews(data || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchNews()
    }, [])

    const uploadImage = async (file: File) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('news-images')
            .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
            .from('news-images')
            .getPublicUrl(filePath)

        return publicUrl
    }

    const createNews = async (newsData: Omit<News, 'news_id' | 'created_at' | 'published_at' | 'author_id'>, imageFile: File) => {
        try {
            if (!user) throw new Error('Usuario no autenticado')

            const imageUrl = await uploadImage(imageFile)

            const { error } = await supabase.from('news').insert({
                ...newsData,
                image_url: imageUrl,
                author_id: user.id
            })

            if (error) throw error
            await fetchNews()
        } catch (error) {
            console.error('Error creating news:', error)
            throw error
        }
    }

    const updateNews = async (id: number, newsData: Partial<News>, imageFile?: File) => {
        try {
            let imageUrl = newsData.image_url

            if (imageFile) {
                imageUrl = await uploadImage(imageFile)
            }

            const { error } = await supabase.from('news')
                .update({ ...newsData, image_url: imageUrl })
                .eq('news_id', id)

            if (error) throw error
            await fetchNews()
        } catch (error) {
            console.error('Error updating news:', error)
            throw error
        }
    }

    const deleteNews = async (id: number) => {
        try {
            const { error } = await supabase.from('news').delete().eq('news_id', id)
            if (error) throw error
            setNews(prev => prev.filter(n => n.news_id !== id))
        } catch (error) {
            console.error('Error deleting news:', error)
            throw error
        }
    }

    return (
        <NewsContext.Provider value={{ news, loading, createNews, updateNews, deleteNews, refreshNews: fetchNews }}>
            {children}
        </NewsContext.Provider>
    )
}

export function useNews() {
    const context = useContext(NewsContext)
    if (context === undefined) {
        throw new Error('useNews must be used within a NewsProvider')
    }
    return context
}
