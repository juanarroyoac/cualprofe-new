import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verificar Correo | CuálProfe',
  description: 'Verificación de correo electrónico en CuálProfe',
};

export default function VerifyEmailLayout({
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