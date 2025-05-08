// app/admin/layout.tsx
import type { Metadata } from 'next';
import AdminNav from './components/AdminNav';
import AdminAuthCheck from './components/AdminAuthCheck';

export const metadata: Metadata = {
  title: 'Panel de Administración | CuálProfe',
  description: 'Panel de administración para gestionar CuálProfe',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthCheck>
      <div className="min-h-screen bg-white">
        <div className="flex min-h-screen">
          <AdminNav />
          <div className="flex-1">
            <div className="h-16 border-b border-gray-200 bg-white flex items-center px-8">
              <div className="flex-1">
                <h1 className="text-lg font-semibold text-gray-900">CuálProfe</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button className="text-sm text-gray-600 hover:text-gray-900">Ayuda</button>
                <button className="text-sm text-gray-600 hover:text-gray-900">Configuración</button>
                <div className="h-6 w-px bg-gray-200"></div>
                <button className="text-sm text-gray-600 hover:text-gray-900">Cerrar sesión</button>
              </div>
            </div>
            <div className="p-8">
              <main>{children}</main>
            </div>
          </div>
        </div>
      </div>
    </AdminAuthCheck>
  );
}