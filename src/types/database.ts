export interface User {
    id: string
    email: string | null
    role: 'admin' | 'user'
    created_at: string
}

export interface News {
    news_id: number
    title: string
    content: string
    image_url: string | null
    category: 'Bots' | 'Incidentes' | 'Mejoras' | 'Release' | 'Comunicados'
    tags: string[]
    is_featured: boolean
    priority: number
    published_at: string
    author_id: string | null
    created_at: string
}

export interface Bot {
    bot_id: number
    name: string
    description: string | null
    system: string
    environment: 'Producción' | 'Desarrollo' | 'QA'
    client: string
    status: 'operativo' | 'observacion' | 'caido'
    responsible_name: string | null
    responsible_email: string | null
    created_at: string
    updated_at: string
}

export interface Incident {
    incident_id: number
    bot_id: number
    title: string
    description: string | null
    impact: 'Bajo' | 'Medio' | 'Alto' | 'Crítico'
    status: 'Abierto' | 'En Progreso' | 'Resuelto' | 'Cerrado'
    root_cause: string | null
    resolution: string | null
    lessons_learned: string | null
    reported_at: string
    resolved_at: string | null
    created_at: string
}

export interface Subscription {
    subscription_id: number
    user_id: string
    subscription_type: ('news' | 'bot_status' | 'incidents')[]
    news_categories: string[]
    push_subscription: any
    created_at: string
    updated_at: string
}
