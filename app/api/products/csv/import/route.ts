import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseCSV, compareWithExisting } from '@/lib/csv/product-parser';
import { importProducts, getExistingProductsMap } from '@/lib/csv/product-importer';

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
    
    // Obtener contenido del archivo y opciones
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mode = (formData.get('mode') as string) || 'update';
    
    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }
    
    // Validar modo
    if (!['update', 'add_only', 'replace_all'].includes(mode)) {
      return NextResponse.json({ error: 'Modo de importación inválido' }, { status: 400 });
    }
    
    // Leer contenido
    const content = await file.text();
    
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
      file.name
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
