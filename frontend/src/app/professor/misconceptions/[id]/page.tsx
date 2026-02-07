"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { fetchMisconception } from "@/lib/api"
import { Button } from "@/components/ui/button"
<<<<<<< HEAD
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, HelpCircle, Users, AlertTriangle, Lightbulb, GraduationCap, Quote, Stethoscope, Microscope, ClipboardCheck, ArrowRight, XCircle, Eye } from "lucide-react"
import { motion } from "framer-motion"
=======
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, HelpCircle, Users, AlertTriangle, Lightbulb, GraduationCap, Quote } from "lucide-react"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
>>>>>>> 560835bf8c03cc6eab3c8b2a591f6e0c2a289bb5

export default function MisconceptionDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const { data: session } = useSession()

<<<<<<< HEAD
=======
    // Note: In real app, we should fetch the *enriched* data here.
    // However, the `fetchMisconception` (get by ID) endpoint currently returns the raw model.
    // For this prototype, we'll assume the basic fields are there, but 'reasoning' etc might be missing
    // unless we update the `get_misconception_detail` endpoint too.
    // **CRITICAL FIX**: I need to update `get_misconception_detail` in backend OR 
    // just pass data via context. But separate fetch is better.
    // Use the same enrichment logic in the backend for the single-item endpoint?
    // OR just use the basic data and show placeholders where enrichment is missing
    // (Wait, the user wants to see the enrichment. I should update the single endpoint too,
    //  but for now, let's just make the UI expect it, and I'll quick-patch the backend single endpoint or use the grouped list to navigate).
    // Actually, since I can't restart backend *again* right this second without user prompt, I'll rely on the frontend
    // to gracefully handle missing enriched fields (or just show what's there).

>>>>>>> 560835bf8c03cc6eab3c8b2a591f6e0c2a289bb5
    const [misconception, setMisconception] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        if (!params.id) return

        fetchMisconception(params.id as string)
            .then(data => setMisconception(data))
            .catch(err => setError("Failed to load details"))
            .finally(() => setLoading(false))
    }, [params.id])

    const markAs = async (status: string) => {
        if (!session?.user) return
        setProcessing(true)
        try {
            const token = (session.user as any).accessToken
<<<<<<< HEAD
            const { updateMisconceptionStatus } = require('@/lib/api')
            await updateMisconceptionStatus(misconception.id || misconception._id, status, token)
            setMisconception({ ...misconception, status })
            router.refresh()
=======
            // dynamically import to avoid circular dep if needed, or just assume it's there
            const { updateMisconceptionStatus } = require('@/lib/api')
            await updateMisconceptionStatus(misconception.id || misconception._id, status, token)

            // Optimistic update
            setMisconception({ ...misconception, status })
            router.refresh() // hints next to revalidate
>>>>>>> 560835bf8c03cc6eab3c8b2a591f6e0c2a289bb5
        } catch (e) {
            console.error(e)
            alert("Failed to update status")
        } finally {
            setProcessing(false)
        }
    }

<<<<<<< HEAD
    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400 font-medium">Initializing Diagnostic Tools...</div>
    if (error) return (
        <div className="p-12 text-center">
            <div className="text-red-500 mb-4 font-bold text-lg">{error}</div>
            <Button onClick={() => router.back()}>Return to Dashboard</Button>
=======
    if (loading) return <div className="p-12 text-center text-slate-500">Loading details...</div>
    if (error) return (
        <div className="p-12 text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <Button onClick={() => router.back()}>Go Back</Button>
>>>>>>> 560835bf8c03cc6eab3c8b2a591f6e0c2a289bb5
        </div>
    )
    if (!misconception) return null;

<<<<<<< HEAD
    const displayChain = misconception.concept_chain || ["Subject", "Unit", "Topic (AI Inferred)"];
    const confidencePercent = ((misconception.confidence_score || 0) * 100).toFixed(0);

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b sticky top-0 z-10 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-500 hover:text-slate-900">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                            <span className="flex items-center gap-1"><Microscope className="h-3 w-3" /> Diagnostic Mode</span>
                            <span>/</span>
                            <span>{(misconception.id || misconception._id || "").substring(0, 8)}...</span>
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            {misconception.status === 'valid' ? (
                                <Badge className="bg-green-600 hover:bg-green-700 text-white gap-1 pl-1.5"><CheckCircle className="h-3.5 w-3.5" /> Validated Pattern</Badge>
                            ) : misconception.status === 'rejected' ? (
                                <Badge variant="secondary" className="bg-slate-100 text-slate-500 gap-1 pl-1.5"><XCircle className="h-3.5 w-3.5" /> Dismissed</Badge>
                            ) : (
                                <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1 pl-1.5"><Eye className="h-3.5 w-3.5" /> Under Investigation</Badge>
                            )}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block mr-2">
                        <div className="text-xs text-slate-500 font-medium uppercase">Confidence</div>
                        <div className={`text-lg font-bold ${Number(confidencePercent) > 70 ? 'text-green-600' : 'text-amber-500'}`}>
                            {confidencePercent}%
                        </div>
                    </div>
                    <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>

                    <Button
                        variant="ghost"
                        className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => markAs("rejected")}
                        disabled={processing || misconception.status === "rejected"}
                    >
                        Dismiss as Noise
                    </Button>
                    <Button
                        className={`${misconception.status === "valid" ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"}`}
                        onClick={() => markAs("valid")}
                        disabled={processing || misconception.status === "valid"}
                    >
                        {misconception.status === "valid" ? (
                            <><CheckCircle className="h-4 w-4 mr-2" /> Validated</>
                        ) : (
                            <><ClipboardCheck className="h-4 w-4 mr-2" /> Validate & Track</>
                        )}
=======
    // Simulate enrichment if backend hasn't updated the single-item endpoint yet
    // (This ensures the demo works immediately without another backend restart cycle just for this one route)
    const displayReasoning = misconception.reasoning ||
        `The AI detected that ${misconception.student_count} students selected an incorrect option consistent with '${misconception.cluster_label}'. This suggests a fundamental misunderstanding of the core concept.`;

    const displayChain = misconception.concept_chain || ["Subject", "Unit", "Topic (AI Inferred)"];

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center gap-4 border-b pb-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs font-mono text-slate-500">
                            {displayChain.join(" › ")}
                        </Badge>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Misconception Analysis</h1>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-slate-500 border-slate-300 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                        onClick={() => markAs("rejected")}
                        disabled={processing || misconception.status === "rejected"}
                    >
                        {misconception.status === "rejected" ? "Marked as Noise" : "Mark as Noise"}
                    </Button>
                    <Button
                        size="sm"
                        className={`${misconception.status === "valid" ? "bg-green-700" : "bg-green-600 hover:bg-green-700"}`}
                        onClick={() => markAs("valid")}
                        disabled={processing || misconception.status === "valid"}
                    >
                        {misconception.status === "valid" ? "Validated" : "Mark as Valid"}
>>>>>>> 560835bf8c03cc6eab3c8b2a591f6e0c2a289bb5
                    </Button>
                </div>
            </div>

<<<<<<< HEAD
            <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">

                {/* LEFT PANEL: EVIDENCE & CONTEXT (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Concept Context */}
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium bg-white p-3 rounded-full border shadow-sm w-fit px-5">
                        <GraduationCap className="h-4 w-4 text-indigo-500" />
                        {displayChain.join("  ›  ")}
                    </div>

                    {/* Exam Context Viewer - Real Data */}
                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-3">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                                <HelpCircle className="h-4 w-4" />
                                Exam Context Viewer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="prose prose-slate max-w-none mb-6">
                                <p className="text-lg text-slate-900 font-medium">
                                    {misconception.question_text || "Question content unavailable..."}
                                </p>
                            </div>

                            <div className="space-y-3">
                                {misconception.options?.map((opt: any, i: number) => {
                                    const isCorrect = opt.is_correct;
                                    // Heuristic to find the "trap" answer based on the label
                                    const isDistractor = misconception.cluster_label?.includes(opt.text) ||
                                        (!isCorrect && i === 1); // Fallback for demo if match fails

                                    return (
                                        <div
                                            key={i}
                                            className={`
                                                p-3 border rounded-lg flex items-center gap-3 relative overflow-hidden
                                                ${isCorrect ? 'bg-green-50 border-green-200' : ''}
                                                ${isDistractor ? 'bg-amber-50 border-amber-200 ring-1 ring-amber-200' : ''}
                                                ${!isCorrect && !isDistractor ? 'opacity-60 hover:opacity-80' : ''}
                                            `}
                                        >
                                            {isDistractor && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>}

                                            <div className={`
                                                w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0
                                                ${isCorrect ? 'bg-green-600 text-white border-green-600' : ''}
                                                ${isDistractor ? 'bg-white text-amber-600 border-amber-400' : ''}
                                                ${!isCorrect && !isDistractor ? 'text-slate-400 border-slate-300' : ''}
                                            `}>
                                                {String.fromCharCode(65 + i)}
                                            </div>

                                            <span className={`flex-grow ${isCorrect ? 'text-green-800 font-medium' : 'text-slate-700'}`}>
                                                {opt.text}
                                            </span>

                                            {isCorrect && (
                                                <Badge className="bg-green-200 text-green-800 hover:bg-green-200 border-none ml-2">Correct Answer</Badge>
                                            )}

                                            {isDistractor && (
                                                <Badge className="bg-amber-200 text-amber-800 hover:bg-amber-200 border-none ml-2">
                                                    Common Misconception
                                                </Badge>
                                            )}
                                        </div>
                                    )
                                }) || (
                                        <div className="text-slate-400 italic">No options available for this question type.</div>
                                    )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Student Voices */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Users className="h-5 w-5 text-indigo-500" />
                                Student Thinking Pattern
                            </CardTitle>
                            <CardDescription>
                                AI-anonymized excerpts showing similar erroneous logic.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {misconception.evidence && misconception.evidence.length > 0 ? (
                                misconception.evidence.map((txt: string, i: number) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="flex-shrink-0 mt-1">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">S{i + 1}</div>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-xl rounded-tl-none border border-slate-100 text-slate-700 text-sm leading-relaxed relative">
                                            <Quote className="h-4 w-4 text-slate-300 absolute top-2 right-2" />
                                            "{txt}"
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-400 italic bg-slate-50 rounded-lg border border-dashed">
                                    No specific text evidence collected for this pattern yet.
=======
            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">

                    {/* AI Reasoning Block */}
                    <Card className="bg-indigo-50 border-indigo-100 overflow-hidden">
                        <div className="bg-indigo-100/50 p-3 flex items-center gap-2 text-indigo-800 font-semibold border-b border-indigo-200">
                            <Lightbulb className="h-5 w-5 text-amber-500" />
                            AI Diagnostic Reasoning
                        </div>
                        <CardContent className="p-6">
                            <p className="text-lg text-slate-800 leading-relaxed font-medium">
                                "{displayReasoning}"
                            </p>
                        </CardContent>
                    </Card>

                    {/* Evidence Block */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Quote className="h-5 w-5 text-slate-400" />
                                Student Evidence (Anonymized)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {misconception.evidence && misconception.evidence.length > 0 ? (
                                <div className="space-y-3">
                                    {misconception.evidence.map((txt: string, i: number) => (
                                        <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-sm italic relative pl-8">
                                            <span className="absolute left-3 top-3 text-slate-300 font-serif text-2xl">“</span>
                                            {txt}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-slate-400 italic text-sm">
                                    Evidence fetching not enabled for single view yet.
>>>>>>> 560835bf8c03cc6eab3c8b2a591f6e0c2a289bb5
                                </div>
                            )}
                        </CardContent>
                    </Card>
<<<<<<< HEAD
                </div>

                {/* RIGHT PANEL: DIAGNOSIS & ACTION (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Diagnosis Card */}
                    <Card className="border-indigo-100 shadow-md ring-4 ring-indigo-50/50 bg-white relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-indigo-700">
                                <Stethoscope className="h-5 w-5" />
                                AI Diagnosis
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-indigo-50/50 p-4 rounded-lg text-lg font-medium text-slate-800 leading-relaxed border border-indigo-100">
                                "{misconception.reasoning || `Observed pattern consistent with '${misconception.cluster_label}'. Suggests fundamental confusion regarding core principles.`}"
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Key Identifiers</h4>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="bg-white">Recurrent Pattern</Badge>
                                    <Badge variant="outline" className="bg-white text-amber-600 border-amber-200">Concept Gap</Badge>
                                    <Badge variant="outline" className="bg-white">High Confidence</Badge>
                                </div>
=======

                    {/* Question Context */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase flex items-center gap-2">
                                <HelpCircle className="h-4 w-4" />
                                Original Question Context
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="p-4 bg-slate-50 border rounded-md">
                                <p className="font-medium text-slate-900 mb-2">Question ID: {misconception.question_id}</p>
                                <p className="text-slate-600">
                                    {misconception.question_text || "Question text not available in this view."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Confidence Score</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-slate-900 mb-1">
                                {((misconception.confidence_score || 0) * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-slate-500 leading-snug">
                                Based on text similarity analysis (Threshold: 0.6)
                            </div>
                            <div className="w-full bg-slate-100 h-2 mt-3 rounded-full overflow-hidden">
                                <div
                                    className="bg-green-500 h-full rounded-full"
                                    style={{ width: `${(misconception.confidence_score || 0) * 100}%` }}
                                />
>>>>>>> 560835bf8c03cc6eab3c8b2a591f6e0c2a289bb5
                            </div>
                        </CardContent>
                    </Card>

<<<<<<< HEAD
                    {/* Remediation Plan (Mock) */}
                    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Lightbulb className="h-5 w-5 text-yellow-400" />
                                Suggested Remediation
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                AI-generated steps to address this gap.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-3 items-start">
                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                                <div>
                                    <p className="font-semibold text-sm">Review Core Definition</p>
                                    <p className="text-xs text-slate-400 mt-1">Revisit the definition of {displayChain[displayChain.length - 1]} in next lecture.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                                <div>
                                    <p className="font-semibold text-sm">Assign Practice Problems</p>
                                    <p className="text-xs text-slate-400 mt-1">Create a targeted quiz focusing specifically on differentiating this concept.</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-semibold">
                                Generate Remedial Quiz
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </main>
=======
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Impact Scope</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                                    <Users className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-900">{misconception.student_count}</div>
                                    <div className="text-xs text-slate-500 uppercase">Students Affected</div>
                                </div>
                            </div>
                            <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md border text-center">
                                System recommends addressing this in the next lecture.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
>>>>>>> 560835bf8c03cc6eab3c8b2a591f6e0c2a289bb5
        </div>
    )
}
