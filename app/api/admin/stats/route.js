// app/api/admin/stats/route.js
import { adminFirestore as db } from '@/lib/server/firebase-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Count total professors
    const professorsSnapshot = await db.collection('teachers').get();
    const totalProfessors = professorsSnapshot.size;
    
    // Count total users
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;
    
    // Count total ratings
    const ratingsSnapshot = await db.collection('ratings').get();
    const totalRatings = ratingsSnapshot.size;
    
    // Count pending submissions
    const pendingSubmissionsQuery = db.collection('professorSubmissions')
      .where('status', '==', 'pending');
    const pendingSubmissionsSnapshot = await pendingSubmissionsQuery.get();
    const pendingSubmissions = pendingSubmissionsSnapshot.size;
    
    return NextResponse.json({
      totalProfessors,
      totalUsers,
      totalRatings,
      pendingSubmissions
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Error fetching stats' }, { status: 500 });
  }
}