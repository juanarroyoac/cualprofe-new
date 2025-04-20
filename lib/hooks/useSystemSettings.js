// lib/hooks/useSystemSettings.js
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const defaultSettings = {
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

export function useSystemSettings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const settingsDoc = await getDoc(doc(db, 'settings', 'system'));
        
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data());
        } else {
          setSettings(defaultSettings);
        }
      } catch (err) {
        console.error('Error fetching system settings:', err);
        setError(err);
        setSettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading, error };
}