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
      {/* Custom admin layout without header */}
      <div className="min-h-screen bg-slate-50">
        <div className="flex min-h-screen">
          <AdminNav />
          <div className="flex-1 p-6 ml-48">
            <main>{children}</main>
          </div>
        </div>
      </div>
    </AdminAuthCheck>
  );
}