import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-semibold text-slate-800">{p.value != null ? `${Number(p.value).toFixed(2)} km/L` : '—'}</span>
        </div>
      ))}
    </div>
  );
}

export default function GraficoConsumoHistorico({ consumidor, movimientos, configAlerta }) {
  // Cargas con odómetro y consumo real, ordenadas cronológicamente
  const cargas = movimientos
    .filter(m => (m.tipo === 'COMPRA' || m.tipo === 'DESPACHO') && m.consumidor_id === consumidor.id && m.consumo_real != null)
    .sort((a, b) => a.odometro - b.odometro);

  if (cargas.length < 2) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-slate-400">
        Se necesitan al menos 2 cargas con odómetro para mostrar el historial
      </div>
    );
  }

  const consumoRef = consumidor.datos_vehiculo?.indice_consumo_real
    || consumidor.datos_vehiculo?.indice_consumo_fabricante
    || null;

  const umbralAlerta = configAlerta?.umbral_alerta_pct ?? consumidor.datos_vehiculo?.umbral_alerta_pct ?? 15;
  const umbralCritico = configAlerta?.umbral_critico_pct ?? consumidor.datos_vehiculo?.umbral_critico_pct ?? 30;

  const limiteAlerta = consumoRef ? consumoRef * (1 - umbralAlerta / 100) : null;
  const limiteCritico = consumoRef ? consumoRef * (1 - umbralCritico / 100) : null;

  const data = cargas.map((m, i) => ({
    label: m.fecha,
    'Consumo real': parseFloat(m.consumo_real.toFixed(2)),
    ...(consumoRef ? { 'Referencia': parseFloat(consumoRef.toFixed(2)) } : {}),
    odometro: m.odometro,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          unit=" km/L"
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
        {consumoRef && (
          <Line
            type="monotone"
            dataKey="Referencia"
            stroke="#94a3b8"
            strokeDasharray="5 3"
            strokeWidth={1.5}
            dot={false}
          />
        )}
        <Line
          type="monotone"
          dataKey="Consumo real"
          stroke="#0ea5e9"
          strokeWidth={2}
          dot={{ r: 3, fill: '#0ea5e9', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
        {limiteAlerta != null && (
          <ReferenceLine y={limiteAlerta} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: `Alerta ${umbralAlerta}%`, fontSize: 9, fill: '#f59e0b', position: 'right' }} />
        )}
        {limiteCritico != null && (
          <ReferenceLine y={limiteCritico} stroke="#ef4444" strokeDasharray="4 2" label={{ value: `Crítico ${umbralCritico}%`, fontSize: 9, fill: '#ef4444', position: 'right' }} />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}