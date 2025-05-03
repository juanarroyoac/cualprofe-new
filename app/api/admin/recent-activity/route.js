// app/api/admin/recent-activity/route.js
import { adminFirestore as db } from '@/lib/server/firebase-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get recent ratings
    const recentRatingsSnapshot = await db.collection('ratings')
      .orderBy('createdAt', 'desc')
      .limit(10) // Increased limit to ensure we get enough valid ratings
      .get();
    
    const recentRatings = recentRatingsSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'rating',
          createdAt: data.createdAt,
          professorId: data.professorId,
          ...data
        };
      })
      .filter(rating => rating.professorId && rating.professorId !== 'undefined');
    
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
        const combined = [...recentRatings, ...recentSubmissions]
          .sort((a, b) => b.createdAt - a.createdAt);
    
        return NextResponse.json(combined);
      } catch (error) {
        console.error('Error fetching recent activity:', error);
        return NextResponse.json({ error: 'Failed to fetch recent activity' }, { status: 500 });
      }
    }