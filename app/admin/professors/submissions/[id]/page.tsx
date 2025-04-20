'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  doc, 
  getDoc,
  updateDoc, 
  setDoc,
  collection,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { approveTeacherSubmission } from '../../../lib/firestore-helpers';

interface Submission {
  id: string;
  name: string;
  university: string;
  department: string;
  submittedBy: string;
  submitterEmail?: string;
  createdAt: Timestamp;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

export default function SubmissionDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editedSubmission, setEditedSubmission] = useState<Partial<Submission>>({});

  // Load submission data
  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setLoading(true);
        setError('');
        
        const submissionDoc = await getDoc(doc(db, 'professorSubmissions', id));
        
        if (!submissionDoc.exists()) {
          setError('Solicitud no encontrada');
          return;
        }
        
        const submissionData = {
          id: submissionDoc.id,
          ...submissionDoc.data()
        } as Submission;
        
        setSubmission(submissionData);
        setEditedSubmission({
          name: submissionData.name,
          university: submissionData.university,
          department: submissionData.department,
          notes: submissionData.notes || ''
        });
      } catch (error) {
        console.error('Error fetching submission:', error);
        setError('Error al cargar la solicitud');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubmission();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedSubmission(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApprove = async () => {
    try {
      setProcessing(true);
      setError('');
      setSuccess('');
      
      // Validate required fields
      if (!editedSubmission.name || !editedSubmission.university || !editedSubmission.department) {
        setError('Los campos Nombre, Universidad y Departamento son obligatorios');
        setProcessing(false);
        return;
      }
      
      // First update the submission with edited values
      const submissionRef = doc(db, 'professorSubmissions', id);
      await updateDoc(submissionRef, {
        name: editedSubmission.name,
        university: editedSubmission.university,
        department: editedSubmission.department,
        notes: editedSubmission.notes,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.uid
      });
      
      // Then approve it
      const teacherId = await approveTeacherSubmission(id);
      
      setSuccess(`Profesor aprobado y añadido con éxito. ID: ${teacherId}`);
      
      // Update the local state
      if (submission) {
        setSubmission({
          ...submission,
          ...editedSubmission,
          status: 'approved'
        });
      }
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/admin/professors/${teacherId}`);
      }, 2000);
    } catch (error) {
      console.error('Error approving submission:', error);
      setError('Error al aprobar la solicitud');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      setProcessing(true);
      setError('');
      setSuccess('');
      
      const submissionRef = doc(db, 'professorSubmissions', id);
      await updateDoc(submissionRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: auth.currentUser?.uid,
        notes: editedSubmission.notes
      });
      
      setSuccess('Solicitud rechazada con éxito');
      
      // Update the local state
      if (submission) {
        setSubmission({
          ...submission,
          ...editedSubmission,
          status: 'rejected'
        });
      }
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/admin/professors/submissions');
      }, 2000);
    } catch (error) {
      console.error('Error rejecting submission:', error);
      setError('Error al rechazar la solicitud');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Solicitud no encontrada</h1>
        <p className="text-gray-600 mb-4">La solicitud que buscas no existe o ha sido eliminada.</p>
        <Link href="/admin/professors/submissions" className="text-blue-600 hover:text-blue-800">
          ← Volver a la lista de solicitudes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitud de Profesor</h1>
          <p className="text-gray-600">ID: {submission.id}</p>
        </div>
        <div>
          <Link 
            href="/admin/professors/submissions" 
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            ← Volver a la lista
          </Link>
        </div>
      </div>
      
      {/* Status badge */}
      <div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
          ${submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
            submission.status === 'approved' ? 'bg-green-100 text-green-800' : 
            'bg-red-100 text-red-800'}`}
        >
          {submission.status === 'pending' ? 'Pendiente' : 
           submission.status === 'approved' ? 'Aprobado' : 'Rechazado'}
        </span>
      </div>
      
      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Submission details */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Detalles de la solicitud</h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Profesor
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={editedSubmission.name || ''}
              onChange={handleInputChange}
              disabled={submission.status !== 'pending' || processing}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>
          
          <div>
            <label htmlFor="university" className="block text-sm font-medium text-gray-700 mb-1">
              Universidad
            </label>
            <input
              type="text"
              id="university"
              name="university"
              value={editedSubmission.university || ''}
              onChange={handleInputChange}
              disabled={submission.status !== 'pending' || processing}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>
          
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              Departamento
            </label>
            <input
              type="text"
              id="department"
              name="department"
              value={editedSubmission.department || ''}
              onChange={handleInputChange}
              disabled={submission.status !== 'pending' || processing}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>
          
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notas administrativas
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={editedSubmission.notes || ''}
              onChange={handleInputChange}
              disabled={processing}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Añade notas internas sobre esta solicitud..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Solicitante</h3>
              <p className="text-sm text-gray-900">{submission.submittedBy || 'Anónimo'}</p>
              {submission.submitterEmail && (
                <p className="text-sm text-gray-500">{submission.submitterEmail}</p>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Fecha de solicitud</h3>
              <p className="text-sm text-gray-900">
                {submission.createdAt instanceof Timestamp
                  ? submission.createdAt.toDate().toLocaleString('es-ES')
                  : 'Fecha desconocida'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      {submission.status === 'pending' && (
        <div className="flex space-x-4">
          <button
            onClick={handleApprove}
            disabled={processing}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300"
          >
            {processing ? 'Procesando...' : 'Aprobar y crear profesor'}
          </button>
          
          <button
            onClick={handleReject}
            disabled={processing}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300"
          >
            {processing ? 'Procesando...' : 'Rechazar solicitud'}
          </button>
        </div>
      )}
    </div>
  );
}