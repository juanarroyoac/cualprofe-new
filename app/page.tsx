'use client';
import SearchBar from '../components/searchbar';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen w-full overflow-hidden landing-page">
      {/* Hero section with background image - FULL WIDTH but SHORTER HEIGHT */}
      <div className="relative w-full h-[400px] sm:h-[480px] -mt-16"> {/* Reduced height significantly */}
        {/* Background image - stretched to full width */}
        <div className="absolute inset-0 w-full">
          <Image 
            src="/images/university-background.jpg" 
            alt="University Campus" 
            fill
            priority
            className="object-cover w-screen"
            quality={85}
            sizes="100vw"
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black bg-opacity-70"></div>
        </div>
        
        {/* Content container - moved higher with less spacing */}
        <div className="absolute inset-x-0 top-[32%] sm:top-[30%] z-10 flex flex-col items-center px-4">
          {/* Main heading with reduced margin below */}
          <h1 className="text-white text-4xl sm:text-5xl font-bold leading-[1.15] md:leading-[1.2] mb-2 text-center font-poppins">
            Busca los mejores profesores <span className="hidden md:inline"><br /></span>antes de inscribirte.
          </h1>
          
          {/* SearchBar component */}
          <div className="w-full max-w-lg">
            <SearchBar 
              textColor="white" 
              largerHeading={false}
              headlineText=""
              headingWeight="font-bold" 
            />
            
            {/* Add Professor Link - closer to search bar */}
            <div className="mt-4 text-center">
              <Link 
                href="/add-professor" 
                className="text-sm text-white hover:underline font-medium"
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