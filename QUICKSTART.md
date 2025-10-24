# Inicio Rápido - User Management CRUD

## 🚀 Configuración Inicial

### 1. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=tu-clave-publica-anon
```

### 2. Configurar Base de Datos en Supabase

Ejecuta este SQL en Supabase SQL Editor:

```sql
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

ALTER TABLE public."Users" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access" ON public."Users" FOR ALL USING (true);
```

### 3. Instalar Dependencias

```bash
npm install
```

### 4. Ejecutar el Proyecto

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📋 Funcionalidades Disponibles

### Crear Usuario
1. Completa el formulario en el lado izquierdo
2. Haz clic en "Add User"
3. El usuario aparecerá en la tabla

### Ver Usuarios
- La tabla muestra todos los usuarios
- Usa el filtro de email para buscar
- Haz clic en columnas para ordenar

### Editar Usuario
1. Haz clic en el menú de acciones (⋮) en la tabla
2. Selecciona "Edit user"
3. Modifica los campos en el diálogo
4. Haz clic en "Save changes"

### Eliminar Usuarios
1. Selecciona los usuarios usando los checkboxes
2. Haz clic en el botón "Delete (N)"

## 🎨 Características

- ✅ CRUD completo con Supabase
- ✅ Interfaz responsive
- ✅ Filtros y ordenamiento
- ✅ Selección múltiple
- ✅ Estados de carga
- ✅ Manejo de errores
- ✅ TypeScript completo

## 📝 Estructura del Proyecto

```
sales-connect/
├── app/
│   └── page.tsx                 # Página principal con CRUD
├── components/
│   ├── FieldDemo.tsx            # Formulario de creación
│   ├── data-table.tsx           # Tabla de usuarios
│   └── EditUserDialog.tsx       # Diálogo de edición
├── contexts/
│   └── UsersContext.tsx         # Estado global y operaciones CRUD
├── data/
│   └── users/
│       └── columns.tsx          # Definición de columnas
├── services/
│   └── users.ts                 # Servicios de Supabase
└── utils/
    └── supabase/
        └── client.ts            # Cliente de Supabase
```

## 🔒 Seguridad (Importante)

⚠️ La configuración actual permite acceso público completo. Para producción:

1. Implementa autenticación de usuarios
2. Actualiza las políticas RLS:

```sql
-- Solo usuarios autenticados
DROP POLICY "Allow public access" ON public."Users";

CREATE POLICY "Authenticated read" ON public."Users"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated insert" ON public."Users"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

## 📚 Documentación Adicional

- Ver `SUPABASE_SETUP.md` para configuración detallada de Supabase
- Ver `CHANGELOG.md` para lista completa de cambios

## 🐛 Solución de Problemas

### Error: Cannot connect to Supabase
- Verifica que las variables de entorno estén configuradas
- Asegúrate de que la URL y la clave sean correctas

### Error: Table 'Users' does not exist

- Ejecuta el SQL de creación de tabla en Supabase

### No se pueden insertar usuarios
- Verifica las políticas RLS en Supabase
- Revisa los logs de Supabase para errores

## 💡 Próximos Pasos

1. Personaliza los campos según tus necesidades
2. Agrega autenticación de usuarios
3. Implementa validaciones adicionales
4. Agrega más funcionalidades (búsqueda avanzada, exportar, etc.)
