// lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // optional
};

// Initialize Firebase (singleton)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

// Analytics – only on client side
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}
export { analytics };

// Helper to call cloud functions
export const callFunction = async (name: string, data: any) => {
  const fn = httpsCallable(functions, name);
  const result = await fn(data);
  return result.data;
};

// Update user profile (Firestore + Auth) – client‑side only
export async function updateUserProfile(user: any, data: any) {
  if (typeof window === 'undefined') return; // skip on server
  try {
    const cleanData: any = {};
    Object.keys(data).forEach((key) => {
      const value = data[key];
      if (value !== undefined) {
        cleanData[key] = (typeof value === 'string' && value.trim() === '') ? null : value;
      }
    });
    await Promise.all([
      user.updateProfile({
        displayName: data.name || user.displayName || undefined,
        photoURL: data.profileImage || user.photoURL || undefined,
      }),
      import('firebase/firestore').then(({ doc, setDoc, serverTimestamp }) =>
        setDoc(doc(db, 'users', user.uid), { ...cleanData, updatedAt: serverTimestamp() }, { merge: true })
      ),
    ]);
  } catch (error) {
    console.error('Update user profile error:', error);
    throw new Error('Failed to update user profile');
  }
}

// Get user by ID – works on server (no client‑side only code)
export async function getUser(userId: string) {
  const { doc, getDoc } = await import('firebase/firestore');
  const userDoc = await getDoc(doc(db, 'users', userId));
  return userDoc.exists() ? userDoc.data() : null;
}

// Ensure anonymous user exists – client‑side only
export async function ensureAnon() {
  if (typeof window === 'undefined') return null;
  const { signInAnonymously } = await import('firebase/auth');
  if (!auth.currentUser) {
    const { user } = await signInAnonymously(auth);
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      name: 'Anonymous',
      email: '',
      username: `user_${user.uid.slice(0, 8)}`,
      type: 'individual',
      tier: 'free',
      verified: false,
      followersCount: 0,
      followingCount: 0,
      pollsCreated: 0,
      pollsThisMonth: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return user;
  }
  return auth.currentUser;
}

// Re-export commonly used Firestore functions (no change)
export { 
  doc, getDoc, setDoc, updateDoc, increment, deleteDoc,
  collection, addDoc, query, where, orderBy, limit,
  runTransaction, Timestamp, onSnapshot, writeBatch,
  arrayUnion, arrayRemove, deleteField,
  getDocs, serverTimestamp 
} from 'firebase/firestore';