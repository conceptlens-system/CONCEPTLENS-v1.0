"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, Calendar, Clock, BookOpen, AlertCircle, Trash2, Filter, X, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { fetchExams, fetchSubjects, deleteExam, validateExam } from "@/lib/api"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/ConfirmModal"
import { PageTransition } from "@/components/PageTransition"
import { motion } from "framer-motion"

export default function ExamsPage() {
    const { data: session, status } = useSession()
    const [exams, setExams] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [subjects, setSubjects] = useState<Record<string, string>>({})
    const [draft, setDraft] = useState<any>(null)

    // Filters
    const [subjectFilter, setSubjectFilter] = useState("all")
    const [dateFilter, setDateFilter] = useState("")

    const [confirmOpen, setConfirmOpen] = useState(false)
    const [confirmAction, setConfirmAction] = useState<() => Promise<void>>(async () => { })
    const [confirmTitle, setConfirmTitle] = useState("")

    useEffect(() => {
        // Load Draft
        const savedDraft = localStorage.getItem("createExamDraft")
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft)
                if (parsed.title || parsed.questions?.length > 0) {
                    setDraft(parsed)
                }
            } catch (e) {
                console.error("Invalid draft", e)
            }
        }

        // ... (keep existing data loading logic)
        if (status === "loading") return
        const token = (session?.user as any)?.accessToken

        if (status === "unauthenticated" || !token) {
            setLoading(false)
            return
        }

        const load = async () => {
            try {
                const [examsData, subjectsData] = await Promise.all([
                    fetchExams(token),
                    fetchSubjects(token)
                ])
                setExams(examsData)

                // Create subject map
                const sMap: Record<string, string> = {}
                subjectsData.forEach((s: any) => {
                    sMap[s._id] = s.name
                })
                setSubjects(sMap)
            } catch (e) {
                console.error(e)
                toast.error("Failed to load data")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [session, status])

    const filteredExams = exams.filter(e => {
        const matchesSubject = subjectFilter === "all" || e.subject_id === subjectFilter
        const matchesDate = !dateFilter || (e.schedule_start && e.schedule_start.startsWith(dateFilter))
        return matchesSubject && matchesDate
    })

    // ... (keep existing handlers)

    const handleDiscardDraft = () => {
        localStorage.removeItem("createExamDraft")
        setDraft(null)
        toast.info("Draft discarded")
    }

    const handleDeleteExam = async (id: string, title: string) => {
        setConfirmTitle(`Delete Exam: ${title}?`)
        setConfirmAction(() => async () => {
            const token = (session?.user as any)?.accessToken
            if (!token) return

            try {
                await deleteExam(id, token)
                setExams(exams.filter(e => e._id !== id))
                toast.success("Exam deleted")
            } catch (e) {
                toast.error("Failed to delete exam")
            }
        })
        setConfirmOpen(true)
    }

    const handleToggleValidation = async (id: string, newVal: boolean) => {
        const token = (session?.user as any)?.accessToken
        if (!token) return
        try {
            await validateExam(id, newVal, token)
            setExams(exams.map(e => e._id === id ? { ...e, is_validated: newVal } : e))
            toast.success(newVal ? "Exam Published" : "Exam Unpublished")
        } catch (e) {
            toast.error("Failed to update status")
        }
    }

    if (loading) return <div className="p-8">Loading Exams...</div>

    return (
        <PageTransition className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Exams</h1>
                    <p className="text-slate-500">Manage assessments and quizzes.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    {/* Filters */}
                    <div className="flex items-center gap-2 bg-white p-1 rounded-md border shadow-sm">
                        <Filter className="h-4 w-4 text-slate-400 ml-2" />
                        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                            <SelectTrigger className="w-[140px] border-0 focus:ring-0 h-9">
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
                            className="border-0 focus-visible:ring-0 h-9 w-fit"
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

                    <Button asChild>
                        <Link href="/professor/exams/create">
                            <Plus className="mr-2 h-4 w-4" /> Create Exam
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Draft Section */}
            {draft && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-100 p-2 rounded-full">
                            <FileText className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-amber-900">Unsaved Draft: {draft.title || "Untitled Exam"}</h3>
                            <p className="text-sm text-amber-700">You have an unfinished exam with {draft.questions?.length || 0} questions.</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="text-amber-700 hover:text-amber-900 hover:bg-amber-100" onClick={handleDiscardDraft}>
                            Discard
                        </Button>
                        <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" asChild>
                            <Link href="/professor/exams/create">Continue Editing</Link>
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredExams.map((exam, i) => (
                    <motion.div
                        key={exam._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                    >
                        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant={exam.is_validated ? "default" : "secondary"}>
                                        {exam.is_validated ? "Published" : "Draft"}
                                    </Badge>
                                    {exam.questions?.length === 0 && <AlertCircle className="h-4 w-4 text-amber-500" />}
                                </div>
                                <CardTitle className="text-lg font-bold">
                                    <span className="truncate block" title={exam.title}>{exam.title}</span>
                                </CardTitle>
                                <CardDescription className="flex items-center gap-1">
                                    <BookOpen className="h-3 w-3" />
                                    {subjects[exam.subject_id] || "Unknown Subject"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col justify-end">
                                <div className="space-y-2 text-sm text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        <span>{exam.duration_minutes} mins</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>{exam.schedule_start ? format(new Date(exam.schedule_start), 'PPP p') : 'Unscheduled'}</span>
                                    </div>
                                    <div className="pt-4 flex flex-col gap-2">
                                        <div className="flex justify-between items-center bg-slate-50 p-2 rounded">
                                            <div className="text-xs font-medium">
                                                {exam.questions?.length || 0} Questions
                                            </div>
                                            <div className={`text-xs font-medium ${exam.anti_cheat_config?.fullscreen ? 'text-green-600' : 'text-slate-500'}`}>
                                                Anti-Cheat: {exam.anti_cheat_config?.fullscreen ? 'On' : 'Off'}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <Button
                                                variant={exam.is_validated ? "secondary" : "default"}
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => handleToggleValidation(exam._id, !exam.is_validated)}
                                            >
                                                {exam.is_validated ? "Unpublish" : "Publish"}
                                            </Button>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/professor/exams/${exam._id}`}>Edit</Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteExam(exam._id, exam.title)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}

                {exams.length === 0 && (
                    <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg text-slate-400">
                        No exams created yet. Click "Create Exam" to begin.
                    </div>
                )}
            </div>

            <ConfirmModal
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title={confirmTitle}
                description="This action cannot be undone."
                onConfirm={confirmAction}
                variant="destructive"
            />
        </PageTransition>
    )
}
