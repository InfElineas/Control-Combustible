import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard, List, Users, WalletCards, Bell, BarChart3,
  Navigation, BookOpen, Settings, Shield, HelpCircle, Search,
  ChevronRight, Fuel, ArrowRightLeft, AlertTriangle, CheckCircle2,
  Calculator, Info, Lightbulb, FileText, Gauge, Car,
  CreditCard, TrendingUp, Clock, Route, User2, Database,
} from 'lucide-react';

// ── Primitivos de layout ──────────────────────────────────────────────────────

function Callout({ type = 'info', title, children }) {
  const cfg = {
    info:    { cls: 'bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-200',    Icon: Info,          iconCls: 'text-sky-500'    },
    tip:     { cls: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200', Icon: Lightbulb,     iconCls: 'text-emerald-500' },
    warning: { cls: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200',   Icon: AlertTriangle, iconCls: 'text-amber-500'   },
    formula: { cls: 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-800/60 dark:border-slate-600 dark:text-slate-200',   Icon: Calculator,    iconCls: 'text-slate-500'   },
  }[type];
  const { cls, Icon, iconCls } = cfg;
  return (
    <div className={`rounded-xl border px-4 py-3 my-3 ${cls}`}>
      <div className="flex items-start gap-2">
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconCls}`} />
        <div className="flex-1 min-w-0 text-sm">
          {title && <p className="font-semibold mb-1">{title}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}

function Formula({ children }) {
  return (
    <code className="block bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-2.5 my-2 text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
      {children}
    </code>
  );
}

function SectionTitle({ id, children }) {
  return (
    <h2 id={id} className="text-base font-bold text-slate-800 dark:text-slate-100 mt-6 mb-2 scroll-mt-4">
      {children}
    </h2>
  );
}

function SubTitle({ children }) {
  return (
    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-4 mb-1.5">
      {children}
    </h3>
  );
}

function P({ children }) {
  return <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">{children}</p>;
}

function TableDoc({ headers, rows }) {
  return (
    <div className="overflow-x-auto my-3 rounded-xl border border-slate-100 dark:border-slate-700">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-100 dark:bg-slate-800">
            {headers.map(h => (
              <th key={h} className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/60 dark:bg-slate-800/40'}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-slate-700 dark:text-slate-300 align-top">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Tag({ children, color = 'sky' }) {
  const colors = {
    sky:     'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    orange:  'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    violet:  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    amber:   'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    red:     'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold mr-1 ${colors[color] || colors.sky}`}>
      {children}
    </span>
  );
}

// ── Secciones de contenido ────────────────────────────────────────────────────

const sections = [
  {
    id: 'introduccion',
    label: 'Introducción',
    icon: HelpCircle,
    color: 'text-sky-600',
    content: () => (
      <>
        <P>
          El <strong>Sistema de Control de Combustible</strong> permite gestionar, supervisar y auditar
          el consumo de combustible de toda la flota de vehículos y equipos de la organización.
          Registra cada carga, despacho, ruta y alerta, generando reportes trazables en tiempo real.
        </P>

        <SubTitle>Flujo general del sistema</SubTitle>
        <Callout type="info" title="Cómo fluye el combustible en el sistema">
          <ol className="list-decimal ml-4 space-y-1 mt-1">
            <li><strong>Compra externa:</strong> se registra una COMPRA (surtidor externo o reserva). El combustible entra al sistema.</li>
            <li><strong>Almacenamiento:</strong> puede guardarse en una reserva/tanque interno de la empresa.</li>
            <li><strong>Despacho interno:</strong> la reserva transfiere combustible a un vehículo o equipo (DESPACHO).</li>
            <li><strong>Consumo:</strong> el vehículo recorre km y consume. El odómetro y el consumo real se registran en cada carga.</li>
            <li><strong>Análisis:</strong> el sistema calcula km/L, detecta desviaciones y genera alertas automáticas.</li>
          </ol>
        </Callout>

        <SubTitle>Roles de usuario</SubTitle>
        <TableDoc
          headers={['Rol', 'Qué puede hacer']}
          rows={[
            [<Tag color="sky">Super Admin</Tag>, 'Acceso completo: crear, editar, eliminar en todos los módulos. Gestiona usuarios y roles.'],
            [<Tag color="emerald">Operador</Tag>, 'Registra movimientos, consumidores, alertas y configuración. No accede a Finanzas ni Administración.'],
            [<Tag color="violet">Auditor</Tag>, 'Solo lectura. Ve Dashboard, Movimientos, Rutas y Reportes. No puede crear ni eliminar.'],
            [<Tag color="amber">Económico</Tag>, 'Accede a Dashboard, Movimientos, Finanzas y Reportes. Perfil contable/financiero.'],
          ]}
        />
      </>
    ),
  },
  {
    id: 'movimientos',
    label: 'Movimientos',
    icon: List,
    color: 'text-orange-600',
    content: () => (
      <>
        <P>
          Los movimientos son el registro central del sistema. Cada carga de combustible,
          ya sea en un surtidor externo o desde una reserva interna, se registra aquí.
        </P>

        <SubTitle>Tipos de movimiento</SubTitle>
        <TableDoc
          headers={['Tipo', 'Descripción', 'Quién interviene', 'Efecto en el stock']}
          rows={[
            [
              <Tag color="orange">COMPRA</Tag>,
              'El consumidor adquiere combustible directamente en un surtidor o bomba externa usando una tarjeta corporativa.',
              'Surtidor externo → Vehículo / Reserva',
              'Suma litros al consumidor destino. Si el destino es una reserva, aumenta el stock de esa reserva.',
            ],
            [
              <Tag color="violet">DESPACHO</Tag>,
              'La empresa transfiere combustible desde una reserva interna hacia un vehículo u otro consumidor.',
              'Reserva interna → Vehículo / Equipo',
              'Resta litros de la reserva origen. Suma litros al consumidor destino.',
            ],
          ]}
        />

        <Callout type="warning" title="Diferencia clave">
          Un vehículo puede abastecerse por COMPRA (va al surtidor) o por DESPACHO (recibe de la reserva
          de la empresa). Ambos suman al consumo real del vehículo, pero se contabilizan por separado
          en los reportes financieros.
        </Callout>

        <SubTitle>Campos de un movimiento</SubTitle>
        <TableDoc
          headers={['Campo', 'Obligatorio', 'Descripción']}
          rows={[
            ['Fecha', 'Sí', 'Fecha en que ocurrió la carga o despacho.'],
            ['Tipo', 'Sí', 'COMPRA o DESPACHO.'],
            ['Consumidor (destino)', 'Sí', 'Vehículo, equipo o reserva que recibe el combustible.'],
            ['Origen (solo DESPACHO)', 'Sí en DESPACHO', 'Reserva que entrega el combustible.'],
            ['Combustible', 'Sí', 'Tipo de combustible (Gasolina Regular, Gasolina Especial, Diésel, etc.).'],
            ['Litros', 'Sí', 'Cantidad de combustible en litros.'],
            ['Precio unitario', 'Sí en COMPRA', 'Precio por litro en el momento de la compra.'],
            ['Monto total', 'Auto', 'Se calcula automáticamente: Litros × Precio.'],
            ['Tarjeta', 'Sí en COMPRA', 'Tarjeta corporativa utilizada para el pago.'],
            ['Odómetro', 'Condicional', 'Lectura actual del cuentakilómetros. Obligatorio para vehículos, opcional para equipos/tanques.'],
            ['Consumo real (km/L)', 'Auto', 'Se calcula automáticamente al registrar dos odómetros consecutivos.'],
            ['Observaciones', 'No', 'Notas libres sobre la operación.'],
          ]}
        />

        <SubTitle>Cómo se calcula el consumo real (km/L)</SubTitle>
        <Callout type="formula" title="Fórmula de consumo real">
          <Formula>
{`Km recorridos = Odómetro actual − Odómetro de la carga anterior
Consumo real  = Km recorridos ÷ Litros de la carga anterior

Ejemplo:
  Carga anterior: 35.200 km, 23 L
  Carga actual:   35.890 km
  Km recorridos = 35.890 − 35.200 = 690 km
  Consumo real  = 690 ÷ 23 = 30,0 km/L`}
          </Formula>
          El sistema calcula automáticamente el consumo real de la carga <em>anterior</em> usando
          el odómetro de la <em>carga actual</em> como referencia de cierre del tramo.
        </Callout>

        <SubTitle>Filtros disponibles</SubTitle>
        <P>La vista de movimientos permite filtrar por: período (mes), tipo (COMPRA/DESPACHO), consumidor, tipo de combustible y tarjeta.</P>
        <Callout type="tip" title="Acceso directo desde alertas">
          Al hacer clic en "Ver →" en el modal de alertas críticas del Dashboard, el sistema lleva
          directamente a Movimientos con ese movimiento específico resaltado y una barra de filtro activa.
          Puedes desactivar este filtro haciendo clic en "✕ Quitar filtro".
        </Callout>
      </>
    ),
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    color: 'text-sky-600',
    content: () => (
      <>
        <P>
          El Dashboard es la pantalla principal. Muestra el resumen del mes seleccionado,
          alertas activas y el estado del stock por tipo de combustible.
        </P>

        <SubTitle>KPIs del mes</SubTitle>
        <TableDoc
          headers={['Indicador', 'Qué mide', 'Cómo se calcula']}
          rows={[
            ['Total comprado', 'Gasto total en combustible del período', 'Suma de monto de todos los movimientos COMPRA del período'],
            ['Litros adquiridos', 'Volumen total de combustible comprado', 'Suma de litros de todos los COMPRA del período'],
            ['Despachos internos', 'Transferencias desde reservas a consumidores', 'Cuenta de movimientos DESPACHO del período'],
            ['Saldo estimado', 'Combustible disponible en reservas', 'Litros COMPRA − Litros DESPACHO (acumulado desde inicio)'],
          ]}
        />

        <SubTitle>Resumen por tipo de combustible</SubTitle>
        <Callout type="formula" title="Cálculo del saldo por combustible">
          <Formula>
{`Total disponible = Litros inicio del período + Σ(Litros COMPRA del período)
Consumo         = Σ(Litros DESPACHO del período)
Saldo final     = Total disponible − Consumo

"Consumo por consumidor" = DESPACHO desglosado por destinatario`}
          </Formula>
          <strong>Importante:</strong> las compras directas de vehículos (COMPRA) suman al "Total disponible"
          pero, como el vehículo consume directamente sin pasar por reserva, no generan un DESPACHO
          de salida. Esto es correcto operativamente.
        </Callout>

        <SubTitle>Alertas críticas</SubTitle>
        <P>
          El panel de alertas muestra vehículos cuyo consumo real se ha desviado negativamente
          respecto a su índice de referencia. Solo aparecen en el panel los que superan el umbral
          crítico configurado (por defecto 30%).
        </P>
        <Callout type="formula" title="Fórmula de desviación de consumo">
          <Formula>
{`Desviación (%) = ((Consumo referencia − Consumo real) ÷ Consumo referencia) × 100

Si Desviación ≥ Umbral crítico (por defecto 30%) → CRÍTICO (rojo)
Si Desviación ≥ Umbral alerta  (por defecto 15%) → ALERTA   (naranja)
Si Desviación < Umbral alerta                    → NORMAL   (verde)`}
          </Formula>
        </Callout>

        <SubTitle>Filtro de período</SubTitle>
        <P>
          El selector de mes en el Dashboard filtra todos los datos del resumen y las tarjetas de
          combustible. Al seleccionar "Todo" se muestran los datos históricos completos.
          Las alertas de consumo siempre se calculan sobre el último movimiento disponible,
          independientemente del filtro.
        </P>
      </>
    ),
  },
  {
    id: 'consumidores',
    label: 'Consumidores',
    icon: Users,
    color: 'text-emerald-600',
    content: () => (
      <>
        <P>
          Un <strong>consumidor</strong> es cualquier entidad que recibe o almacena combustible:
          vehículos, equipos eléctricos (grupos electrógenos) y depósitos/reservas internas.
        </P>

        <SubTitle>Tipos de consumidor</SubTitle>
        <TableDoc
          headers={['Tipo', 'Ejemplos', 'Particularidades']}
          rows={[
            ['Vehículo', 'Camiones, autos, camionetas, motos', 'Tiene odómetro, capacidad de tanque, índice de consumo km/L. Genera alertas de consumo.'],
            ['Equipo / Generador', 'Plantas eléctricas, grupos electrógenos', 'No requiere odómetro. Consume en horas o litros/día. Sin alertas de km/L.'],
            ['Tanque / Reserva', 'Depósito principal, reserva gasolina', 'Actúa como fuente en movimientos DESPACHO. Su stock se calcula por entradas menos salidas.'],
          ]}
        />

        <SubTitle>Cálculo de stock de una reserva</SubTitle>
        <Callout type="formula" title="Stock actual de una reserva">
          <Formula>
{`Stock = Litros iniciales (configurado)
       + Σ(Litros COMPRA con destino = esta reserva)
       − Σ(Litros DESPACHO con origen = esta reserva)`}
          </Formula>
        </Callout>

        <SubTitle>Indicadores de un consumidor (vehículo)</SubTitle>
        <TableDoc
          headers={['Indicador', 'Descripción']}
          rows={[
            ['Total abastecido', 'Suma de litros recibidos (COMPRA + DESPACHO) en el período seleccionado.'],
            ['Último abastecimiento', 'Fecha y litros de la carga más reciente.'],
            ['Odómetro inicio / fin', 'Valores mínimo y máximo de odómetro registrados en el período.'],
            ['Km recorridos', 'Odómetro fin − Odómetro inicio del período.'],
            ['Consumo real (km/L)', 'Promedio de los consumos reales registrados en las cargas del período.'],
            ['Consumo fabricante (km/L)', 'Valor de referencia configurado en el catálogo del vehículo.'],
            ['Días sin abastecimiento', 'Días transcurridos desde la última carga. Genera alerta si supera el umbral.'],
          ]}
        />

        <Callout type="tip" title="Columna «DESPACHO» en el detalle de un consumidor">
          Cuando un vehículo aparece como <em>origen</em> de un DESPACHO (ej: un camión cisterna que
          abastece a otros), sus litros despachados se muestran por separado del combustible que él
          mismo ha recibido.
        </Callout>
      </>
    ),
  },
  {
    id: 'finanzas',
    label: 'Finanzas',
    icon: WalletCards,
    color: 'text-amber-600',
    content: () => (
      <>
        <P>
          El módulo de Finanzas tiene dos secciones: gestión de <strong>tarjetas corporativas</strong>
          y control del <strong>stock de combustible por tipo</strong>.
        </P>

        <SubTitle>Tarjetas corporativas</SubTitle>
        <P>
          Cada compra en surtidor externo (COMPRA) se asocia a una tarjeta corporativa.
          Las tarjetas permiten rastrear el gasto por instrumento de pago y detectar uso no autorizado.
        </P>
        <TableDoc
          headers={['Campo', 'Descripción']}
          rows={[
            ['Número / Código', 'Identificador único de la tarjeta (puede ser número o código interno).'],
            ['Alias', 'Nombre descriptivo para identificarla fácilmente en los listados.'],
            ['Moneda', 'USD, CUP, MLC o EUR. Afecta el formato del monto en los reportes.'],
            ['Activa', 'Las tarjetas inactivas no pueden usarse en nuevos movimientos.'],
          ]}
        />

        <SubTitle>Stock por tipo de combustible</SubTitle>
        <P>
          El panel de stock muestra para cada tipo de combustible el balance entre entradas (COMPRA)
          y salidas (DESPACHO), con desglose de quién consumió qué.
        </P>
        <Callout type="formula" title="Cálculo del saldo de combustible">
          <Formula>
{`Total disponible = Litros inicio período + Σ(COMPRA del período)
Consumo (DESPACHO) = Σ(DESPACHO del período)
Saldo final      = Total disponible − Consumo

"Consumo por consumidor" → DESPACHO agrupado por consumidor_id (destinatario)`}
          </Formula>
        </Callout>

        <Callout type="info" title="¿Por qué el saldo puede parecer alto?">
          Las COMPRA directas de vehículos (que no pasan por reserva) suman al "Total disponible"
          pero no tienen un DESPACHO correspondiente. Esto es correcto: ese combustible fue comprado
          y consumido directamente, sin pasar por el depósito interno. Ver sección de Movimientos
          para la explicación completa.
        </Callout>

        <SubTitle>Precios de combustible</SubTitle>
        <P>
          En la sección de catálogos se configuran los precios vigentes por tipo de combustible y
          período. Cuando se registra una COMPRA, el sistema sugiere el precio vigente en esa fecha.
          Los precios históricos se mantienen para calcular correctamente el monto de movimientos pasados.
        </P>
      </>
    ),
  },
  {
    id: 'alertas',
    label: 'Alertas',
    icon: Bell,
    color: 'text-red-600',
    content: () => (
      <>
        <P>
          El módulo de Alertas monitorea continuamente el consumo de cada vehículo y muestra
          aquellos que se desvían de su rendimiento esperado.
        </P>

        <SubTitle>Lógica de detección de alertas</SubTitle>
        <Callout type="formula" title="Fórmula de desviación y clasificación">
          <Formula>
{`Consumo referencia = indice_consumo_real (si existe) ó indice_consumo_fabricante
Último consumo real = km/L de la carga más reciente con odómetro registrado

Desviación (%) = ((Consumo ref − Último consumo real) / Consumo ref) × 100

Clasificación:
  Desviación ≥ Umbral crítico  → 🔴 CRÍTICO
  Desviación ≥ Umbral alerta   → 🟡 ALERTA
  Desviación < Umbral alerta   → 🟢 NORMAL
  Sin datos suficientes        → ⬜ SIN DATOS`}
          </Formula>
          Los umbrales por defecto son <strong>15% para alerta</strong> y <strong>30% para crítico</strong>.
          Se pueden personalizar por vehículo en la pantalla de Alertas.
        </Callout>

        <SubTitle>¿Qué consumidores aparecen en Alertas?</SubTitle>
        <P>
          Solo los consumidores de tipo <em>vehículo</em> con al menos una carga que tenga
          odómetro y consumo real calculado. Los tanques, reservas y equipos eléctricos
          no generan alertas de km/L.
        </P>

        <SubTitle>Estado en la lista</SubTitle>
        <TableDoc
          headers={['Sección', 'Condición', 'Acción recomendada']}
          rows={[
            ['EN ALERTA', 'Desviación ≥ umbral de alerta (15% por defecto)', 'Revisar historial de cargas y odómetro. Verificar posibles fugas o uso indebido.'],
            ['NORMAL', 'Desviación < umbral de alerta', 'Sin acción requerida.'],
            ['SIN DATOS', 'No tiene cargas con odómetro o no tiene consumo de referencia configurado', 'Registrar el índice de consumo de referencia en Catálogos → Consumidores.'],
          ]}
        />

        <SubTitle>Gráfico de historial de consumo</SubTitle>
        <P>
          Al expandir un vehículo en la lista de alertas, se muestra el gráfico de consumo
          histórico (km/L por carga). Se necesitan al menos 2 cargas con odómetro para
          que aparezca el historial. La línea de referencia muestra el consumo esperado.
        </P>

        <SubTitle>Notificación por correo</SubTitle>
        <P>
          Los vehículos en estado crítico pueden generar un correo electrónico automático
          al responsable configurado. El botón de envío aparece en cada fila de vehículo
          crítico cuando hay un email de destino configurado en la alerta.
        </P>

        <SubTitle>Configuración de alertas</SubTitle>
        <P>
          Cada consumidor puede tener una configuración de alerta personalizada (umbrales,
          email de destino). Se accede desde el botón de configuración ⚙ en cada fila.
          Si no hay configuración propia, se usan los umbrales del catálogo del vehículo
          (datos_vehiculo) o los valores por defecto del sistema.
        </P>
      </>
    ),
  },
  {
    id: 'reportes',
    label: 'Reportes',
    icon: BarChart3,
    color: 'text-indigo-600',
    content: () => (
      <>
        <P>
          El módulo de Reportes ofrece tres vistas analíticas del consumo de la flota,
          filtradas por período (mes o historial completo).
        </P>

        <SubTitle>Reporte de Vehículos</SubTitle>
        <P>
          Tabla y barra de ranking de consumidores ordenados por litros o monto. Muestra
          el acumulado de compras directas (COMPRA) por vehículo en el período.
        </P>
        <Callout type="formula" title="Barra de capacidad (Cap: X L · Y%)">
          <Formula>
{`Litros mostrados = Σ(litros COMPRA del consumidor en el período)
Porcentaje       = MIN(100, litros / capacidad_tanque × 100)

Si el % supera 100, la barra se muestra llena (100%) porque el acumulado
histórico es mayor que la capacidad de un tanque — es normal para períodos largos.`}
          </Formula>
        </Callout>
        <Callout type="warning">
          El porcentaje en la barra <strong>no</strong> indica el nivel actual del tanque.
          Indica cuántas veces se ha "llenado" el vehículo en relación a su capacidad
          durante el período seleccionado.
        </Callout>

        <SubTitle>Reporte de Consumo</SubTitle>
        <P>
          Análisis por consumidor con odómetro, km recorridos y rendimiento km/L.
          Incluye solo consumidores con al menos una carga con odómetro registrado.
        </P>
        <TableDoc
          headers={['Columna', 'Cálculo']}
          rows={[
            ['Litros totales', 'Σ(COMPRA + DESPACHO recibido) del consumidor en el período'],
            ['Gasto total', 'Σ(monto COMPRA) del consumidor — las DESPACHO no tienen precio directo'],
            ['Odómetro inicial', 'Mínimo odómetro registrado en el período'],
            ['Odómetro final', 'Máximo odómetro registrado en el período'],
            ['Km recorridos', 'Odo. final − Odo. inicial'],
            ['Km/L promedio', 'Promedio de los consumos_real registrados en las cargas del período'],
          ]}
        />

        <SubTitle>Historial de movimientos por consumidor</SubTitle>
        <P>
          Desde el ícono de lista en cualquier fila del reporte se puede ver el historial
          completo de movimientos de ese consumidor, con filtros de fecha y tipo.
        </P>
      </>
    ),
  },
  {
    id: 'rutas',
    label: 'Rutas',
    icon: Navigation,
    color: 'text-teal-600',
    content: () => (
      <>
        <P>
          El módulo de Rutas lleva un registro operativo de los viajes realizados por
          los vehículos cada día, independientemente de las cargas de combustible.
        </P>

        <Callout type="info" title="Relación con el combustible">
          Rutas y Movimientos son registros <strong>paralelos e independientes</strong>. Rutas
          documenta los trayectos operativos; Movimientos documenta el combustible consumido.
          No existe un enlace automático entre ambos módulos actualmente.
        </Callout>

        <SubTitle>Catálogo de rutas</SubTitle>
        <P>
          Antes de registrar viajes, define las rutas habituales de tu operación. Cada ruta tiene:
        </P>
        <TableDoc
          headers={['Campo', 'Descripción']}
          rows={[
            ['Nombre', 'Identificador de la ruta (ej: "Polígono Norte").'],
            ['Punto de inicio / fin', 'Lugares de partida y llegada.'],
            ['Municipio', 'Área geográfica de referencia.'],
            ['Distancia (km)', 'Kilómetros de referencia para comparar con km reales.'],
            ['Tiempo estimado', 'Duración esperada del trayecto.'],
            ['Frecuencia', 'Con qué periodicidad se hace esta ruta (Diario, Semanal, etc.).'],
            ['Activa', 'Las rutas inactivas no aparecen en el selector de viajes.'],
          ]}
        />

        <SubTitle>Tipos de viaje</SubTitle>
        <TableDoc
          headers={['Tipo', 'Descripción', 'Requiere ruta del catálogo']}
          rows={[
            [<Tag color="sky">Regular</Tag>, 'Ruta planificada y conocida, seleccionada del catálogo.', 'Sí'],
            [<Tag color="violet">Carga de mercancías</Tag>, 'Viajes de los comerciales con mercancía. Llevan descripción libre del destino.', 'No'],
            [<Tag color="amber">Mensajería</Tag>, 'Entregas de documentos u objetos. Llevan descripción libre.', 'No'],
            [<Tag color="orange">Viaje extra</Tag>, 'Cualquier salida imprevista o de contingencia.', 'No'],
          ]}
        />

        <SubTitle>Registro diario de viajes</SubTitle>
        <P>
          Cada viaje registrado incluye: fecha, tipo, vehículo, conductor (opcional),
          km reales recorridos (opcional, para comparar con la distancia de referencia),
          estado (Completado / Pendiente / Cancelado) y observaciones.
        </P>

        <SubTitle>Estadísticas del mes</SubTitle>
        <P>
          La pestaña Estadísticas muestra para el mes en curso: rutas más frecuentes (con barra
          de uso relativo), actividad por vehículo (viajes + km acumulados) y desglose porcentual
          de los 4 tipos de viaje.
        </P>

        <Callout type="tip">
          Solo los vehículos aparecen en el selector de asignación de viajes.
          Los tanques, reservas y equipos/generadores quedan excluidos automáticamente.
        </Callout>
      </>
    ),
  },
  {
    id: 'conductores',
    label: 'Conductores',
    icon: User2,
    color: 'text-cyan-600',
    content: () => (
      <>
        <P>
          El catálogo de conductores almacena los datos de los operadores de vehículos.
          Cada conductor puede estar asignado a un vehículo específico.
        </P>
        <TableDoc
          headers={['Campo', 'Descripción']}
          rows={[
            ['Nombre', 'Nombre completo del conductor.'],
            ['Vehículo asignado', 'Chapa o código del vehículo que habitualmente conduce.'],
            ['Teléfono / Email', 'Datos de contacto para notificaciones.'],
            ['Activo', 'Los conductores inactivos no aparecen en los selectores.'],
          ]}
        />
        <Callout type="info" title="Conductor del mes (Dashboard)">
          El Dashboard calcula automáticamente el "conductor del mes": el conductor cuyo
          vehículo asignado registró más litros en el período seleccionado (COMPRA + DESPACHO).
          Se basa en la chapa del vehículo asignado al conductor.
        </Callout>
        <P>
          En el módulo de Rutas, puedes registrar qué conductor realizó cada viaje del día,
          lo que permite cruzar actividad operativa con historial de cargas de combustible.
        </P>
      </>
    ),
  },
  {
    id: 'catalogos',
    label: 'Catálogos',
    icon: BookOpen,
    color: 'text-rose-600',
    content: () => (
      <>
        <P>
          Los catálogos son las tablas maestras del sistema. Definen los tipos de datos
          que se usan en el resto de módulos.
        </P>

        <SubTitle>Tipos de consumidor</SubTitle>
        <P>
          Define las categorías de consumidores (Vehículo, Tanque, Equipo, etc.).
          El tipo del consumidor determina qué campos son obligatorios (odómetro, capacidad)
          y si genera alertas de consumo.
        </P>

        <SubTitle>Tipos de combustible</SubTitle>
        <P>
          Lista los combustibles disponibles (Gasolina Regular, Gasolina Especial, Diésel, etc.).
          Cada consumidor tiene asociado su tipo de combustible por defecto.
        </P>

        <SubTitle>Precios de combustible</SubTitle>
        <P>
          Registro histórico de precios por litro. Cada precio tiene una fecha de vigencia.
          Al registrar una COMPRA, el sistema busca el precio vigente más reciente para
          esa fecha y ese tipo de combustible.
        </P>
        <Callout type="formula" title="Precio vigente en una fecha">
          <Formula>
{`Precio vigente = MAX(fecha_desde) de los precios donde:
  combustible_id = combustible seleccionado
  fecha_desde   ≤ fecha del movimiento`}
          </Formula>
        </Callout>

        <SubTitle>Consumidores (catálogo completo)</SubTitle>
        <P>
          Lista todos los consumidores con sus datos técnicos. Aquí se configuran los
          parámetros clave para el análisis:
        </P>
        <TableDoc
          headers={['Parámetro', 'Dónde se usa']}
          rows={[
            ['capacidad_tanque (L)', 'Barra de capacidad en Reporte Vehículos. Validación de exceso en nuevas cargas.'],
            ['indice_consumo_fabricante (km/L)', 'Referencia para calcular desviación de consumo en Alertas.'],
            ['indice_consumo_real (km/L)', 'Si está configurado, tiene prioridad sobre el fabricante como referencia.'],
            ['umbral_alerta_pct (%)', 'Porcentaje de desviación que activa el nivel "Alerta" (naranja).'],
            ['umbral_critico_pct (%)', 'Porcentaje de desviación que activa el nivel "Crítico" (rojo).'],
            ['litros_iniciales', 'Stock inicial para reservas/tanques (saldo de apertura).'],
          ]}
        />

        <SubTitle>Vehículos</SubTitle>
        <P>
          Catálogo técnico de los vehículos físicos (marca, modelo, año, chapa).
          Los vehículos del catálogo pueden vincularse a un consumidor para cruzar datos
          de historial de odómetro.
        </P>
      </>
    ),
  },
  {
    id: 'configuracion',
    label: 'Configuración',
    icon: Settings,
    color: 'text-slate-600',
    content: () => (
      <>
        <P>
          La pantalla de Configuración permite ajustar parámetros operativos del sistema
          y gestionar la importación de datos históricos.
        </P>

        <SubTitle>Gestión de precios</SubTitle>
        <P>
          Puedes agregar, editar o eliminar precios vigentes por tipo de combustible.
          Los cambios de precio afectan el cálculo del monto en los nuevos movimientos
          que se registren desde esa fecha en adelante.
        </P>
        <Callout type="warning">
          Modificar un precio histórico puede alterar el monto calculado en movimientos
          ya registrados si el sistema lo recalcula. Se recomienda agregar un nuevo precio
          con fecha de vigencia en lugar de editar el existente.
        </Callout>

        <SubTitle>Importación de datos</SubTitle>
        <P>
          La guía de importación explica el formato de archivo CSV/Excel aceptado para
          cargar datos históricos de movimientos de forma masiva. Úsala cuando se migra
          al sistema desde registros en papel u hojas de cálculo.
        </P>

        <SubTitle>Alertas globales</SubTitle>
        <P>
          Umbrales por defecto aplicables a todos los consumidores que no tienen
          configuración propia de alerta.
        </P>
      </>
    ),
  },
  {
    id: 'administracion',
    label: 'Administración',
    icon: Shield,
    color: 'text-violet-600',
    content: () => (
      <>
        <P>
          El panel de administración es exclusivo para usuarios con rol <Tag color="sky">Super Admin</Tag>.
          Permite gestionar usuarios, roles y ver el registro de auditoría del sistema.
        </P>

        <SubTitle>Gestión de usuarios y roles</SubTitle>
        <TableDoc
          headers={['Rol', 'Descripción']}
          rows={[
            ['superadmin', 'Acceso total. Puede gestionar usuarios, eliminar registros y ver auditoría.'],
            ['operador', 'Registra y edita movimientos, consumidores, conductores y alertas.'],
            ['auditor', 'Solo lectura. Ve movimientos, rutas y reportes sin poder modificar nada.'],
            ['economico', 'Accede a Finanzas y Reportes. Perfil orientado al análisis financiero.'],
          ]}
        />

        <SubTitle>Registro de auditoría</SubTitle>
        <P>
          El registro de auditoría captura automáticamente <strong>cada acción</strong> realizada
          en el sistema: creaciones, ediciones, eliminaciones y cambios de rol.
        </P>
        <TableDoc
          headers={['Campo', 'Descripción']}
          rows={[
            ['Acción', 'CREATE, UPDATE, DELETE o ROLE_CHANGE.'],
            ['Entidad', 'Tipo de registro afectado (Movimiento, Consumidor, Tarjeta, etc.).'],
            ['Etiqueta', 'Nombre o identificador del registro afectado.'],
            ['Usuario', 'Email y nombre del usuario que realizó la acción.'],
            ['Fecha/Hora', 'Timestamp exacto de la operación (UTC).'],
            ['Payload', 'Estado completo del registro en el momento de la operación (JSON).'],
            ['Cambios', 'Para UPDATE: los campos que fueron modificados y sus nuevos valores.'],
          ]}
        />
        <Callout type="tip" title="Trazabilidad completa">
          Para las eliminaciones, el sistema toma una copia del registro completo
          <em> antes de borrarlo</em> y la guarda en el payload del log.
          Esto permite reconstruir el estado de cualquier dato eliminado.
        </Callout>

        <Callout type="info" title="Retención y refresco">
          El registro de auditoría se refresca automáticamente cada 60 segundos en la
          pantalla de administración. Incluye filtros por acción, entidad y búsqueda de texto.
        </Callout>
      </>
    ),
  },
  {
    id: 'glosario',
    label: 'Glosario',
    icon: FileText,
    color: 'text-slate-600',
    content: () => (
      <>
        <P>Referencia rápida de los términos técnicos usados en el sistema.</P>
        <TableDoc
          headers={['Término', 'Definición']}
          rows={[
            ['COMPRA', 'Movimiento de entrada: el consumidor adquiere combustible en un surtidor externo con tarjeta corporativa.'],
            ['DESPACHO', 'Movimiento de transferencia interna: una reserva transfiere combustible a un consumidor.'],
            ['Consumidor', 'Cualquier entidad que recibe o almacena combustible: vehículo, equipo o reserva.'],
            ['Reserva / Tanque', 'Depósito interno de la empresa que actúa como fuente de combustible para DESPACHO.'],
            ['Tarjeta corporativa', 'Medio de pago utilizado para COMPRA en surtidores externos. Se asocia a cada movimiento.'],
            ['Odómetro (km)', 'Lectura del cuentakilómetros del vehículo al momento de la carga.'],
            ['Consumo real (km/L)', 'Km recorridos entre dos cargas consecutivas dividido entre los litros de la carga anterior.'],
            ['Índice de consumo fabricante', 'Rendimiento km/L indicado por el fabricante del vehículo. Usado como referencia base.'],
            ['Índice de consumo real', 'Rendimiento km/L observado en condiciones reales de operación. Tiene prioridad sobre el fabricante.'],
            ['Desviación (%)', '((Consumo referencia − Consumo real) / Consumo referencia) × 100. Mide cuánto peor rinde el vehículo.'],
            ['Umbral de alerta', 'Porcentaje de desviación a partir del cual el sistema activa una alerta naranja.'],
            ['Umbral crítico', 'Porcentaje de desviación a partir del cual el sistema activa una alerta roja.'],
            ['Saldo final', 'Litros disponibles estimados en reservas: COMPRA totales − DESPACHO totales del período.'],
            ['Litros iniciales', 'Stock de apertura configurado para una reserva (combustible ya existente antes del primer registro).'],
            ['Período', 'Intervalo de tiempo seleccionado para filtrar datos (mes específico o historial completo).'],
            ['km/L', 'Kilómetros por litro. Medida de eficiencia de combustible. Mayor es mejor.'],
            ['Ruta regular', 'Trayecto preestablecido en el catálogo de rutas, con distancia y puntos definidos.'],
            ['Viaje extra', 'Desplazamiento fuera de las rutas planificadas: imprevistos, contingencias o viajes especiales.'],
            ['Audit log', 'Registro inmutable de cada acción realizada en el sistema con usuario, fecha y datos completos.'],
          ]}
        />
      </>
    ),
  },
];

// ── Componente principal ──────────────────────────────────────────────────────

export default function Ayuda() {
  const [activeId, setActiveId] = useState('introduccion');
  const [query, setQuery] = useState('');
  const contentRef = useRef(null);

  const activeSection = sections.find(s => s.id === activeId);

  const filtered = useMemo(() => {
    if (!query.trim()) return sections;
    const q = query.toLowerCase();
    return sections.filter(s => {
      if (s.label.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [query]);

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [activeId]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
          <HelpCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Centro de ayuda</h1>
          <p className="text-xs text-slate-400">Documentación completa del sistema de control de combustible</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar sección…"
          className="pl-9 h-9 text-sm"
        />
      </div>

      <div className="flex gap-4 items-start">
        {/* Sidebar */}
        <nav className="hidden md:flex flex-col gap-0.5 w-44 shrink-0 sticky top-4">
          {(query ? filtered : sections).map(s => {
            const Icon = s.icon;
            const active = s.id === activeId;
            return (
              <button
                key={s.id}
                onClick={() => { setActiveId(s.id); setQuery(''); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-left transition-all ${
                  active
                    ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? s.color : 'text-slate-400'}`} />
                {s.label}
                {active && <ChevronRight className="w-3 h-3 ml-auto text-sky-400" />}
              </button>
            );
          })}
        </nav>

        {/* Mobile: pills row */}
        <div className="md:hidden flex gap-1.5 flex-wrap">
          {sections.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  activeId === s.id
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3 h-3" />{s.label}
              </button>
            );
          })}
        </div>

        {/* Content panel */}
        {activeSection && (
          <div
            ref={contentRef}
            className="flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm"
          >
            {/* Section header */}
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
              <activeSection.icon className={`w-5 h-5 shrink-0 ${activeSection.color}`} />
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{activeSection.label}</h2>
            </div>

            {/* Rendered section */}
            <activeSection.content />
          </div>
        )}

        {/* Search results (no active section) */}
        {query && filtered.length > 0 && (
          <div className="flex-1 min-w-0 space-y-2">
            <p className="text-xs text-slate-400">{filtered.length} sección{filtered.length !== 1 ? 'es' : ''} encontrada{filtered.length !== 1 ? 's' : ''}</p>
            {filtered.map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => { setActiveId(s.id); setQuery(''); }}
                  className="w-full flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-950 transition-colors text-left"
                >
                  <Icon className={`w-4 h-4 shrink-0 ${s.color}`} />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{s.label}</span>
                  <ChevronRight className="w-4 h-4 ml-auto text-slate-300" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
