import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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
    const { formData } = body;
    
    const admin = createAdminClient();
    
    // Buscar usuario existente por email
    const { data: usersData } = await admin.auth.admin.listUsers();
    const existingUser = usersData?.users?.find((u: any) => u.email === formData.email);
    
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
      // Usuario no existe, crear nuevo
      const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email: formData.email,
        email_confirm: true,
        user_metadata: {
          full_name: formData.full_name,
        },
      });
      
      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');
      
      userId = authData.user.id;
      
      // Crear perfil
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
    
    // Crear registro de distribuidor
    const { error: distError } = await admin.from('distributors').insert({
      user_id: userId,
      company_name: formData.company_name,
      company_rif: formData.company_rif,
      business_type: formData.business_type,
      discount_percentage: parseFloat(formData.discount_percentage),
      credit_limit: parseFloat(formData.credit_limit),
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
    
    // Actualizar distribuidor
    const { error: distError } = await admin
      .from('distributors')
      .update({
        company_name: formData.company_name,
        company_rif: formData.company_rif,
        business_type: formData.business_type,
        discount_percentage: parseFloat(formData.discount_percentage),
        credit_limit: parseFloat(formData.credit_limit),
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
