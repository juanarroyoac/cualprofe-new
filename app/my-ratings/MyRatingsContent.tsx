'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, getDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';

// Definición de interfaces
interface Teacher {
  id: string;
  name: string;
  university?: string;
  department?: string;
}

interface Rating {
  id: string;
  teacherId: string;
  userId: string;
  quality: number;
  difficulty: number;
  modalidad: string;
  subjectName: string;
  wouldTakeAgain: boolean;
  grade: string | null;
  comment: string;
  tags: string[];
  createdAt: Timestamp;
  teacher: Teacher;
}

export default function MyRatingsContent() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login?authRequired=true&redirectTo=/my-ratings');
      return;
    }

    const fetchUserRatings = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        
        // Query for all ratings by this user
        const ratingsQuery = query(
          collection(db, 'ratings'),
          where('userId', '==', currentUser.uid)
        );
        
        const ratingsSnapshot = await getDocs(ratingsQuery);
        
        if (ratingsSnapshot.empty) {
          setRatings([]);
          setLoading(false);
          return;
        }

        // For each rating, fetch the corresponding teacher
        const ratingsWithTeachers = await Promise.all(
          ratingsSnapshot.docs.map(async (ratingDoc) => {
            const ratingData = ratingDoc.data();
            const teacherId = ratingData.teacherId;
            
            try {
              const teacherDoc = await getDoc(doc(db, 'teachers', teacherId));
              
              if (teacherDoc.exists()) {
                return {
                  id: ratingDoc.id,
                  ...ratingData,
                  teacher: {
                    id: teacherId,
                    ...teacherDoc.data()
                  }
                } as Rating;
              } else {
                // Teacher doesn't exist anymore
                return {
                  id: ratingDoc.id,
                  ...ratingData,
                  teacher: {
                    id: teacherId,
                    name: "Profesor no disponible"
                  }
                } as Rating;
              }
            } catch (err) {
              console.error(`Error fetching teacher ${teacherId}:`, err);
              return {
                id: ratingDoc.id,
                ...ratingData,
                teacher: {
                  id: teacherId,
                  name: "Error al cargar profesor"
                }
              } as Rating;
            }
          })
        );
        
        // Sort ratings by most recent first
        const sortedRatings = ratingsWithTeachers.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return b.createdAt.toMillis() - a.createdAt.toMillis();
          }
          return 0;
        });
        
        setRatings(sortedRatings);
      } catch (err) {
        console.error('Error fetching ratings:', err);
        setError('Error al cargar tus calificaciones. Por favor, inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRatings();
  }, [currentUser, authLoading, router]);

  // Format date from timestamp
  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp || typeof timestamp.toDate !== 'function') return 'Fecha desconocida';
    
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#00103f] mx-auto mb-4"></div>
          <p className="text-gray-600 font-roboto">Cargando tus calificaciones...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4 shadow-md">
          {error}
        </div>
        <Link href="/" className="text-[#00103f] hover:text-[#001b6d] font-roboto transition-colors">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-[#00103f] mb-6 font-poppins">Mis Calificaciones</h1>
      
      {ratings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600 mb-4">Aún no has calificado a ningún profesor.</p>
          <Link 
            href="/" 
            className="inline-block px-4 py-2 bg-[#00103f] text-white font-medium rounded-md hover:bg-[#001b6d] transition-colors"
          >
            Buscar profesores
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {ratings.map((rating) => (
            <div key={rating.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Rating header */}
              <div className="bg-[#00103f] text-white p-4">
                <h2 className="text-xl font-bold">{rating.teacher.name}</h2>
                <p className="text-sm opacity-80">{rating.subjectName} - {rating.modalidad}</p>
              </div>
              
              {/* Rating content */}
              <div className="p-4">
                {/* Rating stats */}
                <div className="flex flex-wrap justify-between mb-4">
                  <div className="mr-6 mb-2">
                    <span className="text-sm font-bold text-gray-600">Calidad:</span>
                    <span className="ml-2 px-2 py-1 bg-gray-100 rounded-full text-sm">{rating.quality}/5</span>
                  </div>
                  <div className="mr-6 mb-2">
                    <span className="text-sm font-bold text-gray-600">Dificultad:</span>
                    <span className="ml-2 px-2 py-1 bg-gray-100 rounded-full text-sm">{rating.difficulty}/5</span>
                  </div>
                  <div className="mr-6 mb-2">
                    <span className="text-sm font-bold text-gray-600">Lo tomaría de nuevo:</span>
                    <span className="ml-2 px-2 py-1 bg-gray-100 rounded-full text-sm">{rating.wouldTakeAgain ? 'Sí' : 'No'}</span>
                  </div>
                  {rating.grade && (
                    <div className="mb-2">
                      <span className="text-sm font-bold text-gray-600">Nota:</span>
                      <span className="ml-2 px-2 py-1 bg-gray-100 rounded-full text-sm">{rating.grade}</span>
                    </div>
                  )}
                </div>
                
                {/* Tags */}
                {rating.tags && rating.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {rating.tags.map((tag, index) => (
                        <span 
                          key={index} 
                          className="inline-block px-2 py-1 bg-blue-50 text-[#00103f] rounded-full text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Comment */}
                <div className="mb-3">
                  <p className="text-gray-700">{rating.comment}</p>
                </div>
                
                {/* Date and actions */}
                <div className="flex justify-between items-center border-t pt-3 mt-3">
                  <span className="text-xs text-gray-500">
                    {formatDate(rating.createdAt)}
                  </span>
                  <div className="flex space-x-2">
                    <Link 
                      href={`/teacher/${rating.teacher.id}`} 
                      className="text-sm text-[#00103f] hover:text-[#001b6d]"
                    >
                      Ver profesor
                    </Link>
                    <Link 
                      href={`/rate/${rating.teacher.id}`} 
                      className="text-sm text-[#00103f] hover:text-[#001b6d] font-medium"
                    >
                      Editar
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}