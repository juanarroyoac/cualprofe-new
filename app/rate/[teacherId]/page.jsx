// app/rate/[teacherId]/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import TagsList from '../../../components/TagsList';
import Link from 'next/link';

export default function RateTeacherPage() {
  const { teacherId } = useParams();
  const router = useRouter();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Form state (moved from RateButton)
  const [quality, setQuality] = useState(3);
  const [difficulty, setDifficulty] = useState(3);
  const [forCredit, setForCredit] = useState(true);
  const [attendanceMandatory, setAttendanceMandatory] = useState(true);
  const [wouldTakeAgain, setWouldTakeAgain] = useState(true);
  const [grade, setGrade] = useState('');
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Fetch teacher data
  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const teacherDoc = await getDoc(doc(db, 'teachers', teacherId));
        if (teacherDoc.exists()) {
          setTeacher(teacherDoc.data());
        } else {
          setError('Profesor no encontrado');
        }
      } catch (err) {
        console.error('Error fetching teacher:', err);
        setError('Error al cargar los datos del profesor');
      } finally {
        setLoading(false);
      }
    };

    if (teacherId) {
      fetchTeacher();
    }
  }, [teacherId]);

  const handleTagsChange = (tags) => {
    setSelectedTags(tags);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Basic validation
      if (comment.length < 10) {
        setError('Por favor, proporciona un comentario de al menos 10 caracteres.');
        setIsSubmitting(false);
        return;
      }

      // Create rating object
      const ratingData = {
        teacherId,
        quality: Number(quality),
        difficulty: Number(difficulty),
        forCredit,
        attendanceMandatory,
        wouldTakeAgain,
        grade: grade || null,
        comment,
        tags: selectedTags,
        createdAt: serverTimestamp(),
      };

      // Add to Firestore
      await addDoc(collection(db, 'ratings'), ratingData);
      
      setSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        router.push(`/teacher/${teacherId}`);
      }, 2000);
    } catch (err) {
      console.error('Error submitting rating:', err);
      setError('Error al enviar la calificación. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#0F17FF]"></div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Profesor no encontrado</h1>
        <p>Lo sentimos, no pudimos encontrar el profesor que estás buscando.</p>
        <Link href="/" className="mt-4 text-blue-600 hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Calificar a {teacher.name}</h1>
          <Link 
            href={`/teacher/${teacherId}`}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>
        </div>

        {success ? (
          <div className="bg-green-100 text-green-800 p-4 rounded-md mb-4">
            ¡Tu calificación ha sido enviada con éxito! Redireccionando...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-100 text-red-800 p-4 rounded-md mb-4">
                {error}
              </div>
            )}

            {/* Quality Rating */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calidad General
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Terrible</span>
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`w-10 h-10 rounded-full ${
                      quality === value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    onClick={() => setQuality(value)}
                  >
                    {value}
                  </button>
                ))}
                <span className="text-sm text-gray-500">Excelente</span>
              </div>
            </div>

            {/* Difficulty Rating */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nivel de Dificultad
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Muy Fácil</span>
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`w-10 h-10 rounded-full ${
                      difficulty === value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    onClick={() => setDifficulty(value)}
                  >
                    {value}
                  </button>
                ))}
                <span className="text-sm text-gray-500">Muy Difícil</span>
              </div>
            </div>

            {/* Other Questions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Para crédito?
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      checked={forCredit}
                      onChange={() => setForCredit(true)}
                    />
                    <span className="ml-2">Sí</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      checked={!forCredit}
                      onChange={() => setForCredit(false)}
                    />
                    <span className="ml-2">No</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asistencia
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      checked={attendanceMandatory}
                      onChange={() => setAttendanceMandatory(true)}
                    />
                    <span className="ml-2">Obligatoria</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      checked={!attendanceMandatory}
                      onChange={() => setAttendanceMandatory(false)}
                    />
                    <span className="ml-2">Opcional</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Lo tomarías otra vez?
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      checked={wouldTakeAgain}
                      onChange={() => setWouldTakeAgain(true)}
                    />
                    <span className="ml-2">Sí</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      checked={!wouldTakeAgain}
                      onChange={() => setWouldTakeAgain(false)}
                    />
                    <span className="ml-2">No</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tu Nota (opcional)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="Ej. 18"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecciona hasta 3 etiquetas
              </label>
              <TagsList onChange={handleTagsChange} maxTags={3} />
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tu Comentario
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Comparte tu experiencia con este profesor..."
                required
              ></textarea>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </span>
                ) : (
                  'Enviar Calificación'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}