# Estructura Actualizada - Users Table

## 📋 Cambios Realizados

Se ha actualizado toda la aplicación para usar la nueva estructura de la tabla `Users` de Supabase.

## 🗄️ Nueva Estructura de la Tabla

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
```

## 📊 Campos de Usuario

| Campo | Tipo | Requerido | Único | Descripción |
|-------|------|-----------|-------|-------------|
| **id** | UUID | ✅ | ✅ | ID único del usuario |
| **name** | TEXT | ✅ | ❌ | Nombre completo |
| **phone** | TEXT | ✅ | ✅ | Teléfono (único) |
| **email** | TEXT | ✅ | ✅ | Email (único) |
| **cedula** | TEXT | ✅ | ✅ | Cédula/ID (único) |
| **created_at** | TIMESTAMP | ✅ | ❌ | Fecha de creación |

## 🔄 Archivos Modificados

### 1. **Type Definition** (`data/users/columns.tsx`)

```typescript
export type User = {
  id: string;
  name: string;
  phone: string;
  email: string;
  cedula: string;
  created_at?: string;
};
```

**Cambios:**
- ❌ Eliminado: `company` (opcional)
- ❌ Eliminado: `role` (admin|user|manager|guest)
- ✅ Agregado: `cedula` (requerido, único)
- ✅ Modificado: `phone` ahora es requerido (no opcional)

### 2. **Columnas de la Tabla** (`data/users/columns.tsx`)

Columnas visibles en la tabla:
- ☑️ Checkbox de selección
- 👤 Name (ordenable)
- 📧 Email (ordenable)
- 📱 Phone
- 🆔 Cédula
- ⚙️ Actions (editar, ver, eliminar)

### 3. **Formulario de Creación** (`components/FieldDemo.tsx`)

Campos del formulario:
1. **Full Name** (requerido)
2. **Email Address** (requerido, tipo email)
3. **Phone Number** (requerido, tipo tel)
4. **Cédula** (requerido, número de identificación)

**Eliminados:**
- ❌ Company (campo opcional)
- ❌ Role (selector)

### 4. **Formulario de Edición** (`components/EditUserDialog.tsx`)

Campos editables:
1. Name
2. Email
3. Phone
4. Cédula

**Eliminados:**
- ❌ Company
- ❌ Role (selector)

### 5. **Context API** (`contexts/UsersContext.tsx`)

- Tabla: `"Users"` (con mayúscula)
- Tipo correcto para `addUser`: `Omit<User, "id" | "created_at">`
- Tipo correcto para `updateUser`: `Partial<Omit<User, "id" | "created_at">>`

### 6. **Services** (`services/users.ts`)

Todas las operaciones ahora usan la tabla `"Users"`:
- `getAll()`
- `getById(id)`
- `create(user)`
- `update(id, updates)`
- `delete(id)`
- `deleteMany(ids)`

## ✅ Validaciones Únicas

Los siguientes campos tienen restricción UNIQUE en la base de datos:

1. **email** - No se pueden registrar dos usuarios con el mismo email
2. **phone** - No se pueden registrar dos usuarios con el mismo teléfono
3. **cedula** - No se pueden registrar dos usuarios con la misma cédula

## 🔍 Índices Creados

Para optimizar las búsquedas:

```sql
CREATE INDEX idx_users_email ON public."Users"(email);
CREATE INDEX idx_users_cedula ON public."Users"(cedula);
CREATE INDEX idx_users_phone ON public."Users"(phone);
```

## 🎯 Funcionalidades

### ✅ CREATE (Crear)
- Formulario con 4 campos requeridos
- Validación de formato de email y teléfono
- Reset automático después de crear
- Validación de campos únicos (email, phone, cedula)

### ✅ READ (Leer)
- Visualización de todos los usuarios
- Filtro por email en tiempo real
- Ordenamiento por name y email
- Paginación automática

### ✅ UPDATE (Actualizar)
- Edición de todos los campos excepto id y created_at
- Diálogo modal intuitivo
- Validación de campos únicos

### ✅ DELETE (Eliminar)
- Selección múltiple con checkboxes
- Eliminación en lote
- Confirmación visual

## 📝 Ejemplo de Uso

### Crear Usuario

```typescript
const newUser = {
  name: "Juan Pérez",
  email: "juan@example.com",
  phone: "+593-99-123-4567",
  cedula: "1234567890"
};

await addUser(newUser);
```

### Actualizar Usuario

```typescript
await updateUser(userId, {
  phone: "+593-99-999-9999",
  email: "nuevo@example.com"
});
```

### Eliminar Usuarios

```typescript
await deleteUsers([userId1, userId2, userId3]);
```

## 🚀 Próximos Pasos Recomendados

1. **Validaciones Adicionales:**
   - Formato de cédula ecuatoriana (10 dígitos)
   - Formato de teléfono celular
   - Validación de email más estricta

2. **Funcionalidades Extra:**
   - Búsqueda por cédula
   - Búsqueda por teléfono
   - Exportar usuarios a CSV/Excel
   - Importar usuarios desde archivo

3. **Seguridad:**
   - Implementar autenticación
   - Ajustar políticas RLS
   - Validar permisos por roles

4. **UX Mejorada:**
   - Máscaras de entrada para teléfono
   - Validación en tiempo real de unicidad
   - Mensajes de error más descriptivos
   - Confirmación antes de eliminar

## ⚠️ Notas Importantes

- El nombre de la tabla es `"Users"` con mayúscula inicial y entre comillas
- Todos los campos (excepto `created_at`) son requeridos en el formulario
- La tabla usa `auth.uid()` para el ID, preparada para integración con autenticación
- Las restricciones UNIQUE se validan a nivel de base de datos
