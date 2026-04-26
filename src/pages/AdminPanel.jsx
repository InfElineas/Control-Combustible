import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { useUserRole } from '@/components/ui-helpers/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Users, Shield, Activity, ShieldCheck, ShieldAlert,
  Pencil, Check, X, Search, ChevronLeft, ChevronRight
} from 'lucide-react';

// ── Constantes ───────────────────────────────────────────────────────────────

const ROLES = ['superadmin', 'operador', 'auditor', 'economico'];

const ROLE_META = {
  superadmin: { label: 'Super Admin', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  operador:   { label: 'Operador',    color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  auditor:    { label: 'Auditor',     color: 'bg-violet-100 text-violet-700 border-violet-200' },
  economico:  { label: 'Económico',   color: 'bg-amber-100 text-amber-700 border-amber-200' },
};

const PERMISOS_TABLA = [
  { permiso: 'Ver dashboard y resúmenes',         desc: '',                                   superadmin: true,  operador: true,  auditor: true,  economico: true  },
  { permiso: 'Ver movimientos',                   desc: '',                                   superadmin: true,  operador: true,  auditor: true,  economico: true  },
  { permiso: 'Registrar compras y despachos',     desc: 'Crear nuevos movimientos',           superadmin: true,  operador: true,  auditor: false, economico: false },
  { permiso: 'Ver y gestionar consumidores',      desc: 'Vehículos, equipos, almacenamiento', superadmin: true,  operador: true,  auditor: false, economico: false },
  { permiso: 'Ver reportes',                      desc: '',                                   superadmin: true,  operador: true,  auditor: true,  economico: true  },
  { permiso: 'Gestionar catálogos',               desc: 'Tipos, combustibles, tarjetas',      superadmin: true,  operador: false, auditor: false, economico: false },
  { permiso: 'Importar datos',                    desc: 'CSV / JSON masivo',                  superadmin: true,  operador: true,  auditor: false, economico: false },
  { permiso: 'Gestionar finanzas',                desc: 'Recargas, precios, saldos',          superadmin: true,  operador: false, auditor: false, economico: true  },
  { permiso: 'Eliminar registros',                desc: '',                                   superadmin: true,  operador: false, auditor: false, economico: false },
  { permiso: 'Panel de administración del sitio', desc: 'Este panel',                         superadmin: true,  operador: false, auditor: false, economico: false },
];

const TIPO_BADGE = {
  COMPRA:   'border-orange-200 text-orange-700 bg-orange-50',
  DESPACHO: 'border-purple-200 text-purple-700 bg-purple-50',
  RECARGA:  'border-emerald-200 text-emerald-700 bg-emerald-50',
};

const AUD_PAGE = 50;

// ── Componente principal ─────────────────────────────────────────────────────

export default function AdminPanel() {
  const { isSuperAdmin, loading } = useUserRole();
  const [tab, setTab] = useState('usuarios');

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="py-20 text-center space-y-3">
        <ShieldAlert className="w-12 h-12 text-red-300 mx-auto" />
        <p className="text-slate-500 text-sm">Acceso denegado. Solo superadmin puede acceder a este panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-sm">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Administración del Sistema</h1>
          <p className="text-xs text-slate-400">Gestión de accesos, roles y trazabilidad. Visible solo para superadmin.</p>
        </div>
      </div>

      <div className="flex gap-0.5 flex-wrap border-b border-slate-200 dark:border-slate-700">
        {[
          { value: 'usuarios',  label: 'Usuarios',                icon: <Users      className="w-3.5 h-3.5" /> },
          { value: 'permisos',  label: 'Roles y Permisos',        icon: <ShieldCheck className="w-3.5 h-3.5" /> },
          { value: 'auditoria', label: 'Auditoría de Movimientos', icon: <Activity   className="w-3.5 h-3.5" /> },
        ].map(({ value: v, label, icon }) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t border-b-2 transition-colors -mb-px ${
              tab === v
                ? 'border-sky-500 text-sky-700 dark:text-sky-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      <Tabs value={tab}>
        <TabsContent value="usuarios"  className="mt-4"><UsuariosTab /></TabsContent>
        <TabsContent value="permisos"  className="mt-4"><PermisosTab /></TabsContent>
        <TabsContent value="auditoria" className="mt-4"><AuditoriaTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ── Tab: Usuarios ────────────────────────────────────────────────────────────

function UsuariosTab() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState({});
  const [search, setSearch] = useState('');

  const { data: users = [], isLoading, error: usersError } = useQuery({
    queryKey: ['admin_user_roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, email, full_name, role, created_date')
        .order('created_date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    retry: 1,
    staleTime: 60_000,
  });

  const updateMut = useMutation({
    mutationFn: async ({ userId, role }) => {
      const { error } = await supabase.from('user_roles').update({ role }).eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin_user_roles'] });
      setEditing(p => { const n = { ...p }; delete n[userId]; return n; });
      toast.success('Rol actualizado correctamente');
    },
    onError: () => toast.error('Error al actualizar el rol'),
  });

  const filtered = users.filter(u =>
    !search || `${u.full_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const countByRole = ROLES.reduce((acc, r) => {
    acc[r] = users.filter(u => u.role === r).length;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* KPIs de roles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ROLES.map(r => {
          const m = ROLE_META[r];
          return (
            <Card key={r} className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-sm font-bold ${m.color}`}>
                  {countByRole[r] ?? 0}
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">{m.label}</p>
                  <p className="text-xs text-slate-600">{countByRole[r] === 1 ? '1 usuario' : `${countByRole[r] ?? 0} usuarios`}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {usersError && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-600">Error cargando usuarios. Reintente o contacte al administrador.</p>
        </div>
      )}

      {/* Lista de usuarios */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 px-4 pt-3 flex flex-row items-center gap-3">
          <CardTitle className="text-sm font-semibold text-slate-600 flex-1">
            {filtered.length} usuario{filtered.length !== 1 ? 's' : ''}
          </CardTitle>
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="pl-8 h-7 text-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-slate-400">Cargando usuarios...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">Sin resultados</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(u => {
                const m = ROLE_META[u.role] ?? { label: u.role, color: 'bg-slate-100 text-slate-600' };
                const isEditing = u.user_id in editing;
                const newRole = editing[u.user_id];
                const initial = (u.full_name || u.email || '?')[0].toUpperCase();

                return (
                  <div key={u.user_id} className="flex items-center gap-3 px-4 py-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-slate-600">{initial}</span>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate leading-tight">
                        {u.full_name || u.email}
                      </p>
                      {u.full_name && (
                        <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                      )}
                    </div>
                    {/* Role control */}
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Select
                          value={newRole}
                          onValueChange={v => setEditing(p => ({ ...p, [u.user_id]: v }))}
                        >
                          <SelectTrigger className="h-7 text-xs w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map(r => (
                              <SelectItem key={r} value={r}>{ROLE_META[r]?.label ?? r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="icon" className="h-7 w-7 bg-sky-600 hover:bg-sky-700"
                          onClick={() => updateMut.mutate({ userId: u.user_id, role: newRole })}
                          disabled={!newRole || updateMut.isPending}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon" variant="ghost" className="h-7 w-7"
                          onClick={() => setEditing(p => { const n = { ...p }; delete n[u.user_id]; return n; })}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={`text-[10px] ${m.color}`}>{m.label}</Badge>
                        <Button
                          size="icon" variant="ghost" className="h-7 w-7 text-slate-300 hover:text-slate-600"
                          onClick={() => setEditing(p => ({ ...p, [u.user_id]: u.role }))}
                          title="Cambiar rol"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab: Roles y Permisos ────────────────────────────────────────────────────

function PermisosTab() {
  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Permiso
                </th>
                {ROLES.map(r => {
                  const m = ROLE_META[r];
                  return (
                    <th key={r} className="text-center px-3 py-3">
                      <Badge variant="outline" className={`text-[10px] ${m.color}`}>{m.label}</Badge>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {PERMISOS_TABLA.map(p => (
                <tr key={p.permiso} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2.5">
                    <p className="text-slate-700 font-medium">{p.permiso}</p>
                    {p.desc && <p className="text-[10px] text-slate-400">{p.desc}</p>}
                  </td>
                  {ROLES.map(r => (
                    <td key={r} className="px-3 py-2.5 text-center">
                      {p[r]
                        ? <span className="text-emerald-600 font-bold text-base leading-none">✓</span>
                        : <span className="text-slate-200 text-sm">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Tab: Auditoría ───────────────────────────────────────────────────────────

function AuditoriaTab() {
  const [page, setPage] = useState(1);
  const [filtroTipo, setFiltroTipo] = useState('all');

  const { data: movimientos = [], isLoading } = useQuery({
    queryKey: ['movimientos_admin_audit'],
    queryFn: () => base44.entities.Movimiento.list('-fecha', 1000),
    staleTime: 60_000,
  });

  const filtered = filtroTipo === 'all'
    ? movimientos
    : movimientos.filter(m => m.tipo === filtroTipo);

  const totalPages = Math.max(1, Math.ceil(filtered.length / AUD_PAGE));
  const paginated  = filtered.slice((page - 1) * AUD_PAGE, page * AUD_PAGE);

  const totales = {
    compras:   movimientos.filter(m => m.tipo === 'COMPRA').length,
    despachos: movimientos.filter(m => m.tipo === 'DESPACHO').length,
    recargas:  movimientos.filter(m => m.tipo === 'RECARGA').length,
  };

  return (
    <div className="space-y-3">
      {/* KPIs rápidos */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Compras',   count: totales.compras,   tipo: 'COMPRA',   cls: 'text-orange-600 bg-orange-50 border-orange-100' },
          { label: 'Despachos', count: totales.despachos, tipo: 'DESPACHO', cls: 'text-purple-600 bg-purple-50 border-purple-100' },
          { label: 'Recargas',  count: totales.recargas,  tipo: 'RECARGA',  cls: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
        ].map(k => (
          <button
            key={k.tipo}
            onClick={() => { setFiltroTipo(filtroTipo === k.tipo ? 'all' : k.tipo); setPage(1); }}
            className={`rounded-xl border p-3 text-left transition-all ${filtroTipo === k.tipo ? k.cls + ' ring-2 ring-offset-1' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
          >
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">{k.label}</p>
            <p className={`text-lg font-bold mt-0.5 ${filtroTipo === k.tipo ? '' : 'text-slate-800'}`}>{k.count}</p>
          </button>
        ))}
      </div>

      {/* Tabla */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-2 px-4 pt-3 flex flex-row items-center gap-2">
          <CardTitle className="text-sm font-semibold text-slate-600 flex-1">
            {filtered.length} movimientos{filtroTipo !== 'all' ? ` · ${filtroTipo}` : ''}
          </CardTitle>
          {totalPages > 1 && (
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="outline" size="icon" className="h-7 w-7"
                onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs text-slate-500 tabular-nums px-1">{page}/{totalPages}</span>
              <Button variant="outline" size="icon" className="h-7 w-7"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-slate-400">Cargando movimientos...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[11px] text-slate-400 uppercase tracking-wide">
                    <th className="text-left px-4 py-2.5">Fecha</th>
                    <th className="text-left px-4 py-2.5">Tipo</th>
                    <th className="text-left px-4 py-2.5">Consumidor</th>
                    <th className="text-left px-4 py-2.5 hidden sm:table-cell">Combustible</th>
                    <th className="text-right px-4 py-2.5">Litros</th>
                    <th className="text-right px-4 py-2.5 hidden md:table-cell">Monto</th>
                    <th className="text-left px-4 py-2.5 hidden lg:table-cell">Referencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginated.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-2.5 text-slate-600 tabular-nums font-medium">{m.fecha}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className={`text-[10px] ${TIPO_BADGE[m.tipo] ?? ''}`}>
                          {m.tipo}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700 max-w-[140px] truncate">
                        {m.consumidor_nombre || m.vehiculo_chapa || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 hidden sm:table-cell">
                        {m.combustible_nombre || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-800 font-semibold tabular-nums">
                        {m.litros != null ? `${Number(m.litros).toFixed(1)} L` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-500 tabular-nums hidden md:table-cell">
                        {m.monto != null ? `$${Number(m.monto).toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 hidden lg:table-cell max-w-[120px] truncate">
                        {m.referencia || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
