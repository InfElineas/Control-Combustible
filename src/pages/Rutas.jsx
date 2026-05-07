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
import { toast } from "sonner";
import {
  Plus, Navigation, BookOpen, BarChart3,
  Pencil, Trash2, Car, User2,
  CheckCircle2, Clock, XCircle,
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
  regular:          { label: 'Regular',          cls: 'bg-sky-50 text-sky-700 border-sky-200'         },
  carga_mercancias: { label: 'Carga mercancías', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  mensajeria:       { label: 'Mensajería',        cls: 'bg-amber-50 text-amber-700 border-amber-200'   },
  viaje_extra:      { label: 'Viaje extra',       cls: 'bg-orange-50 text-orange-700 border-orange-200'},
};

function getTipoViaje(asig) {
  return asig.tipo_viaje || (asig.ruta_id ? 'regular' : 'viaje_extra');
}

const FRECUENCIA_OPTS = ['Diario', 'Según Planificación', 'Semanal', 'Mensual'];

// ── Diálogo: registrar / editar asignación ───────────────────────────────────

const EMPTY_ASIG = {
  fecha: hoy(), tipo_viaje: 'regular',
  ruta_id: '', descripcion_emergencia: '',
  consumidor_id: '', consumidor_nombre: '',
  conductor_id: '', conductor_nombre: '',
  km_reales: '', observaciones: '', estado: 'completada',
};

function DialogAsignacion({ asignacion, rutas, consumidores, conductores, onClose, onSave }) {
  const [form, setForm] = useState(() => asignacion ? {
    fecha:                   asignacion.fecha || hoy(),
    tipo_viaje:              getTipoViaje(asignacion),
    ruta_id:                 asignacion.ruta_id || '',
    descripcion_emergencia:  asignacion.descripcion_emergencia || '',
    consumidor_id:           asignacion.consumidor_id || '',
    consumidor_nombre:       asignacion.consumidor_nombre || '',
    conductor_id:            asignacion.conductor_id || '',
    conductor_nombre:        asignacion.conductor_nombre || '',
    km_reales:               asignacion.km_reales ?? '',
    observaciones:           asignacion.observaciones || '',
    estado:                  asignacion.estado || 'completada',
  } : EMPTY_ASIG);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const rutasRegulares = rutas.filter(r => r.activa);
  const esNoVehiculo = (c) => {
    const n = (c.tipo_consumidor_nombre || '').toLowerCase();
    return n.includes('tanque') || n.includes('reserva') || n.includes('almac') ||
           n.includes('equipo') || n.includes('planta') || n.includes('generador') || n.includes('grupo');
  };
  const vehiculos = consumidores.filter(c => c.activo && !esNoVehiculo(c));
  const rutaSel = rutas.find(r => r.id === form.ruta_id);

  const esRegular = form.tipo_viaje === 'regular';

  const handleSave = () => {
    if (!form.consumidor_id)                                { toast.error('Selecciona un vehículo'); return; }
    if (esRegular && !form.ruta_id)                         { toast.error('Selecciona una ruta del catálogo'); return; }
    if (!esRegular && !form.descripcion_emergencia.trim())  { toast.error('Describe el destino o motivo'); return; }
    onSave({
      fecha:                   form.fecha,
      tipo_viaje:              form.tipo_viaje,
      ruta_id:                 esRegular ? form.ruta_id : null,
      descripcion_emergencia:  !esRegular ? form.descripcion_emergencia.trim() : null,
      consumidor_id:           form.consumidor_id,
      consumidor_nombre:       form.consumidor_nombre,
      conductor_id:            form.conductor_id || null,
      conductor_nombre:        form.conductor_nombre || null,
      km_reales:               form.km_reales !== '' ? Number(form.km_reales) : null,
      observaciones:           form.observaciones.trim() || null,
      estado:                  form.estado,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Navigation className="w-4 h-4 text-sky-500" />
            {asignacion ? 'Editar viaje' : 'Registrar viaje'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          {/* Fecha + Estado */}
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

          {/* Tipo de viaje */}
          <div>
            <Label className="text-xs text-slate-500">Tipo de viaje *</Label>
            <Select value={form.tipo_viaje} onValueChange={v => set('tipo_viaje', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_VIAJE_CFG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ruta del catálogo (solo si es regular) */}
          {esRegular ? (
            <div>
              <Label className="text-xs text-slate-500">Ruta *</Label>
              <Select value={form.ruta_id} onValueChange={v => set('ruta_id', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar ruta..." /></SelectTrigger>
                <SelectContent>
                  {rutasRegulares.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.nombre}{r.distancia_km ? ` · ${r.distancia_km} km` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {rutaSel && (
                <p className="text-[11px] text-slate-400 mt-1">
                  {[rutaSel.punto_inicio, rutaSel.punto_fin].filter(Boolean).join(' → ')}
                  {rutaSel.municipio ? ` · ${rutaSel.municipio}` : ''}
                </p>
              )}
            </div>
          ) : (
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
          )}

          {/* Vehículo */}
          <div>
            <Label className="text-xs text-slate-500">Vehículo *</Label>
            <Select value={form.consumidor_id} onValueChange={v => {
              const c = consumidores.find(x => x.id === v);
              set('consumidor_id', v);
              set('consumidor_nombre', c?.nombre || '');
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

          {/* Conductor */}
          <div>
            <Label className="text-xs text-slate-500">Conductor <span className="text-slate-300">(opcional)</span></Label>
            <Select value={form.conductor_id || '_none'} onValueChange={v => {
              if (v === '_none') { set('conductor_id', ''); set('conductor_nombre', ''); return; }
              const c = conductores.find(x => x.id === v);
              set('conductor_id', v);
              set('conductor_nombre', c?.nombre || '');
            }}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Sin conductor asignado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Sin conductor</SelectItem>
                {conductores.filter(c => c.activo !== false).map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Km + Observaciones */}
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
              {!form.esEmergencia && rutaSel?.distancia_km && (
                <p className="text-[10px] text-slate-400 mt-0.5">Ref: {rutaSel.distancia_km} km</p>
              )}
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
            <Button size="sm" className="bg-sky-600 hover:bg-sky-700" onClick={handleSave}>
              {asignacion ? 'Guardar cambios' : 'Registrar viaje'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Diálogo: crear / editar ruta del catálogo ────────────────────────────────

const EMPTY_RUTA = {
  nombre: '',
  punto_inicio: '', punto_fin: '', municipio: '',
  distancia_km: '', tiempo_estimado: '', frecuencia: 'Diario', activa: true,
};

function DialogRuta({ ruta, onClose, onSave }) {
  const [form, setForm] = useState(() => ruta ? {
    nombre:           ruta.nombre || '',
    punto_inicio:     ruta.punto_inicio || '',
    punto_fin:        ruta.punto_fin || '',
    municipio:        ruta.municipio || '',
    distancia_km:     ruta.distancia_km ?? '',
    tiempo_estimado:  ruta.tiempo_estimado || '',
    frecuencia:       ruta.frecuencia || 'Diario',
    activa:           ruta.activa ?? true,
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
              <Label className="text-xs text-slate-500">Punto de inicio</Label>
              <Input value={form.punto_inicio} onChange={e => set('punto_inicio', e.target.value)} placeholder="Cerro" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Punto de fin</Label>
              <Input value={form.punto_fin} onChange={e => set('punto_fin', e.target.value)} placeholder="Polígono" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Municipio</Label>
              <Input value={form.municipio} onChange={e => set('municipio', e.target.value)} placeholder="Arroyo Naranjo" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Distancia (km)</Label>
              <Input type="number" step="0.1" min="0" value={form.distancia_km} onChange={e => set('distancia_km', e.target.value)} placeholder="17" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Tiempo estimado</Label>
              <Input value={form.tiempo_estimado} onChange={e => set('tiempo_estimado', e.target.value)} placeholder="25 min" className="mt-1" />
            </div>
            <div className="col-span-2 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3 py-2">
              <Label className="text-sm">Ruta activa</Label>
              <Switch checked={form.activa} onCheckedChange={v => set('activa', v)} />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button
              size="sm" className="bg-sky-600 hover:bg-sky-700"
              onClick={() => { if (!form.nombre.trim()) { toast.error('El nombre es requerido'); return; } onSave({ ...form, distancia_km: form.distancia_km !== '' ? Number(form.distancia_km) : null }); }}
            >
              {ruta ? 'Guardar' : 'Crear ruta'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Tarjeta de asignación ────────────────────────────────────────────────────

function AsignacionCard({ asig, ruta, canWrite, onEdit, onDelete }) {
  const cfg = ESTADO_CFG[asig.estado] ?? ESTADO_CFG.completada;
  const { Icon } = cfg;
  const tipo = getTipoViaje(asig);
  const tipoCfg = TIPO_VIAJE_CFG[tipo] ?? TIPO_VIAJE_CFG.viaje_extra;
  return (
    <div className="border border-slate-100 rounded-xl p-3 hover:bg-slate-50/40 dark:border-slate-700 dark:hover:bg-slate-800/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`text-[10px] shrink-0 ${tipoCfg.cls}`}>
              {tipoCfg.label}
            </Badge>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {tipo === 'regular' ? (ruta?.nombre || '—') : asig.descripcion_emergencia}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 mt-1.5 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><Car className="w-3 h-3" />{asig.consumidor_nombre || '—'}</span>
            {asig.conductor_nombre && <span className="flex items-center gap-1"><User2 className="w-3 h-3" />{asig.conductor_nombre}</span>}
            {ruta?.municipio && <span>{ruta.municipio}</span>}
            {asig.km_reales != null && (
              <span className="font-medium text-sky-600">
                {Number(asig.km_reales).toFixed(1)} km reales
                {ruta?.distancia_km ? <span className="text-slate-400"> / {ruta.distancia_km} ref.</span> : ''}
              </span>
            )}
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
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('viajes');
  const [fechaVista, setFechaVista] = useState(hoy());
  const [showDialogAsig, setShowDialogAsig] = useState(false);
  const [editingAsig, setEditingAsig]       = useState(null);
  const [deleteAsigId, setDeleteAsigId]     = useState(null);
  const [showDialogRuta, setShowDialogRuta] = useState(false);
  const [editingRuta, setEditingRuta]       = useState(null);
  const [deleteRutaId, setDeleteRutaId]     = useState(null);
  const [filtroTipo, setFiltroTipo]         = useState('all');

  const { data: rutas = [] }       = useQuery({ queryKey: ['rutas'],            queryFn: () => base44.entities.Ruta.list() });
  const { data: asignaciones = [], isLoading } = useQuery({ queryKey: ['asignaciones_ruta'], queryFn: () => base44.entities.AsignacionRuta.list('-fecha', 500) });
  const { data: consumidores = [] } = useQuery({ queryKey: ['consumidores'],     queryFn: () => base44.entities.Consumidor.list() });
  const { data: conductores = [] }  = useQuery({ queryKey: ['conductores'],      queryFn: () => base44.entities.Conductor.list() });

  const rutaById = useMemo(() => Object.fromEntries(rutas.map(r => [r.id, r])), [rutas]);

  // Mutations — asignaciones
  const createAsigMut = useMutation({
    mutationFn: d => base44.entities.AsignacionRuta.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['asignaciones_ruta'] }); toast.success('Viaje registrado'); setShowDialogAsig(false); },
    onError: () => toast.error('Error al registrar el viaje'),
  });
  const updateAsigMut = useMutation({
    mutationFn: ({ id, d }) => base44.entities.AsignacionRuta.update(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['asignaciones_ruta'] }); toast.success('Viaje actualizado'); setEditingAsig(null); },
    onError: () => toast.error('Error al actualizar'),
  });
  const deleteAsigMut = useMutation({
    mutationFn: id => base44.entities.AsignacionRuta.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['asignaciones_ruta'] }); toast.success('Viaje eliminado'); setDeleteAsigId(null); },
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
    mutationFn: id => base44.entities.Ruta.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rutas'] }); toast.success('Ruta eliminada'); setDeleteRutaId(null); },
  });

  // Datos derivados
  const asigHoy    = useMemo(() => asignaciones.filter(a => a.fecha === fechaVista), [asignaciones, fechaVista]);
  const mesActual  = hoy().slice(0, 7);
  const asigMes    = useMemo(() => asignaciones.filter(a => a.fecha?.startsWith(mesActual)), [asignaciones, mesActual]);
  const kmMes      = useMemo(() => asigMes.reduce((s, a) => s + (Number(a.km_reales) || 0), 0), [asigMes]);
  const emergencias = useMemo(() => asigMes.filter(a => getTipoViaje(a) !== 'regular').length, [asigMes]);

  const rutasFiltradas = useMemo(() =>
    filtroTipo === 'all'     ? rutas :
    filtroTipo === 'activa'  ? rutas.filter(r => r.activa) :
    rutas.filter(r => !r.activa)
  , [rutas, filtroTipo]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Rutas</h1>
        <p className="text-xs text-slate-400">Registro diario de viajes y catálogo de rutas</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Viajes este mes',   value: asigMes.length,                              cls: 'text-sky-600' },
          { label: 'Km este mes',       value: kmMes > 0 ? `${kmMes.toFixed(0)} km` : '—', cls: 'text-slate-700' },
          { label: 'No regulares',      value: emergencias,                                  cls: emergencias > 0 ? 'text-orange-600' : 'text-slate-400' },
          { label: 'Rutas activas',     value: rutas.filter(r => r.activa).length,          cls: 'text-emerald-600' },
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
          { value: 'viajes',   label: 'Viajes del día',    icon: <Navigation className="w-3.5 h-3.5" /> },
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

      {/* ── Tab: Viajes ───────────────────────────────────────────────────────── */}
      {tab === 'viajes' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              type="date" value={fechaVista}
              onChange={e => setFechaVista(e.target.value)}
              className="w-40 h-8 text-xs"
            />
            <span className="text-xs text-slate-400 flex-1">
              {isLoading ? 'Cargando...' : asigHoy.length === 0 ? 'Sin viajes registrados' : `${asigHoy.length} viaje${asigHoy.length !== 1 ? 's' : ''}`}
            </span>
            {canWrite && (
              <Button size="sm" className="bg-sky-600 hover:bg-sky-700 gap-1.5" onClick={() => setShowDialogAsig(true)}>
                <Plus className="w-3.5 h-3.5" /> Registrar viaje
              </Button>
            )}
          </div>

          {!isLoading && asigHoy.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <Navigation className="w-10 h-10 text-slate-200 mx-auto" />
              <p className="text-sm text-slate-400">No hay viajes registrados para este día</p>
              {canWrite && (
                <Button size="sm" variant="outline" onClick={() => setShowDialogAsig(true)} className="gap-1">
                  <Plus className="w-3.5 h-3.5" /> Registrar el primero
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {asigHoy.map(asig => (
                <AsignacionCard
                  key={asig.id}
                  asig={asig}
                  ruta={rutaById[asig.ruta_id]}
                  canWrite={canWrite}
                  onEdit={() => setEditingAsig(asig)}
                  onDelete={() => setDeleteAsigId(asig.id)}
                />
              ))}
            </div>
          )}
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
                const viajesMes = asigMes.filter(a => a.ruta_id === r.id).length;
                return (
                  <div key={r.id} className={`border rounded-xl p-3 transition-colors hover:bg-slate-50/40 dark:hover:bg-slate-800/40 ${r.activa ? 'border-slate-100 dark:border-slate-700' : 'border-slate-100 opacity-50 dark:border-slate-700'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{r.nombre}</span>
                          {!r.activa && <Badge variant="outline" className="text-[10px] text-slate-400">Inactiva</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-slate-500">
                          {r.punto_inicio && r.punto_fin && <span>{r.punto_inicio} → {r.punto_fin}</span>}
                          {r.municipio && <span>{r.municipio}</span>}
                          {r.distancia_km && <span className="font-medium text-sky-600">{r.distancia_km} km</span>}
                          {r.tiempo_estimado && <span>{r.tiempo_estimado}</span>}
                          {r.frecuencia && <span className="text-slate-400">{r.frecuencia}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {viajesMes > 0 && (
                          <span className="text-[10px] text-sky-600 font-semibold bg-sky-50 dark:bg-sky-900/40 px-2 py-0.5 rounded-full">
                            {viajesMes} viaje{viajesMes !== 1 ? 's' : ''}/mes
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
            <div className="py-14 text-center text-sm text-slate-400">Sin viajes registrados este mes</div>
          ) : (<>
            {/* Rutas más frecuentes */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700">Rutas más frecuentes — mes actual</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {(() => {
                    const counts = {};
                    asigMes.forEach(a => {
                      const key = a.ruta_id ? (rutaById[a.ruta_id]?.nombre || 'Ruta') : `⚡ ${a.descripcion_emergencia || 'Emergencia'}`;
                      counts[key] = (counts[key] || 0) + 1;
                    });
                    const max = Math.max(...Object.values(counts), 1);
                    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([nombre, count]) => (
                      <div key={nombre} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-700 dark:text-slate-200 truncate">{nombre}</p>
                          <div className="mt-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-sky-400 rounded-full transition-all" style={{ width: `${(count / max) * 100}%` }} />
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
                <CardTitle className="text-sm font-semibold text-slate-700">Actividad por vehículo — mes actual</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {(() => {
                    const byVeh = {};
                    asigMes.forEach(a => {
                      const key = a.consumidor_nombre || a.consumidor_id || '—';
                      if (!byVeh[key]) byVeh[key] = { viajes: 0, km: 0 };
                      byVeh[key].viajes++;
                      byVeh[key].km += Number(a.km_reales) || 0;
                    });
                    return Object.entries(byVeh).sort((a, b) => b[1].viajes - a[1].viajes).map(([nombre, s]) => (
                      <div key={nombre} className="flex items-center gap-3 px-4 py-2.5">
                        <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <p className="text-sm text-slate-700 dark:text-slate-200 flex-1 truncate">{nombre}</p>
                        <span className="text-xs text-slate-500 tabular-nums">{s.viajes} viaje{s.viajes !== 1 ? 's' : ''}</span>
                        {s.km > 0 && <span className="text-xs font-semibold text-sky-600 tabular-nums">{s.km.toFixed(0)} km</span>}
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Desglose por tipo */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700">Desglose por tipo — mes actual</CardTitle>
              </CardHeader>
              <CardContent className="p-0 pb-3">
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {Object.entries(TIPO_VIAJE_CFG).map(([key, tcfg]) => {
                    const count = asigMes.filter(a => getTipoViaje(a) === key).length;
                    const pct   = ((count / Math.max(asigMes.length, 1)) * 100).toFixed(0);
                    return (
                      <div key={key} className="flex items-center gap-3 px-4 py-2.5">
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${tcfg.cls}`}>{tcfg.label}</Badge>
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-sky-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 tabular-nums w-6 text-right">{count}</span>
                        <span className="text-[10px] text-slate-400 tabular-nums w-8 text-right">{pct}%</span>
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
      {(showDialogAsig || editingAsig) && (
        <DialogAsignacion
          asignacion={editingAsig}
          rutas={rutas}
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
          onClose={() => { setShowDialogRuta(false); setEditingRuta(null); }}
          onSave={d => editingRuta
            ? updateRutaMut.mutate({ id: editingRuta.id, d })
            : createRutaMut.mutate(d)}
        />
      )}
      {deleteAsigId && (
        <ConfirmDialog
          title="Eliminar viaje"
          description="¿Seguro que deseas eliminar este registro? Esta acción no se puede deshacer."
          onConfirm={() => deleteAsigMut.mutate(deleteAsigId)}
          onCancel={() => setDeleteAsigId(null)}
        />
      )}
      {deleteRutaId && (
        <ConfirmDialog
          title="Eliminar ruta"
          description="¿Seguro que deseas eliminar esta ruta del catálogo?"
          onConfirm={() => deleteRutaMut.mutate(deleteRutaId)}
          onCancel={() => setDeleteRutaId(null)}
        />
      )}
    </div>
  );
}
