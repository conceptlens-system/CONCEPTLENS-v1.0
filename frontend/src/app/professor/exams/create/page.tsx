"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect, Suspense } from "react"
import { toast } from "sonner"
import { fetchSubjects, createExam, fetchClasses } from "@/lib/api"
import { Plus, Trash2, Users, Upload, Copy, HelpCircle } from "lucide-react"
import { useSession } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const formatExample = `*** COPY THIS PROMPT TO AI ***
You are an Exam Question Generator. Generate questions in this EXACT format:

Q: [Question Text]
A: [Option A]
B: [Option B]
C: [Option C]
D: [Option D]
Correct: [Correct Option Letter or Answer Text]
Type: [mcq | short_answer | true_false | one_word]

--- EXAMPLES ---

Q: What is the capital of France?
A: Berlin
B: Madrid
C: Paris
D: Rome
Correct: C
Type: mcq

Q: Photosynthesis requires sunlight.
Correct: True
Type: true_false

Q: What is the chemical symbol for Gold?
Correct: Au
Type: one_word

Q: Explain the concept of inertia.
Correct: Objects in motion stay in motion unless acted upon by a force.
Type: short_answer`

function CreateExamContent() {
    const { data: session } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const preSelectedClassId = searchParams.get("classId")

    const [subjects, setSubjects] = useState<any[]>([])
    const [classes, setClasses] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)

    // Exam State
    const [title, setTitle] = useState("")
    const [selectedSubject, setSelectedSubject] = useState("")
    const [selectedClasses, setSelectedClasses] = useState<string[]>([])
    const [duration, setDuration] = useState("60")
    const [isCustomDuration, setIsCustomDuration] = useState(false)
    const [startTime, setStartTime] = useState<Date | undefined>(undefined)
    const [accessEndTime, setAccessEndTime] = useState<Date | undefined>(undefined)
    const [questions, setQuestions] = useState<any[]>([])

    const DURATION_PRESETS = [
        { label: "30m", value: 30 },
        { label: "45m", value: 45 },
        { label: "1h", value: 60 },
        { label: "1.5h", value: 90 },
        { label: "2h", value: 120 },
        { label: "3h", value: 180 },
        { label: "6h", value: 360 },
        { label: "12h", value: 720 },
        { label: "24h", value: 1440 },
    ]

    useEffect(() => {
        const fetchData = async () => {
            if (session?.user) {
                const token = (session.user as any).accessToken
                try {
                    const [subData, clsData] = await Promise.all([
                        fetchSubjects(token),
                        fetchClasses(token)
                    ])
                    setSubjects(subData || [])
                    setClasses(clsData || [])
                    if (preSelectedClassId) {
                        setSelectedClasses([preSelectedClassId])
                    }
                } catch (error) {
                    toast.error("Failed to load data")
                    console.error(error)
                }
            }
        }
        fetchData()
    }, [session, preSelectedClassId])

    // Load Draft from LocalStorage
    useEffect(() => {
        const draft = localStorage.getItem("createExamDraft")
        if (draft) {
            try {
                const data = JSON.parse(draft)
                if (data.title) setTitle(data.title)
                if (data.selectedSubject) setSelectedSubject(data.selectedSubject)
                if (data.selectedClasses) setSelectedClasses(data.selectedClasses)
                if (data.duration) setDuration(data.duration)
                if (data.questions && Array.isArray(data.questions)) {
                    // Schema Migration: Ensure all fields exist
                    const migratedQuestions = data.questions.map((q: any) => ({
                        ...q,
                        topic_id: q.topic_id || "general",
                        marks: typeof q.marks === 'number' ? q.marks : 1,
                        options: Array.isArray(q.options) ? q.options : ["", "", "", ""],
                        type: q.type || "mcq",
                        correct_answer: q.correct_answer || ""
                    }))
                    setQuestions(migratedQuestions)
                }
                if (data.startTime) setStartTime(new Date(data.startTime))
                if (data.accessEndTime) setAccessEndTime(new Date(data.accessEndTime))
                toast.info("Restored saved draft")
            } catch (e) {
                console.error("Failed to parse draft", e)
            }
        }
        setIsLoaded(true)
    }, [])

    // Auto-Save Draft
    useEffect(() => {
        if (!isLoaded) return

        const draft = {
            title,
            selectedSubject,
            selectedClasses,
            duration,
            questions,
            startTime: startTime ? startTime.toISOString() : null,
            accessEndTime: accessEndTime ? accessEndTime.toISOString() : null
        }
        localStorage.setItem("createExamDraft", JSON.stringify(draft))
    }, [title, selectedSubject, selectedClasses, duration, questions, startTime, accessEndTime, isLoaded])

    const handleDurationPreset = (value: number) => {
        setDuration(value.toString())
        setIsCustomDuration(false)
    }

    const addQuestion = () => {
        setQuestions([...questions, {
            id: `q${questions.length + 1}`,
            text: "",
            type: "mcq",
            options: ["", "", "", ""],
            correct_answer: "",
            marks: 1,
            topic_id: "general"
        }])
    }

    const updateQuestion = (index: number, field: string, value: any) => {
        const newQ = [...questions]
        newQ[index] = { ...newQ[index], [field]: value }
        setQuestions(newQ)
    }

    const updateOption = (qIndex: number, optIndex: number, value: string) => {
        const newQ = [...questions]
        newQ[qIndex].options[optIndex] = value
        setQuestions(newQ)
    }

    const toggleClass = (classId: string) => {
        if (selectedClasses.includes(classId)) {
            setSelectedClasses(selectedClasses.filter(id => id !== classId))
        } else {
            setSelectedClasses([...selectedClasses, classId])
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(formatExample)
        toast.success("Format copied to clipboard!")
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const text = event.target?.result as string
            if (!text) return

            // Parse Logic
            const blocks = text.split(/\n\s*\n/) // Split by empty lines
            const parsedQuestions: any[] = []

            blocks.forEach((block, idx) => {
                const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
                if (lines.length === 0) return

                const qTextLine = lines.find(l => l.startsWith("Q:"))
                if (!qTextLine) return

                const questionText = qTextLine.substring(2).trim()
                const options: string[] = ["", "", "", ""]
                let correctAnswer = ""
                let type = "short_answer" // Default

                // Check for Options
                const optA = lines.find(l => l.startsWith("A:"))
                const optB = lines.find(l => l.startsWith("B:"))
                const optC = lines.find(l => l.startsWith("C:"))
                const optD = lines.find(l => l.startsWith("D:"))

                if (optA || optB || optC || optD) {
                    type = "mcq"
                    if (optA) options[0] = optA.substring(2).trim()
                    if (optB) options[1] = optB.substring(2).trim()
                    if (optC) options[2] = optC.substring(2).trim()
                    if (optD) options[3] = optD.substring(2).trim()
                }

                // Check for Correct Answer
                const correctLine = lines.find(l => l.startsWith("Correct:"))
                if (correctLine) {
                    const val = correctLine.substring(8).trim()
                    // If MCQ, map A/B/C/D to full string value
                    if (type === "mcq") {
                        if (val === 'A') correctAnswer = options[0]
                        else if (val === 'B') correctAnswer = options[1]
                        else if (val === 'C') correctAnswer = options[2]
                        else if (val === 'D') correctAnswer = options[3]
                        else correctAnswer = val // raw value
                    } else {
                        correctAnswer = val
                    }
                }

                // Check for Explicit Type
                const typeLine = lines.find(l => l.startsWith("Type:"))
                if (typeLine) {
                    const tVal = typeLine.substring(5).trim().toLowerCase()
                    if (["mcq", "short_answer", "true_false", "one_word"].includes(tVal)) {
                        type = tVal
                    }
                }

                parsedQuestions.push({
                    id: `import_${Date.now()}_${idx}`,
                    text: questionText,
                    type,
                    options,
                    correct_answer: correctAnswer,
                    marks: 1, // Default
                    topic_id: "general"
                })
            })

            if (parsedQuestions.length > 0) {
                setQuestions([...questions, ...parsedQuestions])
                toast.success(`Imported ${parsedQuestions.length} questions!`)
            } else {
                toast.error("No valid questions found in file.")
            }
        }
        reader.readAsText(file)

        // Reset input
        e.target.value = ""
    }

    const handleSubmit = async () => {
        if (!title || !selectedSubject || !startTime || !accessEndTime) {
            toast.error("Please fill all required fields")
            return

        }

        if (selectedClasses.length === 0) {
            toast.error("Please assign the exam to at least one class")
            return
        }

        if (startTime >= accessEndTime) {
            toast.error("Access End Time must be after Start Time")
            return
        }

        setLoading(true)
        try {
            const token = (session?.user as any)?.accessToken
            const payload = {
                title,
                subject_id: selectedSubject,
                professor_id: (session?.user as any)?.id || "prof_1",
                duration_minutes: parseInt(duration),
                schedule_start: startTime.toISOString(),
                exam_access_end_time: accessEndTime.toISOString(),
                questions,
                class_ids: selectedClasses,
                anti_cheat_config: {
                    fullscreen: true,
                    tab_switch: true,
                    copy_paste: true
                }
            }

            console.log("Submitting Exam Payload:", JSON.stringify(payload).length, "bytes")

            await createExam(payload, token)

            // Clear draft on success
            localStorage.removeItem("createExamDraft")

            toast.success("Exam Created Successfully")
            router.push("/professor/exams")
        } catch (e: any) {
            toast.error("Failed to create exam: " + (e.message || "Unknown error"))
            console.error("Create Exam Error:", e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Create New Exam</h1>
                <p className="text-slate-500">Design your assessment and add questions.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Exam Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Exam Title</Label>
                            <Input placeholder="e.g. Mid-Term Physics" value={title} onChange={e => setTitle(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Subject</Label>
                            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map(s => (
                                        <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Duration</Label>
                            <div className="flex flex-wrap gap-2">
                                {DURATION_PRESETS.map((preset) => (
                                    <Button
                                        key={preset.value}
                                        type="button"
                                        variant={!isCustomDuration && parseInt(duration) === preset.value ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleDurationPreset(preset.value)}
                                        className="h-8"
                                    >
                                        {preset.label}
                                    </Button>
                                ))}
                                <Button
                                    type="button"
                                    variant={isCustomDuration ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setIsCustomDuration(true)}
                                    className="h-8"
                                >
                                    Custom
                                </Button>
                            </div>
                            {isCustomDuration && (
                                <div className="mt-2">
                                    <Input
                                        type="number"
                                        placeholder="Enter duration in minutes"
                                        value={duration}
                                        onChange={e => setDuration(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Enter duration in minutes.</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Schedule Start Time (Exam Available)</Label>
                                <DateTimePicker date={startTime} setDate={setStartTime} />
                                <p className="text-xs text-muted-foreground">
                                    All times shown in {Intl.DateTimeFormat().resolvedOptions().timeZone}
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label>Access End Time (Last Entry Time)</Label>
                                <DateTimePicker date={accessEndTime} setDate={setAccessEndTime} />
                                <p className="text-xs text-muted-foreground">
                                    Students cannot start exam after this time.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Anti-Cheat Config</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <input type="checkbox" checked readOnly className="h-4 w-4" />
                            <Label>Fullscreen Enforcement</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input type="checkbox" checked readOnly className="h-4 w-4" />
                            <Label>Tab Switch Detection</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input type="checkbox" checked readOnly className="h-4 w-4" />
                            <Label>Disable Copy/Paste</Label>
                        </div>
                        <p className="text-xs text-slate-400 pt-2">These settings are mandatory for high-security exams.</p>
                    </CardContent>
                </Card>

                <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" /> Assign to Classes
                        </CardTitle>
                        <CardDescription>Select which classes can view and take this exam.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {classes.length === 0 ? (
                            <div className="text-sm text-slate-500">No classes found. Create a class first.</div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {classes.map(cls => (
                                    <div
                                        key={cls._id}
                                        className={`
                                            cursor-pointer p-4 rounded-lg border flex items-center justify-between transition-all
                                            ${selectedClasses.includes(cls._id)
                                                ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                                                : 'bg-white hover:border-blue-200'}
                                        `}
                                        onClick={() => toggleClass(cls._id)}
                                    >
                                        <div>
                                            <div className="font-semibold text-sm">{cls.name}</div>
                                            <div className="text-xs text-slate-500">{cls.class_code}</div>
                                        </div>
                                        {selectedClasses.includes(cls._id) && (
                                            <div className="h-4 w-4 rounded-full bg-blue-500" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div>
                        <h2 className="text-xl font-semibold">Questions ({questions.length})</h2>
                        <p className="text-sm text-slate-500">Manage your exam questions</p>
                    </div>
                    <div className="flex gap-2">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <HelpCircle className="w-4 h-4" /> Format Guide
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>Bulk Upload Format</DialogTitle>
                                    <DialogDescription>
                                        You can generate questions using this format with AI (ChatGPT, Claude, etc).
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="bg-slate-950 text-slate-50 p-4 rounded-md text-xs font-mono whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
                                        {formatExample}
                                    </div>
                                    <Button size="sm" className="w-full gap-2" onClick={copyToClipboard}>
                                        <Copy className="w-3 h-3" /> Copy Format to Clipboard
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <div className="relative">
                            <input
                                type="file"
                                accept=".txt"
                                className="hidden"
                                id="question-upload"
                                onChange={handleFileUpload}
                            />
                            <Button variant="outline" onClick={() => document.getElementById('question-upload')?.click()}>
                                <Upload className="mr-2 h-4 w-4" /> Import from File
                            </Button>
                        </div>

                        <Button onClick={addQuestion} className="gap-2"><Plus className="h-4 w-4" /> Add Manually</Button>
                    </div>
                </div>

                {questions.map((q, idx) => (
                    <Card key={idx}>
                        <CardContent className="py-6 space-y-4">
                            <div className="flex gap-4">
                                <div className="font-bold text-slate-400 pt-2">Q{idx + 1}</div>
                                <div className="flex-1 space-y-4">
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <Label className="mb-2 block text-xs font-semibold text-slate-500 uppercase">Question Text</Label>
                                            <Textarea
                                                placeholder="Enter question text here..."
                                                value={q.text}
                                                onChange={e => updateQuestion(idx, 'text', e.target.value)}
                                            />
                                        </div>
                                        <div className="w-48">
                                            <Label className="mb-2 block text-xs font-semibold text-slate-500 uppercase">Type</Label>
                                            <Select value={q.type} onValueChange={(val) => updateQuestion(idx, 'type', val)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="mcq">Multiple Choice</SelectItem>
                                                    <SelectItem value="short_answer">Short Answer</SelectItem>
                                                    <SelectItem value="true_false">True / False</SelectItem>
                                                    <SelectItem value="one_word">One Word</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-24">
                                            <Label className="mb-2 block text-xs font-semibold text-slate-500 uppercase">Marks</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={q.marks}
                                                onChange={e => {
                                                    const val = parseInt(e.target.value) || 0
                                                    updateQuestion(idx, 'marks', val < 0 ? 0 : val)
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {q.type === 'mcq' && (
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-slate-500 uppercase">Options (Select Correct)</Label>
                                            <div className="grid grid-cols-2 gap-4">
                                                {q.options.map((opt: string, oIdx: number) => (
                                                    <div key={oIdx} className="flex gap-2 items-center">
                                                        <input
                                                            type="radio"
                                                            name={`q_${idx}_correct`}
                                                            checked={q.correct_answer === opt && opt !== ""}
                                                            onChange={() => updateQuestion(idx, 'correct_answer', opt)}
                                                            className="h-4 w-4"
                                                        />
                                                        <Input
                                                            placeholder={`Option ${oIdx + 1}`}
                                                            value={opt}
                                                            onChange={e => updateOption(idx, oIdx, e.target.value)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {q.type === 'true_false' && (
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-slate-500 uppercase">Correct Answer</Label>
                                            <div className="flex gap-4">
                                                <Button
                                                    type="button"
                                                    variant={q.correct_answer === "True" ? "default" : "outline"}
                                                    onClick={() => updateQuestion(idx, 'correct_answer', "True")}
                                                >True</Button>
                                                <Button
                                                    type="button"
                                                    variant={q.correct_answer === "False" ? "default" : "outline"}
                                                    onClick={() => updateQuestion(idx, 'correct_answer', "False")}
                                                >False</Button>
                                            </div>
                                        </div>
                                    )}

                                    {(q.type === 'short_answer' || q.type === 'one_word') && (
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-slate-500 uppercase">Expected Answer (For Auto-Grading)</Label>
                                            <Input
                                                placeholder="Enter the expected answer key..."
                                                value={q.correct_answer}
                                                onChange={e => updateQuestion(idx, 'correct_answer', e.target.value)}
                                            />
                                        </div>
                                    )}

                                    <div className="pt-2">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase">Topic Tag</Label>
                                        <Input
                                            placeholder="e.g. Normalization (Used for AI Analysis)"
                                            value={q.topic_id}
                                            onChange={e => updateQuestion(idx, 'topic_id', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="text-red-500 mt-2" onClick={() => {
                                    const newQ = [...questions];
                                    newQ.splice(idx, 1);
                                    setQuestions(newQ);
                                }}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex justify-end pt-8">
                <Button size="lg" className="bg-slate-900 text-white w-48" onClick={handleSubmit} disabled={loading}>
                    {loading ? "Creating..." : "Create Exam"}
                </Button>
            </div>
        </div>
    )
}

export default function CreateExamPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CreateExamContent />
        </Suspense>
    )
}
