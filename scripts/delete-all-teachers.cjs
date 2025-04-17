// delete-all-teachers.cjs
const admin = require('firebase-admin');
const path = require('path');

// --- IMPORTANT ---
// Make sure this points to your actual service account key file
const serviceAccount = require(path.join(process.cwd(), 'cualprofe-fd43b-firebase-adminsdk-fbsvc-948183a799.json')); // Assumes key is in root

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const teachersCollection = db.collection('teachers');

async function deleteAllDocuments() {
  console.log("Fetching all documents from 'teachers' collection...");
  const snapshot = await teachersCollection.limit(500).get(); // Get up to 500 docs at a time

  if (snapshot.empty) {
    console.log("No documents found to delete.");
    return 0;
  }

  console.log(`Found ${snapshot.size} documents to delete in this batch...`);
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`Deleted ${snapshot.size} documents.`);

  // Recursively call delete if there might be more documents
  if (snapshot.size === 500) {
    // There might be more, process next batch
    return snapshot.size + await deleteAllDocuments();
  } else {
    return snapshot.size; // Return count for this final batch
  }
}

async function runDeletion() {
    try {
        console.log("Starting deletion process...");
        const totalDeleted = await deleteAllDocuments();
        console.log(`----------------------------------------------------`);
        console.log(`Finished: Deleted a total of ${totalDeleted} documents.`);
        console.log(`----------------------------------------------------`);
        process.exit(0);
    } catch (error) {
        console.error("Error deleting documents:", error);
        process.exit(1);
    }
}

// --- DANGER ZONE ---
// --- Uncomment the line below ONLY when you are absolutely sure ---
// --- you want to delete ALL documents in the 'teachers' collection ---
// runDeletion();
// --- Make sure to comment it out again after running ---

console.log("Deletion script ready. Uncomment the 'runDeletion();' line at the bottom of the script to execute.");
console.log("WARNING: This will permanently delete all documents in the 'teachers' collection.");