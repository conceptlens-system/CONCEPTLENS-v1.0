"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"
import { fetchGroupedMisconceptions } from "@/lib/api"
import { useSession } from "next-auth/react"
import { ChevronDown, ChevronUp, AlertTriangle, Users, BookOpen, Calendar, HelpCircle, BrainCircuit, Sparkles } from "lucide-react"
import { format } from "date-fns"

export default function MisconceptionsPage() {
    const { data: session } = useSession()
    const [groupedData, setGroupedData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedExam, setExpandedExam] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [statusFilter, setStatusFilter] = useState<string>("pending")

    useEffect(() => {
        if (!session?.user) return

        const load = async () => {
            setLoading(true)
            try {
                const token = (session.user as any).accessToken
                const data = await fetchGroupedMisconceptions(statusFilter, token)
                setGroupedData(data)
                // Auto-expand removed per user request
            } catch (e: any) {
                console.error(e)
                setError(e.message || "Failed to load data")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [session, statusFilter])

    const toggleExpand = (id: string) => {
        setExpandedExam(expandedExam === id ? null : id)
    }

    if (error) return (
        <div className="p-8 text-center text-red-500 bg-red-50 border border-red-200 rounded-lg m-6">
            <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
            <h3 className="font-bold">Error Loading Misconceptions</h3>
            <p>{error}</p>
            <p className="text-sm mt-4 text-slate-600">Please ensure the backend server is running and updated.</p>
        </div>
    )

    return (
        <div className="space-y-8 max-w-5xl mx-auto p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <BrainCircuit className="h-8 w-8 text-indigo-600" />
                        Misconceptions Library
                    </h1>
                    <p className="text-slate-500 mt-2">AI-detected learning gaps grouped by assessment.</p>
                </div>

                {/* Status Filter Tabs */}
                <div className="bg-slate-100 p-1 rounded-lg inline-flex">
                    {["pending", "valid", "all"].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all capitalize ${statusFilter === s
                                    ? "bg-white text-indigo-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            {s === "valid" ? "Validated" : s}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center text-slate-400 animate-pulse">Loading insights...</div>
            ) : groupedData.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed rounded-lg text-slate-400 bg-slate-50">
                    <AlertTriangle className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <p>No {statusFilter === "all" ? "" : statusFilter} misconceptions found.</p>
                    <p className="text-sm mt-2">Wait for students to take exams or for the demo threshold to trigger.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {groupedData.map((group) => (
                        <Card key={group.exam_id} className={`transition-all duration-300 border-l-4 ${expandedExam === group.exam_id ? 'border-l-indigo-500 shadow-md ring-1 ring-slate-200' : 'border-l-slate-200 hover:border-l-indigo-300'}`}>
                            <div className="p-6 cursor-pointer" onClick={() => toggleExpand(group.exam_id)}>
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-xl font-bold text-slate-900">{group.exam_title}</h3>
                                            <Badge variant="secondary" className="font-normal text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                                                {group.misconception_count} Issues Detected
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-6 text-sm text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <BookOpen className="h-4 w-4" />
                                                <span>{group.subject_id}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                <span>{group.student_count} Attempted</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                <span>{group.created_at ? format(new Date(group.created_at), "MMM d, yyyy") : "N/A"}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon">
                                        {expandedExam === group.exam_id ? <ChevronUp /> : <ChevronDown />}
                                    </Button>
                                </div>

                                {/* Impact Summary Preview (Always visible if expanded, or snippet if collapsed? No, keep inside expansion for clean list) */}
                            </div>

                            {expandedExam === group.exam_id && (
                                <div className="border-t bg-slate-50/50 p-6 animate-in slide-in-from-top-2 duration-200 space-y-4">
                                    {/* Impact Summary Block */}
                                    {group.impact_summary && (
                                        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100 flex gap-3 text-sm text-indigo-900">
                                            <Sparkles className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <span className="font-semibold block mb-1">AI Insight Summary</span>
                                                {group.impact_summary}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid gap-3">
                                        {group.misconceptions.map((m: any) => (
                                            <div key={m.id} className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-4 justify-between items-start md:items-center group">
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className={`
                                                              ${(m.confidence_score || 0) > 0.7 ? 'border-green-200 text-green-700 bg-green-50' : 'border-amber-200 text-amber-700 bg-amber-50'}
                                                          `}>
                                                            {((m.confidence_score || 0) * 100).toFixed(0)}% Confidence
                                                        </Badge>
                                                        {/* Concept Chain Breadcrumbs */}
                                                        {m.concept_chain && (
                                                            <div className="flex items-center text-xs text-slate-400 font-medium">
                                                                {m.concept_chain.join(" › ")}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <p className="font-semibold text-slate-800 text-lg">
                                                        {m.cluster_label.replace("Misconception similar to:", "Observed Pattern:").replace("Potential misconception:", "Observed Pattern:")}
                                                    </p>

                                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                                        <HelpCircle className="h-4 w-4" />
                                                        <span className="italic line-clamp-1">{m.question_text.substring(0, 80)}...</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-2 min-w-[140px]">
                                                    <div className="text-center bg-slate-100 rounded px-2 py-1 min-w-[3rem]">
                                                        <div className="text-xl font-bold text-slate-900">{m.student_count}</div>
                                                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Students</div>
                                                    </div>
                                                    <Button size="sm" variant="default" className="w-full opacity-90 group-hover:opacity-100 transition-opacity" asChild>
                                                        <Link href={`/professor/misconceptions/${m.id}`}>View Analysis</Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
