"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Check, X } from "lucide-react"

type User = {
  id: string
  full_name: string | null
  role: "superadmin" | "distributor" | "end_user" | "aliado"
  is_active: boolean
  created_at: string
  last_login_at: string | null
}

export function UserManagementTable({ users }: { users: User[] }) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const updateUserRole = async (userId: string, newRole: string) => {
    setIsUpdating(userId)

    try {
      const { error } = await supabase.from("user_profiles").update({ role: newRole }).eq("id", userId)

      if (error) throw error

      // Si se cambia a distribuidor, crear registro en tabla distributors
      if (newRole === "distributor") {
        const { data: existingDistributor } = await supabase
          .from("distributors")
          .select("id")
          .eq("user_id", userId)
          .single()

        if (!existingDistributor) {
          await supabase.from("distributors").insert({
            user_id: userId,
            company_name: "Por configurar",
            requires_approval: false,
          })
        }
      }

      router.refresh()
    } catch (error) {
      console.error("Error updating user role:", error)
    } finally {
      setIsUpdating(null)
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setIsUpdating(userId)

    try {
      const { error } = await supabase.from("user_profiles").update({ is_active: !currentStatus }).eq("id", userId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error updating user status:", error)
    } finally {
      setIsUpdating(null)
    }
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      superadmin: "destructive",
      distributor: "default",
      end_user: "secondary",
      aliado: "default",
    }

    const labels: Record<string, string> = {
      superadmin: "Superadmin",
      distributor: "Distribuidor",
      end_user: "Cliente",
      aliado: "Aliado",
    }

    return <Badge variant={variants[role] || "secondary"}>{labels[role] || role}</Badge>
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Rol Actual</TableHead>
            <TableHead>Cambiar Rol</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Último Login</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="font-medium">{user.full_name || "Sin nombre"}</div>
                <div className="text-sm text-muted-foreground">{user.id}</div>
              </TableCell>
              <TableCell>{getRoleBadge(user.role)}</TableCell>
              <TableCell>
                <Select
                  value={user.role}
                  onValueChange={(value) => updateUserRole(user.id, value)}
                  disabled={isUpdating === user.id}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="end_user">Cliente</SelectItem>
                    <SelectItem value="distributor">Distribuidor</SelectItem>
                    <SelectItem value="aliado">Aliado</SelectItem>
                    <SelectItem value="superadmin">Superadmin</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Badge variant={user.is_active ? "default" : "secondary"}>
                  {user.is_active ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "Nunca"}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleUserStatus(user.id, user.is_active)}
                  disabled={isUpdating === user.id}
                >
                  {user.is_active ? (
                    <X className="h-4 w-4 text-destructive" />
                  ) : (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
