'use client';

import React, { Suspense, useEffect, useState } from 'react'; 
import './globals.css';
import 'aos/dist/aos.css';
import type { Metadata } from 'next';
import AOS from 'aos';

import { Nunito_Sans, Poppins, Inter } from 'next/font/google';
import HeaderWrapper from './components/HeaderWrapper';
import Footer from './components/Footer';
import { AuthProvider } from './contexts/AuthContext';
import { ViewTrackingProvider } from './contexts/ViewTrackingContext';
import { Analytics } from "@vercel/analytics/react";
import AOSInitializer from './components/AOSInitializer';

// Font definitions stay the same
const nunito_sans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-nunito-sans',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-inter',
  display: 'swap',
});

// Metadata can't be exported from client components, so we'll need to handle this differently

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Use client-side path detection instead
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  
  useEffect(() => {
    const pathname = window.location.pathname;
    setIsAdminRoute(pathname.startsWith('/admin'));
  }, []);

  return (
    <html lang="es" className={`${nunito_sans.variable} ${poppins.variable} ${inter.variable}`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="flex flex-col min-h-screen font-inter">
        <Suspense fallback={<div>Loading authentication...</div>}>
          <AuthProvider>
            <ViewTrackingProvider>
              <Suspense fallback={null}>
                <AOSInitializer />
              </Suspense>

              {!isAdminRoute && (
                <Suspense fallback={<div className="h-16 w-full bg-gray-200"></div>}>
                  <HeaderWrapper />
                </Suspense>
              )}

              <div className="page-content-wrapper">
                <main className="flex-grow">
                  {children}
                </main>
              </div>
              
              {!isAdminRoute && <Footer />}
            </ViewTrackingProvider>
          </AuthProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}