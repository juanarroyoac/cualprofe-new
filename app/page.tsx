// app/page.tsx
'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useViewTracking } from './contexts/ViewTrackingContext';
import SearchContainer from './components/SearchContainer';
import Image from 'next/image';

// Importamos nuestros iconos (igual que antes)
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const EditIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const MonitorIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
    <line x1="8" y1="21" x2="16" y2="21"></line>
    <line x1="12" y1="17" x2="12" y2="21"></line>
  </svg>
);

const HelpCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

// Definición para window debug function
interface WindowWithDebug extends Window {
  __resetViewCount?: () => void;
}

export default function Home() {
  const router = useRouter();
  const { resetProfessorViews } = useViewTracking();

  // Reset professor view count for testing purposes when on the homepage
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/') {
      (window as WindowWithDebug).__resetViewCount = resetProfessorViews;
      console.log('To reset view count, run window.__resetViewCount() in your browser console.');
    }
  }, [resetProfessorViews]);

  const handleProfessorSelect = (professorId: string) => {
    router.push(`/teacher/${professorId}`);
  };

  return (
    <div className="w-full min-h-screen bg-white text-gray-800 font-roboto landing-page">
      {/* --- Hero Section (Modern Design) --- */}
      <section className="hero-gradient min-h-[600px] flex items-center relative overflow-hidden">
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left Column: Content - UPDATED WITH POPPINS TITLE */}
            <div className="text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white font-poppins leading-tight mb-4">
                Encuentra al<br />profesor ideal.
              </h1>
              <p className="text-lg text-blue-100 mb-8">
                Descubre qué opinan otros estudiantes sobre los profesores de tu universidad. Elige tus clases con confianza y comparte tu propia experiencia.
              </p>

              {/* Search Container only */}
              <div className="w-full max-w-xl">
                <div className="search-container p-2 bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl">
                  <SearchContainer
                    headlineText=""
                    hideUniversityDropdown={true}
                    onProfessorSelect={handleProfessorSelect}
                  />
                </div>
              </div>
              
              {/* Separate Add Professor link - with underline instead of background */}
              <div className="w-full max-w-xl flex justify-center mt-3">
                <a
                  href="/add-professor"
                  className="inline-block text-center text-white text-sm py-1 underline hover:text-blue-200 transition-colors duration-200"
                >
                  ¿No encuentras a un profesor? Agrégalo aquí
                </a>
              </div>
            </div>

            {/* Right Column: Visual Element */}
            <div className="hidden md:flex justify-center items-center">
              {/* Replace placeholder with LandingPageIllustration image */}
              <div className="w-80 h-80 lg:w-96 lg:h-96 relative">
                <Image 
                  src="/images/LandingPageIllustration.png"
                  alt="Universidad venezolana con bandera"
                  fill
                  sizes="(max-width: 768px) 320px, 384px"
                  priority
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-400 bg-opacity-10 rounded-bl-[200px] transform rotate-6 -translate-y-20 translate-x-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-blue-500 bg-opacity-10 rounded-tr-[150px] transform -rotate-12 translate-y-20 -translate-x-20 pointer-events-none"></div>
      </section>

      {/* --- Why CualProfe Section (Improved) --- */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold font-poppins text-primary mb-5">
            ¿Por qué usar CuálProfe?
          </h2>
          <p className="text-lg text-gray-600 mb-16 max-w-3xl mx-auto">
            Tomar decisiones informadas sobre tus clases nunca fue tan fácil. Ayudamos a la comunidad estudiantil a compartir y encontrar información valiosa.
          </p>

          {/* Features Grid with improved cards */}
          <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
            {/* Feature 1: Informed Decisions */}
            <div className="feature-card p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center border border-gray-100 hover:border-blue-100">
              <div className="w-14 h-14 text-primary rounded-full bg-blue-50 flex items-center justify-center mb-5">
                <SearchIcon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold font-poppins mb-3 text-gray-800">Decisiones Informadas</h3>
              <p className="text-gray-600 leading-relaxed">
                Lee reseñas reales de otros estudiantes para saber qué esperar antes de inscribir una materia.
              </p>
            </div>

            {/* Feature 2: Share Your Experience */}
            <div className="feature-card p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center border border-gray-100 hover:border-blue-100">
              <div className="w-14 h-14 text-primary rounded-full bg-blue-50 flex items-center justify-center mb-5">
                <EditIcon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold font-poppins mb-3 text-gray-800">Comparte Tu Experiencia</h3>
              <p className="text-gray-600 leading-relaxed">
                Ayuda a tus compañeros dejando tu propia reseña anónima sobre los profesores que has tenido.
              </p>
            </div>

            {/* Feature 3: All in One Place */}
            <div className="feature-card p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center border border-gray-100 hover:border-blue-100">
              <div className="w-14 h-14 text-primary rounded-full bg-blue-50 flex items-center justify-center mb-5">
                <MonitorIcon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold font-poppins mb-3 text-gray-800">Todo En Un Solo Lugar</h3>
              <p className="text-gray-600 leading-relaxed">
                Encuentra información centralizada sobre profesores de diversas universidades venezolanas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- How It Works Section (Improved) --- */}
      <section className="py-20 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl sm:text-4xl font-bold font-poppins text-primary mb-16 text-center">
            ¿Cómo funciona?
          </h2>
          
          <div className="relative">
            {/* Connector line */}
            <div className="absolute left-5 top-0 w-0.5 h-full bg-blue-100 md:hidden"></div>
            
            <div className="grid md:grid-cols-3 gap-y-12 md:gap-x-8 text-left relative z-10">
              {/* Step 1 */}
              <div className="flex md:flex-col md:items-center">
                <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xl z-10 md:mb-4">1</div>
                <div className="ml-6 md:ml-0 md:text-center">
                  <h3 className="text-xl font-semibold font-poppins mb-2 text-primary">Busca</h3>
                  <p className="text-gray-600">Usa la barra de búsqueda para encontrar un profesor por nombre o una materia.</p>
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="flex md:flex-col md:items-center">
                <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xl z-10 md:mb-4">2</div>
                <div className="ml-6 md:ml-0 md:text-center">
                  <h3 className="text-xl font-semibold font-poppins mb-2 text-primary">Lee Reseñas</h3>
                  <p className="text-gray-600">Explora las calificaciones y comentarios dejados por otros estudiantes.</p>
                </div>
              </div>
              
              {/* Step 3 */}
              <div className="flex md:flex-col md:items-center">
                <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xl z-10 md:mb-4">3</div>
                <div className="ml-6 md:ml-0 md:text-center">
                  <h3 className="text-xl font-semibold font-poppins mb-2 text-primary">Contribuye</h3>
                  <p className="text-gray-600">Comparte tu propia experiencia para ayudar a la comunidad estudiantil.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FAQ Call to Action (Improved) --- */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-blue-50 rounded-2xl p-10 shadow-sm">
            <h3 className="text-2xl font-bold font-poppins text-primary mb-4">¿Tienes preguntas?</h3>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto">
              Visita nuestra sección de Preguntas Frecuentes para encontrar respuestas o contáctanos si necesitas más ayuda.
            </p>
            <a 
              href="/ayuda" 
              className="inline-flex items-center font-semibold bg-primary hover:bg-primary-light text-white rounded-lg px-6 py-3.5 transition-colors duration-200 shadow hover:shadow-md"
            >
              <HelpCircleIcon className="h-5 w-5 mr-2" />
              Ir a Preguntas Frecuentes
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}