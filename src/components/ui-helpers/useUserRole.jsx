import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

export function useUserRole() {
  const [user, setUser]       = useState(/** @type {any} */(null));
  const [role, setRole]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        if (active) setLoading(false);
        return;
      }

      // Obtener rol; si no existe la fila se crea con 'auditor' por defecto
      let { data: roleRow } = await supabase
        .from('user_roles')
        .select('role, full_name')
        .eq('user_id', authUser.id)
        .single();

      if (!roleRow) {
        const { data: created } = await supabase
          .from('user_roles')
          .insert({
            user_id:   authUser.id,
            email:     authUser.email,
            full_name: authUser.user_metadata?.full_name ?? authUser.email,
            role:      'auditor',
          })
          .select('role, full_name')
          .single();
        roleRow = created;
      }

      if (active) {
        setUser({
          id:        authUser.id,
          email:     authUser.email,
          full_name: roleRow?.full_name ?? authUser.user_metadata?.full_name ?? authUser.email,
          role:      roleRow?.role ?? 'auditor',
        });
        setRole(roleRow?.role ?? 'auditor');
        setLoading(false);
      }
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setLoading(true);
      loadUser();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const isSuperAdmin = role === 'superadmin';
  const isOperador   = role === 'operador';
  const isAuditor    = role === 'auditor';
  const isAdmin      = isSuperAdmin;

  return {
    user,
    role,
    loading,
    isAdmin,
    isSuperAdmin,
    isOperador,
    isAuditor,
    canWrite:           isSuperAdmin || isOperador,
    canManageCatalogos: isSuperAdmin || isOperador,
    canManageFlota:     isSuperAdmin || isOperador,
    canImport:          isSuperAdmin || isOperador,
    canViewReportes:    isSuperAdmin || isOperador || isAuditor,
    canDelete:          isSuperAdmin,
    canRead:            isSuperAdmin || isOperador || isAuditor,
  };
}
