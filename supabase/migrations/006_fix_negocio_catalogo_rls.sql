-- Eliminar políticas existentes si existen
drop policy if exists "Usuarios ven productos de ofertas que van a aceptar" on negocio_catalogo;
drop policy if exists "Usuarios ven ofertas de sus items del carrito" on ofertas;
drop policy if exists "Usuarios ven ofertas a sus items del carrito" on ofertas;
drop policy if exists "Usuarios pueden actualizar ofertas cuando las aceptan" on ofertas;
drop policy if exists "Usuarios pueden actualizar su carrito cuando aceptan ofertas" on carrito;
drop policy if exists "Usuarios actualizan su carrito" on carrito;

-- Agregar política para que usuarios puedan leer negocio_catalogo cuando aceptan ofertas
create policy "Usuarios ven productos de ofertas que van a aceptar"
  on negocio_catalogo
  for select
  using (
    exists (
      select 1 from ofertas o
      inner join carrito c on c.id = o.carrito_id
      where o.negocio_catalogo_id = negocio_catalogo.id
        and c.user_id = auth.uid()
    )
  );

-- Agregar política para que usuarios puedan leer ofertas de sus items del carrito
-- IMPORTANTE: Reemplaza la política anterior para evitar conflictos
create policy "Usuarios ven ofertas de sus items del carrito"
  on ofertas
  for select
  using (
    exists (
      select 1 from carrito c
      where c.id = ofertas.carrito_id
        and c.user_id = auth.uid()
    )
  );

-- Agregar política para que usuarios puedan actualizar ofertas a "reservada" cuando las aceptan
create policy "Usuarios pueden actualizar ofertas cuando las aceptan"
  on ofertas
  for update
  using (
    exists (
      select 1 from carrito c
      where c.id = ofertas.carrito_id
        and c.user_id = auth.uid()
    )
  );

-- Agregar política para que usuarios puedan actualizar su carrito cuando aceptan ofertas
-- Esta reemplaza la política "Usuarios actualizan su carrito" de la migración 001
create policy "Usuarios actualizan su carrito"
  on carrito
  for update
  using (
    user_id = auth.uid()
  );
