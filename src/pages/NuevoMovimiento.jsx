import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function NuevoMovimiento() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(createPageUrl('Movimientos'), { replace: true });
  }, []);
  return null;
}