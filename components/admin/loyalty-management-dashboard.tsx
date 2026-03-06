"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Award, Download, RefreshCw, Save } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

type LoyaltyConfig = {
  points_per_dollar: number
  points_for_review: number
  points_for_referral: number
  silver_threshold: number
  gold_threshold: number
  platinum_threshold: number
  points_per_dollar_redemption: number
  min_redemption_points: number
  points_expire_months: number
}

type LoyaltyUser = {
  user_id: string
  full_name: string | null
  role: string | null
  total_points: number
  available_points: number
  pending_points: number
  redeemed_points: number
  tier: string
  updated_at: string | null
}

type LoyaltyTransaction = {
  id: string
  user_id: string
  admin_user_id: string | null
  transaction_type: string
  points: number
  description: string | null
  created_at: string
  user_name: string | null
  admin_name: string | null
}

const DEFAULT_CONFIG: LoyaltyConfig = {
  points_per_dollar: 1,
  points_for_review: 50,
  points_for_referral: 100,
  silver_threshold: 1000,
  gold_threshold: 5000,
  platinum_threshold: 15000,
  points_per_dollar_redemption: 100,
  min_redemption_points: 500,
  points_expire_months: 12,
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString("es-CO")
}

function formatDate(value: string | null) {
  if (!value) return "N/D"
  return new Date(value).toLocaleString("es-CO")
}

export function LoyaltyManagementDashboard() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [savingAdjustment, setSavingAdjustment] = useState(false)
  const [search, setSearch] = useState("")
  const [transactionsSearch, setTransactionsSearch] = useState("")
  const [transactionsType, setTransactionsType] = useState("adjustment")
  const [transactionsFrom, setTransactionsFrom] = useState("")
  const [transactionsTo, setTransactionsTo] = useState("")
  const [config, setConfig] = useState<LoyaltyConfig>(DEFAULT_CONFIG)
  const [users, setUsers] = useState<LoyaltyUser[]>([])
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [adjustmentPoints, setAdjustmentPoints] = useState("")
  const [adjustmentReason, setAdjustmentReason] = useState("")

  const selectedUser = useMemo(
    () => users.find((user) => user.user_id === selectedUserId) || null,
    [selectedUserId, users]
  )

  const buildTransactionsUrl = useCallback(
    (format: "json" | "csv" = "json") => {
      const url = new URL("/api/admin/loyalty/transactions", window.location.origin)
      url.searchParams.set("type", transactionsType || "all")
      url.searchParams.set("limit", "300")

      if (transactionsSearch.trim()) {
        url.searchParams.set("search", transactionsSearch.trim())
      }
      if (transactionsFrom) {
        url.searchParams.set("from", transactionsFrom)
      }
      if (transactionsTo) {
        url.searchParams.set("to", transactionsTo)
      }
      if (format === "csv") {
        url.searchParams.set("format", "csv")
      }

      return url.toString()
    },
    [transactionsFrom, transactionsSearch, transactionsTo, transactionsType]
  )

  const loadTransactions = useCallback(async () => {
    setLoadingTransactions(true)
    try {
      const response = await fetch(buildTransactionsUrl("json"), { cache: "no-store" })
      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "No se pudo cargar historial")
      }
      setTransactions((payload.transactions || []) as LoyaltyTransaction[])
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo cargar historial",
        variant: "destructive",
      })
    } finally {
      setLoadingTransactions(false)
    }
  }, [buildTransactionsUrl, toast])

  const loadData = useCallback(
    async (searchValue?: string) => {
      setLoading(true)
      try {
        const url = new URL("/api/admin/loyalty", window.location.origin)
        if (searchValue && searchValue.trim()) {
          url.searchParams.set("search", searchValue.trim())
        }

        const response = await fetch(url.toString(), { cache: "no-store" })
        const payload = await response.json()
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || "No se pudo cargar datos de lealtad")
        }

        setConfig({
          ...DEFAULT_CONFIG,
          ...(payload.config || {}),
        })
        setUsers(payload.users || [])

        if (payload.users?.length && !selectedUserId) {
          setSelectedUserId(payload.users[0].user_id)
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "No se pudo cargar datos de lealtad",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [selectedUserId, toast]
  )

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    void loadTransactions()
  }, [loadTransactions])

  const saveConfig = async () => {
    setSavingConfig(true)
    try {
      const response = await fetch("/api/admin/loyalty", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "No se pudo guardar la configuración")
      }

      setConfig({ ...DEFAULT_CONFIG, ...(payload.config || {}) })
      toast({ title: "Configuración guardada", description: "Parámetros de lealtad actualizados." })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar la configuración",
        variant: "destructive",
      })
    } finally {
      setSavingConfig(false)
    }
  }

  const applyAdjustment = async () => {
    if (!selectedUser) {
      toast({ title: "Selecciona un usuario", description: "Debes seleccionar un usuario para ajustar puntos." })
      return
    }

    const points = Number(adjustmentPoints)
    if (!Number.isInteger(points) || points === 0) {
      toast({
        title: "Ajuste inválido",
        description: "El ajuste debe ser un entero diferente de 0.",
        variant: "destructive",
      })
      return
    }

    setSavingAdjustment(true)
    try {
      const response = await fetch("/api/admin/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUser.user_id,
          points,
          description: adjustmentReason,
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "No se pudo aplicar el ajuste")
      }

      toast({
        title: "Ajuste aplicado",
        description: `Se aplicó ${points > 0 ? "+" : ""}${points} puntos a ${selectedUser.full_name || selectedUser.user_id}.`,
      })

      setAdjustmentPoints("")
      setAdjustmentReason("")
      await loadData(search)
      await loadTransactions()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo aplicar el ajuste",
        variant: "destructive",
      })
    } finally {
      setSavingAdjustment(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Configuración de Lealtad
          </CardTitle>
          <CardDescription>Controla reglas de acumulación, canje y niveles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="points_per_dollar">Puntos por $1</Label>
              <Input
                id="points_per_dollar"
                type="number"
                min={0.01}
                step={0.01}
                value={config.points_per_dollar}
                onChange={(event) =>
                  setConfig((prev) => ({ ...prev, points_per_dollar: Number(event.target.value) || 0 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="points_for_review">Puntos por reseña</Label>
              <Input
                id="points_for_review"
                type="number"
                min={1}
                step={1}
                value={config.points_for_review}
                onChange={(event) =>
                  setConfig((prev) => ({ ...prev, points_for_review: Number(event.target.value) || 0 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="points_for_referral">Puntos por referido</Label>
              <Input
                id="points_for_referral"
                type="number"
                min={1}
                step={1}
                value={config.points_for_referral}
                onChange={(event) =>
                  setConfig((prev) => ({ ...prev, points_for_referral: Number(event.target.value) || 0 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="silver_threshold">Umbral Silver</Label>
              <Input
                id="silver_threshold"
                type="number"
                min={1}
                step={1}
                value={config.silver_threshold}
                onChange={(event) =>
                  setConfig((prev) => ({ ...prev, silver_threshold: Number(event.target.value) || 0 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gold_threshold">Umbral Gold</Label>
              <Input
                id="gold_threshold"
                type="number"
                min={1}
                step={1}
                value={config.gold_threshold}
                onChange={(event) =>
                  setConfig((prev) => ({ ...prev, gold_threshold: Number(event.target.value) || 0 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platinum_threshold">Umbral Platinum</Label>
              <Input
                id="platinum_threshold"
                type="number"
                min={1}
                step={1}
                value={config.platinum_threshold}
                onChange={(event) =>
                  setConfig((prev) => ({ ...prev, platinum_threshold: Number(event.target.value) || 0 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="points_per_dollar_redemption">Puntos por $1 canje</Label>
              <Input
                id="points_per_dollar_redemption"
                type="number"
                min={1}
                step={1}
                value={config.points_per_dollar_redemption}
                onChange={(event) =>
                  setConfig((prev) => ({ ...prev, points_per_dollar_redemption: Number(event.target.value) || 0 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_redemption_points">Mínimo canje</Label>
              <Input
                id="min_redemption_points"
                type="number"
                min={1}
                step={1}
                value={config.min_redemption_points}
                onChange={(event) =>
                  setConfig((prev) => ({ ...prev, min_redemption_points: Number(event.target.value) || 0 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="points_expire_months">Vencimiento (meses)</Label>
              <Input
                id="points_expire_months"
                type="number"
                min={1}
                step={1}
                value={config.points_expire_months}
                onChange={(event) =>
                  setConfig((prev) => ({ ...prev, points_expire_months: Number(event.target.value) || 0 }))
                }
              />
            </div>
          </div>

          <Button onClick={() => void saveConfig()} disabled={savingConfig}>
            <Save className="mr-2 h-4 w-4" />
            {savingConfig ? "Guardando..." : "Guardar configuración"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Usuarios y puntos</CardTitle>
              <CardDescription>
                {loading ? "Cargando..." : `${users.length} usuario(s) listados`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre o ID"
                className="w-64"
              />
              <Button variant="outline" onClick={() => void loadData(search)} disabled={loading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Buscar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Disponibles</TableHead>
                  <TableHead>Pendientes</TableHead>
                  <TableHead>Canjeados</TableHead>
                  <TableHead>Actualizado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                      No hay usuarios para mostrar.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow
                      key={user.user_id}
                      className={selectedUserId === user.user_id ? "bg-muted/50" : ""}
                      onClick={() => setSelectedUserId(user.user_id)}
                    >
                      <TableCell>
                        <div className="font-medium">{user.full_name || "Sin nombre"}</div>
                        <div className="text-xs text-muted-foreground">{user.user_id}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{String(user.tier || "bronze")}</Badge>
                      </TableCell>
                      <TableCell>{formatNumber(user.total_points)}</TableCell>
                      <TableCell>{formatNumber(user.available_points)}</TableCell>
                      <TableCell>{formatNumber(user.pending_points)}</TableCell>
                      <TableCell>{formatNumber(user.redeemed_points)}</TableCell>
                      <TableCell>{formatDate(user.updated_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="adjustment-reason">Motivo del ajuste</Label>
              <Textarea
                id="adjustment-reason"
                rows={2}
                value={adjustmentReason}
                onChange={(event) => setAdjustmentReason(event.target.value)}
                placeholder="Ej: compensación por incidente #123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjustment-points">Puntos (+/-)</Label>
              <Input
                id="adjustment-points"
                type="number"
                step={1}
                value={adjustmentPoints}
                onChange={(event) => setAdjustmentPoints(event.target.value)}
                placeholder="Ej: 150 o -80"
              />
            </div>
            <div className="space-y-2">
              <Label>Usuario seleccionado</Label>
              <div className="rounded-md border px-3 py-2 text-sm">
                {selectedUser ? selectedUser.full_name || selectedUser.user_id : "Selecciona un usuario"}
              </div>
            </div>
            <div className="flex items-end">
              <Button onClick={() => void applyAdjustment()} disabled={savingAdjustment || !selectedUser}>
                {savingAdjustment ? "Aplicando..." : "Aplicar ajuste"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Historial auditable de transacciones</CardTitle>
              <CardDescription>
                {loadingTransactions ? "Cargando..." : `${transactions.length} transacción(es)`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => void loadTransactions()} disabled={loadingTransactions}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Filtrar
              </Button>
              <Button variant="outline" onClick={() => (window.location.href = buildTransactionsUrl("csv"))}>
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Input
              value={transactionsSearch}
              onChange={(event) => setTransactionsSearch(event.target.value)}
              placeholder="Usuario (nombre o ID)"
            />
            <Select value={transactionsType} onValueChange={setTransactionsType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="adjustment">Ajustes</SelectItem>
                <SelectItem value="purchase">Compras</SelectItem>
                <SelectItem value="review">Reseñas</SelectItem>
                <SelectItem value="referral">Referidos</SelectItem>
                <SelectItem value="bonus">Bonos</SelectItem>
                <SelectItem value="redemption">Canjes</SelectItem>
                <SelectItem value="expiration">Vencimientos</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={transactionsFrom} onChange={(event) => setTransactionsFrom(event.target.value)} />
            <Input type="date" value={transactionsTo} onChange={(event) => setTransactionsTo(event.target.value)} />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Pts</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                      No hay transacciones para el filtro actual.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{formatDate(tx.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{tx.transaction_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>{tx.user_name || "Sin nombre"}</div>
                        <div className="text-xs text-muted-foreground">{tx.user_id}</div>
                      </TableCell>
                      <TableCell className={tx.points >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        {tx.points >= 0 ? "+" : ""}
                        {formatNumber(tx.points)}
                      </TableCell>
                      <TableCell>
                        {tx.admin_name || "N/D"}
                        {tx.admin_user_id && <div className="text-xs text-muted-foreground">{tx.admin_user_id}</div>}
                      </TableCell>
                      <TableCell>{tx.description || "Sin descripción"}</TableCell>
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
