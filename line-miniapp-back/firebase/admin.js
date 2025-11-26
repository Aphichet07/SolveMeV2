import admin from "firebase-admin";
import "dotenv/config";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

export { admin, db };
export default admin;
