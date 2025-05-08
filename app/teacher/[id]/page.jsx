'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
// import TagsList from '../../components/TagsList'; // Using basic spans for tags now
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { useViewTracking } from '../../contexts/ViewTrackingContext';
import LoginLimiter from '../../components/LoginLimiter';
// Removed imports for Button, Card, Badge, Select from @/app/components/ui
import { ThumbsUp, ThumbsDown, Bookmark } from "lucide-react";

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
  const [distributionData, setDistributionData] = useState([
    { label: "Awesome", value: 5, count: 0 },
    { label: "Great", value: 4, count: 0 },
    { label: "Good", value: 3, count: 0 },
    { label: "OK", value: 2, count: 0 },
    { label: "Awful", value: 1, count: 0 },
  ]);
  const [topTags, setTopTags] = useState([]);
  const [universityAbbreviation, setUniversityAbbreviation] = useState('');
  const [filterOption, setFilterOption] = useState('all'); // Default to 'all' as in example
  const [hasUserRated, setHasUserRated] = useState(false);
  const [userInteractions, setUserInteractions] = useState({});

  // Refs
  const headerRef = useRef(null); // This ref might be for a custom sticky header, review if still needed or can be replaced by new layout.

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

  // Data Fetching
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

        const ratingsQuery = query(collection(db, 'ratings'), where('teacherId', '==', professorId), where('status', '==', 'approved'));
        const ratingsSnapshot = await getDocs(ratingsQuery);
        const fetchedRatings = ratingsSnapshot.docs.map(doc => {
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
          if (currentUser && data.userId === currentUser.uid) {
            setHasUserRated(true);
          }
          return {
            id: doc.id,
            ...data,
            // Ensure likes and dislikes are numbers, default to 0 if not present
            likes: typeof data.likes === 'number' ? data.likes : 0,
            dislikes: typeof data.dislikes === 'number' ? data.dislikes : 0,
            createdAt: createdAtDate,
          };
        });

        // Sort by date initially as per example's initial state (though example uses hardcoded, we fetch)
        fetchedRatings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setRatings(fetchedRatings);

        if (fetchedRatings.length > 0) {
          const totalRatingsCount = fetchedRatings.length;
          const avgRating = fetchedRatings.reduce((sum, rating) => sum + (rating.quality || 0), 0) / totalRatingsCount;
          setAverageRating(parseFloat(avgRating.toFixed(1)));

          const avgDifficulty = fetchedRatings.reduce((sum, rating) => sum + (rating.difficulty || 0), 0) / totalRatingsCount;
          setAverageDifficulty(parseFloat(avgDifficulty.toFixed(1)));

          const wouldTakeAgainCount = fetchedRatings.filter(rating => rating.wouldTakeAgain === true).length;
          const wouldTakeAgainPerc = totalRatingsCount > 0 ? (wouldTakeAgainCount / totalRatingsCount) * 100 : 0;
          setWouldTakeAgainPercent(Math.round(wouldTakeAgainPerc));

          const newDistributionData = [
            { label: "Awesome", value: 5, count: 0 },
            { label: "Great", value: 4, count: 0 },
            { label: "Good", value: 3, count: 0 },
            { label: "OK", value: 2, count: 0 },
            { label: "Awful", value: 1, count: 0 },
          ];
          fetchedRatings.forEach(rating => {
            const qualityScore = Math.round(rating.quality || 0);
            const distIndex = newDistributionData.findIndex(d => d.value === qualityScore);
            if (distIndex !== -1) {
              newDistributionData[distIndex].count++;
            }
          });
          setDistributionData(newDistributionData);

          const tagCounts = {};
          fetchedRatings.forEach(rating => {
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
            .slice(0, 5) // Keep top 5 tags as in example
            .map(([tag]) => tag);
          setTopTags(sortedTags);
        } else {
          // Reset if no ratings
          setAverageRating(0);
          setAverageDifficulty(0);
          setWouldTakeAgainPercent(0);
          setDistributionData([
            { label: "Awesome", value: 5, count: 0 },
            { label: "Great", value: 4, count: 0 },
            { label: "Good", value: 3, count: 0 },
            { label: "OK", value: 2, count: 0 },
            { label: "Awful", value: 1, count: 0 },
          ]);
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


  const handleLikeDislike = (ratingId, action) => {
    // This function needs to be adapted to update Firestore for persistence.
    // For now, it will update local state as in the example.
    // Consider moving this logic to a hook or API route for actual DB updates.
    setRatings((prevRatings) =>
      prevRatings.map((rating) => {
        if (rating.id === ratingId) {
          const currentInteraction = userInteractions[ratingId] || { liked: false, disliked: false };
          let newLikes = rating.likes;
          let newDislikes = rating.dislikes;

          if (action === "like") {
            if (currentInteraction.liked) { // Unlike
              newLikes--;
            } else if (currentInteraction.disliked) { // Switch from dislike to like
              newLikes++;
              newDislikes--;
            } else { // New like
              newLikes++;
            }
          } else { // Dislike
            if (currentInteraction.disliked) { // Undislike
              newDislikes--;
            } else if (currentInteraction.liked) { // Switch from like to dislike
              newDislikes++;
              newLikes--;
            } else { // New dislike
              newDislikes++;
            }
          }
          return { ...rating, likes: newLikes, dislikes: newDislikes };
        }
        return rating;
      }),
    );

    setUserInteractions((prev) => {
      const currentInteraction = prev[ratingId] || { liked: false, disliked: false };
      if (action === "like") {
        return {
          ...prev,
          [ratingId]: {
            liked: !currentInteraction.liked,
            disliked: currentInteraction.disliked && !currentInteraction.liked ? false : currentInteraction.disliked,
          },
        };
      } else { // dislike
        return {
          ...prev,
          [ratingId]: {
            liked: currentInteraction.liked && !currentInteraction.disliked ? false : currentInteraction.liked,
            disliked: !currentInteraction.disliked,
          },
        };
      }
    });
    // TODO: Persist like/dislike to Firestore
    // e.g., await updateDoc(doc(db, 'ratings', ratingId), { likes: newLikes, dislikes: newDislikes });
    // TODO: Update userInteractions in Firestore if you track this per user globally
  };


  const handleFilterChange = (value) => {
    setFilterOption(value);
    // Implement filtering logic if courses are available on ratings
    // For now, the example only had a placeholder. If your ratings have a 'course' field:
    // let filteredRatings = [...allFetchedRatings]; // Assuming you have a state for all ratings
    // if (value !== 'all') {
    //   filteredRatings = filteredRatings.filter(r => r.course === value);
    // }
    // setRatings(filteredRatings);
  };

  const handleRateButtonClick = () => {
    if (!currentUser) {
      openAuthModal('login', `/rate/${id}`);
    } else {
      router.push(`/rate/${id}`);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">Profesor no encontrado</h1>
        <p className="text-gray-600">Lo sentimos, no pudimos encontrar datos para el profesor solicitado o ocurrió un error.</p>
        <Link href="/" className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors">
          Volver al inicio
        </Link>
      </div>
    );
  }
  
  const totalRatingsCount = ratings.length;

  // Create a list of unique courses for the filter dropdown from the ratings
  const courseOptions = ratings.reduce((acc, rating) => {
    if (rating.subjectName && !acc.find(item => item.value === rating.subjectName)) {
      acc.push({ value: rating.subjectName, label: rating.subjectName });
    }
    return acc;
  }, [{ value: 'all', label: 'All courses' }]);


  return (
    <LoginLimiter>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="w-full">
          <div className="container mx-auto px-4 py-12 max-w-7xl">
            <div className="flex flex-col md:flex-row items-start justify-between gap-8">
              {/* Left Column - Teacher Info */}
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-[#00248c] rounded-2xl p-4 text-center min-w-[120px]">
                    <div className="text-5xl font-bold text-white">{averageRating.toFixed(1)}</div>
                    <div className="text-sm text-white/80">Calidad General</div>
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2 text-[#00248c]">{teacher.name}</h1>
                    <p className="text-[#00248c]/80">
                      Profesor/a en {teacher.department || 'N/A'} en{" "}
                      <Link href="#" className="text-[#00248c] hover:underline transition-colors">
                        {teacher.university || 'N/A'} {universityAbbreviation && `(${universityAbbreviation})`}
                      </Link>
                    </p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-neutral-light rounded-xl p-4">
                    <div className="text-2xl font-bold text-[#00248c]">{wouldTakeAgainPercent}%</div>
                    <div className="text-sm text-neutral-dark">Lo tomaría otra vez</div>
                  </div>
                  <div className="bg-neutral-light rounded-xl p-4">
                    <div className="text-2xl font-bold text-[#00248c]">{averageDifficulty.toFixed(1)}</div>
                    <div className="text-sm text-neutral-dark">Nivel de Dificultad</div>
                  </div>
                  <div className="bg-neutral-light rounded-xl p-4">
                    <div className="text-2xl font-bold text-[#00248c]">{ratings.length}</div>
                    <div className="text-sm text-neutral-dark">Total Calificaciones</div>
                  </div>
                </div>

                {/* Rate Button */}
                <button
                  onClick={handleRateButtonClick}
                  className="bg-[#00248c] text-white hover:bg-[#00103f] transition-colors px-6 py-3 rounded-xl font-semibold flex items-center gap-2"
                >
                  Calificar Profesor
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Right Column - Rating Distribution */}
              <div className="w-full md:w-[400px] bg-neutral-light rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-6 text-[#00248c]">Distribución de Calificaciones</h2>
                <div className="space-y-4">
                  {distributionData.map((item) => (
                    <div key={item.value} className="flex items-center gap-3">
                      <div className="w-20 text-sm text-[#00248c] font-semibold">
                        {item.label} {item.value}
                      </div>
                      <div className="flex-1 h-2 bg-[#00248c]/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#00248c] transition-all duration-500"
                          style={{
                            width: `${totalRatingsCount > 0 ? (item.count / totalRatingsCount) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <div className="w-8 text-right text-sm text-[#00248c] font-semibold">{item.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          {/* Top Tags Section */}
          {topTags.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-[#00248c]">Etiquetas Principales</h2>
              <div className="flex flex-wrap gap-2">
                {topTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-4 py-2 bg-neutral-light text-[#00248c] rounded-full text-sm font-medium transition-colors border border-[#00248c]/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ratings Section */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-[#00248c]">Calificaciones de Estudiantes</h2>
              <select
                value={filterOption}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="border border-[#00248c] rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00248c] text-[#00248c]"
              >
                {courseOptions.map((option) => (
                  <option key={option.value} value={option.value} className="text-[#00248c]">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-6">
              {ratings.map((rating) => (
                <div
                  key={rating.id}
                  className="bg-neutral-light rounded-xl shadow-sm border border-[#00248c]/10 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-[#00248c] text-white rounded-lg p-3 text-center min-w-[80px]">
                        <div className="text-2xl font-bold">{rating.quality.toFixed(1)}</div>
                        <div className="text-xs">Calidad</div>
                      </div>
                      <div>
                        <div className="font-medium text-[#00248c]">{rating.subjectName}</div>
                        <div className="text-sm text-neutral-dark">
                          {rating.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLikeDislike(rating.id, 'like')}
                        className={`p-2 rounded-lg transition-colors ${
                          userInteractions[rating.id]?.liked
                            ? 'bg-green-600 text-white'
                            : 'hover:bg-[#00248c]/10 text-[#00248c]'
                        }`}
                      >
                        <ThumbsUp size={18} />
                      </button>
                      <span className="text-sm text-[#00248c]">{rating.likes}</span>
                      <button
                        onClick={() => handleLikeDislike(rating.id, 'dislike')}
                        className={`p-2 rounded-lg transition-colors ${
                          userInteractions[rating.id]?.disliked
                            ? 'bg-red-600 text-white'
                            : 'hover:bg-[#00248c]/10 text-[#00248c]'
                        }`}
                      >
                        <ThumbsDown size={18} />
                      </button>
                      <span className="text-sm text-[#00248c]">{rating.dislikes}</span>
                    </div>
                  </div>
                  {rating.comment && (
                    <p className="text-neutral-dark whitespace-pre-wrap">{rating.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </LoginLimiter>
  );
}