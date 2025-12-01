-- Crear tipo enum para categorías de negocios
do $$ 
begin
  if not exists (select 1 from pg_type where typname = 'categoria_negocio') then
    create type categoria_negocio as enum (
      'alimentos_bebidas',
      'tecnologia_electronica',
      'ropa_moda',
      'hogar_decoracion',
      'salud_belleza',
      'deportes_fitness',
      'automotriz',
      'construccion_ferreteria',
      'papeleria_oficina',
      'juguetes_infantil',
      'mascotas',
      'libros_educacion',
      'jardineria_plantas',
      'muebles',
      'joyeria_accesorios',
      'servicios_profesionales',
      'entretenimiento',
      'arte_artesania',
      'musica_instrumentos',
      'eventos_celebraciones',
      'turismo_viajes',
      'inmobiliaria',
      'farmacia_medicamentos',
      'limpieza_higiene',
      'otros'
    );
  end if;
end $$;

-- Agregar columna categoria a la tabla negocios
alter table public.negocios 
add column if not exists categoria categoria_negocio;

-- Crear índice para búsquedas por categoría
create index if not exists idx_negocios_categoria 
on public.negocios using btree (categoria) 
where categoria is not null;
