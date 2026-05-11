import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Power, Trash2, Truck, Zap, Container, Settings, Search, Droplets } from 'lucide-react';
import StatusBadge from '@/components/ui-helpers/StatusBadge';
import ConfirmDialog from '@/components/ui-helpers/ConfirmDialog';
import ConsumidorForm from '@/components/consumidores/ConsumidorForm';
import { useUserRole } from '@/components/ui-helpers/useUserRole';
import CombustibleBadge from '@/components/ui-helpers/CombustibleBadge';

const ICONO_MAP = { truck: Truck, zap: Zap, container: Container, settings: Settings };
const IconComp = ({ icono, className }) => {
  const C = ICONO_MAP[icono] || Settings;
  return <C className={className} />;
};

const esAlmacenamiento = (nombre) => {
  const n = (nombre || '').toLowerCase();
  return n.includes('tanque') || n.includes('reserva') || n.includes('almac');
};

const emptyForm = {
  tipo_consumidor_id: '', tipo_consumidor_nombre: '',
  nombre: '', codigo_interno: '',
  combustible_id: '', combustible_nombre: '',
  activo: true, responsable: '', conductor: '', conductor_id: '',
  ayudante: '', ayudante_id: '',
  funcion: '', observaciones: '',
  litros_iniciales: 0,
  datos_vehiculo: {}, datos_tanque: {}, datos_equipo: {},
};

function ConsumidorRow({ c, tipos, canWrite, canDelete, onEdit, onToggle, onDelete }) {
  const tipo = tipos.find(t => t.id === c.tipo_consumidor_id);
  return (
    <Card className={`border-0 shadow-sm ${!c.activo ? 'opacity-60' : ''}`}>
      <CardContent className="p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
          <IconComp icono={tipo?.icono} className="w-4 h-4 text-sky-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-700 truncate">{c.nombre}</span>
            {c.codigo_interno && (
              <span className="font-mono text-xs text-slate-500">{c.codigo_interno}</span>
            )}
            <StatusBadge active={c.activo !== false} />
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {c.tipo_consumidor_nombre || tipo?.nombre || '—'}
            </Badge>
            {c.combustible_nombre && <CombustibleBadge nombre={c.combustible_nombre} />}
            {c.responsable && (
              <span className="text-[11px] text-slate-400 truncate">{c.responsable}</span>
            )}
            {c.datos_vehiculo?.estado_vehiculo && c.datos_vehiculo.estado_vehiculo !== 'Operativo' && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-200 text-amber-700">
                {c.datos_vehiculo.estado_vehiculo}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          {canWrite && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(c)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
          {canWrite && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onToggle(c)}>
              <Power className={`w-3.5 h-3.5 ${c.activo !== false ? 'text-emerald-500' : 'text-slate-300'}`} />
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500" onClick={() => onDelete(c)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Consumidores() {
  const { canDelete, canWrite } = useUserRole();
  const queryClient = useQueryClient();

  const { data: consumidores = [], isLoading } = useQuery({
    queryKey: ['consumidores'],
    queryFn: () => base44.entities.Consumidor.list(),
  });
  const { data: tipos = [] } = useQuery({
    queryKey: ['tipos_consumidor'],
    queryFn: () => base44.entities.TipoConsumidor.list(),
  });
  const { data: combustibles = [] } = useQuery({
    queryKey: ['combustibles'],
    queryFn: () => base44.entities.TipoCombustible.list(),
  });
  const { data: conductores = [] } = useQuery({
    queryKey: ['conductores'],
    queryFn: () => base44.entities.Conductor.list(),
  });

  const [tabTipo, setTabTipo] = useState('all');
  const [filterActivo, setFilterActivo] = useState('activos');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDel, setConfirmDel] = useState(null);

  const createMut = useMutation({
    mutationFn: d => base44.entities.Consumidor.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['consumidores'] }); toast.success('Consumidor creado'); closeDialog(); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, d }) => base44.entities.Consumidor.update(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['consumidores'] }); toast.success('Actualizado'); closeDialog(); },
  });
  const deleteMut = useMutation({
    mutationFn: id => base44.entities.Consumidor.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['consumidores'] }); toast.success('Eliminado'); setConfirmDel(null); },
  });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(emptyForm); };

  const openEdit = c => {
    setEditing(c);
    setForm({
      tipo_consumidor_id: c.tipo_consumidor_id || '',
      tipo_consumidor_nombre: c.tipo_consumidor_nombre || '',
      nombre: c.nombre || '',
      codigo_interno: c.codigo_interno || '',
      combustible_id: c.combustible_id || '',
      combustible_nombre: c.combustible_nombre || '',
      activo: c.activo !== false,
      responsable: c.responsable || '',
      conductor: c.conductor || '',
      conductor_id: c.conductor_id || '',
      ayudante: c.ayudante || '',
      ayudante_id: c.ayudante_id || '',
      funcion: c.funcion || '',
      observaciones: c.observaciones || '',
      litros_iniciales: Number.isFinite(Number(c.litros_iniciales)) ? Number(c.litros_iniciales) : 0,
      datos_vehiculo: c.datos_vehiculo || {},
      datos_tanque: c.datos_tanque || {},
      datos_equipo: c.datos_equipo || {},
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.tipo_consumidor_id) { toast.error('Seleccione un tipo de consumidor'); return; }
    if (!form.nombre.trim()) { toast.error('Nombre requerido'); return; }
    if (!form.combustible_id) { toast.error('Combustible principal requerido'); return; }
    const tipoNombre = (form.tipo_consumidor_nombre || '').toLowerCase();
    const esVeh = tipoNombre.includes('veh');
    if (esVeh && !form.codigo_interno?.trim()) { toast.error('Código interno / Chapa es requerido para vehículos'); return; }
    if (esVeh && !form.conductor_id) { toast.error('Conductor principal es requerido para vehículos'); return; }
    if (form.litros_iniciales === '' || Number.isNaN(Number(form.litros_iniciales)) || Number(form.litros_iniciales) < 0) {
      toast.error('Litros iniciales inválidos'); return;
    }
    const payload = { ...form, litros_iniciales: Number(form.litros_iniciales) };
    if (editing) updateMut.mutate({ id: editing.id, d: payload });
    else createMut.mutate(payload);
  };

  const toggleActivo = c => updateMut.mutate({ id: c.id, d: { activo: !c.activo } });

  // Separate almacenamiento (tanks/reservas) from real consumers
  const tiposAlmacenamiento = useMemo(() => new Set(
    tipos.filter(t => esAlmacenamiento(t.nombre)).map(t => t.id)
  ), [tipos]);

  const tiposConsumidor = useMemo(() =>
    tipos.filter(t => t.activo !== false && !esAlmacenamiento(t.nombre)),
  [tipos]);

  const applyCommonFilters = (list) => list.filter(c => {
    if (filterActivo === 'activos' && !c.activo) return false;
    if (filterActivo === 'inactivos' && c.activo) return false;
    if (search && !`${c.nombre} ${c.codigo_interno || ''} ${c.tipo_consumidor_nombre || ''}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const consumidoresReales = useMemo(() =>
    applyCommonFilters(consumidores.filter(c => !tiposAlmacenamiento.has(c.tipo_consumidor_id))),
  [consumidores, tiposAlmacenamiento, filterActivo, search]);

  const almacenamiento = useMemo(() =>
    applyCommonFilters(consumidores.filter(c => tiposAlmacenamiento.has(c.tipo_consumidor_id))),
  [consumidores, tiposAlmacenamiento, filterActivo, search]);

  const filteredByTab = useMemo(() => {
    if (tabTipo === 'all') return consumidoresReales;
    return consumidoresReales.filter(c => c.tipo_consumidor_id === tabTipo);
  }, [consumidoresReales, tabTipo]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const map = {};
    consumidoresReales.forEach(c => {
      map[c.tipo_consumidor_id] = (map[c.tipo_consumidor_id] || 0) + 1;
    });
    return map;
  }, [consumidoresReales]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Consumidores</h1>
          <p className="text-xs text-slate-400">{consumidoresReales.length} consumidores · {almacenamiento.length} depósitos</p>
        </div>
        {canWrite && (
          <Button size="sm" className="gap-1.5 bg-sky-600 hover:bg-sky-700" onClick={() => { setForm(emptyForm); setEditing(null); setDialogOpen(true); }}>
            <Plus className="w-3.5 h-3.5" /> Nuevo
          </Button>
        )}
      </div>

      {/* Search + estado filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="pl-8 h-8 text-sm w-48"
          />
        </div>
        <div className="flex gap-0.5 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800/60">
          {[['all', 'Todos'], ['activos', 'Activos'], ['inactivos', 'Inactivos']].map(([v, label]) => (
            <button
              key={v}
              onClick={() => setFilterActivo(v)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filterActivo === v ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs por tipo de consumidor */}
      <div className="flex gap-0.5 flex-wrap border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setTabTipo('all')}
          className={`px-3 py-2 text-xs font-medium rounded-t border-b-2 transition-colors -mb-px ${tabTipo === 'all' ? 'border-sky-500 text-sky-700 dark:text-sky-400 bg-white dark:bg-slate-900' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          Todos
          <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${tabTipo === 'all' ? 'bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
            {consumidoresReales.length}
          </span>
        </button>
        {tiposConsumidor.map(t => (
          <button
            key={t.id}
            onClick={() => setTabTipo(t.id)}
            className={`px-3 py-2 text-xs font-medium rounded-t border-b-2 transition-colors -mb-px ${tabTipo === t.id ? 'border-sky-500 text-sky-700 dark:text-sky-400 bg-white dark:bg-slate-900' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            {t.nombre}
            {tabCounts[t.id] > 0 && (
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${tabTipo === t.id ? 'bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                {tabCounts[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista consumidores reales */}
      <div className="grid gap-2">
        {isLoading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}
        {!isLoading && filteredByTab.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">No hay consumidores en esta categoría</p>
        )}
        {filteredByTab.map(c => (
          <ConsumidorRow
            key={c.id} c={c} tipos={tipos}
            canWrite={canWrite} canDelete={canDelete}
            onEdit={openEdit} onToggle={toggleActivo} onDelete={setConfirmDel}
          />
        ))}
      </div>

      {/* Sección Almacenamiento (tanques/reservas) — separada semánticamente */}
      {almacenamiento.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-3">
            <Droplets className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Almacenamiento / Depósitos</span>
            <span className="text-[11px] text-slate-400 ml-1">— no son consumidores, son origen de despachos</span>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 ml-auto">{almacenamiento.length}</Badge>
          </div>
          <div className="grid gap-2">
            {almacenamiento.map(c => (
              <ConsumidorRow
                key={c.id} c={c} tipos={tipos}
                canWrite={canWrite} canDelete={canDelete}
                onEdit={openEdit} onToggle={toggleActivo} onDelete={setConfirmDel}
              />
            ))}
          </div>
        </div>
      )}

      {/* Dialog crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar consumidor' : 'Nuevo consumidor'}</DialogTitle>
          </DialogHeader>
          <ConsumidorForm
            form={form}
            setForm={setForm}
            tipos={tipos}
            combustibles={combustibles}
            editingTipo={editing?.tipo_consumidor_nombre}
            conductores={conductores}
          />
          <DialogFooter className="mt-4">
            <Button variant="outline" size="sm" onClick={closeDialog}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} className="bg-sky-600 hover:bg-sky-700">
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDel}
        onOpenChange={() => setConfirmDel(null)}
        title="Eliminar consumidor"
        description={`¿Eliminar "${confirmDel?.nombre}"? Esta acción no se puede deshacer.`}
        onConfirm={() => deleteMut.mutate(confirmDel.id)}
        destructive
      />
    </div>
  );
}
