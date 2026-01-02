import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const outfit = Outfit({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vortex News | Plataforma Informativa',
  description: 'Plataforma de noticias y monitoreo de bots',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${outfit.className} bg-dark text-white min-h-screen relative overflow-x-hidden`}>
        <AuthProvider>
          <div className="orb orb-1 fixed top-[-50px] left-[-50px] w-[500px] h-[500px] bg-primary-600/30 rounded-full blur-[100px] pointer-events-none animate-float z-0" />
          <div className="orb orb-2 fixed bottom-[-50px] right-[-50px] w-[400px] h-[400px] bg-purple-600/30 rounded-full blur-[100px] pointer-events-none animate-float z-0" style={{ animationDelay: '2s' }} />
          <main className="relative z-10">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
