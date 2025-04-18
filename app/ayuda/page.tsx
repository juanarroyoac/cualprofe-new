// app/ayuda/page.tsx
import { Suspense } from 'react';
import HelpPageClient from './help-page-client';
// No loading spinner import needed

export const metadata = {
  title: 'Ayuda | CuálProfe',
  description: 'Centro de ayuda de CuálProfe'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};

export default function HelpPage() {
  return (
    // Use null as the fallback to render nothing while loading
    <Suspense fallback={null}>
      <HelpPageClient />
    </Suspense>
  );
}