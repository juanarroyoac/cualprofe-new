'use client';
import SearchBar from '../components/searchbar'; // Assuming this path is correct
import Link from 'next/link';
import Image from 'next/image'; // Keep for potential future image use

// Example Icon Components (Replace with your actual icon library or SVGs)
// Using simple functional components for clarity. Ensure these match your project setup.
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
const EditIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);
const MonitorIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
);
const HelpCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
);


export default function Home() {
  return (
    // Ensure the main layout above this component handles the header height appropriately
    <div className="w-full min-h-screen bg-white text-gray-800 font-nunito">

      {/* --- Hero Section (Split Layout) --- */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-6xl grid md:grid-cols-2 gap-12 items-center">
          {/* Left Column: Content */}
          <div className="text-left"> {/* Ensure text alignment isn't centered here */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-poppins text-[#00103f] leading-tight mb-4">
              Encuentra al profesor ideal.
            </h1>
            <p className="text-lg text-gray-700 mb-8 max-w-lg">
              Descubre qué opinan otros estudiantes sobre los profesores de tu universidad. Elige tus clases con confianza y comparte tu propia experiencia.
            </p>

            {/* Search Bar Container - Calling SearchBar without the incorrect 'placeholder' prop */}
            <div className="w-full max-w-md mb-6">
              <SearchBar
                  // Add any props *required* by your SearchBar definition here.
                  // For example, if it still needs props from the original version:
                  // textColor="#374151" // Example: text-gray-700 for light background
                  // largerHeading={false}
                  // headlineText=""
              />
            </div>

             {/* Add Professor Link */}
             <div>
                <Link
                  href="/add-professor"
                  className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline font-medium transition-colors duration-200"
                >
                  ¿No encuentras a un profesor? Agrégalo aquí
                </Link>
              </div>
          </div>

          {/* Right Column: Visual */}
          <div className="hidden md:flex justify-center items-center">
             {/* --- PLACEHOLDER VISUAL --- */}
             {/* Replace this div with your actual Image or Illustration component */}
             {/* Example: <Image src="/images/hero-illustration.svg" width={400} height={400} alt="Students collaborating"/> */}
             <div className="w-80 h-80 lg:w-96 lg:h-96 bg-indigo-200 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-indigo-500 text-lg font-semibold">Visual Element</span>
             </div>
          </div>
        </div>
      </section>

      {/* --- Why CualProfe Section --- */}
      <section className="py-16 md:py-24 px-4 bg-white">
         <div className="container mx-auto max-w-6xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold font-poppins text-[#00103f] mb-4">
               ¿Por qué usar CuálProfe?
            </h2>
             <p className="text-lg text-gray-600 mb-12 md:mb-16 max-w-3xl mx-auto">
               Tomar decisiones informadas sobre tus clases nunca fue tan fácil. Ayudamos a la comunidad estudiantil a compartir y encontrar información valiosa.
            </p>

             {/* Features Grid/Flex */}
             <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
               {/* Feature 1: Informed Decisions */}
               <div className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center">
                 <div className="w-12 h-12 text-indigo-600 mb-4">
                   <SearchIcon className="w-full h-full" /> {/* Ensure icons render correctly */}
                 </div>
                 <h3 className="text-xl font-semibold font-poppins mb-2 text-gray-800">Decisiones Informadas</h3>
                 <p className="text-gray-600 text-sm leading-relaxed">
                    Lee reseñas reales de otros estudiantes para saber qué esperar antes de inscribir una materia.
                 </p>
               </div>

               {/* Feature 2: Share Your Experience */}
               <div className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center">
                 <div className="w-12 h-12 text-indigo-600 mb-4">
                    <EditIcon className="w-full h-full" />
                 </div>
                 <h3 className="text-xl font-semibold font-poppins mb-2 text-gray-800">Comparte Tu Experiencia</h3>
                 <p className="text-gray-600 text-sm leading-relaxed">
                    Ayuda a tus compañeros dejando tu propia reseña anónima sobre los profesores que has tenido.
                 </p>
               </div>

               {/* Feature 3: All in One Place */}
               <div className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center">
                  <div className="w-12 h-12 text-indigo-600 mb-4">
                    <MonitorIcon className="w-full h-full" />
                  </div>
                 <h3 className="text-xl font-semibold font-poppins mb-2 text-gray-800">Todo En Un Solo Lugar</h3>
                 <p className="text-gray-600 text-sm leading-relaxed">
                    Encuentra información centralizada sobre profesores de diversas universidades venezolanas.
                 </p>
               </div>
            </div>
         </div>
      </section>

      {/* --- How It Works Section --- */}
      <section className="py-16 md:py-24 px-4 bg-indigo-50"> {/* Light blue background */}
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold font-poppins text-[#00103f] mb-12">
               ¿Cómo funciona?
            </h2>
             <div className="grid md:grid-cols-3 gap-8 lg:gap-12 text-left">
                {/* Step 1 */}
                <div className="flex items-start space-x-4">
                   <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xl">1</div>
                   <div>
                      <h3 className="text-lg font-semibold font-poppins mb-1 text-[#00103f]">Busca</h3>
                      <p className="text-gray-700 text-sm">Usa la barra de búsqueda para encontrar un profesor por nombre o una materia.</p>
                   </div>
                </div>
                 {/* Step 2 */}
                 <div className="flex items-start space-x-4">
                   <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xl">2</div>
                    <div>
                      <h3 className="text-lg font-semibold font-poppins mb-1 text-[#00103f]">Lee Reseñas</h3>
                      <p className="text-gray-700 text-sm">Explora las calificaciones y comentarios dejados por otros estudiantes.</p>
                   </div>
                 </div>
                 {/* Step 3 */}
                 <div className="flex items-start space-x-4">
                   <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xl">3</div>
                   <div>
                      <h3 className="text-lg font-semibold font-poppins mb-1 text-[#00103f]">Contribuye</h3>
                      <p className="text-gray-700 text-sm">Comparte tu propia experiencia para ayudar a la comunidad estudiantil.</p>
                   </div>
                </div>
             </div>
          </div>
      </section>


      {/* --- FAQ Call to Action --- */}
      <section className="py-16 px-4 bg-white text-center">
          <h3 className="text-2xl font-bold font-poppins text-[#00103f] mb-4">¿Tienes preguntas?</h3>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
             Visita nuestra sección de Preguntas Frecuentes para encontrar respuestas o contáctanos si necesitas más ayuda.
          </p>
          <Link href="/ayuda" className="inline-flex items-center font-semibold bg-[#00103f] hover:bg-[#00248c] text-white rounded-lg px-6 py-3 transition-colors duration-200 shadow hover:shadow-md">
             <HelpCircleIcon className="h-5 w-5 mr-2" /> {/* Pass className */}
             Ir a Preguntas Frecuentes
          </Link>
       </section>

    </div>
  );
}