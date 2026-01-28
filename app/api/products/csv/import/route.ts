import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseCSV, compareWithExisting } from '@/lib/csv/product-parser';
import { importProducts, getExistingProductsMap } from '@/lib/csv/product-importer';

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
    
    // Obtener referencia del archivo y opciones
    const body = await request.json();
    const { bucket, path, filename, mode = 'update' } = body as {
      bucket?: string;
      path?: string;
      filename?: string;
      mode?: string;
    };

    if (!bucket || !path) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }
    
    // Validar modo
    if (!['update', 'add_only', 'replace_all'].includes(mode)) {
      return NextResponse.json({ error: 'Modo de importación inválido' }, { status: 400 });
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
    
    // Si hay errores de validación, no importar
    if (parseResult.invalidRows > 0) {
      return NextResponse.json({
        success: false,
        error: 'El archivo contiene errores de validación',
        invalidRows: parseResult.invalidRows,
        products: parseResult.products.filter(p => !p.isValid).slice(0, 20),
      }, { status: 400 });
    }
    
    // Obtener productos existentes para comparación
    const existingProducts = await getExistingProductsMap(supabase);
    
    // Comparar con existentes
    const diffs = compareWithExisting(parseResult.products, existingProducts);
    
    // Importar productos
    const result = await importProducts(
      parseResult.products,
      diffs,
      mode as 'update' | 'add_only' | 'replace_all',
      user.id,
      filename || 'import.csv'
    );
    
    return NextResponse.json({
      success: result.success,
      importId: result.importId,
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors.slice(0, 20),
      hasMoreErrors: result.errors.length > 20,
    });
  } catch (error) {
    console.error('Error importando CSV:', error);
    return NextResponse.json(
      { error: 'Error al importar archivo CSV' },
      { status: 500 }
    );
  }
}
