-- Rollback: Eliminar política que causa recursión infinita

drop policy if exists "Negocios completan carritos con ofertas reservadas" on carrito;

-- Crear función segura para que negocios completen carritos
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
  -- No importa el estado, ya que la validación debe hacerse antes de llamar a esta función
  if not exists (
    select 1 from ofertas
    where carrito_id = p_carrito_id
      and negocio_id = p_negocio_id
  ) then
    raise exception 'No hay oferta para este carrito';
  end if;

  -- Actualizar carrito a completado
  update carrito
  set 
    estado = 'completado',
    updated_at = now()
  where id = p_carrito_id;

  return true;
end;
$$;

comment on function completar_carrito_desde_negocio(uuid, uuid) is 
  'Permite que un negocio marque un carrito como completado cuando tiene una oferta reservada. Bypasea RLS de forma segura.';

