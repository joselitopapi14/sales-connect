-- Actualizar función para mostrar solicitudes incluso sin matches perfectos
drop function if exists obtener_solicitudes_con_matches(uuid, float, int);

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
security definer
set search_path = public
as $$
begin
  -- VALIDACIÓN DE SEGURIDAD
  if not exists (
    select 1 from negocios
    where id = p_negocio_id
      and propietario_id = auth.uid()
  ) then
    raise exception 'Acceso denegado: el negocio no pertenece al usuario autenticado';
  end if;

  return query
  with productos_negocio as (
    select 
      nc.id as negocio_catalogo_id,
      nc.producto_id,
      nc.precio_negocio,
      nc.stock_disponible,
      nc.nombre_personalizado,
      cm.nombre as producto_nombre,
      cm.descripcion as producto_descripcion_catalogo,
      cm.embedding as producto_embedding
    from negocio_catalogo nc
    inner join catalogo_maestro cm on cm.id = nc.producto_id
    where nc.negocio_id = p_negocio_id
      and nc.activo = true
      and nc.stock_disponible > 0
      and cm.embedding is not null  -- Solo productos con embedding válido
  ),
  solicitudes_recientes as (
    select 
      c.id as solicitud_id,
      c.user_id,
      c.producto_descripcion,
      c.cantidad,
      c.estado,
      c.created_at,
      c.embedding,
      u.nombre_completo as usuario_nombre,
      u.email as usuario_email
    from carrito c
    inner join usuarios u on u.id = c.user_id
    where c.estado in ('pendiente', 'con_ofertas')
      and c.embedding is not null  -- Solo solicitudes con embedding válido
      -- Verificar que el producto existe en catalogo_maestro
      and exists (
        select 1 from catalogo_maestro cm
        where (c.embedding <=> cm.embedding) < 0.5  -- Similitud > 50% con algún producto del catálogo
      )
    order by c.created_at desc
    limit p_limit
  ),
  matches_calculados as (
    select 
      sr.solicitud_id,
      sr.user_id,
      sr.producto_descripcion as solicitud_descripcion,
      sr.cantidad,
      sr.estado,
      sr.created_at,
      sr.usuario_nombre,
      sr.usuario_email,
      pn.negocio_catalogo_id,
      pn.producto_id,
      pn.producto_nombre,
      pn.producto_descripcion_catalogo,
      pn.precio_negocio,
      pn.stock_disponible,
      1.0 - (sr.embedding <=> pn.producto_embedding) as similitud
    from solicitudes_recientes sr
    cross join productos_negocio pn
    where 1.0 - (sr.embedding <=> pn.producto_embedding) >= p_threshold
  ),
  matches_agrupados as (
    select 
      mc.solicitud_id,
      mc.usuario_nombre,
      mc.usuario_email,
      mc.user_id,
      mc.solicitud_descripcion,
      mc.cantidad,
      mc.estado,
      mc.created_at,
      jsonb_agg(
        jsonb_build_object(
          'negocio_catalogo_id', mc.negocio_catalogo_id,
          'producto_id', mc.producto_id,
          'producto_nombre', mc.producto_nombre,
          'producto_descripcion', mc.producto_descripcion_catalogo,
          'precio_negocio', mc.precio_negocio,
          'stock_disponible', mc.stock_disponible,
          'similitud', round(mc.similitud::numeric, 4)
        )
        order by mc.similitud desc
      ) as matches
    from matches_calculados mc
    group by mc.solicitud_id, mc.usuario_nombre, mc.usuario_email, mc.user_id, mc.solicitud_descripcion, mc.cantidad, mc.estado, mc.created_at
  ),
  ofertas_existentes as (
    select 
      o.carrito_id,
      o.estado as oferta_estado
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
    ma.usuario_nombre,
    ma.usuario_email,
    ma.matches,
    case when oe.carrito_id is not null then true else false end as oferta_enviada,
    oe.oferta_estado
  from matches_agrupados ma
  left join ofertas_existentes oe on oe.carrito_id = ma.solicitud_id
  order by ma.created_at desc;
end;
$$;

comment on function obtener_solicitudes_con_matches(uuid, float, int) is 'Obtiene solicitudes con matches. Solo muestra solicitudes que tienen embedding válido y existen en catalogo_maestro';
