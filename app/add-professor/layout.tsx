import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Agregar un Nuevo Profesor | CuálProfe',
  description: 'Formulario para agregar un profesor a la base de datos de CuálProfe',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1
};

export default function AddProfessorLayout({
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