import { createClient } from '@/lib/supabase/server';
import {
  ParsedProduct,
  ProductDiff,
  parseBooleanValue,
  parseNumericValue,
  parseEstadoValue,
  parseHoReCaValue,
} from './product-parser';
import { IMAGE_ALT_FIELDS, IMAGE_FIELDS, ProductCSVRow, parseBaseCategorySlug, parseDateDDMMYYYY } from './product-template';

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
  siloSlug: string;
  subcategoryId: string;
  productTypeId?: string;
}
const HORECA_ALLOWED_SILO_SLUGS = new Set(['mesa', 'cocina', 'cafe-te-bar']);

function normalizeKeyPart(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ');
}

function getSiloCacheKeys(silo: { slug: string; name: string }): string[] {
  const keys = new Set<string>();
  keys.add(normalizeKeyPart(silo.name));
  keys.add(normalizeKeyPart(silo.slug));

  const baseSlugFromName = parseBaseCategorySlug(silo.name);
  if (baseSlugFromName) keys.add(normalizeKeyPart(baseSlugFromName));

  const baseSlugFromSlug = parseBaseCategorySlug(silo.slug);
  if (baseSlugFromSlug) keys.add(normalizeKeyPart(baseSlugFromSlug));

  return Array.from(keys).filter(Boolean);
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
  const categoryCache = await buildCategoryCache(supabase);
  
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

async function buildCategoryCache(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<Map<string, CategoryInfo>> {
  const cache = new Map<string, CategoryInfo>();
  
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
      const siloKeys = getSiloCacheKeys({ slug: silo.slug, name: silo.name });
      const siloSubs = subcategories.filter(s => s.silo_id === silo.id);
      for (const sub of siloSubs) {
        for (const siloKey of siloKeys) {
          // Cache key para 2 niveles: silo|subcategoria
          const subKey = `${siloKey}|${normalizeKeyPart(sub.name)}`;
          if (!cache.has(subKey)) {
            cache.set(subKey, {
              siloId: silo.id,
              siloSlug: silo.slug,
              subcategoryId: sub.id,
            });
          }

          // Cache key para 1 nivel: solo silo (fallback)
          if (!cache.has(siloKey)) {
            cache.set(siloKey, {
              siloId: silo.id,
              siloSlug: silo.slug,
              subcategoryId: sub.id,
            });
          }
        }

        // También agregar tipos si existen
        if (productTypes) {
          const subTypes = productTypes.filter(t => t.subcategory_id === sub.id);
          for (const type of subTypes) {
            for (const siloKey of siloKeys) {
              const typeKey = `${siloKey}|${normalizeKeyPart(sub.name)}|${normalizeKeyPart(type.name)}`;
              if (!cache.has(typeKey)) {
                cache.set(typeKey, {
                  siloId: silo.id,
                  siloSlug: silo.slug,
                  subcategoryId: sub.id,
                  productTypeId: type.id,
                });
              }
            }
          }
        }
      }
    }
  }
  
  return cache;
}

function getCategoryInfo(
  data: ProductCSVRow,
  cache: Map<string, CategoryInfo>,
  index: 1 | 2 = 1
): CategoryInfo | null {
  const catField = `Categoria_${index}` as keyof ProductCSVRow;
  const subField = `Subcategoria_${index}` as keyof ProductCSVRow;
  const typeField = `Tipo_producto_${index}` as keyof ProductCSVRow;
  
  const categoriaRaw = data[catField] || '';
  const categoria = normalizeKeyPart(categoriaRaw);
  const subcategoria = normalizeKeyPart(data[subField] || '');
  const tipo = normalizeKeyPart(data[typeField] || '');
  const baseCategorySlug = parseBaseCategorySlug(categoriaRaw || '');
  const categoryKeys = new Set<string>();
  
  if (!categoria) return null;
  categoryKeys.add(categoria);
  if (baseCategorySlug) {
    categoryKeys.add(normalizeKeyPart(baseCategorySlug));
  }
  
  for (const categoryKey of categoryKeys) {
    // Intentar con los 3 niveles
    if (tipo) {
      const key = `${categoryKey}|${subcategoria}|${tipo}`;
      const info = cache.get(key);
      if (info) return info;
    }
    
    // Intentar con 2 niveles
    if (subcategoria) {
      const key = `${categoryKey}|${subcategoria}`;
      const info = cache.get(key);
      if (info) return info;
    }

    // Intentar con 1 nivel (solo silo)
    const siloInfo = cache.get(categoryKey);
    if (siloInfo) return siloInfo;
  }
  
  return null;
}

function getAllCategoryInfos(
  data: ProductCSVRow,
  cache: Map<string, CategoryInfo>
): CategoryInfo[] {
  const categoryInfos: CategoryInfo[] = [];
  
  // Procesar hasta 2 categorías
  for (let i = 1; i <= 2; i++) {
    const info = getCategoryInfo(data, cache, i as 1 | 2);
    if (info) {
      categoryInfos.push(info);
    }
  }
  
  return categoryInfos;
}

function assertPrimaryCategoryResolved(categoryInfos: CategoryInfo[]): void {
  if (categoryInfos.length === 0) {
    throw new Error('No se pudo resolver una categoría válida (Categoria_1/Subcategoria_1) para el producto.');
  }
}

function assertHoReCaCategoryConsistency(data: ProductCSVRow, categoryInfos: CategoryInfo[]): void {
  const horecaValue = parseHoReCaValue(data.HoReCa);
  if (horecaValue === 'NO') return;

  if (categoryInfos.length === 0) {
    throw new Error('Los productos HoReCa (SI/EXCLUSIVO) deben tener una categoría válida: Mesa, Cocina o Café, té y bar.');
  }

  const invalidCategory = categoryInfos.find((categoryInfo) => !HORECA_ALLOWED_SILO_SLUGS.has(categoryInfo.siloSlug));
  if (invalidCategory) {
    throw new Error('Los productos HoReCa (SI/EXCLUSIVO) solo pueden pertenecer a Mesa, Cocina o Café, té y bar.');
  }
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
  
  // Obtener todas las categorías (hasta 3)
  const categoryInfos = getAllCategoryInfos(data, categoryCache);
  assertPrimaryCategoryResolved(categoryInfos);
  assertHoReCaCategoryConsistency(data, categoryInfos);
  const primaryCategory = categoryInfos[0] || null;
  
  // Parsear fecha de lanzamiento (DD/MM/YYYY -> YYYY-MM-DD)
  const fechaLanzamiento = parseDateDDMMYYYY(data.Fecha_Lanzamiento);
  
  // Crear producto
  const { data: product, error } = await supabase
    .from('products')
    .insert({
      pdt_codigo: data.Ref,
      ref_pub: data.SKU || null,
      nombre_comercial: data.Producto,
      pdt_descripcion: data.Descripcion || null,
      marca: data.Marca || null,
      precio: parseNumericValue(data.Precio_COP),
      descuento_porcentaje: parseNumericValue(data.Descuento) || 0,
      precio_dist: parseNumericValue(data.Precio_Dist),
      desc_dist: parseNumericValue(data.Desc_Dist) || 0,
      upp_existencia: parseNumericValue(data.Existencia_inv) || 0,
      pedido_en_camino: parseNumericValue(data.Pedido_en_camino),
      descontinuado: parseBooleanValue(data.Descontinuado),
      pdt_empaque: data.Inner_pack || null,
      outer_pack: parseNumericValue(data.Outer_pack) as number | null,
      nombre_coleccion: data.Coleccion || null,
      product_type_id: primaryCategory?.productTypeId || null,
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
      fecha_lanzamiento: fechaLanzamiento,
      horeca: parseHoReCaValue(data.HoReCa),
      imagen_principal_url: data.Image_1 || null,
      slug,
      is_active: parseEstadoValue(data.Estado),
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
  
  // Asociar con todas las categorías (hasta 3)
  if (product && categoryInfos.length > 0) {
    const categoryInserts = categoryInfos.map((catInfo, index) => ({
      product_id: product.id,
      subcategory_id: catInfo.subcategoryId,
      is_primary: index === 0, // Primera categoría es primaria
    }));
    
    await supabase
      .from('product_categories')
      .insert(categoryInserts);
  }
  
  // Insertar imágenes del producto (incluye principal y adicionales)
  if (product) {
    await syncProductImages(supabase, product.id, data);
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
  const categoryInfos = getAllCategoryInfos(data, categoryCache);
  assertHoReCaCategoryConsistency(data, categoryInfos);
  
  // Construir objeto de actualización solo con campos cambiados
  const updateData: Record<string, unknown> = {
    updated_by: userId,
    last_csv_update: new Date().toISOString(),
    is_on_sale: (parseNumericValue(data.Descuento) || 0) > 0,
  };
  
  // Mapear campos CSV a campos de BD
  const fieldMap: Record<string, { dbField: string; transform?: (v: string) => unknown }> = {
    SKU: { dbField: 'ref_pub' },
    Producto: { dbField: 'nombre_comercial' },
    Estado: { dbField: 'is_active', transform: parseEstadoValue },
    Descripcion: { dbField: 'pdt_descripcion' },
    Marca: { dbField: 'marca' },
    Precio_COP: { dbField: 'precio', transform: parseNumericValue },
    Descuento: { dbField: 'descuento_porcentaje', transform: (v) => parseNumericValue(v) || 0 },
    Precio_Dist: { dbField: 'precio_dist', transform: parseNumericValue },
    Desc_Dist: { dbField: 'desc_dist', transform: (v) => parseNumericValue(v) || 0 },
    Existencia_inv: { dbField: 'upp_existencia', transform: (v) => parseNumericValue(v) || 0 },
    Pedido_en_camino: { dbField: 'pedido_en_camino', transform: parseNumericValue },
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
    Fecha_Lanzamiento: { dbField: 'fecha_lanzamiento', transform: parseDateDDMMYYYY },
    HoReCa: { dbField: 'horeca', transform: parseHoReCaValue },
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
  
  // Actualizar categorías si cambiaron (cualquiera de las 3)
  const categoryChanges = diff.changes.filter(c => 
    c.field.startsWith('Categoria_') || 
    c.field.startsWith('Subcategoria_') || 
    c.field.startsWith('Tipo_producto_')
  );
  
  if (categoryChanges.length > 0) {
    assertPrimaryCategoryResolved(categoryInfos);

    // Eliminar categorías existentes y reinsertar
    await supabase
      .from('product_categories')
      .delete()
      .eq('product_id', productId);
    
    if (categoryInfos.length > 0) {
      const categoryInserts = categoryInfos.map((catInfo, index) => ({
        product_id: productId,
        subcategory_id: catInfo.subcategoryId,
        is_primary: index === 0,
      }));
      
      await supabase
        .from('product_categories')
        .insert(categoryInserts);
      
      // Actualizar product_type_id con la categoría primaria
      if (categoryInfos[0]?.productTypeId) {
        await supabase
          .from('products')
          .update({ product_type_id: categoryInfos[0].productTypeId })
          .eq('id', productId);
      }
    }
  }
  
  // Actualizar imágenes si cambiaron
  const imageChanges = diff.changes.filter(
    (c) => c.field.startsWith('Image_') || c.field.startsWith('SEO_Alt_Text_')
  );
  if (imageChanges.length > 0) {
    await syncProductImages(supabase, productId, data);
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

async function syncProductImages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  data: ProductCSVRow
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('product_media')
    .delete()
    .eq('product_id', productId)
    .eq('media_type', 'image');

  if (deleteError) {
    throw new Error(`Error limpiando imágenes existentes: ${deleteError.message}`);
  }

  const images: { product_id: string; media_type: string; url: string; order_index: number; alt_text: string | null }[] = [];
  for (let i = 0; i < IMAGE_FIELDS.length; i++) {
    const imageField = IMAGE_FIELDS[i];
    const altField = IMAGE_ALT_FIELDS[i];
    const url = (data[imageField] || '').trim();
    if (!url) continue;

    const altText = (data[altField] || '').trim();
    images.push({
      product_id: productId,
      media_type: 'image',
      url,
      order_index: i + 1,
      alt_text: altText || null,
    });
  }

  if (images.length > 0) {
    const { error: insertError } = await supabase.from('product_media').insert(images);
    if (insertError) {
      throw new Error(`Error guardando imágenes: ${insertError.message}`);
    }
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
    .select(`
      *,
      product_media(url, alt_text, order_index, media_type)
    `);
  
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
      product_categories(
        is_primary,
        subcategory:subcategories(
          name,
          silo:silos(name)
        )
      ),
      product_type:product_types(name),
      product_media(url, alt_text, order_index, media_type)
    `)
    .order('pdt_codigo');
  
  if (!products || products.length === 0) {
    return '';
  }
  
  const { CSV_HEADERS } = await import('./product-template');
  
  const rows: string[] = [CSV_HEADERS.join(',')];
  
  for (const product of products) {
    const categories =
      product.product_categories
        ?.slice()
        .sort((a: { is_primary?: boolean }, b: { is_primary?: boolean }) => {
          const aPrimary = a.is_primary ? 1 : 0;
          const bPrimary = b.is_primary ? 1 : 0;
          return bPrimary - aPrimary;
        }) || [];

    const category1 = categories[0]?.subcategory;
    const category2 = categories[1]?.subcategory;

    const imageMedia =
      product.product_media
        ?.filter((m: { media_type?: string | null }) => m.media_type === 'image' || !m.media_type)
        .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index) || [];

    const imageByOrder = new Map<number, { url?: string | null; alt_text?: string | null }>();
    for (const media of imageMedia) {
      if (!imageByOrder.has(media.order_index)) {
        imageByOrder.set(media.order_index, media);
      }
    }

    const image1Url = product.imagen_principal_url || imageByOrder.get(1)?.url || '';
    const image1Alt = imageByOrder.get(1)?.alt_text || '';
    
    const row: string[] = [
      escapeCSV(product.pdt_codigo || ''),
      escapeCSV(product.ref_pub || ''),
      escapeCSV(product.nombre_comercial || ''),
      product.is_active ? 'ACTIVO' : 'INACTIVO',
      escapeCSV(product.pdt_descripcion || ''),
      escapeCSV(product.marca || ''),
      String(product.precio || ''),
      String(product.descuento_porcentaje || '0'),
      String(product.precio_dist || ''),
      String(product.desc_dist || '0'),
      String(product.upp_existencia || '0'),
      product.pedido_en_camino ? 'SI' : 'NO',
      product.descontinuado ? 'SI' : 'NO',
      escapeCSV(product.pdt_empaque || ''),
      String(product.outer_pack || ''),
      escapeCSV(product.nombre_coleccion || ''),
      escapeCSV(category1?.silo?.name || ''),
      escapeCSV(category1?.name || ''),
      escapeCSV(product.product_type?.name || ''),
      escapeCSV(category2?.silo?.name || ''),
      escapeCSV(category2?.name || ''),
      '',
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
      escapeCSV(product.horeca || ''),
      escapeCSV(image1Url),
      ...Array.from({ length: 9 }, (_, i) => {
        const img = imageByOrder.get(i + 2);
        return escapeCSV(img?.url || '');
      }),
      escapeCSV(image1Alt),
      ...Array.from({ length: 9 }, (_, i) => {
        const img = imageByOrder.get(i + 2);
        return escapeCSV(img?.alt_text || '');
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
