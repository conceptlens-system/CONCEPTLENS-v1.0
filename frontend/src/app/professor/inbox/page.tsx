"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Loader2, Bell, CheckCircle, Filter, X } from "lucide-react"

export default function InboxPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const [notifications, setNotifications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [dateFilter, setDateFilter] = useState("")

    useEffect(() => {
        const token = (session?.user as any)?.accessToken
        if (token) {
            loadNotifications(token)
        } else {
            setLoading(false)
        }
    }, [session])

    const loadNotifications = async (token: string) => {
        try {
            const data = await fetchNotifications(token)
            setNotifications(data)

            // Mark all as read immediately
            // ... (keep logic)
            const unread = data.some((n: any) => !n.is_read)
            if (unread) {
                await markAllNotificationsRead(token)
                // Update local state to reflect read status
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    // ... (keep handlers)

    const handleRead = async (id: string, link: string) => {
        const token = (session?.user as any)?.accessToken
        if (!token) return

        try {
            await markNotificationRead(id, token)
            // Update local state
            setNotifications(notifications.map(n => n._id === id ? { ...n, is_read: true } : n))
            if (link && link !== "#") {
                router.push(link)
            }
        } catch (error) {
            console.error(error)
        }
    }

    // Simple filter
    const filteredNotifications = notifications.filter(n => {
        if (!dateFilter) return true
        return n.created_at && n.created_at.startsWith(dateFilter)
    })

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin" /></div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
                    <p className="text-slate-500">Manage your notifications and requests.</p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 bg-white p-1 rounded-md border shadow-sm">
                    <Filter className="h-4 w-4 text-slate-400 ml-2" />
                    <Input
                        type="date"
                        className="border-0 focus-visible:ring-0 h-9 w-fit"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                    />
                    {dateFilter && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 mr-1 rounded-full hover:bg-slate-100"
                            onClick={() => setDateFilter("")}
                        >
                            <X className="h-3 w-3 text-slate-500" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center h-48 text-slate-500">
                            <Bell className="h-8 w-8 mb-2 opacity-50" />
                            <p>No new notifications</p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredNotifications.map((n) => (
                        <Card key={n._id}
                            className={`cursor-pointer transition-colors hover:bg-slate-50 ${!n.is_read ? 'border-l-4 border-l-blue-500' : ''}`}
                            onClick={() => handleRead(n._id, n.link)}
                        >
                            <CardContent className="p-4 flex items-start gap-4">
                                <div className={`p-2 rounded-full ${!n.is_read ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                    <Bell className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                    <h4 className={`text-sm font-medium ${!n.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                                        {n.title}
                                    </h4>
                                    <p className="text-sm text-slate-500 line-clamp-1">{n.message}</p>
                                    <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                                </div>
                                {!n.is_read && (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">New</Badge>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
