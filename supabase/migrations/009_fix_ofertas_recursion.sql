-- Fix infinite recursion in ofertas policies
-- El problema: la política de INSERT verifica negocio_catalogo, que a su vez verifica ofertas
-- Solución: simplificar la política de INSERT para solo verificar negocios

-- Eliminar política problemática
drop policy if exists "Propietarios crean ofertas para sus negocios" on ofertas;

-- Recrear con una versión más simple que no causa recursión
create policy "Propietarios crean ofertas para sus negocios"
  on ofertas
  for insert
  to authenticated
  with check (
    -- Solo verificar que el negocio pertenece al usuario
    -- No verificar negocio_catalogo aquí para evitar recursión
    exists (
      select 1 from negocios
      where negocios.id = ofertas.negocio_id
        and negocios.propietario_id = auth.uid()
    )
  );

-- Nota: La validación de que negocio_catalogo_id es válido se hace en el endpoint
-- No necesitamos verificarlo en RLS ya que eso causa recursión infinita
