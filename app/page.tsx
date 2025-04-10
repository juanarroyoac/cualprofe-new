'use client';
import SearchBar from '../components/searchbar';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen w-full overflow-hidden landing-page">
      {/* Hero section with background image */}
      <div className="relative w-full h-[400px] sm:h-[480px] -mt-16">
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
        
        {/* Content container */}
        <div className="absolute inset-x-0 top-[32%] sm:top-[30%] z-10 flex flex-col items-center px-4">
          {/* Main heading */}
          <h1 className="text-white text-2xl sm:text-5xl font-bold leading-[1.15] md:leading-[1.2] mb-2 text-center font-poppins">
            Busca los mejores profesores <span className="hidden md:inline"><br /></span>antes de inscribirte.
          </h1>
          
          {/* SearchBar component - keeping the current one */}
          <div className="w-full max-w-lg">
            <SearchBar 
              textColor="white" 
              largerHeading={false}
              headlineText=""
              headingWeight="font-bold" 
            />
            
            {/* Add Professor Link */}
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
      
      {/* Empty space to push content down */}
      <div className="py-8 bg-white"></div>
      
      {/* What is CualProfe section */}
      <div className="py-16 px-4 bg-white">
        <div className="w-full max-w-6xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 font-poppins text-[#00103f]">
            ¿Qué es CuálProfe?
          </h2>
          <p className="text-lg mb-12 text-gray-600 max-w-3xl mx-auto font-nunito">
            CuálProfe es una plataforma independiente para evaluar profesores de las principales universidades venezolanas.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#00248c" strokeWidth="2" className="w-full h-full">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <h3 className="text-xl font-semibold font-poppins mb-3">¿Armando tu horario?</h3>
              <p className="text-gray-600 font-nunito">
                Busca entre los profes y descubre qué opinan tus compañeros que ya tomaron sus clases.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#00248c" strokeWidth="2" className="w-full h-full">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold font-poppins mb-3">¿Terminaste el semestre?</h3>
              <p className="text-gray-600 font-nunito">
                Ayuda a otros estudiantes a elegir bien compartiendo tu experiencia con tus profesores.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#00248c" strokeWidth="2" className="w-full h-full">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              </div>
              <h3 className="text-xl font-semibold font-poppins mb-3">¿Curioso sobre un profe?</h3>
              <p className="text-gray-600 font-nunito">
                Con unos pocos clics, conoce todo sobre su método de enseñanza y estilo de evaluación.
              </p>
            </div>
          </div>

          <Link href="/ayuda" className="inline-flex items-center font-semibold bg-[#00103f] hover:bg-[#00248c] text-white rounded-lg px-6 py-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <path d="M12 17h.01"></path>
            </svg>
            Preguntas frecuentes
          </Link>
        </div>
      </div>
    </div>
  );
}