-- Add segment column to products table for Core/Value/Premium segmentation
-- Migration: add_product_segment
-- Date: 2026-02-04

-- Add segment column with check constraint
ALTER TABLE products 
ADD COLUMN segment TEXT CHECK (segment IN ('core', 'value', 'premium')) DEFAULT 'core';

-- Add comment to document the field
COMMENT ON COLUMN products.segment IS 'Product business segmentation: core (volume/rotation), value (margin/differentiation), premium (brand/aspiration)';

-- Create index for filtering by segment
CREATE INDEX idx_products_segment ON products(segment) WHERE segment IS NOT NULL;
