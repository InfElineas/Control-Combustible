import { Badge } from "@/components/ui/badge";

const FUEL_STYLES = {
  diesel:   'border-amber-300  text-amber-700  bg-amber-50',
  especial: 'border-blue-200   text-blue-700   bg-blue-50',
  regular:  'border-green-200  text-green-700  bg-green-50',
};

function fuelKey(nombre) {
  const n = (nombre || '').toLowerCase();
  if (n.includes('diesel'))   return 'diesel';
  if (n.includes('especial')) return 'especial';
  return 'regular';
}

export default function CombustibleBadge({ nombre, className = '' }) {
  const style = FUEL_STYLES[fuelKey(nombre)];
  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${style} ${className}`}>
      {nombre}
    </Badge>
  );
}
