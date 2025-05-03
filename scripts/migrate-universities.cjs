// migrate-universities.cjs
// Migrates university data to the new system
// Usage: node migrate-universities.cjs [--dry-run]

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

if (DRY_RUN) {
  console.log('\x1b[33m%s\x1b[0m', '🔍 Running in DRY RUN mode - no changes will be made');
}

// Initialize Firebase Admin
try {
  const serviceAccountPath = path.join(process.cwd(), 'cualprofe-fd43b-firebase-adminsdk-fbsvc-948183a799.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Error: Service account file not found at:', serviceAccountPath);
    process.exit(1);
  }
  
  const serviceAccount = require(serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log('\x1b[32m%s\x1b[0m', '✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Error initializing Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();
const BATCH_SIZE = 450; // Firestore batch limit is 500, keeping margin for safety

async function createBackup() {
  console.log('\x1b[36m%s\x1b[0m', '📦 Creating data backup...');
  
  try {
    // Create backups directory if it doesn't exist
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    // Backup timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Backup teachers collection (only university fields)
    const teachersSnapshot = await db.collection('teachers').get();
    const teachersData = [];
    teachersSnapshot.forEach(doc => {
      const data = doc.data();
      teachersData.push({
        id: doc.id,
        university: data.university || null
      });
    });
    
    // Backup universities collection
    const universitiesSnapshot = await db.collection('universities').get();
    const universitiesData = [];
    universitiesSnapshot.forEach(doc => {
      universitiesData.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Save to backup files
    const backupData = {
      timestamp: new Date().toISOString(),
      teachers: teachersData,
      universities: universitiesData
    };
    
    const backupFilePath = path.join(backupDir, `universities-backup-${timestamp}.json`);
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));
    
    console.log('\x1b[32m%s\x1b[0m', `✅ Backup created at: ${backupFilePath}`);
    console.log(`   ${teachersData.length} teachers and ${universitiesData.length} universities saved`);
    
    return backupFilePath;
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Error creating backup:', error.message);
    throw error;
  }
}

async function migrateUniversitySystem() {
  console.log('\x1b[35m%s\x1b[0m', '🔄 Starting university system migration...');
  
  try {
    // Step 1: Create a backup of existing data
    if (!DRY_RUN) {
      await createBackup();
    } else {
      console.log('\x1b[33m%s\x1b[0m', '🔍 DRY RUN: Skipping backup creation');
    }
    
    // Step 2: Get all universities from teachers collection
    console.log('\x1b[36m%s\x1b[0m', '🔍 Analyzing teacher records for universities...');
    const teachersSnapshot = await db.collection('teachers').get();
    const universities = new Map();
    
    teachersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.university) {
        const uniName = data.university.trim();
        universities.set(uniName, {
          name: uniName,
          count: (universities.get(uniName)?.count || 0) + 1
        });
      }
    });
    
    console.log(`📊 Found ${universities.size} unique universities from ${teachersSnapshot.size} teacher records`);
    
    // Step 3: Check for existing 'universities' collection
    console.log('\x1b[36m%s\x1b[0m', '🔍 Checking existing university data...');
    const oldUniversitiesSnapshot = await db.collection('universities').get();
    console.log(`📊 Found ${oldUniversitiesSnapshot.size} universities in old 'universities' collection`);
    
    // Map old university data by name for easy lookup
    const oldUniversitiesMap = new Map();
    oldUniversitiesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.name) {
        oldUniversitiesMap.set(data.name, {
          id: doc.id,
          ...data
        });
      }
    });
    
    // Step 4: Check existing 'universitySettings' collection
    const settingsSnapshot = await db.collection('universitySettings').get();
    console.log(`📊 Found ${settingsSnapshot.size} existing university settings`);
    
    // Map existing settings by university name
    const existingSettingsMap = new Map();
    settingsSnapshot.forEach(doc => {
      existingSettingsMap.set(doc.id, true);
    });
    
    // Step 5: Create or update university settings
    console.log('\x1b[36m%s\x1b[0m', '📝 Preparing university settings...');
    
    // Count statistics
    let toCreate = 0;
    let alreadyExists = 0;
    
    // Process in batches to respect Firestore limits
    const universityEntries = Array.from(universities.entries());
    const batches = [];
    let currentBatch = db.batch();
    let operationsCount = 0;
    
    for (const [uniName, uniData] of universityEntries) {
      // Check if settings already exist for this university
      if (existingSettingsMap.has(uniName)) {
        alreadyExists++;
        continue;
      }
      
      // Look for matching university in old collection for settings
      let abbreviation = '';
      let isActive = true;
      
      const oldUniData = oldUniversitiesMap.get(uniName);
      if (oldUniData) {
        abbreviation = oldUniData.abbreviation || '';
        isActive = oldUniData.isActive !== false;
      }
      
      // Create new settings document
      console.log(`  → Creating settings for "${uniName}" (${uniData.count} professors)`);
      
      if (!DRY_RUN) {
        const settingRef = db.collection('universitySettings').doc(uniName);
        currentBatch.set(settingRef, {
          name: uniName,
          abbreviation: abbreviation,
          isActive: isActive,
          migratedAt: admin.firestore.FieldValue.serverTimestamp(),
          professorsCount: uniData.count
        });
        
        operationsCount++;
        toCreate++;
        
        // If batch is full, add it to batches array and create a new one
        if (operationsCount >= BATCH_SIZE) {
          batches.push(currentBatch);
          currentBatch = db.batch();
          operationsCount = 0;
          console.log(`  → Batch full, creating new batch (total: ${batches.length + 1})`);
        }
      } else {
        toCreate++;
      }
    }
    
    // Add the last batch if it has operations
    if (operationsCount > 0) {
      batches.push(currentBatch);
    }
    
    // Commit all batches if not in dry run mode
    if (!DRY_RUN && batches.length > 0) {
      console.log('\x1b[36m%s\x1b[0m', `🔥 Committing ${batches.length} batches to Firestore...`);
      
      for (let i = 0; i < batches.length; i++) {
        console.log(`  → Committing batch ${i + 1}/${batches.length}...`);
        await batches[i].commit();
        // Small delay to avoid overwhelming Firestore
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // Summary
    console.log('\x1b[32m%s\x1b[0m', '✅ University system migration completed successfully!');
    console.log('\x1b[36m%s\x1b[0m', '📊 Migration summary:');
    console.log(`  → ${universities.size} unique universities found`);
    console.log(`  → ${alreadyExists} universities already had settings`);
    console.log(`  → ${toCreate} ${DRY_RUN ? 'would be' : 'were'} created`);
    
    if (DRY_RUN) {
      console.log('\x1b[33m%s\x1b[0m', '🔍 This was a dry run! No changes were made to the database.');
      console.log('   Run without --dry-run to apply changes');
    }
    
    return {
      totalUniversities: universities.size,
      created: toCreate,
      alreadyExists
    };
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
migrateUniversitySystem()
  .then(() => {
    console.log('\x1b[36m%s\x1b[0m', '👋 Migration process complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('\x1b[31m%s\x1b[0m', '❌ Migration failed with error:', error);
    process.exit(1);
  });