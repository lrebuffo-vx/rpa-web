'use client'

import { useState, useEffect } from 'react'
import { debounce } from '@/lib/utils'
import { Search, X } from 'lucide-react'

interface NewsFiltersProps {
    onFilterChange: (filters: { search: string; category: string; tag: string }) => void
}

export function NewsFilters({ onFilterChange }: NewsFiltersProps) {
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('')
    const [tag, setTag] = useState('')

    const debouncedSearch = debounce((value: string) => {
        onFilterChange({ search: value, category, tag })
    }, 300)

    useEffect(() => {
        onFilterChange({ search, category, tag })
    }, [category, tag])

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearch(value)
        debouncedSearch(value)
    }

    const clearFilters = () => {
        setSearch('')
        setCategory('')
        setTag('')
        onFilterChange({ search: '', category: '', tag: '' })
    }

    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 rounded-xl bg-glass-bg border border-glass-border">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                    type="text"
                    placeholder="Buscar por título, contenido, autor..."
                    value={search}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
            </div>

            <div className="flex gap-4">
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-black/20 border border-white/10 rounded-lg text-white px-4 py-2 focus:outline-none focus:border-primary-500"
                >
                    <option value="">Todas las categorías</option>
                    <option value="Bots">Bots</option>
                    <option value="Incidentes">Incidentes</option>
                    <option value="Mejoras">Mejoras</option>
                    <option value="Release">Release</option>
                    <option value="Comunicados">Comunicados</option>
                </select>

                <select
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="bg-black/20 border border-white/10 rounded-lg text-white px-4 py-2 focus:outline-none focus:border-primary-500"
                >
                    <option value="">Todos los tags</option>
                    <option value="UiPath">UiPath</option>
                    <option value="Power Automate">Power Automate</option>
                    <option value="SAP">SAP</option>
                    <option value="DIAN">DIAN</option>
                    <option value="Producción">Producción</option>
                </select>

                {(search || category || tag) && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="h-4 w-4" />
                        Limpiar
                    </button>
                )}
            </div>
        </div>
    )
}
