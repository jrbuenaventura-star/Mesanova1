"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

type GiftCardProduct = {
  id: string
  name: string
  slug: string
  description: string | null
  amount: number
  image_url: string | null
  allow_custom_amount: boolean
  min_custom_amount: number
  max_custom_amount: number | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

type FormState = {
  id: string | null
  name: string
  slug: string
  description: string
  amount: string
  image_url: string
  allow_custom_amount: boolean
  min_custom_amount: string
  max_custom_amount: string
  is_active: boolean
  sort_order: string
}

const EMPTY_FORM: FormState = {
  id: null,
  name: "",
  slug: "",
  description: "",
  amount: "",
  image_url: "",
  allow_custom_amount: false,
  min_custom_amount: "10000",
  max_custom_amount: "",
  is_active: true,
  sort_order: "0",
}

function toMoney(value: number) {
  return `$${Number(value || 0).toLocaleString("es-CO")}`
}

export function GiftCardProductsManagement() {
  const { toast } = useToast()
  const [records, setRecords] = useState<GiftCardProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const editing = useMemo(() => !!form.id, [form.id])

  const loadRecords = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/gift-card-products", { cache: "no-store" })
      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "No se pudo cargar el catálogo")
      }
      setRecords(payload.records || [])
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo cargar el catálogo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadRecords()
  }, [loadRecords])

  const resetForm = () => {
    setForm(EMPTY_FORM)
  }

  const submitForm = async () => {
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        amount: Number(form.amount),
        image_url: form.image_url,
        allow_custom_amount: form.allow_custom_amount,
        min_custom_amount: Number(form.min_custom_amount || 10000),
        max_custom_amount: form.max_custom_amount ? Number(form.max_custom_amount) : null,
        is_active: form.is_active,
        sort_order: Number(form.sort_order || 0),
      }

      const response = await fetch(
        editing ? `/api/admin/gift-card-products/${encodeURIComponent(form.id || "")}` : "/api/admin/gift-card-products",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "No fue posible guardar el bono")
      }

      toast({
        title: editing ? "Bono actualizado" : "Bono creado",
        description: `Se ${editing ? "actualizó" : "creó"} ${result.record?.name || "el bono"}.`,
      })

      resetForm()
      await loadRecords()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar el bono",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (record: GiftCardProduct) => {
    setForm({
      id: record.id,
      name: record.name,
      slug: record.slug,
      description: record.description || "",
      amount: String(record.amount),
      image_url: record.image_url || "",
      allow_custom_amount: record.allow_custom_amount,
      min_custom_amount: String(record.min_custom_amount),
      max_custom_amount: record.max_custom_amount === null ? "" : String(record.max_custom_amount),
      is_active: record.is_active,
      sort_order: String(record.sort_order),
    })
  }

  const removeRecord = async (record: GiftCardProduct) => {
    const confirmed = window.confirm(`¿Eliminar el bono \"${record.name}\"?`)
    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/gift-card-products/${encodeURIComponent(record.id)}`, {
        method: "DELETE",
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "No se pudo eliminar el bono")
      }

      toast({ title: "Bono eliminado", description: `${record.name} fue eliminado.` })
      await loadRecords()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar el bono",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Bonos de Regalo (Catálogo de Venta)</h2>
          <p className="text-muted-foreground text-sm">
            Configura los bonos que aparecen en <code>/bonos/comprar</code>.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadRecords()} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Recargar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Editar bono" : "Crear bono"}</CardTitle>
          <CardDescription>
            Define nombre, monto y reglas de monto personalizado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bono-name">Nombre</Label>
              <Input
                id="bono-name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Bono Regalo $100.000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bono-slug">Slug</Label>
              <Input
                id="bono-slug"
                value={form.slug}
                onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
                placeholder="bono-100000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bono-amount">Monto base</Label>
              <Input
                id="bono-amount"
                type="number"
                min={1}
                step={1000}
                value={form.amount}
                onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bono-order">Orden</Label>
              <Input
                id="bono-order"
                type="number"
                step={1}
                value={form.sort_order}
                onChange={(event) => setForm((prev) => ({ ...prev, sort_order: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bono-image">Imagen URL (opcional)</Label>
              <Input
                id="bono-image"
                value={form.image_url}
                onChange={(event) => setForm((prev) => ({ ...prev, image_url: event.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center gap-3 pt-8">
              <Checkbox
                id="bono-active"
                checked={form.is_active}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, is_active: Boolean(checked) }))
                }
              />
              <Label htmlFor="bono-active">Activo en tienda</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bono-description">Descripción</Label>
            <Textarea
              id="bono-description"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              rows={3}
              placeholder="Descripción visible para el cliente"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 pt-8">
              <Checkbox
                id="bono-custom"
                checked={form.allow_custom_amount}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, allow_custom_amount: Boolean(checked) }))
                }
              />
              <Label htmlFor="bono-custom">Permitir monto personalizado</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bono-min-custom">Monto mínimo personalizado</Label>
              <Input
                id="bono-min-custom"
                type="number"
                min={1}
                step={1000}
                value={form.min_custom_amount}
                onChange={(event) => setForm((prev) => ({ ...prev, min_custom_amount: event.target.value }))}
                disabled={!form.allow_custom_amount}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bono-max-custom">Monto máximo personalizado (opcional)</Label>
              <Input
                id="bono-max-custom"
                type="number"
                min={1}
                step={1000}
                value={form.max_custom_amount}
                onChange={(event) => setForm((prev) => ({ ...prev, max_custom_amount: event.target.value }))}
                disabled={!form.allow_custom_amount}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => void submitForm()} disabled={saving}>
              {editing ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
              {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear bono"}
            </Button>
            {editing && (
              <Button variant="outline" onClick={resetForm} disabled={saving}>
                Cancelar edición
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bonos configurados</CardTitle>
          <CardDescription>
            {loading ? "Cargando..." : `${records.length} bono(s) en catálogo`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Personalizado</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                      No hay bonos configurados.
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="font-medium">{record.name}</div>
                        <div className="text-xs text-muted-foreground">/{record.slug}</div>
                      </TableCell>
                      <TableCell>{toMoney(record.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={record.is_active ? "default" : "secondary"}>
                          {record.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.allow_custom_amount ? (
                          <span className="text-xs">
                            Sí ({toMoney(record.min_custom_amount)} -
                            {record.max_custom_amount ? ` ${toMoney(record.max_custom_amount)}` : " sin tope"})
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell>{record.sort_order}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => startEdit(record)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => void removeRecord(record)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
