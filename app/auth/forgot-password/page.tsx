"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()

    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/auth/reset-password`
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (resetError) throw resetError

      setSuccessMessage("Te enviamos un enlace de recuperación. Revisa tu correo y sigue las instrucciones.")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el correo de recuperación")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Recuperar contraseña</CardTitle>
            <CardDescription>Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              {successMessage ? <p className="text-sm text-green-700">{successMessage}</p> : null}
              <Button type="submit" className="w-full" disabled={isLoading} aria-label="Correo">
                <Mail className="h-4 w-4 mr-2" />
                {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
              </Button>
            </form>

            <Button variant="ghost" asChild className="w-full">
              <Link href="/auth/login">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Iniciar sesión
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
