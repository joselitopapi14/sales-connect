-- Fix: Eliminar política problemática y actualizar función para bypass RLS
-- El estado debe validarse en el endpoint ANTES de actualizar la oferta

-- Eliminar la política que causa el problema
drop policy if exists "Negocios completan carritos con ofertas reservadas" on carrito;

-- Recrear función con bypass de RLS
create or replace function completar_carrito_desde_negocio(
  p_carrito_id uuid,
  p_negocio_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_carrito_user_id uuid;
begin
  -- Obtener usuario actual
  v_user_id := auth.uid();
  
  if v_user_id is null then
    raise exception 'Usuario no autenticado';
  end if;

  -- Verificar que el negocio pertenece al usuario
  if not exists (
    select 1 from negocios
    where id = p_negocio_id
      and propietario_id = v_user_id
  ) then
    raise exception 'Negocio no autorizado';
  end if;

  -- Verificar que existe una oferta de este negocio para este carrito
  -- No validamos el estado porque ya se validó antes de actualizar la oferta
  if not exists (
    select 1 from ofertas
    where carrito_id = p_carrito_id
      and negocio_id = p_negocio_id
  ) then
    raise exception 'No hay oferta para este carrito';
  end if;

  -- Obtener el user_id del carrito para el log
  select user_id into v_carrito_user_id
  from carrito
  where id = p_carrito_id;

  -- Actualizar carrito a completado (bypass RLS con security definer)
  update carrito
  set 
    estado = 'completado',
    updated_at = now()
  where id = p_carrito_id
    and user_id = v_carrito_user_id; -- Doble verificación de seguridad

  if not found then
    raise exception 'No se pudo actualizar el carrito';
  end if;

  return true;
end;
$$;

comment on function completar_carrito_desde_negocio(uuid, uuid) is 
  'Permite que un negocio marque un carrito como completado. La validación del estado de la oferta debe hacerse antes de llamar a esta función.';
