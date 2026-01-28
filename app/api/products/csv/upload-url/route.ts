import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const maxDuration = 60;

const CSV_UPLOAD_BUCKET = 'pqrs-attachments';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

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

    const body = (await request.json()) as {
      filename?: string;
      contentType?: string;
    };

    const filename = body.filename || 'import.csv';
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

    const ext = safeName.toLowerCase().endsWith('.csv') ? 'csv' : 'csv';
    const path = `admin/csv-products/${user.id}/${Date.now()}_${safeName.replace(/\.[^/.]+$/, '')}.${ext}`;

    const admin = createAdminClient();

    const { data, error } = await admin.storage
      .from(CSV_UPLOAD_BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data) {
      console.error('Error creando signed upload url:', error);
      return NextResponse.json({ error: 'No se pudo preparar la subida del archivo' }, { status: 400 });
    }

    return NextResponse.json({
      bucket: CSV_UPLOAD_BUCKET,
      path: data.path,
      signedUrl: data.signedUrl,
      token: data.token,
      filename,
      contentType: body.contentType || 'text/csv',
    });
  } catch (error) {
    console.error('Error in POST /api/products/csv/upload-url:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
