import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    if (profile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const admin = createAdminClient();

    const { data: distData, error: distError } = await admin
      .from('distributors')
      .select('*')
      .order('company_name', { ascending: true });

    if (distError) {
      return NextResponse.json({ error: distError.message }, { status: 500 });
    }

    const userIds = (distData || [])
      .map((d: any) => d?.user_id)
      .filter((v: any): v is string => typeof v === 'string' && v.length > 0);

    const { data: profilesData, error: profilesError } = userIds.length
      ? await admin.from('user_profiles').select('*').in('id', userIds)
      : { data: [], error: null };

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    const profileById = new Map<string, any>();
    for (const p of profilesData || []) {
      if (p?.id) profileById.set(p.id, p);
    }

    // Get aliados info for displaying names
    const aliadoIds = (distData || [])
      .map((d: any) => d?.aliado_id)
      .filter((v: any): v is string => typeof v === 'string' && v.length > 0);

    const { data: aliadosData } = aliadoIds.length
      ? await admin.from('aliados').select('id, company_name').in('id', aliadoIds)
      : { data: [] };

    const aliadoById = new Map<string, any>();
    for (const a of aliadosData || []) {
      if (a?.id) aliadoById.set(a.id, a);
    }

    const withAliados = (distData || []).map((dist: any) => {
      return {
        ...dist,
        profile: profileById.get(dist.user_id) || null,
        aliado: dist.aliado_id ? aliadoById.get(dist.aliado_id) || null : null,
      };
    });

    return NextResponse.json({ distributors: withAliados });
  } catch (error) {
    console.error('Error listing distributors:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al listar distribuidores' },
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
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    
    const body = await request.json();
    const { formData, newAddresses, addressesToDelete } = body as {
      formData?: Record<string, unknown>;
      newAddresses?: any[];
      addressesToDelete?: string[];
    };

    if (!formData || typeof formData !== 'object') {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const emailRaw = (formData as any).email;
    const email = typeof emailRaw === 'string' ? emailRaw.trim().toLowerCase() : '';

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }
    
    const admin = createAdminClient();
    
    const { data: usersData, error: listUsersError } = await admin.auth.admin.listUsers();
    if (listUsersError) {
      return NextResponse.json({ error: listUsersError.message }, { status: 400 });
    }
    const existingUser = usersData?.users?.find((u: any) => (u.email || '').toLowerCase() === email);
    
    let userId: string;
    
    if (existingUser) {
      userId = existingUser.id;
      
      const { data: existingProfile } = await admin
        .from('user_profiles')
        .select('id, role')
        .eq('id', userId)
        .single();
      
      if (existingProfile) {
        if (existingProfile.role !== 'distributor') {
          await admin
            .from('user_profiles')
            .update({ role: 'distributor' })
            .eq('id', userId);
        }
        
        const { error: profileError } = await admin
          .from('user_profiles')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            document_type: formData.document_type,
            document_number: formData.document_number,
          })
          .eq('id', userId);
        
        if (profileError) throw profileError;
      } else {
        const { error: profileError } = await admin.from('user_profiles').insert({
          id: userId,
          role: 'distributor',
          full_name: formData.full_name,
          phone: formData.phone,
          document_type: formData.document_type,
          document_number: formData.document_number,
        });
        
        if (profileError) throw profileError;
      }
    } else {
      const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
        data: {
          role: 'distributor',
          full_name: (formData as any).full_name || null,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      });

      if (inviteError) {
        return NextResponse.json({ error: inviteError.message }, { status: 400 });
      }

      if (!inviteData?.user?.id) {
        return NextResponse.json({ error: 'No se pudo invitar el usuario' }, { status: 500 });
      }

      userId = inviteData.user.id;

      const { error: profileError } = await admin.from('user_profiles').upsert({
        id: userId,
        role: 'distributor',
        full_name: (formData as any).full_name || null,
        phone: (formData as any).phone || null,
        document_type: (formData as any).document_type || null,
        document_number: (formData as any).document_number || null,
      });

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 400 });
      }
    }
    
    // Check for existing distributor
    const { data: existingDistributor } = await admin
      .from('distributors')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingDistributor?.id) {
      return NextResponse.json(
        { error: 'Este usuario ya tiene un cliente asociado' },
        { status: 400 }
      );
    }

    const discount = Number.parseFloat(String((formData as any).discount_percentage ?? '0'));
    const credit = Number.parseFloat(String((formData as any).credit_limit ?? '0'));
    const aliadoIdRaw = (formData as any).aliado_id;
    const aliado_id = typeof aliadoIdRaw === 'string' && aliadoIdRaw.length > 0 ? aliadoIdRaw : null;

    const { error: distError } = await admin.from('distributors').insert({
      user_id: userId,
      company_name: (formData as any).company_name,
      company_rif: (formData as any).company_rif || null,
      commercial_name: (formData as any).commercial_name || null,
      business_type: (formData as any).business_type,
      discount_percentage: Number.isFinite(discount) ? discount : 0,
      credit_limit: Number.isFinite(credit) ? credit : 0,
      aliado_id,
      payment_terms: (formData as any).payment_terms || null,
      notes: (formData as any).notes || null,
      legal_rep_name: (formData as any).legal_rep_name || null,
      legal_rep_document: (formData as any).legal_rep_document || null,
      main_address: (formData as any).main_address || null,
      main_city: (formData as any).main_city || null,
      main_state: (formData as any).main_state || null,
    });
    
    if (distError) throw distError;

    // Create shipping addresses if provided
    if (Array.isArray(newAddresses) && newAddresses.length > 0) {
      const addressRows = newAddresses.map((a: any) => ({
        user_id: userId,
        label: a.label || 'Dirección',
        full_name: a.full_name || (formData as any).full_name || '',
        phone: a.phone || null,
        address_line1: a.address_line1,
        address_line2: a.address_line2 || null,
        city: a.city,
        state: a.state,
        country: 'Colombia',
        is_default: a.is_default || false,
      }));

      const { error: addrError } = await admin.from('shipping_addresses').insert(addressRows);
      if (addrError) {
        console.error('Error creating addresses:', addrError);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating distributor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al crear cliente';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: Request) {
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
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    
    const body = await request.json();
    const { distributorId, userId, formData, newAddresses, addressesToDelete } = body;
    
    const admin = createAdminClient();

    const aliadoIdRaw = formData?.aliado_id;
    const aliado_id = typeof aliadoIdRaw === 'string' && aliadoIdRaw.length > 0 ? aliadoIdRaw : null;
    
    // Update distributor with new fields
    const { error: distError } = await admin
      .from('distributors')
      .update({
        company_name: formData.company_name,
        company_rif: formData.company_rif || null,
        commercial_name: formData.commercial_name || null,
        business_type: formData.business_type,
        discount_percentage: parseFloat(formData.discount_percentage) || 0,
        credit_limit: parseFloat(formData.credit_limit) || 0,
        aliado_id,
        payment_terms: formData.payment_terms || null,
        notes: formData.notes || null,
        legal_rep_name: formData.legal_rep_name || null,
        legal_rep_document: formData.legal_rep_document || null,
        main_address: formData.main_address || null,
        main_city: formData.main_city || null,
        main_state: formData.main_state || null,
      })
      .eq('id', distributorId);
    
    if (distError) throw distError;
    
    // Update profile (no legacy shipping fields)
    const { error: profileError } = await admin
      .from('user_profiles')
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
        document_type: formData.document_type,
        document_number: formData.document_number,
      })
      .eq('id', userId);
    
    if (profileError) throw profileError;

    // Delete marked addresses
    if (Array.isArray(addressesToDelete) && addressesToDelete.length > 0) {
      const { error: delError } = await admin
        .from('shipping_addresses')
        .delete()
        .in('id', addressesToDelete);
      if (delError) console.error('Error deleting addresses:', delError);
    }

    // Create new addresses
    if (Array.isArray(newAddresses) && newAddresses.length > 0) {
      const addressRows = newAddresses.map((a: any) => ({
        user_id: userId,
        label: a.label || 'Dirección',
        full_name: a.full_name || formData.full_name || '',
        phone: a.phone || null,
        address_line1: a.address_line1,
        address_line2: a.address_line2 || null,
        city: a.city,
        state: a.state,
        country: 'Colombia',
        is_default: a.is_default || false,
      }));

      const { error: addrError } = await admin.from('shipping_addresses').insert(addressRows);
      if (addrError) console.error('Error creating addresses:', addrError);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating distributor:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar cliente' },
      { status: 500 }
    );
  }
}
