import { createAdminClient } from '@/lib/supabase/admin';
import {
  ParsedDistributor,
  DistributorDiff,
  parseBooleanValue,
  parseNumericValue,
} from './distributor-parser';
import { DistributorCSVRow } from './distributor-template';

export interface ImportResult {
  success: boolean;
  importId: string;
  created: number;
  updated: number;
  skipped: number;
  invited: number; // Usuarios que recibirán invitación por email
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  companyRif: string;
  error: string;
}

export async function importDistributors(
  distributors: ParsedDistributor[],
  diffs: DistributorDiff[],
  importMode: 'update' | 'add_only',
  userId: string,
  filename: string
): Promise<ImportResult> {
  const admin = createAdminClient();
  const errors: ImportError[] = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let invited = 0;
  
  // Crear registro de importación
  const { data: importRecord, error: importError } = await admin
    .from('distributor_csv_imports')
    .insert({
      filename,
      total_rows: distributors.length,
      status: 'processing',
      import_mode: importMode,
      imported_by: userId,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  
  // Si la tabla no existe, continuar sin registro
  const importId = importRecord?.id || `temp-${Date.now()}`;
  
  // Procesar cada distribuidor
  for (let i = 0; i < distributors.length; i++) {
    const distributor = distributors[i];
    const diff = diffs.find(d => d.companyRif === distributor.data.company_rif.trim());
    
    if (!distributor.isValid) {
      skipped++;
      continue;
    }
    
    if (!diff) {
      skipped++;
      continue;
    }
    
    try {
      if (diff.changeType === 'create') {
        // Crear nuevo distribuidor con usuario Auth
        const result = await createDistributor(admin, distributor.data);
        if (result.invited) {
          invited++;
        }
        created++;
      } else if (diff.changeType === 'update') {
        if (importMode === 'add_only') {
          skipped++;
        } else {
          await updateDistributor(admin, distributor.data, diff);
          updated++;
        }
      } else {
        skipped++;
      }
    } catch (error) {
      errors.push({
        row: distributor.row,
        companyRif: distributor.data.company_rif,
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }
  
  // Actualizar registro de importación si existe
  if (importRecord?.id) {
    await admin
      .from('distributor_csv_imports')
      .update({
        rows_created: created,
        rows_updated: updated,
        rows_skipped: skipped,
        rows_invited: invited,
        rows_error: errors.length,
        errors: errors.length > 0 ? errors : null,
        status: errors.length === 0 ? 'completed' : 'completed_with_errors',
        completed_at: new Date().toISOString(),
      })
      .eq('id', importRecord.id);
  }
  
  return {
    success: errors.length === 0,
    importId,
    created,
    updated,
    skipped,
    invited,
    errors,
  };
}

async function createDistributor(
  admin: ReturnType<typeof createAdminClient>,
  data: DistributorCSVRow
): Promise<{ invited: boolean }> {
  const email = data.email.trim().toLowerCase();
  
  // Verificar si el usuario ya existe por email
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    u => u.email?.toLowerCase() === email
  );
  
  let userId: string;
  let wasInvited = false;
  
  if (existingUser) {
    // Usuario ya existe, usar su ID
    userId = existingUser.id;
  } else {
    // Crear nuevo usuario con invitación por email
    const { data: authData, error: authError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        role: 'distributor',
        full_name: data.full_name,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    });
    
    if (authError) {
      throw new Error(`Error invitando usuario: ${authError.message}`);
    }
    
    if (!authData.user) {
      throw new Error('No se pudo crear el usuario');
    }
    
    userId = authData.user.id;
    wasInvited = true;
  }
  
  // Crear o actualizar perfil de usuario
  const { error: profileError } = await admin
    .from('user_profiles')
    .upsert({
      id: userId,
      role: 'distributor',
      full_name: data.full_name || null,
      phone: data.phone || null,
      document_type: data.document_type || null,
      document_number: data.document_number || null,
    });
  
  if (profileError) {
    throw new Error(`Error creando perfil: ${profileError.message}`);
  }
  
  // Crear registro de distribuidor
  const { error: distError } = await admin
    .from('distributors')
    .insert({
      user_id: userId,
      company_name: data.company_name,
      company_rif: data.company_rif || null,
      commercial_name: data.commercial_name || null,
      business_type: data.business_type || null,
      discount_percentage: parseNumericValue(data.discount_percentage) || 0,
      credit_limit: parseNumericValue(data.credit_limit) || 0,
      is_active: parseBooleanValue(data.is_active),
      legal_rep_name: data.legal_rep_name || null,
      legal_rep_document: data.legal_rep_document || null,
      main_address: data.main_address || null,
      main_city: data.main_city || null,
      main_state: data.main_state || null,
    });
  
  if (distError) {
    throw new Error(`Error creando distribuidor: ${distError.message}`);
  }
  
  return { invited: wasInvited };
}

async function updateDistributor(
  admin: ReturnType<typeof createAdminClient>,
  data: DistributorCSVRow,
  diff: DistributorDiff
): Promise<void> {
  // Actualizar distribuidor
  const { error: distError } = await admin
    .from('distributors')
    .update({
      company_name: data.company_name,
      commercial_name: data.commercial_name || null,
      business_type: data.business_type || null,
      discount_percentage: parseNumericValue(data.discount_percentage) || 0,
      credit_limit: parseNumericValue(data.credit_limit) || 0,
      is_active: parseBooleanValue(data.is_active),
      legal_rep_name: data.legal_rep_name || null,
      legal_rep_document: data.legal_rep_document || null,
      main_address: data.main_address || null,
      main_city: data.main_city || null,
      main_state: data.main_state || null,
      updated_at: new Date().toISOString(),
    })
    .eq('company_rif', data.company_rif.trim());
  
  if (distError) {
    throw new Error(`Error actualizando distribuidor: ${distError.message}`);
  }
  
  // Actualizar perfil de usuario si hay user_id
  if (diff.existingUserId) {
    const profileUpdate: Record<string, unknown> = {};
    
    if (data.full_name) profileUpdate.full_name = data.full_name;
    if (data.phone) profileUpdate.phone = data.phone;
    if (data.document_type) profileUpdate.document_type = data.document_type;
    if (data.document_number) profileUpdate.document_number = data.document_number;
    
    if (Object.keys(profileUpdate).length > 0) {
      await admin
        .from('user_profiles')
        .update(profileUpdate)
        .eq('id', diff.existingUserId);
    }
  }
}

export async function getExistingDistributorsMap(
  admin: ReturnType<typeof createAdminClient>
): Promise<Map<string, { id: string; user_id: string; data: Record<string, unknown> }>> {
  const { data: distributors } = await admin
    .from('distributors')
    .select('*');
  
  const map = new Map<string, { id: string; user_id: string; data: Record<string, unknown> }>();
  
  if (distributors) {
    for (const dist of distributors) {
      if (dist.company_rif) {
        map.set(dist.company_rif, {
          id: dist.id,
          user_id: dist.user_id,
          data: dist,
        });
      }
    }
  }
  
  return map;
}
