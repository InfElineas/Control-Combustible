import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner";
import { Save, Loader2 } from 'lucide-react';

export default function EditarMovimientoModal({ movimiento, onClose }) {
  const queryClient = useQueryClient();
  const { data: tarjetas = [] } = useQuery({ queryKey: ['tarjetas'], queryFn: () => base44.entities.Tarjeta.list() });
  const { data: consumidores = [] } = useQuery({ queryKey: ['consumidores'], queryFn: () => base44.entities.Consumidor.list() });
  const { data: combustibles = [] } = useQuery({ queryKey: ['combustibles'], queryFn: () => base44.entities.TipoCombustible.list() });

  // Re-initialize form when movimiento changes (pre-load existing data)
  const [form, setForm] = useState(() => ({
    fecha: movimiento?.fecha || '',
    monto: movimiento?.monto ?? '',
    litros: movimiento?.litros ?? '',
    precio: movimiento?.precio ?? '',
    odometro: movimiento?.odometro ?? '',
    referencia: movimiento?.referencia || '',
    tarjeta_id: movimiento?.tarjeta_id || '',
    consumidor_id: movimiento?.consumidor_id || '',
    consumidor_origen_id: movimiento?.consumidor_origen_id || '',
    combustible_id: movimiento?.combustible_id || '',
  }));

  useEffect(() => {
    if (movimiento) {
      setForm({
        fecha: movimiento.fecha || '',
        monto: movimiento.monto ?? '',
        litros: movimiento.litros ?? '',
        precio: movimiento.precio ?? '',
        odometro: movimiento.odometro ?? '',
        referencia: movimiento.referencia || '',
        tarjeta_id: movimiento.tarjeta_id || '',
        consumidor_id: movimiento.consumidor_id || '',
        consumidor_origen_id: movimiento.consumidor_origen_id || '',
        combustible_id: movimiento.combustible_id || '',
      });
    }
  }, [movimiento?.id]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Movimiento.update(movimiento.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      toast.success('Movimiento actualizado');
      onClose();
    },
  });

  const handleSubmit = () => {
    const tarjeta = tarjetas.find(t => t.id === form.tarjeta_id);
    const consumidor = consumidores.find(c => c.id === form.consumidor_id);
    const consumidorOrigen = consumidores.find(c => c.id === form.consumidor_origen_id);
    const combustible = combustibles.find(c => c.id === form.combustible_id);

    const data = {
      fecha: form.fecha,
      referencia: form.referencia || undefined,
    };

    if (form.tarjeta_id && tarjeta) {
      data.tarjeta_id = tarjeta.id;
      data.tarjeta_alias = tarjeta.alias || tarjeta.id_tarjeta;
    }
    if (form.consumidor_id && consumidor) {
      data.consumidor_id = consumidor.id;
      data.consumidor_nombre = consumidor.nombre;
    }
    if (form.consumidor_origen_id && consumidorOrigen) {
      data.consumidor_origen_id = consumidorOrigen.id;
      data.consumidor_origen_nombre = consumidorOrigen.nombre;
    }
    if (form.combustible_id && combustible) {
      data.combustible_id = combustible.id;
      data.combustible_nombre = combustible.nombre;
    }
    if (form.monto !== '') data.monto = parseFloat(form.monto);
    if (form.litros !== '') data.litros = parseFloat(form.litros);
    if (form.precio !== '') data.precio = parseFloat(form.precio);
    if (form.odometro !== '') data.odometro = parseFloat(form.odometro);

    updateMutation.mutate(data);
  };

  if (!movimiento) return null;
  const tipo = movimiento.tipo;

  return (
    <Dialog open={!!movimiento} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Editar Movimiento — {tipo}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div>
            <Label className="text-xs text-slate-500">Fecha</Label>
            <Input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} className="mt-1" />
          </div>

          {(tipo === 'RECARGA' || tipo === 'COMPRA') && (
            <div>
              <Label className="text-xs text-slate-500">Tarjeta</Label>
              <Select value={form.tarjeta_id} onValueChange={v => set('tarjeta_id', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {tarjetas.map(t => <SelectItem key={t.id} value={t.id}>{t.alias || t.id_tarjeta}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {(tipo === 'COMPRA' || tipo === 'DESPACHO') && (
            <>
              {tipo === 'DESPACHO' && (
                <div>
                  <Label className="text-xs text-slate-500">Origen (Reserva)</Label>
                  <Select value={form.consumidor_origen_id} onValueChange={v => set('consumidor_origen_id', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {consumidores.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}{c.codigo_interno ? ` · ${c.codigo_interno}` : ''}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="text-xs text-slate-500">Consumidor destino</Label>
                <Select value={form.consumidor_id} onValueChange={v => set('consumidor_id', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {consumidores.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}{c.codigo_interno ? ` · ${c.codigo_interno}` : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Combustible</Label>
                <Select value={form.combustible_id} onValueChange={v => set('combustible_id', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {combustibles.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {(tipo === 'RECARGA' || tipo === 'COMPRA') && (
            <div>
              <Label className="text-xs text-slate-500">Monto</Label>
              <Input type="number" step="0.01" value={form.monto} onChange={e => set('monto', e.target.value)} className="mt-1" />
            </div>
          )}

          {(tipo === 'COMPRA' || tipo === 'DESPACHO') && (
            <div>
              <Label className="text-xs text-slate-500">Litros</Label>
              <Input type="number" step="0.01" value={form.litros} onChange={e => set('litros', e.target.value)} className="mt-1" />
            </div>
          )}

          {tipo === 'COMPRA' && (
            <>
              <div>
                <Label className="text-xs text-slate-500">Precio/L</Label>
                <Input type="number" step="0.01" value={form.precio} onChange={e => set('precio', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Odómetro (km)</Label>
                <Input type="number" step="1" value={form.odometro} onChange={e => set('odometro', e.target.value)} className="mt-1" />
              </div>
            </>
          )}

          <div>
            <Label className="text-xs text-slate-500">Referencia</Label>
            <Input value={form.referencia} onChange={e => set('referencia', e.target.value)} placeholder="Nota, factura..." className="mt-1" />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="w-full bg-sky-600 hover:bg-sky-700 h-10"
          >
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}