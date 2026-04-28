# Reporte de Desarrollo — Sistema de Control de Combustible

**Fecha de emisión:** 26 de abril de 2026  
**Versión:** `main` · commit `95b1ca9`  
**Plataforma:** React 18 + Vite 6 + Supabase  

---

## 1. Estado de los requerimientos solicitados

### ✅ 1.1 Identificar importes monetarios con símbolo de pesos ($)

**Estado: Implementado**

Todos los valores monetarios del sistema utilizan la función centralizada `formatMonto()` (ubicada en `src/components/ui-helpers/SaldoUtils.jsx`), que aplica el formato `$ 0,00` con separador de miles y dos decimales. Los litros se muestran siempre con el sufijo ` L` (ej. `1 440,0 L`). La diferenciación es consistente en:

- Tabla de movimientos
- Tarjetas de resumen del dashboard
- Módulo de reportes (tarjetas, consumidores, consumo)
- Formularios de registro
- Panel de administración (auditoría de movimientos)

---

### ✅ 1.2 Tipificar los nombres de las tarjetas

**Estado: Implementado**

La entidad `tarjeta` tiene dos campos diferenciados:

| Campo | Uso |
|---|---|
| `alias` | Nombre descriptivo (ej. "Tarjeta Flota Principal") |
| `id_tarjeta` | Código/número físico de la tarjeta |

En todos los selectores, tablas y reportes se muestra el `alias` como nombre principal con `id_tarjeta` como referencia secundaria. Los movimientos almacenan `tarjeta_alias` para trazabilidad histórica independiente del catálogo.

---

### ✅ 1.3 Campos obligatorios: código interno, tipo de combustible y responsable

**Estado: Implementado**

El formulario de consumidores (`ConsumidorForm.jsx`) marca con `*` y valida los siguientes campos según el tipo de consumidor:

| Campo | Obligatorio para |
|---|---|
| Tipo de consumidor | Todos |
| Nombre / Descripción | Todos |
| Combustible principal | Todos |
| Chapa / Código interno | Vehículos |
| Responsable | Vehículos |

La validación se ejecuta en `Consumidores.jsx` antes de enviar a la base de datos, mostrando `toast.error()` descriptivo cuando falta algún campo requerido.

---

### ✅ 1.4 Visualización diferenciada de tipos de combustible (diesel / gasolina)

**Estado: Implementado**

Se creó el componente `CombustibleBadge` (`src/components/ui-helpers/CombustibleBadge.jsx`) con identidad visual por tipo:

| Tipo | Color del badge |
|---|---|
| Diesel | Ámbar / naranja |
| Especial / Premium | Azul |
| Regular / Gasolina | Verde |

El componente detecta el tipo por coincidencia de texto en el nombre (`diesel`, `especial`) y aplica el estilo correspondiente. Se utiliza en:

- Tarjetas del módulo Almacén/Autorizo
- Tabs de combustible en ConsumidoresPorTipo (Dashboard)
- Modal de historial de autorizaciones

---

### ✅ 1.5 Módulo de recargas de tarjetas con rol Económico

**Estado: Implementado**

Se diseñó un sistema de permisos granular para separar las operaciones financieras de las operaciones de transporte:

**Nuevos flags en `useUserRole.jsx`:**

| Flag | Roles habilitados | Operaciones |
|---|---|---|
| `canRecargar` | superadmin, económico | RECARGA de tarjetas |
| `canComprarDespachar` | superadmin, operador | COMPRA y DESPACHO |
| `canManageFinanzas` | superadmin, económico | Gestión de precios y saldos |

**Comportamiento en el formulario de movimientos (`NuevoMovimientoForm.jsx`):**

- El usuario con rol **económico** solo ve el tab "Recarga" → no puede registrar compras ni despachos
- El usuario con rol **operador** solo ve los tabs "Compra" y "Despacho" → no puede recargar tarjetas
- El usuario con rol **superadmin** tiene acceso completo a los tres tipos

**Refuerzo a nivel de base de datos (RLS):**  
La política `movimiento_insert` en Supabase valida la combinación rol + tipo directamente en la base de datos, como segunda capa de seguridad independiente del frontend.

---

### ✅ 1.6 Restringir acceso a edición de saldos y precios según rol

**Estado: Implementado**

- El flag `canManageFinanzas` controla la visibilidad de las secciones de precios de combustible, recargas y gestión de saldos de tarjetas.
- A nivel de base de datos, las políticas RLS de Supabase (`user_roles_update_superadmin`) restringen la modificación de roles de usuario exclusivamente al superadmin.
- El panel de administración completo (`AdminPanel.jsx`) es visible únicamente para superadmin.

---

### ✅ 1.7 Opción "Mixto / Varios" en el campo responsable de vehículo

**Estado: Implementado**

El campo "Responsable" en `ConsumidorForm.jsx` utiliza un `<input>` con lista de sugerencias (`<datalist>`), que propone automáticamente las opciones más comunes al escribir:

- **Mixto / Varios** — para vehículos compartidos entre conductores
- **Por asignar** — para vehículos sin conductor definido

El campo acepta cualquier texto libre, por lo que no restringe el ingreso de nombres específicos.

---

### ✅ 1.8 Mejorar el selector de año del vehículo

**Estado: Implementado**

El selector de año en `ConsumidorForm.jsx` genera dinámicamente los años desde el **año actual hacia atrás hasta 1990**, en orden descendente. El usuario selecciona directamente el año de la lista sin tener que navegar desde valores arbitrarios. La lógica es:

```js
Array.from(
  { length: new Date().getFullYear() - 1989 },
  (_, i) => new Date().getFullYear() - i
)
// Resultado: [2026, 2025, 2024, ..., 1990]
```

---

### 🔮 1.9 Evaluación futura: choferes con ingreso directo de datos (app móvil)

**Estado: Planificado — Sin bloqueos técnicos**

El sistema de roles ya está arquitectado para soportar esta expansión. La propuesta cuando se migre a app móvil o PWA es:

- **Nuevo rol `conductor`**: acceso solo a DESPACHO del vehículo asignado (`consumidor_id` propio)
- El hook `useUserRole` se extiende con un nuevo flag `canDespacharPropio`
- El formulario filtra el selector de consumidor para mostrar únicamente el vehículo del conductor autenticado
- Las políticas RLS de Supabase se extienden con `movimiento_insert_conductor` que valida `consumidor_id = get_my_consumidor_id()`

**Prerequisito:** asociar `user_id` → `consumidor_id` en la tabla `user_roles` o en una tabla intermedia.

---

### 🔮 1.10 Consumo planificado mensual basado en rutas fijas (GPS)

**Estado: Diseñado — Pendiente de implementación**

Se analizaron tres enfoques según el contexto operativo (rutas fijas a centros de distribución conocidos):

#### Opción A — Rutas predefinidas (recomendada, sin GPS)
Dado que los destinos son fijos y poco variables, se propone registrar las rutas una vez:

```
Ruta: Depósito → Centro Sur → 47 km
Ruta: Depósito → Centro Norte → 62 km
```

Al registrar un DESPACHO, el operador selecciona la ruta y los km se autocompletan. Esto elimina el error humano en la carga de odómetro.

**Implementación estimada:** tabla `ruta` + campo `ruta_id` en `movimiento` + autocomplete en el formulario.

#### Opción B — Integración con plataforma GPS existente
Si la plataforma GPS actual tiene API REST (Wialon, GPS-Pro, SkyOne y similares), se puede consultar el km recorrido real del día por chapa de vehículo y traerlo automáticamente al formulario de movimiento.

**Prerequisito:** identificar la plataforma y credenciales de API.

#### Opción C — Consumo planificado mensual
Con las rutas definidas y los despachos registrados, se puede calcular:
- **Litros planificados** = suma de `km_ruta × consumo_referencia / 100` para todos los despachos del mes
- **Litros reales** = suma de litros en movimientos COMPRA del mes
- **Desviación** = diferencia porcentual entre planificado y real

La tabla `movimiento` ya tiene los campos `km_recorridos`, `consumo_real` y `odometro` listos para este análisis.

**Nota:** Los datos de los GPS de los vehículos serán insumo clave para validar las distancias reales y refinar los índices de consumo de referencia por ruta.

---

## 2. Mejoras adicionales — Plus de desarrollo

### 2.1 Seguridad y vulnerabilidades

| Acción | Impacto |
|---|---|
| Eliminación de `@base44/sdk` y `@base44/vite-plugin` | Resuelve 4 vulnerabilidades moderadas (uuid < 14.0.0) |
| RLS granular con función `get_my_role()` en Supabase | `user_roles` UPDATE/DELETE solo superadmin; `movimiento` INSERT validado en BD |
| Validación de límites numéricos en formularios | Previene NaN, Infinity y valores extremos (máx. 50 000 L / 10 000 000 USD) |
| Manejadores `onError` en todas las mutaciones | Mensajes de error amigables sin exponer detalles técnicos al usuario |

### 2.2 Dashboard — Alertas

- El tab **"Con alertas"** ahora agrupa los consumidores en secciones: **Crítico** (rojo) / **En alerta** (ámbar) / **Sin datos** (gris), con encabezados coloreados y conteo por sección.
- Los consumidores sin registros de combustible (`sinDatos`) se incluyen en el conteo de alertas para que no pasen desapercibidos.
- Icono diferenciado para el estado "Sin datos" (`HelpCircle`).

### 2.3 Dashboard — ConsumidoresPorTipo

- El header de cada grupo muestra el **desglose de litros por tipo de combustible** (ej. `Diesel: 980 L · Regular: 460 L`), visible sin necesidad de expandir el acordeón.
- Dentro del acordeón, se agregaron **tabs por tipo de combustible** que filtran la lista de consumidores del grupo.

### 2.4 Dashboard — Módulo Almacén / Autorizo

- Cada tarjeta de consumidor del tipo "almacén" muestra el **tipo de combustible de la última autorización** mediante `CombustibleBadge`.
- Botón **"Ver autorizaciones"** que abre un modal con el historial completo de despachos recibidos, incluyendo fecha, combustible, litros y origen.

### 2.5 Panel de administración

- Corregido error crítico: la columna era `created_at` en el código pero `created_date` en el schema de Supabase → la lista de usuarios ahora carga correctamente.
- Mensaje de error visible si la consulta falla.
- `retry: 1` y `staleTime: 60 000 ms` en la consulta de usuarios para mejor resiliencia.

### 2.6 Reportes (en progreso en esta sesión)

- Instaladas dependencias `jspdf-autotable` y `exceljs` para exportación profesional.
- Diseño en implementación: botones CSV / Excel / PDF por reporte, con formato profesional (encabezado corporativo, KPIs en cabecera, colores por estado, totales).

---

## 3. Arquitectura de roles — Resumen

| Rol | Recargas | Compras | Despachos | Finanzas | Catálogos | Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **superadmin** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **operador** | — | ✓ | ✓ | — | ✓ | — |
| **económico** | ✓ | — | — | ✓ | — | — |
| **auditor** | — | — | — | — | — | — |

---

## 4. Pendientes de sesión actual

| Tarea | Prioridad |
|---|---|
| Completar implementación de ExportActions (Excel + PDF) | Alta |
| Aplicar RLS actualizado en Supabase Dashboard (ejecutar SQL) | Alta |
| Build y push del módulo de reportes | Alta |
| Implementar rutas predefinidas (Opción A del punto 1.10) | Media |

---

*Documento generado el 26/04/2026 · Sistema de Control de Combustible · InfElineas*
