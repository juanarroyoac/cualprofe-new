// app/api/admin/stats/route.js
import { db } from '@/lib/server/firebase-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Use admin SDK to get collection counts
    const [
      professorsSnapshot,
      usersSnapshot, 
      ratingsSnapshot,
      pendingSubmissionsSnapshot
    ] = await Promise.all([
      db.collection('teachers').get(),
      db.collection('users').get(),
      db.collection('ratings').get(),
      db.collection('professorSubmissions').where('status', '==', 'pending').get()
    ]);
    
    return NextResponse.json({
      totalProfessors: professorsSnapshot.size,
      totalUsers: usersSnapshot.size,
      totalRatings: ratingsSnapshot.size,
      pendingSubmissions: pendingSubmissionsSnapshot.size
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Error fetching stats' }, { status: 500 });
  }
}