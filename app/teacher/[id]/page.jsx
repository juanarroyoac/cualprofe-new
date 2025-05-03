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
  const [universityAbbreviation, setUniversityAbbreviation] = useState('');
  const [filterOption, setFilterOption] = useState('newest');
  const [hasUserRated, setHasUserRated] = useState(false);
  const [animateDistribution, setAnimateDistribution] = useState(false);
  
  // Refs
  const headerRef = useRef(null);
  const stickyHeaderRef = useRef(null);

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

  // Create sticky header element if it doesn't exist
  useEffect(() => {
    // Create the sticky header element during component mount
    const stickyHeader = document.createElement('div');
    stickyHeader.id = 'sticky-header';
    stickyHeader.className = 'fixed top-0 left-0 right-0 z-50 bg-white shadow-md py-3 px-4 transform -translate-y-full transition-transform duration-300 ease-in-out';
    
    document.body.appendChild(stickyHeader);
    stickyHeaderRef.current = stickyHeader;

    // Clean up on unmount
    return () => {
      if (document.getElementById('sticky-header')) {
        document.body.removeChild(document.getElementById('sticky-header'));
      }
    };
  }, []);

  // Update sticky header content when teacher data is available
  useEffect(() => {
    if (!stickyHeaderRef.current || !teacher) return;
    
    stickyHeaderRef.current.innerHTML = `
      <div class="container mx-auto px-4 flex justify-between items-center">
        <div class="flex items-center">
          <h2 class="text-xl font-bold text-[#00103f] mr-3 font-poppins">${teacher.name}</h2>
          <span class="bg-[#00103f] text-white rounded-full h-7 w-7 flex items-center justify-center text-base font-bold">
            ${averageRating.toFixed(1)}
          </span>
        </div>
        <button
          id="sticky-rate-button"
          class="bg-[#00103f] hover:bg-[#00248c] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow hover:shadow-md"
        >
          Calificar
        </button>
      </div>
    `;

    // Add event listener to the rate button
    const rateButton = document.getElementById('sticky-rate-button');
    if (rateButton) {
      rateButton.addEventListener('click', handleRateClick);
    }
  }, [teacher, averageRating]);

  // Setup intersection observer for sticky header
  useEffect(() => {
    if (!headerRef.current || !stickyHeaderRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (stickyHeaderRef.current) {
          if (!entry.isIntersecting) {
            stickyHeaderRef.current.style.transform = 'translateY(0)';
          } else {
            stickyHeaderRef.current.style.transform = 'translateY(-100%)';
          }
        }
      },
      { threshold: 0, rootMargin: "-100px 0px 0px 0px" }
    );
    
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, [headerRef, stickyHeaderRef]);

  // Animation trigger
  useEffect(() => {
    if (!loading && teacher) {
      setTimeout(() => setAnimateDistribution(true), 300);
    }
  }, [loading, teacher]);

  const handleRateClick = () => {
    const professorId = typeof id === 'string' ? id : undefined;
    if (!professorId) return;

    if (currentUser) {
      router.push(`/rate/${professorId}`);
    } else {
      openAuthModal('login', `/rate/${professorId}`);
    }
  };

  const handleFilterChange = (e) => {
    setFilterOption(e.target.value);
    
    // Sort the ratings based on the selected filter
    let sortedRatings = [...ratings];
    
    switch (e.target.value) {
      case 'newest':
        sortedRatings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'highest':
        sortedRatings.sort((a, b) => b.quality - a.quality);
        break;
      case 'lowest':
        sortedRatings.sort((a, b) => a.quality - b.quality);
        break;
      default:
        break;
    }
    
    setRatings(sortedRatings);
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
          const teacherData = teacherDoc.data();
          setTeacher(teacherData);
          
          // Fetch university abbreviation if available
          if (teacherData.university) {
            try {
              const uniSettingsDoc = await getDoc(doc(db, 'universitySettings', teacherData.university));
              if (uniSettingsDoc.exists()) {
                const uniData = uniSettingsDoc.data();
                if (uniData.abbreviation) {
                  setUniversityAbbreviation(uniData.abbreviation);
                }
              }
            } catch (error) {
              console.error('Error fetching university settings:', error);
            }
          }
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

          // Check if the current user has rated this professor
          if (currentUser && data.userId === currentUser.uid) {
            setHasUserRated(true);
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

  }, [id, currentUser]);

  // Rating color function - red to green transition
  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'bg-green-500';
    if (rating >= 3.5) return 'bg-green-400';
    if (rating >= 2.5) return 'bg-yellow-500';
    if (rating >= 1.5) return 'bg-orange-500';
    return 'bg-red-500';
  };

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
      <div className="w-full bg-[#f1f5f9]">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          {/* Teacher Header Section */}
          <section ref={headerRef} className="mb-8 bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex-grow">
                  <h1 className="text-4xl sm:text-5xl font-poppins font-bold text-[#00103f] mb-2">
                    {teacher.name || 'Nombre no disponible'}
                  </h1>
                  <p className="text-base text-gray-600 font-roboto">
                    Profesor/a en <span className="font-medium">{teacher.department || teacher.school || 'Departamento/Escuela no especificado'}</span> de la{' '}
                    <span className="font-semibold text-[#00248c]">
                      {teacher.university || 'Universidad no especificada'}
                      {universityAbbreviation && ` (${universityAbbreviation})`}
                    </span>
                  </p>
                </div>
                <div className="flex-shrink-0 mt-3 sm:mt-0">
                  <button
                    onClick={handleRateClick}
                    className={`${hasUserRated ? 'bg-[#00248c]' : 'bg-[#00103f]'} hover:bg-[#001c6f] text-white rounded-lg px-5 py-3 text-sm font-medium transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto flex items-center justify-center gap-2`}
                    disabled={!(typeof id === 'string' && id)}
                    aria-label={`Calificar a ${firstName}`}
                  >
                    {hasUserRated && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
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
          <section className="mb-8">
            <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Side: Overall Score & Key Stats */}
              <div className="bg-white rounded-xl shadow-md p-6 flex flex-col justify-center items-center md:items-start">
                <div className="mb-6 text-center md:text-left">
                  {/* Rating score */}
                  <div className="flex items-center justify-center md:justify-start mb-2">
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
                  <div className="bg-white p-4 rounded-xl text-center shadow-sm flex-1 border border-gray-100">
                    <div className="text-3xl font-poppins font-bold text-[#00103f]">
                      {totalRatingsCount > 0 ? `${wouldTakeAgainPercent}%` : 'N/A'}
                    </div>
                    <div className="text-xs uppercase tracking-wide text-gray-600 mt-1 font-poppins">Lo escogería otra vez</div>
                  </div>
                  {/* Difficulty Stat */}
                  <div className="bg-white p-4 rounded-xl text-center shadow-sm flex-1 border border-gray-100">
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
              <div className="bg-white rounded-xl p-6 shadow-md overflow-hidden">
                <h3 className="text-lg font-semibold font-poppins text-[#00103f] mb-4 text-center md:text-left">
                  Distribución de Calificaciones
                </h3>
                {totalRatingsCount > 0 ? (
                  <div className="space-y-4">
                    {ratingLabels.map((label, index) => {
                      const count = distributionData[index] || 0;
                      const percentage = totalRatingsCount > 0 ? (count / totalRatingsCount) * 100 : 0;
                      
                      return (
                        <div key={label} className="flex items-center text-sm">
                          <div className="w-6 font-roboto font-medium text-gray-700 text-center">{label}</div>
                          <div className="flex-1 mx-3 bg-gray-200 h-6 rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-[#00103f] rating-bar ${animateDistribution ? 'animate-bar' : ''}`} 
                              style={{ '--rating-percentage': `${percentage}%` }} 
                              title={`${count} calificación${count !== 1 ? 'es' : ''} (${percentage.toFixed(0)}%)`}
                              role="progressbar"
                              aria-valuenow={percentage}
                              aria-valuemin="0"
                              aria-valuemax="100"
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
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-2xl md:text-3xl font-poppins font-bold text-[#00103f]">
                    {totalRatingsCount} {totalRatingsCount === 1 ? 'Calificación' : 'Calificaciones'} de Estudiantes
                  </h2>
                  
                  {/* Filter Options */}
                  {ratings.length > 1 && (
                    <div className="flex items-center">
                      <label htmlFor="rating-filter" className="mr-2 text-sm font-medium text-gray-700">Ordenar por:</label>
                      <select 
                        id="rating-filter"
                        value={filterOption}
                        onChange={handleFilterChange}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#00103f] focus:border-[#00103f] p-2"
                        aria-label="Filtrar calificaciones"
                      >
                        <option value="newest">Más recientes</option>
                        <option value="highest">Mayor calificación</option>
                        <option value="lowest">Menor calificación</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {ratings.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {ratings.map(rating => (
                    <div key={rating.id} className="p-6 hover:bg-gray-50 transition-colors rating-card">
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
                          
                          {/* Rating Details Grid (Optional fields) */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm border-t border-gray-100 pt-4 mt-4 font-roboto">
                            <div className="flex items-center">
                              <span className="text-gray-500 mr-1">Lo tomaría otra vez:</span>
                              <span className="font-medium text-gray-800">
                                {typeof rating.wouldTakeAgain === 'boolean' 
                                  ? (rating.wouldTakeAgain ? 'Sí' : 'No')
                                  : 'N/A'}
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

                        {/* Right Column: Rating Scores */}
                        <div className="flex-shrink-0 flex flex-row md:flex-col items-center justify-center md:justify-end gap-4 mt-2 md:mt-0">
                          {/* Quality Score */}
                          <div className="text-center">
                            <p className="text-xs font-poppins text-gray-500 uppercase tracking-wide mb-1">Calidad</p>
                            <div className={`${getRatingColor(rating.quality)} text-white inline-block px-4 py-2 rounded-lg text-center min-w-[70px] shadow-sm`}>
                              <span className="text-2xl font-poppins font-bold">{(rating.quality ?? 0).toFixed(1)}</span>
                            </div>
                          </div>
                          {/* Difficulty Score */}
                          <div className="text-center">
                            <p className="text-xs font-poppins text-gray-500 uppercase tracking-wide mb-1">Dificultad</p>
                            <div className="bg-gray-700 text-white inline-block px-4 py-2 rounded-lg text-center min-w-[70px] shadow-sm">
                              <span className="text-2xl font-poppins font-bold">{(rating.difficulty ?? 0).toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Empty state when no ratings exist
                <div className="text-center py-12 px-6 border-t border-gray-100">
                  <div className="inline-block p-4 bg-[#f1f5f9] rounded-full mb-4">
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
                    className="bg-[#00103f] hover:bg-[#00248c] text-white rounded-lg px-6 py-3 text-sm font-medium transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!(typeof id === 'string' && id)}
                    aria-label={`Calificar a ${firstName}`}
                  >
                    Calificar ahora
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        .rating-bar {
          transition: width 1.5s cubic-bezier(0.19, 1, 0.22, 1);
          width: 0;
        }
        
        .animate-bar {
          width: var(--rating-percentage);
        }
      `}</style>
    </LoginLimiter>
  );
}