import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock3,
  XCircle,
  ShieldCheck,
  CalendarClock,
  Percent,
} from "lucide-react"
import { DistributorProfileForm } from "@/components/distributor/profile-form"
import { DocumentUploader } from "@/components/distributor/document-uploader"

type DistributorDocument = {
  id: string
  document_type: string
  file_name: string | null
  file_url: string | null
  status: string | null
  uploaded_at: string | null
  expires_at: string | null
  review_notes: string | null
}

const DOCUMENT_TYPES = [
  {
    type: "estados_financieros",
    label: "Estados Financieros",
    description: "Actualízalo anualmente antes de abril para conservar condiciones comerciales.",
    required: true,
  },
  {
    type: "rut",
    label: "RUT",
    description: "Registro Único Tributario vigente.",
    required: true,
  },
  {
    type: "camara_comercio",
    label: "Cámara de Comercio",
    description: "Certificado de existencia y representación legal.",
    required: true,
  },
  {
    type: "certificado_bancario",
    label: "Certificado Bancario",
    description: "Soporte de cuenta para pagos y devoluciones.",
    required: false,
  },
] as const

const formatDate = (value: string | null | undefined) => {
  if (!value) return "No disponible"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "No disponible"

  return parsed.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const getDocumentStatus = (document?: DistributorDocument) => {
  if (!document) return { status: "missing", label: "No subido", variant: "destructive" as const }
  if (document.status === "approved") return { status: "approved", label: "Aprobado", variant: "default" as const }
  if (document.status === "rejected") return { status: "rejected", label: "Rechazado", variant: "destructive" as const }
  if (document.status === "expired") return { status: "expired", label: "Vencido", variant: "secondary" as const }
  return { status: "pending", label: "Pendiente revisión", variant: "outline" as const }
}

const getStatusIcon = (status: string) => {
  if (status === "approved") return <CheckCircle2 className="h-4 w-4 text-green-600" />
  if (status === "rejected") return <XCircle className="h-4 w-4 text-red-600" />
  if (status === "pending") return <Clock3 className="h-4 w-4 text-amber-600" />
  if (status === "expired") return <AlertCircle className="h-4 w-4 text-zinc-600" />
  return <AlertCircle className="h-4 w-4 text-red-600" />
}

export default async function DistributorProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const [{ data: userProfile }, { data: distributor }] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("id", user.id).single(),
    supabase.from("distributors").select("*").eq("user_id", user.id).single(),
  ])

  if (!distributor) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Perfil no configurado:</strong> No tienes un perfil de distribuidor activo. Contacta al
            administrador para habilitar tu cuenta.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  let documents: DistributorDocument[] = []
  let documentsLoadError: string | null = null

  const { data: documentsData, error: documentsError } = await supabase
    .from("distributor_documents")
    .select("id, document_type, file_name, file_url, status, uploaded_at, expires_at, review_notes")
    .eq("distributor_id", distributor.id)
    .order("uploaded_at", { ascending: false })

  if (documentsError) {
    if (documentsError.code !== "42P01") {
      documentsLoadError = documentsError.message
    }
  } else {
    documents = documentsData || []
  }

  const latestDocumentByType = new Map<string, DistributorDocument>()
  for (const document of documents) {
    if (!latestDocumentByType.has(document.document_type)) {
      latestDocumentByType.set(document.document_type, document)
    }
  }

  const requiredDocs = DOCUMENT_TYPES.filter((doc) => doc.required)
  const approvedRequiredDocs = requiredDocs.filter((doc) => {
    const record = latestDocumentByType.get(doc.type)
    return record?.status === "approved"
  }).length
  const requiredCompletionPercent = requiredDocs.length === 0 ? 0 : Math.round((approvedRequiredDocs / requiredDocs.length) * 100)

  const missingRequiredDocs = requiredDocs.filter((doc) => {
    const record = latestDocumentByType.get(doc.type)
    return !record || !["approved", "pending"].includes(record.status || "")
  })

  const pendingDocs = documents.filter((doc) => doc.status === "pending").length
  const rejectedDocs = documents.filter((doc) => doc.status === "rejected").length

  const profileChecklist = [
    distributor.company_name,
    distributor.business_type,
    distributor.contact_name || userProfile?.full_name,
    distributor.contact_phone || userProfile?.phone,
    distributor.main_address || distributor.address,
    distributor.main_state || distributor.state,
    distributor.main_city || distributor.city,
  ]
  const completedProfileFields = profileChecklist.filter(Boolean).length
  const profileCompletionPercent = Math.round((completedProfileFields / profileChecklist.length) * 100)
  const isProfileComplete = profileCompletionPercent === 100

  const nextDocumentExpiration = documents
    .filter((doc) => !!doc.expires_at && doc.status !== "rejected")
    .sort((a, b) => new Date(a.expires_at as string).getTime() - new Date(b.expires_at as string).getTime())[0]

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Perfil y Documentos</h1>
        <p className="text-muted-foreground">Actualiza tu información comercial y mantén tus documentos al día.</p>
      </div>

      {documentsLoadError && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No fue posible cargar el historial completo de documentos: {documentsLoadError}
          </AlertDescription>
        </Alert>
      )}

      {missingRequiredDocs.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Tienes documentos requeridos pendientes: {missingRequiredDocs.map((doc) => doc.label).join(", ")}.
          </AlertDescription>
        </Alert>
      )}

      {rejectedDocs > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Tienes {rejectedDocs} documento{rejectedDocs > 1 ? "s" : ""} rechazado
            {rejectedDocs > 1 ? "s" : ""}. Sube una nueva versión.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              Estado del Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{profileCompletionPercent}%</span>
              <Badge variant={isProfileComplete ? "default" : "secondary"}>
                {isProfileComplete ? "Completo" : "Incompleto"}
              </Badge>
            </div>
            <Progress value={profileCompletionPercent} />
            <p className="text-xs text-muted-foreground">
              {completedProfileFields} de {profileChecklist.length} campos clave diligenciados.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Documentos Requeridos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {approvedRequiredDocs}/{requiredDocs.length}
              </span>
              <Badge variant={requiredCompletionPercent === 100 ? "default" : "secondary"}>
                {requiredCompletionPercent === 100 ? "Completos" : "Pendientes"}
              </Badge>
            </div>
            <Progress value={requiredCompletionPercent} />
            <p className="text-xs text-muted-foreground">
              {pendingDocs} en revisión. Requeridos deben quedar en estado aprobado.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Percent className="h-4 w-4 text-muted-foreground" />
              Desc_Dist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">{distributor.discount_percentage || 0}%</div>
            <p className="text-xs text-muted-foreground">Aplicado sobre Precio_Dist en todo el catálogo.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              Próximo Vencimiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm font-semibold">
              {nextDocumentExpiration ? formatDate(nextDocumentExpiration.expires_at) : "Sin vencimientos registrados"}
            </div>
            <p className="text-xs text-muted-foreground">
              {nextDocumentExpiration
                ? `Documento: ${nextDocumentExpiration.file_name || nextDocumentExpiration.document_type}`
                : "Aún no hay documentos con fecha de expiración."}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información Comercial
            </CardTitle>
            <CardDescription>Estos datos se usan para facturación, despacho y asignación comercial.</CardDescription>
          </CardHeader>
          <CardContent>
            <DistributorProfileForm distributor={distributor} userProfile={userProfile} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contacto y Condiciones
            </CardTitle>
            <CardDescription>Resumen de contacto principal y variables comerciales vigentes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{distributor.contact_name || userProfile?.full_name || "No especificado"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{distributor.contact_email || user.email || "No especificado"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{distributor.contact_phone || userProfile?.phone || "No especificado"}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {distributor.main_city || distributor.city
                    ? `${distributor.main_city || distributor.city}, ${distributor.main_state || distributor.state || ""}`
                    : "No especificado"}
                </span>
              </div>
            </div>

            <div className="border-t pt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Términos de pago</p>
                <p className="font-medium">{distributor.payment_terms || "Sin definir"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cupo de crédito</p>
                <p className="font-medium">${Number(distributor.credit_limit || 0).toLocaleString("es-CO")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Representante legal</p>
                <p className="font-medium">{distributor.legal_rep_name || "No definido"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Documento representante</p>
                <p className="font-medium">{distributor.legal_rep_document || "No definido"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Gestión de Documentos
            </CardTitle>
            <CardDescription>
              Sube o reemplaza tus documentos. Cada archivo pasa por revisión administrativa antes de aprobarse.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {DOCUMENT_TYPES.map((documentType) => {
                const existingDoc = latestDocumentByType.get(documentType.type)
                const status = getDocumentStatus(existingDoc)

                return (
                  <Card
                    key={documentType.type}
                    id={`doc-card-${documentType.type}`}
                    className="border scroll-mt-24"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <CardTitle className="text-base">
                            {documentType.label}
                            {documentType.required && <span className="ml-1 text-red-500">*</span>}
                          </CardTitle>
                          <CardDescription className="text-xs">{documentType.description}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(status.status)}
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {existingDoc ? (
                        <div className="space-y-2 text-sm">
                          <p className="font-medium truncate">{existingDoc.file_name || "Archivo sin nombre"}</p>
                          <p className="text-xs text-muted-foreground">Cargado: {formatDate(existingDoc.uploaded_at)}</p>
                          {existingDoc.expires_at && (
                            <p className="text-xs text-muted-foreground">Vence: {formatDate(existingDoc.expires_at)}</p>
                          )}
                          {existingDoc.review_notes && (
                            <p className="text-xs text-red-600">Observación: {existingDoc.review_notes}</p>
                          )}
                          {existingDoc.file_url && (
                            <a
                              href={existingDoc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              Ver documento actual
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Aún no hay archivo cargado para este documento.
                        </p>
                      )}

                      <div className="border-t pt-3">
                        <DocumentUploader distributorId={distributor.id} documentType={documentType.type} />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
