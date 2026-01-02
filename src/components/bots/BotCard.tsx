import { Bot } from '@/types/database'
import { Edit, Trash2, Cpu, ExternalLink } from 'lucide-react'

interface BotCardProps {
    bot: Bot
    isAdmin: boolean
    onEdit: (bot: Bot) => void
    onDelete: (id: number) => void
}

export function BotCard({ bot, isAdmin, onEdit, onDelete }: BotCardProps) {
    const statusColors = {
        operativo: 'bg-green-500',
        observacion: 'bg-yellow-500',
        caido: 'bg-red-500',
    }

    const borderColors = {
        operativo: 'border-green-500/30 hover:border-green-500/50',
        observacion: 'border-yellow-500/30 hover:border-yellow-500/50',
        caido: 'border-red-500/30 hover:border-red-500/50',
    }

    return (
        <div className={`group relative bg-glass-bg border backdrop-blur-sm rounded-xl p-5 transition-all hover:bg-glass-bg/80 ${borderColors[bot.status]}`}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/5">
                        <Cpu className="h-6 w-6 text-primary-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">{bot.name}</h3>
                        <span className="text-xs text-gray-400">{bot.client}</span>
                    </div>
                </div>
                <div className={`h-3 w-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${statusColors[bot.status]}`} title={bot.status} />
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Sistema:</span>
                    <span className="text-gray-300">{bot.system}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Ambiente:</span>
                    <span className={`px-2 py-0.5 rounded text-xs border ${bot.environment === 'Producción' ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' :
                            'bg-blue-500/10 text-blue-300 border-blue-500/20'
                        }`}>
                        {bot.environment}
                    </span>
                </div>
                {bot.responsible_name && (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Responsable:</span>
                        <span className="text-gray-300">{bot.responsible_name}</span>
                    </div>
                )}
            </div>

            {isAdmin && (
                <div className="flex justify-end gap-2 pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(bot)}
                        className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => onDelete(bot.bot_id)}
                        className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    )
}
