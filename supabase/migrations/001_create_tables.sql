create extension if not exists vector;

create table if not exists usuarios (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  nombre_completo text,
  telefono text,
  foto_perfil_url text,
  direccion text,
  latitud decimal(10, 8),
  longitud decimal(11, 8),
  fecha_registro timestamp with time zone default timezone('utc'::text, now()) not null,
  ultima_conexion timestamp with time zone,
  activo boolean default true
);

create index if not exists idx_usuarios_email on usuarios(email);
create index if not exists idx_usuarios_activo on usuarios(activo) where activo = true;

create table if not exists negocios (
  id uuid default gen_random_uuid() primary key,
  propietario_id uuid references usuarios(id) on delete cascade not null,
  nombre_comercial text not null,
  direccion text not null,
  telefono text,
  activo boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_negocios_propietario on negocios(propietario_id);
create index if not exists idx_negocios_activo on negocios(activo) where activo = true;

create table if not exists catalogo_maestro (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  descripcion text not null,
  categoria text,
  embedding vector(768) not null,
  activo boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_catalogo_embedding on catalogo_maestro 
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists idx_catalogo_activo on catalogo_maestro(activo) where activo = true;

create table if not exists negocio_catalogo (
  id uuid default gen_random_uuid() primary key,
  negocio_id uuid references negocios(id) on delete cascade not null,
  producto_id uuid references catalogo_maestro(id) on delete cascade not null,
  precio_negocio decimal(10, 2) not null check (precio_negocio > 0),
  nombre_personalizado text,
  stock_disponible integer default 0 check (stock_disponible >= 0),
  activo boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(negocio_id, producto_id)
);

create index if not exists idx_negocio_catalogo_negocio on negocio_catalogo(negocio_id);
create index if not exists idx_negocio_catalogo_producto on negocio_catalogo(producto_id);
create index if not exists idx_negocio_catalogo_activo on negocio_catalogo(negocio_id, activo) where activo = true;
create index if not exists idx_negocio_catalogo_stock on negocio_catalogo(negocio_id, stock_disponible) where stock_disponible > 0 and activo = true;

create table if not exists carrito (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references usuarios(id) on delete cascade not null,
  producto_descripcion text not null,
  cantidad integer not null default 1 check (cantidad > 0),
  embedding vector(768) not null,
  estado text default 'pendiente' check (estado in ('pendiente', 'con_ofertas', 'reservado', 'completado', 'cancelado')),
  oferta_seleccionada_id uuid,
  precio_final_pagado decimal(10, 2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_carrito_user_id on carrito(user_id);
create index if not exists idx_carrito_estado on carrito(estado);
create index if not exists idx_carrito_embedding on carrito using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists idx_carrito_pendiente on carrito(estado, created_at) where estado in ('pendiente', 'con_ofertas');

create table if not exists ofertas (
  id uuid default gen_random_uuid() primary key,
  carrito_id uuid references carrito(id) on delete cascade not null,
  negocio_id uuid references negocios(id) on delete cascade not null,
  negocio_catalogo_id uuid references negocio_catalogo(id) on delete cascade not null,
  cantidad_ofrecida integer not null check (cantidad_ofrecida > 0),
  precio_unitario decimal(10, 2) not null check (precio_unitario > 0),
  precio_total decimal(10, 2) not null check (precio_total > 0),
  mensaje text,
  similitud_score float,
  estado text default 'enviada' check (estado in ('enviada', 'reservada', 'completada', 'rechazada', 'cancelada')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  check (precio_total = precio_unitario * cantidad_ofrecida),
  unique(carrito_id, negocio_id)
);

create index if not exists idx_ofertas_carrito_id on ofertas(carrito_id);
create index if not exists idx_ofertas_negocio_id on ofertas(negocio_id);
create index if not exists idx_ofertas_estado on ofertas(estado);
create index if not exists idx_ofertas_carrito_estado on ofertas(carrito_id, estado);

alter table carrito add constraint fk_oferta_seleccionada foreign key (oferta_seleccionada_id) references ofertas(id) on delete set null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.usuarios (id, email, nombre_completo, foto_perfil_url, fecha_registro)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    now()
  )
  on conflict (id) do update set 
    ultima_conexion = now(),
    email = excluded.email,
    nombre_completo = coalesce(excluded.nombre_completo, usuarios.nombre_completo),
    foto_perfil_url = coalesce(excluded.foto_perfil_url, usuarios.foto_perfil_url);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists set_updated_at_negocios on negocios;
create trigger set_updated_at_negocios before update on negocios for each row execute procedure public.handle_updated_at();

drop trigger if exists set_updated_at_catalogo on catalogo_maestro;
create trigger set_updated_at_catalogo before update on catalogo_maestro for each row execute procedure public.handle_updated_at();

drop trigger if exists set_updated_at_negocio_catalogo on negocio_catalogo;
create trigger set_updated_at_negocio_catalogo before update on negocio_catalogo for each row execute procedure public.handle_updated_at();

drop trigger if exists set_updated_at_carrito on carrito;
create trigger set_updated_at_carrito before update on carrito for each row execute procedure public.handle_updated_at();

drop trigger if exists set_updated_at_ofertas on ofertas;
create trigger set_updated_at_ofertas before update on ofertas for each row execute procedure public.handle_updated_at();

alter table usuarios enable row level security;

create policy "Usuarios pueden ver su propio perfil" on usuarios for select using (auth.uid() = id);
create policy "Usuarios pueden actualizar su propio perfil" on usuarios for update using (auth.uid() = id);

alter table negocios enable row level security;

create policy "Todos pueden ver negocios activos" on negocios for select using (activo = true);
create policy "Propietarios pueden ver sus negocios" on negocios for select using (auth.uid() = propietario_id);
create policy "Propietarios pueden crear negocios" on negocios for insert with check (auth.uid() = propietario_id);
create policy "Propietarios pueden actualizar sus negocios" on negocios for update using (auth.uid() = propietario_id);
create policy "Propietarios pueden eliminar sus negocios" on negocios for delete using (auth.uid() = propietario_id);

alter table catalogo_maestro enable row level security;

create policy "Todos pueden ver catálogo maestro" on catalogo_maestro for select using (activo = true);

alter table negocio_catalogo enable row level security;

create policy "Propietarios ven productos de sus negocios" on negocio_catalogo for select using (
  exists (select 1 from negocios where negocios.id = negocio_catalogo.negocio_id and negocios.propietario_id = auth.uid())
);

create policy "Propietarios agregan productos a sus negocios" on negocio_catalogo for insert with check (
  exists (select 1 from negocios where negocios.id = negocio_catalogo.negocio_id and negocios.propietario_id = auth.uid())
);

create policy "Propietarios actualizan productos de sus negocios" on negocio_catalogo for update using (
  exists (select 1 from negocios where negocios.id = negocio_catalogo.negocio_id and negocios.propietario_id = auth.uid())
);

create policy "Propietarios eliminan productos de sus negocios" on negocio_catalogo for delete using (
  exists (select 1 from negocios where negocios.id = negocio_catalogo.negocio_id and negocios.propietario_id = auth.uid())
);

alter table carrito enable row level security;

create policy "Usuarios ven su propio carrito" on carrito for select using (auth.uid() = user_id);

create policy "Negocios ven items que matchean con sus productos" on carrito for select using (
  exists (
    select 1 from catalogo_maestro cm
    inner join negocio_catalogo nc on nc.producto_id = cm.id
    inner join negocios n on n.id = nc.negocio_id
    where n.propietario_id = auth.uid()
      and nc.activo = true
      and nc.stock_disponible >= carrito.cantidad
      and 1 - (carrito.embedding <=> cm.embedding) > 0.7
  )
);

create policy "Usuarios insertan en su carrito" on carrito for insert with check (auth.uid() = user_id);
create policy "Usuarios actualizan su carrito" on carrito for update using (auth.uid() = user_id);
create policy "Usuarios eliminan de su carrito" on carrito for delete using (auth.uid() = user_id);

alter table ofertas enable row level security;

create policy "Propietarios ven ofertas de sus negocios" on ofertas for select using (
  exists (select 1 from negocios where negocios.id = ofertas.negocio_id and negocios.propietario_id = auth.uid())
);

create policy "Usuarios ven ofertas a sus items del carrito" on ofertas for select using (
  exists (select 1 from carrito where carrito.id = ofertas.carrito_id and carrito.user_id = auth.uid())
);

create policy "Propietarios crean ofertas para sus negocios" on ofertas for insert with check (
  exists (select 1 from negocios where negocios.id = ofertas.negocio_id and negocios.propietario_id = auth.uid())
  and exists (select 1 from negocio_catalogo where negocio_catalogo.id = ofertas.negocio_catalogo_id and negocio_catalogo.negocio_id = ofertas.negocio_id)
);

create policy "Propietarios actualizan ofertas de sus negocios" on ofertas for update using (
  exists (select 1 from negocios where negocios.id = ofertas.negocio_id and negocios.propietario_id = auth.uid())
);

create policy "Propietarios eliminan ofertas de sus negocios" on ofertas for delete using (
  exists (select 1 from negocios where negocios.id = ofertas.negocio_id and negocios.propietario_id = auth.uid())
);

create or replace function match_productos_catalogo(
  query_embedding vector(768),
  match_threshold float default 0.7,
  match_count int default 20
)
returns table (
  id uuid,
  nombre text,
  descripcion text,
  categoria text,
  similarity float
)
language sql stable
as $$
  select
    catalogo_maestro.id,
    catalogo_maestro.nombre,
    catalogo_maestro.descripcion,
    catalogo_maestro.categoria,
    1 - (catalogo_maestro.embedding <=> query_embedding) as similarity
  from catalogo_maestro
  where catalogo_maestro.activo = true
    and 1 - (catalogo_maestro.embedding <=> query_embedding) > match_threshold
  order by catalogo_maestro.embedding <=> query_embedding
  limit match_count;
$$;

create or replace function match_carrito_for_negocio(
  p_negocio_id uuid,
  p_match_threshold float default 0.7,
  p_limit int default 50
)
returns table (
  carrito_id uuid,
  producto_descripcion text,
  cantidad integer,
  carrito_user_id uuid,
  similitud float,
  producto_id uuid,
  producto_nombre text,
  precio_sugerido decimal,
  stock_disponible integer,
  negocio_catalogo_id uuid
)
language sql stable
as $$
  select distinct on (c.id, cm.id)
    c.id as carrito_id,
    c.producto_descripcion,
    c.cantidad,
    c.user_id as carrito_user_id,
    1 - (c.embedding <=> cm.embedding) as similitud,
    cm.id as producto_id,
    coalesce(nc.nombre_personalizado, cm.nombre) as producto_nombre,
    nc.precio_negocio as precio_sugerido,
    nc.stock_disponible,
    nc.id as negocio_catalogo_id
  from carrito c
  cross join catalogo_maestro cm
  inner join negocio_catalogo nc on nc.producto_id = cm.id
  where nc.negocio_id = p_negocio_id
    and nc.activo = true
    and cm.activo = true
    and c.estado in ('pendiente', 'con_ofertas')
    and nc.stock_disponible >= c.cantidad
    and 1 - (c.embedding <=> cm.embedding) > p_match_threshold
    and not exists (
      select 1 from ofertas o
      where o.carrito_id = c.id and o.negocio_id = p_negocio_id
    )
  order by c.id, cm.id, similitud desc
  limit p_limit;
$$;

create or replace function decrementar_stock(
  p_negocio_catalogo_id uuid,
  p_cantidad integer
)
returns void
language plpgsql
as $$
begin
  update negocio_catalogo
  set stock_disponible = stock_disponible - p_cantidad, updated_at = now()
  where id = p_negocio_catalogo_id and stock_disponible >= p_cantidad;
  if not found then
    raise exception 'Stock insuficiente o producto no encontrado';
  end if;
end;
$$;

create or replace function incrementar_stock(
  p_negocio_catalogo_id uuid,
  p_cantidad integer
)
returns void
language plpgsql
as $$
begin
  update negocio_catalogo
  set stock_disponible = stock_disponible + p_cantidad, updated_at = now()
  where id = p_negocio_catalogo_id;
  if not found then
    raise exception 'Producto no encontrado';
  end if;
end;
$$;
