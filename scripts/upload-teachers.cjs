// upload-teachers.cjs
// Uploads teacher data from CSV to Firestore using Firebase Admin SDK
// Prevents adding duplicates based on 'name' and 'university'

// --- Required Modules ---
const admin = require('firebase-admin'); // Use Admin SDK
const Papa = require('papaparse');      // For parsing CSV
const fs = require('fs');               // For reading files
const path = require('path');           // For creating file paths

// --- Firebase Admin SDK Initialization ---
try {
  // --- IMPORTANT ---
  // 1. Download your Service Account Key JSON file from Firebase Console:
  //    Project Settings > Service accounts > Generate new private key
  // 2. Save the downloaded JSON file (e.g., as 'serviceAccountKey.json')
  //    in your project's ROOT directory (or update the path below).
  // 3. **Add 'serviceAccountKey.json' to your .gitignore file!**
  const serviceAccountPath = path.join(process.cwd(), 'cualprofe-fd43b-firebase-adminsdk-fbsvc-948183a799.json');
  if (!fs.existsSync(serviceAccountPath)) {
      console.error("----------------------------------------------------");
      console.error("ERROR: Service Account Key file not found!");
      console.error(`Expected at: ${serviceAccountPath}`);
      console.error("Please download it from your Firebase project settings.");
      console.error("----------------------------------------------------");
      process.exit(1);
  }
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log("Firebase Admin SDK initialized successfully.");

} catch (error) {
    console.error("----------------------------------------------------");
    console.error("ERROR initializing Firebase Admin SDK:", error.message);
    console.error("Ensure 'serviceAccountKey.json' is correctly placed and valid.");
    console.error("----------------------------------------------------");
    process.exit(1);
}

// Get Firestore instance from Admin SDK
const db = admin.firestore();
// --- End Firebase Initialization ---


/**
 * Upload teachers from a CSV file to Firestore, skipping duplicates.
 * @param {string} csvPath Path to the CSV file (optional, defaults to teachers.csv in root)
 */
async function uploadTeachers(csvPath) {
  try {
    // Determine CSV file path (use argument or default to root)
    const filePath = csvPath || path.join(process.cwd(), 'teachers.csv');
    console.log(`Reading CSV file from: ${filePath}`);

    // Check if CSV file exists
    if (!fs.existsSync(filePath)) {
      console.error('ERROR: CSV file does not exist at path:', filePath);
      process.exit(1);
    }

    // Read CSV file content
    const csvFile = fs.readFileSync(filePath, 'utf8');
    console.log('CSV file read successfully.');

    // Parse CSV data using PapaParse
    Papa.parse(csvFile, {
      header: true,        // Use first row as header keys
      skipEmptyLines: true, // Ignore empty rows
      complete: async (results) => { // Callback when parsing is done
        try {
          const teachersData = results.data;
          console.log(`Parsed ${teachersData.length} rows from CSV.`);
          const teachersCollection = db.collection('teachers'); // Reference to 'teachers' collection

          let successCount = 0;
          let errorCount = 0;
          let skippedCount = 0; // Counter for skipped duplicates

          // Process each row from the CSV
          for (const teacher of teachersData) {
            // Basic Validation: Check if essential fields exist and are not empty
            if (teacher.name && teacher.department && teacher.university) {
              try {
                // --- Check if teacher already exists (based on name and university) ---
                const querySnapshot = await teachersCollection
                  .where('name', '==', teacher.name.trim()) // Trim whitespace just in case
                  .where('university', '==', teacher.university.trim())
                  .limit(1) // Only need to know if one exists
                  .get();

                if (querySnapshot.empty) {
                  // --- Teacher NOT found - Add to Firestore ---
                  await teachersCollection.add({
                    name: teacher.name.trim(),
                    department: teacher.department.trim(),
                    university: teacher.university.trim(),
                    // Add any other fields from your CSV here if needed
                    createdAt: admin.firestore.FieldValue.serverTimestamp(), // Use server timestamp
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                  });
                  successCount++;
                  // Log progress periodically
                  if (successCount % 10 === 0 || successCount === 1) {
                    console.log(`Added ${successCount} new teachers so far...`);
                  }
                } else {
                  // --- Teacher FOUND - Skip adding ---
                  skippedCount++;
                  // Optional: Log skipped teachers if needed (can be noisy)
                  // console.log(`Skipped existing teacher: ${teacher.name} - ${teacher.university}`);
                }
                // --- End Check ---

              } catch (err) {
                // Error during Firestore operation for a specific teacher
                errorCount++;
                console.error(`Error processing teacher ${teacher.name}:`, err.message || err);
              }
            } else {
              // Row failed basic validation (missing essential fields)
              errorCount++; // Count this as an error
              console.warn('Skipped incomplete teacher record (missing name, department, or university):', teacher);
            }
          } // End of loop through teachers

          // Final summary log
          console.log(`----------------------------------------------------`);
          console.log(`Upload complete:`);
          console.log(`  ${successCount} teachers added successfully.`);
          console.log(`  ${skippedCount} duplicates skipped.`);
          console.log(`  ${errorCount} errors encountered.`);
          console.log(`----------------------------------------------------`);
          process.exit(0); // Exit script successfully

        } catch (error) {
          // Error within the 'complete' callback processing loop
          console.error('Error processing parsed teachers:', error);
          process.exit(1);
        }
      },
      error: (error) => { // Callback if PapaParse encounters an error
        console.error('Error parsing CSV:', error);
        process.exit(1);
      }
    }); // End of Papa.parse

  } catch (error) {
    // Catch-all for errors before parsing starts (e.g., reading file)
    console.error('Unexpected error during script execution:', error);
    process.exit(1);
  }
} // End of uploadTeachers function

// --- Script Execution ---
// Get optional CSV path from command line arguments (e.g., node script.cjs path/to/my.csv)
const csvPath = process.argv[2];

// Run the main upload function
uploadTeachers(csvPath);
// --- End Script Execution ---