import { createClient } from '@/lib/supabase/server';
import {
  ParsedProduct,
  ProductDiff,
  parseBooleanValue,
  parseNumericValue,
} from './product-parser';
import { ProductCSVRow } from './product-template';

export interface ImportResult {
  success: boolean;
  importId: string;
  created: number;
  updated: number;
  skipped: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  ref: string;
  error: string;
}

interface CategoryInfo {
  siloId: string;
  subcategoryId: string;
  productTypeId?: string;
}

export async function importProducts(
  products: ParsedProduct[],
  diffs: ProductDiff[],
  importMode: 'update' | 'add_only' | 'replace_all',
  userId: string,
  filename: string
): Promise<ImportResult> {
  const supabase = await createClient();
  const errors: ImportError[] = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;
  
  // Crear registro de importación
  const { data: importRecord, error: importError } = await supabase
    .from('csv_imports')
    .insert({
      filename,
      total_rows: products.length,
      status: 'processing',
      import_mode: importMode,
      imported_by: userId,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  
  if (importError || !importRecord) {
    return {
      success: false,
      importId: '',
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [{ row: 0, ref: '', error: 'Error al crear registro de importación' }],
    };
  }
  
  const importId = importRecord.id;
  
  // Pre-cargar categorías
  const categoryCache = await loadCategoryCache(supabase);
  
  // Procesar cada producto
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const diff = diffs.find(d => d.ref === product.data.Ref);
    
    if (!product.isValid) {
      skipped++;
      continue;
    }
    
    if (!diff) {
      skipped++;
      continue;
    }
    
    try {
      if (diff.changeType === 'create') {
        if (importMode === 'update') {
          // En modo update, también se crean nuevos
          await createProduct(supabase, product.data, categoryCache, userId, importId, product.row);
          created++;
        } else if (importMode === 'add_only') {
          await createProduct(supabase, product.data, categoryCache, userId, importId, product.row);
          created++;
        } else {
          await createProduct(supabase, product.data, categoryCache, userId, importId, product.row);
          created++;
        }
      } else if (diff.changeType === 'update') {
        if (importMode === 'add_only') {
          skipped++;
        } else {
          await updateProduct(supabase, product.data, diff, categoryCache, userId, importId, product.row);
          updated++;
        }
      } else {
        skipped++;
      }
    } catch (error) {
      errors.push({
        row: product.row,
        ref: product.data.Ref,
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }
  
  // Actualizar registro de importación
  await supabase
    .from('csv_imports')
    .update({
      rows_created: created,
      rows_updated: updated,
      rows_skipped: skipped,
      rows_error: errors.length,
      errors: errors.length > 0 ? errors : null,
      status: errors.length === 0 ? 'completed' : 'completed_with_errors',
      completed_at: new Date().toISOString(),
    })
    .eq('id', importId);
  
  return {
    success: errors.length === 0,
    importId,
    created,
    updated,
    skipped,
    errors,
  };
}

async function loadCategoryCache(supabase: Awaited<ReturnType<typeof createClient>>) {
  const cache: Map<string, CategoryInfo> = new Map();
  
  // Cargar silos
  const { data: silos } = await supabase
    .from('silos')
    .select('id, slug, name');
  
  // Cargar subcategorías
  const { data: subcategories } = await supabase
    .from('subcategories')
    .select('id, slug, name, silo_id');
  
  // Cargar tipos de producto
  const { data: productTypes } = await supabase
    .from('product_types')
    .select('id, slug, name, subcategory_id');
  
  // Crear mapa combinado
  if (silos && subcategories) {
    for (const silo of silos) {
      const siloSubs = subcategories.filter(s => s.silo_id === silo.id);
      for (const sub of siloSubs) {
        // Clave: "categoria|subcategoria"
        const key = `${silo.name.toLowerCase()}|${sub.name.toLowerCase()}`;
        cache.set(key, {
          siloId: silo.id,
          subcategoryId: sub.id,
        });
        
        // También agregar tipos si existen
        if (productTypes) {
          const subTypes = productTypes.filter(t => t.subcategory_id === sub.id);
          for (const type of subTypes) {
            const typeKey = `${silo.name.toLowerCase()}|${sub.name.toLowerCase()}|${type.name.toLowerCase()}`;
            cache.set(typeKey, {
              siloId: silo.id,
              subcategoryId: sub.id,
              productTypeId: type.id,
            });
          }
        }
      }
    }
  }
  
  return cache;
}

function getCategoryInfo(
  data: ProductCSVRow,
  cache: Map<string, CategoryInfo>
): CategoryInfo | null {
  const categoria = data.Categoria?.toLowerCase().trim() || '';
  const subcategoria = data.Subcategoria?.toLowerCase().trim() || '';
  const tipo = data.Tipo_producto?.toLowerCase().trim() || '';
  
  // Intentar con los 3 niveles
  if (tipo) {
    const key = `${categoria}|${subcategoria}|${tipo}`;
    const info = cache.get(key);
    if (info) return info;
  }
  
  // Intentar con 2 niveles
  if (subcategoria) {
    const key = `${categoria}|${subcategoria}`;
    const info = cache.get(key);
    if (info) return info;
  }
  
  return null;
}

async function createProduct(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: ProductCSVRow,
  categoryCache: Map<string, CategoryInfo>,
  userId: string,
  importId: string,
  rowNumber: number
): Promise<void> {
  // Generar slug
  const slug = generateSlug(data.Producto);
  
  // Obtener categoría
  const categoryInfo = getCategoryInfo(data, categoryCache);
  
  // Crear producto
  const { data: product, error } = await supabase
    .from('products')
    .insert({
      pdt_codigo: data.Ref,
      codigo_barras: data.Cod_Barra || null,
      nombre_comercial: data.Producto,
      pdt_descripcion: data.Descripcion || null,
      marca: data.Marca || null,
      precio: parseNumericValue(data.Precio_COP),
      descuento_porcentaje: parseNumericValue(data.Descuento) || 0,
      upp_existencia: parseNumericValue(data.Existencia_inv) || 0,
      pedido_en_camino: parseBooleanValue(data.Pedido_en_camino),
      descontinuado: parseBooleanValue(data.Descontinuado),
      pdt_empaque: data.Inner_pack || null,
      outer_pack: parseNumericValue(data.Outer_pack) as number | null,
      nombre_coleccion: data.Coleccion || null,
      product_type_id: categoryInfo?.productTypeId || null,
      material: data.Material || null,
      color: data.Color || null,
      dimensiones: data.Dimensiones || null,
      peso: parseNumericValue(data.Peso_kg),
      capacidad: data.Capacidad || null,
      pais_origen: data.Pais_origen || null,
      descripcion_larga: data.Descrip_Cliente_Final || null,
      momentos_uso: data.Momentos_Uso_Cliente || null,
      productos_afines_csv: data.Productos_Afines_Cliente || null,
      descripcion_distribuidor: data.Descrip_Distribuidor || null,
      argumentos_venta: data.Argumentos_Venta_Distribuidor || null,
      ubicacion_tienda: data.Ubicacion_Tienda_Distribuidor || null,
      margen_sugerido: parseNumericValue(data.Margen_Sugerido),
      rotacion_esperada: data.Rotacion_Esperada?.toLowerCase() || null,
      seo_title: data.SEO_Title || null,
      seo_description: data.SEO_Description || null,
      tags: data.Tags ? data.Tags.split(',').map(t => t.trim()) : null,
      video_url: data.Video_URL || null,
      ficha_tecnica_url: data.Ficha_Tecnica_URL || null,
      fecha_lanzamiento: data.Fecha_Lanzamiento || null,
      imagen_principal_url: data.Image_1 || null,
      slug,
      is_active: true,
      is_on_sale: (parseNumericValue(data.Descuento) || 0) > 0,
      last_csv_update: new Date().toISOString(),
      created_by: userId,
      updated_by: userId,
    })
    .select('id')
    .single();
  
  if (error) {
    throw new Error(`Error creando producto: ${error.message}`);
  }
  
  // Asociar con categoría
  if (product && categoryInfo) {
    await supabase
      .from('product_categories')
      .insert({
        product_id: product.id,
        subcategory_id: categoryInfo.subcategoryId,
        is_primary: true,
      });
  }
  
  // Insertar imágenes adicionales
  if (product) {
    await insertProductImages(supabase, product.id, data);
  }
  
  // Crear log de cambio
  await supabase
    .from('product_change_log')
    .insert({
      product_id: product?.id,
      change_type: 'create',
      change_source: 'csv',
      fields_changed: { all: 'new product' },
      changed_by: userId,
      csv_filename: importId,
      csv_row_number: rowNumber,
    });
}

async function updateProduct(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: ProductCSVRow,
  diff: ProductDiff,
  categoryCache: Map<string, CategoryInfo>,
  userId: string,
  importId: string,
  rowNumber: number
): Promise<void> {
  // Obtener producto existente
  const { data: existingProduct } = await supabase
    .from('products')
    .select('id')
    .eq('pdt_codigo', data.Ref)
    .single();
  
  if (!existingProduct) {
    throw new Error('Producto no encontrado para actualizar');
  }
  
  const productId = existingProduct.id;
  const categoryInfo = getCategoryInfo(data, categoryCache);
  
  // Construir objeto de actualización solo con campos cambiados
  const updateData: Record<string, unknown> = {
    updated_by: userId,
    last_csv_update: new Date().toISOString(),
    is_on_sale: (parseNumericValue(data.Descuento) || 0) > 0,
  };
  
  // Mapear campos CSV a campos de BD
  const fieldMap: Record<string, { dbField: string; transform?: (v: string) => unknown }> = {
    Cod_Barra: { dbField: 'codigo_barras' },
    Producto: { dbField: 'nombre_comercial' },
    Descripcion: { dbField: 'pdt_descripcion' },
    Marca: { dbField: 'marca' },
    Precio_COP: { dbField: 'precio', transform: parseNumericValue },
    Descuento: { dbField: 'descuento_porcentaje', transform: (v) => parseNumericValue(v) || 0 },
    Existencia_inv: { dbField: 'upp_existencia', transform: (v) => parseNumericValue(v) || 0 },
    Pedido_en_camino: { dbField: 'pedido_en_camino', transform: parseBooleanValue },
    Descontinuado: { dbField: 'descontinuado', transform: parseBooleanValue },
    Inner_pack: { dbField: 'pdt_empaque' },
    Outer_pack: { dbField: 'outer_pack', transform: parseNumericValue },
    Coleccion: { dbField: 'nombre_coleccion' },
    Material: { dbField: 'material' },
    Color: { dbField: 'color' },
    Dimensiones: { dbField: 'dimensiones' },
    Peso_kg: { dbField: 'peso', transform: parseNumericValue },
    Capacidad: { dbField: 'capacidad' },
    Pais_origen: { dbField: 'pais_origen' },
    Descrip_Cliente_Final: { dbField: 'descripcion_larga' },
    Momentos_Uso_Cliente: { dbField: 'momentos_uso' },
    Productos_Afines_Cliente: { dbField: 'productos_afines_csv' },
    Descrip_Distribuidor: { dbField: 'descripcion_distribuidor' },
    Argumentos_Venta_Distribuidor: { dbField: 'argumentos_venta' },
    Ubicacion_Tienda_Distribuidor: { dbField: 'ubicacion_tienda' },
    Margen_Sugerido: { dbField: 'margen_sugerido', transform: parseNumericValue },
    Rotacion_Esperada: { dbField: 'rotacion_esperada', transform: (v) => v?.toLowerCase() || null },
    SEO_Title: { dbField: 'seo_title' },
    SEO_Description: { dbField: 'seo_description' },
    Tags: { dbField: 'tags', transform: (v) => v ? v.split(',').map(t => t.trim()) : null },
    Video_URL: { dbField: 'video_url' },
    Ficha_Tecnica_URL: { dbField: 'ficha_tecnica_url' },
    Fecha_Lanzamiento: { dbField: 'fecha_lanzamiento' },
    Image_1: { dbField: 'imagen_principal_url' },
  };
  
  for (const change of diff.changes) {
    const mapping = fieldMap[change.field];
    if (mapping) {
      const value = data[change.field as keyof ProductCSVRow];
      updateData[mapping.dbField] = mapping.transform 
        ? mapping.transform(value) 
        : (value || null);
    }
  }
  
  // Actualizar producto
  const { error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', productId);
  
  if (error) {
    throw new Error(`Error actualizando producto: ${error.message}`);
  }
  
  // Actualizar tipo de producto si cambió
  if (categoryInfo?.productTypeId) {
    await supabase
      .from('products')
      .update({ product_type_id: categoryInfo.productTypeId })
      .eq('id', productId);
  }
  
  // Actualizar imágenes si cambiaron
  const imageChanges = diff.changes.filter(c => c.field.startsWith('Image_'));
  if (imageChanges.length > 0) {
    // Eliminar imágenes existentes y reinsertar
    await supabase
      .from('product_media')
      .delete()
      .eq('product_id', productId);
    
    await insertProductImages(supabase, productId, data);
  }
  
  // Crear log de cambio
  const changesJson: Record<string, { old: string | null; new: string | null }> = {};
  for (const change of diff.changes) {
    changesJson[change.field] = {
      old: change.oldValue,
      new: change.newValue,
    };
  }
  
  await supabase
    .from('product_change_log')
    .insert({
      product_id: productId,
      change_type: 'update',
      change_source: 'csv',
      fields_changed: changesJson,
      changed_by: userId,
      csv_filename: importId,
      csv_row_number: rowNumber,
    });
}

async function insertProductImages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  data: ProductCSVRow
): Promise<void> {
  const images: { product_id: string; media_type: string; url: string; order_index: number }[] = [];
  
  const imageFields: (keyof ProductCSVRow)[] = [
    'Image_2', 'Image_3', 'Image_4', 'Image_5',
    'Image_6', 'Image_7', 'Image_8', 'Image_9', 'Image_10',
  ];
  
  for (let i = 0; i < imageFields.length; i++) {
    const url = data[imageFields[i]];
    if (url && url.trim() !== '') {
      images.push({
        product_id: productId,
        media_type: 'image',
        url: url.trim(),
        order_index: i + 2, // Image_1 es principal, estas empiezan en 2
      });
    }
  }
  
  if (images.length > 0) {
    await supabase.from('product_media').insert(images);
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Solo alfanuméricos
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Múltiples guiones a uno
    .replace(/^-|-$/g, ''); // Remover guiones inicio/fin
}

export async function getExistingProductsMap(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<Map<string, Record<string, unknown>>> {
  const { data: products } = await supabase
    .from('products')
    .select('*');
  
  const map = new Map<string, Record<string, unknown>>();
  if (products) {
    for (const product of products) {
      map.set(product.pdt_codigo, product);
    }
  }
  
  return map;
}

export async function exportProductsToCSV(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string> {
  const { data: products } = await supabase
    .from('products')
    .select(`
      *,
      product_categories!inner(
        subcategory:subcategories(
          name,
          silo:silos(name)
        )
      ),
      product_type:product_types(name),
      product_media(url, order_index)
    `)
    .order('pdt_codigo');
  
  if (!products || products.length === 0) {
    return '';
  }
  
  const { CSV_HEADERS } = await import('./product-template');
  
  const rows: string[] = [CSV_HEADERS.join(',')];
  
  for (const product of products) {
    const category = product.product_categories?.[0]?.subcategory;
    const images = product.product_media?.sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index) || [];
    
    const row: string[] = [
      escapeCSV(product.pdt_codigo || ''),
      escapeCSV(product.codigo_barras || ''),
      escapeCSV(product.nombre_comercial || ''),
      escapeCSV(product.pdt_descripcion || ''),
      escapeCSV(product.marca || ''),
      String(product.precio || ''),
      String(product.descuento_porcentaje || '0'),
      String(product.upp_existencia || '0'),
      product.pedido_en_camino ? 'SI' : 'NO',
      product.descontinuado ? 'SI' : 'NO',
      escapeCSV(product.pdt_empaque || ''),
      String(product.outer_pack || ''),
      escapeCSV(product.nombre_coleccion || ''),
      escapeCSV(category?.silo?.name || ''),
      escapeCSV(category?.name || ''),
      escapeCSV(product.product_type?.name || ''),
      escapeCSV(product.material || ''),
      escapeCSV(product.color || ''),
      escapeCSV(product.dimensiones || ''),
      String(product.peso || ''),
      escapeCSV(product.capacidad || ''),
      escapeCSV(product.pais_origen || ''),
      escapeCSV(product.descripcion_larga || ''),
      escapeCSV(product.momentos_uso || ''),
      escapeCSV(product.productos_afines_csv || ''),
      escapeCSV(product.descripcion_distribuidor || ''),
      escapeCSV(product.argumentos_venta || ''),
      escapeCSV(product.ubicacion_tienda || ''),
      String(product.margen_sugerido || ''),
      escapeCSV(product.rotacion_esperada || ''),
      escapeCSV(product.seo_title || ''),
      escapeCSV(product.seo_description || ''),
      escapeCSV((product.tags || []).join(',')),
      escapeCSV(product.video_url || ''),
      escapeCSV(product.ficha_tecnica_url || ''),
      escapeCSV(product.fecha_lanzamiento || ''),
      escapeCSV(product.imagen_principal_url || ''),
      ...Array.from({ length: 9 }, (_, i) => {
        const img = images.find((m: { order_index: number }) => m.order_index === i + 2);
        return escapeCSV(img?.url || '');
      }),
    ];
    
    rows.push(row.join(','));
  }
  
  return rows.join('\n');
}

function escapeCSV(value: string): string {
  if (!value) return '';
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
