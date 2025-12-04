-- Migración: Permitir que negocios actualicen carritos cuando completan compras

-- Agregar política para que negocios puedan actualizar carrito a "completado"
-- cuando tienen una oferta reservada
drop policy if exists "Negocios completan carritos con ofertas reservadas" on carrito;

create policy "Negocios completan carritos con ofertas reservadas"
  on carrito
  for update
  to authenticated
  using (
    -- Permitir si existe una oferta reservada de un negocio del usuario
    exists (
      select 1 
      from ofertas o
      inner join negocios n on n.id = o.negocio_id
      where o.carrito_id = carrito.id
        and n.propietario_id = auth.uid()
        and o.estado = 'reservada'
    )
  )
  with check (
    -- Solo permitir actualizar el estado a completado
    estado = 'completado'
  );

comment on policy "Negocios completan carritos con ofertas reservadas" on carrito is 
  'Permite que negocios actualicen el estado del carrito a completado cuando tienen una oferta reservada';
