import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Restablecer Contraseña | CuálProfe',
  description: 'Restablece tu contraseña de CuálProfe',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1
};

export default function ResetPasswordLayout({
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