import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Fuel, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Fuel className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-5xl font-bold text-slate-300 mb-2">404</h1>
        <p className="text-slate-500 mb-6">Página no encontrada</p>
        <Link to={createPageUrl('Dashboard')}>
          <Button className="gap-2 bg-sky-600 hover:bg-sky-700">
            <ArrowLeft className="w-4 h-4" /> Ir al Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}