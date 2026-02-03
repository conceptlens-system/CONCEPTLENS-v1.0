"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { fetchTrends } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, TrendingUp, CheckCircle, BrainCircuit, LineChart } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function ProfessorReportsPage() {
    const { data: session } = useSession()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!session?.user) return
        const load = async () => {
            try {
                const token = (session.user as any).accessToken
                const res = await fetchTrends(token)
                setData(res)
            } catch (e: any) {
                console.error(e)
                setError(e.message || "Failed to fetch report data")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [session])

    if (loading) return <div className="p-12 text-center text-slate-500">Generating analytics...</div>

    if (error) return (
        <div className="p-12 text-center max-w-2xl mx-auto mt-10 border-2 border-dashed rounded-lg border-red-200 bg-red-50">
            <div className="bg-white p-4 rounded-full inline-block mb-4 shadow-sm">
                <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-red-900">Failed to Load Report</h2>
            <p className="text-red-700/80 mt-2">{error}</p>
        </div>
    )

    if (!data || !data.matrix || data.matrix.length === 0) return (
        <div className="p-12 text-center max-w-2xl mx-auto mt-10 border-2 border-dashed rounded-lg border-slate-200">
            <div className="bg-slate-50 p-4 rounded-full inline-block mb-4">
                <LineChart className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Insufficient Data for Trends</h2>
            <p className="text-slate-500 mt-2">
                Reports require multiple exams and validated misconceptions to detect patterns over time.
                Check back after conducting more assessments.
            </p>
        </div>
    )

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                    <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Learning Trends Report</h1>
                    <p className="text-slate-500">Longitudinal analysis of student misconceptions across exams.</p>
                </div>
            </div>

            {/* AI Insight Banner */}
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
                <div className="p-6 flex gap-4">
                    <div className="bg-white p-3 rounded-full shadow-sm h-fit">
                        <BrainCircuit className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-indigo-900 text-lg mb-1">AI Trend Summary</h3>
                        <p className="text-indigo-800/80 leading-relaxed max-w-3xl">
                            {data.summary}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Matrix Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-bold text-slate-700">Topic Performance Matrix</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                            <tr>
                                <th className="p-4 min-w-[200px]">Topic</th>
                                <th className="p-4">Trend Status</th>
                                {data.exams.map((exam: any) => (
                                    <th key={exam.id} className="p-4 text-center min-w-[120px]">{exam.title}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {data.matrix.map((row: any) => (
                                <tr key={row.topic} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-medium text-slate-800">{row.topic}</td>
                                    <td className="p-4">
                                        <Badge variant="outline" className={`
                                            ${row.trend === 'improving' ? 'text-green-600 bg-green-50 border-green-200' : ''}
                                            ${row.trend === 'worsening' ? 'text-red-600 bg-red-50 border-red-200' : ''}
                                            ${row.trend === 'stable' ? 'text-amber-600 bg-amber-50 border-amber-200' : ''}
                                        `}>
                                            {row.trend.charAt(0).toUpperCase() + row.trend.slice(1)}
                                        </Badge>
                                    </td>
                                    {row.history.map((cell: any) => (
                                        <td key={cell.exam_id} className="p-4 text-center">
                                            {cell.status === 'clean' && (
                                                <div className="flex justify-center" title="No issues detected">
                                                    <CheckCircle className="h-5 w-5 text-green-400/50" />
                                                </div>
                                            )}
                                            {cell.status === 'issue' && (
                                                <div className="flex flex-col items-center gap-1">
                                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                                    <span className="text-[10px] text-amber-600 font-bold">{cell.count} Issues</span>
                                                </div>
                                            )}
                                            {cell.status === 'critical' && (
                                                <div className="flex flex-col items-center gap-1">
                                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                                    <span className="text-[10px] text-red-600 font-bold">{cell.count} Critical</span>
                                                </div>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    )
}
