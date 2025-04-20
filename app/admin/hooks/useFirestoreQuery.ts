// app/admin/hooks/useFirestoreQuery.ts
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  limit, 
  where,
  startAfter as fsStartAfter,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Interface for useFirestoreQuery options
 */
interface FirestoreQueryOptions {
  collectionName: string;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  limitCount?: number;
  whereConditions?: {
    field: string;
    operator: string;
    value: any;
  }[];
}

/**
 * Custom hook for Firestore queries with pagination
 */
export function useFirestoreQuery(options: FirestoreQueryOptions) {
  const {
    collectionName,
    orderByField = 'createdAt',
    orderDirection = 'desc',
    limitCount = 20,
    whereConditions = []
  } = options;

  const [data, setData] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Build query constraints
        const queryConstraints: QueryConstraint[] = [];
        
        // Add where conditions if any
        if (whereConditions.length > 0) {
          whereConditions.forEach(condition => {
            queryConstraints.push(where(condition.field, condition.operator as any, condition.value));
          });
        }
        
        // Add ordering
        queryConstraints.push(orderBy(orderByField, orderDirection));
        
        // Add limit
        queryConstraints.push(limit(limitCount + 1));
        
        // Create query
        const q = query(collection(db, collectionName), ...queryConstraints);
        
        // Get documents
        const querySnapshot = await getDocs(q);
        
        // Check if there are more results
        const hasMoreResults = querySnapshot.docs.length > limitCount;
        setHasMore(hasMoreResults);
        
        // Save last document for pagination
        const lastDoc = hasMoreResults 
          ? querySnapshot.docs[limitCount - 1] 
          : querySnapshot.docs[querySnapshot.docs.length - 1];
          
        if (lastDoc) {
          setLastVisible(lastDoc);
        }
        
        // Process results (excluding the extra one)
        const docs = querySnapshot.docs.slice(0, limitCount).map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setData(docs);
        setError(null);
      } catch (err) {
        console.error(`Error fetching data from ${collectionName}:`, err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [collectionName, JSON.stringify(whereConditions), orderByField, orderDirection, limitCount]);

  // Load more data
  const loadMore = async () => {
    if (!hasMore || !lastVisible) return;
    
    try {
      setLoading(true);
      
      // Build query constraints
      const queryConstraints: QueryConstraint[] = [];
      
      // Add where conditions if any
      if (whereConditions.length > 0) {
        whereConditions.forEach(condition => {
          queryConstraints.push(where(condition.field, condition.operator as any, condition.value));
        });
      }
      
      // Add ordering
      queryConstraints.push(orderBy(orderByField, orderDirection));
      
      // Add startAfter for pagination
      queryConstraints.push(fsStartAfter(lastVisible));
      
      // Add limit
      queryConstraints.push(limit(limitCount + 1));
      
      // Create query
      const q = query(collection(db, collectionName), ...queryConstraints);
      
      // Get documents
      const querySnapshot = await getDocs(q);
      
      // Check if there are more results
      const hasMoreResults = querySnapshot.docs.length > limitCount;
      setHasMore(hasMoreResults);
      
      // Save last document for pagination
      const lastDoc = hasMoreResults 
        ? querySnapshot.docs[limitCount - 1] 
        : querySnapshot.docs[querySnapshot.docs.length - 1];
        
      if (lastDoc) {
        setLastVisible(lastDoc);
      }
      
      // Process results (excluding the extra one)
      const docs = querySnapshot.docs.slice(0, limitCount).map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Append new data to existing data
      setData(prevData => [...prevData, ...docs]);
      
    } catch (err) {
      console.error(`Error loading more data from ${collectionName}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const refresh = async () => {
    try {
      setLoading(true);
      
      // Build query constraints
      const queryConstraints: QueryConstraint[] = [];
      
      // Add where conditions if any
      if (whereConditions.length > 0) {
        whereConditions.forEach(condition => {
          queryConstraints.push(where(condition.field, condition.operator as any, condition.value));
        });
      }
      
      // Add ordering
      queryConstraints.push(orderBy(orderByField, orderDirection));
      
      // Add limit
      queryConstraints.push(limit(limitCount + 1));
      
      // Create query
      const q = query(collection(db, collectionName), ...queryConstraints);
      
      // Get documents
      const querySnapshot = await getDocs(q);
      
      // Check if there are more results
      const hasMoreResults = querySnapshot.docs.length > limitCount;
      setHasMore(hasMoreResults);
      
      // Save last document for pagination
      const lastDoc = hasMoreResults 
        ? querySnapshot.docs[limitCount - 1] 
        : querySnapshot.docs[querySnapshot.docs.length - 1];
        
      if (lastDoc) {
        setLastVisible(lastDoc);
      }
      
      // Process results (excluding the extra one)
      const docs = querySnapshot.docs.slice(0, limitCount).map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setData(docs);
      setError(null);
    } catch (err) {
      console.error(`Error refreshing data from ${collectionName}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  };
}