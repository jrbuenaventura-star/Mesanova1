import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseCSV, compareWithExisting } from '@/lib/csv/distributor-parser';
import { importDistributors, getExistingDistributorsMap } from '@/lib/csv/distributor-importer';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Verificar rol de superadmin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    
    // Obtener contenido del archivo y opciones
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mode = (formData.get('mode') as string) || 'update';
    
    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }
    
    // Validar modo
    if (!['update', 'add_only'].includes(mode)) {
      return NextResponse.json({ error: 'Modo de importación inválido' }, { status: 400 });
    }
    
    // Leer contenido
    const content = await file.text();
    
    // Parsear y validar CSV
    const parseResult = parseCSV(content);
    
    // Obtener distribuidores existentes para comparación
    const admin = createAdminClient();
    const existingDistributors = await getExistingDistributorsMap(admin);
    
    // Comparar con existentes
    const diffs = compareWithExisting(parseResult.distributors, existingDistributors);
    
    // Revalidar: nuevos distribuidores necesitan email
    for (const dist of parseResult.distributors) {
      const diff = diffs.find(d => d.companyRif === dist.data.company_rif.trim());
      if (diff?.changeType === 'create' && (!dist.data.email || dist.data.email.trim() === '')) {
        dist.errors.push({
          field: 'email',
          message: 'Email obligatorio para nuevos distribuidores',
          value: '',
        });
        dist.isValid = false;
      }
    }
    
    // Si hay errores de validación, no importar
    const invalidRows = parseResult.distributors.filter(d => !d.isValid).length;
    if (invalidRows > 0) {
      return NextResponse.json({
        success: false,
        error: 'El archivo contiene errores de validación',
        invalidRows,
        distributors: parseResult.distributors.filter(d => !d.isValid).slice(0, 20),
      }, { status: 400 });
    }
    
    // Importar distribuidores
    const result = await importDistributors(
      parseResult.distributors,
      diffs,
      mode as 'update' | 'add_only',
      user.id,
      file.name
    );
    
    return NextResponse.json({
      success: result.success,
      importId: result.importId,
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      invited: result.invited,
      errors: result.errors.slice(0, 20),
      hasMoreErrors: result.errors.length > 20,
    });
  } catch (error) {
    console.error('Error importando CSV de distribuidores:', error);
    return NextResponse.json(
      { error: 'Error al importar archivo CSV' },
      { status: 500 }
    );
  }
}
