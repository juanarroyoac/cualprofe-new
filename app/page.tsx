'use client';
import SearchBar from '../components/SearchBar';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pt-24 pb-16 px-4">
        <div className="w-full max-w-3xl mx-auto">
          <SearchBar />
          
          {/* Add Professor Link */}
          <div className="mt-4 text-center">
            <Link 
              href="/add-professor" 
              className="text-sm text-[#0F17FF] hover:underline"
            >
              ¿No encuentras a un profesor? Agrégalo aquí
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}