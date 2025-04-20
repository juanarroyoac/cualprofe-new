'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  where,
  limit,
  Timestamp,
  startAt,
  endAt
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Utility function to format date
const formatDate = (timestamp: Timestamp | null) => {
  if (!timestamp) return 'Fecha desconocida';
  return timestamp.toDate().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Analytics state
  const [userStats, setUserStats] = useState<any[]>([]);
  const [ratingStats, setRatingStats] = useState<any[]>([]);
  const [topProfessors, setTopProfessors] = useState<any[]>([]);
  const [universityStats, setUniversityStats] = useState<any[]>([]);
  const [topTags, setTopTags] = useState<any[]>([]);
  
  // Date range filter for charts
  const [dateRange, setDateRange] = useState('30days'); // '7days', '30days', '90days', '1year', 'all'

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Calculate date range filter
        let startDate = null;
        const now = new Date();
        
        switch (dateRange) {
          case '7days':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30days':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '90days':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case '1year':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            // No start date filter for 'all'
            break;
        }
        
        // Fetch user registrations over time
        await fetchUserStats(startDate ? Timestamp.fromDate(startDate) : null);
        
        // Fetch rating submissions over time
        await fetchRatingStats(startDate ? Timestamp.fromDate(startDate) : null);
        
        // Fetch top viewed professors
        await fetchTopProfessors();
        
        // Fetch university statistics
        await fetchUniversityStats();
        
        // Fetch top used tags
        await fetchTopTags();
        
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setError('Error al cargar los datos analíticos.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [dateRange]);

  // Fetch user registration stats
  const fetchUserStats = async (startTimestamp: Timestamp | null) => {
    try {
      let usersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'asc')
      );
      
      // Apply date filter if provided
      if (startTimestamp) {
        usersQuery = query(
          usersQuery,
          where('createdAt', '>=', startTimestamp)
        );
      }
      
      const usersSnapshot = await getDocs(usersQuery);
      
      // Group by date (day)
      const usersByDate = usersSnapshot.docs.reduce((acc, doc) => {
        const data = doc.data();
        
        if (data.createdAt instanceof Timestamp) {
          const date = data.createdAt.toDate();
          const dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().split('T')[0];
          
          if (!acc[dateKey]) {
            acc[dateKey] = {
              date: dateKey,
              count: 0,
              totalUsers: 0
            };
          }
          
          acc[dateKey].count += 1;
        }
        
        return acc;
      }, {} as Record<string, { date: string; count: number; totalUsers: number }>);
      
      // Sort by date and calculate running total
      const sortedDates = Object.keys(usersByDate).sort();
      let runningTotal = 0;
      
      const userStatsData = sortedDates.map(dateKey => {
        runningTotal += usersByDate[dateKey].count;
        
        return {
          date: dateKey,
          Usuarios: usersByDate[dateKey].count,
          Total: runningTotal
        };
      });
      
      setUserStats(userStatsData);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  };

  // Fetch rating stats
  const fetchRatingStats = async (startTimestamp: Timestamp | null) => {
    try {
      let ratingsQuery = query(
        collection(db, 'ratings'),
        orderBy('createdAt', 'asc')
      );
      
      // Apply date filter if provided
      if (startTimestamp) {
        ratingsQuery = query(
          ratingsQuery,
          where('createdAt', '>=', startTimestamp)
        );
      }
      
      const ratingsSnapshot = await getDocs(ratingsQuery);
      
      // Group by date (day)
      const ratingsByDate = ratingsSnapshot.docs.reduce((acc, doc) => {
        const data = doc.data();
        
        if (data.createdAt instanceof Timestamp) {
          const date = data.createdAt.toDate();
          const dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().split('T')[0];
          
          if (!acc[dateKey]) {
            acc[dateKey] = {
              date: dateKey,
              count: 0,
              totalRatings: 0
            };
          }
          
          acc[dateKey].count += 1;
        }
        
        return acc;
      }, {} as Record<string, { date: string; count: number; totalRatings: number }>);
      
      // Sort by date and calculate running total
      const sortedDates = Object.keys(ratingsByDate).sort();
      let runningTotal = 0;
      
      const ratingStatsData = sortedDates.map(dateKey => {
        runningTotal += ratingsByDate[dateKey].count;
        
        return {
          date: dateKey,
          Calificaciones: ratingsByDate[dateKey].count,
          Total: runningTotal
        };
      });
      
      setRatingStats(ratingStatsData);
    } catch (error) {
      console.error('Error fetching rating stats:', error);
      throw error;
    }
  };

  // Fetch top professors
  const fetchTopProfessors = async () => {
    try {
      const professorsQuery = query(
        collection(db, 'teachers'),
        orderBy('viewCount', 'desc'),
        limit(10)
      );
      
      const professorsSnapshot = await getDocs(professorsQuery);
      
      const topProfessorsData = professorsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          university: data.university,
          viewCount: data.viewCount || 0,
          totalRatings: data.totalRatings || 0,
          averageRating: data.averageRating || 0
        };
      });
      
      setTopProfessors(topProfessorsData);
    } catch (error) {
      console.error('Error fetching top professors:', error);
      throw error;
    }
  };

  // Fetch university stats
  const fetchUniversityStats = async () => {
    try {
      const professorsQuery = query(
        collection(db, 'teachers')
      );
      
      const professorsSnapshot = await getDocs(professorsQuery);
      
      // Group by university
      const universitiesMap = professorsSnapshot.docs.reduce((acc, doc) => {
        const data = doc.data();
        const university = data.university;
        
        if (!university) return acc;
        
        if (!acc[university]) {
          acc[university] = {
            name: university,
            professorCount: 0,
            totalRatings: 0,
            averageRating: 0,
            ratingsSum: 0
          };
        }
        
        acc[university].professorCount += 1;
        acc[university].totalRatings += data.totalRatings || 0;
        
        if (data.averageRating) {
          acc[university].ratingsSum += data.averageRating * (data.totalRatings || 1);
        }
        
        return acc;
      }, {} as Record<string, { name: string; professorCount: number; totalRatings: number; averageRating: number; ratingsSum: number }>);
      
      // Calculate average ratings and sort by professor count
      const universityStatsData = Object.values(universitiesMap)
        .map(uni => {
          if (uni.totalRatings > 0) {
            uni.averageRating = parseFloat((uni.ratingsSum / uni.totalRatings).toFixed(2));
          }
          return {
            name: uni.name,
            professorCount: uni.professorCount,
            totalRatings: uni.totalRatings,
            averageRating: uni.averageRating
          };
        })
        .sort((a, b) => b.professorCount - a.professorCount);
      
      setUniversityStats(universityStatsData);
    } catch (error) {
      console.error('Error fetching university stats:', error);
      throw error;
    }
  };

  // Fetch top tags
  const fetchTopTags = async () => {
    try {
      const ratingsQuery = query(
        collection(db, 'ratings')
      );
      
      const ratingsSnapshot = await getDocs(ratingsQuery);
      
      // Count tag occurrences
      const tagCounts: Record<string, number> = {};
      
      ratingsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        
        if (data.tags && Array.isArray(data.tags)) {
          data.tags.forEach((tag: string) => {
            if (!tagCounts[tag]) {
              tagCounts[tag] = 0;
            }
            tagCounts[tag] += 1;
          });
        }
      });
      
      // Convert to array and sort by count
      const topTagsData = Object.entries(tagCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
      
      setTopTags(topTagsData);
    } catch (error) {
      console.error('Error fetching top tags:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Análisis y Estadísticas</h1>
        <p className="text-gray-600">Visualización de métricas y tendencias de la plataforma</p>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Date range filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setDateRange('7days')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              dateRange === '7days'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Últimos 7 días
          </button>
          <button
            onClick={() => setDateRange('30days')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              dateRange === '30days'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Últimos 30 días
          </button>
          <button
            onClick={() => setDateRange('90days')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              dateRange === '90days'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Últimos 90 días
          </button>
          <button
            onClick={() => setDateRange('1year')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              dateRange === '1year'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Último año
          </button>
          <button
            onClick={() => setDateRange('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              dateRange === 'all'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Todo el tiempo
          </button>
        </div>
      </div>
      
      {/* User growth chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Crecimiento de Usuarios</h2>
        <div className="h-80">
          {userStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={userStats}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="Usuarios" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="Total" 
                  stroke="#82ca9d" 
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">No hay datos de usuarios disponibles para este período.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Rating submissions chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Calificaciones Enviadas</h2>
        <div className="h-80">
          {ratingStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={ratingStats}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="Calificaciones" 
                  stroke="#0088FE" 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="Total" 
                  stroke="#00C49F" 
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">No hay datos de calificaciones disponibles para este período.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Top professors and universities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top viewed professors */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Profesores Más Populares</h2>
          {topProfessors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Universidad
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vistas
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Calificaciones
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Promedio
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topProfessors.map((professor, index) => (
                    <tr key={professor.id}>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {index + 1}. {professor.name}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{professor.university}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-900">{professor.viewCount}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-900">{professor.totalRatings}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-900">
                          {professor.averageRating ? professor.averageRating.toFixed(1) : '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay datos de profesores disponibles.</p>
            </div>
          )}
        </div>
        
        {/* University distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Distribución por Universidad</h2>
          <div className="h-80">
            {universityStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={universityStats}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="professorCount" name="Profesores" fill="#8884d8" />
                  <Bar dataKey="totalRatings" name="Calificaciones" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">No hay datos de universidades disponibles.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Tag usage chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Etiquetas Más Utilizadas</h2>
        <div className="h-80">
          {topTags.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topTags}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Bar dataKey="value" name="Veces utilizada">
                  {topTags.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">No hay datos de etiquetas disponibles.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}