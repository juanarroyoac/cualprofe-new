import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { normalizeText } from '@/lib/utils/textNormalization';

interface Teacher {
  id: string;
  name: string;
  university: string;
  department: string;
  normalizedName: string;
}

export function useTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const teachersCollection = collection(db, 'teachers');
        const teachersSnapshot = await getDocs(teachersCollection);
        const teachersList = teachersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            university: data.university || '',
            department: data.department || '',
            normalizedName: normalizeText(data.name || '')
          } as Teacher;
        });

        setTeachers(teachersList);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error fetching teachers'));
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  return { teachers, loading, error };
} 