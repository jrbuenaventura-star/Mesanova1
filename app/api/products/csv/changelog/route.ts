import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Verificar rol
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!['superadmin', 'canal'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    
    // Parámetros de filtro
    const productId = searchParams.get('product_id');
    const changeType = searchParams.get('change_type');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Construir query
    let query = supabase
      .from('product_change_log')
      .select(`
        *,
        product:products(pdt_codigo, nombre_comercial),
        user:user_profiles(full_name)
      `)
      .order('changed_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (productId) {
      query = query.eq('product_id', productId);
    }
    
    if (changeType) {
      query = query.eq('change_type', changeType);
    }
    
    if (startDate) {
      query = query.gte('changed_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('changed_at', endDate);
    }
    
    const { data: logs, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      logs,
      total: count,
      hasMore: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error('Error obteniendo changelog:', error);
    return NextResponse.json(
      { error: 'Error al obtener historial de cambios' },
      { status: 500 }
    );
  }
}
