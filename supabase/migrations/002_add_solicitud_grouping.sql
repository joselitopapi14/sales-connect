-- Agregar columna para agrupar items de una misma solicitud
ALTER TABLE carrito ADD COLUMN solicitud_id uuid NOT NULL DEFAULT gen_random_uuid();

-- Crear índice para mejorar performance en queries agrupadas
CREATE INDEX idx_carrito_solicitud_id ON carrito(solicitud_id);
CREATE INDEX idx_carrito_user_solicitud ON carrito(user_id, solicitud_id);

-- Comentario explicativo
COMMENT ON COLUMN carrito.solicitud_id IS 'Agrupa todos los productos que fueron solicitados en una misma petición del InputGroup';
