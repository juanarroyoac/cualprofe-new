'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  orderBy, 
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DataTable from '../components/DataTable';

interface Professor {
  id: string;
  name: string;
  university: string;
  department: string;
  createdAt?: Timestamp;
  totalRatings?: number;
  averageRating?: number;
}

export default function ProfessorsPage() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [universityFilter, setUniversityFilter] = useState('');
  const [universities, setUniversities] = useState<string[]>([]);

  const fetchProfessors = async () => {
    setLoading(true);
    try {
      // Build query to get ALL professors
      const q = query(
        collection(db, 'teachers'),
        orderBy('name')
      );
      
      const querySnapshot = await getDocs(q);
      
      // Get all professors
      const professorsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Timestamp to date string for display
        createdAt: doc.data().createdAt
      } as Professor));
      
      setProfessors(professorsList);
      
      // Extract unique universities for filtering
      const uniqueUniversities = Array.from(
        new Set(professorsList.map(prof => prof.university))
      ).filter(Boolean).sort();
      
      setUniversities(uniqueUniversities);
    } catch (error) {
      console.error('Error fetching professors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (professor: Professor) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar a ${professor.name}?`)) {
      return;
    }
    
    try {
      // Use the API route instead of direct Firestore deletion
      const response = await fetch(`/api/admin/professors/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ professorId: professor.id }),
      });
      
      // Parse the response regardless of status
      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        responseData = { message: 'Error de formato en la respuesta del servidor' };
      }
      
      // Check if response was successful
      if (!response.ok) {
        console.error('Server response error:', responseData);
        // Instead of throwing an error, just handle it directly
        alert(`Error al eliminar el profesor: ${responseData.message || 'Error desconocido'}`);
        return;
      }
      
      // If we got here, deletion was successful
      setProfessors(prev => prev.filter(p => p.id !== professor.id));
      alert('Profesor eliminado con éxito');
    } catch (error) {
      console.error('Error deleting professor:', error);
      alert(`Error al eliminar el profesor: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  useEffect(() => {
    fetchProfessors();
  }, []);

  // Filter professors based on search term and university filter
  const filteredProfessors = professors.filter(professor => {
    const matchesSearch = !searchTerm || 
      professor.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUniversity = !universityFilter || 
      professor.university === universityFilter;
    
    return matchesSearch && matchesUniversity;
  });

  const columns = [
    {
      key: 'name',
      label: 'Nombre',
      render: (value: string, row: Professor) => (
        <div className="text-sm font-medium text-gray-900">
          <Link href={`/admin/professors/${row.id}`} className="hover:text-blue-600">
            {value}
          </Link>
        </div>
      )
    },
    {
      key: 'university',
      label: 'Universidad',
      render: (value: string) => (
        <div className="text-sm text-gray-500">{value}</div>
      )
    },
    {
      key: 'department',
      label: 'Departamento',
      render: (value: string) => (
        <div className="text-sm text-gray-500">{value}</div>
      )
    },
    {
      key: 'totalRatings',
      label: 'Calificaciones',
      render: (value: number) => (
        <div className="text-sm text-gray-500">{value || 0}</div>
      )
    },
    {
      key: 'averageRating',
      label: 'Promedio',
      render: (value: number) => (
        <div className="text-sm text-gray-500">
          {value ? value.toFixed(1) : 'Sin calificaciones'}
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Creado',
      render: (value: Timestamp) => (
        <div className="text-sm text-gray-500">
          {value instanceof Timestamp
            ? value.toDate().toLocaleDateString('es-ES')
            : 'Fecha desconocida'}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Profesores</h1>
        <p className="text-gray-600">Administra la información de los profesores</p>
      </div>
      
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/2">
          <label htmlFor="search" className="sr-only">
            Buscar profesor
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              id="search"
              name="search"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Buscar profesor..."
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="md:w-1/2">
          <label htmlFor="university" className="sr-only">
            Filtrar por universidad
          </label>
          <select
            id="university"
            name="university"
            className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={universityFilter}
            onChange={(e) => setUniversityFilter(e.target.value)}
          >
            <option value="">Todas las universidades</option>
            {universities.map((uni) => (
              <option key={uni} value={uni}>
                {uni}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {/* Professors Table */}
      <DataTable
        data={filteredProfessors}
        columns={columns}
        loading={loading}
        pagination={false}
        emptyMessage="No se encontraron profesores"
        actions={{
          edit: true,
          delete: true,
          view: true
        }}
        onEdit={(professor) => {
          window.location.href = `/admin/professors/${professor.id}`;
        }}
        onDelete={handleDelete}
        onView={(professor) => {
          window.open(`/teacher/${professor.id}`, '_blank');
        }}
      />
    </div>
  );
}