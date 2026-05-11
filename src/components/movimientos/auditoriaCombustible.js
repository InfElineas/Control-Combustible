export const AUDITORIA_ESTADO = {
  OK: 'ok',
  EXCESO: 'exceso',
  SIN_CAPACIDAD: 'sin_capacidad',
  SIN_ESTIMACION: 'sin_estimacion',
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const normalizeDate = (value) => {
  if (!value) return null;
  const s = String(value);
  return s.slice(0, 10);
};

const isOnOrBefore = (candidate, limit) => {
  const a = normalizeDate(candidate);
  const b = normalizeDate(limit);
  if (!a || !b) return false;
  return a <= b;
};

export const obtenerCapacidadTanque = (consumidor) => {
  const capacidadReserva = toNumber(consumidor?.datos_tanque?.capacidad_litros);
  if (capacidadReserva && capacidadReserva > 0) return capacidadReserva;
  const capacidadVehiculo = toNumber(consumidor?.datos_vehiculo?.capacidad_tanque);
  return capacidadVehiculo && capacidadVehiculo > 0 ? capacidadVehiculo : null;
};

export const calcularAuditoriaCompra = ({
  movimientos = [],
  consumidorId,
  combustibleId,
  fecha,
  litrosAbastecidos,
  capacidadTanque,
  litrosIniciales = 0,
  excludeMovimientoId,
  nivelTanqueActual,
}) => {
  const litros = toNumber(litrosAbastecidos);
  if (!consumidorId || !combustibleId || !fecha || !litros || litros <= 0) {
    return { estado: AUDITORIA_ESTADO.SIN_ESTIMACION };
  }

  // When the operator provides a physical tank reading, use it directly as the baseline.
  const nivelReal = toNumber(nivelTanqueActual);
  if (nivelReal != null && nivelReal >= 0) {
    const combustibleEstimadoPost = nivelReal + litros;
    if (!capacidadTanque) {
      return { estado: AUDITORIA_ESTADO.SIN_CAPACIDAD, remanenteAntes: nivelReal, combustibleEstimadoPost };
    }
    return {
      estado: combustibleEstimadoPost > capacidadTanque ? AUDITORIA_ESTADO.EXCESO : AUDITORIA_ESTADO.OK,
      remanenteAntes: nivelReal,
      combustibleEstimadoPost,
    };
  }

  const historico = movimientos.filter((m) => {
    if (!m?.id || m.id === excludeMovimientoId) return false;
    if (!isOnOrBefore(m.fecha, fecha)) return false;
    return m.combustible_id === combustibleId;
  });

  // Fuel entering this consumidor: gas-station purchases + DESPACHO received (as destination)
  const comprasPrevias = historico
    .filter((m) => m.tipo === 'COMPRA' && m.consumidor_id === consumidorId)
    .reduce((sum, m) => sum + (toNumber(m.litros) || 0), 0);

  const despachosRecibidos = historico
    .filter((m) => m.tipo === 'DESPACHO' && m.consumidor_id === consumidorId)
    .reduce((sum, m) => sum + (toNumber(m.litros) || 0), 0);

  // Fuel leaving this consumidor: DESPACHO dispatched (as origin/source)
  const despachosDespachados = historico
    .filter((m) => m.tipo === 'DESPACHO' && m.consumidor_origen_id === consumidorId)
    .reduce((sum, m) => sum + (toNumber(m.litros) || 0), 0);

  const totalEntradas = comprasPrevias + despachosRecibidos;
  const initialStock = toNumber(litrosIniciales) || 0;

  if (totalEntradas <= 0 && initialStock <= 0) {
    const estimadoPostInicial = litros;
    if (!capacidadTanque) {
      return {
        estado: AUDITORIA_ESTADO.SIN_CAPACIDAD,
        remanenteAntes: 0,
        combustibleEstimadoPost: estimadoPostInicial,
      };
    }
    return {
      estado: estimadoPostInicial > capacidadTanque ? AUDITORIA_ESTADO.EXCESO : AUDITORIA_ESTADO.OK,
      remanenteAntes: 0,
      combustibleEstimadoPost: estimadoPostInicial,
    };
  }

  const remanenteAntes = Math.max(initialStock + totalEntradas - despachosDespachados, 0);
  const combustibleEstimadoPost = remanenteAntes + litros;

  if (!capacidadTanque) {
    return {
      estado: AUDITORIA_ESTADO.SIN_CAPACIDAD,
      remanenteAntes,
      combustibleEstimadoPost,
    };
  }

  return {
    estado: combustibleEstimadoPost > capacidadTanque ? AUDITORIA_ESTADO.EXCESO : AUDITORIA_ESTADO.OK,
    remanenteAntes,
    combustibleEstimadoPost,
  };
};
