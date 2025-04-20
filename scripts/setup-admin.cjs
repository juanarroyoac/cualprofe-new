// scripts/setup-admin.cjs - Secure script to promote specific users to admin
require('dotenv').config({ path: '.env.local' });
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const readline = require('readline');

// Verify required arguments
if (process.argv.length < 3) {
  console.error('❌ Error: Email address is required!');
  console.error('Usage: npm run setup-admin user@example.com');
  process.exit(1);
}

// Initialize Firebase Admin with service account
const serviceAccount = require('../cualprofe-fd43b-firebase-adminsdk-fbsvc-948183a799.json');

const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Create readline interface for confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function setupAdminUser() {
  try {
    const targetEmail = process.argv[2];
    console.log(`🔍 Looking for user with email: ${targetEmail}`);
    
    // Find user by email (exact match only)
    const targetUserQuery = await db.collection('users')
      .where('email', '==', targetEmail)
      .limit(1)
      .get();
      
    if (targetUserQuery.empty) {
      console.error(`❌ No user found with email: ${targetEmail}`);
      return;
    }
    
    const userToPromote = targetUserQuery.docs[0];
    const userData = userToPromote.data();
    
    // Double-check with admin
    rl.question(`⚠️ Are you sure you want to promote ${userData.email} (${userToPromote.id}) to admin? (yes/no): `, async (answer) => {
      if (answer.toLowerCase() !== 'yes') {
        console.log('❌ Operation cancelled.');
        rl.close();
        return;
      }
      
      try {
        // Log the promotion attempt for audit
        const adminActionRef = db.collection('adminActions').doc();
        await adminActionRef.set({
          action: 'promote_to_admin',
          targetUserId: userToPromote.id,
          targetEmail: userData.email,
          timestamp: new Date(),
          initiatedBy: 'cli-tool'
        });
        
        // Promote to admin
        await db.collection('users').doc(userToPromote.id).update({
          role: 'admin',
          updatedAt: new Date(),
          isAdmin: true
        });
        
        console.log(`✅ Successfully promoted user to admin role!`);
        console.log(`📝 ${userData.email} can now access the admin panel at /admin`);
      } catch (error) {
        console.error('❌ Error updating user:', error);
      } finally {
        rl.close();
      }
    });
  } catch (error) {
    console.error('❌ Error in admin setup process:', error);
    rl.close();
  }
}

// Run the function
console.log('🚀 Starting secure admin setup...');
setupAdminUser();