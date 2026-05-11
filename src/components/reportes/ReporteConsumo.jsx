import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { formatMonto } from '@/components/ui-helpers/SaldoUtils';
import ExportButton from '@/components/ui-helpers/ExportButton';

// Calcula el estado de alerta comparando consumo real vs referencia
function getAlertaStatus(consumoReal, consumoRef, umbralAlerta, umbralCritico) {
  if (!consumoReal || !consumoRef) return null;
  // consumo en km/L: menor = peor rendimiento
  const desviacionPct = ((consumoRef - consumoReal) / consumoRef) * 100;
  const umbC = umbralCritico ?? 30;
  const umbA = umbralAlerta ?? 15;
  if (desviacionPct >= umbC) return 'critico';
  if (desviacionPct >= umbA) return 'alerta';
  return 'normal';
}

const STATUS_CONFIG = {
  normal:  { label: 'Normal',   bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: TrendingUp },
  alerta:  { label: 'Alerta',   bg: 'bg-amber-50 text-amber-700 border-amber-200',       icon: AlertTriangle },
  critico: { label: 'Crítico',  bg: 'bg-red-50 text-red-700 border-red-200',             icon: AlertTriangle },
};

export default function ReporteConsumo({ consumidores, movimientos }) {
  const reporte = useMemo(() => {
    return consumidores
      .filter(c => c.activo)
      .map(c => {
        const movsAbast  = movimientos.filter(m => (m.tipo === 'COMPRA' || m.tipo === 'DESPACHO') && m.consumidor_id === c.id);
        const movsCompra = movimientos.filter(m => m.tipo === 'COMPRA' && m.consumidor_id === c.id);
        const litrosTotal = movsAbast.reduce((s, m) => s + (m.litros || 0), 0);
        const montoTotal  = movsCompra.reduce((s, m) => s + (m.monto  || 0), 0);
        const cargas = movsAbast.length;

        // Consumo real: computed from odometer sequence (not stale DB consumo_real field)
        const movsConOdo = movimientos
          .filter(m => (m.tipo === 'COMPRA' || m.tipo === 'DESPACHO') && m.consumidor_id === c.id && m.odometro != null)
          .sort((a, b) => (a.odometro || 0) - (b.odometro || 0));

        const kmlFills = movsConOdo
          .map((fill, idx) => {
            if (idx === 0) return null;
            const prev = movsConOdo[idx - 1];
            const km  = (fill.odometro || 0) - (prev.odometro || 0);
            const lit = fill.litros || 0;
            return (km > 0 && lit > 0) ? km / lit : null;
          })
          .filter(v => v !== null);

        const consumoUltimo  = kmlFills.length > 0 ? kmlFills[kmlFills.length - 1] : null;
        const consumoPromedio = kmlFills.length > 0
          ? kmlFills.reduce((s, v) => s + v, 0) / kmlFills.length
          : null;

        // Índice de referencia del vehículo
        const consumoRef = c.datos_vehiculo?.indice_consumo_real || c.datos_vehiculo?.indice_consumo_fabricante || null;
        const umbralAlerta = c.datos_vehiculo?.umbral_alerta_pct ?? 15;
        const umbralCritico = c.datos_vehiculo?.umbral_critico_pct ?? 30;

        const estadoUltimo = getAlertaStatus(consumoUltimo, consumoRef, umbralAlerta, umbralCritico);
        const estadoPromedio = getAlertaStatus(consumoPromedio, consumoRef, umbralAlerta, umbralCritico);

        // Historial de odómetro (últimas 5 cargas, más recientes primero)
        const movsConOdoDesc = [...movsConOdo].sort((a, b) => b.fecha.localeCompare(a.fecha));
        const historial = movsConOdoDesc.slice(0, 5).map((m, i) => {
          const idxAsc = movsConOdo.findIndex(x => x.id === m.id);
          const kml = idxAsc > 0
            ? (() => {
                const prev = movsConOdo[idxAsc - 1];
                const km  = (m.odometro || 0) - (prev.odometro || 0);
                const lit = m.litros || 0;
                return (km > 0 && lit > 0) ? km / lit : null;
              })()
            : null;
          return { fecha: m.fecha, odometro: m.odometro, km: m.km_recorridos, litros: m.litros, consumo: kml };
        });

        return {
          id: c.id,
          nombre: c.nombre,
          codigo_interno: c.codigo_interno || '',
          tipo: c.tipo_consumidor_nombre || '',
          litros: litrosTotal,
          monto: montoTotal,
          cargas,
          consumoUltimo,
          consumoPromedio,
          consumoRef,
          estadoUltimo,
          estadoPromedio,
          historial,
          tieneOdometro: movsConOdo.length > 0,
        };
      })
      .filter(r => r.cargas > 0);
  }, [consumidores, movimientos]);

  const csvConsumo = [
    { label: 'Consumidor', accessor: 'nombre' },
    { label: 'Código', accessor: 'codigo_interno' },
    { label: 'Tipo', accessor: 'tipo' },
    { label: 'Cargas', accessor: 'cargas' },
    { label: 'Litros', accessor: r => r.litros.toFixed(2) },
    { label: 'Monto', accessor: r => formatMonto(r.monto) },
    { label: 'Consumo Ref (km/L)', accessor: r => r.consumoRef?.toFixed(2) || '—' },
    { label: 'Consumo Prom (km/L)', accessor: r => r.consumoPromedio?.toFixed(2) || '—' },
    { label: 'Consumo Último (km/L)', accessor: r => r.consumoUltimo?.toFixed(2) || '—' },
    { label: 'Estado', accessor: r => r.estadoUltimo || '—' },
  ];

  if (reporte.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-12 text-center text-slate-400 text-sm">
          No hay datos de consumo registrados aún.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen de alertas */}
      {reporte.some(r => r.estadoUltimo === 'critico' || r.estadoUltimo === 'alerta') && (
        <div className="space-y-2">
          {reporte.filter(r => r.estadoUltimo === 'critico').map(r => (
            <div key={r.id} className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="font-semibold text-red-700">{r.nombre}</span>
              <span className="text-red-600">consumo crítico: {r.consumoUltimo?.toFixed(2)} km/L vs {r.consumoRef?.toFixed(2)} km/L ref.</span>
            </div>
          ))}
          {reporte.filter(r => r.estadoUltimo === 'alerta').map(r => (
            <div key={r.id} className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold text-amber-700">{r.nombre}</span>
              <span className="text-amber-600">consumo en alerta: {r.consumoUltimo?.toFixed(2)} km/L vs {r.consumoRef?.toFixed(2)} km/L ref.</span>
            </div>
          ))}
        </div>
      )}

      {/* Tabla principal */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-700">Consumo por Consumidor</CardTitle>
          <ExportButton data={reporte} columns={csvConsumo} filename="reporte_consumo" title="Reporte de Consumo" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="text-xs">Consumidor</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Tipo</TableHead>
                  <TableHead className="text-xs text-right">Litros</TableHead>
                  <TableHead className="text-xs text-right hidden sm:table-cell">Monto</TableHead>
                  <TableHead className="text-xs text-right">Ref (km/L)</TableHead>
                  <TableHead className="text-xs text-right">Prom (km/L)</TableHead>
                  <TableHead className="text-xs text-right">Último (km/L)</TableHead>
                  <TableHead className="text-xs">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reporte.map(r => {
                  const statusCfg = r.estadoUltimo ? STATUS_CONFIG[r.estadoUltimo] : null;
                  const StatusIcon = statusCfg?.icon;
                  return (
                    <TableRow key={r.id} className={r.estadoUltimo === 'critico' ? 'bg-red-50/30' : r.estadoUltimo === 'alerta' ? 'bg-amber-50/30' : ''}>
                      <TableCell>
                        <div className="font-medium text-sm">{r.nombre}</div>
                        {r.codigo_interno && <div className="text-xs text-slate-400">{r.codigo_interno}</div>}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 hidden md:table-cell">{r.tipo || '—'}</TableCell>
                      <TableCell className="text-right text-sm">{r.litros.toFixed(1)} L</TableCell>
                      <TableCell className="text-right text-sm hidden sm:table-cell">{formatMonto(r.monto)}</TableCell>
                      <TableCell className="text-right text-sm text-slate-400">{r.consumoRef?.toFixed(2) ?? '—'}</TableCell>
                      <TableCell className="text-right text-sm">
                        {r.consumoPromedio != null ? (
                          <span className={r.estadoPromedio === 'critico' ? 'text-red-600 font-semibold' : r.estadoPromedio === 'alerta' ? 'text-amber-600 font-semibold' : 'text-slate-700'}>
                            {r.consumoPromedio.toFixed(2)}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {r.consumoUltimo != null ? (
                          <span className={r.estadoUltimo === 'critico' ? 'text-red-600 font-bold' : r.estadoUltimo === 'alerta' ? 'text-amber-600 font-bold' : 'text-emerald-700 font-semibold'}>
                            {r.consumoUltimo.toFixed(2)}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {statusCfg ? (
                          <Badge variant="outline" className={`text-[10px] gap-1 ${statusCfg.bg}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusCfg.label}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-300">Sin datos</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}