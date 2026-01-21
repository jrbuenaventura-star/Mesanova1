import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react"
import { DistributorProfileForm } from "@/components/distributor/profile-form"
import { DocumentUploader } from "@/components/distributor/document-uploader"

const DOCUMENT_TYPES = [
  { 
    type: "estados_financieros", 
    label: "Estados Financieros", 
    description: "Debe actualizarse anualmente en abril",
    required: true 
  },
  { 
    type: "rut", 
    label: "RUT", 
    description: "Registro Único Tributario",
    required: true 
  },
  { 
    type: "camara_comercio", 
    label: "Certificado Cámara de Comercio", 
    description: "Vigencia no mayor a 30 días",
    required: true 
  },
  { 
    type: "certificado_bancario", 
    label: "Certificado Bancario", 
    description: "Para pagos y transferencias",
    required: false 
  },
]

export default async function DistributorProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Obtener perfil de usuario
  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // Obtener distribuidor
  const { data: distributor } = await supabase
    .from("distributors")
    .select("*")
    .eq("user_id", user.id)
    .single()

  // Obtener documentos (cuando la tabla exista)
  let documents: any[] = []
  try {
    const { data } = await supabase
      .from("distributor_documents")
      .select("*")
      .eq("distributor_id", distributor?.id)
      .order("uploaded_at", { ascending: false })
    documents = data || []
  } catch (e) {
    // Tabla aún no existe
  }

  const getDocumentStatus = (docType: string) => {
    const doc = documents.find(d => d.document_type === docType)
    if (!doc) return { status: "missing", label: "No subido", variant: "destructive" as const }
    if (doc.status === "approved") return { status: "approved", label: "Aprobado", variant: "default" as const }
    if (doc.status === "rejected") return { status: "rejected", label: "Rechazado", variant: "destructive" as const }
    if (doc.status === "expired") return { status: "expired", label: "Vencido", variant: "secondary" as const }
    return { status: "pending", label: "Pendiente revisión", variant: "outline" as const }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-4 w-4 text-green-600" />
      case "rejected": return <XCircle className="h-4 w-4 text-red-600" />
      case "pending": return <Clock className="h-4 w-4 text-amber-600" />
      case "expired": return <AlertCircle className="h-4 w-4 text-gray-600" />
      default: return <AlertCircle className="h-4 w-4 text-red-600" />
    }
  }

  const requiredDocsComplete = DOCUMENT_TYPES
    .filter(d => d.required)
    .every(d => {
      const doc = documents.find(doc => doc.document_type === d.type)
      return doc && doc.status === "approved"
    })

  // Alerta si no hay perfil de distribuidor
  if (!distributor) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Perfil no configurado:</strong> No tienes un perfil de distribuidor configurado. 
            Por favor contacta al administrador.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Perfil y Documentos</h1>
        <p className="text-muted-foreground">
          Mantén tu información actualizada para operar sin interrupciones
        </p>
      </div>

      {/* Alerta de documentos */}
      {!requiredDocsComplete && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Documentos pendientes:</strong> Debes subir y tener aprobados todos los documentos requeridos 
            para que tu cuenta sea activada.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Información de la empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información de la Empresa
            </CardTitle>
            <CardDescription>
              Datos comerciales de tu empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DistributorProfileForm 
              distributor={distributor} 
              userProfile={userProfile}
            />
          </CardContent>
        </Card>

        {/* Contacto de compras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contacto de Compras
            </CardTitle>
            <CardDescription>
              Persona responsable de realizar pedidos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {distributor ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{distributor.contact_name || userProfile?.full_name || "No especificado"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{distributor.contact_email || user.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{distributor.contact_phone || userProfile?.phone || "No especificado"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {distributor.city && distributor.state 
                      ? `${distributor.city}, ${distributor.state}`
                      : "No especificado"}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Completa la información de tu empresa primero
              </p>
            )}
          </CardContent>
        </Card>

        {/* Documentos */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos Requeridos
            </CardTitle>
            <CardDescription>
              Sube los documentos necesarios para activar tu cuenta. Los estados financieros deben 
              actualizarse cada año en abril para mantener tu cupo de crédito.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {DOCUMENT_TYPES.map((docType) => {
                const docStatus = getDocumentStatus(docType.type)
                const existingDoc = documents.find(d => d.document_type === docType.type)
                
                return (
                  <Card key={docType.type} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            {docType.label}
                            {docType.required && (
                              <span className="text-xs text-red-500">*</span>
                            )}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {docType.description}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(docStatus.status)}
                          <Badge variant={docStatus.variant}>
                            {docStatus.label}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {existingDoc && existingDoc.status !== "rejected" ? (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground truncate">
                            {existingDoc.file_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Subido: {new Date(existingDoc.uploaded_at).toLocaleDateString()}
                          </p>
                          {existingDoc.file_url && (
                            <a 
                              href={existingDoc.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              Ver documento
                            </a>
                          )}
                        </div>
                      ) : (
                        <DocumentUploader 
                          distributorId={distributor?.id}
                          documentType={docType.type}
                          onUploadComplete={() => {}}
                        />
                      )}
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
