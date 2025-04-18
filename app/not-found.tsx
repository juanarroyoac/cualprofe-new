import { Suspense } from 'react';
import NotFoundContent from './not-found-content';

export const metadata = {
  title: 'Página No Encontrada - CuálProfe',
  description: 'La página que estás buscando no existe'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1
};

export default function NotFound() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <NotFoundContent />
    </Suspense>
  );
}