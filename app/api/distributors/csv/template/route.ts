import { NextResponse } from 'next/server';
import { generateEmptyCSVTemplate, generateCSVWithDescriptions } from '@/lib/csv/distributor-template';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const withDescriptions = searchParams.get('descriptions') === 'true';
  
  const content = withDescriptions 
    ? generateCSVWithDescriptions() 
    : generateEmptyCSVTemplate();
  
  const filename = withDescriptions 
    ? 'plantilla_distribuidores_con_instrucciones.csv'
    : 'plantilla_distribuidores.csv';
  
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
