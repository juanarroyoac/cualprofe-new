'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import RatingDistribution from '../../../components/RatingDistribution';
import TagsList from '../../../components/TagsList';
import RateButton from '../../../components/RateButton';
import Header from '../../../components/header'; // Import your header component

export default function TeacherProfile() {
  const { id } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [averageDifficulty, setAverageDifficulty] = useState(0);
  const [wouldTakeAgainPercent, setWouldTakeAgainPercent] = useState(0);
  const [distributionData, setDistributionData] = useState([0, 0, 0, 0, 0]);
  const [topTags, setTopTags] = useState([]);

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
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#0F17FF]"></div>
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

  return (
    <>
      <Header /> {/* Include your header component */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Top rating section */}
        <div className="bg-gray-100 p-6 rounded-md mb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
            <div className="mb-6 md:mb-0">
              <div className="flex items-baseline">
                <h1 className="text-7xl font-bold mr-2 text-black">{averageRating}</h1>
                <p className="text-sm text-gray-500">/5</p>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Calidad General basada en {ratings.length} calificaciones
              </p>
            </div>
            <div className="w-full md:w-auto">
              <RatingDistribution distribution={distributionData} />
            </div>
          </div>
        </div>

        {/* Professor info */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center">
            {teacher.name}
            <button className="ml-2 text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
            </button>
          </h1>
          <p className="text-gray-600 mt-1">
            Profesor/a de la facultad de {teacher.school} de <span className="font-bold">{teacher.university}</span>
          </p>

          {/* Stats */}
          <div className="flex mt-6 border-t border-b border-gray-200 py-4">
            <div className="w-1/2 border-r border-gray-200 px-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{wouldTakeAgainPercent}%</div>
                <div className="text-sm text-gray-500">Lo tomaría otra vez</div>
              </div>
            </div>
            <div className="w-1/2 px-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{averageDifficulty}</div>
                <div className="text-sm text-gray-500">Nivel de dificultad</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mb-8">
          <RateButton teacherId={id} teacherName={teacher.name} />
        </div>

        {/* Top tags */}
        {topTags.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">Etiquetas Principales del Profesor {teacher.name.split(' ')[0]}</h2>
            <TagsList tags={topTags} selectable={false} />
          </div>
        )}

        {/* Ratings list */}
        <div>
          <h2 className="text-lg font-bold mb-4">{ratings.length} Calificaciones de Estudiantes</h2>
          
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
    </>
  );
}