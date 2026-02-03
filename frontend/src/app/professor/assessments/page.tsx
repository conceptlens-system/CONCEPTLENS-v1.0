"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { fetchAssessmentSummaries, fetchExamStudents, fetchSubjects } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Users, LayoutGrid, List as ListIcon, Loader2, Eye, FileText, Filter, X, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AssessmentsPage() {
    const { data: session } = useSession()
    const [assessments, setAssessments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

    // Filters
    const [subjects, setSubjects] = useState<Record<string, string>>({})
    const [subjectFilter, setSubjectFilter] = useState("all")
    const [dateFilter, setDateFilter] = useState("")

    // Student List Dialog State
    const [selectedExam, setSelectedExam] = useState<string | null>(null)
    const [students, setStudents] = useState<any[]>([])
    const [loadingStudents, setLoadingStudents] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    useEffect(() => {
        if (!session?.user) return
        const load = async () => {
            try {
                const token = (session.user as any).accessToken
                const [assessmentsData, subjectsData] = await Promise.all([
                    fetchAssessmentSummaries(token),
                    fetchSubjects(token)
                ])
                setAssessments(assessmentsData)

                // Map subjects
                const sMap: Record<string, string> = {}
                subjectsData.forEach((s: any) => { sMap[s._id] = s.name })
                setSubjects(sMap)
            } catch (e) {
                toast.error("Failed to load assessments")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [session])

    const handleViewStudents = async (examId: string) => {
        // ... (keep existing)
        setSelectedExam(examId)
        setIsDialogOpen(true)
        setLoadingStudents(true)
        try {
            const token = (session?.user as any)?.accessToken
            const data = await fetchExamStudents(examId, token)
            setStudents(data)
        } catch (e) {
            toast.error("Failed to load student list")
            setStudents([])
        } finally {
            setLoadingStudents(false)
        }
    }

    const filteredAssessments = assessments.filter(a => {
        const matchesSubject = subjectFilter === "all" || a.subject_id === subjectFilter
        // Simple date string match (YYYY-MM-DD in ISO string)
        const matchesDate = !dateFilter || (a.created_at && a.created_at.startsWith(dateFilter))
        return matchesSubject && matchesDate
    })

    if (loading) return <div className="p-8">Loading Assessments...</div>

    return (
        <div className="flex-1 p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Assessments</h1>
                    <p className="text-slate-500">Overview of student performance per exam.</p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    {/* Filters */}
                    <div className="flex items-center gap-2 bg-white p-1 rounded-md border shadow-sm">
                        <Filter className="h-4 w-4 text-slate-400 ml-2" />
                        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                            <SelectTrigger className="w-[140px] border-0 focus:ring-0 h-8 text-xs">
                                <SelectValue placeholder="Subject" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Subjects</SelectItem>
                                {Object.entries(subjects).map(([id, name]) => (
                                    <SelectItem key={id} value={id}>{name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="h-4 w-[1px] bg-slate-200" />
                        <Input
                            type="date"
                            className="border-0 focus-visible:ring-0 h-8 w-fit text-xs"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                        {(subjectFilter !== "all" || dateFilter) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 mr-1 rounded-full hover:bg-slate-100"
                                onClick={() => { setSubjectFilter("all"); setDateFilter("") }}
                            >
                                <X className="h-3 w-3 text-slate-500" />
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                        <Button
                            variant={viewMode === "grid" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("grid")}
                            className={viewMode === "grid" ? "bg-white shadow-sm" : "hover:bg-slate-200"}
                        >
                            <LayoutGrid className="h-4 w-4 mr-2" /> Grid
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("list")}
                            className={viewMode === "list" ? "bg-white shadow-sm" : "hover:bg-slate-200"}
                        >
                            <ListIcon className="h-4 w-4 mr-2" /> List
                        </Button>
                    </div>
                </div>
            </div>

            {filteredAssessments.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-slate-200 rounded-lg text-center text-slate-400">
                    No assessments found matching your filters.
                </div>
            ) : viewMode === "grid" ? (
                // GRID VIEW
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredAssessments.map((a) => (
                        <Card key={a.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-bold line-clamp-1" title={a.title}>{a.title}</CardTitle>
                                        <CardDescription className="flex items-center gap-1">
                                            {subjects[a.subject_id] || "Unknown Subject"}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={a.status === "Active" ? "default" : "secondary"} className={a.status === "Active" ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}>
                                        {a.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-500 uppercase font-semibold">Students</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Users className="h-4 w-4 text-indigo-500" />
                                            <span className="text-xl font-bold text-slate-900">{a.total_students}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-500 uppercase font-semibold">Avg Score</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <BarChart3 className="h-4 w-4 text-emerald-500" />
                                            <span className="text-xl font-bold text-slate-900">{a.avg_score}%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 text-xs text-slate-400 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {a.created_at ? new Date(a.created_at).toLocaleDateString() : "No Date"}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full mt-4 text-slate-600"
                                    onClick={() => handleViewStudents(a.id)}
                                >
                                    <Users className="h-3 w-3 mr-2" /> View Attended Students
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                // LIST VIEW
                <Card>
                    <div className="rounded-md border-0 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="w-[300px]">Exam Title</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Students</TableHead>
                                    <TableHead className="text-right">Avg Score</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAssessments.map((a) => (
                                    <TableRow key={a.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <div className="font-semibold text-slate-900">{a.title}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-slate-500 font-normal">
                                                {subjects[a.subject_id] || "-"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-sm">
                                            {a.created_at ? new Date(a.created_at).toLocaleDateString() : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                a.status === "Active"
                                                    ? "border-green-200 text-green-700 bg-green-50"
                                                    : "bg-slate-100 text-slate-500 border-slate-200"
                                            }>
                                                {a.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1.5 text-slate-600 font-medium">
                                                <Users className="h-3.5 w-3.5 text-slate-400" />
                                                {a.total_students}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className={`font-bold ${a.avg_score >= 70 ? "text-emerald-600" : a.avg_score >= 40 ? "text-amber-600" : "text-red-500"}`}>
                                                {a.avg_score}%
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleViewStudents(a.id)}
                                                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 h-8 px-3"
                                            >
                                                <Eye className="h-3.5 w-3.5 mr-2" />
                                                View Students
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            )}

            {/* Student List Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Students Attended</DialogTitle>
                        <DialogDescription>
                            List of unique students who have submitted responses for this exam.
                        </DialogDescription>
                    </DialogHeader>

                    {loadingStudents ? (
                        <div className="py-12 flex justify-center text-slate-400">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : students.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 italic">
                            No students found for this exam.
                        </div>
                    ) : (
                        <div className="max-h-[60vh] overflow-y-auto border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow className="sticky top-0 bg-slate-50 z-10">
                                        <TableHead>Student Identifier</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map((s, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>
                                                <div className="font-medium">{s.name || s.email}</div>
                                                <div className="text-xs text-slate-500">{s.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100">
                                                    Submitted
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
