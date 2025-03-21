'use client';

export default function RatingDistribution({ distribution }) {
  const totalRatings = distribution.reduce((sum, count) => sum + count, 0);
  const ratings = ["Excelente", "Muy Bueno", "Bueno", "Regular", "Terrible"];
  const ratingValues = [5, 4, 3, 2, 1];
  
  return (
    <div className="w-full md:w-80">
      <h3 className="text-base font-semibold mb-3">Distribución de Calificaciones</h3>
      {ratings.map((label, index) => {
        const count = distribution[4 - index]; // Reversed to show 5 to 1
        const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
        
        return (
          <div key={label} className="flex items-center mb-2 text-sm">
            <div className="w-28 flex items-center">
              <span className="mr-1">{label}</span>
              <span className="text-gray-500 ml-1">{ratingValues[index]}</span>
            </div>
            <div className="flex-1 bg-gray-200 h-6 mr-2 rounded-sm overflow-hidden">
              <div
                className="bg-blue-500 h-full"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <div className="w-6 text-right text-gray-600">{count}</div>
          </div>
        );
      })}
    </div>
  );
}