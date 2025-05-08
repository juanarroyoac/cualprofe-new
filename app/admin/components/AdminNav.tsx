// app/admin/components/AdminNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'Panel Principal', href: '/admin' },
  { name: 'Usuarios', href: '/admin/users' },
  { name: 'Profesores', href: '/admin/professors' },
  { name: 'Solicitudes', href: '/admin/professors/submissions' },
  { name: 'Calificaciones', href: '/admin/ratings' },
  { name: 'Universidades', href: '/admin/universities' },
  { name: 'Etiquetas', href: '/admin/tags' },
  { name: 'Estadísticas', href: '/admin/analytics' },
  { name: 'Configuración', href: '/admin/settings' },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200">
      <nav className="py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-6 py-2 text-sm font-medium ${
                isActive
                  ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}