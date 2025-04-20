'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc,
  orderBy, 
  startAfter,
  limit,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DataTable from '../components/DataTable';
import Link from 'next/link';

interface User {
  id: string;
  displayName: string;
  email: string;
  role: string;
  isAdmin?: boolean;
  createdAt?: Timestamp;
  lastLogin?: Timestamp;
  university?: string;
  photoURL?: string;
  emailVerified?: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const pageSize = 20;

  // Fetch users
  const fetchUsers = async (startAfterDoc = null) => {
    setLoading(true);
    try {
      // Build query
      let q = query(
        collection(db, 'users'),
        orderBy('displayName'),
        limit(pageSize + 1) // Get one extra to check if there are more
      );
      
      // Apply start after if provided
      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc));
      }
      
      // Apply role filter if selected
      if (roleFilter) {
        if (roleFilter === 'admin') {
          // For admin, check both role and isAdmin fields for compatibility
          q = query(
            collection(db, 'users'),
            where('role', '==', 'admin'),
            orderBy('displayName'),
            limit(pageSize + 1)
          );
        } else {
          q = query(
            collection(db, 'users'),
            where('role', '==', roleFilter),
            orderBy('displayName'),
            limit(pageSize + 1)
          );
        }
      }
      
      const querySnapshot = await getDocs(q);
      
      // Check if there are more results
      const hasMoreResults = querySnapshot.docs.length > pageSize;
      setHasMore(hasMoreResults);
      
      // Set the last visible document for pagination
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - (hasMoreResults ? 2 : 1)];
      setLastVisible(lastDoc);
      
      // Get the users (excluding the extra one if there are more)
      const usersList = querySnapshot.docs
        .slice(0, pageSize)
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as User));
      
      // If it's a fresh fetch (not loading more), replace the list
      // Otherwise append to the existing list
      if (startAfterDoc) {
        setUsers(prev => [...prev, ...usersList]);
      } else {
        setUsers(usersList);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && lastVisible) {
      fetchUsers(lastVisible);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  // Change user role (promote/demote)
  const handleChangeRole = async (user: User, newRole: string) => {
    const confirmMessage = newRole === 'admin' 
      ? `¿Estás seguro de que deseas promover a ${user.displayName || user.email} a administrador?`
      : `¿Estás seguro de que deseas cambiar el rol de ${user.displayName || user.email} a ${newRole}?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      await updateDoc(doc(db, 'users', user.id), {
        role: newRole,
        ...(newRole === 'admin' ? { isAdmin: true } : { isAdmin: false })
      });
      
      // Update local state
      setUsers(prev => prev.map(u => {
        if (u.id === user.id) {
          return {
            ...u,
            role: newRole,
            isAdmin: newRole === 'admin'
          };
        }
        return u;
      }));
      
      alert('Rol de usuario actualizado con éxito');
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error al actualizar el rol del usuario');
    }
  };

  // Handle user suspension
  const handleSuspendUser = async (user: User, isSuspended: boolean) => {
    const action = isSuspended ? 'suspender' : 'reactivar';
    if (!confirm(`¿Estás seguro de que deseas ${action} a ${user.displayName || user.email}?`)) {
      return;
    }
    
    try {
      await updateDoc(doc(db, 'users', user.id), {
        isSuspended: isSuspended
      });
      
      // Update local state
      setUsers(prev => prev.map(u => {
        if (u.id === user.id) {
          return {
            ...u,
            isSuspended
          };
        }
        return u;
      }));
      
      alert(`Usuario ${isSuspended ? 'suspendido' : 'reactivado'} con éxito`);
    } catch (error) {
      console.error('Error suspending user:', error);
      alert(`Error al ${action} el usuario`);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const columns = [
    {
      key: 'displayName',
      label: 'Nombre',
      render: (value: string, row: User) => (
        <div className="flex items-center">
          {row.photoURL && (
            <img 
              src={row.photoURL} 
              alt={value || 'User'} 
              className="h-8 w-8 rounded-full mr-3"
            />
          )}
          <div>
            <div className="text-sm font-medium text-gray-900">
              <Link href={`/admin/users/${row.id}`} className="hover:text-blue-600">
                {value || 'Usuario sin nombre'}
              </Link>
            </div>
            <div className="text-sm text-gray-500">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'university',
      label: 'Universidad',
      render: (value: string) => (
        <div className="text-sm text-gray-500">{value || '-'}</div>
      )
    },
    {
      key: 'role',
      label: 'Rol',
      render: (value: string, row: User) => (
        <div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            value === 'admin' || row.isAdmin 
              ? 'bg-purple-100 text-purple-800' 
              : value === 'moderator'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
          }`}>
            {value === 'admin' || row.isAdmin ? 'Administrador' : value || 'Usuario'}
          </span>
        </div>
      )
    },
    {
      key: 'emailVerified',
      label: 'Verificado',
      render: (value: boolean) => (
        <div>
          {value ? (
            <span className="text-green-600">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </span>
          ) : (
            <span className="text-gray-400">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Registrado',
      render: (value: Timestamp) => (
        <div className="text-sm text-gray-500">
          {value instanceof Timestamp
            ? value.toDate().toLocaleDateString('es-ES')
            : 'Fecha desconocida'}
        </div>
      )
    },
    {
      key: 'lastLogin',
      label: 'Último acceso',
      render: (value: Timestamp) => (
        <div className="text-sm text-gray-500">
          {value instanceof Timestamp
            ? value.toDate().toLocaleDateString('es-ES')
            : 'Nunca'}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <p className="text-gray-600">Administra los usuarios registrados en la plataforma</p>
      </div>
      
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/2">
          <label htmlFor="search" className="sr-only">
            Buscar usuario
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
              placeholder="Buscar por nombre o email..."
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="md:w-1/2">
          <label htmlFor="role" className="sr-only">
            Filtrar por rol
          </label>
          <select
            id="role"
            name="role"
            className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Todos los roles</option>
            <option value="admin">Administradores</option>
            <option value="moderator">Moderadores</option>
            <option value="user">Usuarios regulares</option>
          </select>
        </div>
      </div>
      
      {/* Users Table */}
      <DataTable
        data={filteredUsers}
        columns={columns}
        loading={loading}
        pagination={false}
        emptyMessage="No se encontraron usuarios"
        actions={{
          custom: [
            {
              label: 'Promover a Admin',
              onClick: (user) => handleChangeRole(user, 'admin'),
              color: 'purple',
            },
            {
              label: 'Cambiar a Moderador',
              onClick: (user) => handleChangeRole(user, 'moderator'),
              color: 'blue',
            },
            {
              label: 'Cambiar a Usuario',
              onClick: (user) => handleChangeRole(user, 'user'),
              color: 'gray',
            },
            {
              label: 'Suspender',
              onClick: (user) => handleSuspendUser(user, true),
              color: 'red',
            },
            {
              label: 'Reactivar',
              onClick: (user) => handleSuspendUser(user, false),
              color: 'green',
            }
          ]
        }}
      />
      
      {/* Load More Button */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {loading ? 'Cargando...' : 'Cargar más'}
          </button>
        </div>
      )}
    </div>
  );
}