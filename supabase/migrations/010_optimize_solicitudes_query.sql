-- Función optimizada para obtener solicitudes con matches para un negocio
-- Esta función hace toda la búsqueda vectorial en PostgreSQL de forma eficiente
-- En lugar de hacer N x M llamadas RPC desde Node.js

create or replace function obtener_solicitudes_con_matches(
  p_negocio_id uuid,
  p_threshold float default 0.7,
  p_limit int default 50
)
returns table (
  solicitud_id uuid,
  solicitud_descripcion text,
  solicitud_cantidad int,
  solicitud_estado text,
  solicitud_created_at timestamptz,
  solicitud_user_id uuid,
  usuario_nombre text,
  usuario_email text,
  matches jsonb,
  oferta_enviada boolean,
  oferta_estado text
)
language plpgsql
security definer  -- Ejecutar con permisos del owner
set search_path = public  -- Prevenir path hijacking
as $$
begin
  -- VALIDACIÓN DE SEGURIDAD: Verificar que el negocio pertenece al usuario
  if not exists (
    select 1 from negocios
    where id = p_negocio_id
      and propietario_id = auth.uid()
  ) then
    raise exception 'Acceso denegado: el negocio no pertenece al usuario autenticado';
  end if;

  return query
  with productos_negocio as (
    -- Obtener productos activos del negocio con embeddings
    select 
      nc.id as negocio_catalogo_id,
      nc.precio_negocio,
      nc.stock_disponible,
      cm.id as producto_id,
      cm.nombre as producto_nombre,
      cm.descripcion as producto_descripcion,
      cm.embedding as producto_embedding
    from negocio_catalogo nc
    inner join catalogo_maestro cm on cm.id = nc.producto_id
    where nc.negocio_id = p_negocio_id
      and nc.activo = true
      and nc.stock_disponible > 0
  ),
  solicitudes_recientes as (
    -- Obtener las solicitudes más recientes
    select 
      c.id,
      c.producto_descripcion,
      c.cantidad,
      c.estado,
      c.created_at,
      c.user_id,
      c.embedding,
      u.nombre_completo,
      u.email
    from carrito c
    inner join usuarios u on u.id = c.user_id
    where c.estado in ('pendiente', 'con_ofertas')
    order by c.created_at desc
    limit p_limit
  ),
  matches_calculados as (
    -- Calcular similitudes entre solicitudes y productos
    select 
      sr.id as solicitud_id,
      sr.producto_descripcion as solicitud_descripcion,
      sr.cantidad,
      sr.estado,
      sr.created_at,
      sr.user_id,
      sr.nombre_completo,
      sr.email,
      pn.negocio_catalogo_id,
      pn.producto_id,
      pn.producto_nombre,
      pn.producto_descripcion as producto_descripcion_catalogo,
      pn.precio_negocio,
      pn.stock_disponible,
      -- Calcular similitud: 1 - distancia_coseno
      1.0 - (sr.embedding <=> pn.producto_embedding) as similitud
    from solicitudes_recientes sr
    cross join productos_negocio pn
    where 1.0 - (sr.embedding <=> pn.producto_embedding) >= p_threshold
  ),
  matches_agrupados as (
    -- Agrupar matches por solicitud
    select 
      mc.solicitud_id,
      mc.solicitud_descripcion,
      mc.cantidad,
      mc.estado,
      mc.created_at,
      mc.user_id,
      mc.nombre_completo,
      mc.email,
      jsonb_agg(
        jsonb_build_object(
          'negocio_catalogo_id', mc.negocio_catalogo_id,
          'producto_id', mc.producto_id,
          'producto_nombre', mc.producto_nombre,
          'producto_descripcion', mc.producto_descripcion_catalogo,
          'precio_unitario', mc.precio_negocio,
          'stock_disponible', mc.stock_disponible,
          'similitud', mc.similitud
        ) order by mc.similitud desc
      ) as matches_json
    from matches_calculados mc
    group by 
      mc.solicitud_id,
      mc.solicitud_descripcion,
      mc.cantidad,
      mc.estado,
      mc.created_at,
      mc.user_id,
      mc.nombre_completo,
      mc.email
  ),
  ofertas_existentes as (
    -- Verificar ofertas ya enviadas
    select 
      o.carrito_id,
      o.estado
    from ofertas o
    where o.negocio_id = p_negocio_id
  )
  select 
    ma.solicitud_id,
    ma.solicitud_descripcion,
    ma.cantidad,
    ma.estado,
    ma.created_at,
    ma.user_id,
    ma.nombre_completo,
    ma.email,
    ma.matches_json,
    (oe.carrito_id is not null) as oferta_enviada,
    oe.estado as oferta_estado
  from matches_agrupados ma
  left join ofertas_existentes oe on oe.carrito_id = ma.solicitud_id
  order by ma.created_at desc;
end;
$$;

comment on function obtener_solicitudes_con_matches is 'Obtiene solicitudes con matches de productos del negocio >= threshold. Optimizado para ejecutarse completamente en PostgreSQL sin loops en la aplicación.';
