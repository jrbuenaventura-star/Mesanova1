import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exportProductsToCSV } from '@/lib/csv/product-importer';

export async function GET() {
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
    
    const csvContent = await exportProductsToCSV(supabase);
    
    if (!csvContent) {
      return NextResponse.json({ error: 'No hay productos para exportar' }, { status: 404 });
    }
    
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `productos_export_${timestamp}.csv`;
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exportando productos:', error);
    return NextResponse.json(
      { error: 'Error al exportar productos' },
      { status: 500 }
    );
  }
}
