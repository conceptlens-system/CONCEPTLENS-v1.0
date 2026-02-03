"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Chrome } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const result = await signIn("credentials", {
                username: email,
                password: password,
                redirect: false,
            })

            if (result?.ok) {
                // Fetch session to check role
                const sessionRes = await fetch("/api/auth/session")
                const session = await sessionRes.json()

                if (session?.user?.role === "admin") {
                    router.push("/admin")
                } else if (session?.user?.role === "student") {
                    router.push("/student")
                } else {
                    router.push("/professor")
                }
            } else {
                toast.error("Login Failed. Please check your credentials.")
            }
        } catch (err) {
            console.error(err)
            toast.error("An unexpected error occurred.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleLogin = () => {
        // We cannot force role easily here without backend sync on callback
        // This will rely on next-auth callbackUrl default or middleware
        signIn("google", { callbackUrl: "/professor" })
    }

    return (
        <div className="flex h-screen items-center justify-center bg-slate-50">
            <Card className="w-[400px]">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">CONCEPTLENS</CardTitle>
                    <CardDescription className="text-center">Academic Analytics Portal</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Main Login */}
                    <div className="space-y-4">
                        <div className="text-sm font-medium text-slate-500 text-center uppercase tracking-wider">Login</div>
                        <form onSubmit={handleLogin} className="space-y-3">
                            <div className="space-y-1">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" placeholder="email@conceptlens.edu" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <Button variant="link" className="px-0 font-normal h-auto text-xs" asChild>
                                        <a href="/forgot-password">Forgot password?</a>
                                    </Button>
                                </div>
                                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Signing in..." : "Login"}
                            </Button>
                        </form>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-slate-500">Or continue with</span>
                            </div>
                        </div>

                        <Button variant="outline" type="button" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
                            <Chrome className="mr-2 h-4 w-4" />
                            Sign in with Google
                        </Button>

                        <Button variant="link" className="p-0 h-auto font-normal" asChild>
                            <a href="/signup">Sign up</a>
                        </Button>
                    </div>

                    <div className="text-center text-xs text-slate-400 mt-4">
                        Are you a professor?{" "}
                        <Button variant="link" className="p-0 h-auto font-normal text-xs" asChild>
                            <a href="/request-access">Request Access</a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
