"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowLeft, Save } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

export default function NuevoCuponPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed_amount" | "free_shipping",
    discountValue: "",
    minPurchaseAmount: "",
    maxDiscountAmount: "",
    maxUses: "",
    maxUsesPerUser: "1",
    applicableTo: "all" as "all" | "specific_products" | "specific_categories" | "specific_users",
    validFrom: "",
    validUntil: "",
    isPublic: true,
    status: "active" as "active" | "inactive",
  })

  const generateCode = () => {
    const code = `CUPON${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    setFormData({ ...formData, code })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.code || !formData.name) {
      toast.error("Código y nombre son requeridos")
      return
    }

    if (!formData.discountValue || parseFloat(formData.discountValue) <= 0) {
      toast.error("Valor de descuento debe ser mayor a 0")
      return
    }

    if (formData.discountType === "percentage" && parseFloat(formData.discountValue) > 100) {
      toast.error("El porcentaje no puede ser mayor a 100")
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const couponData = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description || null,
        discount_type: formData.discountType,
        discount_value: parseFloat(formData.discountValue),
        min_purchase_amount: formData.minPurchaseAmount ? parseFloat(formData.minPurchaseAmount) : 0,
        max_discount_amount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        max_uses: formData.maxUses ? parseInt(formData.maxUses) : null,
        max_uses_per_user: parseInt(formData.maxUsesPerUser),
        applicable_to: formData.applicableTo,
        valid_from: formData.validFrom || null,
        valid_until: formData.validUntil || null,
        is_public: formData.isPublic,
        status: formData.status,
        created_by: user?.id,
      }

      const { error } = await supabase
        .from("coupons")
        .insert(couponData)

      if (error) {
        if (error.code === "23505") {
          toast.error("El código de cupón ya existe")
          return
        }
        throw error
      }

      toast.success("Cupón creado exitosamente")
      router.push("/admin/cupones")
    } catch (error) {
      console.error("Error creating coupon:", error)
      toast.error("Error al crear cupón")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crear Nuevo Cupón</CardTitle>
          <CardDescription>Configura un nuevo cupón de descuento</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Código y Nombre */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Código del Cupón *</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="VERANO2026"
                    required
                    maxLength={50}
                  />
                  <Button type="button" variant="outline" onClick={generateCode}>
                    Generar
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Cupón *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Descuento Verano"
                  required
                />
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del cupón..."
                rows={3}
              />
            </div>

            {/* Tipo de Descuento */}
            <div className="space-y-2">
              <Label>Tipo de Descuento *</Label>
              <RadioGroup
                value={formData.discountType}
                onValueChange={(value: any) => setFormData({ ...formData, discountType: value })}
              >
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="percentage" id="percentage" />
                  <Label htmlFor="percentage" className="flex-1 cursor-pointer">
                    Porcentaje (%)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="fixed_amount" id="fixed_amount" />
                  <Label htmlFor="fixed_amount" className="flex-1 cursor-pointer">
                    Monto Fijo ($)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="free_shipping" id="free_shipping" />
                  <Label htmlFor="free_shipping" className="flex-1 cursor-pointer">
                    Envío Gratis
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Valor del Descuento */}
            {formData.discountType !== "free_shipping" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="discountValue">
                    Valor del Descuento * {formData.discountType === "percentage" ? "(%)" : "($)"}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder={formData.discountType === "percentage" ? "10" : "50000"}
                    min="0"
                    step={formData.discountType === "percentage" ? "0.01" : "1000"}
                    required
                  />
                </div>

                {formData.discountType === "percentage" && (
                  <div className="space-y-2">
                    <Label htmlFor="maxDiscountAmount">Descuento Máximo ($)</Label>
                    <Input
                      id="maxDiscountAmount"
                      type="number"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                      placeholder="100000"
                      min="0"
                      step="1000"
                    />
                    <p className="text-xs text-muted-foreground">
                      Opcional: Límite máximo de descuento
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Restricciones */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="minPurchaseAmount">Compra Mínima ($)</Label>
                <Input
                  id="minPurchaseAmount"
                  type="number"
                  value={formData.minPurchaseAmount}
                  onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                  placeholder="0"
                  min="0"
                  step="1000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUses">Usos Totales Máximos</Label>
                <Input
                  id="maxUses"
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  placeholder="Ilimitado"
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUsesPerUser">Usos por Usuario *</Label>
                <Input
                  id="maxUsesPerUser"
                  type="number"
                  value={formData.maxUsesPerUser}
                  onChange={(e) => setFormData({ ...formData, maxUsesPerUser: e.target.value })}
                  placeholder="1"
                  min="1"
                  required
                />
              </div>
            </div>

            {/* Validez */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="validFrom">Válido Desde</Label>
                <Input
                  id="validFrom"
                  type="datetime-local"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validUntil">Válido Hasta</Label>
                <Input
                  id="validUntil"
                  type="datetime-local"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>
            </div>

            {/* Aplicabilidad */}
            <div className="space-y-2">
              <Label htmlFor="applicableTo">Aplicable a</Label>
              <Select
                value={formData.applicableTo}
                onValueChange={(value: any) => setFormData({ ...formData, applicableTo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los productos</SelectItem>
                  <SelectItem value="specific_products">Productos específicos</SelectItem>
                  <SelectItem value="specific_categories">Categorías específicas</SelectItem>
                  <SelectItem value="specific_users">Usuarios específicos</SelectItem>
                </SelectContent>
              </Select>
              {formData.applicableTo !== "all" && (
                <p className="text-xs text-muted-foreground">
                  Nota: Deberás configurar los IDs específicos después de crear el cupón
                </p>
              )}
            </div>

            {/* Opciones */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isPublic">Cupón Público</Label>
                  <p className="text-sm text-muted-foreground">
                    Visible en la página de ofertas
                  </p>
                </div>
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Crear Cupón
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
