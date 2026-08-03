import { getApp, getApps, initializeApp } from "firebase/app";
import {
  inMemoryPersistence,
  getAuth,
  setPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    process.env
      .NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const firebaseApp =
  getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);

export const firebaseAuth =
  getAuth(firebaseApp);

export async function enableInMemoryPersistence(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  await setPersistence(
    firebaseAuth,
    inMemoryPersistence,
  );
}
