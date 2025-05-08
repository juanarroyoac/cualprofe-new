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
      <div className="w-full bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Teacher Header Section */}
          <section className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left Column - Rating and Basic Info */}
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-5xl font-bold text-gray-900">{averageRating}</span>
                    <span className="text-xl text-gray-500">/ 5</span>
                  </div>
                  
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {teacher.name || 'Nombre no disponible'}
                  </h1>
                  
                  <p className="text-gray-600 mb-6">
                    Profesor/a en <span className="font-medium">{teacher.department || teacher.school || 'Departamento/Escuela no especificado'}</span> de la{' '}
                    <span className="font-semibold text-gray-900">
                      {teacher.university || 'Universidad no especificada'}
                      {universityAbbreviation && ` (${universityAbbreviation})`}
                    </span>
                  </p>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Calificaciones</div>
                      <div className="text-xl font-semibold text-gray-900">{ratings.length}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Recomendación</div>
                      <div className="text-xl font-semibold text-gray-900">{wouldTakeAgainPercent}%</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Dificultad</div>
                      <div className="text-xl font-semibold text-gray-900">{averageDifficulty}/5</div>
                    </div>
                  </div>
                  
                  <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm">
                    Guardar profesor
                  </button>
                </div>
                
                {/* Right Column - Rating Distribution */}
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Calificaciones</h2>
                  <div className="space-y-3">
                    {distributionData.map((count, index) => {
                      const percentage = totalRatingsCount > 0 ? (count / totalRatingsCount) * 100 : 0;
                      const rating = 5 - index;
                      return (
                        <div key={rating} className="flex items-center gap-3">
                          <span className="w-8 text-sm font-medium text-gray-600">{rating}</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gray-900 transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-12 text-sm text-gray-500">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tags Section */}
          {topTags.length > 0 && (
            <section className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Etiquetas Principales</h2>
              <TagsList tags={topTags} selectable={false} />
            </section>
          )}

          {/* Ratings Section */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {ratings.length} Calificaciones de Estudiantes
                </h2>
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
                  <option value="newest">Más recientes</option>
                  <option value="highest">Mejor calificadas</option>
                  <option value="lowest">Peor calificadas</option>
                </select>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {ratings.map((rating) => (
                <div key={rating.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-4 h-4 rounded-full ${
                              i < rating.quality ? 'bg-gray-900' : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {rating.createdAt.toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="bg-gray-50 px-3 py-1 rounded-lg text-sm text-gray-600">
                        Dificultad: {rating.difficulty}/5
                      </div>
                      <div className="bg-gray-50 px-3 py-1 rounded-lg text-sm text-gray-600">
                        {rating.wouldTakeAgain ? 'Lo recomendaría' : 'No lo recomendaría'}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{rating.comment}</p>
                  
                  {rating.tags && rating.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {rating.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </LoginLimiter>
  );
}