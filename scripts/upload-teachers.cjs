// upload-teachers.js
// A pure JavaScript solution for uploading teacher data to Firebase

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');
const Papa = require('papaparse');
const fs = require('fs');
const path = require('path');

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBDMJUGfwF2b274LVEUiJ1d-sOoUHApHLU",
    authDomain: "cualprofe-fd43b.firebaseapp.com",
    projectId: "cualprofe-fd43b",
    storageBucket: "cualprofe-fd43b.firebasestorage.app",
    messagingSenderId: "115544240669",
    appId: "1:115544240669:web:2493a15d8fa671ba888cf4",
    measurementId: "G-45XDCFVZ4Q"
};

/**
 * Upload teachers from a CSV file to Firestore
 * @param {string} csvPath Path to the CSV file (optional, defaults to teachers.csv)
 */
async function uploadTeachers(csvPath) {
  try {
    // Use provided path or default to project root
    const filePath = csvPath || path.join(process.cwd(), 'teachers.csv');
    console.log('Reading CSV file from:', filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('CSV file does not exist at path:', filePath);
      process.exit(1);
    }

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Read CSV file
    const csvFile = fs.readFileSync(filePath, 'utf8');
    console.log('CSV file read successfully');
    
    // Parse CSV data
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          console.log('Parsed CSV rows:', results.data.length);
          const teachersCollection = collection(db, 'teachers');
          
          let successCount = 0;
          let errorCount = 0;
          
          for (const teacher of results.data) {
            // Ensure the teacher object is valid before adding
            if (teacher.name && teacher.school && teacher.university) {
              try {
                await addDoc(teachersCollection, {
                  ...teacher,
                  createdAt: new Date(),
                  updatedAt: new Date()
                });
                successCount++;
                
                // Log progress
                if (successCount % 10 === 0 || successCount === 1) {
                  console.log(`Added ${successCount} teachers so far...`);
                }
              } catch (err) {
                errorCount++;
                console.error(`Error adding teacher ${teacher.name}:`, err);
              }
            } else {
              errorCount++;
              console.warn('Skipped incomplete teacher record:', teacher);
            }
          }
          
          console.log(`Upload complete: ${successCount} teachers added successfully, ${errorCount} errors`);
          process.exit(0);
        } catch (error) {
          console.error('Error processing teachers:', error);
          process.exit(1);
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Get optional CSV path from command line arguments
const csvPath = process.argv[2];

// Run the upload function
uploadTeachers(csvPath);