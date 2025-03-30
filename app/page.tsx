'use client';
import SearchBar from '../components/searchbar';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen w-full overflow-hidden landing-page">
      {/* Hero section with background image - FULL WIDTH */}
      <div className="relative w-full h-[500px] sm:h-[600px] -mt-16"> {/* Reduced height on mobile */}
        {/* Background image - stretched to full width */}
        <div className="absolute inset-0 w-full">
          <Image 
            src="/images/university-background.jpg" 
            alt="University Campus" 
            fill
            priority
            className="object-cover w-screen"
            quality={85} /* Reduced quality slightly for better mobile performance */
            sizes="100vw" /* Responsive sizing */
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black bg-opacity-70"></div> {/* Increased opacity for mobile readability */}
        </div>
        
        {/* Content container with responsive padding */}
        <div className="relative z-10 h-full flex items-start justify-center pt-28 sm:pt-48">
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
                className="text-base text-white hover:underline font-medium px-4 py-2 inline-block"
              >
                ¿No encuentras a un profesor? Agrégalo aquí
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Rest of the page content */}
      <main className="py-10 sm:py-16 px-4 bg-white">
        <div className="w-full max-w-4xl mx-auto">
          {/* Additional content here */}
        </div>
      </main>
    </div>
  );
}