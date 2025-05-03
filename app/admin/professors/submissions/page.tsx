'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  Timestamp,
  setDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export default function ProfessorSubmissions() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'pending', 'approved', 'rejected'

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'professorSubmissions'),
        where('status', '==', filter)
      );
      
      const querySnapshot = await getDocs(q);
      const submissionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const approveSubmission = async (submissionId: string) => {
    try {
      const submissionRef = doc(db, 'professorSubmissions', submissionId);
      const submissionSnap = await getDoc(submissionRef);
      
      if (!submissionSnap.exists()) {
        alert('No se encontró la solicitud');
        return;
      }
      
      const submission = submissionSnap.data();
      
      // Ensure university name is properly formatted
      const universityName = submission.university.trim();
      
      // First, create the new professor in the teachers collection
      const teacherRef = doc(collection(db, 'teachers'));
      await setDoc(teacherRef, {
        name: submission.name.trim(),
        university: universityName,
        department: submission.department.trim(),
        createdAt: serverTimestamp(),
        approvedBy: auth.currentUser?.uid,
        submissionId: submissionId
      });
      
      // Check if this is a new university and create default settings if needed
      const universitySettingsRef = doc(db, 'universitySettings', universityName);
      const universitySettingsSnap = await getDoc(universitySettingsRef);
      
      if (!universitySettingsSnap.exists()) {
        // Create default university settings
        await setDoc(universitySettingsRef, {
          name: universityName,
          abbreviation: '', // Default empty abbreviation
          isActive: true,   // Default to active
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser?.uid
        });
      }
      
      // Then, update the submission status
      await updateDoc(submissionRef, {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: auth.currentUser?.uid,
        teacherId: teacherRef.id
      });
      
      // Update the local state to reflect changes
      setSubmissions(prevSubmissions => 
        prevSubmissions.filter(s => s.id !== submissionId)
      );
      
      alert('Profesor aprobado y añadido con éxito');
    } catch (error) {
      console.error('Error approving submission:', error);
      alert('Error al aprobar la solicitud');
    }
  };

  const rejectSubmission = async (submissionId: string) => {
    try {
      const submissionRef = doc(db, 'professorSubmissions', submissionId);
      
      await updateDoc(submissionRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: auth.currentUser?.uid
      });
      
      // Update the local state to reflect changes
      setSubmissions(prevSubmissions => 
        prevSubmissions.filter(s => s.id !== submissionId)
      );
      
      alert('Solicitud rechazada');
    } catch (error) {
      console.error('Error rejecting submission:', error);
      alert('Error al rechazar la solicitud');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Nuevos Profesores</h1>
        <p className="text-gray-600">Revisa y aprueba o rechaza solicitudes de nuevos profesores</p>
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
          Aprobados
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === 'rejected'
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Rechazados
        </button>
      </div>
      
      {/* Submissions Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando solicitudes...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No hay solicitudes {filter === 'pending' ? 'pendientes' : filter === 'approved' ? 'aprobadas' : 'rechazadas'}</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Universidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Departamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Solicitud
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Solicitante
                </th>
                {filter === 'pending' && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {submissions.map((submission) => (
                <tr key={submission.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{submission.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{submission.university}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{submission.department}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {submission.createdAt instanceof Timestamp 
                        ? submission.createdAt.toDate().toLocaleString('es-ES') 
                        : 'Fecha desconocida'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{submission.submittedBy || 'Usuario desconocido'}</div>
                  </td>
                  {filter === 'pending' && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => approveSubmission(submission.id)}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => rejectSubmission(submission.id)}
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
        )}
      </div>
    </div>
  );
}