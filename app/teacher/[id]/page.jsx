'use client';

 // Keep all existing imports
 import { useParams, useRouter } from 'next/navigation';
 import { useState, useEffect } from 'react';
 import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
 import { db } from '../../../lib/firebase';
 import TagsList from '../../components/TagsList';
 import Link from 'next/link';

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

   const handleRateClick = () => {
     router.push(`/rate/${id}`);
   };

   // --- Data Fetching ---
    useEffect(() => {
         const fetchTeacherAndRatings = async () => {
            setLoading(true);
            try {
                const teacherDoc = await getDoc(doc(db, 'teachers', id));
                if (teacherDoc.exists()) {
                    setTeacher(teacherDoc.data());
                } else {
                    console.error('No se encontró el profesor con ID:', id);
                    setTeacher(null); setLoading(false); return;
                }

                const ratingsQuery = query(collection(db, 'ratings'), where('teacherId', '==', id));
                const ratingsSnapshot = await getDocs(ratingsQuery);
                const ratingsData = ratingsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    // Safer timestamp handling
                    let createdAtDate;
                    if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                        createdAtDate = data.createdAt.toDate();
                    } else if (data.createdAt instanceof Date) {
                        createdAtDate = data.createdAt;
                    } else {
                        createdAtDate = new Date();
                    }
                    
                    return {
                        id: doc.id,
                        ...data,
                        createdAt: createdAtDate
                    };
                });

                ratingsData.sort((a, b) => b.createdAt - a.createdAt);
                setRatings(ratingsData);

                if (ratingsData.length > 0) {
                    const totalRatingsCount = ratingsData.length;
                    const avgRating = ratingsData.reduce((sum, rating) => sum + rating.quality, 0) / totalRatingsCount;
                    setAverageRating(parseFloat(avgRating.toFixed(1)));
                    const avgDifficulty = ratingsData.reduce((sum, rating) => sum + rating.difficulty, 0) / totalRatingsCount;
                    setAverageDifficulty(parseFloat(avgDifficulty.toFixed(1)));
                    const wouldTakeAgainCount = ratingsData.filter(rating => rating.wouldTakeAgain === true).length;
                    const wouldTakeAgainPerc = (wouldTakeAgainCount / totalRatingsCount) * 100;
                    setWouldTakeAgainPercent(Math.round(wouldTakeAgainPerc));

                    const distribution = [0, 0, 0, 0, 0];
                    ratingsData.forEach(rating => {
                        const ratingIndex = Math.max(0, Math.min(4, Math.round(rating.quality) - 1));
                        distribution[ratingIndex]++;
                    });
                    // Create a copy of the array before reversing to avoid mutating the original array
                    setDistributionData([...distribution].reverse());

                    const tagCounts = {};
                    ratingsData.forEach(rating => {
                        if (rating.tags && Array.isArray(rating.tags)) {
                            rating.tags.forEach(tag => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; });
                        }
                    });
                    const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag]) => tag);
                    setTopTags(sortedTags);
                } else {
                     setAverageRating(0); setAverageDifficulty(0); setWouldTakeAgainPercent(0);
                     setDistributionData([0, 0, 0, 0, 0]); setTopTags([]);
                }
            } catch (error) { console.error('Error fetching data:', error);
            } finally { setLoading(false); }
        };
        if (id) { fetchTeacherAndRatings(); } else { setLoading(false); }
    }, [id]);
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
   if (!teacher) {
     return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4">
         <h1 className="text-3xl font-bold font-poppins text-gray-700 mb-3">Profesor no encontrado</h1>
         <p className="text-gray-500">Lo sentimos, no pudimos encontrar datos para el profesor solicitado.</p>
         <Link href="/" className="mt-6 inline-block bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors">
             Volver al inicio
         </Link>
       </div>
     );
   }

   const firstName = teacher.name.split(' ')[0];
   const ratingLabels = ["5", "4", "3", "2", "1"];
   const totalRatingsCount = ratings.length;

   // --- Page Render ---
   return (
     <div className="container mx-auto px-4 py-10 md:py-16 max-w-5xl">

       {/* Teacher Header Section */}
       <section className="mb-10 md:mb-12">
         <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex-grow">
                 <h1 className="text-4xl sm:text-5xl font-bold font-poppins text-[#00103f] mb-1">
                   {teacher.name}
                 </h1>
                 <p className="text-base text-gray-600">
                   Profesor/a en {teacher.department || teacher.school} de la <span className="font-semibold text-indigo-700">{teacher.university}</span>
                 </p>
            </div>
             <div className="flex-shrink-0 mt-3 sm:mt-0">
                 <button
                     onClick={handleRateClick}
                     className="bg-[#00103f] hover:bg-[#00248c] text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors shadow hover:shadow-md"
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
             <div className="text-center md:text-left">
                 <div className="mb-3">
                      <span className="text-6xl lg:text-7xl font-bold font-poppins text-[#00103f]">{averageRating.toFixed(1)}</span>
                      <span className="text-2xl lg:text-3xl font-poppins text-gray-500">/5</span>
                 </div>
                  <p className="text-sm text-gray-600 mb-6">
                      Calidad General basada en {totalRatingsCount} {totalRatingsCount === 1 ? 'calificación' : 'calificaciones'}
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4 sm:gap-6">
                      <div className="bg-white p-3 rounded-lg text-center shadow-sm min-w-[140px]">
                          <div className="text-2xl font-bold font-poppins text-[#00103f]">{wouldTakeAgainPercent}%</div>
                          <div className="text-xs text-gray-600 mt-1">Lo escogería otra vez</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg text-center shadow-sm min-w-[140px]">
                          <div className="text-2xl font-bold font-poppins text-[#00103f]">{averageDifficulty.toFixed(1)}<span className="text-base text-gray-500">/5</span></div>
                          <div className="text-xs text-gray-600 mt-1">Nivel de Dificultad</div>
                      </div>
                  </div>
             </div>
              <div className="w-full">
                  <h3 className="text-lg font-semibold font-poppins text-[#00103f] mb-4 text-center md:text-left">Distribución de Calificaciones</h3>
                  {totalRatingsCount > 0 ? (
                      <div className="space-y-2.5">
                          {ratingLabels.map((label, index) => {
                              const count = distributionData[index] || 0;
                              const percentage = totalRatingsCount > 0 ? (count / totalRatingsCount) * 100 : 0;
                              return (
                              <div key={label} className="flex items-center text-sm">
                                  <div className="w-4 font-medium text-gray-700">{label}</div>
                                  <div className="flex-1 mx-3 bg-gray-200 h-4 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-600" style={{ width: `${percentage}%` }} title={`${percentage.toFixed(0)}%`}></div>
                                  </div>
                                  <div className="w-8 text-right font-medium text-gray-700">{count}</div>
                              </div>
                              );
                          })}
                      </div>
                  ) : ( <p className="text-sm text-gray-500 italic text-center md:text-left">Aún no hay calificaciones para mostrar la distribución.</p> )}
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
               <div key={rating.id} className="border border-gray-200 bg-white rounded-lg p-5 shadow-sm">

                 {/* Redesigned layout with course info without divider and scores in top right */}
                 <div className="flex flex-col md:flex-row">
                   {/* Left side: Course info and comment */}
                   <div className="flex-grow pr-0 md:pr-6">
                     <div className="mb-4">
                       {rating.subjectName && (
                         <h5 className="text-xl font-semibold font-poppins text-gray-800 uppercase mb-1">
                           {rating.subjectName}
                         </h5>
                       )}
                       {rating.course && (<h4 className="font-semibold font-poppins text-gray-700 text-sm">{rating.course}</h4>)}
                       <p className="text-xs text-gray-500 mt-1">
                         {rating.createdAt.toLocaleDateString('es-VE', { 
                           year: 'numeric', 
                           month: 'long', 
                           day: 'numeric' 
                         })}
                       </p>
                     </div>
                     
                     {/* Comment */}
                     {rating.comment && (
                       <p className="text-gray-700 leading-relaxed mb-4">{rating.comment}</p>
                     )}
                     
                     {/* Tags */}
                     {rating.tags && Array.isArray(rating.tags) && rating.tags.length > 0 && (
                       <div className="mb-4">
                         <TagsList tags={rating.tags} selectable={false} small={true} uppercase={true} />
                       </div>
                     )}
                   </div>

                   {/* Right Column: Rating Scores in top right */}
                   <div className="flex-shrink-0 flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-y-2 mt-0 md:mt-0">
                     {/* Quality Score */}
                     <div className="text-center">
                       <p className="text-xs font-poppins text-gray-500 uppercase tracking-wide mb-1">Calidad</p>
                       <div className="bg-indigo-100 text-indigo-800 inline-block px-4 py-1 rounded-lg text-center min-w-[70px]">
                         <span className="text-3xl font-bold font-poppins">{rating.quality.toFixed(1)}</span>
                       </div>
                     </div>
                     {/* Difficulty Score */}
                     <div className="text-center">
                       <p className="text-xs font-poppins text-gray-500 uppercase tracking-wide mb-1">Dificultad</p>
                       <div className="bg-gray-100 text-gray-800 inline-block px-4 py-1 rounded-lg text-center min-w-[70px]">
                         <span className="text-3xl font-bold font-poppins">{rating.difficulty.toFixed(1)}</span>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Rating Details Grid */}
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm border-t border-gray-100 pt-4">
                    <div><span className="text-gray-500 mr-1">Lo escogería otra vez:</span><span className="font-medium">{rating.wouldTakeAgain ? 'Sí' : 'No'}</span></div>
                    <div><span className="text-gray-500 mr-1">Modalidad:</span><span className="font-medium">{rating.modalidad || 'N/A'}</span></div>
                    {rating.nrc && <div><span className="text-gray-500 mr-1">NRC:</span><span className="font-medium">{rating.nrc}</span></div>}
                    {rating.grade && <div><span className="text-gray-500 mr-1">Nota:</span><span className="font-medium">{rating.grade}</span></div>}
                  </div>

               </div> // End Individual Rating Card
             ))}
           </div>
         ) : (
            // Empty state
             <div className="text-center py-10 px-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                 <h3 className="text-lg font-semibold font-poppins text-gray-700 mb-2">Aún no hay calificaciones</h3>
                 <p className="text-sm text-gray-500 mb-4">Sé el primero en calificar a {firstName} y ayuda a otros estudiantes.</p>
                 <button
                     onClick={handleRateClick}
                     className="bg-[#00103f] hover:bg-[#00248c] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow hover:shadow-md"
                  >
                     Calificar ahora
                 </button>
             </div>
         )}
       </section>
     </div>
   );
 }