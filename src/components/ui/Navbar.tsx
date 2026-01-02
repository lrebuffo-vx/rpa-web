'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { Bell, LogOut, Newspaper, LibraryBig, LayoutDashboard } from 'lucide-react'
import { useState } from 'react'
// import { SubscriptionModal } from '@/components/notifications/SubscriptionModal'
// import { useNotifications } from '@/hooks/useNotifications'

export function Navbar() {
    const pathname = usePathname()
    const { user, signOut } = useAuth()
    // const { permission, requestPermission } = useNotifications()
    // const [isSubsOpen, setIsSubsOpen] = useState(false)

    const links = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        // { href: '/news', label: 'Noticias', icon: Newspaper },
        // { href: '/bots', label: 'Bots', icon: LibraryBig },
    ]

    /* const handleOpenSubs = async () => {
        if (permission === 'default') {
            const result = await requestPermission()
            if (result === 'granted') {
                setIsSubsOpen(true)
            }
        } else {
            setIsSubsOpen(true)
        }
    } */

    return (
        <>
            <nav className="sticky top-4 z-40 mx-auto w-[95%] max-w-7xl rounded-2xl border border-glass-border bg-glass-bg backdrop-blur-md px-4 py-3 shadow-lg mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="text-xl font-bold bg-gradient-to-b from-orange-400 to-red-400 bg-clip-text text-transparent">
                            Vortex RPA
                        </Link>

                        <div className="hidden md:flex items-center gap-1">
                            {links.map(({ href, label, icon: Icon }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                        pathname.startsWith(href)
                                            ? "bg-primary-600/20 text-primary-200 border border-primary-500/30"
                                            : "text-gray-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* <button
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors relative"
                            title="Suscripciones"
                            onClick={handleOpenSubs}
                        >
                            <Bell className="h-5 w-5" />
                            {permission === 'granted' && (
                                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-green-500"></span>
                            )}
                            {permission === 'denied' && (
                                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500"></span>
                            )}
                        </button> */}

                        <div className="hidden md:flex flex-col items-end mr-2">
                            <span className="text-sm font-medium text-white">
                                {user?.email?.split('@')[0]}
                            </span>
                            <span className="text-xs text-primary-400 uppercase tracking-wider font-bold">
                                {user?.role || 'Guest'}
                            </span>
                        </div>

                        <button
                            onClick={() => signOut()}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline">Salir</span>
                        </button>
                    </div>
                </div>
            </nav>
            {/* <SubscriptionModal isOpen={isSubsOpen} onClose={() => setIsSubsOpen(false)} /> */}
        </>
    )
}
