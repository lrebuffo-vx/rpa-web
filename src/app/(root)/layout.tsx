import { Navbar } from '@/components/ui/Navbar'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen relative flex flex-col">
            <Navbar />
            <div className="flex-1 w-[95%] max-w-7xl mx-auto px-4 pb-8">
                {children}
            </div>
        </div>
    )
}
