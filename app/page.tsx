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
        <div className="relative z-10 h-full flex items-start justify-center pt-20 sm:pt-48">
          <div className="w-full max-w-5xl px-4">
            {/* Custom responsive heading for better mobile display */}
            <div className="text-center mb-8">
              <h1 className="text-white text-3xl sm:text-4xl md:text-5xl font-bold leading-tight sm:leading-tight tracking-wide font-poppins">
                Elige tus profesores<br className="hidden sm:inline" /> con confianza.
              </h1>
            </div>
            
            {/* SearchBar component */}
            <SearchBar 
              textColor="white" 
              largerHeading={false} /* Disable larger heading in the component */
              headlineText="" /* Empty as we're using custom heading above */
              headingWeight="font-bold" 
            />
            
            {/* Add Professor Link - more visible now */}
            <div className="mt-8 text-center">
              <Link 
                href="/add-professor" 
                className="text-base text-white hover:underline font-medium px-4 py-2 inline-block bg-blue-700 bg-opacity-50 rounded-lg hover:bg-opacity-70 transition-all"
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