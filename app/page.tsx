// app/page.tsx
'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useViewTracking } from './contexts/ViewTrackingContext';
import SearchContainer from './components/SearchContainer';
import RotatingRatingsCarousel from './components/RatingCarousel'; // Ensure this component is correctly imported

// Import images from the public folder
import infoIcon from '/public/images/info.png';
import commentIcon from '/public/images/comment.png';
import networkIcon from '/public/images/network.png';

// Keep HelpCircleIcon only if it's used elsewhere
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

            {/* --- Hero Section (Reverted Height, Resized Mobile Carousel) --- */}
            {/* Reverted back to original min-height */}
            <section className="bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-950 min-h-[480px] flex items-center relative overflow-hidden isolate">

                {/* Background Lighting Effects */}
                <div
                    className="absolute top-[-20%] left-[-15%] w-3/5 h-3/5 rounded-full bg-radial from-cyan-500/15 via-transparent to-transparent filter blur-3xl pointer-events-none transform -rotate-12 opacity-70"
                    aria-hidden="true"
                ></div>
                <div
                    className="absolute bottom-[-25%] right-[-10%] w-1/2 h-1/2 rounded-full bg-radial from-purple-600/15 via-transparent to-transparent filter blur-3xl pointer-events-none transform rotate-15 opacity-80"
                    aria-hidden="true"
                ></div>
                <div
                    className="absolute top-0 left-0 w-full h-1/4 bg-gradient-to-b from-white/5 via-transparent to-transparent filter blur-md pointer-events-none"
                    aria-hidden="true"
                ></div>


                {/* Hero Content Container */}
                <div className="container mx-auto px-4 pt-16 pb-8 md:py-12 relative z-10">
                    <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center">

                        {/* === Left Column / Mobile Content Stack === */}
                        <div className="flex flex-col items-center text-center md:items-start md:text-left mt-4 relative z-10">
                            <div className="w-full max-w-xl">
                                {/* Title */}
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white font-poppins leading-tight mb-4">
                                    Encuentra al<br />profesor ideal.
                                </h1>

                                {/* Description */}
                                <p className="text-lg text-blue-100 mb-6 ">
                                    Descubre qué opinan otros estudiantes sobre los profesores de tu universidad. Elige tus clases con confianza y comparte tu propia experiencia.
                                </p>

                                {/* --- START: Rotating Carousel for Mobile (Significantly Resized) --- */}
                                <div className="w-full max-w-xs mx-auto mt-4 mb-8 block md:hidden transform scale-75 origin-center">
                                     {/*
                                      - max-w-xs: Limits width
                                      - mx-auto: Centers the container
                                      - mt-4: Adds margin top (adjust if needed)
                                      - mb-8: Adds margin bottom (adjust if needed)
                                      - scale-75: Significantly shrinks the component (try scale-70, scale-60 if needed)
                                      - origin-center: Ensures scaling happens from the middle
                                    */}
                                    <RotatingRatingsCarousel />
                                </div>
                                {/* --- END: Rotating Carousel for Mobile --- */}

                                {/* Search Container */}
                                <div className="w-full">
                                    <div className="search-container p-2 bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl">
                                        <SearchContainer
                                            headlineText=""
                                            hideUniversityDropdown={true}
                                            onProfessorSelect={handleProfessorSelect}
                                        />
                                    </div>
                                </div>

                                {/* Add Professor link */}
                                <div className="w-full flex justify-center mt-4">
                                    <a
                                        href="/add-professor"
                                        className="inline-block text-center text-white text-sm py-1 underline hover:text-blue-200 transition-colors duration-200"
                                    >
                                        ¿No encuentras a un profesor? Agrégalo aquí
                                    </a>
                                </div>
                            </div>
                        </div>
                        {/* === End Left Column / Mobile Content Stack === */}


                        {/* === Right Column (Desktop Carousel) === */}
                        <div className="hidden md:block md:relative overflow-visible" style={{ width: "130%", height: "420px", marginRight: "-30%", marginTop: "1rem" }}>
                            <RotatingRatingsCarousel />
                        </div>
                        {/* === End Right Column === */}

                    </div> {/* End Grid */}
                </div> {/* End Container */}
            </section>
            {/* --- End Hero Section --- */}


            {/* --- Why CualProfe Section --- */}
            <section className="py-20 px-4 bg-white">
                {/* Content remains unchanged... */}
                 <div className="container mx-auto max-w-6xl text-center">
                    <h2 className="text-5xl sm:text-6xl font-bold font-poppins mb-5 bg-gradient-to-r from-blue-800 via-blue-700 to-blue-600 bg-clip-text text-transparent">
                        ¿Por qué usar CuálProfe?
                    </h2>
                    <p className="text-lg text-gray-600 mb-16 max-w-3xl mx-auto">
                        Tomar decisiones informadas sobre tus clases nunca fue tan fácil. Ayudamos a la comunidad estudiantil a compartir y encontrar información valiosa.
                    </p>
                    <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
                        {/* Feature 1 */}
                        <div className="feature-card-outer rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-0.5 bg-gradient-to-br from-blue-100 via-gray-50 to-white">
                            <div className="feature-card-inner h-full bg-gradient-to-br from-white to-gray-50 rounded-[11px] p-8 flex flex-col items-center">
                                <Image src={infoIcon} alt="Informed Decisions Icon" width={72} height={72} className="mb-5" />
                                <h3 className="text-xl font-semibold font-poppins mb-3 text-gray-800">Decisiones Informadas</h3>
                                <p className="text-gray-600 leading-relaxed">Lee reseñas reales de otros estudiantes para saber qué esperar antes de inscribir una materia.</p>
                            </div>
                        </div>
                        {/* Feature 2 */}
                        <div className="feature-card-outer rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-0.5 bg-gradient-to-br from-blue-100 via-gray-50 to-white">
                            <div className="feature-card-inner h-full bg-gradient-to-br from-white to-gray-50 rounded-[11px] p-8 flex flex-col items-center">
                                <Image src={commentIcon} alt="Share Experience Icon" width={72} height={72} className="mb-5" />
                                <h3 className="text-xl font-semibold font-poppins mb-3 text-gray-800">Comparte Tu Experiencia</h3>
                                <p className="text-gray-600 leading-relaxed">Ayuda a tus compañeros dejando tu propia reseña anónima sobre los profesores que has tenido.</p>
                            </div>
                        </div>
                        {/* Feature 3 */}
                        <div className="feature-card-outer rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-0.5 bg-gradient-to-br from-blue-100 via-gray-50 to-white">
                            <div className="feature-card-inner h-full bg-gradient-to-br from-white to-gray-50 rounded-[11px] p-8 flex flex-col items-center">
                                <Image src={networkIcon} alt="All in One Place Icon" width={72} height={72} className="mb-5" />
                                <h3 className="text-xl font-semibold font-poppins mb-3 text-gray-800">Todo En Un Solo Lugar</h3>
                                <p className="text-gray-600 leading-relaxed">Encuentra información centralizada sobre profesores de diversas universidades venezolanas.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* --- End Why CualProfe Section --- */}


            {/* --- How It Works Section --- */}
            <section className="py-20 px-4 bg-gradient-to-b from-blue-50 to-white">
                {/* Content remains unchanged... */}
                <div className="container mx-auto max-w-5xl">
                    <h2 className="text-5xl sm:text-6xl font-bold font-poppins mb-16 text-center bg-gradient-to-r from-blue-800 via-blue-700 to-blue-600 bg-clip-text text-transparent">
                        ¿Cómo funciona?
                    </h2>
                    <div className="relative">
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
            {/* --- End How It Works Section --- */}

            {/* --- FAQ Call to Action Section (Still Removed/Commented) --- */}
            {/* <section> ... </section> */}

        </div> // Closing main div
    );
}