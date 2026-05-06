import { supabase } from './supabaseClient';

let _cached = null;
let _expiry  = 0;

async function getCachedUser() {
  if (_cached && Date.now() < _expiry) return _cached;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { _cached = null; return null; }
    const { data: row } = await supabase
      .from('user_roles')
      .select('full_name')
      .eq('user_id', user.id)
      .single();
    _cached = {
      user_id:    user.id,
      user_email: user.email,
      user_name:  row?.full_name ?? user.user_metadata?.full_name ?? user.email,
    };
    _expiry = Date.now() + 5 * 60 * 1000;
  } catch {
    _cached = null;
  }
  return _cached;
}

// Never throws — audit failures must never break the main app flow.
export async function logAudit({ action, entityType, entityId, entityLabel, payload, metadata }) {
  try {
    const user = await getCachedUser();
    await supabase.from('audit_log').insert({
      user_id:      user?.user_id    ?? null,
      user_email:   user?.user_email ?? null,
      user_name:    user?.user_name  ?? null,
      action,
      entity_type:  entityType,
      entity_id:    entityId != null ? String(entityId) : null,
      entity_label: entityLabel ?? null,
      payload:      payload    ?? null,
      metadata:     metadata   ?? null,
    });
  } catch (err) {
    console.warn('[audit]', err?.message ?? err);
  }
}
