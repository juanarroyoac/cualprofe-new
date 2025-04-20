// app/api/admin/recent-activity/route.js
import { db } from '@/lib/server/firebase-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get recent ratings
    const recentRatingsSnapshot = await db.collection('ratings')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    const recentRatings = recentRatingsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: 'rating',
        createdAt: data.createdAt,
        professorId: data.professorId,
        ...data
      };
    });
    
    // Get recent submissions
    const recentSubmissionsSnapshot = await db.collection('professorSubmissions')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    const recentSubmissions = recentSubmissionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: 'submission',
        createdAt: data.createdAt,
        name: data.name,
        ...data
      };
    });
    
    // Combine and sort
    const combinedActivity = [...recentRatings, ...recentSubmissions]
      .filter(item => item.createdAt)
      .sort((a, b) => {
        const dateA = typeof a.createdAt.toDate === 'function' ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = typeof b.createdAt.toDate === 'function' ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
    
    return NextResponse.json(combinedActivity);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return NextResponse.json({ error: 'Error fetching activity' }, { status: 500 });
  }
}