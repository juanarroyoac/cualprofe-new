'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react'; // Added useRef
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase'; // Adjust path if needed
import TagsList from '../../components/TagsList'; // Adjust path if needed
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext'; // Adjust path if needed
import { useViewTracking } from '../../contexts/ViewTrackingContext'; // Adjust path if needed
import LoginLimiter from '../../components/LoginLimiter'; // Adjust path if needed

export default function Page() {
  const params = useParams();
  const id = params?.id; // Get ID safely from params
  const router = useRouter();

  // State variables
  const [teacher, setTeacher] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [averageDifficulty, setAverageDifficulty] = useState(0);
  const [wouldTakeAgainPercent, setWouldTakeAgainPercent] = useState(0);
  const [distributionData, setDistributionData] = useState([0, 0, 0, 0, 0]);
  const [topTags, setTopTags] = useState([]);

  // Contexts
  const { currentUser, openAuthModal } = useAuth();
  const { incrementProfessorView } = useViewTracking();

  // ****** ADDED: Ref to track if view incremented for this mount ******
  const viewIncrementedRef = useRef(false);

  // ****** UPDATED: Refined useEffect for view tracking ******
  useEffect(() => {
    // Ensure id is a valid string before proceeding
    const professorId = typeof id === 'string' ? id : undefined;

    // Conditions to increment:
    // 1. We have a valid professor ID.
    // 2. The user is NOT logged in.
    // 3. We haven't already incremented the view for this component mount.
    if (professorId && !currentUser && !viewIncrementedRef.current) {
      incrementProfessorView(professorId);
      viewIncrementedRef.current = true; // Mark as incremented for this mount
      console.log(`View increment triggered for professor ${professorId}`);
    }
  // Dependencies: Run when ID changes, user logs in/out, or the (stable) increment function changes.
  }, [id, currentUser, incrementProfessorView]);

  const handleRateClick = () => {
    const professorId = typeof id === 'string' ? id : undefined;
    if (!professorId) return; // Should not happen if button is visible

    if (currentUser) {
      router.push(`/rate/${professorId}`);
    } else {
      openAuthModal('login', `/rate/${professorId}`);
    }
  };

  // --- Data Fetching ---
  useEffect(() => {
    const professorId = typeof id === 'string' ? id : undefined;
    if (!professorId) {
        setLoading(false);
        setTeacher(null); // Explicitly set teacher to null if ID is invalid/missing
        console.error('Invalid or missing professor ID.');
        return; // Exit early if no valid ID
    }

    const fetchTeacherAndRatings = async () => {
      setLoading(true);
      try {
        const teacherDoc = await getDoc(doc(db, 'teachers', professorId));
        if (teacherDoc.exists()) {
          setTeacher(teacherDoc.data());
        } else {
          console.error('No se encontró el profesor con ID:', professorId);
          setTeacher(null); setLoading(false); return;
        }

        const ratingsQuery = query(collection(db, 'ratings'), where('teacherId', '==', professorId));
        const ratingsSnapshot = await getDocs(ratingsQuery);
        const ratingsData = ratingsSnapshot.docs.map(doc => {
          const data = doc.data();
          let createdAtDate = new Date(); // Default to now if timestamp is invalid
          if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            createdAtDate = data.createdAt.toDate();
          } else if (data.createdAt instanceof Date) { // Handle JS Date objects if stored directly
            createdAtDate = data.createdAt;
          } else if (typeof data.createdAt === 'string' || typeof data.createdAt === 'number') {
              // Attempt to parse if it's a string/number timestamp
              const parsedDate = new Date(data.createdAt);
              if (!isNaN(parsedDate.getTime())) {
                  createdAtDate = parsedDate;
              }
          }

          return {
            id: doc.id,
            ...data,
            createdAt: createdAtDate
          };
        });

        // Sort by date descending
        ratingsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setRatings(ratingsData);

        // Calculate stats
        if (ratingsData.length > 0) {
          const totalRatingsCount = ratingsData.length;
          const avgRating = ratingsData.reduce((sum, rating) => sum + (rating.quality || 0), 0) / totalRatingsCount;
          setAverageRating(parseFloat(avgRating.toFixed(1)));
          const avgDifficulty = ratingsData.reduce((sum, rating) => sum + (rating.difficulty || 0), 0) / totalRatingsCount;
          setAverageDifficulty(parseFloat(avgDifficulty.toFixed(1)));
          const wouldTakeAgainCount = ratingsData.filter(rating => rating.wouldTakeAgain === true).length;
          const wouldTakeAgainPerc = totalRatingsCount > 0 ? (wouldTakeAgainCount / totalRatingsCount) * 100 : 0;
          setWouldTakeAgainPercent(Math.round(wouldTakeAgainPerc));

          // Calculate distribution (ensure quality is a number between 1 and 5)
          const distribution = [0, 0, 0, 0, 0];
          ratingsData.forEach(rating => {
            const qualityScore = Math.round(rating.quality || 0); // Default to 0 if missing
            if (qualityScore >= 1 && qualityScore <= 5) {
               const ratingIndex = Math.max(0, Math.min(4, qualityScore - 1));
               distribution[ratingIndex]++;
            }
          });
          setDistributionData([...distribution].reverse()); // Reverse for display [5, 4, 3, 2, 1]

          // Calculate top tags
          const tagCounts = {};
          ratingsData.forEach(rating => {
            if (rating.tags && Array.isArray(rating.tags)) {
              rating.tags.forEach(tag => {
                if (typeof tag === 'string' && tag.trim() !== '') { // Ensure tag is valid string
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                }
              });
            }
          });
          const sortedTags = Object.entries(tagCounts)
                                 .sort(([, countA], [, countB]) => countB - countA) // Sort by count desc
                                 .slice(0, 5) // Take top 5
                                 .map(([tag]) => tag); // Get tag names
          setTopTags(sortedTags);

        } else {
           // Reset stats if no ratings
           setAverageRating(0);
           setAverageDifficulty(0);
           setWouldTakeAgainPercent(0);
           setDistributionData([0, 0, 0, 0, 0]);
           setTopTags([]);
        }
      } catch (error) {
         console.error('Error fetching teacher or ratings data:', error);
         setTeacher(null); // Ensure teacher is null on error
         setRatings([]); // Clear ratings on error
      } finally {
         setLoading(false);
      }
    };

    fetchTeacherAndRatings();

  }, [id]); // Dependency: only fetch data when ID changes
  // --- End Data Fetching ---

  // --- Loading State ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  // --- Not Found State ---
  // Handle cases where loading is false but teacher is still null (not found or error)
  if (!teacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4">
        <h1 className="text-3xl font-bold font-poppins text-gray-700 mb-3">Profesor no encontrado</h1>
        <p className="text-gray-500">Lo sentimos, no pudimos encontrar datos para el profesor solicitado o ocurrió un error.</p>
        <Link href="/" className="mt-6 inline-block bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors">
            Volver al inicio
        </Link>
      </div>
    );
  }

  // --- Prepare data for rendering ---
  const firstName = teacher.name?.split(' ')[0] || 'Profesor'; // Handle potential missing name
  const ratingLabels = ["5", "4", "3", "2", "1"];
  const totalRatingsCount = ratings.length;

  // --- Page Render ---
  return (
    // LoginLimiter now correctly wraps the content and uses the updated context
    <LoginLimiter>
      <div className="container mx-auto px-4 py-10 md:py-16 max-w-5xl">

        {/* Teacher Header Section */}
        <section className="mb-10 md:mb-12">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex-grow">
                <h1 className="text-4xl sm:text-5xl font-bold font-poppins text-[#00103f] mb-1">
                  {teacher.name || 'Nombre no disponible'}
                </h1>
                <p className="text-base text-gray-600">
                  {/* Safely access nested properties */}
                  Profesor/a en {teacher.department || teacher.school || 'Departamento/Escuela no especificado'} de la <span className="font-semibold text-indigo-700">{teacher.university || 'Universidad no especificada'}</span>
                </p>
            </div>
            <div className="flex-shrink-0 mt-3 sm:mt-0">
                <button
                    onClick={handleRateClick}
                    className="bg-[#00103f] hover:bg-[#00248c] text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    // Disable button if ID is somehow invalid at this stage
                    disabled={!(typeof id === 'string' && id)}
                  >
                    Calificar a {firstName}
                </button>
            </div>
          </div>
          {topTags.length > 0 && (
            <div className="mt-5">
                  <TagsList tags={topTags} selectable={false} small={true} uppercase={true} />
            </div>
          )}
        </section>

        {/* Stats & Distribution Section */}
        <section className="mb-10 md:mb-14 p-6 bg-gray-50 rounded-lg shadow-sm">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              {/* Left Side: Overall Score & Key Stats */}
              <div className="text-center md:text-left">
                  <div className="mb-3">
                      {/* Display rating, handle 0 case */}
                      <span className="text-6xl lg:text-7xl font-bold font-poppins text-[#00103f]">{totalRatingsCount > 0 ? averageRating.toFixed(1) : 'N/A'}</span>
                      {totalRatingsCount > 0 && <span className="text-2xl lg:text-3xl font-poppins text-gray-500">/5</span>}
                  </div>
                  <p className="text-sm text-gray-600 mb-6">
                      {totalRatingsCount > 0
                        ? `Calidad General basada en ${totalRatingsCount} ${totalRatingsCount === 1 ? 'calificación' : 'calificaciones'}`
                        : 'Aún no hay calificaciones para calcular la calidad general.'}
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4 sm:gap-6">
                      {/* Would Take Again Stat */}
                      <div className="bg-white p-3 rounded-lg text-center shadow-sm min-w-[140px]">
                          <div className="text-2xl font-bold font-poppins text-[#00103f]">{totalRatingsCount > 0 ? `${wouldTakeAgainPercent}%` : 'N/A'}</div>
                          <div className="text-xs text-gray-600 mt-1">Lo escogería otra vez</div>
                      </div>
                      {/* Difficulty Stat */}
                      <div className="bg-white p-3 rounded-lg text-center shadow-sm min-w-[140px]">
                          <div className="text-2xl font-bold font-poppins text-[#00103f]">
                            {totalRatingsCount > 0 ? averageDifficulty.toFixed(1) : 'N/A'}
                            {totalRatingsCount > 0 && <span className="text-base text-gray-500">/5</span>}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">Nivel de Dificultad</div>
                      </div>
                  </div>
              </div>
              {/* Right Side: Rating Distribution */}
              <div className="w-full">
                  <h3 className="text-lg font-semibold font-poppins text-[#00103f] mb-4 text-center md:text-left">Distribución de Calificaciones</h3>
                  {totalRatingsCount > 0 ? (
                      <div className="space-y-2.5">
                          {ratingLabels.map((label, index) => {
                              const count = distributionData[index] || 0;
                              // Ensure totalRatingsCount > 0 to prevent division by zero
                              const percentage = totalRatingsCount > 0 ? (count / totalRatingsCount) * 100 : 0;
                              return (
                              <div key={label} className="flex items-center text-sm">
                                  <div className="w-4 font-medium text-gray-700">{label}</div>
                                  <div className="flex-1 mx-3 bg-gray-200 h-4 rounded-full overflow-hidden">
                                    {/* Add a title for accessibility/hover */}
                                    <div className="h-full bg-indigo-600 transition-all duration-500 ease-out" style={{ width: `${percentage}%` }} title={`${count} calificación${count !== 1 ? 'es' : ''} (${percentage.toFixed(0)}%)`}></div>
                                  </div>
                                  <div className="w-8 text-right font-medium text-gray-700">{count}</div>
                              </div>
                              );
                          })}
                      </div>
                  ) : (
                     <p className="text-sm text-gray-500 italic text-center md:text-left">Aún no hay calificaciones para mostrar la distribución.</p>
                  )}
              </div>
          </div>
        </section>

        {/* --- Ratings Feed Section --- */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold font-poppins text-[#00103f] mb-6 pb-3 border-b border-gray-200">
            {totalRatingsCount} {totalRatingsCount === 1 ? 'Calificación' : 'Calificaciones'} de Estudiantes
          </h2>

          {ratings.length > 0 ? (
            <div className="space-y-8">
              {ratings.map(rating => (
                // --- Individual Rating Card ---
                <div key={rating.id} className="border border-gray-200 bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-200">

                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    {/* Left side: Course info, comment, tags */}
                    <div className="flex-grow">
                      <div className="mb-4">
                         {/* Display Subject Name if available */}
                         {rating.subjectName && (
                          <h5 className="text-lg font-semibold font-poppins text-gray-800 uppercase mb-1">
                            {rating.subjectName}
                          </h5>
                         )}
                         {/* Display Course Code if available */}
                         {rating.course && (<h4 className="font-semibold text-gray-600 text-sm mb-1">{rating.course}</h4>)}
                         {/* Display Date */}
                         <p className="text-xs text-gray-500">
                            {rating.createdAt instanceof Date && !isNaN(rating.createdAt.getTime())
                             ? rating.createdAt.toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' })
                             : 'Fecha inválida'}
                         </p>
                      </div>

                      {/* Comment */}
                      {rating.comment && (
                        <p className="text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">{rating.comment}</p> // Added whitespace-pre-wrap
                      )}

                      {/* Tags */}
                      {rating.tags && Array.isArray(rating.tags) && rating.tags.length > 0 && (
                        <div className="mb-4">
                          <TagsList tags={rating.tags.filter(tag => typeof tag === 'string')} selectable={false} small={true} uppercase={true} />
                        </div>
                      )}
                    </div>

                    {/* Right Column: Rating Scores */}
                    <div className="flex-shrink-0 flex flex-row md:flex-col items-center md:items-end gap-x-4 gap-y-3 mt-2 md:mt-0">
                      {/* Quality Score */}
                      <div className="text-center md:text-right">
                        <p className="text-xs font-poppins text-gray-500 uppercase tracking-wide mb-1">Calidad</p>
                        <div className="bg-indigo-100 text-indigo-800 inline-block px-3 py-1 rounded-lg text-center min-w-[65px]">
                          <span className="text-2xl font-bold font-poppins">{(rating.quality ?? 0).toFixed(1)}</span>
                        </div>
                      </div>
                      {/* Difficulty Score */}
                      <div className="text-center md:text-right">
                        <p className="text-xs font-poppins text-gray-500 uppercase tracking-wide mb-1">Dificultad</p>
                        <div className="bg-gray-100 text-gray-800 inline-block px-3 py-1 rounded-lg text-center min-w-[65px]">
                          <span className="text-2xl font-bold font-poppins">{(rating.difficulty ?? 0).toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rating Details Grid (Optional fields) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm border-t border-gray-100 pt-4 mt-4">
                    <div><span className="text-gray-500 mr-1">Lo tomaría otra vez:</span><span className="font-medium">{typeof rating.wouldTakeAgain === 'boolean' ? (rating.wouldTakeAgain ? 'Sí' : 'No') : 'N/A'}</span></div>
                    {rating.modalidad && <div><span className="text-gray-500 mr-1">Modalidad:</span><span className="font-medium">{rating.modalidad}</span></div>}
                    {rating.nrc && <div><span className="text-gray-500 mr-1">NRC:</span><span className="font-medium">{rating.nrc}</span></div>}
                    {rating.grade && <div><span className="text-gray-500 mr-1">Nota Obtenida:</span><span className="font-medium">{rating.grade}</span></div>}
                    {/* Add more optional fields as needed */}
                  </div>

                </div> // End Individual Rating Card
              ))}
            </div>
          ) : (
            // Empty state when no ratings exist
            <div className="text-center py-10 px-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold font-poppins text-gray-700 mb-2">Aún no hay calificaciones</h3>
                <p className="text-sm text-gray-500 mb-4">Sé el primero en calificar a {firstName} y ayuda a otros estudiantes.</p>
                <button
                    onClick={handleRateClick}
                    className="bg-[#00103f] hover:bg-[#00248c] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                     disabled={!(typeof id === 'string' && id)}
                  >
                    Calificar ahora
                </button>
            </div>
          )}
        </section>
      </div>
    </LoginLimiter>
  );
}