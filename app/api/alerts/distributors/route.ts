import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!['superadmin', 'canal'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    
    // Parámetros
    const unresolvedOnly = searchParams.get('unresolved') === 'true';
    const alertType = searchParams.get('type');
    const agentId = searchParams.get('agent_id');
    
    // Construir query
    let query = supabase
      .from('distributor_alerts')
      .select(`
        *,
        distributor:distributors(id, company_name, user_id),
        agent:sales_agents(id, user_id, user_profiles:user_id(full_name))
      `)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (unresolvedOnly) {
      query = query.eq('is_resolved', false);
    }
    
    if (alertType) {
      query = query.eq('alert_type', alertType);
    }
    
    // Si es corredor, solo ver sus alertas
    if (profile?.role === 'canal') {
      const { data: agent } = await supabase
        .from('sales_agents')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (agent) {
        query = query.eq('agent_id', agent.id);
      }
    } else if (agentId) {
      query = query.eq('agent_id', agentId);
    }
    
    const { data: alerts, error } = await query;
    
    if (error) throw error;
    
    // Obtener estadísticas
    const stats = {
      total: alerts?.length || 0,
      warning: alerts?.filter(a => a.alert_type === 'inactivity_warning').length || 0,
      critical: alerts?.filter(a => a.alert_type === 'inactivity_critical').length || 0,
      dormant: alerts?.filter(a => a.alert_type === 'inactivity_dormant').length || 0,
    };
    
    return NextResponse.json({ alerts, stats });
  } catch (error) {
    console.error('Error fetching distributor alerts:', error);
    return NextResponse.json(
      { error: 'Error al obtener alertas' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const body = await request.json();
    const { alertId, action, notes } = body;
    
    if (!alertId || !action) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }
    
    if (action === 'mark_read') {
      await supabase
        .from('distributor_alerts')
        .update({ is_read: true })
        .eq('id', alertId);
    } else if (action === 'resolve') {
      await supabase
        .from('distributor_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
          resolution_notes: notes || null,
        })
        .eq('id', alertId);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { error: 'Error al actualizar alerta' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Solo superadmin puede generar alertas' }, { status: 403 });
    }
    
    // Ejecutar función de generación de alertas
    const { data, error } = await supabase.rpc('generate_distributor_inactivity_alerts');
    
    if (error) throw error;
    
    return NextResponse.json({ 
      success: true, 
      alertsGenerated: data,
      message: `Se generaron ${data} nuevas alertas`
    });
  } catch (error) {
    console.error('Error generating alerts:', error);
    return NextResponse.json(
      { error: 'Error al generar alertas' },
      { status: 500 }
    );
  }
}
