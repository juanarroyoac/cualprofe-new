'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore';

// Componente de tarjeta estadística
function StatCard({ title, value, href, trend }: { 
  title: string; 
  value: string | number; 
  href: string;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <Link href={href} className="block bg-white p-6 border border-gray-200 hover:border-gray-300">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {trend && (
          <div className="mt-2 flex items-center">
            <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-gray-500 ml-1">vs last month</span>
          </div>
        )}
      </div>
    </Link>
  );
}

// Función auxiliar para formatear fechas de Firestore
function formatFirestoreDate(timestamp: any): string {
  if (!timestamp) return 'Fecha desconocida';
  
  try {
    // Caso 1: Es un objeto Timestamp de Firestore con método toDate()
    if (timestamp && typeof timestamp.toDate === 'function') {
      return new Date(timestamp.toDate()).toLocaleString('es-ES');
    }
    
    // Caso 2: Es un objeto con _seconds (formato serializado)
    if (timestamp && timestamp._seconds) {
      return new Date(timestamp._seconds * 1000).toLocaleString('es-ES');
    }
    
    // Caso 3: Es un string ISO o número
    if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      return new Date(timestamp).toLocaleString('es-ES');
    }
    
    // Caso por defecto
    return 'Fecha desconocida';
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Fecha desconocida';
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProfessors: 0,
    totalUsers: 0,
    totalRatings: 0,
    pendingSubmissions: 0,
  });
  
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch stats and activity from API routes
        const [statsResponse, activityResponse] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/recent-activity')
        ]);
        
        if (!statsResponse.ok) {
          throw new Error(`Error al obtener estadísticas: ${statsResponse.status}`);
        }
        
        if (!activityResponse.ok) {
          throw new Error(`Error al obtener actividad reciente: ${activityResponse.status}`);
        }
        
        const statsData = await statsResponse.json();
        const activityData = await activityResponse.json();
        
        setStats(statsData);
        setRecentActivity(activityData);
      } catch (error) {
        console.error('Error al obtener datos del panel:', error);
        setError(error instanceof Error ? error.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Panel de Administración</h1>
          <p className="text-sm text-gray-500 mt-1">Información general y actividad reciente</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">
            Exportar
          </button>
        </div>
      </div>
      
      {/* Cuadrícula de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Profesores" 
          value={stats.totalProfessors} 
          href="/admin/professors"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard 
          title="Usuarios" 
          value={stats.totalUsers} 
          href="/admin/users"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard 
          title="Calificaciones" 
          value={stats.totalRatings} 
          href="/admin/professors"
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard 
          title="Solicitudes Pendientes" 
          value={stats.pendingSubmissions} 
          href="/admin/professors/submissions"
          trend={{ value: 5, isPositive: false }}
        />
      </div>
      
      {/* Actividad reciente */}
      <div className="bg-white border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Actividad Reciente</h2>
            <button className="text-sm text-gray-600 hover:text-gray-900">
              Ver todo
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div key={index} className="px-6 py-4 hover:bg-gray-50">
                <p className="text-sm text-gray-900">{activity.description}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-gray-500">No hay actividad reciente para mostrar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}