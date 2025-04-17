'use client';

export default function RatingDistribution({ distribution }) {
  const totalRatings = distribution.reduce((sum, count) => sum + count, 0);
  const ratingLabels = ["Excelente", "Muy Bueno", "Bueno", "Regular", "Terrible"];
  const ratingValues = [5, 4, 3, 2, 1];
  
  return (
    <div className="bg-gray-100 p-6 rounded-md">
      <h3 className="text-xl font-bold mb-5">Calificaciones de Alumnos</h3>
      
      {/* Rating bars */}
      {ratingLabels.map((label, index) => {
        const count = distribution[4 - index]; // Reversed to show 5 to 1
        const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
        
        return (
          <div key={label} className="flex items-center mb-4">
            <div className="w-28 flex items-center">
              <span className="font-semibold mr-2">{label}</span>
              <span className="text-gray-500">{ratingValues[index]}</span>
            </div>
            <div className="flex-1 bg-gray-200 h-7 mx-4 overflow-hidden rounded-sm">
              <div 
                className="bg-blue-600 h-full" 
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <div className="w-8 text-right font-bold">{count}</div>
          </div>
        );
      })}
    </div>
  );
}