"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useViewTracking } from "./contexts/ViewTrackingContext"
import SearchContainer from "./components/SearchContainer"
import { ArrowRight } from "lucide-react"

// Import images from the public folder
import infoIcon from "/public/images/info.png"
import commentIcon from "/public/images/comment.png"
import networkIcon from "/public/images/network.png"
import { CheckCircle, Search, Star, Users } from "lucide-react"

// Definición para window debug function
interface WindowWithDebug extends Window {
  __resetViewCount?: () => void
}

export default function Home() {
  const router = useRouter()
  const { resetProfessorViews } = useViewTracking()
  const [isScrolled, setIsScrolled] = useState(false)

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

  return (
    <div className="w-full min-h-screen bg-white text-gray-800 font-inter">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-950 min-h-[600px] flex items-center">
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white font-poppins leading-tight mb-6">
              Encuentra al <span className="text-blue-300">profesor ideal</span> para tus clases
            </h1>

            <p className="text-lg text-blue-100 mb-8">
              Descubre qué opinan otros estudiantes sobre los profesores de tu universidad. 
              Elige tus clases con confianza y comparte tu propia experiencia.
            </p>

            {/* Search Container */}
            <div className="w-full max-w-2xl mx-auto">
              <SearchContainer
                headlineText=""
                hideUniversityDropdown={false}
                onProfessorSelect={handleProfessorSelect}
              />
            </div>

            {/* Add Professor link */}
            <div className="mt-6">
              <Link
                href="/add-professor"
                className="inline-flex items-center text-blue-200 text-sm hover:text-white transition-colors duration-200"
              >
                ¿No encuentras a un profesor?{" "}
                <span className="underline ml-1">Agrégalo aquí</span>
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-blue-800">1,200+</span>
              <span className="text-gray-600">Profesores</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-blue-800">15+</span>
              <span className="text-gray-600">Universidades</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-blue-800">5,000+</span>
              <span className="text-gray-600">Reseñas</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            ¿Listo para encontrar al profesor ideal?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Únete a miles de estudiantes que ya están tomando decisiones informadas sobre sus clases.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="#search"
              className="bg-blue-800 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg shadow-md transition-colors duration-200"
            >
              Buscar Profesores
            </Link>
            <Link
              href="/add-professor"
              className="bg-white hover:bg-gray-50 text-blue-800 font-medium py-3 px-8 rounded-lg shadow-md transition-colors duration-200"
            >
              Agregar Profesor
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
