import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { useUserRole } from '@/components/ui-helpers/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { formatMonto } from '@/components/ui-helpers/SaldoUtils';
import {
  CreditCard, TrendingUp, Plus, Pencil, Trash2,
  DollarSign, Fuel, ChevronDown, ChevronUp, Loader2,
  WalletCards,
} from 'lucide-react';

// ── helpers ─────────────────────────────────────────────────────────────────

const MONEDAS = ['USD', 'CUP', 'MLC', 'EUR'];

function emptyTarjeta() {
  return { id_tarjeta: '', alias: '', moneda: 'USD', activa: true };
}

function emptyPrecio() {
  return { combustible_id: '', precio_por_litro: '', fecha_desde: new Date().toISOString().slice(0, 10), fecha_hasta: '' };
}

// ── Tab Tarjetas ─────────────────────────────────────────────────────────────

function TarjetasTab({ canManageFinanzas, canDelete }) {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState(null); // null | { mode: 'create'|'edit', data }
  const [form, setForm] = useState(emptyTarjeta());
  const [expandedId, setExpandedId] = useState(null);

  const { data: tarjetas = [] } = useQuery({ queryKey: ['tarjetas'], queryFn: () => base44.entities.Tarjeta.list() });
  const { data: movimientos = [] } = useQuery({ queryKey: ['movimientos'], queryFn: () => base44.entities.Movimiento.list('-fecha', 2000) });

  const tarjetasSorted = useMemo(() =>
    [...tarjetas].sort((a, b) => (a.alias || a.id_tarjeta).localeCompare(b.alias || b.id_tarjeta)),
    [tarjetas]
  );

  const mesActual = new Date().toISOString().slice(0, 7);
  const gastoMes = useMemo(() =>
    movimientos
      .filter(m => m.tipo === 'COMPRA' && m.fecha?.startsWith(mesActual) && m.monto)
      .reduce((s, m) => s + m.monto, 0),
    [movimientos, mesActual]
  );

  const saveMut = useMutation({
    mutationFn: async (data) => {
      if (dialog?.mode === 'edit') {
        const { error } = await supabase.from('tarjeta').update(data).eq('id', dialog.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tarjeta').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tarjetas'] });
      toast.success(dialog?.mode === 'edit' ? 'Tarjeta actualizada' : 'Tarjeta creada');
      setDialog(null);
    },
    onError: () => toast.error('Error al guardar tarjeta'),
  });

  const deleteMut = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('tarjeta').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tarjetas'] }); toast.success('Tarjeta eliminada'); },
    onError: () => toast.error('Error al eliminar'),
  });

  function openCreate() {
    setForm(emptyTarjeta());
    setDialog({ mode: 'create' });
  }

  function openEdit(t) {
    setForm({ id_tarjeta: t.id_tarjeta, alias: t.alias || '', moneda: t.moneda || 'USD', activa: t.activa !== false });
    setDialog({ mode: 'edit', data: t });
  }

  function handleSave() {
    if (!form.id_tarjeta.trim()) { toast.error('El número/código de tarjeta es requerido'); return; }
    if (!form.alias.trim()) { toast.error('El alias es requerido'); return; }
    const payload = {
      id_tarjeta: form.id_tarjeta.trim(),
      alias: form.alias.trim(),
      moneda: form.moneda,
      activa: form.activa,
    };
    saveMut.mutate(payload);
  }

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Tarjetas activas', value: tarjetasSorted.filter(t => t.activa !== false).length, icon: CreditCard, color: 'text-sky-600 bg-sky-50' },
          { label: 'Gasto del mes',    value: formatMonto(gastoMes), icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
        ].map(k => (
          <Card key={k.label} className="border-0 shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${k.color}`}>
                <k.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide leading-tight">{k.label}</p>
                <p className="text-sm font-bold text-slate-800 leading-tight">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lista */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-700">
            {tarjetasSorted.length} tarjeta{tarjetasSorted.length !== 1 ? 's' : ''}
          </CardTitle>
          {canManageFinanzas && (
            <Button size="sm" onClick={openCreate} className="h-7 text-xs gap-1.5 bg-sky-600 hover:bg-sky-700">
              <Plus className="w-3.5 h-3.5" /> Nueva tarjeta
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {tarjetasSorted.map(t => {
              const isExpanded = expandedId === t.id;
              const movsTarjeta = movimientos
                .filter(m => m.tarjeta_id === t.id || (!m.tarjeta_id && m.tarjeta_alias && (m.tarjeta_alias === t.alias || m.tarjeta_alias === t.id_tarjeta)))
                .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))
                .slice(0, 5);
              return (
                <div key={t.id}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${t.activa !== false ? 'bg-sky-100' : 'bg-slate-100'}`}>
                      <CreditCard className={`w-4 h-4 ${t.activa !== false ? 'text-sky-600' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-800 truncate">{t.alias || t.id_tarjeta}</span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{t.id_tarjeta}</span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5">{t.moneda}</Badge>
                        {t.activa === false && <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-slate-400">Inactiva</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {canManageFinanzas && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(t)}>
                          <Pencil className="w-3 h-3 text-slate-400" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteMut.mutate(t.id)}>
                          <Trash2 className="w-3 h-3 text-slate-400 hover:text-red-500" />
                        </Button>
                      )}
                      <Button
                        size="icon" variant="ghost" className="h-7 w-7"
                        onClick={() => setExpandedId(isExpanded ? null : t.id)}
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                      </Button>
                    </div>
                  </div>

                  {/* Últimos movimientos expandidos */}
                  {isExpanded && (
                    <div className="bg-slate-50/60 border-t border-slate-100 px-4 py-3">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">Últimos movimientos</p>
                      {movsTarjeta.length === 0 ? (
                        <p className="text-xs text-slate-400">Sin movimientos registrados</p>
                      ) : (
                        <div className="space-y-1.5">
                          {movsTarjeta.map(m => (
                            <div key={m.id} className="flex items-center gap-2 text-xs">
                              <span className="text-slate-400 tabular-nums w-20 shrink-0">{m.fecha}</span>
                              <Badge variant="outline" className={`text-[10px] py-0 px-1.5 shrink-0 ${
                                m.tipo === 'COMPRA'  ? 'border-orange-200 text-orange-700' :
                                'border-purple-200 text-purple-700'
                              }`}>{m.tipo}</Badge>
                              <span className="text-slate-600 truncate flex-1 min-w-0">
                                {m.consumidor_nombre || m.referencia || '—'}
                                {m.litros ? <span className="text-slate-400 ml-1">{m.litros}L</span> : null}
                              </span>
                              <span className="font-medium tabular-nums shrink-0 text-orange-600">
                                -{formatMonto(m.monto)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {tarjetasSorted.length === 0 && (
              <div className="py-12 text-center text-sm text-slate-400">No hay tarjetas registradas</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog crear/editar tarjeta */}
      <Dialog open={dialog?.mode === 'create' || dialog?.mode === 'edit'} onOpenChange={open => !open && setDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">{dialog?.mode === 'edit' ? 'Editar tarjeta' : 'Nueva tarjeta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div>
              <Label className="text-xs text-slate-500">Alias / Nombre *</Label>
              <Input className="mt-1" value={form.alias} onChange={e => setForm(f => ({ ...f, alias: e.target.value }))} placeholder="Tarjeta Flota Principal" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Número / Código *</Label>
              <Input className="mt-1" value={form.id_tarjeta} onChange={e => setForm(f => ({ ...f, id_tarjeta: e.target.value }))} disabled={dialog?.mode === 'edit'} placeholder="9240069992278321" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Moneda</Label>
              <Select value={form.moneda} onValueChange={v => setForm(f => ({ ...f, moneda: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{MONEDAS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.activa} onCheckedChange={v => setForm(f => ({ ...f, activa: v }))} />
              <Label className="text-xs text-slate-600">Tarjeta activa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialog(null)}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={saveMut.isPending} className="bg-sky-600 hover:bg-sky-700">
              {saveMut.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              {dialog?.mode === 'edit' ? 'Guardar cambios' : 'Crear tarjeta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Tab Precios ──────────────────────────────────────────────────────────────

function PreciosTab({ canManageFinanzas }) {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState(emptyPrecio());

  const { data: precios = [] } = useQuery({ queryKey: ['precios'], queryFn: () => base44.entities.PrecioCombustible.list('-fecha_desde', 500) });
  const { data: combustibles = [] } = useQuery({ queryKey: ['combustibles'], queryFn: () => base44.entities.TipoCombustible.list() });

  const preciosPorComb = useMemo(() => {
    const map = {};
    combustibles.forEach(c => { map[c.id] = { nombre: c.nombre, activa: c.activa, precios: [] }; });
    precios.forEach(p => {
      if (map[p.combustible_id]) map[p.combustible_id].precios.push(p);
    });
    return Object.entries(map)
      .filter(([, v]) => v.activa !== false || v.precios.length > 0)
      .sort((a, b) => a[1].nombre.localeCompare(b[1].nombre));
  }, [combustibles, precios]);

  const saveMut = useMutation({
    mutationFn: async (data) => {
      if (dialog?.mode === 'edit') {
        const { error } = await supabase.from('precio_combustible').update(data).eq('id', dialog.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('precio_combustible').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['precios'] });
      toast.success(dialog?.mode === 'edit' ? 'Precio actualizado' : 'Precio creado');
      setDialog(null);
    },
    onError: () => toast.error('Error al guardar precio'),
  });

  const deleteMut = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('precio_combustible').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['precios'] }); toast.success('Precio eliminado'); },
    onError: () => toast.error('Error al eliminar'),
  });

  function openCreate(combustibleId = '') {
    setForm({ ...emptyPrecio(), combustible_id: combustibleId });
    setDialog({ mode: 'create' });
  }

  function openEdit(p) {
    setForm({ combustible_id: p.combustible_id, precio_por_litro: p.precio_por_litro, fecha_desde: p.fecha_desde, fecha_hasta: p.fecha_hasta || '' });
    setDialog({ mode: 'edit', data: p });
  }

  function handleSave() {
    if (!form.combustible_id) { toast.error('Seleccione el tipo de combustible'); return; }
    const precio = parseFloat(form.precio_por_litro);
    if (!form.precio_por_litro || isNaN(precio) || precio <= 0) { toast.error('El precio debe ser mayor a 0'); return; }
    if (!form.fecha_desde) { toast.error('La fecha desde es requerida'); return; }
    saveMut.mutate({
      combustible_id: form.combustible_id,
      precio_por_litro: precio,
      fecha_desde: form.fecha_desde,
      fecha_hasta: form.fecha_hasta || null,
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">Precios vigentes y anteriores por tipo de combustible</p>
        {canManageFinanzas && (
          <Button size="sm" onClick={() => openCreate()} className="h-7 text-xs gap-1.5 bg-sky-600 hover:bg-sky-700">
            <Plus className="w-3.5 h-3.5" /> Nuevo precio
          </Button>
        )}
      </div>

      {preciosPorComb.map(([combId, grupo]) => {
        const vigente = grupo.precios.find(p => p.fecha_desde <= today && (!p.fecha_hasta || p.fecha_hasta >= today));
        return (
          <Card key={combId} className="border-0 shadow-sm">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-slate-400" />
                <CardTitle className="text-sm font-semibold text-slate-700">{grupo.nombre}</CardTitle>
                {vigente ? (
                  <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50">
                    Vigente: $ {Number(vigente.precio_por_litro).toFixed(2)} / L
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-slate-400">Sin precio vigente</Badge>
                )}
              </div>
              {canManageFinanzas && (
                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-slate-500" onClick={() => openCreate(combId)}>
                  <Plus className="w-3 h-3" /> Agregar
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {grupo.precios.length === 0 ? (
                <p className="px-4 pb-3 text-xs text-slate-400">Sin precios registrados</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {grupo.precios.map(p => {
                    const esVigente = p.fecha_desde <= today && (!p.fecha_hasta || p.fecha_hasta >= today);
                    return (
                      <div key={p.id} className={`flex items-center gap-3 px-4 py-2.5 ${esVigente ? 'bg-emerald-50/40' : ''}`}>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-slate-800 tabular-nums">
                            $ {Number(p.precio_por_litro).toFixed(2)} / L
                          </span>
                          <span className="text-xs text-slate-400 ml-3">
                            Desde: {p.fecha_desde}
                            {p.fecha_hasta ? ` · Hasta: ${p.fecha_hasta}` : ' · Sin fecha de cierre'}
                          </span>
                        </div>
                        {esVigente && <Badge className="text-[10px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">Vigente</Badge>}
                        {canManageFinanzas && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => openEdit(p)}>
                            <Pencil className="w-3 h-3 text-slate-400" />
                          </Button>
                        )}
                        {canManageFinanzas && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => deleteMut.mutate(p.id)}>
                            <Trash2 className="w-3 h-3 text-slate-400 hover:text-red-500" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {preciosPorComb.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center text-sm text-slate-400">
            No hay tipos de combustible registrados
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={!!dialog} onOpenChange={open => !open && setDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">{dialog?.mode === 'edit' ? 'Editar precio' : 'Nuevo precio'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div>
              <Label className="text-xs text-slate-500">Tipo de combustible *</Label>
              <Select value={form.combustible_id} onValueChange={v => setForm(f => ({ ...f, combustible_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {combustibles.filter(c => c.activa !== false).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Precio por litro ($ / L) *</Label>
              <Input type="number" step="0.001" min="0.001" className="mt-1" value={form.precio_por_litro} onChange={e => setForm(f => ({ ...f, precio_por_litro: e.target.value }))} placeholder="0.00" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-500">Vigente desde *</Label>
                <Input type="date" className="mt-1" value={form.fecha_desde} onChange={e => setForm(f => ({ ...f, fecha_desde: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Hasta (opcional)</Label>
                <Input type="date" className="mt-1" value={form.fecha_hasta} onChange={e => setForm(f => ({ ...f, fecha_hasta: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialog(null)}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={saveMut.isPending} className="bg-sky-600 hover:bg-sky-700">
              {saveMut.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              {dialog?.mode === 'edit' ? 'Guardar cambios' : 'Crear precio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function Finanzas() {
  const { canManageFinanzas, canDelete } = useUserRole();
  const [tab, setTab] = useState('tarjetas');

  if (!canManageFinanzas) {
    return (
      <div className="py-20 text-center space-y-3">
        <WalletCards className="w-10 h-10 text-slate-300 mx-auto" />
        <p className="text-slate-400 text-sm">Acceso restringido. Solo roles económico y superadmin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
          <WalletCards className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Finanzas</h1>
          <p className="text-xs text-slate-400">Gestión de tarjetas y precios de combustible</p>
        </div>
      </div>

      <div className="flex gap-0.5 border-b border-slate-200 dark:border-slate-700">
        {[
          { value: 'tarjetas', label: 'Tarjetas', icon: <CreditCard className="w-3.5 h-3.5" /> },
          { value: 'precios',  label: 'Precios de combustible', icon: <TrendingUp className="w-3.5 h-3.5" /> },
        ].map(({ value: v, label, icon }) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t border-b-2 transition-colors -mb-px ${
              tab === v
                ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === 'tarjetas' && <TarjetasTab canManageFinanzas={canManageFinanzas} canDelete={canDelete} />}
        {tab === 'precios'  && <PreciosTab  canManageFinanzas={canManageFinanzas} />}
      </div>
    </div>
  );
}
