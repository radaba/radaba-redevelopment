import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getDatabase as getAdminDatabase } from "firebase-admin/database";
import { getStorage as getAdminStorage } from "firebase-admin/storage";
import { assertEnvironment } from "@/server/environment/contract.mjs";

const environment = assertEnvironment(process.env, {
  requireRuntimeCredential: ["staging", "production"].includes(
    process.env.RADABA_ENV ?? "",
  ),
});
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY
    ? {
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replaceAll("\\n", "\n"),
      }
    : null;

export const firebaseAdminApp =
  getApps().length > 0
    ? getApps()[0]
    : serviceAccount
      ? initializeApp({
          credential: cert(serviceAccount),
          databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        })
      : initializeApp({
          projectId: environment.environment
            ? process.env.FIREBASE_ADMIN_PROJECT_ID
            : process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });

export const firebaseAdminAuth = getAdminAuth(firebaseAdminApp);
export const firebaseAdminDatabase = getAdminDatabase(firebaseAdminApp);
export const firebaseAdminStorage = getAdminStorage(firebaseAdminApp);
