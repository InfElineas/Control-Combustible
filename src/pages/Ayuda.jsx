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
          headers={['Tarjeta', 'Qué mide', 'Cómo se calcula']}
          rows={[
            ['Gasto combustible', 'Monto total pagado en combustible del período', 'Σ(monto COMPRA del período) — solo compras en surtidores externos con tarjeta'],
            ['Litros comprados', 'Litros adquiridos externamente + litros despachados de reservas', 'Línea principal: Σ(litros COMPRA). Sublínea: Σ(litros DESPACHO) del período'],
            ['Consumidores activos', 'Unidades de flota en operación', 'Cuenta de consumidores con el flag «activo» habilitado'],
            ['Consumo crítico', 'Vehículos con rendimiento bajo el umbral crítico', 'Consumidores cuya desviación de km/L supera el umbral crítico configurado (por defecto 30%)'],
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
        <Callout type="info" title="Descomposición del saldo final">
          Cuando hay reservas internas, el <strong>«Saldo final»</strong> se desglosa automáticamente
          en dos sub-líneas que suman exactamente ese total:
          <ul className="mt-1.5 space-y-0.5 list-none">
            <li>🛢 <strong>En reserva (tanques)</strong> — litros estimados actualmente en los tanques
              físicos de la empresa (entradas históricas menos despachos acumulados al momento actual).</li>
            <li>🚗 <strong>Ya en vehículos</strong> — diferencia entre el saldo total y el stock en
              reserva: combustible que ya fue distribuido a los vehículos (compras directas en surtidor
              externo, menos lo que esos vehículos hayan redistribuido como cisterna).</li>
          </ul>
          <strong>Las dos líneas siempre suman el saldo final.</strong> El desglose bajo «+ Compras» (separado)
          muestra cómo ingresó el combustible al sistema: «↳ A reserva interna» y «↳ Compra directa
          vehículos» (suma = total compras del período).
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
          El selector de mes en el Dashboard filtra todos los KPIs, el resumen por combustible
          y las tarjetas de consumidores. Al seleccionar "Todo" se muestran los datos históricos completos.
          Las alertas de consumo se calculan sobre el último movimiento disponible (COMPRA o DESPACHO)
          del vehículo, independientemente del filtro de mes seleccionado.
        </P>
        <Callout type="tip" title="Ver consumo mes a mes por vehículo">
          Cada tarjeta de vehículo tiene el botón <strong>«Ver detalles por mes»</strong> que abre
          una tabla con el desglose histórico completo: cargas, litros, monto, odómetro y km/L separados
          por mes. Aparece cuando el vehículo tiene actividad en dos o más meses distintos.
        </Callout>
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
          headers={['Indicador', 'Descripción', 'Fuente de datos']}
          rows={[
            ['Total abastecido', 'Litros recibidos en el período seleccionado.', 'COMPRA + DESPACHO recibidos'],
            ['Gasto del período', 'Costo financiero del período.', 'Solo COMPRA (DESPACHO es transferencia interna)'],
            ['Último abastecimiento', 'Fecha y litros de la carga más reciente.', 'COMPRA o DESPACHO, el más reciente'],
            ['Odo. inicio / Odo. final', 'Primera y última lectura de odómetro entre las dos cargas más recientes con datos.', 'COMPRA + DESPACHO con odómetro registrado'],
            ['Km recorridos', 'Odo. final − Odo. inicio entre las dos lecturas más recientes.', 'Diferencia de los dos odómetros más altos'],
            ['Consumo real (km/L)', 'Promedio de los consumos reales del período.', 'COMPRA + DESPACHO con consumo_real calculado'],
            ['Consumo fabricante (km/L)', 'Referencia configurada en el catálogo del vehículo.', 'Tabla consumidores → datos_vehiculo'],
            ['Días sin abastecimiento', 'Días desde la última carga (COMPRA o DESPACHO).', 'Fecha del movimiento más reciente'],
          ]}
        />

        <SubTitle>Desglose histórico por mes («Ver detalles por mes»)</SubTitle>
        <P>
          El botón <strong>«Ver detalles por mes»</strong> aparece en cada tarjeta de vehículo o equipo
          cuando tiene actividad registrada en dos o más meses distintos. Abre una tabla con el consumo
          completo desglosado mes a mes.
        </P>
        <TableDoc
          headers={['Columna', 'Qué muestra', 'Fuente']}
          rows={[
            ['Mes', 'Nombre del mes y año.', '—'],
            ['Cargas', 'Número total de movimientos recibidos ese mes.', 'COMPRA + DESPACHO'],
            ['Litros', 'Total de litros abastecidos ese mes.', 'COMPRA + DESPACHO'],
            ['Monto', 'Gasto financiero ese mes.', 'Solo COMPRA'],
            ['Odo. inicio', 'Odómetro máximo registrado antes del inicio del mes (punto de referencia de partida).', 'COMPRA + DESPACHO'],
            ['Odo. fin', 'Odómetro máximo registrado dentro del mes.', 'COMPRA + DESPACHO'],
            ['Km rec.', 'Odo. fin − Odo. inicio. Queda vacío (⚠) si el odómetro es inconsistente.', 'Calculado'],
            ['km/L', 'Promedio de consumos reales del mes. Muestra «pend.» si el tramo no está cerrado, o «⚠» en rojo si el valor supera 200 km/L (dato erróneo).', 'COMPRA + DESPACHO con consumo_real'],
            ['En tanque', 'Litros físicos en el tanque al cierre del mes. Columna visible solo cuando alguna carga tiene nivel_tanque registrado. Dato exacto (azul) o estimado con ≈ (gris).', 'nivel_tanque del movimiento'],
          ]}
        />
        <P>El pie del panel muestra totales acumulados y, cuando hay datos suficientes, una estimación del combustible actualmente en el tanque del vehículo.</P>
        <Callout type="tip" title="Columna «En tanque» — nivel físico registrado">
          La columna <strong>«En tanque»</strong> aparece automáticamente en la tabla cuando alguna
          carga del vehículo tiene el campo <code>nivel_tanque</code> registrado. Muestra cuántos
          litros había físicamente en el tanque al cierre de cada mes:
          <ul className="mt-1.5 space-y-0.5 list-none">
            <li><strong>Azul (dato exacto):</strong> el <code>nivel_tanque</code> de la primera carga
              del mes siguiente — es el nivel exacto al llegar a esa carga, es decir, el nivel real
              al cierre del mes anterior.</li>
            <li><strong>Gris con ≈ (estimado):</strong> solo para el mes más reciente, donde no hay
              carga posterior. Se calcula como <code>nivel_tanque + litros</code> de la última carga
              del mes (el nivel justo después de esa carga, antes del consumo posterior).</li>
            <li><strong>— (sin datos):</strong> ninguna carga del mes ni del mes siguiente tiene
              <code>nivel_tanque</code> registrado.</li>
          </ul>
          A diferencia de las estimaciones por km/L, este dato es <strong>físicamente correcto</strong>
          y siempre respetará la capacidad del tanque del vehículo.
        </Callout>
        <Callout type="warning" title="km/L con ⚠ en rojo — valor atípico (dato erróneo)">
          Si la columna km/L muestra un <strong>⚠ número en rojo</strong>, significa que el promedio
          calculado supera los 200 km/L, lo cual es físicamente imposible para cualquier vehículo
          terrestre. La causa más común es un movimiento de ese mes con:
          <ul className="mt-1 space-y-0.5 list-disc list-inside">
            <li><strong>Litros muy bajos o en 0</strong> al registrarse la carga (denomina el km/L).</li>
            <li><strong>Salto de odómetro incorrecto</strong> (e.g., odómetro ingresado en metros en lugar de kilómetros).</li>
          </ul>
          El valor anómalo se excluye del km/L promedio global. Para corregirlo, localizá el movimiento
          del mes marcado en el módulo de Movimientos y corregí el litros u odómetro mal ingresado.
        </Callout>
        <Callout type="info" title="km/L «pend.» — tramo aún no cerrado">
          El km/L de un mes se muestra como <strong>pend.</strong> (con ícono de reloj) cuando el mes tiene
          cargas con odómetro registrado, pero ninguna de ellas tiene <code>consumo_real</code> calculado.
          Esto ocurre porque el km/L se calcula <em>al momento de la carga siguiente</em>: el sistema toma
          la diferencia de odómetro entre la carga actual y la anterior. Si el vehículo aún no fue cargado
          nuevamente después de ese mes, el tramo queda abierto y el rendimiento no puede calcularse.
          Es el comportamiento normal para el mes más reciente. No requiere acción; se actualizará
          automáticamente con la próxima carga registrada.
        </Callout>
        <Callout type="warning" title="Meses con odómetro inconsistente">
          Si el <strong>Odo. fin</strong> de un mes es menor al <strong>Odo. inicio</strong> (es decir, el
          odómetro «retrocedió»), la fila se resalta en <strong>amarillo</strong> y la columna «Km rec.»
          muestra <strong>⚠ —</strong> en lugar de un número. Esto indica un error de carga: el valor ingresado
          en alguna carga de ese mes es inferior a lecturas anteriores del mismo vehículo. El sistema
          no inventa kilómetros negativos; simplemente deja el dato en blanco hasta que se corrija
          el registro erróneo en el módulo de Movimientos.
        </Callout>

        <Callout type="tip" title="«DESPACHO» como origen">
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
          filtrables por rango de fechas (campo «Desde» / «Hasta»).
          Cuando no se establece ningún filtro se muestran todos los datos históricos disponibles.
        </P>

        <Callout type="info" title="Regla de datos en todos los reportes">
          Para <strong>volumen consumido</strong> (litros, cargas, odómetro, km/L) se incluyen
          tanto COMPRA como DESPACHO recibidos. Para <strong>valor financiero</strong> (monto, gasto)
          solo se incluyen COMPRA, ya que los DESPACHO son transferencias internas sin costo externo directo.
        </Callout>

        <SubTitle>Reporte de Consumidores</SubTitle>
        <P>
          Ranking de todos los consumidores que recibieron combustible en el período,
          ordenables por litros totales, monto o número de cargas.
        </P>
        <Callout type="formula" title="Cálculo por fila de consumidor">
          <Formula>
{`Litros totales = Σ(litros COMPRA) + Σ(litros DESPACHO recibidos) del período
Monto total    = Σ(monto COMPRA) del período  ← DESPACHO no genera costo directo

Barra de capacidad (si el consumidor tiene capacidad_tanque configurada):
  Porcentaje = MIN(100 %, litros totales / capacidad_tanque × 100)

Sin capacidad configurada → barra relativa al mayor consumidor del período.`}
          </Formula>
        </Callout>
        <Callout type="warning">
          El porcentaje en la barra <strong>no</strong> indica el nivel actual del tanque.
          Refleja el volumen acumulado en el período respecto a la capacidad nominal —
          puede superar el 100 % en períodos largos o para consumidores de tanque pequeño.
        </Callout>

        <SubTitle>Reporte de Consumo (km/L y rendimiento)</SubTitle>
        <P>
          Análisis de eficiencia por consumidor con odómetro, km recorridos y rendimiento km/L.
          Aparecen solo los consumidores con al menos un movimiento registrado en el período.
        </P>
        <TableDoc
          headers={['Columna', 'Cálculo', 'Fuente']}
          rows={[
            ['Litros', 'Total de litros abastecidos en el período', 'COMPRA + DESPACHO recibidos'],
            ['Monto', 'Gasto financiero del período', 'Solo COMPRA'],
            ['Cargas', 'Cantidad de movimientos del período', 'COMPRA + DESPACHO'],
            ['Ref (km/L)', 'Índice de consumo de referencia del vehículo', 'Catálogo consumidores'],
            ['Prom (km/L)', 'Promedio de todos los consumos_real con odómetro registrado', 'COMPRA + DESPACHO'],
            ['Último (km/L)', 'Consumo real del movimiento más reciente con odómetro', 'COMPRA + DESPACHO'],
            ['Estado', 'Normal / Alerta / Crítico según desviación respecto a la referencia', 'Calculado'],
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
