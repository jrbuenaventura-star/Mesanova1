import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseCSV, compareWithExisting } from '@/lib/csv/product-parser';
import { getExistingProductsMap } from '@/lib/csv/product-importer';

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
    
    // Obtener referencia del archivo
    const body = await request.json();
    const { bucket, path, filename } = body as { bucket?: string; path?: string; filename?: string };

    if (!bucket || !path) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    // Descargar contenido desde Storage usando service role (evita problemas de permisos)
    const admin = createAdminClient();
    const { data: fileData, error: downloadError } = await admin.storage.from(bucket).download(path);

    if (downloadError || !fileData) {
      console.error('Error descargando CSV:', downloadError);
      return NextResponse.json({ error: 'No se pudo descargar el archivo' }, { status: 400 });
    }

    const content = await fileData.text();
    
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
    
    const previewProducts = parseResult.products.slice(0, 100);
    const previewErrorProducts = parseResult.products
      .filter((product) => !product.isValid)
      .slice(0, 100);

    return NextResponse.json({
      success: parseResult.success,
      stats,
      globalErrors: parseResult.globalErrors,
      products: previewProducts,
      errorProducts: previewErrorProducts,
      diffs: diffs.slice(0, 100),
      hasMore: parseResult.products.length > previewProducts.length,
      hasMoreErrors: parseResult.invalidRows > previewErrorProducts.length,
    });
  } catch (error) {
    console.error('Error validando CSV:', error);
    return NextResponse.json(
      { error: 'Error al validar archivo CSV' },
      { status: 500 }
    );
  }
}
