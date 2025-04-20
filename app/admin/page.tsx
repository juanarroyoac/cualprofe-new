'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Componente de tarjeta estadística
function StatCard({ title, value, href }: { title: string; value: string | number; href: string }) {
  return (
    <Link href={href} className="block bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </Link>
  );
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Contar total de profesores
        const professorsSnapshot = await getDocs(collection(db, 'teachers'));
        const totalProfessors = professorsSnapshot.size;
        
        // Contar total de usuarios
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const totalUsers = usersSnapshot.size;
        
        // Contar total de calificaciones
        const ratingsSnapshot = await getDocs(collection(db, 'ratings'));
        const totalRatings = ratingsSnapshot.size;
        
        // Contar solicitudes pendientes
        const pendingSubmissionsQuery = query(
          collection(db, 'professorSubmissions'),
          where('status', '==', 'pending')
        );
        const pendingSubmissionsSnapshot = await getDocs(pendingSubmissionsQuery);
        const pendingSubmissions = pendingSubmissionsSnapshot.size;
        
        setStats({
          totalProfessors,
          totalUsers,
          totalRatings,
          pendingSubmissions,
        });
        
        // Definir interfaces para seguridad de tipos
        interface ActivityItem {
          id: string;
          type: string;
          createdAt: Timestamp;
          name?: string;
          professorId?: string;
          [key: string]: any;
        }

        // Obtener calificaciones recientes
        const recentRatingsQuery = query(
          collection(db, 'ratings'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentRatingsSnapshot = await getDocs(recentRatingsQuery);
        const recentRatings: ActivityItem[] = recentRatingsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'rating',
            createdAt: data.createdAt as Timestamp,
            professorId: data.professorId,
            ...data
          };
        });
        
        // Obtener solicitudes recientes
        const recentSubmissionsQuery = query(
          collection(db, 'professorSubmissions'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentSubmissionsSnapshot = await getDocs(recentSubmissionsQuery);
        const recentSubmissions: ActivityItem[] = recentSubmissionsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'submission',
            createdAt: data.createdAt as Timestamp,
            name: data.name,
            ...data
          };
        });
        
        // Combinar y ordenar por fecha
        const combinedActivity: ActivityItem[] = [...recentRatings, ...recentSubmissions]
          .filter(item => item.createdAt instanceof Timestamp)
          .sort((a, b) => {
            return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
          })
          .slice(0, 5);
        
        setRecentActivity(combinedActivity);
      } catch (error) {
        console.error('Error al obtener datos del panel:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
        <p className="text-gray-600">Información general y actividad reciente</p>
      </div>
      
      {/* Cuadrícula de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Profesores" 
          value={stats.totalProfessors} 
          href="/admin/professors"
        />
        <StatCard 
          title="Usuarios" 
          value={stats.totalUsers} 
          href="/admin/users"
        />
        <StatCard 
          title="Calificaciones" 
          value={stats.totalRatings} 
          href="/admin/professors"
        />
        <StatCard 
          title="Solicitudes Pendientes" 
          value={stats.pendingSubmissions} 
          href="/admin/professors/submissions"
        />
      </div>
      
      {/* Actividad reciente */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Actividad Reciente</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <div key={activity.id} className="px-6 py-4">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    activity.type === 'rating' ? 'bg-green-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.type === 'rating' 
                        ? `Nueva calificación para profesor` 
                        : `Nueva solicitud de profesor: ${activity.name}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.createdAt instanceof Timestamp 
                        ? activity.createdAt.toDate().toLocaleString('es-ES') 
                        : 'Fecha desconocida'}
                    </p>
                  </div>
                  <div>
                    <Link 
                      href={activity.type === 'rating' 
                        ? `/admin/professors/${activity.professorId}` 
                        : `/admin/professors/submissions?id=${activity.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Ver detalles →
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-4 text-center text-gray-500">
              No hay actividad reciente
            </div>
          )}
        </div>
      </div>
    </div>
  );
}