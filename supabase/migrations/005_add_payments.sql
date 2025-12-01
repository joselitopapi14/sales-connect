-- Tabla de pagos
create table if not exists pagos (
  id uuid default gen_random_uuid() primary key,
  oferta_id uuid references ofertas(id) on delete cascade not null unique,
  carrito_id uuid references carrito(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  negocio_id uuid references negocios(id) on delete cascade not null,
  monto decimal(10, 2) not null check (monto > 0),
  metodo_pago text not null check (metodo_pago in ('tarjeta', 'efectivo')),
  estado text default 'pendiente' check (estado in ('pendiente', 'procesando', 'completado', 'fallido', 'cancelado')),
  
  -- Información de la transacción
  referencia_pago text,
  datos_pago jsonb, -- Para almacenar detalles adicionales (últimos 4 dígitos de tarjeta, etc.)
  
  -- Para pagos en efectivo
  confirmado_por_negocio boolean default false,
  fecha_confirmacion timestamp with time zone,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices para pagos
create index if not exists idx_pagos_oferta_id on pagos(oferta_id);
create index if not exists idx_pagos_carrito_id on pagos(carrito_id);
create index if not exists idx_pagos_user_id on pagos(user_id);
create index if not exists idx_pagos_negocio_id on pagos(negocio_id);
create index if not exists idx_pagos_estado on pagos(estado);
create index if not exists idx_pagos_metodo on pagos(metodo_pago);
create index if not exists idx_pagos_efectivo_pendiente on pagos(metodo_pago, confirmado_por_negocio) 
  where metodo_pago = 'efectivo' and confirmado_por_negocio = false;

-- Agregar campo de stock_reservado a negocio_catalogo
alter table negocio_catalogo 
  add column if not exists stock_reservado integer default 0 check (stock_reservado >= 0);

-- Agregar constraint solo si no existe
do $$ 
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'check_stock_disponible' 
    and conrelid = 'negocio_catalogo'::regclass
  ) then
    alter table negocio_catalogo 
      add constraint check_stock_disponible check (stock_disponible >= stock_reservado);
  end if;
end $$;

-- Función para actualizar el stock cuando se paga con tarjeta
create or replace function actualizar_stock_pago_tarjeta()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_negocio_catalogo_id uuid;
  v_cantidad_ofrecida integer;
begin
  -- Solo procesar si es pago con tarjeta y está completado
  if new.metodo_pago = 'tarjeta' and new.estado = 'completado' and (old.estado is null or old.estado != 'completado') then
    -- Obtener el negocio_catalogo_id y cantidad de la oferta
    select negocio_catalogo_id, cantidad_ofrecida
    into v_negocio_catalogo_id, v_cantidad_ofrecida
    from ofertas
    where id = new.oferta_id;
    
    if v_negocio_catalogo_id is not null then
      -- Reducir el stock disponible
      update negocio_catalogo
      set 
        stock_disponible = stock_disponible - v_cantidad_ofrecida,
        updated_at = now()
      where id = v_negocio_catalogo_id
        and stock_disponible >= v_cantidad_ofrecida; -- Validación de stock suficiente
      
      if not found then
        raise exception 'Stock insuficiente para completar el pago';
      end if;
    end if;
  end if;
  
  return new;
end;
$$;

-- Función para actualizar el stock cuando se confirma pago en efectivo
create or replace function actualizar_stock_pago_efectivo()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_negocio_catalogo_id uuid;
  v_cantidad_ofrecida integer;
begin
  -- Solo procesar si es pago en efectivo y se confirma por primera vez
  if new.metodo_pago = 'efectivo' and new.confirmado_por_negocio = true and (old.confirmado_por_negocio is null or old.confirmado_por_negocio = false) then
    -- Obtener el negocio_catalogo_id y cantidad de la oferta
    select negocio_catalogo_id, cantidad_ofrecida
    into v_negocio_catalogo_id, v_cantidad_ofrecida
    from ofertas
    where id = new.oferta_id;
    
    if v_negocio_catalogo_id is not null then
      -- Liberar stock reservado y reducir stock disponible
      update negocio_catalogo
      set 
        stock_disponible = stock_disponible - v_cantidad_ofrecida,
        stock_reservado = stock_reservado - v_cantidad_ofrecida,
        updated_at = now()
      where id = v_negocio_catalogo_id
        and stock_disponible >= v_cantidad_ofrecida
        and stock_reservado >= v_cantidad_ofrecida;
      
      if not found then
        raise exception 'Stock insuficiente para confirmar el pago';
      end if;
      
      -- Actualizar estado del pago a completado
      update pagos
      set 
        estado = 'completado',
        fecha_confirmacion = now(),
        updated_at = now()
      where id = new.id;
      
      -- Actualizar estado de la oferta a completada
      update ofertas
      set 
        estado = 'completada',
        updated_at = now()
      where id = new.oferta_id;
      
      -- Actualizar estado del carrito a completado
      update carrito
      set 
        estado = 'completado',
        updated_at = now()
      where id = new.carrito_id;
    end if;
  end if;
  
  return new;
end;
$$;

-- Función para reservar stock al aceptar oferta con pago en efectivo
create or replace function reservar_stock_efectivo()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_negocio_catalogo_id uuid;
  v_cantidad_ofrecida integer;
  v_metodo_pago text;
begin
  -- Solo procesar cuando la oferta cambia a estado 'reservada'
  if new.estado = 'reservada' and (old.estado is null or old.estado != 'reservada') then
    -- Obtener el método de pago asociado
    select metodo_pago into v_metodo_pago
    from pagos
    where oferta_id = new.id;
    
    -- Si es pago en efectivo, reservar el stock
    if v_metodo_pago = 'efectivo' then
      select negocio_catalogo_id, cantidad_ofrecida
      into v_negocio_catalogo_id, v_cantidad_ofrecida
      from ofertas
      where id = new.id;
      
      if v_negocio_catalogo_id is not null then
        update negocio_catalogo
        set 
          stock_reservado = stock_reservado + v_cantidad_ofrecida,
          updated_at = now()
        where id = v_negocio_catalogo_id
          and (stock_disponible - stock_reservado) >= v_cantidad_ofrecida;
        
        if not found then
          raise exception 'Stock insuficiente para reservar';
        end if;
      end if;
    end if;
  end if;
  
  return new;
end;
$$;

-- Triggers
create trigger trigger_actualizar_stock_pago_tarjeta
  after update on pagos
  for each row
  execute function actualizar_stock_pago_tarjeta();

create trigger trigger_actualizar_stock_pago_efectivo
  after update on pagos
  for each row
  execute function actualizar_stock_pago_efectivo();

create trigger trigger_reservar_stock_efectivo
  after update on ofertas
  for each row
  execute function reservar_stock_efectivo();

-- Función para actualizar updated_at automáticamente
create or replace function trigger_set_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Trigger para updated_at en pagos
create trigger set_timestamp_pagos
  before update on pagos
  for each row
  execute function trigger_set_timestamp();

-- Políticas RLS para pagos
alter table pagos enable row level security;

-- Los usuarios pueden ver sus propios pagos
create policy "Usuarios pueden ver sus propios pagos"
  on pagos for select
  using (auth.uid() = user_id);

-- Los usuarios pueden crear pagos para sus propias ofertas
create policy "Usuarios pueden crear pagos"
  on pagos for insert
  with check (auth.uid() = user_id);

-- Los negocios pueden ver pagos de sus ofertas
create policy "Negocios pueden ver pagos de sus ofertas"
  on pagos for select
  using (
    exists (
      select 1 from negocios
      where negocios.id = pagos.negocio_id
        and negocios.propietario_id = auth.uid()
    )
  );

-- Los negocios pueden actualizar sus pagos (para confirmar efectivo)
create policy "Negocios pueden actualizar sus pagos"
  on pagos for update
  using (
    exists (
      select 1 from negocios
      where negocios.id = pagos.negocio_id
        and negocios.propietario_id = auth.uid()
    )
  );
