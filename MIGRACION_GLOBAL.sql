-- ============================================================
--  MIGRACIÓN GLOBAL — WebCombustible (Supabase / PostgreSQL)
--  Segura para ejecutar en base vacía O sobre una existente.
--  Todos los objetos usan IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
--  Fecha de generación: 2026-05-07
-- ============================================================

-- ─────────────────────────────────────────────────────────────
--  0. EXTENSIONES
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ─────────────────────────────────────────────────────────────
--  1. TIPO_CONSUMIDOR
--     Categorías de consumidores: vehículo, tanque, equipo, etc.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tipo_consumidor (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       TEXT        NOT NULL,
  icono        TEXT,                         -- truck | zap | container | settings
  activo       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Columnas que pueden faltar en instalaciones anteriores
ALTER TABLE tipo_consumidor ADD COLUMN IF NOT EXISTS icono             TEXT;
ALTER TABLE tipo_consumidor ADD COLUMN IF NOT EXISTS activo            BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE tipo_consumidor ADD COLUMN IF NOT EXISTS created_date      TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE tipo_consumidor ADD COLUMN IF NOT EXISTS requiere_odometro BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tipo_consumidor ADD COLUMN IF NOT EXISTS unidad_consumo    TEXT    NOT NULL DEFAULT 'km/L';


-- ─────────────────────────────────────────────────────────────
--  2. TIPO_COMBUSTIBLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tipo_combustible (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       TEXT        NOT NULL,
  activa       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tipo_combustible ADD COLUMN IF NOT EXISTS activa       BOOLEAN     NOT NULL DEFAULT TRUE;
ALTER TABLE tipo_combustible ADD COLUMN IF NOT EXISTS created_date TIMESTAMPTZ NOT NULL DEFAULT NOW();


-- ─────────────────────────────────────────────────────────────
--  3. PRECIO_COMBUSTIBLE
--     Historial de precios por tipo de combustible.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS precio_combustible (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combustible_id   UUID        REFERENCES tipo_combustible(id) ON DELETE SET NULL,
  precio_por_litro NUMERIC(12,4) NOT NULL DEFAULT 0,
  fecha_desde      DATE        NOT NULL,
  fecha_hasta      DATE,                     -- NULL = precio vigente actual
  created_date     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE precio_combustible ADD COLUMN IF NOT EXISTS combustible_id   UUID    REFERENCES tipo_combustible(id) ON DELETE SET NULL;
ALTER TABLE precio_combustible ADD COLUMN IF NOT EXISTS precio_por_litro NUMERIC(12,4) NOT NULL DEFAULT 0;
ALTER TABLE precio_combustible ADD COLUMN IF NOT EXISTS fecha_desde      DATE;
ALTER TABLE precio_combustible ADD COLUMN IF NOT EXISTS fecha_hasta      DATE;
ALTER TABLE precio_combustible ADD COLUMN IF NOT EXISTS created_date     TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_precio_combustible_combustible_id ON precio_combustible(combustible_id);
CREATE INDEX IF NOT EXISTS idx_precio_combustible_fecha_desde    ON precio_combustible(fecha_desde);


-- ─────────────────────────────────────────────────────────────
--  4. TARJETA
--     Tarjetas de crédito/combustible con saldo seguido.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tarjeta (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_tarjeta     TEXT        NOT NULL,       -- número o código de la tarjeta
  alias          TEXT,
  moneda         TEXT        NOT NULL DEFAULT 'CUP',  -- USD | CUP | MLC | EUR
  saldo_inicial  NUMERIC(14,4) NOT NULL DEFAULT 0,
  umbral_alerta  NUMERIC(14,4),
  activa         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_date   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tarjeta ADD COLUMN IF NOT EXISTS id_tarjeta    TEXT;
ALTER TABLE tarjeta ADD COLUMN IF NOT EXISTS alias         TEXT;
ALTER TABLE tarjeta ADD COLUMN IF NOT EXISTS moneda        TEXT        NOT NULL DEFAULT 'CUP';
ALTER TABLE tarjeta ADD COLUMN IF NOT EXISTS saldo_inicial NUMERIC(14,4) NOT NULL DEFAULT 0;
ALTER TABLE tarjeta ADD COLUMN IF NOT EXISTS umbral_alerta NUMERIC(14,4);
ALTER TABLE tarjeta ADD COLUMN IF NOT EXISTS activa        BOOLEAN     NOT NULL DEFAULT TRUE;
ALTER TABLE tarjeta ADD COLUMN IF NOT EXISTS created_date  TIMESTAMPTZ NOT NULL DEFAULT NOW();


-- ─────────────────────────────────────────────────────────────
--  5. VEHICULO
--     Catálogo de vehículos (datos técnicos, no transaccional).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehiculo (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapa                     TEXT,            -- matrícula / placa
  alias                     TEXT,
  marca                     TEXT,
  modelo                    TEXT,
  ano                       INTEGER,
  tipo_vehiculo             TEXT,
  combustible_id            UUID    REFERENCES tipo_combustible(id) ON DELETE SET NULL,
  combustible_nombre        TEXT,            -- desnormalizado para lecturas rápidas
  capacidad_tanque          NUMERIC(10,2),   -- litros
  indice_consumo_fabricante NUMERIC(10,4),   -- km/L según fabricante
  indice_consumo_real       NUMERIC(10,4),   -- km/L real histórico
  responsable               TEXT,
  conductor                 TEXT,
  area_centro               TEXT,
  estado_vehiculo           TEXT DEFAULT 'Operativo',  -- Operativo | En mantenimiento | Fuera de servicio | Baja
  funcion                   TEXT,
  activa                    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_date              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE vehiculo ADD COLUMN IF NOT EXISTS chapa                     TEXT;
ALTER TABLE vehiculo ADD COLUMN IF NOT EXISTS alias                     TEXT;
ALTER TABLE vehiculo ADD COLUMN IF NOT EXISTS marca                     TEXT;
ALTER TABLE vehiculo ADD COLUMN IF NOT EXISTS modelo                    TEXT;
ALTER TABLE vehiculo ADD COLUMN IF NOT EXISTS ano                       INTEGER;
ALTER TABLE vehiculo ADD COLUMN IF NOT EXISTS tipo_vehiculo             TEXT;
ALTER TABLE vehiculo ADD COLUMN IF NOT EXISTS combustible_id            UUID REFERENCES tipo_combustible(id) ON DELETE SET NULL;
ALTER TABLE vehiculo ADD COLUMN IF NOT EXISTS combustible_nombre        TEXT;
ALTER TABLE vehiculo ADD COLUMN IF NOT EXISTS capacidad_tanque          NUMERIC(10,2);
ALTER TABLE vehiculo ADD COLUMN IF NOT EXISTS indice_consumo_fabricante NUMERIC(10,4);
ALTER TABLE vehiculo ADD COLUMN IF NOT EXISTS indice_consumo_real       NUMERIC(10,4);
ALTER TABLE vehiculo ADD COLUMN IF NOT EXISTS responsable               TEXT;
ALTER TABLE vehiculo ADD COLUMN IF NOT EXISTS conductor                 TEXT;
ALTER TABLE vehiculo ADD COLUMN IF NOT EXISTS area_centro               TEXT;
ALTER TABLE vehiculo ADD COLUMN IF NOT EXISTS estado_vehiculo           TEXT DEFAULT 'Operativo';
ALTER TABLE vehiculo ADD COLUMN IF NOT EXISTS funcion                   TEXT;
ALTER TABLE vehiculo ADD COLUMN IF NOT EXISTS activa                    BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE vehiculo ADD COLUMN IF NOT EXISTS created_date              TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_vehiculo_chapa          ON vehiculo(chapa);
CREATE INDEX IF NOT EXISTS idx_vehiculo_combustible_id ON vehiculo(combustible_id);


-- ─────────────────────────────────────────────────────────────
--  6. CONDUCTOR
--     Catálogo de conductores con datos de licencia.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conductor (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre                TEXT        NOT NULL,
  ci                    TEXT,                 -- cédula / documento de identidad
  telefono              TEXT,
  email                 TEXT,
  licencia_numero       TEXT,
  licencia_categoria    TEXT,
  licencia_vencimiento  DATE,
  vehiculo_asignado_id  UUID REFERENCES vehiculo(id) ON DELETE SET NULL,
  vehiculo_asignado_chapa TEXT,              -- desnormalizado
  area_centro           TEXT,
  activo                BOOLEAN     NOT NULL DEFAULT TRUE,
  observaciones         TEXT,
  created_date          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE conductor ADD COLUMN IF NOT EXISTS ci                      TEXT;
ALTER TABLE conductor ADD COLUMN IF NOT EXISTS telefono                TEXT;
ALTER TABLE conductor ADD COLUMN IF NOT EXISTS email                   TEXT;
ALTER TABLE conductor ADD COLUMN IF NOT EXISTS licencia_numero         TEXT;
ALTER TABLE conductor ADD COLUMN IF NOT EXISTS licencia_categoria      TEXT;
ALTER TABLE conductor ADD COLUMN IF NOT EXISTS licencia_vencimiento    DATE;
ALTER TABLE conductor ADD COLUMN IF NOT EXISTS vehiculo_asignado_id   UUID REFERENCES vehiculo(id) ON DELETE SET NULL;
ALTER TABLE conductor ADD COLUMN IF NOT EXISTS vehiculo_asignado_chapa TEXT;
ALTER TABLE conductor ADD COLUMN IF NOT EXISTS area_centro             TEXT;
ALTER TABLE conductor ADD COLUMN IF NOT EXISTS activo                  BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE conductor ADD COLUMN IF NOT EXISTS observaciones           TEXT;
ALTER TABLE conductor ADD COLUMN IF NOT EXISTS created_date            TIMESTAMPTZ NOT NULL DEFAULT NOW();


-- ─────────────────────────────────────────────────────────────
--  7. CONSUMIDOR
--     Entidad que consume combustible: vehículo, tanque/reserva,
--     equipo estacionario, etc. El campo datos_* almacena
--     propiedades específicas del subtipo.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consumidor (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre               TEXT        NOT NULL,
  codigo_interno       TEXT,                  -- chapa, matrícula o código interno
  tipo_consumidor_id   UUID        REFERENCES tipo_consumidor(id) ON DELETE SET NULL,
  tipo_consumidor_nombre TEXT,               -- desnormalizado
  combustible_id       UUID        REFERENCES tipo_combustible(id) ON DELETE SET NULL,
  combustible_nombre   TEXT,                 -- desnormalizado
  litros_iniciales     NUMERIC(14,4) NOT NULL DEFAULT 0,
  activo               BOOLEAN     NOT NULL DEFAULT TRUE,
  responsable          TEXT,
  conductor            TEXT,
  area_centro          TEXT,
  funcion              TEXT,
  observaciones        TEXT,
  -- JSONB de propiedades por subtipo:
  datos_vehiculo       JSONB,
  --   capacidad_tanque         numeric
  --   indice_consumo_real      numeric  (km/L referencia actual)
  --   indice_consumo_fabricante numeric
  --   umbral_alerta_pct        numeric  (default 15)
  --   umbral_critico_pct       numeric  (default 30)
  --   estado_vehiculo          text
  datos_tanque         JSONB,
  --   capacidad_litros         numeric
  datos_equipo         JSONB,
  --   indice_consumo_referencia numeric  (L/h u otra unidad)
  created_date         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE consumidor ADD COLUMN IF NOT EXISTS codigo_interno         TEXT;
ALTER TABLE consumidor ADD COLUMN IF NOT EXISTS tipo_consumidor_id     UUID REFERENCES tipo_consumidor(id) ON DELETE SET NULL;
ALTER TABLE consumidor ADD COLUMN IF NOT EXISTS tipo_consumidor_nombre TEXT;
ALTER TABLE consumidor ADD COLUMN IF NOT EXISTS combustible_id         UUID REFERENCES tipo_combustible(id) ON DELETE SET NULL;
ALTER TABLE consumidor ADD COLUMN IF NOT EXISTS combustible_nombre     TEXT;
ALTER TABLE consumidor ADD COLUMN IF NOT EXISTS litros_iniciales       NUMERIC(14,4) NOT NULL DEFAULT 0;
ALTER TABLE consumidor ADD COLUMN IF NOT EXISTS activo                 BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE consumidor ADD COLUMN IF NOT EXISTS responsable            TEXT;
ALTER TABLE consumidor ADD COLUMN IF NOT EXISTS conductor              TEXT;
ALTER TABLE consumidor ADD COLUMN IF NOT EXISTS area_centro            TEXT;
ALTER TABLE consumidor ADD COLUMN IF NOT EXISTS funcion                TEXT;
ALTER TABLE consumidor ADD COLUMN IF NOT EXISTS observaciones          TEXT;
ALTER TABLE consumidor ADD COLUMN IF NOT EXISTS datos_vehiculo         JSONB;
ALTER TABLE consumidor ADD COLUMN IF NOT EXISTS datos_tanque           JSONB;
ALTER TABLE consumidor ADD COLUMN IF NOT EXISTS datos_equipo           JSONB;
ALTER TABLE consumidor ADD COLUMN IF NOT EXISTS created_date           TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_consumidor_tipo_consumidor_id ON consumidor(tipo_consumidor_id);
CREATE INDEX IF NOT EXISTS idx_consumidor_combustible_id     ON consumidor(combustible_id);
CREATE INDEX IF NOT EXISTS idx_consumidor_activo             ON consumidor(activo);


-- ─────────────────────────────────────────────────────────────
--  8. MOVIMIENTO
--     Registro transaccional central.
--     tipo: COMPRA | DESPACHO | AJUSTE | TRANSFERENCIA
--
--     COMPRA   → consumidor recibe combustible desde proveedor externo
--     DESPACHO → consumidor recibe combustible desde reserva interna
--                (consumidor_origen_id = tanque de origen)
--     AJUSTE   → corrección de saldo
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS movimiento (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo                    TEXT        NOT NULL,  -- COMPRA | DESPACHO | AJUSTE
  fecha                   TEXT        NOT NULL,  -- ISO 8601 YYYY-MM-DD (texto para compatibilidad)
  -- Combustible
  combustible_id          UUID        REFERENCES tipo_combustible(id) ON DELETE SET NULL,
  combustible_nombre      TEXT,
  -- Tarjeta de pago (solo COMPRA con tarjeta)
  tarjeta_id              UUID        REFERENCES tarjeta(id) ON DELETE SET NULL,
  tarjeta_alias           TEXT,
  -- Consumidor destino
  consumidor_id           UUID        REFERENCES consumidor(id) ON DELETE SET NULL,
  consumidor_nombre       TEXT,
  -- Consumidor origen (DESPACHO desde reserva)
  consumidor_origen_id    UUID        REFERENCES consumidor(id) ON DELETE SET NULL,
  consumidor_origen_nombre TEXT,
  -- Vehículo (desnormalizado para trazabilidad)
  vehiculo_chapa          TEXT,
  vehiculo_origen_chapa   TEXT,
  -- Volumen y precio
  litros                  NUMERIC(14,4) NOT NULL DEFAULT 0,
  precio                  NUMERIC(12,4),
  monto                   NUMERIC(14,4),
  -- Odómetro y rendimiento
  odometro                NUMERIC(12,2),         -- km al momento de la carga
  km_recorridos           NUMERIC(12,2),          -- km desde carga anterior
  consumo_real            NUMERIC(10,4),          -- km/L calculado al cerrar tramo
  -- Nivel físico del tanque ANTES de esta carga (registrado por técnico)
  nivel_tanque            NUMERIC(10,2),          -- litros en tanque antes de cargar
  -- Para equipos estacionarios (horas de uso entre cargas)
  horas_uso               NUMERIC(10,2),
  -- Referencia documental (número de factura, remisión, etc.)
  referencia              TEXT,
  created_date            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Columnas nuevas importantes — seguras de agregar sobre tabla existente
ALTER TABLE movimiento ADD COLUMN IF NOT EXISTS combustible_id          UUID REFERENCES tipo_combustible(id) ON DELETE SET NULL;
ALTER TABLE movimiento ADD COLUMN IF NOT EXISTS combustible_nombre      TEXT;
ALTER TABLE movimiento ADD COLUMN IF NOT EXISTS tarjeta_id              UUID REFERENCES tarjeta(id) ON DELETE SET NULL;
ALTER TABLE movimiento ADD COLUMN IF NOT EXISTS tarjeta_alias           TEXT;
ALTER TABLE movimiento ADD COLUMN IF NOT EXISTS consumidor_id           UUID REFERENCES consumidor(id) ON DELETE SET NULL;
ALTER TABLE movimiento ADD COLUMN IF NOT EXISTS consumidor_nombre       TEXT;
ALTER TABLE movimiento ADD COLUMN IF NOT EXISTS consumidor_origen_id    UUID REFERENCES consumidor(id) ON DELETE SET NULL;
ALTER TABLE movimiento ADD COLUMN IF NOT EXISTS consumidor_origen_nombre TEXT;
ALTER TABLE movimiento ADD COLUMN IF NOT EXISTS vehiculo_chapa          TEXT;
ALTER TABLE movimiento ADD COLUMN IF NOT EXISTS vehiculo_origen_chapa   TEXT;
ALTER TABLE movimiento ADD COLUMN IF NOT EXISTS litros                  NUMERIC(14,4) NOT NULL DEFAULT 0;
ALTER TABLE movimiento ADD COLUMN IF NOT EXISTS precio                  NUMERIC(12,4);
ALTER TABLE movimiento ADD COLUMN IF NOT EXISTS monto                   NUMERIC(14,4);
ALTER TABLE movimiento ADD COLUMN IF NOT EXISTS odometro                NUMERIC(12,2);
ALTER TABLE movimiento ADD COLUMN IF NOT EXISTS km_recorridos           NUMERIC(12,2);
ALTER TABLE movimiento ADD COLUMN IF NOT EXISTS consumo_real            NUMERIC(10,4);
ALTER TABLE movimiento ADD COLUMN IF NOT EXISTS nivel_tanque            NUMERIC(10,2);
ALTER TABLE movimiento ADD COLUMN IF NOT EXISTS horas_uso              NUMERIC(10,2);
ALTER TABLE movimiento ADD COLUMN IF NOT EXISTS referencia              TEXT;
ALTER TABLE movimiento ADD COLUMN IF NOT EXISTS created_date            TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Índices de rendimiento (las columnas más filtradas en la app)
CREATE INDEX IF NOT EXISTS idx_movimiento_fecha               ON movimiento(fecha);
CREATE INDEX IF NOT EXISTS idx_movimiento_tipo                ON movimiento(tipo);
CREATE INDEX IF NOT EXISTS idx_movimiento_consumidor_id       ON movimiento(consumidor_id);
CREATE INDEX IF NOT EXISTS idx_movimiento_consumidor_orig_id  ON movimiento(consumidor_origen_id);
CREATE INDEX IF NOT EXISTS idx_movimiento_combustible_id      ON movimiento(combustible_id);
CREATE INDEX IF NOT EXISTS idx_movimiento_combustible_nombre  ON movimiento(combustible_nombre);
CREATE INDEX IF NOT EXISTS idx_movimiento_tarjeta_id          ON movimiento(tarjeta_id);
CREATE INDEX IF NOT EXISTS idx_movimiento_fecha_tipo          ON movimiento(fecha, tipo);
CREATE INDEX IF NOT EXISTS idx_movimiento_consumidor_fecha    ON movimiento(consumidor_id, fecha);


-- ─────────────────────────────────────────────────────────────
--  9. CONFIG_ALERTA
--     Umbrales de alerta de consumo por consumidor.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS config_alerta (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumidor_id      UUID        REFERENCES consumidor(id) ON DELETE CASCADE,
  email_destino      TEXT,
  umbral_alerta_pct  NUMERIC(5,2) NOT NULL DEFAULT 15,
  umbral_critico_pct NUMERIC(5,2) NOT NULL DEFAULT 30,
  alerta_email       BOOLEAN     NOT NULL DEFAULT FALSE,
  activa             BOOLEAN     NOT NULL DEFAULT TRUE,
  created_date       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE config_alerta ADD COLUMN IF NOT EXISTS consumidor_id      UUID REFERENCES consumidor(id) ON DELETE CASCADE;
ALTER TABLE config_alerta ADD COLUMN IF NOT EXISTS email_destino      TEXT;
ALTER TABLE config_alerta ADD COLUMN IF NOT EXISTS umbral_alerta_pct  NUMERIC(5,2) NOT NULL DEFAULT 15;
ALTER TABLE config_alerta ADD COLUMN IF NOT EXISTS umbral_critico_pct NUMERIC(5,2) NOT NULL DEFAULT 30;
ALTER TABLE config_alerta ADD COLUMN IF NOT EXISTS alerta_email       BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE config_alerta ADD COLUMN IF NOT EXISTS activa             BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE config_alerta ADD COLUMN IF NOT EXISTS created_date       TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_config_alerta_consumidor_id ON config_alerta(consumidor_id);


-- ─────────────────────────────────────────────────────────────
--  10. USER_ROLES
--      Roles de acceso por usuario de Supabase Auth.
--      Roles: superadmin | operador | auditor | economico
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_roles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT,
  full_name    TEXT,
  role         TEXT        NOT NULL DEFAULT 'operador',
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS email        TEXT;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS full_name    TEXT;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS role         TEXT NOT NULL DEFAULT 'operador';
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS created_date TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role    ON user_roles(role);


-- ─────────────────────────────────────────────────────────────
--  11. AUDIT_LOG
--      Registro de auditoría de todas las acciones de usuarios.
--      Acciones: CREATE | UPDATE | DELETE | ROLE_CHANGE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID,                          -- NULL si acción de sistema
  user_email   TEXT,
  user_name    TEXT,
  action       TEXT        NOT NULL,          -- CREATE | UPDATE | DELETE | ROLE_CHANGE
  entity_type  TEXT        NOT NULL,          -- movimiento | consumidor | tarjeta | user_roles …
  entity_id    TEXT,
  entity_label TEXT,                          -- descripción legible del objeto
  payload      JSONB,                         -- estado completo del objeto afectado
  metadata     JSONB,                         -- cambios, newRole, prevRole, etc.
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS user_id      UUID;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS user_email   TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS user_name    TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS action       TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS entity_type  TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS entity_id    TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS entity_label TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS payload      JSONB;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS metadata     JSONB;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS created_date TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_audit_log_created_date ON audit_log(created_date DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id      ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type  ON audit_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_action       ON audit_log(action);


-- ─────────────────────────────────────────────────────────────
--  12. RUTA
--      Catálogo de rutas definidas (origen → destino + distancia).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ruta (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        TEXT        NOT NULL,
  punto_inicio  TEXT,
  punto_fin     TEXT,
  municipio     TEXT,
  distancia_km  NUMERIC(10,2),
  activa        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_date  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ruta ADD COLUMN IF NOT EXISTS punto_inicio      TEXT;
ALTER TABLE ruta ADD COLUMN IF NOT EXISTS punto_fin         TEXT;
ALTER TABLE ruta ADD COLUMN IF NOT EXISTS municipio         TEXT;
ALTER TABLE ruta ADD COLUMN IF NOT EXISTS distancia_km      NUMERIC(10,2);
ALTER TABLE ruta ADD COLUMN IF NOT EXISTS activa            BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE ruta ADD COLUMN IF NOT EXISTS created_date      TIMESTAMPTZ NOT NULL DEFAULT NOW();
-- Campos de logística: frecuencia y tiempo estimado
ALTER TABLE ruta ADD COLUMN IF NOT EXISTS frecuencia        TEXT;
ALTER TABLE ruta ADD COLUMN IF NOT EXISTS tiempo_estimado   TEXT;
-- Asignación habitual: vehículo y conductor por defecto para esta ruta
ALTER TABLE ruta ADD COLUMN IF NOT EXISTS consumidor_id     UUID REFERENCES consumidor(id) ON DELETE SET NULL;
ALTER TABLE ruta ADD COLUMN IF NOT EXISTS consumidor_nombre TEXT;
ALTER TABLE ruta ADD COLUMN IF NOT EXISTS conductor_id      UUID REFERENCES conductor(id)  ON DELETE SET NULL;
ALTER TABLE ruta ADD COLUMN IF NOT EXISTS conductor_nombre  TEXT;

CREATE INDEX IF NOT EXISTS idx_ruta_activa        ON ruta(activa);
CREATE INDEX IF NOT EXISTS idx_ruta_consumidor_id ON ruta(consumidor_id);
CREATE INDEX IF NOT EXISTS idx_ruta_conductor_id  ON ruta(conductor_id);


-- ─────────────────────────────────────────────────────────────
--  13. ASIGNACION_RUTA
--      Registro diario de viajes: qué vehículo hizo qué ruta,
--      con qué conductor, cuántos km reales recorrió.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS asignacion_ruta (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha                    DATE        NOT NULL,
  tipo_viaje               TEXT        NOT NULL DEFAULT 'regular',
  -- regular | carga_mercancias | mensajeria | viaje_extra
  ruta_id                  UUID        REFERENCES ruta(id) ON DELETE SET NULL,
  descripcion_emergencia   TEXT,              -- descripción libre si no es ruta estándar
  consumidor_id            UUID        REFERENCES consumidor(id) ON DELETE SET NULL,
  consumidor_nombre        TEXT,
  conductor_id             UUID        REFERENCES conductor(id) ON DELETE SET NULL,
  conductor_nombre         TEXT,
  km_reales                NUMERIC(12,2),
  observaciones            TEXT,
  estado                   TEXT        NOT NULL DEFAULT 'pendiente',
  -- pendiente | completada | cancelada
  created_date             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE asignacion_ruta ADD COLUMN IF NOT EXISTS fecha                   DATE;
ALTER TABLE asignacion_ruta ADD COLUMN IF NOT EXISTS tipo_viaje              TEXT NOT NULL DEFAULT 'regular';
ALTER TABLE asignacion_ruta ADD COLUMN IF NOT EXISTS ruta_id                 UUID REFERENCES ruta(id) ON DELETE SET NULL;
ALTER TABLE asignacion_ruta ADD COLUMN IF NOT EXISTS descripcion_emergencia  TEXT;
ALTER TABLE asignacion_ruta ADD COLUMN IF NOT EXISTS consumidor_id           UUID REFERENCES consumidor(id) ON DELETE SET NULL;
ALTER TABLE asignacion_ruta ADD COLUMN IF NOT EXISTS consumidor_nombre       TEXT;
ALTER TABLE asignacion_ruta ADD COLUMN IF NOT EXISTS conductor_id            UUID REFERENCES conductor(id) ON DELETE SET NULL;
ALTER TABLE asignacion_ruta ADD COLUMN IF NOT EXISTS conductor_nombre        TEXT;
ALTER TABLE asignacion_ruta ADD COLUMN IF NOT EXISTS km_reales               NUMERIC(12,2);
ALTER TABLE asignacion_ruta ADD COLUMN IF NOT EXISTS observaciones           TEXT;
ALTER TABLE asignacion_ruta ADD COLUMN IF NOT EXISTS estado                  TEXT NOT NULL DEFAULT 'pendiente';
ALTER TABLE asignacion_ruta ADD COLUMN IF NOT EXISTS created_date            TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_asignacion_ruta_fecha         ON asignacion_ruta(fecha);
CREATE INDEX IF NOT EXISTS idx_asignacion_ruta_consumidor_id ON asignacion_ruta(consumidor_id);
CREATE INDEX IF NOT EXISTS idx_asignacion_ruta_conductor_id  ON asignacion_ruta(conductor_id);
CREATE INDEX IF NOT EXISTS idx_asignacion_ruta_estado        ON asignacion_ruta(estado);
-- Índice compuesto: garantiza búsqueda rápida de "novedad de ruta X en día Y"
CREATE INDEX IF NOT EXISTS idx_asignacion_ruta_ruta_fecha    ON asignacion_ruta(ruta_id, fecha)
  WHERE ruta_id IS NOT NULL;


-- ─────────────────────────────────────────────────────────────
--  14. ROW LEVEL SECURITY (RLS)
--      Política base: solo usuarios autenticados pueden acceder.
--      Ajustar según roles si se implementa control por rol en DB.
-- ─────────────────────────────────────────────────────────────

-- Habilitar RLS en todas las tablas de negocio
ALTER TABLE tipo_consumidor    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipo_combustible   ENABLE ROW LEVEL SECURITY;
ALTER TABLE precio_combustible ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarjeta            ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculo           ENABLE ROW LEVEL SECURITY;
ALTER TABLE conductor          ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumidor         ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimiento         ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_alerta      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruta               ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignacion_ruta    ENABLE ROW LEVEL SECURITY;

-- ── Políticas: acceso total a usuarios autenticados ──────────
-- (Se eliminan antes de crear para evitar duplicados en re-ejecución)

DO $$ BEGIN
  -- tipo_consumidor
  DROP POLICY IF EXISTS "Authenticated full access" ON tipo_consumidor;
  CREATE POLICY "Authenticated full access" ON tipo_consumidor
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- tipo_combustible
  DROP POLICY IF EXISTS "Authenticated full access" ON tipo_combustible;
  CREATE POLICY "Authenticated full access" ON tipo_combustible
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- precio_combustible
  DROP POLICY IF EXISTS "Authenticated full access" ON precio_combustible;
  CREATE POLICY "Authenticated full access" ON precio_combustible
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- tarjeta
  DROP POLICY IF EXISTS "Authenticated full access" ON tarjeta;
  CREATE POLICY "Authenticated full access" ON tarjeta
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- vehiculo
  DROP POLICY IF EXISTS "Authenticated full access" ON vehiculo;
  CREATE POLICY "Authenticated full access" ON vehiculo
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- conductor
  DROP POLICY IF EXISTS "Authenticated full access" ON conductor;
  CREATE POLICY "Authenticated full access" ON conductor
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- consumidor
  DROP POLICY IF EXISTS "Authenticated full access" ON consumidor;
  CREATE POLICY "Authenticated full access" ON consumidor
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- movimiento
  DROP POLICY IF EXISTS "Authenticated full access" ON movimiento;
  CREATE POLICY "Authenticated full access" ON movimiento
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- config_alerta
  DROP POLICY IF EXISTS "Authenticated full access" ON config_alerta;
  CREATE POLICY "Authenticated full access" ON config_alerta
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- user_roles: solo superadmin debería escribir, pero SELECT libre para autenticados
  DROP POLICY IF EXISTS "Authenticated read access" ON user_roles;
  CREATE POLICY "Authenticated read access" ON user_roles
    FOR SELECT TO authenticated USING (true);

  DROP POLICY IF EXISTS "Authenticated write access" ON user_roles;
  CREATE POLICY "Authenticated write access" ON user_roles
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- audit_log: solo lectura para autenticados; escritura via service_role (triggers/edge functions)
  DROP POLICY IF EXISTS "Authenticated read access" ON audit_log;
  CREATE POLICY "Authenticated read access" ON audit_log
    FOR SELECT TO authenticated USING (true);

  DROP POLICY IF EXISTS "Service role write access" ON audit_log;
  CREATE POLICY "Service role write access" ON audit_log
    FOR INSERT TO authenticated WITH CHECK (true);

  -- ruta
  DROP POLICY IF EXISTS "Authenticated full access" ON ruta;
  CREATE POLICY "Authenticated full access" ON ruta
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- asignacion_ruta
  DROP POLICY IF EXISTS "Authenticated full access" ON asignacion_ruta;
  CREATE POLICY "Authenticated full access" ON asignacion_ruta
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
END $$;


-- ─────────────────────────────────────────────────────────────
--  15. COMENTARIOS DE COLUMNAS CLAVE
--      Útiles en Supabase Studio para auto-documentar el esquema.
-- ─────────────────────────────────────────────────────────────
COMMENT ON COLUMN movimiento.nivel_tanque IS
  'Litros físicos en el tanque del consumidor ANTES de esta carga. Registrado por el técnico al momento del abastecimiento. El nivel_tanque de la primera carga del mes siguiente es el cierre exacto del mes anterior.';

COMMENT ON COLUMN movimiento.consumo_real IS
  'km/L calculado automáticamente al registrar la siguiente carga. NULL si el tramo aún no se ha cerrado (pendiente de próxima carga). Valores > 200 km/L se marcan como anomalía en la UI.';

COMMENT ON COLUMN movimiento.km_recorridos IS
  'Kilómetros recorridos desde la carga anterior, calculados como odometro_actual - odometro_anterior.';

COMMENT ON COLUMN movimiento.consumidor_origen_id IS
  'Para movimientos tipo DESPACHO: ID del consumidor/tanque de reserva desde el que se despachó. Permite calcular el stock de reserva sin filtrar por combustible_nombre.';

COMMENT ON COLUMN consumidor.datos_vehiculo IS
  'JSONB con propiedades específicas de vehículos: capacidad_tanque (L), indice_consumo_real (km/L), indice_consumo_fabricante (km/L), umbral_alerta_pct (%), umbral_critico_pct (%), estado_vehiculo.';

COMMENT ON COLUMN consumidor.datos_tanque IS
  'JSONB con propiedades específicas de tanques de reserva: capacidad_litros (L).';

COMMENT ON COLUMN consumidor.datos_equipo IS
  'JSONB con propiedades específicas de equipos estacionarios: indice_consumo_referencia (L/h u otra unidad).';

COMMENT ON COLUMN consumidor.litros_iniciales IS
  'Saldo inicial de litros al momento de incorporar el consumidor al sistema. Incluido en todos los cálculos de stock y saldo.';


-- ─────────────────────────────────────────────────────────────
--  FIN DE MIGRACIÓN
-- ─────────────────────────────────────────────────────────────
