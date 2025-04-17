// app/rate/[teacherId]/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import TagsList from '../../components/TagsList';
import Link from 'next/link';

export default function RateTeacherPage() {
  const { teacherId } = useParams();
  const router = useRouter();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // Fetch teacher data (No changes)
  useEffect(() => {
    const fetchTeacher = async () => {
      setLoading(true);
      try {
        const teacherDoc = await getDoc(doc(db, 'teachers', teacherId));
        if (teacherDoc.exists()) { setTeacher(teacherDoc.data()); }
        else { setError('Profesor no encontrado'); setTeacher(null); }
      } catch (err) { console.error('Error fetching teacher:', err); setError('Error al cargar los datos del profesor'); setTeacher(null); }
      finally { setLoading(false); }
    };
    if (teacherId) { fetchTeacher(); } else { setLoading(false); setError('ID de profesor inválido.'); }
  }, [teacherId]);

  const handleTagsChange = (tags) => { setSelectedTags(tags); };

  // handleSubmit (No changes)
  const handleSubmit = async (e) => {
    e.preventDefault(); setIsSubmitting(true); setError(''); setSuccess(false);
    const trimmedComment = comment.trim(); const trimmedSubjectName = subjectName.trim();
    if (!trimmedSubjectName) { setError('Por favor, ingresa el nombre de la materia.'); setIsSubmitting(false); return; }
    if (trimmedComment.length < 200) { setError('Tu comentario debe tener al menos 200 caracteres para ser útil a otros estudiantes.'); setIsSubmitting(false); return; }
    try {
      const ratingData = {
        teacherId, quality: Number(quality), difficulty: Number(difficulty), modalidad: modalidad,
        subjectName: trimmedSubjectName, wouldTakeAgain, grade: grade.trim() || null, comment: trimmedComment,
        tags: selectedTags, createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'ratings'), ratingData);
      setSuccess(true);
      setTimeout(() => { router.push(`/teacher/${teacherId}`); }, 2000);
    } catch (err) { console.error('Error submitting rating:', err); setError('Error al enviar la calificación. Por favor, inténtalo de nuevo.'); setSuccess(false); }
    finally { setIsSubmitting(false); }
  };

  if (loading) { /* Loading spinner... */ return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>; }
  if (!teacher && !error) { setError('No se pudieron cargar los datos del profesor.'); }
  if (error) { /* Error display... */ return <div className="flex flex-col items-center justify-center min-h-screen text-center px-4"><h1 className="text-2xl font-bold mb-4">{error}</h1><Link href="/" className="mt-4 text-indigo-600 hover:underline"> Volver al inicio </Link></div>; }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6"> {/* ... Header content ... */}
             <div><h1 className="text-2xl font-bold font-poppins text-gray-800">Calificar a</h1><h2 className="text-xl font-semibold font-poppins text-indigo-700">{teacher.name}</h2></div>
             <Link href={`/teacher/${teacherId}`} className="text-gray-500 hover:text-gray-700 transition-colors" title="Cancelar y volver al perfil"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></Link>
        </div>

        {success ? ( /* Success Message... */
          <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-md mb-4 text-center"><p className="font-semibold">¡Calificación Enviada!</p><p className="text-sm">Gracias por compartir tu experiencia. Redireccionando...</p></div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && ( /* Form Error Display... */
              <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-md mb-4"> {error} </div>
            )}

            {/* Quality Rating */}
            <div className="mb-6"> {/* ... Quality buttons ... */}
                 <label className="block text-sm font-medium text-gray-700 mb-2">Calidad General</label>
                 <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Terrible</span>
                    {[1, 2, 3, 4, 5].map((value) => (<button key={value} type="button" aria-label={`Calidad ${value}`} className={`w-10 h-10 rounded-full transition-colors ${ quality === value ? 'bg-indigo-600 text-white ring-2 ring-offset-1 ring-indigo-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300' }`} onClick={() => setQuality(value)}>{value}</button>))}
                    <span className="text-sm text-gray-500">Excelente</span>
                 </div>
            </div>

            {/* Difficulty Rating */}
            <div className="mb-8"> {/* Increased bottom margin */} {/* ... Difficulty buttons ... */}
                 <label className="block text-sm font-medium text-gray-700 mb-2">Nivel de Dificultad</label>
                 <div className="flex items-center space-x-2">
                     <span className="text-sm text-gray-500">Muy Fácil</span>
                     {[1, 2, 3, 4, 5].map((value) => (<button key={value} type="button" aria-label={`Dificultad ${value}`} className={`w-10 h-10 rounded-full transition-colors ${ difficulty === value ? 'bg-indigo-600 text-white ring-2 ring-offset-1 ring-indigo-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300' }`} onClick={() => setDifficulty(value)}>{value}</button>))}
                     <span className="text-sm text-gray-500">Muy Difícil</span>
                 </div>
            </div>

            {/* --- Single Column Question Layout --- */}
            {/* Changed grid to single column, adjusted vertical gap */}
            <div className="grid grid-cols-1 gap-y-6 mb-8">

               {/* Subject Name Field */}
               <div> {/* Removed md:col-span-2 */}
                <label htmlFor="subjectName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Materia <span className="text-red-600">*</span>
                </label>
                <input
                  id="subjectName"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="Ej. Cálculo II, Introducción a la Economía"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                    Escribe el nombre tal cual como aparece en el pensum.
                </p>
              </div>

              {/* Modality */}
              <div> {/* ... Modality radios ... */}
                  <label className="block text-sm font-medium text-gray-700 mb-2">Modalidad</label>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    <label className="inline-flex items-center"><input type="radio" className="form-radio text-indigo-600" name="modalidad" value="Presencial" checked={modalidad === 'Presencial'} onChange={(e) => setModalidad(e.target.value)}/><span className="ml-2 text-sm">Presencial</span></label>
                    <label className="inline-flex items-center"><input type="radio" className="form-radio text-indigo-600" name="modalidad" value="Virtual" checked={modalidad === 'Virtual'} onChange={(e) => setModalidad(e.target.value)}/><span className="ml-2 text-sm">Virtual</span></label>
                    <label className="inline-flex items-center"><input type="radio" className="form-radio text-indigo-600" name="modalidad" value="Semipresencial" checked={modalidad === 'Semipresencial'} onChange={(e) => setModalidad(e.target.value)}/><span className="ml-2 text-sm">Semipresencial</span></label>
                  </div>
              </div>

              {/* Would Take Again - Text Updated */}
              <div>
                {/* Text changed here */}
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Lo escogerías otra vez?
                </label>
                <div className="flex space-x-4">
                    <label className="inline-flex items-center"><input type="radio" className="form-radio text-indigo-600" name="wouldTakeAgain" checked={wouldTakeAgain === true} onChange={() => setWouldTakeAgain(true)}/><span className="ml-2 text-sm">Sí</span></label>
                    <label className="inline-flex items-center"><input type="radio" className="form-radio text-indigo-600" name="wouldTakeAgain" checked={wouldTakeAgain === false} onChange={() => setWouldTakeAgain(false)}/><span className="ml-2 text-sm">No</span></label>
                  </div>
              </div>

              {/* Grade */}
              <div> {/* ... Grade input ... */}
                  <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">Tu Nota (opcional)</label>
                  <input id="grade" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Ej. 18 / 20"/>
              </div>

            </div>
            {/* --- End Single Column Question Layout --- */}


            {/* Tags */}
            <div className="mb-6"> {/* ... TagsList component ... */}
                 <label className="block text-sm font-medium text-gray-700 mb-2">Selecciona hasta 3 etiquetas que describan al profesor</label>
                 <TagsList onChange={handleTagsChange} maxTags={3} selectable={true} />
            </div>

            {/* Comment */}
            <div className="mb-6"> {/* ... Comment textarea ... */}
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">Tu Comentario (mínimo 200 caracteres) <span className="text-red-600">*</span></label>
                <p className="text-xs text-gray-500 mt-1 mb-2">Sé detallado/a. Explica cómo enseña, cómo evalúa, y da consejos útiles para futuros estudiantes. Un buen comentario ayuda mucho.</p>
                <textarea id="comment" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" rows="6" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comparte tu experiencia en detalle..." required minLength={200}></textarea>
                <p className="text-xs text-gray-500 mt-1 text-right">{comment.length} / 200 caracteres</p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end mt-8"> {/* ... Submit button ... */}
                  <button type="submit" className={`inline-flex justify-center items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${ isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500' }`} disabled={isSubmitting}> {isSubmitting ? ( <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Enviando...</> ) : ( 'Enviar Calificación' )} </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}