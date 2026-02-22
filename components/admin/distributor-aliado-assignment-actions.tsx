"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Link2Off, Save } from "lucide-react"

type AliadoOption = {
  id: string
  company_name: string
  is_active: boolean
}

interface DistributorAliadoAssignmentActionsProps {
  distributorId: string
  currentAliadoId: string | null
  aliados: AliadoOption[]
}

export function DistributorAliadoAssignmentActions({
  distributorId,
  currentAliadoId,
  aliados,
}: DistributorAliadoAssignmentActionsProps) {
  const router = useRouter()
  const [selectedAliadoId, setSelectedAliadoId] = useState<string>(currentAliadoId || "none")
  const [isPending, startTransition] = useTransition()

  const hasChanges = useMemo(
    () => (selectedAliadoId === "none" ? null : selectedAliadoId) !== currentAliadoId,
    [selectedAliadoId, currentAliadoId],
  )

  async function updateAssignment(aliadoId: string | null) {
    const response = await fetch(`/api/admin/distributors/${distributorId}/assignment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aliado_id: aliadoId }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data?.error || "No fue posible actualizar el aliado asignado")
    }
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await updateAssignment(selectedAliadoId === "none" ? null : selectedAliadoId)
        router.refresh()
      } catch (error) {
        alert(error instanceof Error ? error.message : "No fue posible actualizar el aliado asignado")
      }
    })
  }

  function handleUnlink() {
    startTransition(async () => {
      try {
        setSelectedAliadoId("none")
        await updateAssignment(null)
        router.refresh()
      } catch (error) {
        alert(error instanceof Error ? error.message : "No fue posible desvincular el aliado")
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedAliadoId} onValueChange={setSelectedAliadoId} disabled={isPending}>
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Sin aliado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Sin aliado</SelectItem>
          {aliados.map((aliado) => (
            <SelectItem key={aliado.id} value={aliado.id}>
              {aliado.company_name}
              {!aliado.is_active ? " (Inactivo)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button type="button" size="sm" variant="outline" onClick={handleSave} disabled={isPending || !hasChanges}>
        <Save className="mr-1 h-3 w-3" />
        Guardar
      </Button>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={handleUnlink}
        disabled={isPending || currentAliadoId === null}
        className="text-destructive"
      >
        <Link2Off className="mr-1 h-3 w-3" />
        Desvincular
      </Button>
    </div>
  )
}
