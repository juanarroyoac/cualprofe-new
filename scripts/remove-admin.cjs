// scripts/remove-admin.cjs - Script to remove admin privileges
require('dotenv').config({ path: '.env.local' });
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const readline = require('readline');

// Verify required arguments
if (process.argv.length < 3) {
  console.error('❌ Error: Email address is required!');
  console.error('Usage: npm run remove-admin user@example.com');
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

async function removeAdminPrivileges() {
  try {
    const targetEmail = process.argv[2];
    console.log(`🔍 Looking for admin user with email: ${targetEmail}`);
    
    // Find user by email (exact match only)
    const targetUserQuery = await db.collection('users')
      .where('email', '==', targetEmail)
      .limit(1)
      .get();
      
    if (targetUserQuery.empty) {
      console.error(`❌ No user found with email: ${targetEmail}`);
      rl.close();
      return;
    }
    
    const userToModify = targetUserQuery.docs[0];
    const userData = userToModify.data();
    
    if (userData.role !== 'admin' && !userData.isAdmin) {
      console.error(`❌ User ${targetEmail} is not an admin.`);
      rl.close();
      return;
    }
    
    // Double-check with admin
    rl.question(`⚠️ Are you sure you want to remove admin privileges from ${userData.email} (${userToModify.id})? (yes/no): `, async (answer) => {
      if (answer.toLowerCase() !== 'yes') {
        console.log('❌ Operation cancelled.');
        rl.close();
        return;
      }
      
      try {
        // Log the demotion attempt for audit
        const adminActionRef = db.collection('adminActions').doc();
        await adminActionRef.set({
          action: 'remove_admin',
          targetUserId: userToModify.id,
          targetEmail: userData.email,
          timestamp: new Date(),
          initiatedBy: 'cli-tool'
        });
        
        // Remove admin privileges
        await db.collection('users').doc(userToModify.id).update({
          role: 'user',
          updatedAt: new Date(),
          isAdmin: false
        });
        
        console.log(`✅ Successfully removed admin privileges!`);
        console.log(`📝 ${userData.email} no longer has admin access.`);
      } catch (error) {
        console.error('❌ Error updating user:', error);
      } finally {
        rl.close();
      }
    });
  } catch (error) {
    console.error('❌ Error in admin removal process:', error);
    rl.close();
  }
}

// Run the function
console.log('🚀 Starting admin privilege removal...');
removeAdminPrivileges();