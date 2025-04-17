// app/reset-password/page.tsx
import ResetPasswordContent from './ResetPasswordContent';

export const metadata = {
  title: 'Restablecer Contraseña | CuálProfe',
  description: 'Restablece tu contraseña de CuálProfe'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};

export default function ResetPasswordPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h1 className="text-xl font-bold font-poppins">Restablecer Contraseña</h1>
        </div>
        
        <div className="p-6">
          <ResetPasswordContent />
        </div>
      </div>
    </div>
  );
}