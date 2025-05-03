import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Define the University interface
export interface University {
  id: string;
  name: string;
  abbreviation?: string;
  isActive?: boolean;
  [key: string]: any;
}

export function useUniversities() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUniversities() {
      try {
        setLoading(true);
        console.log('Fetching universities from Firestore...');
        
        // Query the universitySettings collection, which is what the admin panel uses
        const settingsRef = collection(db, 'universitySettings');
        console.log('Collection reference created:', settingsRef);
        
        // Only get active universities by default
        const settingsQuery = query(settingsRef, where('isActive', '!=', false));
        const snapshot = await getDocs(settingsQuery);
        
        console.log('Query result:', snapshot);
        console.log('Documents found:', snapshot.docs.length);
        
        if (snapshot.empty) {
          console.log('No universities found in the database');
          setUniversities([]);
        } else {
          const universitiesList = snapshot.docs.map(doc => {
            const data = doc.data();
            console.log('Document ID:', doc.id, 'Data:', data);
            return {
              id: doc.id,
              ...data,
              name: data.name || doc.id
            };
          }) as University[];
          
          // Sort alphabetically by name
          universitiesList.sort((a, b) => 
            (a.name || '').localeCompare(b.name || '')
          );
          
          console.log('Universities fetched:', universitiesList);
          setUniversities(universitiesList);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching universities:', err);
        setError('Error al cargar las universidades. Por favor, inténtalo de nuevo.');
        setUniversities([]);
      } finally {
        setLoading(false);
      }
    }

    fetchUniversities();
  }, []);

  return { universities, loading, error };
}