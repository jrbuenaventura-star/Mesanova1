// Definición del template CSV para distribuidores
// Match por company_rif, modo mixto (crea con Auth si no existe, actualiza si existe)

export interface DistributorCSVRow {
  // Identificación (company_rif es la clave de match)
  company_rif: string;
  company_name: string;
  business_type: string;
  
  // Datos del contacto/usuario
  email: string;
  full_name: string;
  phone: string;
  document_type: string;
  document_number: string;
  
  // Configuración comercial
  discount_percentage: string;
  credit_limit: string;
  is_active: string; // SI/NO
}

export const CSV_HEADERS: (keyof DistributorCSVRow)[] = [
  'company_rif',
  'company_name',
  'business_type',
  'email',
  'full_name',
  'phone',
  'document_type',
  'document_number',
  'discount_percentage',
  'credit_limit',
  'is_active',
];

export const CSV_HEADER_DESCRIPTIONS: Record<keyof DistributorCSVRow, string> = {
  company_rif: 'NIT/RIF de la empresa (obligatorio, clave única para match)',
  company_name: 'Nombre de la empresa (obligatorio)',
  business_type: 'Tipo de negocio (Tienda, Restaurante, Hotel, etc.)',
  email: 'Email del distribuidor (obligatorio para nuevos, se enviará invitación)',
  full_name: 'Nombre completo del contacto',
  phone: 'Teléfono de contacto',
  document_type: 'Tipo de documento (CC, CE, Pasaporte)',
  document_number: 'Número de documento',
  discount_percentage: 'Porcentaje de descuento general (0-100)',
  credit_limit: 'Límite de crédito en pesos',
  is_active: 'Estado activo (SI/NO)',
};

export const REQUIRED_FIELDS: (keyof DistributorCSVRow)[] = [
  'company_rif',
  'company_name',
];

export const REQUIRED_FOR_NEW: (keyof DistributorCSVRow)[] = [
  'email',
];

export const BOOLEAN_FIELDS: (keyof DistributorCSVRow)[] = [
  'is_active',
];

export const NUMERIC_FIELDS: (keyof DistributorCSVRow)[] = [
  'discount_percentage',
  'credit_limit',
];

export const VALID_DOCUMENT_TYPES = ['CC', 'CE', 'Pasaporte', 'NIT'];

export function generateEmptyCSVTemplate(): string {
  return CSV_HEADERS.join(',');
}

export function generateCSVWithDescriptions(): string {
  const headerRow = CSV_HEADERS.join(',');
  const descriptionRow = CSV_HEADERS.map(h => `"${CSV_HEADER_DESCRIPTIONS[h]}"`).join(',');
  const exampleRow = generateExampleRow();
  
  return `${headerRow}\n${descriptionRow}\n${exampleRow}`;
}

function generateExampleRow(): string {
  const example: Partial<DistributorCSVRow> = {
    company_rif: '900123456-7',
    company_name: 'Distribuidora Ejemplo S.A.S',
    business_type: 'Tienda',
    email: 'contacto@distribuidora-ejemplo.com',
    full_name: 'Juan Pérez García',
    phone: '+57 300 123 4567',
    document_type: 'CC',
    document_number: '1234567890',
    discount_percentage: '15',
    credit_limit: '5000000',
    is_active: 'SI',
  };
  
  return CSV_HEADERS.map(h => {
    const value = example[h] || '';
    return value.includes(',') || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value;
  }).join(',');
}
