import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseCSV, compareWithExisting } from '@/lib/csv/distributor-parser';
import { getExistingDistributorsMap } from '@/lib/csv/distributor-importer';

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
    
    // Obtener contenido del archivo
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
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
    
    // Recalcular validez después de comparación (algunos pueden necesitar email si son nuevos)
    let validCount = 0;
    let invalidCount = 0;
    
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
      
      if (dist.isValid) {
        validCount++;
      } else {
        invalidCount++;
      }
    }
    
    // Calcular estadísticas
    const stats = {
      total: parseResult.totalRows,
      valid: validCount,
      invalid: invalidCount,
      toCreate: diffs.filter(d => d.changeType === 'create').length,
      toUpdate: diffs.filter(d => d.changeType === 'update').length,
      unchanged: diffs.filter(d => d.changeType === 'unchanged').length,
    };
    
    return NextResponse.json({
      success: invalidCount === 0 && parseResult.globalErrors.length === 0,
      stats,
      globalErrors: parseResult.globalErrors,
      distributors: parseResult.distributors.slice(0, 100),
      diffs: diffs.slice(0, 100),
      hasMore: parseResult.distributors.length > 100,
    });
  } catch (error) {
    console.error('Error validando CSV de distribuidores:', error);
    return NextResponse.json(
      { error: 'Error al validar archivo CSV' },
      { status: 500 }
    );
  }
}
