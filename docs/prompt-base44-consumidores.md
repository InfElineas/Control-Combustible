# Prompt para Base44: sistema de control de consumo por odómetro e índice de consumo

Usa este prompt en Base44 para extender este repositorio con un módulo completo de **consumidores de combustible** que permita controlar consumo por odómetro (vehículos) e índices de consumo esperados vs reales.

## Prompt sugerido

```text
Contexto:
Estoy trabajando sobre una app React (Control Combustible) con entidades como Vehiculo, Movimiento, TipoCombustible y BitacoraConsumo. Quiero extenderla sin romper la funcionalidad existente.

Objetivo general:
Implementar un sistema de control de consumo para múltiples tipos de consumidores (no solo vehículos), con configuración flexible de tipos de consumidor y validaciones por tipo.

Requerimientos funcionales:

1) Entidad base: Consumidor
- Crear una entidad principal "Consumidor" para unificar todos los consumidores de combustible.
- Campos generales mínimos:
  - id
  - tipo_consumidor_id (FK a TipoConsumidor)
  - nombre
  - codigo_interno (opcional)
  - tipo_combustible_id (FK)
  - activo (boolean)
  - responsable (texto)
  - conductor (texto, nullable)
  - funcion (texto)
  - observaciones (texto, nullable)
  - created_at, updated_at

2) Tipos de consumidor configurables
- Crear entidad "TipoConsumidor" administrable desde Configuración.
- Debe permitir agregar/editar/desactivar tipos, por ejemplo:
  - Vehículo
  - Tanque de reserva
  - Equipo (planta, grupo electrógeno, etc.)
- No hardcodear tipos en frontend.
- El sistema debe soportar que el usuario agregue nuevos tipos en el futuro sin cambios de código.

3) Datos específicos para Vehículo (al crear consumidor tipo Vehículo)
- Incluir estos campos obligatorios:
  - Chapa
  - Marca
  - Modelo
  - Año
  - Vehículo (nombre o descripción de unidad)
  - Tipo Combustible
  - Capacidad Tanque (L)
  - Índice Consumo fabricante/Km
  - Índice Consumo real titular
  - Responsable
  - Conductor
  - Estado Vehículo
  - Función
- Mantener compatibilidad con la entidad Vehiculo existente (migrar o mapear sin romper pantallas actuales).

4) Datos específicos para otros consumidores
- Para "Tanque de reserva":
  - capacidad_litros
  - ubicacion
  - stock_minimo
- Para "Equipo":
  - categoria_equipo (planta, grupo electrógeno, bomba, etc.)
  - marca/modelo
  - unidad_medida_consumo (L/h, L/ciclo, etc.)
  - indice_consumo_referencia
- Modelar estos atributos con una estrategia flexible (tabla de detalle por tipo o JSON validado por esquema).

5) Control de consumo por odómetro e índice
- Para consumidores tipo Vehículo:
  - registrar odómetro en cada carga (movimiento)
  - calcular km recorridos entre cargas consecutivas
  - calcular consumo real (km/L o L/100km, dejar configurable)
  - comparar contra índice fabricante y contra índice real titular
  - generar estado: normal / alerta / crítico según umbrales configurables
- Umbrales configurables desde Configuración.

6) Cambios en movimientos de combustible
- Al registrar movimiento, seleccionar Consumidor (no solo Vehículo).
- Validar reglas según tipo de consumidor:
  - Vehículo: odómetro obligatorio y no decreciente.
  - Tanque reserva/equipo: odómetro no requerido.
- Mantener historial y auditoría.

7) Configuración
- Nueva sección en Configuración:
  - Gestión de tipos de consumidor (ABM)
  - Gestión de consumidores (ABM)
  - Parámetros de control de consumo (unidad, umbrales, reglas)

8) Reportes
- Reporte de rendimiento por consumidor:
  - litros cargados
  - consumo estimado vs real
  - variación porcentual
  - alertas por sobreconsumo
- Filtros por tipo de consumidor, rango de fecha, responsable y estado.

9) UX/UI
- Formularios dinámicos por tipo de consumidor.
- En tipo Vehículo, mostrar todos los campos solicitados.
- En Configuración, permitir alta de nuevos tipos sin despliegue técnico.

10) Persistencia y migraciones
- Generar migraciones SQL para nuevas tablas/campos e índices.
- Respetar RLS y políticas existentes.
- Incluir script de migración de datos de Vehiculo -> Consumidor (si aplica).

11) Compatibilidad y refactor mínimo
- No romper páginas actuales.
- Donde hoy se use Vehiculo, implementar adaptación progresiva para Consumidor.
- Mantener contrato de repositorios (localRepository/supabaseRepository) y extenderlo.

12) Entregables técnicos esperados
- Modelo de datos actualizado.
- Migraciones.
- Repositorios y servicios adaptados.
- Formularios/páginas de Configuración y Movimientos ajustados.
- Reportes nuevos o extendidos.
- Validaciones de negocio.
- Pruebas mínimas para cálculos de consumo y validaciones de odómetro.

Criterios de aceptación:
- Se pueden crear tipos de consumidor personalizados desde Configuración.
- Se puede crear un consumidor tipo Vehículo con todos los campos solicitados.
- Se puede registrar una carga para vehículo con odómetro y calcular consumo.
- Se puede registrar una carga para tanque/equipo sin odómetro.
- Se visualizan alertas por desviación de consumo según umbrales.
- No se rompe la funcionalidad existente de vehículos y movimientos.

Importante:
- Entregar cambios en pasos pequeños y explicando cada archivo modificado.
- Si una decisión de diseño tiene alternativas, listar pros/contras brevemente antes de aplicar.
```

## Nota de uso

Si quieres, en una segunda iteración se puede generar una versión más estricta de este prompt enfocada únicamente en:

- migraciones Supabase,
- cambios de repositorio,
- y pantallas mínimas (Configuración + Movimientos),

para una entrega incremental más rápida.
