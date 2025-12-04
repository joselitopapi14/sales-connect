-- Políticas RLS para permitir que la función obtener_solicitudes_con_matches funcione correctamente
-- La función necesita acceso de lectura a varias tablas para hacer los JOINs

-- Permitir a negocios ver el catálogo maestro para hacer matches
drop policy if exists "Negocios pueden ver catalogo maestro" on catalogo_maestro;
create policy "Negocios pueden ver catalogo maestro"
  on catalogo_maestro
  for select
  to authenticated
  using (
    -- Permitir si el usuario tiene al menos un negocio
    exists (
      select 1 from negocios n
      where n.propietario_id = auth.uid()
    )
  );

-- Permitir a negocios ver solicitudes para hacer matches
drop policy if exists "Negocios ven solicitudes para hacer ofertas" on carrito;
create policy "Negocios ven solicitudes para hacer ofertas"
  on carrito
  for select
  to authenticated
  using (
    -- Permitir si el usuario tiene al menos un negocio
    -- La función filtrará internamente por similitud
    exists (
      select 1 from negocios n
      where n.propietario_id = auth.uid()
    )
  );

-- Asegurar que negocios puedan ver información de usuarios que hacen solicitudes
drop policy if exists "Negocios ven info basica de usuarios solicitantes" on usuarios;
create policy "Negocios ven info basica de usuarios solicitantes"
  on usuarios
  for select
  to authenticated
  using (
    -- Permitir si el usuario consultante tiene un negocio
    exists (
      select 1 from negocios n
      where n.propietario_id = auth.uid()
    )
  );
