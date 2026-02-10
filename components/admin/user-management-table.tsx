"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"
import { Pencil, Trash2 } from "lucide-react"

type User = {
  id: string
  full_name: string | null
  phone: string | null
  role: "superadmin" | "distributor" | "end_user" | "aliado"
  is_active: boolean
  created_at: string
  last_login_at: string | null
}

export function UserManagementTable({ users }: { users: User[] }) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editFormData, setEditFormData] = useState({ full_name: "", phone: "" })
  const router = useRouter()
  const supabase = createClient()

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setEditFormData({ full_name: user.full_name || "", phone: user.phone || "" })
    setShowEditDialog(true)
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setShowDeleteDialog(true)
  }

  const handleEditUser = async () => {
    if (!selectedUser) return
    setIsUpdating(selectedUser.id)

    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ full_name: editFormData.full_name, phone: editFormData.phone })
        .eq("id", selectedUser.id)

      if (error) throw error

      setShowEditDialog(false)
      router.refresh()
    } catch (error) {
      console.error("Error updating user:", error)
      alert("Error al actualizar usuario")
    } finally {
      setIsUpdating(null)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    setIsUpdating(selectedUser.id)

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`,
        {
          method: "DELETE",
        }
      )

      const data = (await res.json()) as { success?: boolean; error?: string }

      if (!res.ok) {
        throw new Error(data.error || "Error al eliminar usuario")
      }

      setShowDeleteDialog(false)
      router.refresh()
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("Error al eliminar usuario")
    } finally {
      setIsUpdating(null)
    }
  }


  return (
    <>
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Teléfono</TableHead>
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
                  <div className="text-xs text-muted-foreground">{user.id.slice(0, 8)}…</div>
                </TableCell>
                <TableCell className="text-sm">
                  {user.phone || <span className="text-muted-foreground">—</span>}
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
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(user)}
                      disabled={isUpdating === user.id}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(user)}
                      disabled={isUpdating === user.id}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica la información del usuario
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre Completo</Label>
              <Input
                id="full_name"
                value={editFormData.full_name}
                onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                placeholder="+57 300 123 4567"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditUser} disabled={isUpdating === selectedUser?.id}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el usuario{" "}
              <strong>{selectedUser?.full_name || "Sin nombre"}</strong> y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isUpdating === selectedUser?.id}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
