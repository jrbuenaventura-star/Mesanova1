-- Script para eliminar categorías Neveras y Termos
-- Mesanova se especializa únicamente en productos de mesa y cocina

-- Primero, eliminar productos asociados a estas categorías
DELETE FROM products 
WHERE category_id IN (
  SELECT id FROM categories WHERE name IN ('Neveras', 'Termos')
);

-- Eliminar subcategorías asociadas
DELETE FROM subcategories 
WHERE category_id IN (
  SELECT id FROM categories WHERE name IN ('Neveras', 'Termos')
);

-- Eliminar tipos de producto asociados
DELETE FROM product_types 
WHERE category_id IN (
  SELECT id FROM categories WHERE name IN ('Neveras', 'Termos')
);

-- Finalmente, eliminar las categorías
DELETE FROM categories WHERE name IN ('Neveras', 'Termos');

-- Verificar categorías restantes
SELECT id, name, silo_id FROM categories ORDER BY name;
