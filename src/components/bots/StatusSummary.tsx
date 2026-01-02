import { Bot } from '@/types/database'

export function StatusSummary({ bots }: { bots: Bot[] }) {
    const total = bots.length
    const operational = bots.filter(b => b.status === 'operativo').length
    const observation = bots.filter(b => b.status === 'observacion').length
    const down = bots.filter(b => b.status === 'caido').length

    const cards = [
        { label: 'Total Bots', value: total, color: 'text-white', bg: 'bg-white/5' },
        { label: 'Operativos', value: operational, color: 'text-green-400', bg: 'bg-green-500/10' },
        { label: 'En Observación', value: observation, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        { label: 'Caídos', value: down, color: 'text-red-400', bg: 'bg-red-500/10' },
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {cards.map(card => (
                <div key={card.label} className={`rounded-xl p-4 border border-white/5 backdrop-blur-sm ${card.bg}`}>
                    <p className="text-gray-400 text-sm mb-1">{card.label}</p>
                    <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                </div>
            ))}
        </div>
    )
}
