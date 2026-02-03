"use client"

import { Sidebar } from "@/components/Sidebar"
import { MobileNav } from "@/components/MobileNav"

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50/50">
            <MobileNav />
            <div className="flex">
                <Sidebar />
                <div className="flex-1 p-4 md:p-8 space-y-8">
                    {children}
                </div>
            </div>
        </div>
    )
}
