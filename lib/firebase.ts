import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export { app, auth, db };

// Auth helpers
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Check if user document exists, if not create it
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        completedModules: [],
        quizScores: {},
        explorationHistory: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    return user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

// Progress Tracking Helpers
export const markModuleCompleted = async (userId: string, moduleName: string) => {
  if (!userId) return;
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    completedModules: arrayUnion(moduleName),
    updatedAt: serverTimestamp()
  });
};

export const saveQuizScore = async (userId: string, quizName: string, score: number) => {
  if (!userId) return;
  const userRef = doc(db, 'users', userId);
  
  // Get current scores to see if this is a high score
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const data = userSnap.data();
    const currentScore = data.quizScores?.[quizName] || 0;
    
    if (score > currentScore) {
      await updateDoc(userRef, {
        [`quizScores.${quizName}`]: score,
        updatedAt: serverTimestamp()
      });
    }
  }
};

export const addExplorationHistory = async (userId: string, action: string) => {
  if (!userId) return;
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    explorationHistory: arrayUnion(action),
    updatedAt: serverTimestamp()
  });
};

export const saveUserPreferences = async (userId: string, preferences: { level: string, interests: string }) => {
  if (!userId) return;
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    preferences,
    updatedAt: serverTimestamp()
  });
};
