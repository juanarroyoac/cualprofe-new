'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import TagsList from '../../../components/TagsList';

// NO SEPARATE COMPONENTS - COMPLETELY INLINE IMPLEMENTATION
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

  // DATA FETCHING CODE
  useEffect(() => {
    console.log('NEW VERSION LOADED:', new Date().toISOString());
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
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#00103f]"></div>
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

  // Rating label constants for distribution
  const ratingLabels = ["Excelente", "Muy Bueno", "Bueno", "Regular", "Terrible"];
  const ratingValues = [5, 4, 3, 2, 1];
  const totalRatings = distributionData.reduce((sum, count) => sum + count, 0);

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* VERIFICATION BANNER - DELETE AFTER CONFIRMING */}
      <div className="bg-red-500 text-white p-4 mb-6 text-center rounded-md">
        NEW VERSION LOADED: {new Date().toISOString()}
      </div>

      {/* TOP SECTION with TWO COLUMNS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: '2rem' }}>
        {/* LEFT COLUMN - Rating info OUTSIDE any gray box */}
        <div style={{ gridColumn: '1', padding: '1rem', border: '2px solid transparent' }}>
          {/* HUGE Rating */}
          <div style={{ marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '5rem', fontWeight: 900, color: 'black', lineHeight: 1 }}>
              {averageRating}
            </span>
            <span style={{ fontSize: '1.25rem', color: '#666', marginLeft: '0.5rem' }}>
              / 5
            </span>
          </div>
          
          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1.5rem' }}>
            Calidad General basada en {ratings.length} calificaciones
          </p>
          
          {/* Professor name */}
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {teacher.name}
            {/* Bookmark icon */}
            <button style={{ marginLeft: '0.75rem', color: '#aaa' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
            </button>
          </h2>
          
          {/* Professor details */}
          <p style={{ fontSize: '1.125rem', color: '#444', marginBottom: '2rem' }}>
            Profesor/a en {teacher.school} de <span style={{ fontWeight: 600 }}>{teacher.university}</span>
          </p>
          
          {/* Stats section */}
          <div style={{ 
            display: 'flex', 
            textAlign: 'center', 
            marginBottom: '2rem',
            borderTop: '1px solid #e5e7eb',
            borderBottom: '1px solid #e5e7eb',
            padding: '1.25rem 0'
          }}>
            <div style={{ 
              width: '50%', 
              borderRight: '1px solid #e5e7eb',
              paddingRight: '1rem'
            }}>
              <div style={{ fontSize: '2.25rem', fontWeight: 700 }}>{wouldTakeAgainPercent}%</div>
              <div style={{ color: '#666' }}>Lo tomaría otra vez</div>
            </div>
            <div style={{ width: '50%', paddingLeft: '1rem' }}>
              <div style={{ fontSize: '2.25rem', fontWeight: 700 }}>{averageDifficulty}</div>
              <div style={{ color: '#666' }}>Nivel de dificultad</div>
            </div>
          </div>
          
          {/* Rate button */}
          <div style={{ marginBottom: '2rem' }}>
            <button style={{ 
              backgroundColor: '#00103f', 
              color: 'white', 
              padding: '0.75rem 2rem',
              borderRadius: '9999px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center'
            }}>
              Calificar
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style={{ marginLeft: '0.5rem' }}>
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* RIGHT COLUMN - ONLY Distribution in gray box */}
        <div style={{ gridColumn: '2' }}>
          {/* Gray box ONLY contains distribution */}
          <div style={{ 
            backgroundColor: '#f3f4f6', 
            padding: '1.5rem', 
            borderRadius: '0.375rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              Distribución de Calificaciones
            </h3>
            
            {/* Rating bars */}
            {ratingLabels.map((label, index) => {
              const count = distributionData[4 - index]; // Reversed to show 5 to 1
              const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
              
              return (
                <div key={label} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '1rem',
                  fontSize: '0.875rem'
                }}>
                  <div style={{ width: '7rem', display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, marginRight: '0.5rem' }}>{label}</span>
                    <span style={{ color: '#666' }}>{ratingValues[index]}</span>
                  </div>
                  <div style={{ 
                    flex: 1, 
                    backgroundColor: '#e5e7eb',
                    height: '1.75rem', 
                    marginLeft: '1rem',
                    marginRight: '1rem',
                    overflow: 'hidden',
                    borderRadius: '0.125rem'
                  }}>
                    <div style={{ 
                      backgroundColor: '#2563eb', 
                      height: '100%',
                      width: `${percentage}%`
                    }}></div>
                  </div>
                  <div style={{ width: '2rem', textAlign: 'right', fontWeight: 700 }}>{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Rest of your content below - Tags and Ratings */}
      {topTags.length > 0 && (
        <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
            Etiquetas Principales del Profesor {teacher.name.split(' ')[0]}
          </h2>
          <TagsList tags={topTags} selectable={false} />
        </div>
      )}
      
      {/* Ratings section */}
      <h2 style={{ 
        fontSize: '1.5rem', 
        fontWeight: 700, 
        marginBottom: '1rem',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '0.5rem'
      }}>
        {ratings.length} Calificaciones de Estudiantes
      </h2>
      
      {/* Filter dropdown */}
      <div style={{ marginBottom: '1.5rem' }}>
        <select style={{ 
          border: '1px solid #d1d5db', 
          borderRadius: '0.25rem', 
          padding: '0.5rem',
          fontSize: '0.875rem'
        }}>
          <option value="all">Todas las clases</option>
        </select>
      </div>
      
      {/* Individual ratings */}
      {ratings.map(rating => (
        <div key={rating.id} style={{ 
          borderTop: '1px solid #e5e7eb', 
          paddingTop: '1.5rem',
          paddingBottom: '1.5rem' 
        }}>
          <div style={{ 
            backgroundColor: '#dcfce7', 
            display: 'inline-block', 
            padding: '0.75rem',
            borderRadius: '0.375rem',
            marginBottom: '1rem'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' }}>
              {rating.quality.toFixed(1)}
            </div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#374151' }}>
              CALIDAD
            </div>
          </div>
          
          {/* Course info if available */}
          {rating.course && (
            <div style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
              <strong>{rating.course}</strong>
              <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>
                Fecha: {new Date(rating.createdAt.toDate()).toLocaleDateString()}
              </div>
            </div>
          )}
          
          {/* Rating details */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Para crédito:</div>
              <div>{rating.forCredit ? 'Sí' : 'No'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Asistencia:</div>
              <div>{rating.attendanceMandatory ? 'Obligatoria' : 'Opcional'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Lo tomaría otra vez:</div>
              <div>{rating.wouldTakeAgain ? 'Sí' : 'No'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Nota:</div>
              <div>{rating.grade || 'N/A'}</div>
            </div>
          </div>
          
          {/* Tags */}
          {rating.tags && rating.tags.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <TagsList tags={rating.tags} selectable={false} small={true} />
            </div>
          )}
          
          {/* Comment */}
          {rating.comment && (
            <div style={{ color: '#374151' }}>
              {rating.comment}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}