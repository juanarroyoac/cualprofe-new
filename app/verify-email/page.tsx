// app/verify-email/page.tsx
import { Suspense } from 'react';
import VerifyEmailContent from './VerifyEmailContent';

export const metadata = {
  title: 'Verificación de Email | CuálProfe',
  description: 'Verificación de tu correo electrónico en CuálProfe'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};

export default function VerifyEmailPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h1 className="text-xl font-bold font-poppins">Verificación de correo electrónico</h1>
        </div>
        
        <div className="p-6">
          <Suspense fallback={
            <div className="flex flex-col items-center py-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mb-4"></div>
              <p className="text-gray-600">Cargando...</p>
            </div>
          }>
            <VerifyEmailContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}