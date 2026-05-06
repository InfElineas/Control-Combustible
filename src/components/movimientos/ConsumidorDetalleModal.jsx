import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Fuel, Gauge, User, Truck, Package } from 'lucide-react';

function Row({ label, value }) {
  if (value == null || value === '' || value === false) return null;
  return (
    <div className="flex justify-between items-start py-2 border-b border-slate-100 last:border-0 gap-4">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className="text-sm text-slate-800 font-medium text-right">{String(value)}</span>
    </div>
  );
}

export default function ConsumidorDetalleModal({ consumidorId, todosMovimientos, onClose }) {
  const { data: consumidores = [] } = useQuery({ queryKey: ['consumidores'], queryFn: () => base44.entities.Consumidor.list() });

  const consumidor = consumidores.find(c => c.id === consumidorId);

  const stats = useMemo(() => {
    if (!consumidorId || !todosMovimientos) return null;
    const compras = todosMovimientos.filter(m => m.tipo === 'COMPRA' && m.consumidor_id === consumidorId);
    const despachosRecibidos = todosMovimientos.filter(m => m.tipo === 'DESPACHO' && m.consumidor_id === consumidorId);
    const despachosDespachados = todosMovimientos.filter(m => m.tipo === 'DESPACHO' && m.consumidor_origen_id === consumidorId);
    const abastecimientos = [...compras, ...despachosRecibidos];
    const totalLitros = abastecimientos.reduce((s, m) => s + (m.litros || 0), 0);
    const totalGasto = compras.reduce((s, m) => s + (m.monto || 0), 0);
    const ultimoCarga = [...abastecimientos].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))[0];
    const conConsumo = abastecimientos.filter(m => m.consumo_real != null);
    const consumoPromedio = conConsumo.length > 0
      ? conConsumo.reduce((s, m) => s + m.consumo_real, 0) / conConsumo.length
      : null;
    return { totalLitros, totalGasto, ultimoCarga, consumoPromedio, totalCompras: compras.length, totalDespachos: despachosRecibidos.length + despachosDespachados.length };
  }, [consumidorId, todosMovimientos]);

  if (!consumidor) return null;

  const dv = consumidor.datos_vehiculo;
  const dt = consumidor.datos_tanque;
  const de = consumidor.datos_equipo;

  const hasVehicleData = dv && (dv.marca || dv.modelo || dv.anio || dv.capacidad_tanque || dv.indice_consumo_fabricante || dv.indice_consumo_real || dv.estado_vehiculo || dv.umbral_alerta_pct != null || dv.umbral_critico_pct != null);
  const hasTankData    = dt && (dt.capacidad_litros || dt.ubicacion || dt.stock_minimo);
  const hasEquipData   = de && (de.categoria || de.marca || de.modelo || de.unidad_medida_consumo || de.indice_consumo_referencia);

  return (
    <Dialog open={!!consumidorId} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Truck className="w-4 h-4 text-sky-500" />
            {consumidor.nombre}
            {consumidor.activo
              ? <Badge className="ml-auto bg-emerald-50 text-emerald-700 border-emerald-200 border text-[10px]">Activo</Badge>
              : <Badge className="ml-auto bg-slate-100 text-slate-500 text-[10px]">Inactivo</Badge>
            }
          </DialogTitle>
        </DialogHeader>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 mt-1">
            <div className="bg-orange-50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-orange-500 font-semibold uppercase">Litros totales</p>
              <p className="text-sm font-bold text-orange-700">{stats.totalLitros.toFixed(1)} L</p>
            </div>
            <div className="bg-sky-50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-sky-500 font-semibold uppercase">Cargas</p>
              <p className="text-sm font-bold text-sky-700">{stats.totalCompras}</p>
            </div>
            {stats.consumoPromedio != null && (
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">km/L prom.</p>
                <p className="text-sm font-bold text-slate-700">{stats.consumoPromedio.toFixed(2)}</p>
              </div>
            )}
          </div>
        )}

        {/* Info general */}
        <div className="mt-3">
          <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1 flex items-center gap-1">
            <User className="w-3 h-3" /> General
          </p>
          <Row label="Tipo" value={consumidor.tipo_consumidor_nombre} />
          <Row label="Código interno" value={consumidor.codigo_interno} />
          <Row label="Combustible" value={consumidor.combustible_nombre} />
          <Row label="Responsable" value={consumidor.responsable} />
          <Row label="Conductor" value={consumidor.conductor} />
          <Row label="Función" value={consumidor.funcion} />
          <Row label="Observaciones" value={consumidor.observaciones} />
        </div>

        {/* Datos vehículo */}
        {hasVehicleData && (
          <div className="mt-3">
            <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1 flex items-center gap-1">
              <Truck className="w-3 h-3" /> Datos del vehículo
            </p>
            <Row label="Marca / Modelo" value={dv.marca && dv.modelo ? `${dv.marca} ${dv.modelo}` : dv.marca || dv.modelo} />
            <Row label="Año" value={dv.anio} />
            <Row label="Capacidad tanque" value={dv.capacidad_tanque ? `${dv.capacidad_tanque} L` : null} />
            <Row label="Consumo fabricante" value={dv.indice_consumo_fabricante ? `${dv.indice_consumo_fabricante} km/L` : null} />
            <Row label="Consumo real" value={dv.indice_consumo_real ? `${dv.indice_consumo_real} km/L` : null} />
            <Row label="Estado" value={dv.estado_vehiculo} />
            <Row label="Umbral alerta" value={dv.umbral_alerta_pct != null ? `${dv.umbral_alerta_pct}%` : null} />
            <Row label="Umbral crítico" value={dv.umbral_critico_pct != null ? `${dv.umbral_critico_pct}%` : null} />
          </div>
        )}

        {/* Datos tanque */}
        {hasTankData && (
          <div className="mt-3">
            <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1 flex items-center gap-1">
              <Package className="w-3 h-3" /> Datos del tanque
            </p>
            <Row label="Capacidad" value={dt.capacidad_litros ? `${dt.capacidad_litros} L` : null} />
            <Row label="Ubicación" value={dt.ubicacion} />
            <Row label="Stock mínimo" value={dt.stock_minimo ? `${dt.stock_minimo} L` : null} />
          </div>
        )}

        {/* Datos equipo */}
        {hasEquipData && (
          <div className="mt-3">
            <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1 flex items-center gap-1">
              <Fuel className="w-3 h-3" /> Datos del equipo
            </p>
            <Row label="Categoría" value={de.categoria} />
            <Row label="Marca / Modelo" value={de.marca && de.modelo ? `${de.marca} ${de.modelo}` : de.marca || de.modelo} />
            <Row label="Unidad consumo" value={de.unidad_medida_consumo} />
            <Row label="Consumo referencia" value={de.indice_consumo_referencia} />
          </div>
        )}

        {/* Último movimiento */}
        {stats?.ultimoCarga && (
          <div className="mt-3 bg-slate-50 rounded-lg p-3">
            <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1 flex items-center gap-1">
              <Gauge className="w-3 h-3" /> Última carga
            </p>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Fecha: <b>{stats.ultimoCarga.fecha}</b></span>
              {stats.ultimoCarga.odometro != null && <span>Odóm: <b>{stats.ultimoCarga.odometro.toLocaleString()} km</b></span>}
              {stats.ultimoCarga.litros != null && <span><b>{Number(stats.ultimoCarga.litros).toFixed(1)} L</b></span>}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}