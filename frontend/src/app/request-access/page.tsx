"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function RequestAccessPage() {
    const router = useRouter()
    const [institutes, setInstitutes] = useState<any[]>([])
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        institution_id: "",
        subject_expertise: ""
    })
    const [isLoading, setIsLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        fetch("http://localhost:8000/api/v1/institutes/")
            .then(res => res.json())
            .then(data => setInstitutes(data))
            .catch(err => console.error("Failed to fetch institutes"))
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)
        try {
            const res = await fetch("http://localhost:8000/api/v1/professors/request-access", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.detail || "Request failed")
            }

            setSubmitted(true)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setIsLoading(false)
        }
    }

    if (submitted) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="flexjustify-center mb-4">
                            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                        </div>
                        <CardTitle className="text-2xl">Request Submitted</CardTitle>
                        <CardDescription>
                            Your request for professor access has been sent for administrative approval. You will receive an email once approved.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link href="/login">Return to Login</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Professor Access Request</CardTitle>
                    <CardDescription className="text-center">
                        Join an institution to manage classes and exams.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-3 rounded bg-red-50 text-red-600 text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                placeholder="Dr. Jane Smith"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="professor@university.edu"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="institute">Institution</Label>
                            <Select
                                value={formData.institution_id}
                                onValueChange={(val) => setFormData({ ...formData, institution_id: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Institution" />
                                </SelectTrigger>
                                <SelectContent>
                                    {institutes.map(inst => (
                                        <SelectItem key={inst._id} value={inst._id}>
                                            {inst.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject Expertise</Label>
                            <Input
                                id="subject"
                                placeholder="Computer Science, Physics..."
                                value={formData.subject_expertise}
                                onChange={(e) => setFormData({ ...formData, subject_expertise: e.target.value })}
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Submitting..." : "Submit Request"}
                        </Button>
                    </form>
                    <div className="text-center text-sm text-slate-500 mt-4">
                        <Link href="/login" className="hover:underline">Cancel and Return to Login</Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
