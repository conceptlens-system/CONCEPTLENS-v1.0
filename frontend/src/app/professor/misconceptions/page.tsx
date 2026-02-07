"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState, useMemo } from "react"
import { fetchGroupedMisconceptions } from "@/lib/api"
import { useSession } from "next-auth/react"
import { ChevronRight, AlertTriangle, Users, BookOpen, Calendar, HelpCircle, BrainCircuit, Sparkles, TrendingUp, Filter, Search, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { motion, AnimatePresence } from "framer-motion"

export default function MisconceptionsPage() {
    const { data: session } = useSession()
    const [groupedData, setGroupedData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [statusFilter, setStatusFilter] = useState<string>("pending")
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        if (!session?.user) return

        const load = async () => {
            setLoading(true)
            try {
                const token = (session.user as any).accessToken
                const data = await fetchGroupedMisconceptions(statusFilter, token)
                setGroupedData(data)
            } catch (e: any) {
                console.error(e)
                setError(e.message || "Failed to load data")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [session, statusFilter])

    // --- Analytics Derived Data ---
    const stats = useMemo(() => {
        let totalIssues = 0
        let criticalIssues = 0 // Confidence > 80%
        let affectedStudents = 0
        const topicCounts: Record<string, number> = {}

        groupedData.forEach(group => {
            totalIssues += group.misconception_count
            affectedStudents += group.student_count // Approximate

            // Topic Distribution
            const subject = group.subject_id || "Uncategorized"
            topicCounts[subject] = (topicCounts[subject] || 0) + group.misconception_count

            // Criticality from misconceptions list
            group.misconceptions.forEach((m: any) => {
                if ((m.confidence_score || 0) > 0.8) criticalIssues++
            })
        })

        const topicData = Object.entries(topicCounts).map(([name, value]) => ({ name, value }))

        return { totalIssues, criticalIssues, affectedStudents, topicData }
    }, [groupedData])

    // Severity Data for Pie Chart
    const severityData = useMemo(() => {
        let high = 0, medium = 0, low = 0
        groupedData.forEach(group => {
            group.misconceptions.forEach((m: any) => {
                const s = m.confidence_score || 0
                if (s > 0.7) high++
                else if (s > 0.4) medium++
                else low++
            })
        })
        return [
            { name: 'High Confidence', value: high, color: '#4f46e5' }, // Indigo 600
            { name: 'Medium Confidence', value: medium, color: '#f59e0b' }, // Amber 500
            { name: 'Low Confidence', value: low, color: '#94a3b8' }, // Slate 400
        ].filter(d => d.value > 0)
    }, [groupedData])

    const filteredGroups = groupedData.filter(g =>
        g.exam_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.subject_id.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (error) return (
        <div className="p-8 text-center text-red-500 bg-red-50 border border-red-200 rounded-lg m-6">
            <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
            <h3 className="font-bold">Error Loading Insights</h3>
            <p>{error}</p>
        </div>
    )

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-6 min-h-screen bg-slate-50/50">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200">
                            <BrainCircuit className="h-8 w-8 text-white" />
                        </div>
                        Insight Dashboard
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">AI-powered analysis of student learning gaps and misconceptions.</p>
                </div>

                <div className="flex bg-white p-1.5 rounded-xl border shadow-sm">
                    {["pending", "valid", "all"].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all capitalize ${statusFilter === s
                                ? "bg-indigo-600 text-white shadow-md"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                }`}
                        >
                            {s === "valid" ? "Validated" : s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Overview */}
            {!loading && groupedData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <BrainCircuit className="h-32 w-32" />
                            </div>
                            <CardContent className="p-6 relative z-10">
                                <p className="text-indigo-100 font-medium mb-1">Total Issues Detected</p>
                                <h3 className="text-4xl font-bold">{stats.totalIssues}</h3>
                                <div className="mt-4 flex items-center gap-2 text-sm text-indigo-100/80 bg-white/10 w-fit px-2 py-1 rounded-full">
                                    <TrendingUp className="h-4 w-4" />
                                    <span>Across {groupedData.length} Assessments</span>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Card className="border-none shadow-lg bg-white relative overflow-hidden group hover:shadow-xl transition-shadow">
                            <div className="absolute top-0 right-0 w-1 bg-amber-500 h-full"></div>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-slate-500 font-medium mb-1">Critical Alerts</p>
                                        <h3 className="text-4xl font-bold text-slate-900">{stats.criticalIssues}</h3>
                                    </div>
                                    <div className="p-3 bg-amber-50 rounded-full">
                                        <AlertTriangle className="h-6 w-6 text-amber-500" />
                                    </div>
                                </div>
                                <p className="mt-4 text-sm text-slate-500">High confidence detections requiring immediate attention.</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Card className="border-none shadow-lg bg-white relative overflow-hidden group hover:shadow-xl transition-shadow">
                            <div className="absolute top-0 right-0 w-1 bg-blue-500 h-full"></div>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-slate-500 font-medium mb-1">Students Impacted</p>
                                        <h3 className="text-4xl font-bold text-slate-900">{stats.affectedStudents}</h3>
                                    </div>
                                    <div className="p-3 bg-blue-50 rounded-full">
                                        <Users className="h-6 w-6 text-blue-500" />
                                    </div>
                                </div>
                                <p className="mt-4 text-sm text-slate-500">Total students showing signs of these misconceptions.</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            )}

            {/* Charts Section */}
            {!loading && groupedData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <motion.div className="lg:col-span-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                        <Card className="h-full border-slate-100 shadow-md">
                            <CardHeader>
                                <CardTitle>Topic Distribution</CardTitle>
                                <CardDescription>Where misconceptions are clustering</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.topicData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ fill: '#f8fafc' }}
                                        />
                                        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                        <Card className="h-full border-slate-100 shadow-md">
                            <CardHeader>
                                <CardTitle>Confidence Breakdown</CardTitle>
                                <CardDescription>AI Model Certainty</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={severityData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {severityData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            )}

            {/* List Header & Search */}
            <div className="flex items-center justify-between pt-4">
                <h2 className="text-xl font-bold text-slate-800">Recent Detections</h2>
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                        placeholder="Search exams or subjects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="h-64 animate-pulse bg-slate-100 border-none"></Card>
                    ))}
                </div>
            ) : filteredGroups.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Sparkles className="h-10 w-10 text-indigo-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">All Clear!</h3>
                    <p className="text-slate-500 mt-2 max-w-sm mx-auto">No misconceptions found matching your filters. Keep up the great teaching!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredGroups.map((group, index) => (
                            <motion.div
                                key={group.exam_id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                layout
                            >
                                <Card className="hover:shadow-xl transition-all duration-300 border-slate-200 group h-full flex flex-col">
                                    <CardHeader>
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100">
                                                {group.subject_id}
                                            </Badge>
                                            <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                                {format(new Date(group.created_at), "MMM d")}
                                            </span>
                                        </div>
                                        <CardTitle className="line-clamp-1 text-lg group-hover:text-indigo-600 transition-colors">
                                            {group.exam_title}
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-2">
                                            <span>{group.student_count} Students</span>
                                            <span>•</span>
                                            <span>{group.misconception_count} Issues</span>
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="flex-1 space-y-4">
                                        {/* Impact Summary Snippet */}
                                        {group.impact_summary && (
                                            <div className="bg-slate-50 p-3 rounded-lg text-xs leading-relaxed text-slate-600 border border-slate-100">
                                                <Sparkles className="h-3 w-3 text-indigo-500 inline mr-1" />
                                                <span className="font-medium text-slate-800">AI Insight:</span> {group.impact_summary}
                                            </div>
                                        )}

                                        {/* Preview of first misconception */}
                                        <div className="space-y-2">
                                            {group.misconceptions.slice(0, 2).map((m: any) => (
                                                <div key={m.id} className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${(m.confidence_score || 0) > 0.7 ? 'bg-red-500' : 'bg-amber-400'}`} />
                                                    <span className="line-clamp-1 text-slate-600 group-hover/item:text-slate-900">
                                                        {m.cluster_label.replace(/Misconception similar to:|Potential misconception:/i, "").trim()}
                                                    </span>
                                                </div>
                                            ))}
                                            {group.misconceptions.length > 2 && (
                                                <p className="text-xs text-center text-slate-400 font-medium pt-1">
                                                    +{group.misconceptions.length - 2} more detected
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>

                                    <div className="p-6 pt-0 mt-auto">
                                        <Button className="w-full group/btn bg-white text-slate-900 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 shadow-sm" asChild>
                                            <Link href={`/professor/misconceptions/${group.misconceptions[0]?.id}?group=${group.exam_id}`}>
                                                <span>Deep Dive Details</span>
                                                <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                            </Link>
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
