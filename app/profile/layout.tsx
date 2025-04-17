import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Mi Perfil | CuálProfe',
  description: 'Gestiona tu perfil y configuración en CuálProfe',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-gray-50 pt-16">
      {children}
    </main>
  );
}