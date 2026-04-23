import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

const EJ_COMPRA = `[
  {
    "Fecha": "2026-01-03",
    "Accion": "COMPRA",
    "Tarjeta": "9240069992278321",
    "Tipo Combustible": "Diesel",
    "Consumidor": "Camión Mercedes",
    "Precio": 1.30,
    "Compra L": 66.0,
    "Compra $": 85.80,
    "Odometro": 124500
  }
]`;

const EJ_RECARGA = `[
  {
    "Fecha": "2026-01-04",
    "Accion": "RECARGA",
    "Tarjeta": "9240069992278321",
    "Recarga $": 1500.00,
    "Recarga L": null,
    "Referencia": "Factura #001"
  }
]`;

const EJ_DESPACHO = `[
  {
    "Fecha": "2026-01-05",
    "Accion": "DESPACHO",
    "Tipo Combustible": "Diesel",
    "Consumidor Origen": "Tanque Principal",
    "Consumidor": "Camión Ford",
    "Compra L": 40.0,
    "Precio": 1.10
  }
]`;

const CSV_EXAMPLE = `Fecha,Accion,Tarjeta,Tipo Combustible,Consumidor,Precio,Compra L,Compra $,Odometro
2026-01-03,COMPRA,9240069992278321,Diesel,Camión Mercedes,1.30,66,85.80,124500
2026-01-04,RECARGA,9240069992278321,,,,,1500,
2026-01-05,DESPACHO,,Diesel,Camión Ford,1.10,40,,`;

const CAMPOS = [
  { col: 'Fecha', req: true,  desc: 'Obligatorio. Formato: YYYY-MM-DD, DD/MM/YY o DD/MM/YYYY' },
  { col: 'Accion', req: true, desc: 'Obligatorio. Valores: COMPRA, RECARGA o DESPACHO (mayúsculas)' },
  { col: 'Tarjeta', req: false, desc: 'Número de tarjeta. Obligatorio en COMPRA y RECARGA. Debe estar registrada.' },
  { col: 'Tipo Combustible', req: false, desc: 'Nombre exacto del combustible. Obligatorio en COMPRA y DESPACHO.' },
  { col: 'Consumidor', req: false, desc: 'Nombre del consumidor destino. Obligatorio en COMPRA y DESPACHO. Debe coincidir exactamente con el nombre registrado.' },
  { col: 'Consumidor Origen', req: false, desc: 'Solo DESPACHO. Nombre del consumidor origen (tanque/reserva). Debe estar registrado.' },
  { col: 'Precio', req: false, desc: 'Precio por litro. Recomendado en COMPRA y DESPACHO.' },
  { col: 'Compra L', req: false, desc: 'Litros comprados/despachados. Recomendado en COMPRA y DESPACHO.' },
  { col: 'Compra $', req: false, desc: 'Monto de la compra. Obligatorio en COMPRA si no hay precio+litros.' },
  { col: 'Recarga $', req: false, desc: 'Monto de la recarga. Obligatorio en RECARGA.' },
  { col: 'Recarga L', req: false, desc: 'Litros recargados en tarjeta (opcional).' },
  { col: 'Odometro', req: false, desc: 'Lectura del odómetro en km. Recomendado para COMPRA en vehículos.' },
  { col: 'Referencia', req: false, desc: 'Nota o número de factura (opcional).' },
];

export default function ImportGuide() {
  const [open, setOpen] = useState(false);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3 cursor-pointer select-none" onClick={() => setOpen(o => !o)}>
        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-500" />
            Guía de formato para importación
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </CardTitle>
      </CardHeader>

      {open && (
        <CardContent className="space-y-5 pt-0">
          {/* Campos */}
          <div>
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Campos disponibles</h3>
            <div className="space-y-1.5">
              {CAMPOS.map(({ col, req, desc }) => (
                <div key={col} className="flex gap-2 text-xs items-start">
                  <code className="shrink-0 px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-mono">{col}</code>
                  {req && <span className="shrink-0 text-[10px] font-semibold text-red-500 bg-red-50 px-1 rounded">Requerido</span>}
                  <span className="text-slate-500">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ejemplos JSON */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Ejemplo COMPRA (JSON)</h3>
                <pre className="bg-slate-900 text-orange-300 rounded-xl p-3 text-[10px] overflow-x-auto leading-relaxed">{EJ_COMPRA}</pre>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Ejemplo RECARGA (JSON)</h3>
                <pre className="bg-slate-900 text-emerald-400 rounded-xl p-3 text-[10px] overflow-x-auto leading-relaxed">{EJ_RECARGA}</pre>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Ejemplo DESPACHO (JSON)</h3>
                <pre className="bg-slate-900 text-purple-400 rounded-xl p-3 text-[10px] overflow-x-auto leading-relaxed">{EJ_DESPACHO}</pre>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Ejemplo CSV (multitipo)</h3>
                <pre className="bg-slate-900 text-sky-400 rounded-xl p-3 text-[10px] overflow-x-auto leading-relaxed">{CSV_EXAMPLE}</pre>
              </div>
            </div>
          </div>

          {/* Notas importantes */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 space-y-1">
            <p className="font-semibold">Notas importantes:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li><b>Consumidor</b>: el nombre debe coincidir <i>exactamente</i> con el registrado en el sistema (sensible a mayúsculas/acentos). Los no encontrados generarán error.</li>
              <li><b>Tarjetas</b>: deben estar previamente registradas en Catálogos → Tarjetas.</li>
              <li><b>Combustibles</b>: el nombre debe coincidir exactamente con los registrados en Catálogos → Combustibles.</li>
              <li>Los registros con errores se omiten; los que tienen advertencias se importan igualmente.</li>
              <li>Para calcular <b>litros</b> en COMPRA: se usa <code className="bg-amber-100 px-1 rounded">Compra L</code> directamente, o <code className="bg-amber-100 px-1 rounded">Compra $ / Precio</code> si hay precio vigente.</li>
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
}