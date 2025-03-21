import React from 'react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-100 text-gray-800 py-8 border-t border-gray-200">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: About */}
          <div>
            <h3 className="font-bold text-lg mb-4">CuálProfe</h3>
            <p className="text-sm">
              Calificaciones de profesores por estudiantes para estudiantes en Venezuela.
              Ayudando a los estudiantes a tomar mejores decisiones académicas.
            </p>
          </div>
          
          {/* Column 2: Navigation */}
          <div>
            <h3 className="font-bold text-lg mb-4">Enlaces</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terminosycondiciones" className="text-sm hover:text-[#0F17FF] transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/reglas" className="text-sm hover:text-[#0F17FF] transition-colors">
                  Reglas del Sitio
                </Link>
              </li>
              <li>
                <Link href="/ayuda" className="text-sm hover:text-[#0F17FF] transition-colors">
                  Ayuda
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 3: Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">Contacto</h3>
            <p className="text-sm mb-2">¿Tienes preguntas o sugerencias?</p>
            <Link 
              href="mailto:contacto@cualprofe.com" 
              className="text-sm text-[#0F17FF] hover:underline"
            >
              contacto@cualprofe.com
            </Link>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm">
          <p>© {currentYear} CuálProfe. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}