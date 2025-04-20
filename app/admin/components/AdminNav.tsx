// app/admin/components/AdminNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'Panel Principal', href: '/admin' },
  { name: 'Usuarios', href: '/admin/users' },
  { name: 'Profesores', href: '/admin/professors' },
  { name: 'Solicitudes', href: '/admin/professors/submissions' },
  { name: 'Universidades', href: '/admin/universities' },
  { name: 'Etiquetas', href: '/admin/tags' },
  { name: 'Estadísticas', href: '/admin/analytics' },
  { name: 'Configuración', href: '/admin/settings' },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-48 bg-white border-r border-gray-200 shadow-sm">
      <div className="flex flex-col h-full">
        <div className="flex items-center px-4 h-16 border-b border-gray-200">
          <span className="text-xl font-semibold text-gray-800">Admin</span>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <Link
            href="/"
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <span>Volver al sitio</span>
          </Link>
          <Link
            href="/admin/logout"
            className="flex items-center px-4 py-2 mt-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
          >
            <span>Cerrar sesión</span>
          </Link>
        </div>
      </div>
    </div>
  );
}