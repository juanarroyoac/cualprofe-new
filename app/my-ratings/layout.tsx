import { ReactNode } from 'react';
import Head from 'next/head';

interface LayoutProps {
  children: ReactNode;
}

export default function MyRatingsLayout({
  children,
}: LayoutProps) {
  return (
    <>
      <Head>
        <title>Mis Calificaciones | CuálProfe</title>
        <meta name="description" content="Revisa todas tus calificaciones de profesores en CuálProfe" />
      </Head>
      {children}
    </>
  );
}