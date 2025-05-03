'use client';

import { useState, useEffect } from 'react';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SystemSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  ratingApprovalRequired: boolean;
  maxTagsPerRating: number;
  minCommentLength: number;
  notifyAdminOnNewRating: boolean;
  notifyAdminOnNewProfessor: boolean;
  emailNotificationsEnabled: boolean;
  contactEmail: string;
  lastUpdated?: any;
  updatedBy?: string;
}

const defaultSettings: SystemSettings = {
  maintenanceMode: false,
  maintenanceMessage: 'El sitio está en mantenimiento. Por favor, vuelve más tarde.',
  ratingApprovalRequired: false,
  maxTagsPerRating: 5,
  minCommentLength: 20,
  notifyAdminOnNewRating: true,
  notifyAdminOnNewProfessor: true,
  emailNotificationsEnabled: true,
  contactEmail: 'contacto@cualprofe.com'
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        
        const settingsDoc = await getDoc(doc(db, 'settings', 'system'));
        
        if (settingsDoc.exists()) {
          const settingsData = settingsDoc.data() as SystemSettings;
          
          // Ensure numeric values are valid numbers
          const sanitizedSettings = {
            ...settingsData,
            maxTagsPerRating: typeof settingsData.maxTagsPerRating === 'number' && !isNaN(settingsData.maxTagsPerRating) 
              ? settingsData.maxTagsPerRating 
              : defaultSettings.maxTagsPerRating,
            minCommentLength: typeof settingsData.minCommentLength === 'number' && !isNaN(settingsData.minCommentLength)
              ? settingsData.minCommentLength
              : defaultSettings.minCommentLength
          };
          
          setSettings(sanitizedSettings);
          setOriginalSettings(sanitizedSettings);
        } else {
          // If settings don't exist, create them with defaults
          await setDoc(doc(db, 'settings', 'system'), {
            ...defaultSettings,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        setError('Error al cargar la configuración del sistema');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  // Check if settings have changed from original
  useEffect(() => {
    const hasChanged = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(hasChanged);
  }, [settings, originalSettings]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Handle different input types
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setSettings({
        ...settings,
        [name]: checked
      });
    } else if (type === 'number') {
      const parsedValue = parseInt(value, 10);
      setSettings({
        ...settings,
        [name]: isNaN(parsedValue) ? 0 : parsedValue
      });
    } else {
      setSettings({
        ...settings,
        [name]: value
      });
    }
  };

  // Save settings
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      // Validate email
      if (settings.contactEmail && !/^\S+@\S+\.\S+$/.test(settings.contactEmail)) {
        setError('El correo electrónico de contacto no es válido');
        setSaving(false);
        return;
      }
      
      // Ensure numeric values are valid
      const sanitizedSettings = {
        ...settings,
        maxTagsPerRating: isNaN(settings.maxTagsPerRating) ? defaultSettings.maxTagsPerRating : settings.maxTagsPerRating,
        minCommentLength: isNaN(settings.minCommentLength) ? defaultSettings.minCommentLength : settings.minCommentLength
      };
      
      // Update settings document
      await updateDoc(doc(db, 'settings', 'system'), {
        ...sanitizedSettings,
        updatedAt: serverTimestamp()
      });
      
      setOriginalSettings(sanitizedSettings);
      setSettings(sanitizedSettings);
      setSuccess('Configuración guardada con éxito');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  // Reset settings to default
  const handleResetToDefault = () => {
    if (confirm('¿Estás seguro de que deseas restablecer toda la configuración a los valores predeterminados? Esta acción no se puede deshacer.')) {
      setSettings(defaultSettings);
    }
  };

  // Discard changes
  const handleDiscardChanges = () => {
    setSettings(originalSettings);
    setError('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Ensure values are not NaN for rendering
  const safeSettings = {
    ...settings,
    maxTagsPerRating: isNaN(settings.maxTagsPerRating) ? '' : settings.maxTagsPerRating,
    minCommentLength: isNaN(settings.minCommentLength) ? '' : settings.minCommentLength
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
        <p className="text-gray-600">Gestiona la configuración global de CuálProfe</p>
      </div>
      
      {/* Notifications */}
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
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Site Settings */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Configuración General</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="maintenanceMode" className="block text-sm font-medium text-gray-700">
                    Modo de mantenimiento
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Cuando está activado, la plataforma no será accesible para los usuarios
                  </p>
                </div>
                <div className="flex h-6 items-center">
                  <input
                    id="maintenanceMode"
                    name="maintenanceMode"
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {settings.maintenanceMode && (
                <div>
                  <label htmlFor="maintenanceMessage" className="block text-sm font-medium text-gray-700 mb-1">
                    Mensaje de mantenimiento
                  </label>
                  <textarea
                    id="maintenanceMessage"
                    name="maintenanceMessage"
                    rows={3}
                    value={settings.maintenanceMessage}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              )}
              
              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico de contacto
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={settings.contactEmail}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Settings */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Configuración de Contenido</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="ratingApprovalRequired" className="block text-sm font-medium text-gray-700">
                    Aprobación de calificaciones
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Requerir aprobación de administrador para nuevas calificaciones
                  </p>
                </div>
                <div className="flex h-6 items-center">
                  <input
                    id="ratingApprovalRequired"
                    name="ratingApprovalRequired"
                    type="checkbox"
                    checked={settings.ratingApprovalRequired}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="maxTagsPerRating" className="block text-sm font-medium text-gray-700 mb-1">
                  Etiquetas máximas por calificación
                </label>
                <input
                  type="number"
                  id="maxTagsPerRating"
                  name="maxTagsPerRating"
                  value={safeSettings.maxTagsPerRating}
                  onChange={handleInputChange}
                  min="1"
                  max="10"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="minCommentLength" className="block text-sm font-medium text-gray-700 mb-1">
                  Longitud mínima de comentario
                </label>
                <input
                  type="number"
                  id="minCommentLength"
                  name="minCommentLength"
                  value={safeSettings.minCommentLength}
                  onChange={handleInputChange}
                  min="0"
                  max="500"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Establece a 0 para permitir comentarios vacíos
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Notification Settings */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Configuración de Notificaciones</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="emailNotificationsEnabled" className="block text-sm font-medium text-gray-700">
                    Notificaciones por correo
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Habilitar todas las notificaciones por correo electrónico
                  </p>
                </div>
                <div className="flex h-6 items-center">
                  <input
                    id="emailNotificationsEnabled"
                    name="emailNotificationsEnabled"
                    type="checkbox"
                    checked={settings.emailNotificationsEnabled}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {settings.emailNotificationsEnabled && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="notifyAdminOnNewRating" className="block text-sm font-medium text-gray-700">
                        Notificar nuevas calificaciones
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Enviar correo a administradores cuando se crea una calificación
                      </p>
                    </div>
                    <div className="flex h-6 items-center">
                      <input
                        id="notifyAdminOnNewRating"
                        name="notifyAdminOnNewRating"
                        type="checkbox"
                        checked={settings.notifyAdminOnNewRating}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="notifyAdminOnNewProfessor" className="block text-sm font-medium text-gray-700">
                        Notificar nuevos profesores
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Enviar correo a administradores cuando se solicita un nuevo profesor
                      </p>
                    </div>
                    <div className="flex h-6 items-center">
                      <input
                        id="notifyAdminOnNewProfessor"
                        name="notifyAdminOnNewProfessor"
                        type="checkbox"
                        checked={settings.notifyAdminOnNewProfessor}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}
              
              {/* Last updated info */}
              {settings.lastUpdated && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Última actualización: {settings.lastUpdated instanceof Date 
                      ? settings.lastUpdated.toLocaleString('es-ES')
                      : settings.lastUpdated?.toDate?.()?.toLocaleString('es-ES') || 'Desconocido'}
                  </p>
                  {settings.updatedBy && (
                    <p className="text-xs text-gray-500">
                      Por: {settings.updatedBy}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={handleResetToDefault}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Restablecer valores predeterminados
        </button>
        
        {hasChanges && (
          <button
            type="button"
            onClick={handleDiscardChanges}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Descartar cambios
          </button>
        )}
        
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={!hasChanges || saving}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
            !hasChanges || saving
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }`}
        >
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </div>
    </div>
  );
}