"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useViewTracking } from "./contexts/ViewTrackingContext"
import SearchBar from "./components/searchbar"
import { ArrowRight, Star, Users, Search, MessageSquare, Shield, Award, GraduationCap, BookOpen, Heart } from "lucide-react"
import { useAuth } from "./contexts/AuthContext"
import CualProfeLogoBlue from "/public/CualProfeLogoBlue.png"
import { db } from '../lib/firebase'

// Import images from the public folder
import infoIcon from "/public/images/info.png"
import commentIcon from "/public/images/comment.png"
import networkIcon from "/public/images/network.png"

// Definición para window debug function
interface WindowWithDebug extends Window {
  __resetViewCount?: () => void
}

export default function Home() {
  const router = useRouter()
  const { resetProfessorViews } = useViewTracking()
  const [isScrolled, setIsScrolled] = useState(false)
  const { currentUser } = useAuth()

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname === "/") {
      ;(window as WindowWithDebug).__resetViewCount = resetProfessorViews
      console.log("To reset view count, run window.__resetViewCount() in your browser console.")
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [resetProfessorViews])

  const handleProfessorSelect = (professor: { id: string }) => {
    router.push(`/teacher/${professor.id}`)
  }

  // Example testimonials data
  const testimonials = [
    {
      id: 1,
      text: "Excelente profesor, muy claro en sus explicaciones y siempre dispuesto a ayudar.",
      rating: 5,
      university: "UCAB",
      identifier: "Estudiante de Ingeniería"
    },
    {
      id: 2,
      text: "Las clases son muy dinámicas y aprendes mucho. Totalmente recomendado.",
      rating: 4,
      university: "UNIMET",
      identifier: "Estudiante de Administración"
    },
    {
      id: 3,
      text: "Un profesor que realmente se preocupa por el aprendizaje de sus estudiantes.",
      rating: 5,
      university: "UCV",
      identifier: "Estudiante de Derecho"
    }
  ]

  return (
    <div className="w-full min-h-screen bg-[#f7f8fa] text-black font-inter">
      {/* Subtle education-themed background pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <svg width="100%" height="100%" className="opacity-10" style={{position: 'absolute', top: 0, left: 0}}>
          <defs>
            <pattern id="eduPattern" width="120" height="120" patternUnits="userSpaceOnUse">
              <g>
                <rect x="10" y="10" width="30" height="20" rx="3" fill="#b3c6e0" /> {/* Book */}
                <rect x="60" y="60" width="30" height="20" rx="3" fill="#b3c6e0" /> {/* Book */}
                <path d="M90 30 l10 20 l10 -20" stroke="#b3c6e0" strokeWidth="2" fill="none" /> {/* Graduation cap */}
                <circle cx="30" cy="90" r="10" fill="#b3c6e0" /> {/* Chat bubble */}
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#eduPattern)" />
        </svg>
      </div>
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center z-10">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center pt-4 pb-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-black leading-tight">
              Encuentra el mejor profesor para tu carrera en <span className="text-blue-600">Venezuela</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-8">
              La plataforma donde los estudiantes venezolanos comparten sus experiencias y ayudan a otros a tomar mejores decisiones académicas.
            </p>
            <div className="mb-2">
              <SearchBar hideUniversityDropdown={false} />
            </div>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section className="py-6 bg-transparent z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-black">¿Cómo funciona?</h2>
            <p className="text-lg text-gray-700">Una plataforma simple y efectiva para la comunidad estudiantil venezolana</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-white p-8 rounded-xl shadow-md border-t-4" style={{ borderTopColor: '#00248c' }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-6" style={{ background: '#00248c' }}>
                {/* Book icon */}
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M20 19.5A2.5 2.5 0 0017.5 17H4"/><path d="M6 4h12a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z"/></svg>
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: '#00248c' }}>Busca Profesores</h3>
              <p className="text-gray-700 text-center">Encuentra profesores de tu universidad y carrera con calificaciones detalladas.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-md border-t-4" style={{ borderTopColor: '#00248c' }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-6" style={{ background: '#00248c' }}>
                {/* Graduation cap icon */}
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M22 7L12 3 2 7l10 4 10-4z"/><path d="M6 10v4a6 6 0 0012 0v-4"/></svg>
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: '#00248c' }}>Lee Opiniones</h3>
              <p className="text-gray-700 text-center">Conoce las experiencias de otros estudiantes con cada profesor.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-md border-t-4" style={{ borderTopColor: '#00248c' }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-6" style={{ background: '#00248c' }}>
                {/* Chat bubble icon */}
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: '#00248c' }}>Comparte tu Experiencia</h3>
              <p className="text-gray-700 text-center">Ayuda a otros estudiantes compartiendo tu experiencia con los profesores.</p>
            </div>
          </div>
        </div>
      </section>
      {/* Strong CTA Section */}
      <section className="py-16 bg-white z-10">
        <div className="container mx-auto px-4 text-center">
          {currentUser ? (
            <>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black">¿Eres parte de la comunidad?</h2>
              <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
                ¡Agrega un profesor y ayuda a otros estudiantes venezolanos!
              </p>
              <Link 
                href="/add-professor" 
                className="inline-flex items-center justify-center px-8 py-3 border-0 text-base font-semibold rounded-lg text-white bg-blue-600 hover:bg-teal-500 transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              >
                Agregar profesor
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black">¿Listo para mejorar tu experiencia universitaria?</h2>
              <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
                Regístrate gratis y ayuda a construir la comunidad de estudiantes más útil de Venezuela.
              </p>
              <Link 
                href="/register" 
                className="inline-flex items-center justify-center px-8 py-3 border-0 text-base font-semibold rounded-lg text-white bg-blue-600 hover:bg-teal-500 transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
