'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import Link from 'next/link';

interface Rating {
  id: string;
  teacherId: string;
  quality: number;
  difficulty: number;
  modalidad: string;
  subjectName: string;
  wouldTakeAgain: boolean;
  grade: string | null;
  comment: string;
  tags: string[];
  createdAt: Timestamp;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface TeacherData {
  [key: string]: string;
}

export default function RatingsApproval() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [teacherData, setTeacherData] = useState<TeacherData>({});

  const fetchRatings = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'ratings'),
        where('status', '==', filter)
      );
      
      const querySnapshot = await getDocs(q);
      const ratingsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Rating[];
      
      // Fetch teacher names for all ratings
      const teacherIds = [...new Set(ratingsData.map(rating => rating.teacherId))];
      const teachersData: TeacherData = {};
      
      for (const teacherId of teacherIds) {
        const teacherDoc = await getDoc(doc(db, 'teachers', teacherId));
        if (teacherDoc.exists()) {
          const teacherData = teacherDoc.data();
          teachersData[teacherId] = teacherData.name || 'Profesor desconocido';
        } else {
          teachersData[teacherId] = 'Profesor desconocido';
        }
      }
      
      setTeacherData(teachersData);
      setRatings(ratingsData);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, [filter]);

  const approveRating = async (ratingId: string) => {
    try {
      const ratingRef = doc(db, 'ratings', ratingId);
      
      await updateDoc(ratingRef, {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: auth.currentUser?.uid
      });
      
      // Update the local state to reflect changes
      setRatings(prevRatings => 
        prevRatings.filter(r => r.id !== ratingId)
      );
      
      alert('Calificación aprobada con éxito');
    } catch (error) {
      console.error('Error approving rating:', error);
      alert('Error al aprobar la calificación');
    }
  };

  const rejectRating = async (ratingId: string) => {
    try {
      const ratingRef = doc(db, 'ratings', ratingId);
      
      await updateDoc(ratingRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: auth.currentUser?.uid
      });
      
      // Update the local state to reflect changes
      setRatings(prevRatings => 
        prevRatings.filter(r => r.id !== ratingId)
      );
      
      alert('Calificación rechazada');
    } catch (error) {
      console.error('Error rejecting rating:', error);
      alert('Error al rechazar la calificación');
    }
  };

  const formatDate = (timestamp: Timestamp | undefined | null) => {
    if (!timestamp) return 'Fecha desconocida';
    return timestamp instanceof Timestamp
      ? timestamp.toDate().toLocaleString('es-ES')
      : new Date(timestamp).toLocaleString('es-ES');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Aprobación de Calificaciones</h1>
        <p className="text-gray-600">Revisa y aprueba o rechaza calificaciones de profesores</p>
      </div>
      
      {/* Filters */}
      <div className="flex space-x-2 pb-4">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === 'pending'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === 'approved'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Aprobadas
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === 'rejected'
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Rechazadas
        </button>
      </div>
      
      {/* Ratings Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando calificaciones...</p>
          </div>
        ) : ratings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No hay calificaciones {filter === 'pending' ? 'pendientes' : filter === 'approved' ? 'aprobadas' : 'rechazadas'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profesor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Materia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Calificación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comentario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  {filter === 'pending' && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ratings.map((rating) => (
                  <tr key={rating.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        href={`/teacher/${rating.teacherId}`} 
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {teacherData[rating.teacherId] || 'Cargando...'}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{rating.subjectName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        Calidad: {rating.quality}/5
                      </div>
                      <div className="text-sm text-gray-500">
                        Dificultad: {rating.difficulty}/5
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md">
                        {rating.comment?.length > 100 
                          ? `${rating.comment.substring(0, 100)}...` 
                          : rating.comment}
                      </div>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {rating.modalidad}
                        </span>
                        {rating.tags?.map(tag => (
                          <span key={tag} className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDate(rating.createdAt)}
                      </div>
                    </td>
                    {filter === 'pending' && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => approveRating(rating.id)}
                          className="text-green-600 hover:text-green-900 mr-4"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => rejectRating(rating.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Rechazar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}