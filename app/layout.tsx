import './globals.css';
import type { Metadata } from 'next';
import HeaderWrapper from '../components/HeaderWrapper';
import Footer from '../components/Footer';
import { AuthProvider } from '../contexts/AuthContext';

export const metadata: Metadata = {
  title: 'CuálProfe? - Calificaciones de profesores',
  description: 'Calificaciones de profesores por estudiantes para estudiantes',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;700;900&family=Poppins:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#00248c" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="flex flex-col min-h-screen font-roboto">
        <AuthProvider>
          <HeaderWrapper />
          <div className="page-content-wrapper">
            <main className="flex-grow">
              {children}
            </main>
          </div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}