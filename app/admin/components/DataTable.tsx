'use client';

import { useState } from 'react';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  pagination?: boolean;
  pageSize?: number;
  actions?: {
    edit?: boolean;
    delete?: boolean;
    view?: boolean;
    custom?: Array<{
      label: string;
      onClick: (row: any) => void;
      color: string;
    }>;
  };
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onView?: (row: any) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export default function DataTable({
  data,
  columns,
  pagination = true,
  pageSize = 10,
  actions,
  onEdit,
  onDelete,
  onView,
  loading = false,
  emptyMessage = 'No hay datos disponibles'
}: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Handle pagination
  const totalPages = pagination ? Math.ceil(data.length / pageSize) : 1;
  const start = pagination ? (currentPage - 1) * pageSize : 0;
  const end = pagination ? start + pageSize : data.length;

  // Handle sorting
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Sort data if necessary
  const sortedData = [...data];
  if (sortKey) {
    sortedData.sort((a, b) => {
      const valueA = a[sortKey];
      const valueB = b[sortKey];
      
      if (valueA === valueB) return 0;
      
      // Handle dates
      if (valueA instanceof Date && valueB instanceof Date) {
        return sortDirection === 'asc' 
          ? valueA.getTime() - valueB.getTime()
          : valueB.getTime() - valueA.getTime();
      }
      
      // Handle strings
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      
      // Handle numbers and other types
      return sortDirection === 'asc'
        ? (valueA < valueB ? -1 : 1)
        : (valueA < valueB ? 1 : -1);
    });
  }

  // Get current page data
  const currentData = sortedData.slice(start, end);

  // Render loading state
  if (loading) {
    return (
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  // Render empty state
  if (data.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <div className="text-center py-12">
          <p className="text-gray-600">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                >
                  <div className="flex items-center">
                    {column.label}
                    {sortKey === column.key && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((row, rowIndex) => (
              <tr key={row.id || rowIndex}>
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                    {column.render ? (
                      column.render(row[column.key], row)
                    ) : (
                      <div className="text-sm text-gray-900">{row[column.key]}</div>
                    )}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {actions.view && onView && (
                      <button
                        onClick={() => onView(row)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Ver
                      </button>
                    )}
                    {actions.edit && onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        className="text-yellow-600 hover:text-yellow-900 mr-3"
                      >
                        Editar
                      </button>
                    )}
                    {actions.delete && onDelete && (
                      <button
                        onClick={() => onDelete(row)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    )}
                    {actions.custom && actions.custom.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => action.onClick(row)}
                        className={`text-${action.color}-600 hover:text-${action.color}-900 mr-3`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {pagination && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando{' '}
              <span className="font-medium">{start + 1}</span>{' '}
              a{' '}
              <span className="font-medium">
                {Math.min(end, data.length)}
              </span>{' '}
              de{' '}
              <span className="font-medium">{data.length}</span>{' '}
              resultados
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 text-sm rounded-md ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 text-sm rounded-md ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}