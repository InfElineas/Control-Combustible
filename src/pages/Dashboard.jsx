import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CreditCard, ArrowLeftRight, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { calcularSaldo, formatMonto } from '@/components/ui-helpers/SaldoUtils';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import GastosMensualesChart from '@/components/dashboard/GastosMensualesChart';
import ConsumidoresPorTipo from '@/components/dashboard/ConsumidoresPorTipo';

function SectionTitle({ icon: Icon, title, iconColor = 'text-slate-400' }) {
  return (
    <div className="flex items-center gap-2 mb-3 text-slate-600">
      <Icon className={`w-4 h-4 ${iconColor}`} />
      <span className="text-sm font-semibold uppercase tracking-wide">{title}</span>
    </div>
  );
}

export default function Dashboard() {
  const { data: tarjetas = [] } = useQuery({ queryKey: ['tarjetas'], queryFn: () => base44.entities.Tarjeta.list() });
  const { data: movimientos = [] } = useQuery({ queryKey: ['movimientos'], queryFn: () => base44.entities.Movimiento.list('-fecha', 1000) });
  const { data: consumidores = [] } = useQuery({ queryKey: ['consumidores'], queryFn: () => base44.entities.Consumidor.list() });
  const { data: tiposConsumidor = [] } = useQuery({ queryKey: ['tiposConsumidor'], queryFn: () => base44.entities.TipoConsumidor.list() });

  const hoy = new Date();
  const mesActual = hoy.toISOString().slice(0, 7);

  // Resumen del mes
  const comprasMes = movimientos.filter(m => m.tipo === 'COMPRA' && m.fecha?.startsWith(mesActual));
  const litrosMes = comprasMes.reduce((s, m) => s + (m.litros || 0), 0);
  const gastoMes = comprasMes.reduce((s, m) => s + (m.monto || 0), 0);
  const despachosMes = movimientos.filter(m => m.tipo === 'DESPACHO' && m.fecha?.startsWith(mesActual));
  const litrosDespachadosMes = despachosMes.reduce((s, m) => s + (m.litros || 0), 0);

  // Consumidores activos
  const consumidoresActivos = consumidores.filter(c => c.activo);

  // Alertas de consumo crítico
  const alertasConsumo = consumidoresActivos.filter(c => {
    const consumoRef = c.datos_vehiculo?.indice_consumo_real || c.datos_vehiculo?.indice_consumo_fabricante;
    const movsConConsumo = movimientos
      .filter(m => m.tipo === 'COMPRA' && m.consumidor_id === c.id && m.consumo_real != null)
      .sort((a, b) => b.odometro - a.odometro);
    if (!consumoRef || movsConConsumo.length === 0) return false;
    const consumoUltimo = movsConConsumo[0].consumo_real;
    const umbralCritico = c.datos_vehiculo?.umbral_critico_pct ?? 30;
    const desviacion = ((consumoRef - consumoUltimo) / consumoRef) * 100;
    return desviacion >= umbralCritico;
  });

  // Tarjetas
  const tarjetasActivas = tarjetas.filter(t => t.activa);
  const saldos = tarjetasActivas.map(t => ({ ...t, saldo: calcularSaldo(t, movimientos) }));

  // Stock en reserva (consumidores tanque/reserva - basado en compras y despachos)
  const stockReserva = (() => {
    const map = {};
    movimientos.filter(m => m.tipo === 'COMPRA' && m.litros && m.consumidor_id).forEach(m => {
      const con = consumidores.find(c => c.id === m.consumidor_id);
      const esTanque = con?.tipo_consumidor_nombre?.toLowerCase().includes('tanque')
        || con?.tipo_consumidor_nombre?.toLowerCase().includes('reserva');
      if (!esTanque) return;
      const k = m.combustible_nombre || '?';
      map[k] = (map[k] || 0) + (m.litros || 0);
    });
    movimientos.filter(m => m.tipo === 'DESPACHO' && m.litros).forEach(m => {
      const k = m.combustible_nombre || '?';
      if (map[k] != null) map[k] -= (m.litros || 0);
    });
    return map;
  })();

  const hayStockReserva = Object.keys(stockReserva).length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {hoy.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Resumen del mes */}
      <div>
        <SectionTitle icon={TrendingDown} title={`Resumen ${hoy.toLocaleDateString('es-ES', { month: 'long' })}`} iconColor="text-sky-500" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-[11px] text-slate-400 uppercase tracking-wide">Gasto combustible</p>
              <p className="text-lg font-bold text-slate-800 mt-1">{formatMonto(gastoMes)}</p>
              <p className="text-xs text-slate-400">{comprasMes.length} compras</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-[11px] text-slate-400 uppercase tracking-wide">Litros comprados</p>
              <p className="text-lg font-bold text-orange-600 mt-1">{litrosMes.toFixed(1)} L</p>
              <p className="text-xs text-slate-400">{litrosDespachadosMes.toFixed(1)} L despachados</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-[11px] text-slate-400 uppercase tracking-wide">Consumidores activos</p>
              <p className="text-lg font-bold text-emerald-600 mt-1">{consumidoresActivos.length}</p>
              <p className="text-xs text-slate-400">{tiposConsumidor.filter(t => t.activo !== false).length} tipos</p>
            </CardContent>
          </Card>
          <Card className={`border-0 shadow-sm ${alertasConsumo.length > 0 ? 'ring-1 ring-red-200 bg-red-50/20' : ''}`}>
            <CardContent className="p-4">
              <p className="text-[11px] text-slate-400 uppercase tracking-wide">Consumo crítico</p>
              <p className={`text-lg font-bold mt-1 ${alertasConsumo.length > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                {alertasConsumo.length}
              </p>
              <p className="text-xs text-slate-400">unidades con alerta</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alertas de consumo crítico */}
      {alertasConsumo.length > 0 && (
        <div className="space-y-2">
          {alertasConsumo.map(c => (
            <div key={c.id} className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="font-semibold text-red-700">{c.nombre}</span>
              {c.codigo_interno && <span className="text-red-500 font-mono text-xs">{c.codigo_interno}</span>}
              <span className="text-red-600 text-xs">— consumo crítico en la última carga</span>
            </div>
          ))}
        </div>
      )}

      {/* Gráfico gasto mensual */}
      <div>
        <SectionTitle icon={TrendingUp} title="Gastos por mes (últimos 6 meses)" iconColor="text-sky-500" />
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 pt-4">
            <GastosMensualesChart movimientos={movimientos} />
          </CardContent>
        </Card>
      </div>

      {/* Saldo por tarjeta */}
      <div>
        <SectionTitle icon={CreditCard} title="Saldo por tarjeta" iconColor="text-blue-500" />
        {saldos.length === 0 ? (
          <p className="text-sm text-slate-400">No hay tarjetas activas</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {saldos.map(t => {
              const enAlerta = t.umbral_alerta != null && t.saldo < t.umbral_alerta;
              const pct = t.umbral_alerta ? Math.min(100, Math.max(0, (t.saldo / (t.umbral_alerta * 3)) * 100)) : null;
              return (
                <Card key={t.id} className={`border-0 shadow-sm ${enAlerta ? 'ring-1 ring-amber-300 bg-amber-50/30' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">{t.alias || t.id_tarjeta}</p>
                        <p className="text-[11px] text-slate-400 truncate">{t.id_tarjeta}</p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ml-2 ${enAlerta ? 'border-amber-300 text-amber-600' : ''}`}>
                        {t.moneda}
                      </Badge>
                    </div>
                    <p className={`text-2xl font-bold ${t.saldo < 0 ? 'text-red-600' : enAlerta ? 'text-amber-600' : 'text-slate-800'}`}>
                      {formatMonto(t.saldo)}
                    </p>
                    {t.umbral_alerta != null && (
                      <div className="mt-2">
                        <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${enAlerta ? 'bg-amber-400' : 'bg-sky-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Umbral: {formatMonto(t.umbral_alerta)}</p>
                      </div>
                    )}
                    {enAlerta && (
                      <div className="flex items-center gap-1 mt-2">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        <span className="text-[11px] text-amber-600 font-medium">Saldo por debajo del umbral</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Stock en reserva (tanques) */}
      {hayStockReserva && (
        <div>
          <SectionTitle icon={ArrowLeftRight} title="Stock en reserva (tanques)" iconColor="text-purple-500" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(stockReserva).map(([nombre, litros]) => (
              <Card key={nombre} className={`border-0 shadow-sm ${litros < 0 ? 'ring-1 ring-red-200 bg-red-50/30' : ''}`}>
                <CardContent className="p-4">
                  <p className="text-xs text-slate-500 font-medium truncate">{nombre}</p>
                  <p className={`text-2xl font-bold mt-1 ${litros < 0 ? 'text-red-600' : 'text-purple-700'}`}>
                    {litros.toFixed(1)} <span className="text-sm font-normal">L</span>
                  </p>
                  {litros < 0 && (
                    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Stock negativo
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Consumidores por tipo */}
      <div>
        <SectionTitle icon={Users} title="Estado de consumidores" iconColor="text-slate-500" />
        <ConsumidoresPorTipo
          consumidores={consumidores}
          tiposConsumidor={tiposConsumidor}
          movimientos={movimientos}
        />
        <Link to={createPageUrl('Movimientos')} className="text-xs text-sky-600 hover:underline mt-3 inline-block">
          Ver todos los movimientos →
        </Link>
      </div>
    </div>
  );
}