// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Suspense } from 'react';
// Import fonts using next/font
import { Nunito_Sans, Poppins, Roboto } from 'next/font/google';
import HeaderWrapper from './components/HeaderWrapper';
import Footer from './components/Footer';
import { AuthProvider } from './contexts/AuthContext';
import { ViewTrackingProvider } from './contexts/ViewTrackingContext';

// Configure fonts
const nunito_sans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-nunito-sans', // CSS Variable name
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins', // CSS Variable name
  display: 'swap',
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto', // CSS Variable name
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CuálProfe? - Calificaciones de profesores',
  description: 'Calificaciones de profesores por estudiantes para estudiantes',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#00248c',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Apply font variables to the html tag for global availability
    <html lang="es" className={`${nunito_sans.variable} ${poppins.variable} ${roboto.variable}`}>
      <head>
        {/*
          Removed manual <link> tags for fonts.
          They are now handled by next/font.
        */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      {/* Apply base font (Roboto) via Tailwind config or directly here if preferred */}
      {/* The font-roboto class assumes you have configured Tailwind to use the CSS variable */}
      <body className="flex flex-col min-h-screen font-roboto">
        {/* Suspense around AuthProvider (using simple text fallback here) */}
        <Suspense fallback={<div>Loading authentication...</div>}>
          <AuthProvider>
            <ViewTrackingProvider>
              {/* Suspense around HeaderWrapper (using a placeholder div) */}
              <Suspense fallback={
                // Adjust h-16 (64px) to match your actual header height
                <div className="h-16 w-full bg-gray-200"></div>
                // OR use null: fallback={null}
                // OR use text: fallback={<div>Cargando encabezado...</div>}
              }>
                <HeaderWrapper />
              </Suspense>

              <div className="page-content-wrapper">
                <main className="flex-grow">
                  {children}
                </main>
              </div>
              <Footer />
            </ViewTrackingProvider>
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}