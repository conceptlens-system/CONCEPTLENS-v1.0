"use client"

import { Button } from "@/components/ui/button"
import { Activity, AlertCircle, BookOpen, CheckCircle2, Building, Users, User, GraduationCap, ClipboardList, BarChart3, LogOut, Mail, FileText } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
// @ts-ignore
import { signOut, useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { fetchNotifications } from "@/lib/api"

interface SidebarProps {
    className?: string
    onLinkClick?: () => void
}

export function Sidebar({ className, onLinkClick }: SidebarProps) {
    const pathname = usePathname()
    const { data: session } = useSession()
    const isAdmin = pathname?.startsWith("/admin")
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        if (!session?.user) return

        // Only fetch for relevant roles if needed, or just try fetching
        // Assuming fetchNotifications handles role checks or returns []
        const load = async () => {
            try {
                const token = (session.user as any).accessToken
                if (!token) return
                const notes = await fetchNotifications(token)
                // Use correct property 'is_read'
                const unread = notes.filter((n: any) => !n.is_read).length
                setUnreadCount(unread)
            } catch (e) {
                // Squelch error for sidebar
            }
        }

        load()
        // Poll every minute? Or just on mount. mount is safer for now.
        const interval = setInterval(load, 60000)
        return () => clearInterval(interval)
    }, [session])

    const adminLinks = [
        { href: "/admin", label: "Overview", icon: Activity },
        { href: "/admin/institutions", label: "Institutions", icon: Building },
        { href: "/admin/professors", label: "Professors", icon: Users },
        { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
        { href: "/admin/settings", label: "Settings", icon: CheckCircle2 },
    ]

    const professorLinks = [
        { href: "/professor", label: "Home", icon: Activity },
        { href: "/professor/curriculum", label: "Curriculum", icon: BookOpen },
        { href: "/professor/exams", label: "Exams", icon: ClipboardList },
        { href: "/professor/assessments", label: "Assessments", icon: FileText },
        { href: "/professor/misconceptions", label: "Misconceptions", icon: AlertCircle },
        { href: "/professor/inbox", label: "Inbox", icon: Mail, badge: unreadCount }, // Add badge here
        { href: "/professor/classes", label: "My Classes", icon: Users },
        { href: "/professor/profile", label: "My Profile", icon: User },
        { href: "/professor/reports", label: "Reports", icon: BarChart3 },
    ]

    const studentLinks = [
        { href: "/student", label: "Home", icon: Activity },
        { href: "/student/classes", label: "My Classes", icon: BookOpen },
        { href: "/student/exams", label: "My Exams", icon: ClipboardList },
        { href: "/student/inbox", label: "Inbox", icon: Mail, badge: unreadCount },
        { href: "/student/profile", label: "Profile", icon: Users },
    ]

    const isStudent = pathname?.startsWith("/student")
    const links = isAdmin ? adminLinks : isStudent ? studentLinks : professorLinks

    return (
        <div className={cn("hidden w-64 flex-col border-r bg-white p-6 md:flex h-screen sticky top-0", className)}>
            <div className="flex items-center gap-2 font-bold text-xl mb-8 text-slate-900">
                <div className="h-8 w-8 rounded-lg bg-black text-white flex items-center justify-center">C</div>
                CONCEPTLENS
            </div>
            <nav className="space-y-1">
                {links.map((link) => (
                    <Button
                        key={link.href}
                        variant={pathname === link.href ? "secondary" : "ghost"}
                        className={cn(
                            "w-full justify-start transition-all duration-200 ease-in-out hover:translate-x-1 relative",
                            pathname === link.href && "font-semibold bg-indigo-50 text-indigo-700 shadow-sm border-r-4 border-indigo-600 rounded-r-none"
                        )}
                        asChild
                        onClick={() => {
                            if (link.href === "/professor/inbox" || link.href === "/student/inbox") setUnreadCount(0);
                            onLinkClick?.();
                        }}
                    >
                        <Link href={link.href} className="flex items-center w-full">
                            <div className="flex items-center flex-1">
                                <link.icon className={cn("mr-2 h-4 w-4 transition-colors", pathname === link.href ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-600")} />
                                {link.label}
                            </div>
                            {(link as any).badge > 0 && (
                                <span className="bg-slate-900 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full ml-2">
                                    {(link as any).badge}
                                </span>
                            )}
                        </Link>
                    </Button>
                ))}
            </nav>

            <div className="mt-auto pt-8 border-t border-slate-100">
                <Button variant="ghost" className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors" onClick={() => signOut({ callbackUrl: "/login" })}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
            </div>
        </div>
    )
}
