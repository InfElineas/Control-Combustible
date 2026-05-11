import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Plus, Navigation, BookOpen, BarChart3,
  Pencil, Trash2, Car, User2, ArrowRight, AlertTriangle,
  CheckCircle2, Clock, XCircle, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useUserRole } from '@/components/ui-helpers/useUserRole';
import ConfirmDialog from '@/components/ui-helpers/ConfirmDialog';

const hoy = () => new Date().toISOString().slice(0, 10);

const ESTADO_CFG = {
  completada: { label: 'Completada', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
  pendiente:  { label: 'Pendiente',  cls: 'bg-amber-50 text-amber-700 border-amber-200',      Icon: Clock        },
  cancelada:  { label: 'Cancelada',  cls: 'bg-red-50 text-red-700 border-red-200',            Icon: XCircle      },
};

const TIPO_VIAJE_CFG = {
  regular:          { label: 'Regular',          cls: 'bg-sky-50 text-sky-700 border-sky-200'          },
  carga_mercancias: { label: 'Carga mercancías', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  mensajeria:       { label: 'Mensajería',       cls: 'bg-amber-50 text-amber-700 border-amber-200'    },
  viaje_extra:      { label: 'Viaje extra',      cls: 'bg-orange-50 text-orange-700 border-orange-200' },
};

function getTipoViaje(asig) {
  return asig.tipo_viaje || (asig.ruta_id ? 'regular' : 'viaje_extra');
}

const FRECUENCIA_OPTS = ['Diario', 'Según Planificación', 'Semanal', 'Mensual'];

function esNoVehiculo(c) {
  const n = (c.tipo_consumidor_nombre || '').toLowerCase();
  return n.includes('tanque') || n.includes('reserva') || n.includes('almac') ||
         n.includes('equipo') || n.includes('planta') || n.includes('generador') || n.includes('grupo');
}

// ── Diálogo: novedad de una ruta regular (sustitución / cancelación / incidencia) ──

function DialogNovedad({ ruta, novedad, consumidores, conductores, onClose, onSave }) {
  const vehiculos = consumidores.filter(c => c.activo && !esNoVehiculo(c));
  const [form, setForm] = useState(() => {
    const vehId = novedad?.consumidor_id || ruta.consumidor_id || '';
    const veh   = consumidores.find(x => x.id === vehId);
    return {
      consumidor_id:     vehId,
      consumidor_nombre: novedad?.consumidor_nombre || ruta.consumidor_nombre || '',
      conductor_id:      novedad?.conductor_id      || veh?.conductor_id || ruta.conductor_id || '',
      conductor_nombre:  novedad?.conductor_nombre  || veh?.conductor    || ruta.conductor_nombre || '',
      ayudante_id:       novedad?.ayudante_id       || veh?.ayudante_id  || '',
      ayudante_nombre:   novedad?.ayudante_nombre   || veh?.ayudante     || '',
      inclConductor:     !!(novedad?.conductor_id   || veh?.conductor_id || ruta.conductor_id),
      inclAyudante:      !!(novedad?.ayudante_id    || veh?.ayudante_id),
      km_reales:         novedad?.km_reales         ?? '',
      observaciones:     novedad?.observaciones     || '',
      estado:            novedad?.estado            || 'completada',
    };
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const esSustitucion = form.consumidor_id && ruta.consumidor_id &&
                        form.consumidor_id !== ruta.consumidor_id;

  const handleSave = () => {
    if (form.estado !== 'cancelada' && !form.consumidor_id) {
      toast.error('Selecciona un vehículo'); return;
    }
    onSave({
      consumidor_id:     form.estado !== 'cancelada' ? form.consumidor_id     : (ruta.consumidor_id     || null),
      consumidor_nombre: form.estado !== 'cancelada' ? form.consumidor_nombre : (ruta.consumidor_nombre || null),
      conductor_id:      form.inclConductor ? (form.conductor_id    || null) : null,
      conductor_nombre:  form.inclConductor ? (form.conductor_nombre || null) : null,
      ayudante_id:       form.inclAyudante  ? (form.ayudante_id     || null) : null,
      ayudante_nombre:   form.inclAyudante  ? (form.ayudante_nombre || null) : null,
      km_reales:         form.km_reales !== '' ? Number(form.km_reales) : null,
      observaciones:     form.observaciones.trim() || null,
      estado:            form.estado,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Navigation className="w-4 h-4 text-sky-500" />
            Novedad — {ruta.nombre}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          {/* Info de la ruta */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 text-xs text-slate-500 space-y-0.5">
            {(ruta.punto_inicio || ruta.punto_fin) && (
              <p className="font-medium text-slate-600 dark:text-slate-300">
                {[ruta.punto_inicio, ruta.punto_fin].filter(Boolean).join(' → ')}
              </p>
            )}
            <div className="flex gap-3 flex-wrap">
              {ruta.distancia_km  && <span className="text-sky-600 font-medium">{ruta.distancia_km} km ref.</span>}
              {ruta.frecuencia    && <span>{ruta.frecuencia}</span>}
              {ruta.municipio     && <span>{ruta.municipio}</span>}
            </div>
          </div>

          {/* Estado */}
          <div>
            <Label className="text-xs text-slate-500">Estado de la ruta hoy *</Label>
            <Select value={form.estado} onValueChange={v => set('estado', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ESTADO_CFG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vehículo (solo si no cancelada) */}
          {form.estado !== 'cancelada' && (
            <div>
              <Label className="text-xs text-slate-500">Vehículo del día</Label>
              {ruta.consumidor_id && (
                <p className="text-[10px] text-slate-400 mt-0.5 mb-1">
                  Habitual: <span className="font-medium">{ruta.consumidor_nombre || ruta.consumidor_id}</span>
                </p>
              )}
              <Select
                value={form.consumidor_id || '_none'}
                onValueChange={v => {
                  if (v === '_none') {
                    setForm(p => ({ ...p, consumidor_id: '', consumidor_nombre: '', conductor_id: '', conductor_nombre: '', ayudante_id: '', ayudante_nombre: '', inclConductor: false, inclAyudante: false }));
                    return;
                  }
                  const veh = consumidores.find(x => x.id === v);
                  setForm(p => ({
                    ...p,
                    consumidor_id:     v,
                    consumidor_nombre: veh?.nombre        || '',
                    conductor_id:      veh?.conductor_id  || '',
                    conductor_nombre:  veh?.conductor     || '',
                    ayudante_id:       veh?.ayudante_id   || '',
                    ayudante_nombre:   veh?.ayudante      || '',
                    inclConductor:     !!veh?.conductor_id,
                    inclAyudante:      !!veh?.ayudante_id,
                  }));
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={ruta.consumidor_id ? 'Mismo que habitual...' : 'Seleccionar vehículo...'} />
                </SelectTrigger>
                <SelectContent>
                  {ruta.consumidor_id && (
                    <SelectItem value={ruta.consumidor_id}>
                      ✓ {ruta.consumidor_nombre || ruta.consumidor_id} (habitual)
                    </SelectItem>
                  )}
                  {vehiculos.filter(c => c.id !== ruta.consumidor_id).map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}{c.codigo_interno ? ` · ${c.codigo_interno}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {esSustitucion && (
                <div className="mt-1.5 flex items-center gap-1.5 text-amber-700 text-xs bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg px-2 py-1.5">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  Sustitución: {ruta.consumidor_nombre} → {form.consumidor_nombre}
                </div>
              )}
            </div>
          )}

          {/* Conductores del viaje */}
          <div className="space-y-2">
            <Label className="text-xs text-slate-500">Conductores del viaje</Label>
            <div className="border border-slate-100 rounded-lg p-2.5 space-y-2.5 bg-slate-50/50">
              {/* Conductor principal */}
              <div className="flex items-center gap-2">
                <Checkbox id="nv-incl-conductor" checked={form.inclConductor} onCheckedChange={v => set('inclConductor', v)} />
                <Label htmlFor="nv-incl-conductor" className="text-[11px] text-slate-500 w-20 shrink-0 cursor-pointer">Conductor</Label>
                <Select
                  value={form.conductor_id || '_none'}
                  onValueChange={v => {
                    if (v === '_none') { set('conductor_id', ''); set('conductor_nombre', ''); return; }
                    const c = conductores.find(x => x.id === v);
                    set('conductor_id', v); set('conductor_nombre', c?.nombre || ''); set('inclConductor', true);
                  }}
                >
                  <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin conductor</SelectItem>
                    {conductores.filter(c => c.activo !== false).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Ayudante */}
              <div className="flex items-center gap-2">
                <Checkbox id="nv-incl-ayudante" checked={form.inclAyudante} onCheckedChange={v => set('inclAyudante', v)} />
                <Label htmlFor="nv-incl-ayudante" className="text-[11px] text-slate-500 w-20 shrink-0 cursor-pointer">Ayudante</Label>
                <Select
                  value={form.ayudante_id || '_none'}
                  onValueChange={v => {
                    if (v === '_none') { set('ayudante_id', ''); set('ayudante_nombre', ''); return; }
                    const c = conductores.find(x => x.id === v);
                    set('ayudante_id', v); set('ayudante_nombre', c?.nombre || ''); set('inclAyudante', true);
                  }}
                >
                  <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin ayudante</SelectItem>
                    {conductores.filter(c => c.activo !== false && c.id !== form.conductor_id).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Km + Observaciones */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Km reales <span className="text-slate-300">(opcional)</span></Label>
              <Input
                type="number" step="0.1" min="0"
                value={form.km_reales}
                onChange={e => set('km_reales', e.target.value)}
                placeholder={ruta.distancia_km ? `Ref: ${ruta.distancia_km}` : 'Ej: 17.5'}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500">
                {form.estado === 'cancelada' || esSustitucion ? 'Motivo' : 'Observaciones'}
              </Label>
              <Input
                value={form.observaciones}
                onChange={e => set('observaciones', e.target.value)}
                placeholder={
                  form.estado === 'cancelada' ? 'Ej: Falla mecánica'
                  : esSustitucion ? 'Ej: Vehículo en taller'
                  : 'Notas...'
                }
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button size="sm" className="bg-sky-600 hover:bg-sky-700" onClick={handleSave}>
              {novedad ? 'Guardar cambios' : 'Registrar novedad'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Diálogo: viaje extra (no regular) ───────────────────────────────────────

const EMPTY_ASIG = {
  fecha: hoy(), tipo_viaje: 'viaje_extra',
  descripcion_emergencia: '',
  consumidor_id: '', consumidor_nombre: '',
  conductor_id: '', conductor_nombre: '',
  ayudante_id: '', ayudante_nombre: '',
  inclConductor: false, inclAyudante: false,
  km_reales: '', observaciones: '', estado: 'completada',
};

function DialogAsignacion({ asignacion, consumidores, conductores, onClose, onSave }) {
  const [form, setForm] = useState(() => asignacion ? {
    fecha:                  asignacion.fecha || hoy(),
    tipo_viaje:             getTipoViaje(asignacion) === 'regular' ? 'viaje_extra' : getTipoViaje(asignacion),
    descripcion_emergencia: asignacion.descripcion_emergencia || '',
    consumidor_id:          asignacion.consumidor_id || '',
    consumidor_nombre:      asignacion.consumidor_nombre || '',
    conductor_id:           asignacion.conductor_id || '',
    conductor_nombre:       asignacion.conductor_nombre || '',
    ayudante_id:            asignacion.ayudante_id || '',
    ayudante_nombre:        asignacion.ayudante_nombre || '',
    inclConductor:          !!asignacion.conductor_id,
    inclAyudante:           !!asignacion.ayudante_id,
    km_reales:              asignacion.km_reales ?? '',
    observaciones:          asignacion.observaciones || '',
    estado:                 asignacion.estado || 'completada',
  } : EMPTY_ASIG);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const vehiculos = consumidores.filter(c => c.activo && !esNoVehiculo(c));

  const handleSave = () => {
    if (!form.consumidor_id)                         { toast.error('Selecciona un vehículo'); return; }
    if (!form.descripcion_emergencia.trim())          { toast.error('Describe el destino o motivo'); return; }
    onSave({
      fecha:                  form.fecha,
      tipo_viaje:             form.tipo_viaje,
      ruta_id:                null,
      descripcion_emergencia: form.descripcion_emergencia.trim(),
      consumidor_id:          form.consumidor_id,
      consumidor_nombre:      form.consumidor_nombre,
      conductor_id:           form.inclConductor ? (form.conductor_id    || null) : null,
      conductor_nombre:       form.inclConductor ? (form.conductor_nombre || null) : null,
      ayudante_id:            form.inclAyudante  ? (form.ayudante_id     || null) : null,
      ayudante_nombre:        form.inclAyudante  ? (form.ayudante_nombre || null) : null,
      km_reales:              form.km_reales !== '' ? Number(form.km_reales) : null,
      observaciones:          form.observaciones.trim() || null,
      estado:                 form.estado,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Navigation className="w-4 h-4 text-orange-500" />
            {asignacion ? 'Editar viaje extra' : 'Registrar viaje extra'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Fecha</Label>
              <Input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Estado</Label>
              <Select value={form.estado} onValueChange={v => set('estado', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ESTADO_CFG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs text-slate-500">Tipo *</Label>
            <Select value={form.tipo_viaje} onValueChange={v => set('tipo_viaje', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_VIAJE_CFG).filter(([k]) => k !== 'regular').map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-slate-500">Destino / Motivo *</Label>
            <Input
              value={form.descripcion_emergencia}
              onChange={e => set('descripcion_emergencia', e.target.value)}
              placeholder={
                form.tipo_viaje === 'carga_mercancias' ? 'Ej: Entrega mercancía almacén norte' :
                form.tipo_viaje === 'mensajeria'       ? 'Ej: Documentos sede central' :
                'Ej: Traslado imprevisto'
              }
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs text-slate-500">Vehículo *</Label>
            <Select value={form.consumidor_id} onValueChange={v => {
              const veh = consumidores.find(x => x.id === v);
              setForm(p => ({
                ...p,
                consumidor_id:     v,
                consumidor_nombre: veh?.nombre       || '',
                conductor_id:      veh?.conductor_id || '',
                conductor_nombre:  veh?.conductor    || '',
                ayudante_id:       veh?.ayudante_id  || '',
                ayudante_nombre:   veh?.ayudante     || '',
                inclConductor:     !!veh?.conductor_id,
                inclAyudante:      !!veh?.ayudante_id,
              }));
            }}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar vehículo..." /></SelectTrigger>
              <SelectContent>
                {vehiculos.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}{c.codigo_interno ? ` · ${c.codigo_interno}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Conductores del viaje */}
          <div className="space-y-2">
            <Label className="text-xs text-slate-500">Conductores del viaje</Label>
            <div className="border border-slate-100 rounded-lg p-2.5 space-y-2.5 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Checkbox id="ea-incl-conductor" checked={form.inclConductor} onCheckedChange={v => set('inclConductor', v)} />
                <Label htmlFor="ea-incl-conductor" className="text-[11px] text-slate-500 w-20 shrink-0 cursor-pointer">Conductor</Label>
                <Select
                  value={form.conductor_id || '_none'}
                  onValueChange={v => {
                    if (v === '_none') { set('conductor_id', ''); set('conductor_nombre', ''); return; }
                    const c = conductores.find(x => x.id === v);
                    set('conductor_id', v); set('conductor_nombre', c?.nombre || ''); set('inclConductor', true);
                  }}
                >
                  <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin conductor</SelectItem>
                    {conductores.filter(c => c.activo !== false).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="ea-incl-ayudante" checked={form.inclAyudante} onCheckedChange={v => set('inclAyudante', v)} />
                <Label htmlFor="ea-incl-ayudante" className="text-[11px] text-slate-500 w-20 shrink-0 cursor-pointer">Ayudante</Label>
                <Select
                  value={form.ayudante_id || '_none'}
                  onValueChange={v => {
                    if (v === '_none') { set('ayudante_id', ''); set('ayudante_nombre', ''); return; }
                    const c = conductores.find(x => x.id === v);
                    set('ayudante_id', v); set('ayudante_nombre', c?.nombre || ''); set('inclAyudante', true);
                  }}
                >
                  <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin ayudante</SelectItem>
                    {conductores.filter(c => c.activo !== false && c.id !== form.conductor_id).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Km reales <span className="text-slate-300">(opcional)</span></Label>
              <Input
                type="number" step="0.1" min="0"
                value={form.km_reales}
                onChange={e => set('km_reales', e.target.value)}
                placeholder="Ej: 17.5"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Observaciones</Label>
              <Input
                value={form.observaciones}
                onChange={e => set('observaciones', e.target.value)}
                placeholder="Notas..."
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={handleSave}>
              {asignacion ? 'Guardar cambios' : 'Registrar viaje extra'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Diálogo: crear / editar ruta del catálogo ────────────────────────────────

const EMPTY_RUTA = {
  nombre: '', punto_inicio: '', punto_fin: '', municipio: '',
  distancia_km: '', tiempo_estimado: '', frecuencia: 'Diario', activa: true,
  consumidor_id: '', consumidor_nombre: '',
  conductor_id: '', conductor_nombre: '',
};

function DialogRuta({ ruta, consumidores, conductores, onClose, onSave }) {
  const vehiculos = consumidores.filter(c => c.activo && !esNoVehiculo(c));
  const [form, setForm] = useState(() => ruta ? {
    nombre:            ruta.nombre           || '',
    punto_inicio:      ruta.punto_inicio     || '',
    punto_fin:         ruta.punto_fin        || '',
    municipio:         ruta.municipio        || '',
    distancia_km:      ruta.distancia_km     ?? '',
    tiempo_estimado:   ruta.tiempo_estimado  || '',
    frecuencia:        ruta.frecuencia       || 'Diario',
    activa:            ruta.activa           ?? true,
    consumidor_id:     ruta.consumidor_id    || '',
    consumidor_nombre: ruta.consumidor_nombre || '',
    conductor_id:      ruta.conductor_id     || '',
    conductor_nombre:  ruta.conductor_nombre  || '',
  } : EMPTY_RUTA);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{ruta ? 'Editar ruta' : 'Nueva ruta'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs text-slate-500">Nombre *</Label>
              <Input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="CD Polígono" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Frecuencia</Label>
              <Select value={form.frecuencia} onValueChange={v => set('frecuencia', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FRECUENCIA_OPTS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Municipio</Label>
              <Input value={form.municipio} onChange={e => set('municipio', e.target.value)} placeholder="Arroyo Naranjo" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Punto de inicio</Label>
              <Input value={form.punto_inicio} onChange={e => set('punto_inicio', e.target.value)} placeholder="Cerro" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Punto de fin</Label>
              <Input value={form.punto_fin} onChange={e => set('punto_fin', e.target.value)} placeholder="Polígono" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Distancia (km)</Label>
              <Input type="number" step="0.1" min="0" value={form.distancia_km} onChange={e => set('distancia_km', e.target.value)} placeholder="17" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Tiempo estimado</Label>
              <Input value={form.tiempo_estimado} onChange={e => set('tiempo_estimado', e.target.value)} placeholder="25 min" className="mt-1" />
            </div>
          </div>

          {/* Asignación habitual */}
          <div className="border-t border-slate-100 dark:border-slate-700 pt-3 space-y-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Asignación habitual</p>
            <div>
              <Label className="text-xs text-slate-500">Vehículo habitual</Label>
              <Select
                value={form.consumidor_id || '_none'}
                onValueChange={v => {
                  if (v === '_none') { set('consumidor_id', ''); set('consumidor_nombre', ''); return; }
                  const c = consumidores.find(x => x.id === v);
                  set('consumidor_id', v);
                  set('consumidor_nombre', c?.nombre || '');
                }}
              >
                <SelectTrigger className="mt-1"><SelectValue placeholder="Sin vehículo habitual" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sin vehículo habitual</SelectItem>
                  {vehiculos.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}{c.codigo_interno ? ` · ${c.codigo_interno}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Conductor habitual <span className="text-slate-300">(opcional)</span></Label>
              <Select
                value={form.conductor_id || '_none'}
                onValueChange={v => {
                  if (v === '_none') { set('conductor_id', ''); set('conductor_nombre', ''); return; }
                  const c = conductores.find(x => x.id === v);
                  set('conductor_id', v);
                  set('conductor_nombre', c?.nombre || '');
                }}
              >
                <SelectTrigger className="mt-1"><SelectValue placeholder="Sin conductor habitual" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sin conductor</SelectItem>
                  {conductores.filter(c => c.activo !== false).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3 py-2">
            <Label className="text-sm">Ruta activa</Label>
            <Switch checked={form.activa} onCheckedChange={v => set('activa', v)} />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button
              size="sm" className="bg-sky-600 hover:bg-sky-700"
              onClick={() => {
                if (!form.nombre.trim()) { toast.error('El nombre es requerido'); return; }
                onSave({
                  ...form,
                  distancia_km:  form.distancia_km !== '' ? Number(form.distancia_km) : null,
                  consumidor_id: form.consumidor_id || null,
                  conductor_id:  form.conductor_id  || null,
                });
              }}
            >
              {ruta ? 'Guardar' : 'Crear ruta'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Fila de ruta en vista diaria ─────────────────────────────────────────────

function RutaDiaRow({ ruta, novedad, canWrite, onRegistrar, onEditar, onEliminar }) {
  const esSustitucion = novedad && ruta.consumidor_id && novedad.consumidor_id &&
                        novedad.consumidor_id !== ruta.consumidor_id;
  const esCancelada   = novedad?.estado === 'cancelada';
  const tieneNovedad  = !!novedad;

  let wrapCls = 'border-slate-100 dark:border-slate-700 hover:bg-slate-50/40 dark:hover:bg-slate-800/40';
  if (esCancelada)        wrapCls = 'border-red-100 dark:border-red-900/40 bg-red-50/20 dark:bg-red-900/10';
  else if (esSustitucion) wrapCls = 'border-amber-100 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-900/10';

  return (
    <div className={`border rounded-xl p-3 transition-colors ${wrapCls}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Nombre + badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{ruta.nombre}</span>
            {esCancelada && (
              <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">
                <XCircle className="w-2.5 h-2.5 mr-1" />Cancelada
              </Badge>
            )}
            {esSustitucion && (
              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                <AlertTriangle className="w-2.5 h-2.5 mr-1" />Sustitución
              </Badge>
            )}
            {tieneNovedad && !esCancelada && !esSustitucion && (
              <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200">
                Novedad registrada
              </Badge>
            )}
          </div>

          {/* Ruta meta */}
          <div className="flex flex-wrap gap-2 mt-0.5 text-[11px] text-slate-400">
            {(ruta.punto_inicio || ruta.punto_fin) && (
              <span>{[ruta.punto_inicio, ruta.punto_fin].filter(Boolean).join(' → ')}</span>
            )}
            {ruta.distancia_km  && <span className="text-sky-500 font-medium">{ruta.distancia_km} km</span>}
            {ruta.frecuencia    && <span>{ruta.frecuencia}</span>}
          </div>

          {/* Vehículos habitual / del día */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs">
            {ruta.consumidor_id ? (
              <span className="flex items-center gap-1 text-slate-500">
                <Car className="w-3 h-3 text-slate-400" />
                <span className="text-slate-400">Habitual:</span>
                <span className="font-medium text-slate-600 dark:text-slate-300">{ruta.consumidor_nombre}</span>
              </span>
            ) : (
              <span className="text-slate-300 italic text-[11px]">Sin vehículo habitual — asigna uno en el catálogo</span>
            )}

            {esSustitucion && (
              <>
                <ArrowRight className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold">
                  <Car className="w-3 h-3" />Hoy: {novedad.consumidor_nombre}
                </span>
              </>
            )}

            {esCancelada && (
              <span className="text-red-500 font-medium text-[11px]">No operó</span>
            )}

            {!tieneNovedad && ruta.consumidor_id && (
              <span className="text-emerald-600 text-[10px] bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">Normal</span>
            )}
          </div>

          {/* Detalles de la novedad */}
          {tieneNovedad && (
            <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-slate-500">
              {novedad.conductor_nombre && (
                <span className="flex items-center gap-1"><User2 className="w-3 h-3" />{novedad.conductor_nombre}</span>
              )}
              {novedad.ayudante_nombre && (
                <span className="flex items-center gap-1 text-violet-500"><User2 className="w-3 h-3" />{novedad.ayudante_nombre} <span className="text-slate-300 font-normal">(ayudante)</span></span>
              )}
              {novedad.km_reales != null && (
                <span className="font-medium text-sky-600">
                  {Number(novedad.km_reales).toFixed(1)} km reales
                  {ruta.distancia_km ? <span className="text-slate-400 font-normal"> / {ruta.distancia_km} ref.</span> : ''}
                </span>
              )}
              {novedad.observaciones && (
                <span className="italic text-slate-400">{novedad.observaciones}</span>
              )}
            </div>
          )}
        </div>

        {canWrite && (
          <div className="flex items-center gap-1 shrink-0">
            {!tieneNovedad ? (
              <Button
                size="sm" variant="outline"
                className="text-xs h-7 text-slate-500 border-slate-200 hover:border-sky-300 hover:text-sky-700 dark:hover:border-sky-700"
                onClick={onRegistrar}
              >
                Registrar novedad
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700" onClick={onEditar}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={onEliminar}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tarjeta de viaje extra ───────────────────────────────────────────────────

function AsignacionCard({ asig, canWrite, onEdit, onDelete }) {
  const cfg    = ESTADO_CFG[asig.estado] ?? ESTADO_CFG.completada;
  const tipo   = getTipoViaje(asig);
  const tipoCfg = TIPO_VIAJE_CFG[tipo] ?? TIPO_VIAJE_CFG.viaje_extra;
  const { Icon } = cfg;
  return (
    <div className="border border-slate-100 dark:border-slate-700 rounded-xl p-3 hover:bg-slate-50/40 dark:hover:bg-slate-800/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`text-[10px] shrink-0 ${tipoCfg.cls}`}>{tipoCfg.label}</Badge>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
              {asig.descripcion_emergencia || '—'}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 mt-1.5 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><Car className="w-3 h-3" />{asig.consumidor_nombre || '—'}</span>
            {asig.conductor_nombre && <span className="flex items-center gap-1"><User2 className="w-3 h-3" />{asig.conductor_nombre}</span>}
            {asig.ayudante_nombre  && <span className="flex items-center gap-1 text-violet-500"><User2 className="w-3 h-3" />{asig.ayudante_nombre} <span className="text-slate-400 text-[10px]">(ay.)</span></span>}
            {asig.km_reales != null && <span className="font-medium text-sky-600">{Number(asig.km_reales).toFixed(1)} km</span>}
          </div>
          {asig.observaciones && <p className="text-[11px] text-slate-400 mt-1 italic">{asig.observaciones}</p>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant="outline" className={`text-[10px] ${cfg.cls}`}>
            <Icon className="w-2.5 h-2.5 mr-1" />{cfg.label}
          </Badge>
          {canWrite && (<>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-slate-600" onClick={onEdit}>
              <Pencil className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-red-500" onClick={onDelete}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </>)}
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function Rutas() {
  const { canWrite } = useUserRole();
  const queryClient  = useQueryClient();
  const [tab, setTab]                     = useState('viajes');
  const [fechaVista, setFechaVista]       = useState(hoy());
  const [rutaParaNovedad, setRutaParaNovedad] = useState(null);
  const [editingNovedad, setEditingNovedad]   = useState(null);
  const [showDialogAsig, setShowDialogAsig]   = useState(false);
  const [editingAsig, setEditingAsig]         = useState(null);
  const [deleteAsigId, setDeleteAsigId]       = useState(null);
  const [showDialogRuta, setShowDialogRuta]   = useState(false);
  const [editingRuta, setEditingRuta]         = useState(null);
  const [deleteRutaId, setDeleteRutaId]       = useState(null);
  const [filtroTipo, setFiltroTipo]           = useState('all');

  const { data: rutas = [] }       = useQuery({ queryKey: ['rutas'],            queryFn: () => base44.entities.Ruta.list() });
  const { data: asignaciones = [], isLoading } = useQuery({ queryKey: ['asignaciones_ruta'], queryFn: () => base44.entities.AsignacionRuta.list('-fecha', 500) });
  const { data: consumidores = [] } = useQuery({ queryKey: ['consumidores'],     queryFn: () => base44.entities.Consumidor.list() });
  const { data: conductores = [] }  = useQuery({ queryKey: ['conductores'],      queryFn: () => base44.entities.Conductor.list() });

  const rutaById     = useMemo(() => Object.fromEntries(rutas.map(r => [r.id, r])), [rutas]);
  const rutasActivas = useMemo(() => rutas.filter(r => r.activa), [rutas]);

  const mesActual    = hoy().slice(0, 7);
  const asigMes      = useMemo(() => asignaciones.filter(a => a.fecha?.startsWith(mesActual)), [asignaciones, mesActual]);
  const novedadesMes = useMemo(() => asigMes.filter(a => a.ruta_id),  [asigMes]);
  const extrasMes    = useMemo(() => asigMes.filter(a => !a.ruta_id), [asigMes]);
  const kmMes        = useMemo(() => asigMes.reduce((s, a) => s + (Number(a.km_reales) || 0), 0), [asigMes]);

  // Datos del día seleccionado
  const novedadesHoy = useMemo(() => asignaciones.filter(a => a.ruta_id  && a.fecha === fechaVista), [asignaciones, fechaVista]);
  const extrasHoy    = useMemo(() => asignaciones.filter(a => !a.ruta_id && a.fecha === fechaVista), [asignaciones, fechaVista]);

  const rutasFiltradas = useMemo(() =>
    filtroTipo === 'activa'   ? rutas.filter(r =>  r.activa) :
    filtroTipo === 'inactiva' ? rutas.filter(r => !r.activa) :
    rutas
  , [rutas, filtroTipo]);

  const navegarFecha = (dias) => {
    const d = new Date(fechaVista + 'T12:00:00');
    d.setDate(d.getDate() + dias);
    setFechaVista(d.toISOString().slice(0, 10));
  };

  const closeNovedad = () => { setRutaParaNovedad(null); setEditingNovedad(null); };

  // Mutations — novedades / asignaciones
  const createAsigMut = useMutation({
    mutationFn: d => base44.entities.AsignacionRuta.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asignaciones_ruta'] });
      toast.success('Registrado');
      setShowDialogAsig(false);
      closeNovedad();
    },
    onError: () => toast.error('Error al registrar'),
  });
  const updateAsigMut = useMutation({
    mutationFn: ({ id, d }) => base44.entities.AsignacionRuta.update(id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asignaciones_ruta'] });
      toast.success('Actualizado');
      setEditingAsig(null);
      closeNovedad();
    },
    onError: () => toast.error('Error al actualizar'),
  });
  const deleteAsigMut = useMutation({
    mutationFn: id => base44.entities.AsignacionRuta.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['asignaciones_ruta'] }); toast.success('Eliminado'); setDeleteAsigId(null); },
  });

  // Mutations — catálogo
  const createRutaMut = useMutation({
    mutationFn: d => base44.entities.Ruta.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rutas'] }); toast.success('Ruta creada'); setShowDialogRuta(false); },
    onError: () => toast.error('Error al crear la ruta'),
  });
  const updateRutaMut = useMutation({
    mutationFn: ({ id, d }) => base44.entities.Ruta.update(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rutas'] }); toast.success('Ruta actualizada'); setEditingRuta(null); },
    onError: () => toast.error('Error al actualizar'),
  });
  const deleteRutaMut = useMutation({
    mutationFn: async (id) => {
      // Eliminar primero las novedades/asignaciones asociadas para evitar FK orphan
      const asociadas = asignaciones.filter(a => a.ruta_id === id);
      await Promise.all(asociadas.map(a => base44.entities.AsignacionRuta.delete(a.id)));
      return base44.entities.Ruta.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rutas'] });
      queryClient.invalidateQueries({ queryKey: ['asignaciones_ruta'] });
      toast.success('Ruta eliminada');
      setDeleteRutaId(null);
    },
    onError: () => toast.error('Error al eliminar la ruta'),
  });

  // Guardar novedad (crea o actualiza la existente para ese ruta+día)
  const handleSaveNovedad = (formData) => {
    const payload = {
      ...formData,
      ruta_id:    rutaParaNovedad.id,
      fecha:      fechaVista,
      tipo_viaje: 'regular',
    };
    const destino = editingNovedad ?? novedadesHoy.find(a => a.ruta_id === rutaParaNovedad.id);
    if (destino) {
      updateAsigMut.mutate({ id: destino.id, d: payload });
    } else {
      createAsigMut.mutate(payload);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Rutas</h1>
        <p className="text-xs text-slate-400">Programa habitual de rutas con registro de novedades diarias</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Novedades este mes', value: novedadesMes.length,                              cls: novedadesMes.length > 0 ? 'text-amber-600' : 'text-slate-400' },
          { label: 'Viajes extra',       value: extrasMes.length,                                 cls: extrasMes.length > 0 ? 'text-orange-600' : 'text-slate-400' },
          { label: 'Km registrados',     value: kmMes > 0 ? `${kmMes.toFixed(0)} km` : '—',      cls: 'text-slate-700 dark:text-slate-200' },
          { label: 'Rutas activas',      value: rutasActivas.length,                              cls: 'text-emerald-600' },
        ].map(k => (
          <Card key={k.label} className="border-0 shadow-sm">
            <CardContent className="p-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">{k.label}</p>
              <p className={`text-lg font-bold mt-0.5 ${k.cls}`}>{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 flex-wrap border-b border-slate-200 dark:border-slate-700">
        {[
          { value: 'viajes',   label: 'Programa diario',  icon: <Navigation className="w-3.5 h-3.5" /> },
          { value: 'catalogo', label: 'Catálogo de rutas', icon: <BookOpen   className="w-3.5 h-3.5" /> },
          { value: 'stats',    label: 'Estadísticas',      icon: <BarChart3  className="w-3.5 h-3.5" /> },
        ].map(({ value, label, icon }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t border-b-2 transition-colors -mb-px ${
              tab === value
                ? 'border-sky-500 text-sky-700 dark:text-sky-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ── Tab: Programa diario ─────────────────────────────────────────────── */}
      {tab === 'viajes' && (
        <div className="space-y-5">
          {/* Navegación de fecha */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navegarFecha(-1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Input
                type="date" value={fechaVista}
                onChange={e => setFechaVista(e.target.value)}
                className="w-40 h-8 text-xs"
              />
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navegarFecha(1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <span className="text-xs text-slate-400 capitalize">
              {new Date(fechaVista + 'T12:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            {isLoading && <span className="text-xs text-slate-300 ml-auto">Cargando...</span>}
          </div>

          {/* Rutas activas del día */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Rutas activas · {rutasActivas.length}
              </h3>
              {rutasActivas.length > 0 && novedadesHoy.length > 0 && (
                <span className="text-[10px] text-amber-600 font-medium">
                  {novedadesHoy.length} novedad{novedadesHoy.length !== 1 ? 'es' : ''} hoy
                </span>
              )}
            </div>

            {rutasActivas.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <Navigation className="w-8 h-8 text-slate-200 mx-auto" />
                <p className="text-sm text-slate-400">No hay rutas activas en el catálogo.</p>
                <Button size="sm" variant="outline" onClick={() => setTab('catalogo')}>Ir al catálogo</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {rutasActivas.map(ruta => {
                  const novedad = novedadesHoy.find(a => a.ruta_id === ruta.id) ?? null;
                  return (
                    <RutaDiaRow
                      key={ruta.id}
                      ruta={ruta}
                      novedad={novedad}
                      canWrite={canWrite}
                      onRegistrar={() => { setRutaParaNovedad(ruta); setEditingNovedad(null); }}
                      onEditar={() => { setRutaParaNovedad(ruta); setEditingNovedad(novedad); }}
                      onEliminar={() => setDeleteAsigId(novedad?.id)}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Viajes extra del día */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Viajes extra · {extrasHoy.length}
              </h3>
              {canWrite && (
                <Button
                  size="sm" variant="outline"
                  className="gap-1 text-xs h-7 text-orange-600 border-orange-200 hover:bg-orange-50 dark:border-orange-800/50 dark:hover:bg-orange-900/20"
                  onClick={() => setShowDialogAsig(true)}
                >
                  <Plus className="w-3 h-3" /> Registrar viaje extra
                </Button>
              )}
            </div>
            {extrasHoy.length === 0 ? (
              <p className="text-xs text-slate-300 text-center py-3">Sin viajes extra este día</p>
            ) : (
              <div className="space-y-2">
                {extrasHoy.map(asig => (
                  <AsignacionCard
                    key={asig.id}
                    asig={asig}
                    canWrite={canWrite}
                    onEdit={() => setEditingAsig(asig)}
                    onDelete={() => setDeleteAsigId(asig.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Catálogo ─────────────────────────────────────────────────────── */}
      {tab === 'catalogo' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1">
              {[['all','Todas'],['activa','Activas'],['inactiva','Inactivas']].map(([v, l]) => (
                <button
                  key={v} onClick={() => setFiltroTipo(v)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                    filtroTipo === v ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400 flex-1">{rutasFiltradas.length} ruta{rutasFiltradas.length !== 1 ? 's' : ''}</span>
            {canWrite && (
              <Button size="sm" className="bg-sky-600 hover:bg-sky-700 gap-1.5" onClick={() => setShowDialogRuta(true)}>
                <Plus className="w-3.5 h-3.5" /> Nueva ruta
              </Button>
            )}
          </div>

          {rutasFiltradas.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">Sin rutas en esta categoría</div>
          ) : (
            <div className="space-y-2">
              {rutasFiltradas.map(r => {
                const viajesMes = novedadesMes.filter(a => a.ruta_id === r.id).length;
                return (
                  <div
                    key={r.id}
                    className={`border rounded-xl p-3 transition-colors hover:bg-slate-50/40 dark:hover:bg-slate-800/40 ${
                      r.activa ? 'border-slate-100 dark:border-slate-700' : 'border-slate-100 dark:border-slate-700 opacity-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{r.nombre}</span>
                          {!r.activa && <Badge variant="outline" className="text-[10px] text-slate-400">Inactiva</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-slate-500">
                          {r.punto_inicio && r.punto_fin && <span>{r.punto_inicio} → {r.punto_fin}</span>}
                          {r.municipio       && <span>{r.municipio}</span>}
                          {r.distancia_km    && <span className="font-medium text-sky-600">{r.distancia_km} km</span>}
                          {r.tiempo_estimado && <span>{r.tiempo_estimado}</span>}
                          {r.frecuencia      && <span className="text-slate-400">{r.frecuencia}</span>}
                        </div>
                        {/* Asignación habitual */}
                        {(r.consumidor_nombre || r.conductor_nombre) && (
                          <div className="flex flex-wrap gap-3 mt-1.5 text-[11px] text-slate-500 border-t border-slate-50 dark:border-slate-800 pt-1.5">
                            {r.consumidor_nombre && (
                              <span className="flex items-center gap-1">
                                <Car className="w-3 h-3 text-slate-400" />{r.consumidor_nombre}
                              </span>
                            )}
                            {r.conductor_nombre && (
                              <span className="flex items-center gap-1">
                                <User2 className="w-3 h-3 text-slate-400" />{r.conductor_nombre}
                              </span>
                            )}
                          </div>
                        )}
                        {!r.consumidor_id && r.activa && (
                          <p className="text-[10px] text-amber-500 mt-1 italic">Sin vehículo habitual asignado</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {viajesMes > 0 && (
                          <span className="text-[10px] text-sky-600 font-semibold bg-sky-50 dark:bg-sky-900/40 px-2 py-0.5 rounded-full">
                            {viajesMes} novedad{viajesMes !== 1 ? 'es' : ''}/mes
                          </span>
                        )}
                        {canWrite && (<>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-slate-600" onClick={() => setEditingRuta(r)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-red-500" onClick={() => setDeleteRutaId(r.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Estadísticas ─────────────────────────────────────────────────── */}
      {tab === 'stats' && (
        <div className="space-y-4">
          {asigMes.length === 0 ? (
            <div className="py-14 text-center text-sm text-slate-400">Sin novedades ni viajes extra registrados este mes</div>
          ) : (<>
            {/* Rutas con más novedades */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200">Novedades por ruta — mes actual</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {(() => {
                    const counts = {};
                    novedadesMes.forEach(a => {
                      const nombre = rutaById[a.ruta_id]?.nombre || 'Ruta';
                      counts[nombre] = (counts[nombre] || 0) + 1;
                    });
                    if (Object.keys(counts).length === 0)
                      return <p className="text-xs text-slate-400 px-4 py-3">Sin novedades registradas</p>;
                    const max = Math.max(...Object.values(counts), 1);
                    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([nombre, count]) => (
                      <div key={nombre} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-700 dark:text-slate-200 truncate">{nombre}</p>
                          <div className="mt-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${(count / max) * 100}%` }} />
                          </div>
                        </div>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 tabular-nums shrink-0">{count}</span>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Actividad por vehículo */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200">Registros por vehículo — mes actual</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {(() => {
                    const byVeh = {};
                    asigMes.forEach(a => {
                      const key = a.consumidor_nombre || '—';
                      if (!byVeh[key]) byVeh[key] = { novedades: 0, extras: 0, km: 0 };
                      if (a.ruta_id) byVeh[key].novedades++; else byVeh[key].extras++;
                      byVeh[key].km += Number(a.km_reales) || 0;
                    });
                    return Object.entries(byVeh).sort((a, b) => (b[1].novedades + b[1].extras) - (a[1].novedades + a[1].extras)).map(([nombre, s]) => (
                      <div key={nombre} className="flex items-center gap-3 px-4 py-2.5">
                        <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <p className="text-sm text-slate-700 dark:text-slate-200 flex-1 truncate">{nombre}</p>
                        {s.novedades > 0 && <span className="text-xs text-amber-600 tabular-nums">{s.novedades} nov.</span>}
                        {s.extras    > 0 && <span className="text-xs text-orange-600 tabular-nums">{s.extras} extra{s.extras !== 1 ? 's' : ''}</span>}
                        {s.km        > 0 && <span className="text-xs font-semibold text-sky-600 tabular-nums">{s.km.toFixed(0)} km</span>}
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Desglose por tipo */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200">Viajes extra por tipo — mes actual</CardTitle>
              </CardHeader>
              <CardContent className="p-0 pb-3">
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {Object.entries(TIPO_VIAJE_CFG).filter(([k]) => k !== 'regular').map(([key, tcfg]) => {
                    const count = extrasMes.filter(a => getTipoViaje(a) === key).length;
                    const pct   = ((count / Math.max(extrasMes.length, 1)) * 100).toFixed(0);
                    return (
                      <div key={key} className="flex items-center gap-3 px-4 py-2.5">
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${tcfg.cls}`}>{tcfg.label}</Badge>
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 tabular-nums w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>)}
        </div>
      )}

      {/* ── Diálogos ──────────────────────────────────────────────────────────── */}
      {rutaParaNovedad && (
        <DialogNovedad
          ruta={rutaParaNovedad}
          novedad={editingNovedad}
          consumidores={consumidores}
          conductores={conductores}
          onClose={closeNovedad}
          onSave={handleSaveNovedad}
        />
      )}
      {(showDialogAsig || editingAsig) && (
        <DialogAsignacion
          asignacion={editingAsig}
          consumidores={consumidores}
          conductores={conductores}
          onClose={() => { setShowDialogAsig(false); setEditingAsig(null); }}
          onSave={d => editingAsig
            ? updateAsigMut.mutate({ id: editingAsig.id, d })
            : createAsigMut.mutate(d)}
        />
      )}
      {(showDialogRuta || editingRuta) && (
        <DialogRuta
          ruta={editingRuta}
          consumidores={consumidores}
          conductores={conductores}
          onClose={() => { setShowDialogRuta(false); setEditingRuta(null); }}
          onSave={d => editingRuta
            ? updateRutaMut.mutate({ id: editingRuta.id, d })
            : createRutaMut.mutate(d)}
        />
      )}
      <ConfirmDialog
        open={!!deleteAsigId}
        onOpenChange={open => { if (!open) setDeleteAsigId(null); }}
        title="Eliminar registro"
        description="¿Seguro que deseas eliminar este registro de novedad o viaje extra?"
        onConfirm={() => deleteAsigMut.mutate(deleteAsigId)}
        destructive
      />
      {(() => {
        const rutaAEliminar = rutas.find(r => r.id === deleteRutaId);
        const novedadesAsociadas = asignaciones.filter(a => a.ruta_id === deleteRutaId).length;
        return (
          <ConfirmDialog
            open={!!deleteRutaId}
            onOpenChange={open => { if (!open) setDeleteRutaId(null); }}
            title={`Eliminar ruta${rutaAEliminar ? ` "${rutaAEliminar.nombre}"` : ''}`}
            description={
              novedadesAsociadas > 0
                ? `Esta ruta tiene ${novedadesAsociadas} registro${novedadesAsociadas !== 1 ? 's' : ''} de novedades asociados que también serán eliminados. Esta acción no se puede deshacer.`
                : 'Se eliminará permanentemente del catálogo. Esta acción no se puede deshacer.'
            }
            onConfirm={() => deleteRutaMut.mutate(deleteRutaId)}
            destructive
          />
        );
      })()}
    </div>
  );
}
