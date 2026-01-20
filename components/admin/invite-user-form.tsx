"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { UserRole } from "@/lib/db/types"

export function InviteUserForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<UserRole>("end_user")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const onInvite = async () => {
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      })

      const data = (await res.json()) as { success?: boolean; error?: string }

      if (!res.ok) {
        throw new Error(data.error || "Error invitando usuario")
      }

      setSuccess("Invitación enviada")
      setEmail("")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error invitando usuario")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          type="email"
          placeholder="correo@dominio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
          <SelectTrigger className="md:w-[200px]">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="end_user">Cliente</SelectItem>
            <SelectItem value="distributor">Distribuidor</SelectItem>
            <SelectItem value="aliado">Aliado</SelectItem>
            <SelectItem value="superadmin">Superadmin</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={onInvite} disabled={isSubmitting || !email.trim()} className="md:w-[170px]">
          Invitar
        </Button>
      </div>

      {error ? <div className="text-sm text-destructive">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}
    </div>
  )
}
