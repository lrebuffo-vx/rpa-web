'use client'

import { useEffect, useState } from 'react'
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

export default function DashboardPage() {
    const [dailyData, setDailyData] = useState<any[]>([])
    const [tagData, setTagData] = useState<any[]>([])
    const [distributionData, setDistributionData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()

            const [
                { data: daily },
                { data: tags },
                { data: distribution }
            ] = await Promise.all([
                supabase.from('daily_hours_by_person').select('*'),
                supabase.from('task_tag_hours').select('*'),
                supabase.from('person_tag_distribution').select('*')
            ])

            if (daily) setDailyData(daily)
            if (tags) setTagData(tags)
            if (distribution) setDistributionData(distribution)
            setLoading(false)
        }

        fetchData()
    }, [])

    // Chart 1: Daily Hours (stacked by person)
    const processedDailyData = dailyData.reduce((acc: any[], curr) => {
        const dateStr = new Date(curr.date).toLocaleDateString()
        const existingToken = acc.find(item => item.name === dateStr)

        if (existingToken) {
            existingToken[curr.last_name] = curr.total_hours
        } else {
            acc.push({
                name: dateStr,
                [curr.last_name]: curr.total_hours
            })
        }
        return acc
    }, [])

    const people = Array.from(new Set(dailyData.map(d => d.last_name)))
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f', '#ffbb28', '#ff8042']

    // Group distribution data by person
    const distributionByPerson = distributionData.reduce((acc: any, curr) => {
        if (!acc[curr.last_name]) acc[curr.last_name] = []
        acc[curr.last_name].push({
            name: curr.task_tags,
            value: curr.tag_hours,
            percentage: curr.percentage
        })
        return acc
    }, {})

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent transform transition-all duration-500 hover:scale-[1.01] origin-left">
                        Dashboard General
                    </h1>
                    <SyncButton />
                </div>
                <p className="text-gray-400">
                    Métricas de tiempo y carga de trabajo basadas en Task Tags.
                </p>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-8">
                {/* Chart 1: Daily Hours */}
                <Card className="p-8 h-[600px] flex flex-col shadow-2xl border-white/5 bg-black/40 backdrop-blur-sm">
                    <h3 className="text-xl font-bold mb-6 text-white border-b border-white/10 pb-4 text-center">Horas por Persona por Día</h3>
                    <div className="flex-1 w-full min-h-0">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-gray-400 font-medium">Cargando datos...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={processedDailyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="name" stroke="#888" tick={{ fill: '#888' }} />
                                    <YAxis stroke="#888" tick={{ fill: '#888' }} label={{ value: 'Horas', angle: -90, position: 'insideLeft', fill: '#888' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1b1e', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    {people.map((person: any, index) => (
                                        <Bar
                                            key={person}
                                            dataKey={person}
                                            stackId="a"
                                            fill={colors[index % colors.length]}
                                            radius={[index === people.length - 1 ? 4 : 0, index === people.length - 1 ? 4 : 0, 0, 0]}
                                        />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>

                {/* Chart 2: Task Tag Hours */}
                <Card className="p-8 h-[600px] flex flex-col shadow-2xl border-white/5 bg-black/40 backdrop-blur-sm">
                    <h3 className="text-xl font-bold mb-6 text-white border-b border-white/10 pb-4 text-center">Horas Totales por Task Tag</h3>
                    <div className="flex-1 w-full min-h-0">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-gray-400 font-medium">Cargando datos...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={tagData.slice(0, 15)}
                                    margin={{ top: 5, right: 50, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                                    <XAxis type="number" stroke="#888" tick={{ fill: '#888' }} />
                                    <YAxis
                                        dataKey="task_tags"
                                        type="category"
                                        width={250}
                                        stroke="#888"
                                        tick={{ fill: '#888', fontWeight: 'bold', fontSize: '12px' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1b1e', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value: any) => [`${value} hrs`, 'Total']}
                                    />
                                    <Bar dataKey="total_hours" name="Horas" fill="#82ca9d" radius={[0, 4, 4, 0]}>
                                        {tagData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>

                {/* Section titles */}
                <div className="pt-8 pb-4">
                    <h2 className="text-2xl font-bold text-white border-l-4 border-primary-500 pl-4">Distribución Individual</h2>
                    <p className="text-gray-400 mt-2">Detalle de eficiencia y carga horaria por cada integrante.</p>
                </div>

                {/* Section: Distribution per Person (ELEGANT CARDS) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {!loading && Object.keys(distributionByPerson).map((person, pIdx) => (
                        <Card key={person} className="p-8 flex flex-col shadow-2xl border-white/5 bg-black/40 backdrop-blur-sm hover:border-primary-500/30 transition-all duration-300">
                            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                                <h3 className="text-xl font-bold text-white">
                                    {person}
                                </h3>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-tighter">Total Horas</p>
                                    <p className="text-lg font-black text-primary-400">
                                        {distributionByPerson[person].reduce((acc: number, curr: any) => acc + curr.value, 0).toFixed(1)}h
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-5 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                                {distributionByPerson[person].map((item: any, idx: number) => (
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
