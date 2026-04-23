import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Power, Trash2, Truck, Zap, Container, Settings } from 'lucide-react';
import ConfirmDialog from '@/components/ui-helpers/ConfirmDialog';

const ICONOS = [
  { value: 'truck', label: 'Vehículo', icon: Truck },
  { value: 'container', label: 'Tanque', icon: Container },
  { value: 'zap', label: 'Equipo', icon: Zap },
  { value: 'settings', label: 'Genérico', icon: Settings },
];

const IconoComp = ({ icono, className }) => {
  const found = ICONOS.find(i => i.value === icono);
  const Comp = found?.icon || Settings;
  return <Comp className={className} />;
};

const empty = { nombre: '', icono: 'truck', requiere_odometro: false, unidad_consumo: 'km/L', activo: true };

export default function TiposConsumidorPanel() {
  const queryClient = useQueryClient();
  const { data: tipos = [] } = useQuery({
    queryKey: ['tipos_consumidor'],
    queryFn: () => base44.entities.TipoConsumidor.list(),
  });
  const { data: consumidores = [] } = useQuery({
    queryKey: ['consumidores'],
    queryFn: () => base44.entities.Consumidor.list(),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [confirmDel, setConfirmDel] = useState(null);

  const createMut = useMutation({
    mutationFn: d => base44.entities.TipoConsumidor.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tipos_consumidor'] }); toast.success('Tipo creado'); close(); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, d }) => base44.entities.TipoConsumidor.update(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tipos_consumidor'] }); toast.success('Tipo actualizado'); close(); },
  });
  const deleteMut = useMutation({
    mutationFn: id => base44.entities.TipoConsumidor.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tipos_consumidor'] }); toast.success('Tipo eliminado'); setConfirmDel(null); },
  });

  const close = () => { setOpen(false); setEditing(null); setForm(empty); };
  const openEdit = t => { setEditing(t); setForm({ nombre: t.nombre, icono: t.icono || 'truck', requiere_odometro: t.requiere_odometro || false, unidad_consumo: t.unidad_consumo || 'km/L', activo: t.activo !== false }); setOpen(true); };

  const handleSave = () => {
    if (!form.nombre.trim()) { toast.error('Nombre requerido'); return; }
    if (editing) updateMut.mutate({ id: editing.id, d: form });
    else createMut.mutate(form);
  };

  const handleDelete = t => {
    const enUso = consumidores.some(c => c.tipo_consumidor_id === t.id);
    if (enUso) { toast.error('Tiene consumidores asociados. Desactívelo o reasigne primero.'); return; }
    setConfirmDel(t);
  };

  const toggleActivo = t => updateMut.mutate({ id: t.id, d: { activo: !t.activo } });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700">Tipos de Consumidor</p>
          <p className="text-xs text-slate-400">Configura categorías: Vehículo, Tanque, Equipo, etc.</p>
        </div>
        <Button size="sm" className="gap-1.5 bg-sky-600 hover:bg-sky-700" onClick={() => { setForm(empty); setEditing(null); setOpen(true); }}>
          <Plus className="w-3.5 h-3.5" /> Nuevo tipo
        </Button>
      </div>

      <div className="grid gap-2">
        {tipos.map(t => (
          <Card key={t.id} className={`border-0 shadow-sm ${!t.activo ? 'opacity-60' : ''}`}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                <IconoComp icono={t.icono} className="w-4 h-4 text-sky-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700">{t.nombre}</p>
                <div className="flex gap-1.5 mt-0.5 flex-wrap">
                  {t.requiere_odometro && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Odómetro</Badge>}
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{t.unidad_consumo || 'km/L'}</Badge>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${t.activo !== false ? 'border-emerald-200 text-emerald-700' : 'border-slate-200 text-slate-400'}`}>
                    {t.activo !== false ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}><Pencil className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActivo(t)}>
                  <Power className={`w-3.5 h-3.5 ${t.activo !== false ? 'text-emerald-500' : 'text-slate-300'}`} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500" onClick={() => handleDelete(t)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {tipos.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">No hay tipos configurados. Crea uno para comenzar.</p>
        )}
      </div>

      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing ? 'Editar tipo' : 'Nuevo tipo de consumidor'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div>
              <Label className="text-xs text-slate-500">Nombre *</Label>
              <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Vehículo, Tanque reserva" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Icono</Label>
              <Select value={form.icono} onValueChange={v => setForm(f => ({ ...f, icono: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ICONOS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Unidad de consumo</Label>
              <Select value={form.unidad_consumo} onValueChange={v => setForm(f => ({ ...f, unidad_consumo: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="km/L">km/L</SelectItem>
                  <SelectItem value="L/100km">L/100km</SelectItem>
                  <SelectItem value="L/h">L/hora</SelectItem>
                  <SelectItem value="L/ciclo">L/ciclo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="req_odo"
                checked={form.requiere_odometro}
                onChange={e => setForm(f => ({ ...f, requiere_odometro: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="req_odo" className="text-xs text-slate-600 cursor-pointer">Requiere odómetro en cada carga</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={close}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} className="bg-sky-600 hover:bg-sky-700">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDel}
        onOpenChange={() => setConfirmDel(null)}
        title="Eliminar tipo"
        description={`¿Eliminar el tipo "${confirmDel?.nombre}"?`}
        onConfirm={() => deleteMut.mutate(confirmDel.id)}
        destructive
      />
    </div>
  );
}