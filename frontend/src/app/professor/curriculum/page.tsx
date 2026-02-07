"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, ChevronRight, ChevronDown, BookOpen, Pencil, Check, X } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { fetchSubjects, createSubject, updateSyllabus, deleteSubject } from "@/lib/api"
import { useSession } from "next-auth/react"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { ConfirmModal } from "@/components/ConfirmModal"
import { PageTransition } from "@/components/PageTransition"
import { motion } from "framer-motion"

export default function CurriculumPage() {
    const { data: session } = useSession()
    const token = (session?.user as any)?.accessToken

    const [subjects, setSubjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [confirmAction, setConfirmAction] = useState<() => Promise<void>>(async () => { })
    const [confirmTitle, setConfirmTitle] = useState("")
    const [confirmDesc, setConfirmDesc] = useState("")

    const [addTopicOpen, setAddTopicOpen] = useState(false)
    const [topicName, setTopicName] = useState("")
    const [activeTopicLoc, setActiveTopicLoc] = useState<{ sIdx: number, uIdx: number } | null>(null)

    const [isAddOpen, setIsAddOpen] = useState(false)
    const [newSubjectName, setNewSubjectName] = useState("")

    // Inline Edit State
    const [editingSubject, setEditingSubject] = useState<{ id: string, name: string } | null>(null)
    const [editingUnit, setEditingUnit] = useState<{ sIdx: number, uIdx: number, name: string } | null>(null)

    useEffect(() => {
        if (token) loadSubjects()
        else setLoading(false)
    }, [token])

    async function loadSubjects() {
        if (!token) return
        try {
            const data = await fetchSubjects(token)
            setSubjects(data)
        } catch (e) {
            toast.error("Failed to load subjects")
        } finally {
            setLoading(false)
        }
    }

    async function handleCreateSubject() {
        if (!newSubjectName || !token) return
        try {
            await createSubject(newSubjectName, token)
            toast.success("Subject Created")
            setNewSubjectName("")
            setIsAddOpen(false)
            loadSubjects()
        } catch (e) {
            toast.error("Failed to create subject")
        }
    }

    const saveSubjectName = async () => {
        if (!editingSubject) return
        toast.info("Subject rename saved (Simulation)")
        setEditingSubject(null)
    }

    const addUnit = async (subjectIndex: number) => {
        if (!token) return
        const s = [...subjects]
        const subject = s[subjectIndex]
        if (!subject.syllabus) subject.syllabus = []

        subject.syllabus.push({
            unit: `Unit ${subject.syllabus.length + 1}`,
            topics: []
        })
        setSubjects(s)
        try {
            await updateSyllabus(subject._id, subject.syllabus, token)
        } catch (e) { toast.error("Failed to save") }
    }

    const saveUnitName = async () => {
        if (!editingUnit || !token) return
        const s = [...subjects]
        s[editingUnit.sIdx].syllabus[editingUnit.uIdx].unit = editingUnit.name
        setSubjects(s)
        setEditingUnit(null)
        try {
            await updateSyllabus(s[editingUnit.sIdx]._id, s[editingUnit.sIdx].syllabus, token)
        } catch (e) { toast.error("Failed to save") }
    }

    const openAddTopic = (sIdx: number, uIdx: number) => {
        setActiveTopicLoc({ sIdx, uIdx })
        setTopicName("")
        setAddTopicOpen(true)
    }

    const handleAddTopic = async () => {
        if (!activeTopicLoc || !topicName || !token) return

        const { sIdx, uIdx } = activeTopicLoc
        const s = [...subjects]
        s[sIdx].syllabus[uIdx].topics.push(topicName)
        setSubjects(s)
        setAddTopicOpen(false)
        await updateSyllabus(s[sIdx]._id, s[sIdx].syllabus, token)
    }

    const confirmDeleteSubject = (id: string, name: string) => {
        if (!token) return
        setConfirmTitle(`Delete Subject: ${name}?`)
        setConfirmDesc("This action cannot be undone. All units and topics will be removed.")
        setConfirmAction(() => async () => {
            try {
                await deleteSubject(id, token)
                setSubjects(prev => prev.filter(s => s._id !== id))
                toast.success("Subject deleted")
            } catch (e) {
                toast.error("Failed to delete subject")
            }
        })
        setConfirmOpen(true)
    }

    const confirmDeleteUnit = (sIdx: number, uIdx: number, topicCount: number) => {
        if (!token) return
        setConfirmTitle(`Delete Unit ${uIdx + 1}?`)
        setConfirmDesc(`This will delete the unit and all ${topicCount} topics inside it.`)
        setConfirmAction(() => async () => {
            const s = [...subjects]
            s[sIdx].syllabus.splice(uIdx, 1)
            setSubjects(s)
            try {
                await updateSyllabus(s[sIdx]._id, s[sIdx].syllabus, token)
                toast.success("Unit deleted")
            } catch (e) { toast.error("Failed to delete unit") }
        })
        setConfirmOpen(true)
    }

    const confirmDeleteTopic = (sIdx: number, uIdx: number, tIdx: number) => {
        if (!token) return
        setConfirmTitle("Delete Topic?")
        setConfirmDesc("Are you sure you want to remove this topic?")
        setConfirmAction(() => async () => {
            const s = [...subjects]
            s[sIdx].syllabus[uIdx].topics.splice(tIdx, 1)
            setSubjects(s)
            try {
                await updateSyllabus(s[sIdx]._id, s[sIdx].syllabus, token)
                toast.success("Topic deleted")
            } catch (e) { toast.error("Failed to delete topic") }
        })
        setConfirmOpen(true)
    }

    if (loading) return <div className="p-8">Loading Curriculum...</div>

    return (
        <PageTransition className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Curriculum Management</h1>
                    <p className="text-slate-500">Define subjects and topics for analysis.</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Subject</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Subject</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <Label>Subject Name</Label>
                            <Input
                                value={newSubjectName}
                                onChange={e => setNewSubjectName(e.target.value)}
                                placeholder="e.g. Data Structures"
                            />
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateSubject}>Create</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {subjects.map((subject, idx) => (
                    <motion.div
                        key={subject._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                    >
                        <Card className="bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full">
                            <CardHeader className="pb-2">
                                <CardTitle className="h-9 flex items-center">
                                    {editingSubject?.id === subject._id ? (
                                        <div className="flex items-center gap-1 w-full">
                                            <Input
                                                value={editingSubject.name}
                                                onChange={e => setEditingSubject({ id: editingSubject.id, name: e.target.value })}
                                                className="h-8"
                                                autoFocus
                                            />
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={saveSubjectName}><Check className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setEditingSubject(null)}><X className="h-4 w-4" /></Button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center w-full group">
                                            <span className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-blue-600" /> {subject.name}</span>
                                            <div className="flex items-center">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setEditingSubject({ id: subject._id, name: subject.name })}>
                                                    <Pencil className="h-3 w-3 text-slate-400" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600" onClick={() => confirmDeleteSubject(subject._id, subject.name)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardTitle>
                                <CardDescription>{subject.syllabus?.length || 0} Units Defined</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="single" collapsible className="w-full">
                                    {(subject.syllabus || []).map((unit: any, uIdx: number) => (
                                        <AccordionItem key={uIdx} value={`item-${uIdx}`}>
                                            <div className="flex items-center justify-between pr-4 hover:bg-slate-50 rounded-md group">
                                                {editingUnit?.sIdx === idx && editingUnit?.uIdx === uIdx ? (
                                                    <div className="flex items-center gap-2 flex-1 p-1" onClick={e => e.stopPropagation()}>
                                                        <Input
                                                            value={editingUnit.name}
                                                            onChange={e => setEditingUnit({ ...editingUnit, name: e.target.value })}
                                                            className="h-7 text-sm"
                                                            autoFocus
                                                        />
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={saveUnitName}><Check className="h-3 w-3" /></Button>
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => setEditingUnit(null)}><X className="h-3 w-3" /></Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <AccordionTrigger className="text-sm py-2 px-2 flex-1 hover:no-underline">
                                                            {unit.unit}
                                                        </AccordionTrigger>
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => {
                                                                e.stopPropagation()
                                                                setEditingUnit({ sIdx: idx, uIdx, name: unit.unit })
                                                            }}>
                                                                <Pencil className="h-3 w-3" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={(e) => {
                                                                e.stopPropagation()
                                                                confirmDeleteUnit(idx, uIdx, unit.topics?.length || 0)
                                                            }}>
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                            <span className="text-xs text-slate-400 w-12 text-right">{unit.topics?.length || 0} topics</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            <AccordionContent>
                                                <ul className="space-y-1 pl-4 text-sm text-slate-600">
                                                    {(unit.topics || []).map((t: string, tIdx: number) => (
                                                        <li key={tIdx} className="flex justify-between items-center group/topic hover:bg-slate-50 p-1 rounded">
                                                            <span className="list-disc list-item ml-4">{t}</span>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-5 w-5 opacity-0 group-hover/topic:opacity-100 text-red-400 hover:text-red-600"
                                                                onClick={() => confirmDeleteTopic(idx, uIdx, tIdx)}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </li>
                                                    ))}
                                                </ul>
                                                <Button variant="ghost" size="sm" className="mt-2 h-6 text-xs w-full" onClick={() => openAddTopic(idx, uIdx)}>
                                                    + Add Topic
                                                </Button>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                                <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => addUnit(idx)}>
                                    + Add Unit
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}

                {subjects.length === 0 && (
                    <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg text-slate-400">
                        No subjects defined yet. Add curriculum to enable topic-wise analysis.
                    </div>
                )}
            </div>

            <ConfirmModal
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title={confirmTitle}
                description={confirmDesc}
                onConfirm={confirmAction}
                variant="destructive"
            />

            <Dialog open={addTopicOpen} onOpenChange={setAddTopicOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Topic</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Topic Name</Label>
                        <Input
                            value={topicName}
                            onChange={e => setTopicName(e.target.value)}
                            placeholder="e.g. B-Trees"
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddTopic() }}
                        />
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAddTopic}>Add Topic</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageTransition>
    )
}
