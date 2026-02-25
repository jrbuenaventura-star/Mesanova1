-- Crear enum para estados de órdenes
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'borrador',
        'por_aprobar',
        'aprobada',
        'en_preparacion',
        'enviada',
        'entregada',
        'cancelada',
        'devuelta_rechazada'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Guardar definición del trigger
-- DROP TRIGGER trigger_update_user_metrics ON orders;

-- Agregar columna temporal para el nuevo tipo
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_new order_status;

-- Migrar datos existentes
UPDATE orders SET status_new = 
    CASE 
        WHEN status = 'pending' THEN 'por_aprobar'::order_status
        WHEN status = 'processing' THEN 'en_preparacion'::order_status
        WHEN status = 'shipped' THEN 'enviada'::order_status
        WHEN status = 'delivered' THEN 'entregada'::order_status
        WHEN status = 'cancelled' THEN 'cancelada'::order_status
        ELSE 'por_aprobar'::order_status
    END
WHERE status_new IS NULL;

-- Eliminar trigger temporalmente
DROP TRIGGER IF EXISTS trigger_update_user_metrics ON orders;

-- Eliminar columna antigua y renombrar la nueva
ALTER TABLE orders DROP COLUMN status CASCADE;
ALTER TABLE orders RENAME COLUMN status_new TO status;

-- Establecer valor por defecto
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'borrador'::order_status;
ALTER TABLE orders ALTER COLUMN status SET NOT NULL;

-- Recrear el trigger con el nuevo tipo
CREATE TRIGGER trigger_update_user_metrics 
    AFTER INSERT OR UPDATE OF status 
    ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_user_metrics_after_order();

COMMENT ON COLUMN orders.status IS 'Estado de la orden: borrador, por_aprobar, aprobada, en_preparacion, enviada, entregada, cancelada, devuelta_rechazada';;
