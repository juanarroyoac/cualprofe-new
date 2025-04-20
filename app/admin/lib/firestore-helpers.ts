// app/admin/lib/firestore-helpers.ts
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    getDoc, 
    doc, 
    updateDoc, 
    deleteDoc, 
    setDoc, 
    addDoc, 
    serverTimestamp, 
    writeBatch,
    orderBy,
    limit,
    startAfter,
    Timestamp,
    DocumentData,
    QueryDocumentSnapshot,
    DocumentReference
  } from 'firebase/firestore';
  import { db, auth } from '@/lib/firebase';
  
  // Base function to get a paginated collection
  export async function getPaginatedCollection(
    collectionName: string, 
    orderByField: string = 'createdAt', 
    orderDirection: 'asc' | 'desc' = 'desc',
    pageSize: number = 10,
    startAfterDoc: QueryDocumentSnapshot<DocumentData> | null = null,
    whereConditions: Array<{field: string, operator: string, value: any}> = []
  ) {
    try {
      const collectionRef = collection(db, collectionName);
      
      // Start building the query
      let queryConstraints = [];
      
      // Add where conditions if any
      if (whereConditions.length > 0) {
        whereConditions.forEach(condition => {
          queryConstraints.push(where(condition.field, condition.operator as any, condition.value));
        });
      }
      
      // Add ordering
      queryConstraints.push(orderBy(orderByField, orderDirection));
      
      // Add pagination
      queryConstraints.push(limit(pageSize));
      
      // Apply startAfter if provided
      if (startAfterDoc) {
        queryConstraints.push(startAfter(startAfterDoc));
      }
      
      // Create query with all constraints
      const q = query(collectionRef, ...queryConstraints);
      
      const querySnapshot = await getDocs(q);
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return {
        items,
        lastVisible
      };
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error);
      throw error;
    }
  }
  
  // Get a single document by ID
  export async function getDocumentById(collectionName: string, docId: string) {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error(`Error fetching document from ${collectionName}:`, error);
      throw error;
    }
  }
  
  // Update a document
  export async function updateDocument(collectionName: string, docId: string, data: any) {
    try {
      const docRef = doc(db, collectionName, docId);
      
      // Add audit fields
      const updateData = {
        ...data,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.uid
      };
      
      await updateDoc(docRef, updateData);
      return true;
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }
  
  // Create a new document
  export async function createDocument(collectionName: string, data: any, customId?: string) {
    try {
      // Add audit fields
      const createData = {
        ...data,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.uid
      };
      
      let docRef;
      if (customId) {
        docRef = doc(db, collectionName, customId);
        await setDoc(docRef, createData);
      } else {
        docRef = await addDoc(collection(db, collectionName), createData);
      }
      
      return docRef.id;
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw error;
    }
  }
  
  // Delete a document
  export async function deleteDocument(collectionName: string, docId: string) {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  }
  
  // Batch operations
  export async function batchOperation(operations: Array<{
    type: 'set' | 'update' | 'delete',
    collection: string,
    id: string,
    data?: any
  }>) {
    const batch = writeBatch(db);
    
    operations.forEach(operation => {
      const docRef = doc(db, operation.collection, operation.id);
      
      switch (operation.type) {
        case 'set':
          batch.set(docRef, {
            ...operation.data,
            updatedAt: serverTimestamp(),
            updatedBy: auth.currentUser?.uid
          });
          break;
        case 'update':
          batch.update(docRef, {
            ...operation.data,
            updatedAt: serverTimestamp(),
            updatedBy: auth.currentUser?.uid
          });
          break;
        case 'delete':
          batch.delete(docRef);
          break;
      }
    });
    
    await batch.commit();
    return true;
  }
  
  // Helper for approval workflow
  export async function approveTeacherSubmission(submissionId: string) {
    try {
      const submissionRef = doc(db, 'professorSubmissions', submissionId);
      const submissionSnap = await getDoc(submissionRef);
      
      if (!submissionSnap.exists()) {
        throw new Error('Submission not found');
      }
      
      const submission = submissionSnap.data();
      
      // Create new teacher
      const teacherRef = doc(collection(db, 'teachers'));
      await setDoc(teacherRef, {
        name: submission.name,
        university: submission.university,
        department: submission.department,
        createdAt: serverTimestamp(),
        approvedBy: auth.currentUser?.uid,
        submissionId: submissionId
      });
      
      // Update submission status
      await updateDoc(submissionRef, {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: auth.currentUser?.uid,
        teacherId: teacherRef.id
      });
      
      return teacherRef.id;
    } catch (error) {
      console.error('Error approving teacher submission:', error);
      throw error;
    }
  }
  
  // Get dashboard stats
  export async function getDashboardStats() {
    try {
      // Count total professors
      const professorsSnapshot = await getDocs(collection(db, 'teachers'));
      const totalProfessors = professorsSnapshot.size;
      
      // Count total users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;
      
      // Count total ratings
      const ratingsSnapshot = await getDocs(collection(db, 'ratings'));
      const totalRatings = ratingsSnapshot.size;
      
      // Count pending submissions
      const pendingSubmissionsQuery = query(
        collection(db, 'professorSubmissions'),
        where('status', '==', 'pending')
      );
      const pendingSubmissionsSnapshot = await getDocs(pendingSubmissionsQuery);
      const pendingSubmissions = pendingSubmissionsSnapshot.size;
      
      return {
        totalProfessors,
        totalUsers,
        totalRatings,
        pendingSubmissions
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }