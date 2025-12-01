-- Solución para la recursión infinita en políticas RLS de carrito
-- El problema ocurre cuando múltiples políticas se evalúan recursivamente en JOINs complejos

-- Primero, eliminamos todas las políticas de carrito
drop policy if exists "Usuarios ven su propio carrito" on carrito;
drop policy if exists "Negocios ven items que matchean con sus productos" on carrito;
drop policy if exists "Usuarios insertan en su carrito" on carrito;
drop policy if exists "Usuarios actualizan su carrito" on carrito;
drop policy if exists "Usuarios eliminan de su carrito" on carrito;

-- Recreamos las políticas con un enfoque más simple para evitar recursión

-- SELECT: Usuarios ven su propio carrito (simple, sin recursión)
create policy "Usuarios ven su propio carrito"
  on carrito
  for select
  to authenticated
  using (user_id = auth.uid());

-- SELECT: Negocios pueden ver items para hacer ofertas
-- Simplificamos la condición para evitar recursión
create policy "Negocios ven items para ofertar"
  on carrito
  for select
  to authenticated
  using (
    exists (
      select 1 from negocios n
      where n.propietario_id = auth.uid()
    )
  );

-- INSERT: Usuarios pueden insertar en su propio carrito
create policy "Usuarios insertan en su carrito"
  on carrito
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- UPDATE: Usuarios pueden actualizar su propio carrito
create policy "Usuarios actualizan su carrito"
  on carrito
  for update
  to authenticated
  using (user_id = auth.uid());

-- DELETE: Usuarios pueden eliminar de su propio carrito
create policy "Usuarios eliminan de su carrito"
  on carrito
  for delete
  to authenticated
  using (user_id = auth.uid());
