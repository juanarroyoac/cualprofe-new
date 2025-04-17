'use client';

export default function ProfessorRating({ averageRating, ratingsCount, teacherName, school, university, wouldTakeAgainPercent, averageDifficulty }) {
  return (
    <div className="professor-rating-container">
      {/* Main rating */}
      <div className="mb-1">
        <div className="flex items-baseline">
          <h1 className="text-7xl font-black text-black">{averageRating}</h1>
          <span className="text-xl text-gray-600 ml-2">/ 5</span>
        </div>
      </div>
      
      <p className="text-base text-gray-600 mb-6">
        Calidad General basada en {ratingsCount} calificaciones
      </p>
      
      {/* Professor name */}
      <h2 className="text-5xl font-bold mb-2 flex items-center">
        {teacherName}
        <button className="ml-3 text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
          </svg>
        </button>
      </h2>
      
      {/* Professor details */}
      <p className="text-lg text-gray-700 mb-8">
        Profesor/a en la facultad de {school} de <span className="font-semibold">{university}</span>
      </p>
      
      {/* Stats section */}
      <div className="flex text-center mb-8 border-t border-b border-gray-200 py-5">
        <div className="w-1/2 border-r border-gray-200">
          <div className="text-4xl font-bold">{wouldTakeAgainPercent}%</div>
          <div className="text-gray-500">Lo tomaría otra vez</div>
        </div>
        <div className="w-1/2">
          <div className="text-4xl font-bold">{averageDifficulty}</div>
          <div className="text-gray-500">Nivel de dificultad</div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex gap-4 mb-10">
        <button className="bg-[#00103f] text-white px-8 py-3 rounded-full font-bold hover:bg-blue-800 flex items-center">
          Calificar
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}