'use client';

import { useParams } from 'next/navigation';
import TagsList from '../../../components/TagsList';
import { db } from '../../../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const { id } = useParams();
  const router = useRouter();
  const [teacher, setTeacher] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [averageDifficulty, setAverageDifficulty] = useState(0);
  const [wouldTakeAgainPercent, setWouldTakeAgainPercent] = useState(0);
  const [distributionData, setDistributionData] = useState([0, 0, 0, 0, 0]);
  const [topTags, setTopTags] = useState([]);

  // Function to split name into first and last name
  const formatTeacherName = (fullName) => {
    if (!fullName) return '';
    const nameParts = fullName.split(' ');
    // If there's only one word, return it as is
    if (nameParts.length <= 1) return fullName;
    
    // Otherwise, find a good split point
    if (nameParts.length === 2) {
      // Simple first and last name
      return (
        <>
          {nameParts[0]}<br />{nameParts[1]}
        </>
      );
    } else {
      // For names with more than 2 parts, try to divide intelligently
      const midpoint = Math.floor(nameParts.length / 2);
      const firstName = nameParts.slice(0, midpoint).join(' ');
      const lastName = nameParts.slice(midpoint).join(' ');
      
      return (
        <>
          {firstName}<br />{lastName}
        </>
      );
    }
  };

  // Handle rating button click
  const handleRateClick = () => {
    router.push(`/rate/${id}`);
  };

  useEffect(() => {
    const fetchTeacherAndRatings = async () => {
      try {
        // Fetch teacher data
        const teacherDoc = await getDoc(doc(db, 'teachers', id));
        if (teacherDoc.exists()) {
          setTeacher(teacherDoc.data());
        } else {
          console.error('No se encontró el profesor');
          return;
        }

        // Fetch ratings
        const ratingsQuery = query(
          collection(db, 'ratings'),
          where('teacherId', '==', id)
        );
        const ratingsSnapshot = await getDocs(ratingsQuery);
        const ratingsData = ratingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRatings(ratingsData);
        
        // Calculate statistics if there are ratings
        if (ratingsData.length > 0) {
          // Average quality rating
          const avgRating = ratingsData.reduce((sum, rating) => sum + rating.quality, 0) / ratingsData.length;
          setAverageRating(parseFloat(avgRating.toFixed(1)));
          
          // Average difficulty
          const avgDifficulty = ratingsData.reduce((sum, rating) => sum + rating.difficulty, 0) / ratingsData.length;
          setAverageDifficulty(parseFloat(avgDifficulty.toFixed(1)));
          
          // Would take again percentage
          const wouldTakeAgainCount = ratingsData.filter(rating => rating.wouldTakeAgain === true).length;
          const wouldTakeAgainPerc = (wouldTakeAgainCount / ratingsData.length) * 100;
          setWouldTakeAgainPercent(Math.round(wouldTakeAgainPerc));
          
          // Rating distribution
          const distribution = [0, 0, 0, 0, 0]; // For ratings 1-5
          ratingsData.forEach(rating => {
            const ratingIndex = Math.floor(rating.quality) - 1;
            if (ratingIndex >= 0 && ratingIndex < 5) {
              distribution[ratingIndex]++;
            }
          });
          setDistributionData(distribution);
          
          // Count tag occurrences and get top tags
          const tagCounts = {};
          ratingsData.forEach(rating => {
            if (rating.tags && Array.isArray(rating.tags)) {
              rating.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
              });
            }
          });
          
          const sortedTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tag]) => tag);
            
          setTopTags(sortedTags);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTeacherAndRatings();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#00248c]"></div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Profesor no encontrado</h1>
        <p>Lo sentimos, no pudimos encontrar el profesor que estás buscando.</p>
      </div>
    );
  }

  // Get first name for tags section
  const firstName = teacher.name.split(' ')[0];

  // Rating label constants for custom distribution
  const ratingLabels = ["Excelente", "Muy Bueno", "Bueno", "Regular", "Terrible"];
  const ratingValues = [5, 4, 3, 2, 1];
  const totalRatings = distributionData.reduce((sum, count) => sum + count, 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Top section - SPLIT INTO TWO SEPARATE ELEMENTS */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-8">
        {/* Left side - Rating OUTSIDE gray box with professor info BELOW it */}
        <div className="md:w-1/2">
          {/* Rating section - With Nunito Sans Black font */}
          <div className="mb-6">
            <div className="flex items-baseline">
              <h1 className="text-7xl font-black text-black mr-2 font-nunito-sans">{averageRating}</h1>
              <p className="text-2xl text-black font-bold font-nunito-sans">/5</p>
            </div>
            <p className="text-sm text-black mt-1 font-medium font-roboto">
              Calidad General basada en {ratings.length} calificaciones
            </p>
          </div>
          
          {/* Professor name with Nunito Sans Black font - Removed favorite button */}
          <div className="mb-4">
            <h2 className="text-5xl font-bold text-black font-nunito-sans">
              {formatTeacherName(teacher.name)}
            </h2>
            <p className="text-gray-600 mt-1">
              Profesor/a de la facultad de {teacher.school}
              {teacher.university && (
                <>
                  {' '}
                  de la{' '}
                  <span className="text-[#00248c]">
                    {teacher.university}
                  </span>
                </>
              )}
            </p>
          </div>
          
          {/* Stats MOVED HERE - Full black text */}
          <div className="flex mb-6 border-t border-b border-gray-200 py-4">
            <div className="w-1/2 border-r border-gray-200 px-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-black font-nunito-sans">{wouldTakeAgainPercent}%</div>
                <div className="text-sm text-black">Lo tomaría otra vez</div>
              </div>
            </div>
            <div className="w-1/2 px-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-black font-nunito-sans">{averageDifficulty}</div>
                <div className="text-sm text-black">Nivel de dificultad</div>
              </div>
            </div>
          </div>
          
          {/* Rate button - Using updated #00248c blue color */}
          <div className="mb-8">
            <button
              onClick={handleRateClick}
              className="bg-[#00248c] hover:bg-[#001e7a] text-white rounded-full px-8 py-3 text-lg font-medium"
            >
              Calificar
            </button>
          </div>
        </div>
        
        {/* Right side - ONLY distribution in gray box - 10% smaller height */}
        <div className="md:w-1/2">
          <div className="bg-gray-100 p-6 rounded-md" style={{ minHeight: '360px' }}>
            <h3 className="text-xl font-bold mb-5 font-roboto">Calificaciones de Alumnos</h3>
            
            {/* Custom Rating Distribution with Roboto bold font */}
            <div className="w-full">
              {ratingLabels.map((label, index) => {
                const count = distributionData[4 - index]; // Reversed to show 5 to 1
                const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                
                return (
                  <div key={label} className="flex items-center mb-5">
                    <div className="w-28 flex items-center">
                      <span className="font-bold mr-2 text-base font-roboto">{label}</span>
                      <span className="text-gray-500 text-base font-bold font-roboto">{ratingValues[index]}</span>
                    </div>
                    <div className="flex-1 bg-gray-200 h-8 mr-2 rounded-sm overflow-hidden">
                      <div
                        className="h-full"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: '#00248c' // Updated blue color
                        }}
                      ></div>
                    </div>
                    <div className="w-6 text-right font-bold text-base font-roboto">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Top tags - Updated title to avoid gendered language */}
      {topTags.length > 0 && (
        <div className="mb-8 mt-8">
          <h2 className="text-lg font-bold mb-4 font-poppins">
            Etiquetas usadas para describir a {firstName}
          </h2>
          <TagsList tags={topTags} selectable={false} />
        </div>
      )}

      {/* Ratings list */}
      <div>
        <h2 className="text-lg font-bold mb-4 font-poppins">{ratings.length} Calificaciones de Estudiantes</h2>
        
        {/* Filter dropdown could go here */}
        <div className="mb-4">
          <select className="border border-gray-300 rounded p-2 text-sm">
            <option value="all">Todas las clases</option>
          </select>
        </div>
        
        {/* List of ratings */}
        {ratings.map(rating => (
          <div key={rating.id} className="border-t border-gray-200 py-6">
            {/* Quality score */}
            <div className="bg-green-100 inline-block p-3 rounded-md mb-4">
              <div className="text-2xl font-bold text-center">{rating.quality.toFixed(1)}</div>
              <div className="text-xs uppercase text-gray-600">CALIDAD</div>
            </div>
            
            {/* Course info if available */}
            {rating.course && (
              <div className="mb-4 text-sm">
                <strong>{rating.course}</strong>
                <div className="text-gray-500 mt-1">
                  Fecha: {new Date(rating.createdAt.toDate()).toLocaleDateString()}
                </div>
              </div>
            )}
            
            {/* Rating details */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div>
                <div className="text-sm text-gray-500">Para crédito:</div>
                <div>{rating.forCredit ? 'Sí' : 'No'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Asistencia:</div>
                <div>{rating.attendanceMandatory ? 'Obligatoria' : 'Opcional'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Lo tomaría otra vez:</div>
                <div>{rating.wouldTakeAgain ? 'Sí' : 'No'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Nota:</div>
                <div>{rating.grade || 'N/A'}</div>
              </div>
            </div>
            
            {/* Tags */}
            {rating.tags && rating.tags.length > 0 && (
              <div className="mb-4">
                <TagsList tags={rating.tags} selectable={false} small={true} />
              </div>
            )}
            
            {/* Comment */}
            {rating.comment && (
              <div className="text-gray-700">
                {rating.comment}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}