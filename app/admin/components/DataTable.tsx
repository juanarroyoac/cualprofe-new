'use client';

import { useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string; // Agregar propiedad width opcional
  priority?: number; // Prioridad para responsive (1 es más alta)
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
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      {/* Wrapper div con overflow-auto en lugar de overflow-hidden para permitir scroll */}
      <div className="overflow-auto">
        <table className="w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  className={`px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer ${
                    column.width ? column.width : ''
                  } ${
                    column.priority === 1 ? '' : 
                    column.priority === 2 ? 'hidden md:table-cell' : 
                    column.priority === 3 ? 'hidden lg:table-cell' : ''
                  }`}
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
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((row, rowIndex) => (
              <tr key={row.id || rowIndex}>
                {columns.map((column) => (
                  <td 
                    key={column.key} 
                    className={`px-3 py-4 ${
                      column.priority === 1 ? '' : 
                      column.priority === 2 ? 'hidden md:table-cell' : 
                      column.priority === 3 ? 'hidden lg:table-cell' : ''
                    }`}
                  >
                    {column.render ? (
                      column.render(row[column.key], row)
                    ) : (
                      <div className="text-sm text-gray-900 break-words">{row[column.key]}</div>
                    )}
                  </td>
                ))}
                {actions && (
                  <td className="px-2 py-4 text-right text-sm font-medium">
                    {/* Dropdown para acciones en lugar de botones en línea */}
                    <Menu as="div" className="relative inline-block text-left">
                      <div>
                        <Menu.Button className="inline-flex justify-center w-full px-2 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          Acciones
                          <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
                        </Menu.Button>
                      </div>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                          <div className="py-1">
                            {actions.view && onView && (
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => onView(row)}
                                    className={`${
                                      active ? 'bg-gray-100 text-blue-900' : 'text-blue-600'
                                    } block w-full text-left px-4 py-2 text-sm`}
                                  >
                                    Ver
                                  </button>
                                )}
                              </Menu.Item>
                            )}
                            {actions.edit && onEdit && (
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => onEdit(row)}
                                    className={`${
                                      active ? 'bg-gray-100 text-yellow-900' : 'text-yellow-600'
                                    } block w-full text-left px-4 py-2 text-sm`}
                                  >
                                    Editar
                                  </button>
                                )}
                              </Menu.Item>
                            )}
                            {actions.delete && onDelete && (
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => onDelete(row)}
                                    className={`${
                                      active ? 'bg-gray-100 text-red-900' : 'text-red-600'
                                    } block w-full text-left px-4 py-2 text-sm`}
                                  >
                                    Eliminar
                                  </button>
                                )}
                              </Menu.Item>
                            )}
                            {actions.custom && actions.custom.map((action, index) => (
                              <Menu.Item key={index}>
                                {({ active }) => (
                                  <button
                                    onClick={() => action.onClick(row)}
                                    className={`${
                                      active ? `bg-gray-100 text-${action.color}-900` : `text-${action.color}-600`
                                    } block w-full text-left px-4 py-2 text-sm`}
                                  >
                                    {action.label}
                                  </button>
                                )}
                              </Menu.Item>
                            ))}
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {pagination && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between">
          <div className="mb-4 sm:mb-0">
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