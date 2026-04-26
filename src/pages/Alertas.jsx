import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Settings2, Mail, ChevronDown, ChevronUp, Send, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import GraficoConsumoHistorico from '@/components/alertas/GraficoConsumoHistorico';

function estadoConsumo(consumoReal, consumoRef, umbralAlerta, umbralCritico) {
  if (!consumoRef || consumoReal == null) return null;
  const desv = ((consumoRef - consumoReal) / consumoRef) * 100;
  if (desv >= umbralCritico) return { nivel: 'critico', desv };
  if (desv >= umbralAlerta) return { nivel: 'alerta', desv };
  return { nivel: 'ok', desv };
}

function AlertaRow({ consumidor, movimientos, config, onConfigEdit }) {
  const [expandido, setExpandido] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);

  const handleEnviarEmail = async (e) => {
    e.stopPropagation();
    if (!config?.email_destino) return;
    setEnviandoEmail(true);
    await base44.integrations.Core.SendEmail({
      to: config.email_destino,
      subject: `⚠ Alerta de consumo crítico — ${consumidor.nombre}`,
      body: `Se ha detectado un consumo crítico en el consumidor: ${consumidor.nombre}${consumidor.codigo_interno ? ` (${consumidor.codigo_interno})` : ''}.\n\nConsulte el sistema de control de combustible para más detalles.`,
    });
    toast.success(`Email enviado a ${config.email_destino}`);
    setEnviandoEmail(false);
  };

  const movsConConsumo = movimientos
    .filter(m => m.tipo === 'COMPRA' && m.consumidor_id === consumidor.id && m.consumo_real != null)
    .sort((a, b) => b.odometro - a.odometro);

  const ultimoConsumo = movsConConsumo[0]?.consumo_real ?? null;
  const consumoRef = consumidor.datos_vehiculo?.indice_consumo_real
    || consumidor.datos_vehiculo?.indice_consumo_fabricante
    || null;

  const umbralAlerta = config?.umbral_alerta_pct ?? consumidor.datos_vehiculo?.umbral_alerta_pct ?? 15;
  const umbralCritico = config?.umbral_critico_pct ?? consumidor.datos_vehiculo?.umbral_critico_pct ?? 30;

  const estado = estadoConsumo(ultimoConsumo, consumoRef, umbralAlerta, umbralCritico);

  const colorEstado = estado?.nivel === 'critico' ? 'text-red-600 bg-red-50 border-red-200'
    : estado?.nivel === 'alerta' ? 'text-amber-600 bg-amber-50 border-amber-200'
    : estado?.nivel === 'ok' ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : 'text-slate-500 bg-slate-100 border-slate-200 dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-400';

  const labelEstado = estado?.nivel === 'critico' ? 'Crítico'
    : estado?.nivel === 'alerta' ? 'Alerta'
    : estado?.nivel === 'ok' ? 'Normal'
    : 'Sin datos';

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50/60 transition-colors"
        onClick={() => setExpandido(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-700 truncate">{consumidor.nombre}</p>
            {consumidor.codigo_interno && (
              <span className="text-[11px] text-slate-400 font-mono shrink-0">{consumidor.codigo_interno}</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">{consumidor.tipo_consumidor_nombre || 'Sin tipo'}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {ultimoConsumo != null && (
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400">Último consumo</p>
              <p className="text-sm font-semibold text-slate-700">{ultimoConsumo.toFixed(2)} km/L</p>
              {consumoRef && <p className="text-[10px] text-slate-400">ref: {consumoRef.toFixed(2)}</p>}
            </div>
          )}
          <Badge variant="outline" className={`text-[10px] border ${colorEstado}`}>
            {estado == null && <HelpCircle className="w-2.5 h-2.5 mr-1" />}
            {estado != null && estado.nivel !== 'ok' && <AlertTriangle className="w-2.5 h-2.5 mr-1" />}
            {labelEstado}
            {estado != null && estado.nivel !== 'ok' && <span className="ml-1">({estado.desv.toFixed(0)}%)</span>}
          </Badge>
          {config?.alerta_email && config?.email_destino && estado?.nivel === 'critico' && (
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7 text-sky-500 hover:text-sky-700"
              disabled={enviandoEmail}
              onClick={handleEnviarEmail}
              title="Enviar alerta por email"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 text-slate-400 hover:text-sky-600"
            onClick={e => { e.stopPropagation(); onConfigEdit(consumidor); }}
          >
            <Settings2 className="w-3.5 h-3.5" />
          </Button>
          {expandido ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {expandido && (
        <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/30">
          <div className="pt-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Historial consumo real vs referencia
            </p>
            <GraficoConsumoHistorico
              consumidor={consumidor}
              movimientos={movimientos}
              configAlerta={config}
            />
          </div>
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
            <span>Umbral alerta: <b className="text-amber-600">{umbralAlerta}%</b></span>
            <span>Umbral crítico: <b className="text-red-600">{umbralCritico}%</b></span>
            {config?.alerta_email && config?.email_destino && (
              <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-sky-500" /> {config.email_destino}</span>
            )}
            <span>{movsConConsumo.length} cargas con odómetro registradas</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfigAlertaDialog({ consumidor, config, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    umbral_alerta_pct: config?.umbral_alerta_pct ?? 15,
    umbral_critico_pct: config?.umbral_critico_pct ?? 30,
    alerta_email: config?.alerta_email ?? false,
    email_destino: config?.email_destino ?? '',
    activa: config?.activa ?? true,
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (config?.id) {
        return base44.entities.ConfigAlerta.update(config.id, data);
      } else {
        return base44.entities.ConfigAlerta.create({
          ...data,
          consumidor_id: consumidor.id,
          consumidor_nombre: consumidor.nombre,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configAlertas'] });
      toast.success('Configuración guardada');
      onClose();
    },
  });

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Configurar alertas — {consumidor.nombre}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Umbral alerta (%)</Label>
              <Input
                type="number" min={1} max={100} step={1}
                value={form.umbral_alerta_pct}
                onChange={e => set('umbral_alerta_pct', parseFloat(e.target.value))}
                className="mt-1"
              />
              <p className="text-[10px] text-amber-600 mt-0.5">Alerta visual (amarillo)</p>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Umbral crítico (%)</Label>
              <Input
                type="number" min={1} max={100} step={1}
                value={form.umbral_critico_pct}
                onChange={e => set('umbral_critico_pct', parseFloat(e.target.value))}
                className="mt-1"
              />
              <p className="text-[10px] text-red-500 mt-0.5">Alerta crítica (rojo)</p>
            </div>
          </div>

          <div className="border border-slate-100 rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-sky-500" />
                <Label className="text-sm">Alerta por email</Label>
              </div>
              <Switch checked={form.alerta_email} onCheckedChange={v => set('alerta_email', v)} />
            </div>
            {form.alerta_email && (
              <div>
                <Label className="text-xs text-slate-500">Email de destino</Label>
                <Input
                  type="email"
                  value={form.email_destino}
                  onChange={e => set('email_destino', e.target.value)}
                  placeholder="responsable@empresa.com"
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button
              size="sm"
              className="bg-sky-600 hover:bg-sky-700"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate(form)}
            >
              Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Alertas() {
  const { data: consumidores = [] } = useQuery({ queryKey: ['consumidores'], queryFn: () => base44.entities.Consumidor.list() });
  const { data: movimientos = [] } = useQuery({ queryKey: ['movimientos'], queryFn: () => base44.entities.Movimiento.list('-fecha', 1000) });
  const { data: configAlertas = [] } = useQuery({ queryKey: ['configAlertas'], queryFn: () => base44.entities.ConfigAlerta.list() });

  const [editando, setEditando] = useState(null); // consumidor a editar
  const [tab, setTab] = useState('todas');

  const consumidoresActivos = consumidores.filter(c => c.activo);

  // Enriquecer consumidores con su config y estado
  const consumidoresConEstado = useMemo(() => {
    return consumidoresActivos.map(c => {
      const config = configAlertas.find(ca => ca.consumidor_id === c.id) ?? null;
      const movsConConsumo = movimientos.filter(m =>
        m.tipo === 'COMPRA' && m.consumidor_id === c.id && m.consumo_real != null
      ).sort((a, b) => b.odometro - a.odometro);

      const ultimoConsumo = movsConConsumo[0]?.consumo_real ?? null;
      const consumoRef = c.datos_vehiculo?.indice_consumo_real || c.datos_vehiculo?.indice_consumo_fabricante || null;
      const umbralAlerta = config?.umbral_alerta_pct ?? c.datos_vehiculo?.umbral_alerta_pct ?? 15;
      const umbralCritico = config?.umbral_critico_pct ?? c.datos_vehiculo?.umbral_critico_pct ?? 30;
      const estado = estadoConsumo(ultimoConsumo, consumoRef, umbralAlerta, umbralCritico);
      return { ...c, config, estado, ultimoConsumo, consumoRef };
    });
  }, [consumidoresActivos, configAlertas, movimientos]);

  const criticos = consumidoresConEstado.filter(c => c.estado?.nivel === 'critico');
  const enAlerta = consumidoresConEstado.filter(c => c.estado?.nivel === 'alerta');
  const normales = consumidoresConEstado.filter(c => c.estado?.nivel === 'ok');
  const sinDatos = consumidoresConEstado.filter(c => !c.estado);

  const sections = useMemo(() => {
    if (tab === 'normales') return normales.length ? [{ title: '', color: '', items: normales }] : [];
    const groups = tab === 'criticos'
      ? [
          { title: 'Crítico',   color: 'text-red-500',    items: criticos  },
          { title: 'En alerta', color: 'text-amber-500',  items: enAlerta  },
          { title: 'Sin datos', color: 'text-slate-400',  items: sinDatos  },
        ]
      : [
          { title: 'Crítico',   color: 'text-red-500',    items: criticos  },
          { title: 'En alerta', color: 'text-amber-500',  items: enAlerta  },
          { title: 'Sin datos', color: 'text-slate-400',  items: sinDatos  },
          { title: 'Normal',    color: 'text-emerald-500',items: normales  },
        ];
    return groups.filter(g => g.items.length > 0);
  }, [tab, criticos, enAlerta, sinDatos, normales]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Alertas de consumo</h1>
        <p className="text-xs text-slate-400">Monitoreo y configuración de umbrales por consumidor</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className={`border-0 shadow-sm ${criticos.length > 0 ? 'ring-1 ring-red-200 bg-red-50/20' : ''}`}>
          <CardContent className="p-4">
            <p className="text-[11px] text-slate-400 uppercase tracking-wide">Críticos</p>
            <p className={`text-2xl font-bold mt-1 ${criticos.length > 0 ? 'text-red-500' : 'text-slate-300'}`}>{criticos.length}</p>
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-sm ${enAlerta.length > 0 ? 'ring-1 ring-amber-200 bg-amber-50/20' : ''}`}>
          <CardContent className="p-4">
            <p className="text-[11px] text-slate-400 uppercase tracking-wide">En alerta</p>
            <p className={`text-2xl font-bold mt-1 ${enAlerta.length > 0 ? 'text-amber-500' : 'text-slate-300'}`}>{enAlerta.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-[11px] text-slate-400 uppercase tracking-wide">Normales</p>
            <p className="text-2xl font-bold mt-1 text-emerald-500">{normales.length}</p>
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-sm ${sinDatos.length > 0 ? 'ring-1 ring-slate-200' : ''}`}>
          <CardContent className="p-4">
            <p className="text-[11px] text-slate-400 uppercase tracking-wide">Sin datos</p>
            <p className={`text-2xl font-bold mt-1 ${sinDatos.length > 0 ? 'text-slate-500' : 'text-slate-300'}`}>{sinDatos.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtro rápido */}
      <div className="flex gap-0.5 flex-wrap border-b border-slate-200 dark:border-slate-700">
        {[
          { value: 'todas',   label: `Todos (${consumidoresConEstado.length})` },
          { value: 'criticos', label: `Con alertas (${criticos.length + enAlerta.length + sinDatos.length})`, alert: (criticos.length + enAlerta.length + sinDatos.length) > 0 },
          { value: 'normales', label: `Normales (${normales.length})` },
        ].map(({ value, label, alert }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-t border-b-2 transition-colors -mb-px ${
              tab === value
                ? 'border-sky-500 text-sky-700 dark:text-sky-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {alert && <AlertTriangle className="w-3 h-3" />}
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-5">
        {sections.length === 0 && (
          <p className="text-sm text-slate-400 py-6 text-center">No hay consumidores en esta categoría</p>
        )}
        {sections.map((section, i) => (
          <div key={section.title ?? i}>
            {section.title && (
              <div className="flex items-center gap-2 px-1 mb-2">
                <span className={`text-[10px] font-semibold uppercase tracking-widest ${section.color}`}>{section.title}</span>
                <div className="flex-1 border-t border-slate-100 dark:border-slate-700/50" />
                <span className="text-[10px] text-slate-400">{section.items.length}</span>
              </div>
            )}
            <div className="space-y-2">
              {section.items.map(c => (
                <AlertaRow
                  key={c.id}
                  consumidor={c}
                  movimientos={movimientos}
                  config={c.config}
                  onConfigEdit={setEditando}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {editando && (
        <ConfigAlertaDialog
          consumidor={editando}
          config={configAlertas.find(ca => ca.consumidor_id === editando.id) ?? null}
          onClose={() => setEditando(null)}
        />
      )}
    </div>
  );
}