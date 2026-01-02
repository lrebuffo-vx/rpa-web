'use client'

import { Card } from "@/components/ui/Card"
import { BarChart3, TrendingUp, Users, Activity } from "lucide-react"

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent transform transition-all duration-500 hover:scale-[1.01] origin-left">
                    Dashboard General
                </h1>
                <p className="text-gray-400">
                    Vista general de estadísticas y métricas de rendimiento.
                </p>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryCard
                    title="Total Procesos"
                    value="12"
                    change="+2.5%"
                    icon={Activity}
                    trend="up"
                />
                <SummaryCard
                    title="Horas Ahorradas"
                    value="1,240"
                    change="+12%"
                    icon={TrendingUp}
                    trend="up"
                />
                <SummaryCard
                    title="Usuarios Activos"
                    value="45"
                    change="+5%"
                    icon={Users}
                    trend="up"
                />
                <SummaryCard
                    title="Ejecuciones Hoy"
                    value="850"
                    change="-1.2%"
                    icon={BarChart3}
                    trend="down"
                />
            </div>

            {/* Charts Section Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-glass-bg border border-glass-border rounded-xl p-6 h-[400px] flex items-center justify-center text-gray-400">
                    <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Gráfico de Ejecuciones (Próximamente)</p>
                    </div>
                </div>
                <div className="bg-glass-bg border border-glass-border rounded-xl p-6 h-[400px] flex items-center justify-center text-gray-400">
                    <div className="text-center">
                        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Métricas de Ahorro (Próximamente)</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function SummaryCard({ title, value, change, icon: Icon, trend }: any) {
    return (
        <Card className="p-6 hover:bg-white/5 transition-colors group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-primary-500/10 rounded-lg group-hover:bg-primary-500/20 transition-colors">
                    <Icon className="h-5 w-5 text-primary-400" />
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend === 'up'
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-red-500/10 text-red-400'
                    }`}>
                    {change}
                </span>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
            <p className="text-2xl font-bold text-white">{value}</p>
        </Card>
    )
}
