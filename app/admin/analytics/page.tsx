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

// Colors for charts - more modern and subtle
const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#6366F1',
  background: '#F9FAFB',
  text: '#1F2937',
  grid: '#E5E7EB',
  rating: {
    5: '#059669',
    4: '#10B981',
    3: '#3B82F6',
    2: '#F59E0B',
    1: '#EF4444'
  }
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Add new components
const MetricCard = ({ title, value, change, icon }: { 
  title: string; 
  value: string | number; 
  change?: { value: number; isPositive: boolean };
  icon?: React.ReactNode;
}) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {change && (
          <div className="mt-2 flex items-center">
            <span className={`text-sm font-medium ${change.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {change.isPositive ? '↑' : '↓'} {Math.abs(change.value)}%
            </span>
            <span className="text-xs text-gray-500 ml-1">vs last period</span>
          </div>
        )}
      </div>
      {icon && (
        <div className="p-2 rounded-lg bg-gray-50">
          {icon}
        </div>
      )}
    </div>
  </div>
);

const RatingDistributionChart = ({ data }: { data: number[] }) => {
  const total = data.reduce((sum, count) => sum + count, 0);
  const labels = ["Excelente", "Muy Bueno", "Bueno", "Regular", "Terrible"];
  const values = [5, 4, 3, 2, 1];
  
  return (
    <div className="space-y-3">
      {labels.map((label, index) => {
        const count = data[4 - index];
        const percentage = total > 0 ? (count / total) * 100 : 0;
        const color = CHART_COLORS.rating[values[index] as keyof typeof CHART_COLORS.rating];
        
        return (
          <div key={label} className="flex items-center">
            <div className="w-24 flex items-center">
              <span className="text-sm font-medium text-gray-700">{label}</span>
              <span className="text-xs text-gray-500 ml-2">{values[index]}</span>
            </div>
            <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: color
                }}
              />
            </div>
            <div className="w-16 text-right">
              <span className="text-sm font-medium text-gray-900">{count}</span>
              <span className="text-xs text-gray-500 ml-1">({percentage.toFixed(1)}%)</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TagCloud = ({ tags }: { tags: { name: string; value: number }[] }) => {
  const maxValue = Math.max(...tags.map(tag => tag.value));
  const minValue = Math.min(...tags.map(tag => tag.value));
  
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const size = ((tag.value - minValue) / (maxValue - minValue)) * 0.5 + 0.5; // Scale between 0.5 and 1
        return (
          <span
            key={tag.name}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: `${CHART_COLORS.primary}${Math.floor(size * 20)}`,
              color: size > 0.7 ? 'white' : CHART_COLORS.text,
              transform: `scale(${size})`
            }}
          >
            {tag.name}
            <span className="ml-1 text-xs opacity-75">({tag.value})</span>
          </span>
        );
      })}
    </div>
  );
};

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

  const [summaryMetrics, setSummaryMetrics] = useState({
    averageRating: 0,
    totalViews: 0,
    activeUsers: 0,
    responseRate: 0
  });
  
  const [ratingDistribution, setRatingDistribution] = useState([0, 0, 0, 0, 0]);
  const [yearOverYearGrowth, setYearOverYearGrowth] = useState({
    users: 0,
    ratings: 0,
    professors: 0
  });

  // Add new state for previous period metrics
  const [previousPeriodMetrics, setPreviousPeriodMetrics] = useState({
    averageRating: 0,
    totalViews: 0,
    activeUsers: 0,
    responseRate: 0
  });

  // Helper function to calculate date range
  const getDateRange = (range: string) => {
    const now = new Date();
    let startDate = new Date();
    let previousStartDate = new Date();

    switch (range) {
      case '7days':
        startDate.setDate(now.getDate() - 7);
        previousStartDate.setDate(now.getDate() - 14);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        previousStartDate.setDate(now.getDate() - 60);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        previousStartDate.setDate(now.getDate() - 180);
        break;
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1);
        previousStartDate.setFullYear(now.getFullYear() - 2);
        break;
      default: // 'all'
        startDate = new Date(0); // Beginning of time
        previousStartDate = new Date(0);
    }

    return {
      currentStart: Timestamp.fromDate(startDate),
      previousStart: Timestamp.fromDate(previousStartDate),
      currentEnd: Timestamp.fromDate(now)
    };
  };

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const dateRanges = getDateRange(dateRange);
        
        // Fetch user registrations over time
        await fetchUserStats(dateRanges.currentStart, dateRanges.currentEnd);
        
        // Fetch rating submissions over time
        await fetchRatingStats(dateRanges.currentStart, dateRanges.currentEnd);
        
        // Fetch top viewed professors
        await fetchTopProfessors();
        
        // Fetch university statistics
        await fetchUniversityStats();
        
        // Fetch top used tags
        await fetchTopTags();
        
        // Add new fetch calls
        await fetchSummaryMetrics(dateRanges);
        await fetchYearOverYearGrowth(dateRanges);
        
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
  const fetchUserStats = async (startTimestamp: Timestamp, endTimestamp: Timestamp) => {
    try {
      let usersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'asc')
      );
      
      // Apply date filter if provided
      usersQuery = query(
        usersQuery,
        where('createdAt', '>=', startTimestamp),
        where('createdAt', '<=', endTimestamp)
      );
      
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
  const fetchRatingStats = async (startTimestamp: Timestamp, endTimestamp: Timestamp) => {
    try {
      let ratingsQuery = query(
        collection(db, 'ratings'),
        orderBy('createdAt', 'asc')
      );
      
      // Apply date filter if provided
      ratingsQuery = query(
        ratingsQuery,
        where('createdAt', '>=', startTimestamp),
        where('createdAt', '<=', endTimestamp)
      );
      
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

  // Update fetchSummaryMetrics to use date ranges
  const fetchSummaryMetrics = async (dateRanges: { currentStart: Timestamp; previousStart: Timestamp; currentEnd: Timestamp }) => {
    try {
      // Fetch current period data
      const [currentRatings, currentProfessors, currentUsers] = await Promise.all([
        getDocs(query(collection(db, 'ratings'), 
          where('createdAt', '>=', dateRanges.currentStart),
          where('createdAt', '<=', dateRanges.currentEnd)
        )),
        getDocs(query(collection(db, 'teachers'))),
        getDocs(query(collection(db, 'users'),
          where('createdAt', '>=', dateRanges.currentStart),
          where('createdAt', '<=', dateRanges.currentEnd)
        ))
      ]);

      // Fetch previous period data
      const [previousRatings, previousProfessors, previousUsers] = await Promise.all([
        getDocs(query(collection(db, 'ratings'),
          where('createdAt', '>=', dateRanges.previousStart),
          where('createdAt', '<', dateRanges.currentStart)
        )),
        getDocs(query(collection(db, 'teachers'))),
        getDocs(query(collection(db, 'users'),
          where('createdAt', '>=', dateRanges.previousStart),
          where('createdAt', '<', dateRanges.currentStart)
        ))
      ]);

      // Calculate current period metrics
      let totalRating = 0;
      let ratingCount = 0;
      const distribution = [0, 0, 0, 0, 0];
      
      currentRatings.docs.forEach(doc => {
        const data = doc.data();
        if (data.quality) {
          totalRating += data.quality;
          ratingCount++;
          const ratingIndex = Math.floor(data.quality) - 1;
          if (ratingIndex >= 0 && ratingIndex < 5) {
            distribution[ratingIndex]++;
          }
        }
      });

      const totalViews = currentProfessors.docs.reduce((sum, doc) => {
        return sum + (doc.data().viewCount || 0);
      }, 0);

      // Calculate previous period metrics
      let prevTotalRating = 0;
      let prevRatingCount = 0;
      
      previousRatings.docs.forEach(doc => {
        const data = doc.data();
        if (data.quality) {
          prevTotalRating += data.quality;
          prevRatingCount++;
        }
      });

      const prevTotalViews = previousProfessors.docs.reduce((sum, doc) => {
        return sum + (doc.data().viewCount || 0);
      }, 0);

      // Calculate active users (users who have rated in the current period)
      const activeUsers = new Set(currentRatings.docs.map(doc => doc.data().userId)).size;
      const prevActiveUsers = new Set(previousRatings.docs.map(doc => doc.data().userId)).size;

      // Calculate response rate (ratings / views)
      const responseRate = totalViews > 0 ? (currentRatings.size / totalViews) * 100 : 0;
      const prevResponseRate = prevTotalViews > 0 ? (previousRatings.size / prevTotalViews) * 100 : 0;

      // Set current metrics
      setSummaryMetrics({
        averageRating: ratingCount > 0 ? totalRating / ratingCount : 0,
        totalViews,
        activeUsers,
        responseRate
      });

      // Set previous period metrics for trend calculation
      setPreviousPeriodMetrics({
        averageRating: prevRatingCount > 0 ? prevTotalRating / prevRatingCount : 0,
        totalViews: prevTotalViews,
        activeUsers: prevActiveUsers,
        responseRate: prevResponseRate
      });

      setRatingDistribution(distribution);
    } catch (error) {
      console.error('Error fetching summary metrics:', error);
      throw error;
    }
  };

  // Helper function to calculate trend percentage
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 100, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      isPositive: change >= 0
    };
  };

  // Update fetchYearOverYearGrowth to use date ranges
  const fetchYearOverYearGrowth = async (dateRanges: { currentStart: Timestamp; previousStart: Timestamp; currentEnd: Timestamp }) => {
    try {
      const [currentYearStats, lastYearStats] = await Promise.all([
        Promise.all([
          getDocs(query(collection(db, 'users'), 
            where('createdAt', '>=', dateRanges.currentStart),
            where('createdAt', '<=', dateRanges.currentEnd)
          )),
          getDocs(query(collection(db, 'ratings'),
            where('createdAt', '>=', dateRanges.currentStart),
            where('createdAt', '<=', dateRanges.currentEnd)
          )),
          getDocs(query(collection(db, 'teachers'),
            where('createdAt', '>=', dateRanges.currentStart),
            where('createdAt', '<=', dateRanges.currentEnd)
          ))
        ]),
        Promise.all([
          getDocs(query(collection(db, 'users'), 
            where('createdAt', '>=', dateRanges.previousStart),
            where('createdAt', '<', dateRanges.currentStart)
          )),
          getDocs(query(collection(db, 'ratings'),
            where('createdAt', '>=', dateRanges.previousStart),
            where('createdAt', '<', dateRanges.currentStart)
          )),
          getDocs(query(collection(db, 'teachers'),
            where('createdAt', '>=', dateRanges.previousStart),
            where('createdAt', '<', dateRanges.currentStart)
          ))
        ])
      ]);
      
      const calculateGrowth = (current: number, previous: number) => {
        if (previous === 0) return 100;
        return ((current - previous) / previous) * 100;
      };
      
      setYearOverYearGrowth({
        users: calculateGrowth(currentYearStats[0].size, lastYearStats[0].size),
        ratings: calculateGrowth(currentYearStats[1].size, lastYearStats[1].size),
        professors: calculateGrowth(currentYearStats[2].size, lastYearStats[2].size)
      });
    } catch (error) {
      console.error('Error fetching year over year growth:', error);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">Análisis y Estadísticas</h1>
        <p className="text-gray-600 mt-1">Visualización de métricas y tendencias de la plataforma</p>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
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
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {['7days', '30days', '90days', '1year', 'all'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                dateRange === range
                  ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-500 ring-opacity-50'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {range === '7days' && 'Últimos 7 días'}
              {range === '30days' && 'Últimos 30 días'}
              {range === '90days' && 'Últimos 90 días'}
              {range === '1year' && 'Último año'}
              {range === 'all' && 'Todo el tiempo'}
            </button>
          ))}
        </div>
      </div>
      
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Calificación Promedio"
          value={summaryMetrics.averageRating.toFixed(1)}
          change={calculateTrend(summaryMetrics.averageRating, previousPeriodMetrics.averageRating)}
          icon={
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
        />
        <MetricCard
          title="Total de Vistas"
          value={summaryMetrics.totalViews.toLocaleString()}
          change={calculateTrend(summaryMetrics.totalViews, previousPeriodMetrics.totalViews)}
          icon={
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        />
        <MetricCard
          title="Usuarios Activos"
          value={summaryMetrics.activeUsers.toLocaleString()}
          change={calculateTrend(summaryMetrics.activeUsers, previousPeriodMetrics.activeUsers)}
          icon={
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <MetricCard
          title="Tasa de Respuesta"
          value={`${summaryMetrics.responseRate.toFixed(1)}%`}
          change={calculateTrend(summaryMetrics.responseRate, previousPeriodMetrics.responseRate)}
          icon={
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          }
        />
      </div>
      
      {/* Year over Year Growth */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Crecimiento {dateRange === '7days' ? 'Semanal' : 
                      dateRange === '30days' ? 'Mensual' :
                      dateRange === '90days' ? 'Trimestral' :
                      dateRange === '1year' ? 'Anual' : 'Total'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Usuarios</p>
            <p className={`text-2xl font-bold ${yearOverYearGrowth.users >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {yearOverYearGrowth.users >= 0 ? '+' : ''}{yearOverYearGrowth.users.toFixed(1)}%
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Calificaciones</p>
            <p className={`text-2xl font-bold ${yearOverYearGrowth.ratings >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {yearOverYearGrowth.ratings >= 0 ? '+' : ''}{yearOverYearGrowth.ratings.toFixed(1)}%
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Profesores</p>
            <p className={`text-2xl font-bold ${yearOverYearGrowth.professors >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {yearOverYearGrowth.professors >= 0 ? '+' : ''}{yearOverYearGrowth.professors.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User growth chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Crecimiento de Usuarios</h2>
          <div className="h-80">
            {userStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={userStats}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis 
                    dataKey="date" 
                    stroke={CHART_COLORS.text}
                    tick={{ fill: CHART_COLORS.text }}
                  />
                  <YAxis 
                    stroke={CHART_COLORS.text}
                    tick={{ fill: CHART_COLORS.text }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="Usuarios" 
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.primary }}
                    activeDot={{ r: 8, fill: CHART_COLORS.primary }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Total" 
                    stroke={CHART_COLORS.secondary}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.secondary }}
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Calificaciones Enviadas</h2>
          <div className="h-80">
            {ratingStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={ratingStats}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.accent} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={CHART_COLORS.accent} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis 
                    dataKey="date" 
                    stroke={CHART_COLORS.text}
                    tick={{ fill: CHART_COLORS.text }}
                  />
                  <YAxis 
                    stroke={CHART_COLORS.text}
                    tick={{ fill: CHART_COLORS.text }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="Calificaciones" 
                    stroke={CHART_COLORS.accent}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.accent }}
                    activeDot={{ r: 8, fill: CHART_COLORS.accent }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Total" 
                    stroke={CHART_COLORS.secondary}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.secondary }}
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
        
        {/* Top professors */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profesores Más Populares</h2>
          {topProfessors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
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
                <tbody className="divide-y divide-gray-200">
                  {topProfessors.map((professor, index) => (
                    <tr key={professor.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{professor.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{professor.university}</div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-900">{professor.viewCount}</div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-900">{professor.totalRatings}</div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Universidad</h2>
          <div className="h-80">
            {universityStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={universityStats}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis 
                    dataKey="name" 
                    stroke={CHART_COLORS.text}
                    tick={{ fill: CHART_COLORS.text }}
                  />
                  <YAxis 
                    stroke={CHART_COLORS.text}
                    tick={{ fill: CHART_COLORS.text }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="professorCount" 
                    name="Profesores" 
                    fill={CHART_COLORS.primary}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="totalRatings" 
                    name="Calificaciones" 
                    fill={CHART_COLORS.secondary}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">No hay datos de universidades disponibles.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Rating Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Calificaciones</h2>
          <RatingDistributionChart data={ratingDistribution} />
        </div>
        
        {/* Tag Cloud */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Etiquetas Populares</h2>
          <TagCloud tags={topTags} />
        </div>
      </div>
    </div>
  );
}