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

    const withCounts = await Promise.all(
      (distData || []).map(async (dist: any) => {
        const { count } = await admin
          .from('companies')
          .select('*', { count: 'exact', head: true })
          .eq('distribuidor_asignado_id', dist.id);

        return {
          ...dist,
          profile: profileById.get(dist.user_id) || null,
          clients_count: count || 0,
        };
      })
    );

    return NextResponse.json({ distributors: withCounts });
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
    
    const body = await request.json();
    const { formData } = body as { formData?: Record<string, unknown> };

    if (!formData || typeof formData !== 'object') {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const emailRaw = (formData as any).email;
    const email = typeof emailRaw === 'string' ? emailRaw.trim().toLowerCase() : '';

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }
    
    const admin = createAdminClient();
    
    // Buscar usuario existente por email
    const { data: usersData, error: listUsersError } = await admin.auth.admin.listUsers();
    if (listUsersError) {
      return NextResponse.json({ error: listUsersError.message }, { status: 400 });
    }
    const existingUser = usersData?.users?.find((u: any) => (u.email || '').toLowerCase() === email);
    
    let userId: string;
    
    if (existingUser) {
      // Usuario existe
      userId = existingUser.id;
      
      const { data: existingProfile } = await admin
        .from('user_profiles')
        .select('id, role')
        .eq('id', userId)
        .single();
      
      if (existingProfile) {
        // Actualizar rol a distribuidor si es necesario
        if (existingProfile.role !== 'distributor') {
          const { error: roleError } = await admin
            .from('user_profiles')
            .update({ role: 'distributor' })
            .eq('id', userId);
          
          if (roleError) throw roleError;
        }
        
        // Actualizar datos del perfil
        const { error: profileError } = await admin
          .from('user_profiles')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            document_type: formData.document_type,
            document_number: formData.document_number,
            shipping_address: formData.shipping_address,
            shipping_city: formData.shipping_city,
            shipping_state: formData.shipping_state,
            shipping_postal_code: formData.shipping_postal_code,
            shipping_country: formData.shipping_country,
          })
          .eq('id', userId);
        
        if (profileError) throw profileError;
      } else {
        // Usuario existe pero no tiene perfil, crearlo
        const { error: profileError } = await admin.from('user_profiles').insert({
          id: userId,
          role: 'distributor',
          full_name: formData.full_name,
          phone: formData.phone,
          document_type: formData.document_type,
          document_number: formData.document_number,
          shipping_address: formData.shipping_address,
          shipping_city: formData.shipping_city,
          shipping_state: formData.shipping_state,
          shipping_postal_code: formData.shipping_postal_code,
          shipping_country: formData.shipping_country,
        });
        
        if (profileError) throw profileError;
      }
    } else {
      // Usuario no existe: invitar por email (flujo sin password)
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

      // Crear/actualizar perfil (upsert para evitar duplicados)
      const { error: profileError } = await admin.from('user_profiles').upsert({
        id: userId,
        role: 'distributor',
        full_name: (formData as any).full_name || null,
        phone: (formData as any).phone || null,
        document_type: (formData as any).document_type || null,
        document_number: (formData as any).document_number || null,
        shipping_address: (formData as any).shipping_address || null,
        shipping_city: (formData as any).shipping_city || null,
        shipping_state: (formData as any).shipping_state || null,
        shipping_postal_code: (formData as any).shipping_postal_code || null,
        shipping_country: (formData as any).shipping_country || null,
      });

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 400 });
      }
    }
    
    // Crear registro de distribuidor
    const { data: existingDistributor } = await admin
      .from('distributors')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingDistributor?.id) {
      return NextResponse.json(
        {
          error: 'Este usuario ya tiene un distribuidor asociado',
          debug: {
            userId,
            distributorId: existingDistributor.id,
          },
        },
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
      company_rif: (formData as any).company_rif,
      business_type: (formData as any).business_type,
      discount_percentage: Number.isFinite(discount) ? discount : 0,
      credit_limit: Number.isFinite(credit) ? credit : 0,
      aliado_id,
    });
    
    if (distError) throw distError;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating distributor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al crear distribuidor';
    console.error('Error details:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
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
    
    const body = await request.json();
    const { distributorId, userId, formData } = body;
    
    const admin = createAdminClient();

    const aliadoIdRaw = formData?.aliado_id;
    const aliado_id = typeof aliadoIdRaw === 'string' && aliadoIdRaw.length > 0 ? aliadoIdRaw : null;
    
    // Actualizar distribuidor
    const { error: distError } = await admin
      .from('distributors')
      .update({
        company_name: formData.company_name,
        company_rif: formData.company_rif,
        business_type: formData.business_type,
        discount_percentage: parseFloat(formData.discount_percentage),
        credit_limit: parseFloat(formData.credit_limit),
        aliado_id,
      })
      .eq('id', distributorId);
    
    if (distError) throw distError;
    
    // Actualizar perfil
    const { error: profileError } = await admin
      .from('user_profiles')
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
        document_type: formData.document_type,
        document_number: formData.document_number,
        shipping_address: formData.shipping_address,
        shipping_city: formData.shipping_city,
        shipping_state: formData.shipping_state,
        shipping_postal_code: formData.shipping_postal_code,
        shipping_country: formData.shipping_country,
      })
      .eq('id', userId);
    
    if (profileError) throw profileError;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating distributor:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar distribuidor' },
      { status: 500 }
    );
  }
}
