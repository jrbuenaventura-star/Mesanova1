import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseCSV, compareWithExisting } from '@/lib/csv/product-parser';
import { getExistingProductsMap } from '@/lib/csv/product-importer';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export const maxDuration = 300;

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
    
    // Obtener productos existentes para comparación
    const existingProducts = await getExistingProductsMap(supabase);
    
    // Comparar con existentes
    const diffs = compareWithExisting(parseResult.products, existingProducts);
    
    // Calcular estadísticas
    const stats = {
      total: parseResult.totalRows,
      valid: parseResult.validRows,
      invalid: parseResult.invalidRows,
      toCreate: diffs.filter(d => d.changeType === 'create').length,
      toUpdate: diffs.filter(d => d.changeType === 'update').length,
      unchanged: diffs.filter(d => d.changeType === 'unchanged').length,
    };
    
    return NextResponse.json({
      success: parseResult.success,
      stats,
      globalErrors: parseResult.globalErrors,
      products: parseResult.products.slice(0, 100), // Limitar preview a 100 productos
      diffs: diffs.slice(0, 100),
      hasMore: parseResult.products.length > 100,
    });
  } catch (error) {
    console.error('Error validando CSV:', error);
    return NextResponse.json(
      { error: 'Error al validar archivo CSV' },
      { status: 500 }
    );
  }
}
