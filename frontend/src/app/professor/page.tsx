"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, Clock, Plus, AlertCircle, BarChart3, Mail, Bell, CheckCircle2, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { fetchExams, fetchClasses, fetchMisconceptions, fetchNotifications, fetchAssessmentSummaries } from "@/lib/api"
import { format } from "date-fns"
import { PageTransition } from "@/components/PageTransition"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProfessorDashboard() {
    const { data: session, status } = useSession()
    const [stats, setStats] = useState({
        activeClasses: 0,
        upcomingExams: 0,
        nextExam: null as any,
        pendingMisconceptions: 0
    })
    const [notifications, setNotifications] = useState<any[]>([])
    const [performanceData, setPerformanceData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (status === "loading") return;

        const loadStats = async () => {
            try {
                const token = (session?.user as any)?.accessToken;
                if (!token) {
                    setLoading(false);
                    return;
                }

                // Fetch core data
                const [exams, classes, pending, notifs, assessments] = await Promise.all([
                    fetchExams(token),
                    fetchClasses(token),
                    fetchMisconceptions("pending"),
                    fetchNotifications(token),
                    fetchAssessmentSummaries(token)
                ])

                const upcoming = exams.filter((e: any) => new Date(e.schedule_start) > new Date())

                // Process chart data (Average score per assessment)
                // Limit to last 5 assessments to keep chart clean
                const chartData = assessments
                    .slice(0, 5)
                    .map((a: any) => ({
                        name: a.title.length > 15 ? a.title.substring(0, 15) + '...' : a.title,
                        score: a.avg_score || 0
                    }))

                setStats({
                    activeClasses: classes.length,
                    upcomingExams: upcoming.length,
                    nextExam: upcoming.sort((a: any, b: any) => new Date(a.schedule_start).getTime() - new Date(b.schedule_start).getTime())[0],
                    pendingMisconceptions: pending.length
                })
                setNotifications(notifs.slice(0, 5)) // Top 5 stats
                setPerformanceData(chartData)

            } catch (e) {
                console.error("Failed to load dashboard stats", e)
            } finally {
                setLoading(false)
            }
        }
        loadStats()
    }, [session, status])

    return (
        <PageTransition className="space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Professor Portal</h1>
                    <p className="text-slate-500 mt-1">Overview of your teaching activities and student progress.</p>
                </div>
                <div className="text-right text-sm text-slate-500">
                    <p>{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
                </div>
            </header>

            {/* Top Stats Row */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    title="Active Classes"
                    icon={Users}
                    value={stats.activeClasses}
                    subtext="Real classes only"
                    color="text-slate-500"
                />
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Upcoming Exams</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        {stats.upcomingExams > 0 ? (
                            <>
                                <div className="text-2xl font-bold text-slate-900">{stats.upcomingExams}</div>
                                <p className="text-xs text-slate-500 mt-1">
                                    Next: {stats.nextExam ? format(new Date(stats.nextExam.schedule_start), 'MMM d, h:mm a') : '-'}
                                </p>
                            </>
                        ) : (
                            <div className="text-sm text-slate-400 mt-2">No exams scheduled</div>
                        )}
                    </CardContent>
                </Card>
                <StatCard
                    title="Pending Validations"
                    icon={AlertCircle}
                    value={stats.pendingMisconceptions}
                    subtext="Misconceptions to review"
                    color="text-amber-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Quick Actions & Chart */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Quick Actions */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-slate-800 flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-indigo-600" /> Quick Actions
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <DashboardActionCard
                                href="/professor/exams/create"
                                title="Create Exam"
                                description="Set up a new assessment"
                                icon={Plus}
                                color="text-indigo-600"
                                bgColor="bg-indigo-50"
                            />
                            <DashboardActionCard
                                href="/professor/reports"
                                title="View Reports"
                                description="Analyze student performance"
                                icon={BarChart3}
                                color="text-emerald-600"
                                bgColor="bg-emerald-50"
                            />
                            <DashboardActionCard
                                href="/professor/classes"
                                title="Manage Classes"
                                description="View students and rosters"
                                icon={Users}
                                color="text-blue-600"
                                bgColor="bg-blue-50"
                            />
                            <DashboardActionCard
                                href="/professor/inbox"
                                title="Check Inbox"
                                description="Review notifications"
                                icon={Mail}
                                color="text-amber-600"
                                bgColor="bg-amber-50"
                            />
                        </div>
                    </section>

                    {/* Performance Chart */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-slate-800 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-emerald-600" /> Recent Assessment Performance
                        </h2>
                        <Card>
                            <CardContent className="pt-6 h-[300px]">
                                {performanceData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={performanceData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 12 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 12 }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#f1f5f9' }}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="score" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400">
                                        No assessment data available yet
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </section>
                </div>

                {/* Right Column: Recent Activity */}
                <div className="lg:col-span-1">
                    <section className="h-full">
                        <h2 className="text-xl font-semibold mb-4 text-slate-800 flex items-center gap-2">
                            <Bell className="h-5 w-5 text-amber-500" /> Recent Activity
                        </h2>
                        <Card className="h-auto min-h-[500px]">
                            <CardContent className="p-0">
                                {notifications.length > 0 ? (
                                    <div className="divide-y divide-slate-100">
                                        {notifications.map((n, i) => (
                                            <div key={i} className="p-4 hover:bg-slate-50 transition-colors flex gap-3 items-start group cursor-pointer" onClick={() => window.location.href = '/professor/inbox'}>
                                                <div className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                                                        {n.message}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {n.created_at ? format(new Date(n.created_at), 'MMM d, h:mm a') : 'Just now'}
                                                    </p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        ))}
                                        <div className="p-4 border-t border-slate-100">
                                            <Link href="/professor/inbox" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center justify-center w-full">
                                                View all notifications
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-slate-500">
                                        <CheckCircle2 className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                                        <p>All caught up!</p>
                                        <p className="text-xs mt-1 text-slate-400">No new recent activity</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </div>
        </PageTransition>
    )
}

function StatCard({ title, icon: Icon, value, subtext, color }: any) {
    return (
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-900">{value}</div>
                <p className="text-xs text-slate-500 mt-1">{subtext}</p>
            </CardContent>
        </Card>
    )
}

function DashboardActionCard({ href, title, description, icon: Icon, color, bgColor }: any) {
    return (
        <Link href={href}>
            <Card className="hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer h-full border-slate-200 group">
                <CardContent className="p-6 flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${bgColor} ${color} group-hover:scale-110 transition-transform`}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">{title}</h3>
                        <p className="text-sm text-slate-500 mt-1">{description}</p>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
