'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card } from "@/components/ui/Card"
import { SyncButton } from "@/components/SyncButton"
import { createClient } from '@/lib/supabase/client'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts'

type FilterType =
    | 'custom_day'
    | 'custom_month'
    | 'custom_quarter'
    | 'custom_year'
    | 'all'

export default function DashboardPage() {
    const [tagRaw, setTagRaw] = useState<any[]>([])
    const [personTagRaw, setPersonTagRaw] = useState<any[]>([])
    const [planningRaw, setPlanningRaw] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<FilterType>('custom_month')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    // Custom Selection States
    const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0])
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(new Date().getMonth() / 3))

    useEffect(() => {
        // Reset category when filters change
        setSelectedCategory(null)
    }, [filter, selectedDay, selectedMonth, selectedYear, selectedQuarter])

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear()
        return Array.from({ length: 5 }, (_, i) => currentYear - 3 + i)
    }, [])

    useEffect(() => {
        let ignore = false
        const fetchData = async () => {
            setLoading(true)
            const supabase = createClient()

            const { start, end } = getDateRange(filter, {
                day: selectedDay,
                month: selectedMonth,
                year: selectedYear,
                quarter: selectedQuarter
            })

            let tagQuery = supabase.from('daily_tag_hours').select('*')
            let personTagQuery = supabase.from('daily_person_tag_hours').select('*')

            // For planning, we usually want common periods (e.g., if filtering by month)
            // If it's a specific month, we use that period (YYYYMM)
            let periodForPlanning: number | null = null
            if (filter === 'custom_month') {
                periodForPlanning = selectedYear * 100 + (selectedMonth + 1)
            } else if (filter === 'custom_day' && selectedDay) {
                const dayDate = new Date(selectedDay + 'T00:00:00')
                if (!isNaN(dayDate.getTime())) {
                    periodForPlanning = dayDate.getFullYear() * 100 + (dayDate.getMonth() + 1)
                }
            }

            if (start) {
                tagQuery = tagQuery.gte('date', start)
                personTagQuery = personTagQuery.gte('date', start)
            }
            if (end) {
                tagQuery = tagQuery.lte('date', end)
                personTagQuery = personTagQuery.lte('date', end)
            }

            try {
                const queries: any[] = [tagQuery, personTagQuery]
                if (periodForPlanning) {
                    queries.push(supabase.from('planning_entries').select('*').eq('period', periodForPlanning))
                }

                const results = await Promise.all(queries)

                if (ignore) return

                const tagsRes = results[0]
                const personTagsRes = results[1]
                const planningRes = results.length > 2 ? results[2] : null

                if (tagsRes?.error) console.error('Error tags:', tagsRes.error)
                if (personTagsRes?.error) console.error('Error personTags:', personTagsRes.error)
                if (planningRes?.error) console.error('Error planning:', planningRes.error)

                if (tagsRes?.data) setTagRaw(tagsRes.data)
                if (personTagsRes?.data) setPersonTagRaw(personTagsRes.data)

                if (planningRes?.data) {
                    setPlanningRaw(planningRes.data)
                } else {
                    setPlanningRaw([])
                }
            } catch (err) {
                console.error('Fetch exception:', err)
            } finally {
                if (!ignore) {
                    setLoading(false)
                }
            }
        }

        fetchData()
        return () => { ignore = true }
    }, [filter, selectedDay, selectedMonth, selectedYear, selectedQuarter])

    // Helper to group tags
    const getGroupedTag = (tag: string) => {
        if (!tag) return "Otros"
        const lower = tag.toLowerCase()
        if (lower.startsWith('soporte')) return "Soporte"
        if (lower.startsWith('proyecto')) return "Proyecto"
        if (lower.startsWith('preventa')) return "Preventa"
        return tag
    }

    // 1. Tag Hours Aggregate (WITH GROUPING)
    const processedTagData = useMemo(() => {
        const aggregated = tagRaw.reduce((acc: any, curr) => {
            const groupedName = getGroupedTag(curr.task_tags)
            if (!acc[groupedName]) acc[groupedName] = 0
            acc[groupedName] += curr.total_hours
            return acc
        }, {})

        return Object.entries(aggregated)
            .map(([task_tags, total_hours]) => ({ task_tags, total_hours: total_hours as number }))
            .sort((a, b) => b.total_hours - a.total_hours)
    }, [tagRaw])

    // 2. Drill-down data calculation
    const processedDetailData = useMemo(() => {
        if (!selectedCategory) return null

        // Filter personTagRaw by category
        const filtered = personTagRaw.filter(item => getGroupedTag(item.task_tags) === selectedCategory)

        // Group by original task_tags
        const grouped = filtered.reduce((acc: any, curr) => {
            if (!acc[curr.task_tags]) acc[curr.task_tags] = { total: 0, users: {} }
            acc[curr.task_tags].total += curr.tag_hours
            if (!acc[curr.task_tags].users[curr.first_name]) acc[curr.task_tags].users[curr.first_name] = 0
            acc[curr.task_tags].users[curr.first_name] += curr.tag_hours
            return acc
        }, {})

        return Object.entries(grouped)
            .map(([tagName, data]: [string, any]) => ({
                tagName,
                total: data.total,
                users: Object.entries(data.users)
                    .map(([name, hours]) => ({ name, hours: hours as number }))
                    .sort((a, b) => b.hours - a.hours)
            }))
            .sort((a, b) => b.total - a.total)
    }, [personTagRaw, selectedCategory])

    // 3. Person Distribution Grid Aggregate (WITH GROUPING & first_name)
    const distributionByPerson = useMemo(() => {
        const personTagSum = personTagRaw.reduce((acc: any, curr) => {
            const groupedName = getGroupedTag(curr.task_tags)
            const key = `${curr.first_name}-${groupedName}`
            if (!acc[key]) {
                acc[key] = { first_name: curr.first_name, name: groupedName, value: 0 }
            }
            acc[key].value += curr.tag_hours
            return acc
        }, {})

        const byPerson = Object.values(personTagSum).reduce((acc: any, curr: any) => {
            if (!acc[curr.first_name]) acc[curr.first_name] = { total: 0, items: [] }
            acc[curr.first_name].items.push(curr)
            acc[curr.first_name].total += curr.value
            return acc
        }, {})

        const final: any = {}
        const normalizeName = (n: string) => n ? n.split(' ')[0].trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : ''

        Object.entries(byPerson as Record<string, any>).forEach(([name, data]: [string, any]) => {
            // Planning data for this person in this period (normalized match)
            const personPlanning = planningRaw.filter(p => normalizeName(p.first_name) === normalizeName(name))

            // Capacity is typically same for all activities of one person in one period
            const capacity = personPlanning.length > 0 ? personPlanning[0].capacity_hours : 0

            // Planned is the sum of all activities planned for this person
            const planned = personPlanning.reduce((sum, p) => sum + (parseFloat(p.planned_hours) || 0), 0)

            final[name] = {
                totalValue: data.total,
                capacity,
                planned,
                utilization: capacity > 0 ? ((data.total / capacity) * 100).toFixed(1) : (data.total > 0 ? '100+' : '0'),
                adherence: planned > 0 ? ((data.total / planned) * 100).toFixed(1) : '0',
                items: data.items.map((item: any) => ({
                    ...item,
                    percentage: data.total > 0 ? ((item.value / data.total) * 100).toFixed(1) : 0
                })).sort((a: any, b: any) => b.value - a.value)
            }
        })
        return final
    }, [personTagRaw, planningRaw])

    const globalStats = useMemo(() => {
        let totalReal = 0
        let totalCapacity = 0
        let totalPlanned = 0

        Object.values(distributionByPerson).forEach((person: any) => {
            totalReal += person.totalValue
            totalCapacity += parseFloat(person.capacity) || 0
            totalPlanned += parseFloat(person.planned) || 0
        })

        return {
            totalReal,
            totalCapacity,
            totalPlanned,
            utilization: totalCapacity > 0 ? ((totalReal / totalCapacity) * 100).toFixed(1) : '0',
            adherence: totalPlanned > 0 ? ((totalReal / totalPlanned) * 100).toFixed(1) : '0'
        }
    }, [distributionByPerson])

    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f', '#ffbb28', '#ff8042']

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col gap-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent transform transition-all duration-500 hover:scale-[1.01] origin-left">
                            Dashboard General
                        </h1>
                        <p className="text-gray-400">
                            Estadísticas de rendimiento y carga de trabajo.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            {filter === 'custom_day' && (
                                <input
                                    type="date"
                                    value={selectedDay}
                                    onChange={(e) => setSelectedDay(e.target.value)}
                                    className="bg-black/40 border border-white/10 text-white text-xs rounded-lg px-3 py-2 outline-none backdrop-blur-sm cursor-pointer hover:border-white/20"
                                />
                            )}
                            {(filter === 'custom_month' || filter === 'custom_quarter' || filter === 'custom_year') && (
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="bg-black/40 border border-white/10 text-white text-xs rounded-lg px-3 py-2 outline-none backdrop-blur-sm cursor-pointer hover:border-white/20"
                                >
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            )}
                            {filter === 'custom_month' && (
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="bg-black/40 border border-white/10 text-white text-xs rounded-lg px-3 py-2 outline-none backdrop-blur-sm cursor-pointer hover:border-white/20"
                                >
                                    {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                                </select>
                            )}
                            {filter === 'custom_quarter' && (
                                <select
                                    value={selectedQuarter}
                                    onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                                    className="bg-black/40 border border-white/10 text-white text-xs rounded-lg px-3 py-2 outline-none backdrop-blur-sm cursor-pointer hover:border-white/20"
                                >
                                    <option value={0}>Trimestre 1</option>
                                    <option value={1}>Trimestre 2</option>
                                    <option value={2}>Trimestre 3</option>
                                    <option value={3}>Trimestre 4</option>
                                </select>
                            )}
                        </div>

                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as FilterType)}
                            className="bg-black/40 border border-white/10 text-white text-sm rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500 outline-none backdrop-blur-sm cursor-pointer transition-all hover:border-white/20"
                        >
                            <option value="custom_day">Día Específico</option>
                            <option value="custom_month">Mes Específico</option>
                            <option value="custom_quarter">Trimestre Específico</option>
                            <option value="custom_year">Año Específico</option>
                            <option value="all">Todo el tiempo</option>
                        </select>
                        <SyncButton />
                    </div>
                </div>
            </div>

            {/* Global Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <Card className="p-6 bg-black/40 border-white/5 backdrop-blur-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Capacidad Total</p>
                    <p className="text-2xl font-black text-white">{globalStats.totalCapacity.toFixed(0)}h</p>
                </Card>
                <Card className="p-6 bg-black/40 border-white/5 backdrop-blur-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Tiempo Planificado</p>
                    <p className="text-2xl font-black text-white">{globalStats.totalPlanned.toFixed(0)}h</p>
                </Card>
                <Card className="p-6 bg-black/40 border-white/5 backdrop-blur-sm border-l-primary-500/50">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Horas Reales</p>
                    <p className="text-2xl font-black text-white">{globalStats.totalReal.toFixed(1)}h</p>
                </Card>
                <Card className="p-6 bg-black/40 border-white/5 backdrop-blur-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Tiempo Utilizado (%)</p>
                    <p className="text-2xl font-black text-primary-400">{globalStats.utilization}%</p>
                </Card>
                <Card className="p-6 bg-black/40 border-white/5 backdrop-blur-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Horas Reales (%)</p>
                    <p className="text-2xl font-black text-green-400">{globalStats.adherence}%</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Chart: Task Tag Hours (GROUPED) */}
                <Card className="p-8 min-h-[500px] flex flex-col shadow-2xl border-white/5 bg-black/40 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                        <h3 className="text-xl font-bold text-white">Horas Totales por Categoría de Actividad</h3>
                        <p className="text-xs text-primary-400 font-bold uppercase tracking-widest animate-pulse">Haz clic en una barra para ver detalle</p>
                    </div>
                    <div className="flex-1 w-full min-h-[400px]">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-gray-400 font-medium animate-pulse">Cargando datos...</div>
                        ) : processedTagData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-500">No hay datos para el período seleccionado.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={processedTagData}
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                    onClick={(data) => {
                                        if (data && data.activeLabel) {
                                            setSelectedCategory(data.activeLabel as string);
                                        }
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                                    <XAxis type="number" stroke="#888" tick={{ fill: '#888' }} />
                                    <YAxis
                                        dataKey="task_tags"
                                        type="category"
                                        width={150}
                                        stroke="#888"
                                        tick={{ fill: '#888', fontWeight: 'bold', fontSize: '14px' }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#1a1b1e', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value: any) => [`${value.toFixed(1)} hrs`, 'Total']}
                                    />
                                    <Bar dataKey="total_hours" name="Horas" radius={[0, 4, 4, 0]} className="cursor-pointer">
                                        {processedTagData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={selectedCategory === entry.task_tags ? '#fff' : colors[index % colors.length]}
                                                fillOpacity={selectedCategory && selectedCategory !== entry.task_tags ? 0.3 : 1}
                                                className="transition-all duration-300"
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>

                {/* Drill-down Section */}
                {selectedCategory && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex justify-between items-end border-l-4 border-primary-500 pl-4">
                            <div>
                                <h3 className="text-2xl font-black text-white flex items-center gap-2">
                                    Detalle de <span className="text-primary-400">{selectedCategory}</span>
                                </h3>
                                <p className="text-sm text-gray-400 mt-1">Desglose por etiquetas originales y distribución de equipo.</p>
                            </div>
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl border border-white/10 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                            >
                                <span className="text-lg leading-none">×</span> Cerrar Detalle
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {(processedDetailData || []).map((detail, idx) => (
                                <Card key={idx} className="p-8 flex flex-col shadow-2xl border-white/5 bg-black/40 backdrop-blur-sm hover:border-primary-500/30 transition-all duration-300">
                                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                                        <h4 className="text-lg font-bold text-white truncate max-w-[180px]" title={detail.tagName}>
                                            {detail.tagName}
                                        </h4>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Subtotal</p>
                                            <p className="text-xl font-black text-white">{detail.total.toFixed(1)}h</p>
                                        </div>
                                    </div>

                                    <div className="space-y-5 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                                        {detail.users.map((user, uIdx) => (
                                            <div key={uIdx} className="group flex flex-col gap-2">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-sm text-gray-400 font-medium group-hover:text-white transition-colors">
                                                        {user.name}
                                                    </span>
                                                    <span className="text-sm font-bold text-white">{user.hours.toFixed(1)}h</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full transition-all duration-1000 ease-out rounded-full shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                                                        style={{
                                                            width: `${(user.hours / detail.total) * 100}%`,
                                                            backgroundColor: colors[uIdx % colors.length]
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                <div className="pt-8 pb-4">
                    <h2 className="text-2xl font-bold text-white border-l-4 border-primary-500 pl-4">Distribución Individual (por Nombre)</h2>
                    <p className="text-gray-400 mt-2">Carga horaria agrupada por integrante usando categorías consolidadas.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {loading ? (
                        [1, 2, 3].map(i => <Card key={i} className="p-8 h-48 animate-pulse bg-white/5 border-white/5" />)
                    ) : Object.keys(distributionByPerson).length === 0 ? (
                        <div className="col-span-full py-12 text-center text-gray-500">No hay registros de distribución para este periodo.</div>
                    ) : Object.keys(distributionByPerson).map((person, pIdx) => (
                        <Card key={person} className="p-8 flex flex-col shadow-2xl border-white/5 bg-black/40 backdrop-blur-sm hover:border-primary-500/30 transition-all duration-300">
                            <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
                                <div className="flex flex-col gap-1">
                                    <h3 className="text-xl font-bold text-white">
                                        {person}
                                    </h3>
                                    <div className="flex flex-col gap-0.5">
                                        {parseFloat(distributionByPerson[person].capacity) > 0 && (
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary-400">
                                                Utilización: {distributionByPerson[person].utilization}%
                                            </p>
                                        )}
                                        {parseFloat(distributionByPerson[person].planned) > 0 && (
                                            <p className="text-[10px] font-black uppercase tracking-widest text-green-400">
                                                Horas Reales: {distributionByPerson[person].adherence}%
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="mb-2">
                                        <p className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter">Ejecutado / Plan / Capacidad</p>
                                        <p className="text-lg font-black text-white leading-tight">
                                            {distributionByPerson[person].totalValue.toFixed(1)} / {parseFloat(distributionByPerson[person].planned).toFixed(0)} / {parseFloat(distributionByPerson[person].capacity).toFixed(0)}h
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-5 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                                {distributionByPerson[person].items.map((item: any, idx: number) => (
                                    <div key={idx} className="group flex flex-col gap-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-sm text-gray-400 font-medium group-hover:text-white transition-colors truncate max-w-[150px]" title={item.name}>
                                                {item.name}
                                            </span>
                                            <div className="text-right">
                                                <span className="text-sm font-bold text-white">{item.value.toFixed(1)}h</span>
                                                <span className="text-[10px] text-gray-500 ml-1 font-bold">({item.percentage}%)</span>
                                            </div>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full transition-all duration-1000 ease-out rounded-full"
                                                style={{
                                                    width: `${item.percentage}%`,
                                                    backgroundColor: colors[(idx + pIdx) % colors.length],
                                                    boxShadow: `0 0 12px ${colors[(idx + pIdx) % colors.length]}60`
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}

function getDateRange(filter: FilterType, options: { day: string, month: number, year: number, quarter: number }) {
    let start: Date | null = null
    let end: Date | null = null

    switch (filter) {
        case 'custom_day':
            start = new Date(options.day + 'T00:00:00')
            end = new Date(options.day + 'T23:59:59')
            break
        case 'custom_month':
            start = new Date(options.year, options.month, 1)
            end = new Date(options.year, options.month + 1, 0)
            break
        case 'custom_quarter':
            start = new Date(options.year, options.quarter * 3, 1)
            end = new Date(options.year, (options.quarter + 1) * 3, 0)
            break
        case 'custom_year':
            start = new Date(options.year, 0, 1)
            end = new Date(options.year, 11, 31)
            break
        case 'all':
            start = null
            break
    }

    return {
        start: start ? `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}` : null,
        end: end ? `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}` : null
    }
}
