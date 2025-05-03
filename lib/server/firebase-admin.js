// lib/server/firebase-admin.js
import admin from 'firebase-admin';

let firebaseAdmin;

function getFirebaseAdmin() {
  if (!firebaseAdmin) {
    try {
      // Check if already initialized
      if (admin.apps.length === 0) {
        // Hardcoded credentials from the JSON file
        const serviceAccount = {
          "type": "service_account",
          "project_id": "cualprofe-fd43b",
          "private_key_id": "948183a799989c924595d5efe63f009c1f53f4ec",
          "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC9Ej5CeitWFLLy\nSW+OdONamQJe9E1aCNKXFllU49Yl+7+j0qjR5ekNzgyNgD/V4PFom656+JQORm3J\n/MGcm7pZz41LEYpMrcAaORey4VTYscAIkz5B0i4FliCgymo5Y8yf1GtAhfl+n6gE\nZzbuvBdiIBxrnTWXUTGkS6vMhoeIssmw9aI9ooStsAhsq+y1T0ae1vt9Y3Ay1W/W\nJPqNBnrLkIxSVJ+aIxvzK356KUk6iWa64xdGRfkKj1bOqqOzMwouoe+HHn+p8DrE\npdDaETIVmzvsoPervgZDgfgT/Bwr52ELuD89qkYjsRV0oLRPoRobpdxP+pUsB0QT\nZIHm718XAgMBAAECggEATF/1sXHbVqL25EOA4klaW8sKN6Q1KOT+eJTJEi8U3vQS\nZlFe66cVXQO6c2B2qOV8bxbQRRFr8VZG3DyTUzle7g+W0lesB6x6OL2OUq6OURiA\na5ZbJEiMWapa1MjfXv5u9rNefcqAzcMdomW1PXvScEtrX5c6Qj1Escr1g6FmV3O6\n+TNRQxAMXiAyRvU8AQQVaAfh4QpV0yx/tNbORE4B0IU3WpegJ0Xk4rEQEgveLLRV\nqlZb6JKtjPS2mC3WlMbyBnCqhSEdPPlGGRcYEb2eiILuzOJaNRCLKsb4o6B/lq3M\nN1d2WwLWHwfNBo/fwKzt+xtMCGKrFu/WNSPf6h1aaQKBgQDvzTb+dmUsL3tv7rid\nj6Pbfk/PvX33XnICiCzrX2dSD8c6KiU3udzcgCG3EzgEC1LSfU37ZDjiv7e0jw0e\nQy/vuHyjfeBdpVAK9lVGN2Z1XOzwrRe+l9LFO4GLerL4A4fnu80cdOeXagpneQRT\nYuINtq+X9VWdWvnVd6CDe1WlnwKBgQDJ18U1/tHvsTHrAoWWnbU4RWvZW1Dug5eN\n9QEiM/UxP2yp61niR8+nIXtE1gmS4yw1jfvcR2gpyS8LslJzPMZuOX0MWeT58JCq\nZjW5lwW6zPbOfelD1idovjfFg4+EjAnTyKbzUa1EVPA0jXSaSD4VEqmQFo98e9rw\nQoUaqWsjiQKBgQCoUpHRl+V4WHP6o8RuxI6t2UHIfihXZLH+WPu+057AmVas2zx4\nmzwOgtonmZPuMsyV92KvnS/Y6d3XHbqFjX+ucv75+7drxEglCbfdq7F9nBas8bMD\nE6rcyuIpt5y8Pi49WTOmT+DoBYT8EJQavAQUwDENJyZLZ7qKPogrAn2h3QKBgQCs\ntF8eEGd5fFiGCaZcdZz2BRB+7s+VBivLX3QU2/hUpzxHOAW0xFU9YDylba7LbG4L\ndO2oUcEi3+3NSEucJshyz+Xbh5+Q7PIbm1Ek98ADUhVsIfhR/w/BY+E8s5E9jMVr\n3Shc0eo7qaHOlarLyDy2sz06+NLVZPS013YklgoCYQKBgBaYO0cVI/53Z+vMCvjk\nE62O7Um5BWps3yTJ/9KQpjChsk7Fd70NzNRcqeiuoRtntkAKnOnvchoUe5G+JBS9\naSeRRLMz1SgjtusJGof+piDPU80bhUv4Twwk/EuuRZSBfFgZEN7r/k9+p8IKr26B\nrN/IzOAUKV2bNeEebf04rSks\n-----END PRIVATE KEY-----\n",
          "client_email": "firebase-adminsdk-fbsvc@cualprofe-fd43b.iam.gserviceaccount.com",
          "client_id": "106535487752735888542",
          "auth_uri": "https://accounts.google.com/o/oauth2/auth",
          "token_uri": "https://oauth2.googleapis.com/token",
          "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
          "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40cualprofe-fd43b.iam.gserviceaccount.com",
          "universe_domain": "googleapis.com"
        };
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        
        console.log('Firebase Admin initialized successfully with hardcoded credentials');
      }
      
      firebaseAdmin = admin;
    } catch (error) {
      console.error('Firebase Admin initialization error:', error);
      throw new Error(`Firebase admin initialization failed: ${error.message}`);
    }
  }
  
  return firebaseAdmin;
}

// Get Admin instance
const adminInstance = getFirebaseAdmin();

// Export the admin instance and its services
export const adminAuth = adminInstance.auth();
export const adminFirestore = adminInstance.firestore();
export default adminInstance;