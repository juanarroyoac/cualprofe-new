'use client';
import SearchBar from '../components/searchbar';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen w-screen overflow-hidden landing-page">
      {/* Hero section with background image - FULL WIDTH */}
      <div className="relative w-full h-[600px] -mt-16"> {/* Negative margin to connect with header */}
        {/* Background image - stretched to full width */}
        <div className="absolute inset-0 w-full">
          <Image 
            src="/images/university-background.jpg" 
            alt="University Campus" 
            fill
            priority
            className="object-cover w-screen"
            quality={90}
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        </div>
        
        {/* Content container using original SearchBar with pt-48 */}
        <div className="relative z-10 h-full flex items-start justify-center pt-48">
          <div className="w-full max-w-5xl px-4">
            <SearchBar 
              textColor="white" 
              largerHeading={true}
              headlineText="Elige tus profesores con confianza."
              headingWeight="font-bold" 
            />
            
            {/* Add Professor Link */}
            <div className="mt-6 text-center">
              <Link 
                href="/add-professor" 
                className="text-base text-white hover:underline font-medium"
              >
                ¿No encuentras a un profesor? Agrégalo aquí
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Rest of the page content */}
      <main className="py-16 px-4 bg-white">
        <div className="w-full max-w-4xl mx-auto">
          {/* Additional content here */}
        </div>
      </main>
    </div>
  );
}