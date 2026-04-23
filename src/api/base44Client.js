import { supabase } from './supabaseClient';

// Mapeo de nombres de campo Base44 → columnas Supabase
const FIELD_MAP = {
  created_date: 'created_date',
  fecha: 'fecha',
};

function createEntity(tableName) {
  return {
    async list(sort, limit) {
      let query = supabase.from(tableName).select('*');
      if (sort) {
        const desc = sort.startsWith('-');
        const raw  = desc ? sort.slice(1) : sort;
        const col  = FIELD_MAP[raw] ?? raw;
        query = query.order(col, { ascending: !desc });
      }
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },

    async create(data) {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },

    async update(id, data) {
      const { data: result, error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },

    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
    },
  };
}

// Objeto base44 con la misma forma que el SDK original.
// Ninguna página necesita cambios: base44.entities.X.list/create/update/delete
export const base44 = {
  entities: {
    Tarjeta:           createEntity('tarjeta'),
    Movimiento:        createEntity('movimiento'),
    Consumidor:        createEntity('consumidor'),
    TipoConsumidor:    createEntity('tipo_consumidor'),
    TipoCombustible:   createEntity('tipo_combustible'),
    PrecioCombustible: createEntity('precio_combustible'),
    Conductor:         createEntity('conductor'),
    Vehiculo:          createEntity('vehiculo'),
    ConfigAlerta:      createEntity('config_alerta'),
  },

  auth: {
    async me() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw Object.assign(new Error('Not authenticated'), { status: 401 });
      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role, full_name')
        .eq('user_id', user.id)
        .single();
      return {
        id:        user.id,
        email:     user.email,
        full_name: roleRow?.full_name ?? user.user_metadata?.full_name ?? user.email,
        role:      roleRow?.role ?? 'auditor',
      };
    },

    async logout() {
      await supabase.auth.signOut();
      window.location.href = '/Login';
    },

    redirectToLogin() {
      window.location.href = '/Login';
    },
  },
};
