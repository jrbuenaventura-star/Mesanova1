"use client"

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { buildLegalClause } from "@/lib/delivery/constants"
import { enqueueOfflineDeliveryAction } from "@/lib/delivery/offline-client"

type DeliveryOrderView = {
  order_id: string
  order_number: string
  customer_name: string | null
  shipping_address: string | null
  warehouse_id: string
  warehouse_name: string | null
  status: string | null
  total_packages: number
  packages: Array<{
    package_number: number
    total_packages: number
    customer_number: string | null
    provider_barcode: string | null
    quantity_total: number
  }>
  items: Array<{
    sku: string
    name: string
    quantity_total: number
    package_distribution: Array<{
      package_number: number
      quantity: number
    }>
  }>
}

interface DeliveryConfirmationClientProps {
  token: string
}

type ConfirmationResult = {
  confirmation_id?: string
  result?: string
  pqrs_ticket?: {
    id: string
    ticket_number: string
  } | null
  evidence_pdf_url?: string
  admin_pqrs_url?: string
}

function formatDate(value?: string | null) {
  if (!value) return "N/A"
  return new Date(value).toLocaleString("es-CO")
}

function parseError(payload: unknown) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const maybe = (payload as { error?: unknown }).error
    if (typeof maybe === "string" && maybe.trim()) return maybe
  }
  return "No se pudo completar la operación"
}

async function hashSha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

function getDeviceId() {
  const key = "mesanova.delivery.device-id"
  const existing = window.localStorage.getItem(key)
  if (existing) {
    return existing
  }
  const generated = crypto.randomUUID()
  window.localStorage.setItem(key, generated)
  return generated
}

export function DeliveryConfirmationClient({ token }: DeliveryConfirmationClientProps) {
  const { toast } = useToast()
  const [scanLoading, setScanLoading] = useState(true)
  const [scanData, setScanData] = useState<{
    qr_id: string
    order_hint: string
    warehouse_id: string
    delivery_batch_id: string
    status: string
    expires_at: string
  } | null>(null)
  const [destination, setDestination] = useState("")
  const [channel, setChannel] = useState<"sms" | "whatsapp">("sms")
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [debugOtp, setDebugOtp] = useState<string | null>(null)
  const [otpCode, setOtpCode] = useState("")
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [orderView, setOrderView] = useState<DeliveryOrderView | null>(null)
  const [signatureName, setSignatureName] = useState("")
  const [acceptanceMode, setAcceptanceMode] = useState<"total" | "parcial" | "rechazado">("total")
  const [acceptedPackages, setAcceptedPackages] = useState<number[]>([])
  const [legalAccepted, setLegalAccepted] = useState(false)
  const [geo, setGeo] = useState<{ lat: number; lng: number; accuracy: number } | null>(null)
  const [partialReason, setPartialReason] = useState("")
  const [incidentEnabled, setIncidentEnabled] = useState(false)
  const [incidentInvoiceNumber, setIncidentInvoiceNumber] = useState("")
  const [incidentProductReference, setIncidentProductReference] = useState("")
  const [incidentDefectiveQty, setIncidentDefectiveQty] = useState("")
  const [incidentDescription, setIncidentDescription] = useState("")
  const [claimantName, setClaimantName] = useState("")
  const [claimantContact, setClaimantContact] = useState("")
  const [incidentEvidenceFiles, setIncidentEvidenceFiles] = useState<File[]>([])
  const [incidentGuideFile, setIncidentGuideFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState<ConfirmationResult | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)
  const hasSignatureStrokeRef = useRef(false)

  const legalClause = useMemo(() => buildLegalClause(orderView?.order_id || "[order_id]"), [orderView?.order_id])

  useEffect(() => {
    const loadScan = async () => {
      setScanLoading(true)
      try {
        const response = await fetch("/api/delivery/scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        })
        const payload = await response.json()
        if (!response.ok) {
          throw new Error(parseError(payload))
        }
        setScanData(payload)
      } catch (error) {
        toast({
          title: "QR inválido",
          description: error instanceof Error ? error.message : "No se pudo validar el QR",
          variant: "destructive",
        })
      } finally {
        setScanLoading(false)
      }
    }
    void loadScan()
  }, [token, toast])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = "#111827"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
  }, [])

  const requestOtp = async () => {
    try {
      if (!destination.trim()) {
        throw new Error("Ingresa tu teléfono para recibir OTP")
      }
      const response = await fetch("/api/delivery/otp/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          channel,
          destination: destination.trim(),
          device: typeof navigator !== "undefined" ? navigator.userAgent : "web",
          geo_lat: geo?.lat,
          geo_lng: geo?.lng,
        }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(parseError(payload))
      }
      setChallengeId(payload.challenge_id)
      setDebugOtp(payload.debug_otp || null)
      toast({
        title: "OTP enviado",
        description: `Código enviado por ${channel.toUpperCase()}.`,
      })
    } catch (error) {
      toast({
        title: "Error OTP",
        description: error instanceof Error ? error.message : "No se pudo enviar OTP",
        variant: "destructive",
      })
    }
  }

  const verifyOtp = async () => {
    try {
      if (!challengeId) {
        throw new Error("Primero solicita el OTP")
      }
      if (!otpCode.trim()) {
        throw new Error("Ingresa el OTP")
      }

      const response = await fetch("/api/delivery/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          challenge_id: challengeId,
          otp_code: otpCode.trim(),
          device: typeof navigator !== "undefined" ? navigator.userAgent : "web",
          geo_lat: geo?.lat,
          geo_lng: geo?.lng,
          geo_accuracy: geo?.accuracy,
        }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(parseError(payload))
      }

      setSessionToken(payload.session_token)
      setOrderView(payload.order)
      setAcceptedPackages((payload.order?.packages || []).map((pkg: { package_number: number }) => pkg.package_number))
      toast({
        title: "OTP validado",
        description: "Ya puedes confirmar la entrega.",
      })
    } catch (error) {
      toast({
        title: "OTP inválido",
        description: error instanceof Error ? error.message : "No se pudo validar OTP",
        variant: "destructive",
      })
    }
  }

  const getCanvasCoordinates = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  const startDraw = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    drawingRef.current = true
    const point = getCanvasCoordinates(event)
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
  }

  const draw = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const point = getCanvasCoordinates(event)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    hasSignatureStrokeRef.current = true
  }

  const endDraw = () => {
    drawingRef.current = false
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    hasSignatureStrokeRef.current = false
  }

  const requestGeo = () => {
    if (!("geolocation" in navigator)) {
      toast({
        title: "Geolocalización no disponible",
        description: "Tu navegador no soporta geolocalización",
        variant: "destructive",
      })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeo({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
      },
      (error) => {
        toast({
          title: "No se pudo obtener geolocalización",
          description: error.message,
          variant: "destructive",
        })
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  const submitConfirmation = async () => {
    try {
      if (!sessionToken || !orderView) {
        throw new Error("Primero valida OTP")
      }
      if (!legalAccepted) {
        throw new Error("Debes aceptar la cláusula legal")
      }
      if (!geo) {
        throw new Error("Debes autorizar geolocalización")
      }
      if (!hasSignatureStrokeRef.current) {
        throw new Error("La firma digital es obligatoria")
      }

      if (incidentEnabled) {
        if (
          !incidentInvoiceNumber.trim() ||
          !incidentProductReference.trim() ||
          !incidentDefectiveQty.trim()
        ) {
          throw new Error("Completa factura, referencia y cantidad defectuosa para la reclamación")
        }
        if (incidentEvidenceFiles.length === 0 || !incidentGuideFile) {
          throw new Error("Adjunta evidencia fotográfica y foto de la guía")
        }
        if (!navigator.onLine) {
          throw new Error("Reclamaciones con adjuntos requieren conexión para envío inmediato")
        }
      }

      const canvas = canvasRef.current
      if (!canvas) {
        throw new Error("No se pudo capturar la firma")
      }
      const signatureData = canvas.toDataURL("image/png")

      const deviceId = getDeviceId()
      const offlineTimestamp = new Date().toISOString()
      const gps = `${geo.lat},${geo.lng}`
      const offlineHash = await hashSha256(`${orderView.order_id}:${offlineTimestamp}:${gps}:${deviceId}`)

      if (!navigator.onLine) {
        await enqueueOfflineDeliveryAction({
          id: crypto.randomUUID(),
          endpoint: "/api/delivery/confirm",
          created_at: new Date().toISOString(),
          payload: {
            session_token: sessionToken,
            acceptance_mode: acceptanceMode,
            accepted_package_numbers: acceptedPackages,
            signature_data: signatureData,
            signature_name: signatureName.trim(),
            legal_clause_text: legalClause,
            legal_accepted: true,
            geo_lat: geo.lat,
            geo_lng: geo.lng,
            geo_accuracy: geo.accuracy,
            device_id: deviceId,
            partial_reason: partialReason.trim(),
            incident_enabled: false,
            offline_hash: offlineHash,
            offline_timestamp: offlineTimestamp,
          },
        })
        toast({
          title: "Entrega guardada offline",
          description: "Se sincronizará automáticamente al recuperar conexión.",
        })
        setConfirmed({
          result: "pendiente_sincronizacion",
        })
        return
      }

      setSubmitting(true)
      const payload = new FormData()
      payload.append("session_token", sessionToken)
      payload.append("acceptance_mode", acceptanceMode)
      payload.append("accepted_package_numbers", JSON.stringify(acceptedPackages))
      payload.append("signature_data", signatureData)
      payload.append("signature_name", signatureName.trim())
      payload.append("legal_clause_text", legalClause)
      payload.append("legal_accepted", "true")
      payload.append("geo_lat", String(geo.lat))
      payload.append("geo_lng", String(geo.lng))
      payload.append("geo_accuracy", String(geo.accuracy))
      payload.append("device_id", deviceId)
      payload.append("partial_reason", partialReason.trim())
      payload.append("incident_enabled", incidentEnabled ? "true" : "false")
      payload.append("offline_hash", offlineHash)
      payload.append("offline_timestamp", offlineTimestamp)
      payload.append("claimant_name", claimantName.trim())
      payload.append("claimant_contact", claimantContact.trim())

      if (incidentEnabled) {
        payload.append("incident_invoice_number", incidentInvoiceNumber.trim())
        payload.append("incident_product_reference", incidentProductReference.trim())
        payload.append("incident_defective_quantity", incidentDefectiveQty.trim())
        payload.append("incident_description", incidentDescription.trim())
        incidentEvidenceFiles.forEach((file) => payload.append("incident_evidence_files", file))
        if (incidentGuideFile) {
          payload.append("incident_guide_file", incidentGuideFile)
        }
      }

      const response = await fetch("/api/delivery/confirm", {
        method: "POST",
        body: payload,
      })
      const payloadResponse = await response.json()
      if (!response.ok) {
        throw new Error(parseError(payloadResponse))
      }

      setConfirmed(payloadResponse)
      toast({
        title: "Entrega confirmada",
        description:
          payloadResponse.result === "confirmado_con_incidente"
            ? "Entrega registrada con incidencia y ticket automático en PQRS."
            : "La entrega quedó registrada exitosamente.",
      })
    } catch (error) {
      toast({
        title: "No se pudo confirmar entrega",
        description: error instanceof Error ? error.message : "Error en la confirmación",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (scanLoading) {
    return <p className="text-sm text-muted-foreground">Validando QR...</p>
  }

  if (!scanData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>QR no válido</CardTitle>
          <CardDescription>El código no está disponible o expiró.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Validación de entrega</CardTitle>
          <CardDescription>
            QR {scanData.order_hint} | Bodega {scanData.warehouse_id} | Lote {scanData.delivery_batch_id}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Badge variant="outline">{scanData.status}</Badge>
          <p className="text-sm text-muted-foreground">Expira: {formatDate(scanData.expires_at)}</p>
        </CardContent>
      </Card>

      {!sessionToken && (
        <Card>
          <CardHeader>
            <CardTitle>1) Validación OTP obligatoria</CardTitle>
            <CardDescription>
              Se requiere OTP por SMS o WhatsApp antes de mostrar la información del pedido.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Teléfono destino</Label>
                <Input
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder="+573001112233"
                />
              </div>
              <div className="space-y-2">
                <Label>Canal OTP</Label>
                <Select value={channel} onValueChange={(value: "sms" | "whatsapp") => setChannel(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={requestOtp}>Solicitar OTP</Button>
              <Button variant="outline" onClick={requestGeo}>
                Autorizar geolocalización
              </Button>
            </div>

            {challengeId && (
              <div className="space-y-2">
                <Label>OTP</Label>
                <Input value={otpCode} onChange={(event) => setOtpCode(event.target.value)} placeholder="123456" />
                <Button onClick={verifyOtp}>Validar OTP</Button>
                {debugOtp && (
                  <p className="text-xs text-muted-foreground">
                    Entorno no productivo - OTP debug: <strong>{debugOtp}</strong>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {sessionToken && orderView && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>2) Datos del pedido (sin precios)</CardTitle>
              <CardDescription>Visible solo después de validar OTP.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 md:grid-cols-2">
                <p className="text-sm"><strong>Pedido:</strong> {orderView.order_number}</p>
                <p className="text-sm"><strong>Cliente:</strong> {orderView.customer_name || "N/A"}</p>
                <p className="text-sm"><strong>Dirección:</strong> {orderView.shipping_address || "N/A"}</p>
                <p className="text-sm"><strong>Bodega origen:</strong> {orderView.warehouse_name || orderView.warehouse_id}</p>
                <p className="text-sm"><strong>Total bultos:</strong> {orderView.total_packages}</p>
                <p className="text-sm"><strong>Estado:</strong> {orderView.status || "N/A"}</p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cant. total</TableHead>
                    <TableHead>Distribución por bulto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderView.items.map((item) => (
                    <TableRow key={`${item.sku}-${item.name}`}>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity_total}</TableCell>
                      <TableCell>
                        {item.package_distribution
                          .map((distribution) => `#${distribution.package_number}: ${distribution.quantity}`)
                          .join(" | ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3) Confirmación de entrega</CardTitle>
              <CardDescription>
                Marca bultos recibidos, firma digitalmente y acepta la cláusula legal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Modo de aceptación</Label>
                  <Select
                    value={acceptanceMode}
                    onValueChange={(value: "total" | "parcial" | "rechazado") => setAcceptanceMode(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="total">Aceptación total</SelectItem>
                      <SelectItem value="parcial">Aceptación parcial</SelectItem>
                      <SelectItem value="rechazado">Rechazar entrega</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nombre para firma</Label>
                  <Input
                    value={signatureName}
                    onChange={(event) => setSignatureName(event.target.value)}
                    placeholder="Nombre completo"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bultos recibidos</Label>
                <div className="grid gap-2 md:grid-cols-3">
                  {orderView.packages.map((pkg) => {
                    const checked = acceptedPackages.includes(pkg.package_number)
                    return (
                      <label
                        key={pkg.package_number}
                        className="flex items-center justify-between rounded border px-3 py-2 text-sm"
                      >
                        <span>
                          Bulto #{pkg.package_number} ({pkg.quantity_total} uds)
                        </span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            if (event.target.checked) {
                              setAcceptedPackages((prev) => [...new Set([...prev, pkg.package_number])])
                            } else {
                              setAcceptedPackages((prev) =>
                                prev.filter((packageNumber) => packageNumber !== pkg.package_number)
                              )
                            }
                          }}
                        />
                      </label>
                    )
                  })}
                </div>
              </div>

              {(acceptanceMode === "parcial" || acceptanceMode === "rechazado") && (
                <div className="space-y-2">
                  <Label>Motivo parcial/rechazo</Label>
                  <Textarea
                    value={partialReason}
                    onChange={(event) => setPartialReason(event.target.value)}
                    rows={3}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Firma digital</Label>
                <canvas
                  ref={canvasRef}
                  width={900}
                  height={260}
                  className="w-full rounded border bg-white touch-none"
                  onPointerDown={startDraw}
                  onPointerMove={draw}
                  onPointerUp={endDraw}
                  onPointerLeave={endDraw}
                />
                <Button variant="outline" size="sm" onClick={clearSignature}>
                  Limpiar firma
                </Button>
              </div>

              <div className="space-y-2 rounded border p-3">
                <p className="text-sm">{legalClause}</p>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={legalAccepted}
                    onChange={(event) => setLegalAccepted(event.target.checked)}
                  />
                  Acepto la cláusula legal de constancia digital.
                </label>
              </div>

              <div className="space-y-2">
                <Button variant="outline" onClick={requestGeo}>
                  {geo ? "Actualizar geolocalización" : "Autorizar geolocalización"}
                </Button>
                {geo && (
                  <p className="text-xs text-muted-foreground">
                    Lat: {geo.lat.toFixed(6)} | Lng: {geo.lng.toFixed(6)} | Precisión: {Math.round(geo.accuracy)}m
                  </p>
                )}
              </div>

              <div className="space-y-2 rounded border p-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={incidentEnabled}
                    onChange={(event) => setIncidentEnabled(event.target.checked)}
                  />
                  Registrar reclamación / incidencia en esta entrega
                </label>
                {incidentEnabled && (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Número de factura *</Label>
                      <Input
                        value={incidentInvoiceNumber}
                        onChange={(event) => setIncidentInvoiceNumber(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Referencia producto *</Label>
                      <Input
                        value={incidentProductReference}
                        onChange={(event) => setIncidentProductReference(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cantidad defectuosa *</Label>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        value={incidentDefectiveQty}
                        onChange={(event) => setIncidentDefectiveQty(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nombre solicitante</Label>
                      <Input
                        value={claimantName}
                        onChange={(event) => setClaimantName(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contacto solicitante</Label>
                      <Input
                        value={claimantContact}
                        onChange={(event) => setClaimantContact(event.target.value)}
                        placeholder="+573001112233"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Descripción incidencia</Label>
                      <Textarea
                        value={incidentDescription}
                        onChange={(event) => setIncidentDescription(event.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Evidencia fotográfica *</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(event) =>
                          setIncidentEvidenceFiles(
                            event.target.files ? Array.from(event.target.files) : []
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Foto de guía *</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                          setIncidentGuideFile(event.target.files?.[0] || null)
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <Button onClick={submitConfirmation} disabled={submitting}>
                {submitting ? "Confirmando..." : "Confirmar entrega"}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {confirmed && (
        <Card>
          <CardHeader>
            <CardTitle>4) Resultado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              <strong>Estado:</strong> {confirmed.result}
            </p>
            {confirmed.confirmation_id && (
              <p className="text-sm">
                <strong>ID confirmación:</strong> {confirmed.confirmation_id}
              </p>
            )}
            {confirmed.pqrs_ticket && (
              <p className="text-sm">
                <strong>Ticket PQRS:</strong> {confirmed.pqrs_ticket.ticket_number}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {confirmed.evidence_pdf_url && (
                <Button asChild variant="outline">
                  <a href={confirmed.evidence_pdf_url} target="_blank" rel="noreferrer noopener">
                    Descargar evidencia PDF
                  </a>
                </Button>
              )}
              {confirmed.admin_pqrs_url && (
                <Button asChild>
                  <Link href={confirmed.admin_pqrs_url} target="_blank">
                    Abrir PQRS admin
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
