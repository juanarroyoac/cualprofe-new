'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import TagsList from '../../components/TagsList';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

export default function RateTeacherPage() {
  const { teacherId } = useParams();
  const router = useRouter();
  const { currentUser, loading: authLoading, openAuthModal } = useAuth();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [existingRating, setExistingRating] = useState(null);

  // --- Form State ---
  const [quality, setQuality] = useState(3);
  const [difficulty, setDifficulty] = useState(3);
  const [modalidad, setModalidad] = useState('Presencial');
  const [subjectName, setSubjectName] = useState('');
  const [wouldTakeAgain, setWouldTakeAgain] = useState(true);
  const [grade, setGrade] = useState('');
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  // --- End Form State ---

  // Max comment length is now 300 characters, min is 50
  const MAX_COMMENT_LENGTH = 300;
  const MIN_COMMENT_LENGTH = 50;

  // Handle comment change with max length limit
  const handleCommentChange = (e) => {
    const text = e.target.value;
    if (text.length <= MAX_COMMENT_LENGTH) {
      setComment(text);
    }
  };

  // Check authentication status
  useEffect(() => {
    if (!authLoading && !currentUser) {
      openAuthModal('login');
      router.push(`/teacher/${teacherId}`);
    }
  }, [currentUser, authLoading, teacherId, router, openAuthModal]);

  // Fetch teacher data AND check for existing rating
  useEffect(() => {
    const fetchTeacherAndRating = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        // Fetch teacher data
        const teacherDoc = await getDoc(doc(db, 'teachers', teacherId));
        if (teacherDoc.exists()) { 
          setTeacher(teacherDoc.data()); 
          
          // Check if user has already rated this teacher
          const ratingsQuery = query(
            collection(db, 'ratings'),
            where('userId', '==', currentUser.uid),
            where('teacherId', '==', teacherId)
          );
          
          const ratingsSnapshot = await getDocs(ratingsQuery);
          
          if (!ratingsSnapshot.empty) {
            const ratingData = {
              id: ratingsSnapshot.docs[0].id,
              ...ratingsSnapshot.docs[0].data()
            };
            setExistingRating(ratingData);
            
            // Pre-fill form with existing rating data
            setQuality(ratingData.quality);
            setDifficulty(ratingData.difficulty);
            setModalidad(ratingData.modalidad || 'Presencial');
            setSubjectName(ratingData.subjectName);
            setWouldTakeAgain(ratingData.wouldTakeAgain);
            setGrade(ratingData.grade || '');
            setComment(ratingData.comment);
            setSelectedTags(ratingData.tags || []);
          }
        } else { 
          setError('Profesor no encontrado'); 
          setTeacher(null); 
        }
      } catch (err) { 
        console.error('Error fetching data:', err); 
        setError('Error al cargar los datos del profesor'); 
        setTeacher(null); 
      }
      finally { 
        setLoading(false); 
      }
    };
    
    if (teacherId && currentUser) { 
      fetchTeacherAndRating(); 
    } else { 
      setLoading(false); 
      if (teacherId) setError('Debes iniciar sesión para calificar a un profesor.'); 
      else setError('ID de profesor inválido.');
    }
  }, [teacherId, currentUser]);

  const handleTagsChange = (tags) => { setSelectedTags(tags); };

  // handleSubmit with updated validation
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setIsSubmitting(true); 
    setError(''); 
    setSuccess(false);
    
    const trimmedComment = comment.trim(); 
    const trimmedSubjectName = subjectName.trim();
    
    if (!trimmedSubjectName) { 
      setError('Por favor, ingresa el nombre de la materia.'); 
      setIsSubmitting(false); 
      return; 
    }
    
    if (trimmedComment.length < MIN_COMMENT_LENGTH) { 
      setError('Tu comentario es demasiado corto. Por favor, sé más específico.'); 
      setIsSubmitting(false); 
      return; 
    }
    
    try {
      const ratingData = {
        teacherId, 
        quality: Number(quality), 
        difficulty: Number(difficulty), 
        modalidad: modalidad,
        subjectName: trimmedSubjectName, 
        wouldTakeAgain, 
        grade: grade.trim() || null, 
        comment: trimmedComment,
        tags: selectedTags, 
        createdAt: serverTimestamp(),
        userId: currentUser?.uid,
      };

      if (existingRating) {
        // Update existing rating
        await updateDoc(doc(db, 'ratings', existingRating.id), ratingData);
        setSuccess(true);
        setTimeout(() => { router.push(`/teacher/${teacherId}`); }, 2000);
      } else {
        // Create new rating
        await addDoc(collection(db, 'ratings'), ratingData);
        setSuccess(true);
        setTimeout(() => { router.push(`/teacher/${teacherId}`); }, 2000);
      }
    } catch (err) { 
      console.error('Error submitting rating:', err); 
      setError('Error al enviar la calificación. Por favor, inténtalo de nuevo.'); 
      setSuccess(false); 
    }
    finally { 
      setIsSubmitting(false); 
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#00103f] mx-auto mb-4"></div>
          <p className="text-gray-600 font-roboto">Cargando...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !teacher) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
          <h1 className="text-xl font-bold mb-4 font-poppins text-[#00103f]">
            {error || 'No se pudieron cargar los datos del profesor.'}
          </h1>
          <Link href={`/teacher/${teacherId}`} className="mt-4 text-[#00103f] hover:text-[#001b6d] font-roboto transition-colors">
            Volver al perfil del profesor
          </Link>
        </div>
      </div>
    ); 
  }

  // Calculate remaining characters
  const remainingChars = MAX_COMMENT_LENGTH - comment.length;
  const isValidLength = comment.length >= MIN_COMMENT_LENGTH;

  return (
    <div className="max-w-full sm:max-w-md md:max-w-xl mx-auto px-4 py-4">
      <form onSubmit={handleSubmit}>
        {/* Header - As a separate box */}
        <div className="bg-[#00103f] text-white p-4 rounded-lg shadow-md mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{existingRating ? 'Editar calificación' : 'Calificar a'}</h1>
            <h2 className="text-lg font-medium">{teacher.name}</h2>
          </div>
          <Link 
            href={`/teacher/${teacherId}`} 
            className="text-white p-1 hover:bg-blue-800 rounded-full"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>
        </div>

        {existingRating && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-4 shadow-md">
            Ya has calificado a este profesor anteriormente. Estás editando tu calificación existente.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4 shadow-md">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-md text-center">
            <p className="font-semibold">¡Calificación {existingRating ? 'Actualizada' : 'Enviada'}!</p>
            <p className="text-sm mt-1">Gracias por compartir tu experiencia. Redireccionando...</p>
          </div>
        ) : (
          <>
            {/* Quality Rating - Separate box */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <h3 className="text-sm font-bold text-[#00103f] mb-3 uppercase">Calidad General</h3>
              <div className="flex items-center">
                <span className="text-xs text-gray-500 w-14">Terrible</span>
                
                <div className="flex flex-1 justify-between px-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button 
                      key={value} 
                      type="button" 
                      aria-label={`Calidad ${value}`} 
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        quality === value 
                          ? 'bg-[#00103f] text-white ring-1 ring-offset-1 ring-[#00103f]' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                      }`} 
                      onClick={() => setQuality(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                
                <span className="text-xs text-gray-500 w-14 text-right">Excelente</span>
              </div>
            </div>

            {/* Difficulty Rating - Separate box */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <h3 className="text-sm font-bold text-[#00103f] mb-3 uppercase">Nivel de Dificultad</h3>
              <div className="flex items-center">
                <span className="text-xs text-gray-500 w-14">Muy Fácil</span>
                
                <div className="flex flex-1 justify-between px-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button 
                      key={value} 
                      type="button" 
                      aria-label={`Dificultad ${value}`} 
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        difficulty === value 
                          ? 'bg-[#00103f] text-white ring-1 ring-offset-1 ring-[#00103f]' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                      }`} 
                      onClick={() => setDifficulty(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                
                <span className="text-xs text-gray-500 w-14 text-right">Muy Difícil</span>
              </div>
            </div>

            {/* Subject Name Field - Separate box */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <h3 className="text-sm font-bold text-[#00103f] mb-3 uppercase">Nombre de la Materia</h3>
              <label htmlFor="subjectName" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Materia <span className="text-red-600">*</span>
              </label>
              <input
                id="subjectName"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00103f] focus:border-[#00103f] text-sm"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="Ej. Cálculo II, Introducción a la Economía"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Escribe el nombre tal cual como aparece en el pensum.
              </p>
            </div>

            {/* Modality - Separate box */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <h3 className="text-sm font-bold text-[#00103f] mb-3 uppercase">Modalidad</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    className="form-radio text-[#00103f] h-4 w-4" 
                    name="modalidad" 
                    value="Presencial" 
                    checked={modalidad === 'Presencial'} 
                    onChange={(e) => setModalidad(e.target.value)}
                  />
                  <span className="ml-2 text-sm">Presencial</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    className="form-radio text-[#00103f] h-4 w-4" 
                    name="modalidad" 
                    value="Virtual" 
                    checked={modalidad === 'Virtual'} 
                    onChange={(e) => setModalidad(e.target.value)}
                  />
                  <span className="ml-2 text-sm">Virtual</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    className="form-radio text-[#00103f] h-4 w-4" 
                    name="modalidad" 
                    value="Semipresencial" 
                    checked={modalidad === 'Semipresencial'} 
                    onChange={(e) => setModalidad(e.target.value)}
                  />
                  <span className="ml-2 text-sm">Semipresencial</span>
                </label>
              </div>
            </div>

            {/* Would Take Again - Separate box */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <h3 className="text-sm font-bold text-[#00103f] mb-3 uppercase">¿Lo escogerías otra vez?</h3>
              <div className="flex space-x-6">
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    className="form-radio text-[#00103f] h-4 w-4" 
                    name="wouldTakeAgain" 
                    checked={wouldTakeAgain === true} 
                    onChange={() => setWouldTakeAgain(true)}
                  />
                  <span className="ml-2 text-sm">Sí</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    className="form-radio text-[#00103f] h-4 w-4" 
                    name="wouldTakeAgain" 
                    checked={wouldTakeAgain === false} 
                    onChange={() => setWouldTakeAgain(false)}
                  />
                  <span className="ml-2 text-sm">No</span>
                </label>
              </div>
            </div>

            {/* Grade - Separate box */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <h3 className="text-sm font-bold text-[#00103f] mb-3 uppercase">Tu Nota</h3>
              <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
                Tu Nota (opcional)
              </label>
              <input 
                id="grade" 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00103f] focus:border-[#00103f] text-sm" 
                value={grade} 
                onChange={(e) => setGrade(e.target.value)} 
                placeholder="Ej. 18 / 20"
              />
            </div>

            {/* Tags - Separate box */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <h3 className="text-sm font-bold text-[#00103f] mb-3 uppercase">Características del Profesor</h3>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecciona hasta 3 etiquetas que describan al profesor
              </label>
              <TagsList onChange={handleTagsChange} maxTags={3} selectable={true} />
            </div>

            {/* Comment - Separate box */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <h3 className="text-sm font-bold text-[#00103f] mb-3 uppercase">Tu Comentario</h3>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                Tu Comentario <span className="text-red-600">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Sé específico. Explica cómo enseña, cómo evalúa, y da consejos útiles para futuros estudiantes.
              </p>
              <textarea 
                id="comment" 
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#00103f] focus:border-[#00103f] text-sm ${
                  comment.length > 0 && !isValidLength ? 'border-red-300' : 'border-gray-300'
                }`}
                rows="5" 
                value={comment} 
                onChange={handleCommentChange} 
                placeholder="Comparte tu experiencia con este profesor..." 
                required 
                minLength={MIN_COMMENT_LENGTH}
                maxLength={MAX_COMMENT_LENGTH}
              ></textarea>
              <div className="flex justify-end mt-1">
                <p className={`text-xs ${
                  remainingChars <= 50 ? 'text-amber-500' : 
                  isValidLength ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {remainingChars} caracteres restantes
                </p>
              </div>
            </div>

            {/* Submit Button - Separate box */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <button 
                type="submit" 
                className={`w-full px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white transition-colors ${
                  isSubmitting ? 'bg-[#7783ba] cursor-not-allowed' : 'bg-[#00103f] hover:bg-[#001b6d]'
                }`} 
                disabled={isSubmitting || !isValidLength}
              > 
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </>
                ) : (
                  existingRating ? 'Actualizar Calificación' : 'Enviar Calificación'
                )}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}