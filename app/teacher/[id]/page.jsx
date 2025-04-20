'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import TagsList from '../../components/TagsList';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { useViewTracking } from '../../contexts/ViewTrackingContext';
import LoginLimiter from '../../components/LoginLimiter';

export default function Page() {
  const params = useParams();
  const id = params?.id;
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
  const viewIncrementedRef = useRef(false);

  useEffect(() => {
    const professorId = typeof id === 'string' ? id : undefined;
    if (professorId && !currentUser && !viewIncrementedRef.current) {
      incrementProfessorView(professorId);
      viewIncrementedRef.current = true;
    }
  }, [id, currentUser, incrementProfessorView]);

  const handleRateClick = () => {
    const professorId = typeof id === 'string' ? id : undefined;
    if (!professorId) return;

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
        setTeacher(null);
        return;
    }

    const fetchTeacherAndRatings = async () => {
      setLoading(true);
      try {
        const teacherDoc = await getDoc(doc(db, 'teachers', professorId));
        if (teacherDoc.exists()) {
          setTeacher(teacherDoc.data());
        } else {
          setTeacher(null); 
          setLoading(false); 
          return;
        }

        const ratingsQuery = query(collection(db, 'ratings'), where('teacherId', '==', professorId));
        const ratingsSnapshot = await getDocs(ratingsQuery);
        const ratingsData = ratingsSnapshot.docs.map(doc => {
          const data = doc.data();
          let createdAtDate = new Date();
          if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            createdAtDate = data.createdAt.toDate();
          } else if (data.createdAt instanceof Date) {
            createdAtDate = data.createdAt;
          } else if (typeof data.createdAt === 'string' || typeof data.createdAt === 'number') {
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

        ratingsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setRatings(ratingsData);

        if (ratingsData.length > 0) {
          const totalRatingsCount = ratingsData.length;
          const avgRating = ratingsData.reduce((sum, rating) => sum + (rating.quality || 0), 0) / totalRatingsCount;
          setAverageRating(parseFloat(avgRating.toFixed(1)));
          const avgDifficulty = ratingsData.reduce((sum, rating) => sum + (rating.difficulty || 0), 0) / totalRatingsCount;
          setAverageDifficulty(parseFloat(avgDifficulty.toFixed(1)));
          const wouldTakeAgainCount = ratingsData.filter(rating => rating.wouldTakeAgain === true).length;
          const wouldTakeAgainPerc = totalRatingsCount > 0 ? (wouldTakeAgainCount / totalRatingsCount) * 100 : 0;
          setWouldTakeAgainPercent(Math.round(wouldTakeAgainPerc));

          const distribution = [0, 0, 0, 0, 0];
          ratingsData.forEach(rating => {
            const qualityScore = Math.round(rating.quality || 0);
            if (qualityScore >= 1 && qualityScore <= 5) {
               const ratingIndex = Math.max(0, Math.min(4, qualityScore - 1));
               distribution[ratingIndex]++;
            }
          });
          setDistributionData([...distribution].reverse());

          const tagCounts = {};
          ratingsData.forEach(rating => {
            if (rating.tags && Array.isArray(rating.tags)) {
              rating.tags.forEach(tag => {
                if (typeof tag === 'string' && tag.trim() !== '') {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                }
              });
            }
          });
          const sortedTags = Object.entries(tagCounts)
                                 .sort(([, countA], [, countB]) => countB - countA)
                                 .slice(0, 5)
                                 .map(([tag]) => tag);
          setTopTags(sortedTags);

        } else {
           setAverageRating(0);
           setAverageDifficulty(0);
           setWouldTakeAgainPercent(0);
           setDistributionData([0, 0, 0, 0, 0]);
           setTopTags([]);
        }
      } catch (error) {
         console.error('Error fetching teacher or ratings data:', error);
         setTeacher(null);
         setRatings([]);
      } finally {
         setLoading(false);
      }
    };

    fetchTeacherAndRatings();

  }, [id]);

  // --- Loading State ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#00103f]"></div>
      </div>
    );
  }

  // --- Not Found State ---
  if (!teacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4">
        <h1 className="text-3xl font-bold font-poppins text-[#00103f] mb-3">Profesor no encontrado</h1>
        <p className="text-gray-500 font-roboto">Lo sentimos, no pudimos encontrar datos para el profesor solicitado o ocurrió un error.</p>
        <Link href="/" className="mt-6 inline-block bg-[#00103f] hover:bg-[#00248c] text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors">
            Volver al inicio
        </Link>
      </div>
    );
  }

  // --- Prepare data for rendering ---
  const firstName = teacher.name?.split(' ')[0] || 'Profesor';
  const ratingLabels = ["5", "4", "3", "2", "1"];
  const totalRatingsCount = ratings.length;

  // --- Page Render ---
  return (
    <LoginLimiter>
      <div className="w-full bg-[#f9fafc]">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Teacher Header Section */}
          <section className="mb-10">
            <div className="p-8">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex-grow">
                  <h1 className="text-4xl sm:text-5xl font-poppins font-bold text-[#00103f] mb-2">
                    {teacher.name || 'Nombre no disponible'}
                  </h1>
                  <p className="text-base text-gray-600 font-roboto">
                    Profesor/a en {teacher.department || teacher.school || 'Departamento/Escuela no especificado'} de la <span className="font-semibold text-[#00248c]">{teacher.university || 'Universidad no especificada'}</span>
                  </p>
                </div>
                <div className="flex-shrink-0 mt-3 sm:mt-0">
                  <button
                    onClick={handleRateClick}
                    className="bg-[#00103f] hover:bg-[#00248c] text-white rounded-lg px-5 py-3 text-sm font-medium transition-colors shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    disabled={!(typeof id === 'string' && id)}
                  >
                    Calificar a {firstName}
                  </button>
                </div>
              </div>
              {topTags.length > 0 && (
                <div className="mt-6">
                  <TagsList tags={topTags} selectable={false} small={true} uppercase={true} />
                </div>
              )}
            </div>
          </section>

          {/* Stats & Distribution Section */}
          <section className="mb-10">
            <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Side: Overall Score & Key Stats */}
              <div className="flex flex-col justify-center items-center md:items-start">
                <div className="mb-6 text-center md:text-left">
                  {/* Display rating with enhanced sizing */}
                  <div className="flex items-center justify-center md:justify-start">
                    <span className="text-7xl font-poppins font-bold text-[#00103f]">
                      {totalRatingsCount > 0 ? averageRating.toFixed(1) : 'N/A'}
                    </span>
                    {totalRatingsCount > 0 && 
                      <span className="text-3xl font-poppins text-gray-400 ml-1 mt-3">/5</span>
                    }
                  </div>
                  <p className="text-sm text-gray-500 mt-2 font-roboto">
                    {totalRatingsCount > 0
                      ? `Calidad General basada en ${totalRatingsCount} ${totalRatingsCount === 1 ? 'calificación' : 'calificaciones'}`
                      : 'Aún no hay calificaciones para calcular la calidad general.'}
                  </p>
                </div>
                <div className="flex flex-row justify-center md:justify-start gap-4 w-full">
                  {/* Would Take Again Stat */}
                  <div className="bg-white p-4 rounded-lg text-center shadow-sm flex-1 border border-gray-100">
                    <div className="text-3xl font-poppins font-bold text-[#00103f]">
                      {totalRatingsCount > 0 ? `${wouldTakeAgainPercent}%` : 'N/A'}
                    </div>
                    <div className="text-xs uppercase tracking-wide text-gray-600 mt-1 font-poppins">Lo escogería otra vez</div>
                  </div>
                  {/* Difficulty Stat */}
                  <div className="bg-white p-4 rounded-lg text-center shadow-sm flex-1 border border-gray-100">
                    <div className="text-3xl font-poppins font-bold text-[#00103f]">
                      {totalRatingsCount > 0 ? averageDifficulty.toFixed(1) : 'N/A'}
                      {totalRatingsCount > 0 && 
                        <span className="text-xl text-gray-400">/5</span>
                      }
                    </div>
                    <div className="text-xs uppercase tracking-wide text-gray-600 mt-1 font-poppins">Nivel de Dificultad</div>
                  </div>
                </div>
              </div>
              
              {/* Right Side: Rating Distribution */}
              <div className="bg-gray-50 rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold font-poppins text-[#00103f] mb-4 text-center md:text-left">
                  Distribución de Calificaciones
                </h3>
                {totalRatingsCount > 0 ? (
                  <div className="space-y-3">
                    {ratingLabels.map((label, index) => {
                      const count = distributionData[index] || 0;
                      const percentage = totalRatingsCount > 0 ? (count / totalRatingsCount) * 100 : 0;
                      
                      // Define color based on rating value - using a single blue color now
                      const barColor = "bg-[#00103f]";
                      
                      return (
                        <div key={label} className="flex items-center text-sm">
                          <div className="w-6 font-roboto font-medium text-gray-700 text-center">{label}</div>
                          <div className="flex-1 mx-3 bg-gray-200 h-5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${barColor} transition-all duration-500 ease-out`} 
                              style={{ width: `${percentage}%` }} 
                              title={`${count} calificación${count !== 1 ? 'es' : ''} (${percentage.toFixed(0)}%)`}
                            ></div>
                          </div>
                          <div className="w-8 text-right font-medium text-gray-700 font-roboto">{count}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-sm text-gray-500 italic text-center font-roboto">
                      Aún no hay calificaciones para mostrar la distribución.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* --- Ratings Feed Section --- */}
          <section className="mb-10">
            <h2 className="text-2xl md:text-3xl font-poppins font-bold text-[#00103f] mb-6 pb-3 border-b border-gray-200">
              {totalRatingsCount} {totalRatingsCount === 1 ? 'Calificación' : 'Calificaciones'} de Estudiantes
            </h2>

            {ratings.length > 0 ? (
              <div className="space-y-6">
                {ratings.map(rating => (
                  <div key={rating.id} className="border border-gray-200 bg-white rounded-lg p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      {/* Left side: Course info, comment, tags */}
                      <div className="flex-grow">
                        <div className="mb-4">
                          {/* Display Subject Name if available */}
                          {rating.subjectName && (
                            <h5 className="text-lg font-semibold font-poppins text-[#00103f] uppercase mb-1">
                              {rating.subjectName}
                            </h5>
                          )}
                          {/* Display Course Code if available */}
                          {rating.course && (
                            <h4 className="font-medium text-gray-600 text-sm mb-1 font-roboto">{rating.course}</h4>
                          )}
                          {/* Display Date with icon */}
                          <p className="text-xs text-gray-500 font-roboto flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {rating.createdAt instanceof Date && !isNaN(rating.createdAt.getTime())
                              ? rating.createdAt.toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' })
                              : 'Fecha inválida'}
                          </p>
                        </div>

                        {/* Comment with quote styling */}
                        {rating.comment && (
                          <div className="relative pl-4 mb-4 border-l-2 border-gray-200">
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap font-roboto">
                              {rating.comment}
                            </p>
                          </div>
                        )}

                        {/* Tags */}
                        {rating.tags && Array.isArray(rating.tags) && rating.tags.length > 0 && (
                          <div className="mb-4">
                            <TagsList tags={rating.tags.filter(tag => typeof tag === 'string')} selectable={false} small={true} uppercase={true} />
                          </div>
                        )}
                      </div>

                      {/* Right Column: Rating Scores */}
                      <div className="flex-shrink-0 flex flex-row md:flex-col items-center md:items-end gap-4 mt-2 md:mt-0">
                        {/* Quality Score */}
                        <div className="text-center md:text-right">
                          <p className="text-xs font-poppins text-gray-500 uppercase tracking-wide mb-1">Calidad</p>
                          <div className="bg-[#f0f4ff] text-[#00103f] inline-block px-4 py-2 rounded-lg text-center min-w-[70px]">
                            <span className="text-2xl font-poppins font-bold">{(rating.quality ?? 0).toFixed(1)}</span>
                          </div>
                        </div>
                        {/* Difficulty Score */}
                        <div className="text-center md:text-right">
                          <p className="text-xs font-poppins text-gray-500 uppercase tracking-wide mb-1">Dificultad</p>
                          <div className="bg-gray-100 text-gray-800 inline-block px-4 py-2 rounded-lg text-center min-w-[70px]">
                            <span className="text-2xl font-poppins font-bold">{(rating.difficulty ?? 0).toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rating Details Grid (Optional fields) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm border-t border-gray-100 pt-4 mt-4 font-roboto">
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-1">Lo tomaría otra vez:</span>
                        <span className="font-medium">
                          {typeof rating.wouldTakeAgain === 'boolean' ? (
                            rating.wouldTakeAgain ? (
                              <span className="text-green-600 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Sí
                              </span>
                            ) : (
                              <span className="text-red-500 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                No
                              </span>
                            )
                          ) : 'N/A'}
                        </span>
                      </div>
                      {rating.modalidad && (
                        <div><span className="text-gray-500 mr-1">Modalidad:</span><span className="font-medium">{rating.modalidad}</span></div>
                      )}
                      {rating.nrc && (
                        <div><span className="text-gray-500 mr-1">NRC:</span><span className="font-medium">{rating.nrc}</span></div>
                      )}
                      {rating.grade && (
                        <div><span className="text-gray-500 mr-1">Nota Obtenida:</span><span className="font-medium">{rating.grade}</span></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Empty state when no ratings exist
              <div className="text-center py-12 px-6 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                <div className="inline-block p-4 bg-white rounded-full mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#00103f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold font-poppins text-[#00103f] mb-2">Aún no hay calificaciones</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto font-roboto">
                  Sé el primero en calificar a {firstName} y ayuda a otros estudiantes a elegir sus clases con confianza.
                </p>
                <button
                  onClick={handleRateClick}
                  className="bg-[#00103f] hover:bg-[#00248c] text-white rounded-lg px-6 py-3 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!(typeof id === 'string' && id)}
                >
                  Calificar ahora
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </LoginLimiter>
  );
}