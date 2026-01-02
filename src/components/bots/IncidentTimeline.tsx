import { Incident, Bot } from '@/types/database'
import { formatDate } from '@/lib/utils'
import { AlertCircle, CheckCircle, Clock } from 'lucide-react'

interface IncidentTimelineProps {
    incidents: Incident[]
    bots: Bot[]
    isAdmin: boolean
}

export function IncidentTimeline({ incidents, bots, isAdmin }: IncidentTimelineProps) {
    const getBotName = (botId: number) => bots.find(b => b.bot_id === botId)?.name || 'Bot Desconocido'

    const impactColors = {
        Bajo: 'text-blue-400 border-blue-500/20 bg-blue-500/10',
        Medio: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10',
        Alto: 'text-orange-400 border-orange-500/20 bg-orange-500/10',
        Crítico: 'text-red-400 border-red-500/20 bg-red-500/10',
    }

    const StatusIcon = {
        Abierto: AlertCircle,
        'En Progreso': Clock,
        Resuelto: CheckCircle,
        Cerrado: CheckCircle,
    }

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold text-white mb-4">Historial de Incidentes</h2>

            <div className="relative border-l border-white/10 ml-3 space-y-6">
                {incidents.map(incident => {
                    const Icon = StatusIcon[incident.status] || AlertCircle
                    return (
                        <div key={incident.incident_id} className="relative pl-8">
                            <span className={`absolute left-[-9px] top-1 p-1 rounded-full bg-dark border border-white/20 ${incident.status === 'Abierto' ? 'text-red-400' : 'text-green-400'}`}>
                                <Icon className="h-3 w-3" />
                            </span>

                            <div className="bg-glass-bg border border-glass-border rounded-lg p-4 backdrop-blur-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold text-gray-200">{incident.title}</h4>
                                        <span className="text-xs text-primary-400 font-medium">
                                            {getBotName(incident.bot_id)}
                                        </span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded border ${impactColors[incident.impact]}`}>
                                        {incident.impact}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-400 mb-3">{incident.description}</p>

                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span>Reportado: {formatDate(incident.reported_at)}</span>
                                    {incident.resolved_at && (
                                        <span>Resuelto: {formatDate(incident.resolved_at)}</span>
                                    )}
                                    <span className="capitalize px-2 py-0.5 rounded bg-white/5">
                                        {incident.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )
                })}
                {incidents.length === 0 && (
                    <p className="pl-8 text-gray-500">No hay incidentes reportados recientes.</p>
                )}
            </div>
        </div>
    )
}
