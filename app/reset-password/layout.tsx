import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Restablecer Contraseña | CuálProfe',
  description: 'Restablece tu contraseña de CuálProfe',
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