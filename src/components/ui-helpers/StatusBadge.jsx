import React from 'react';
import { Badge } from "@/components/ui/badge";

export default function StatusBadge({ active }) {
  return (
    <Badge className={active 
      ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
      : "bg-slate-100 text-slate-500 border-slate-200"
    }>
      {active ? "Activa" : "Inactiva"}
    </Badge>
  );
}