# Configuración de Supabase para User Management

## Tabla de Usuarios

Para que el CRUD funcione correctamente, necesitas crear una tabla `Users` en Supabase con la siguiente estructura:

### SQL para crear la tabla

```sql
-- Crear la tabla Users
CREATE TABLE public."Users" (
  id UUID NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  cedula TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT Users_pkey PRIMARY KEY (id),
  CONSTRAINT Users_cedula_key UNIQUE (cedula),
  CONSTRAINT Users_email_key UNIQUE (email),
  CONSTRAINT Users_phone_key UNIQUE (phone)
) TABLESPACE pg_default;

-- Crear índices para búsquedas
CREATE INDEX idx_users_email ON public."Users"(email);
CREATE INDEX idx_users_cedula ON public."Users"(cedula);
CREATE INDEX idx_users_phone ON public."Users"(phone);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public."Users" ENABLE ROW LEVEL SECURITY;

-- Política para permitir SELECT a todos (ajusta según tus necesidades de seguridad)
CREATE POLICY "Allow public read access" ON public."Users"
  FOR SELECT
  USING (true);

-- Política para permitir INSERT a todos (ajusta según tus necesidades de seguridad)
CREATE POLICY "Allow public insert access" ON public."Users"
  FOR INSERT
  WITH CHECK (true);

-- Política para permitir UPDATE a todos (ajusta según tus necesidades de seguridad)
CREATE POLICY "Allow public update access" ON public."Users"
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política para permitir DELETE a todos (ajusta según tus necesidades de seguridad)
CREATE POLICY "Allow public delete access" ON public."Users"
  FOR DELETE
  USING (true);
```

### Estructura de la tabla

| Campo | Tipo | Requerido | Único | Descripción |
|-------|------|-----------|-------|-------------|
| id | UUID | Sí | Sí | Identificador único (generado automáticamente) |
| name | TEXT | Sí | No | Nombre completo del usuario |
| phone | TEXT | Sí | Sí | Número de teléfono (único) |
| email | TEXT | Sí | Sí | Email del usuario (único) |
| cedula | TEXT | Sí | Sí | Número de cédula/identificación (único) |
| created_at | TIMESTAMP | Sí | No | Fecha de creación (generada automáticamente) |

## Variables de Entorno

Asegúrate de tener las siguientes variables de entorno configuradas en tu archivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=tu-clave-anonima-de-supabase
```

## Notas de Seguridad

⚠️ **IMPORTANTE**: Las políticas de RLS en el ejemplo anterior permiten acceso público completo. En un entorno de producción, deberías ajustar estas políticas para:

1. Requerir autenticación para todas las operaciones
2. Permitir solo a los administradores crear/actualizar/eliminar usuarios
3. Permitir a los usuarios solo ver y actualizar su propia información

Ejemplo de política más segura:

```sql
-- Solo usuarios autenticados pueden leer
CREATE POLICY "Authenticated users can read" ON public."Users"
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Solo usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON public."Users"
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

## Datos de Prueba

Puedes insertar algunos datos de prueba con:

```sql
INSERT INTO public."Users" (name, email, phone, cedula) VALUES
  ('John Doe', 'john@example.com', '+1-555-123-4567', '1234567890'),
  ('Jane Smith', 'jane@example.com', '+1-555-234-5678', '0987654321'),
  ('Bob Johnson', 'bob@example.com', '+1-555-345-6789', '1122334455'),
  ('Alice Williams', 'alice@example.com', '+1-555-456-7890', '5544332211');
```
