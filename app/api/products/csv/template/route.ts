import { NextResponse } from 'next/server';
import { generateCSVWithDescriptions, generateEmptyCSVTemplate } from '@/lib/csv/product-template';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeDescriptions = searchParams.get('descriptions') === 'true';
  
  const csvContent = includeDescriptions 
    ? generateCSVWithDescriptions() 
    : generateEmptyCSVTemplate();
  
  const filename = includeDescriptions 
    ? 'productos_template_con_instrucciones.csv'
    : 'productos_template.csv';
  
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
