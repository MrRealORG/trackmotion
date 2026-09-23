import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";

const firebaseConfig = {
  projectId: "centerface2",
  appId: "1:341484418456:web:c4ab59b8b4a5470c46a7ed",
  storageBucket: "centerface2.firebasestorage.app",
  apiKey: "AIzaSyDBP7p1aN_mcV584lFPspT8or3GqOiOS7E",
  authDomain: "centerface2.firebaseapp.com",
  messagingSenderId: "341484418456",
  measurementId: "G-RGRH7NG5B8",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Authentication Helpers
const googleProvider = new GoogleAuthProvider();

export function formatAuthError(err: unknown): string {
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code: string }).code;
    if (code === "auth/configuration-not-found") {
      return "Firebase Authentication requires 1-click activation in console: Go to https://console.firebase.google.com/project/centerface2/authentication and click 'Get started' to enable Google / Email sign-in.";
    }
    if (code === "auth/popup-closed-by-user") {
      return "Sign-in popup was closed before completing.";
    }
    if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
      return "Invalid email or password.";
    }
  }
  return err instanceof Error ? err.message : "Authentication error";
}

export async function loginWithGoogle() {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err) {
    throw new Error(formatAuthError(err));
  }
}

export async function loginWithEmail(email: string, pass: string) {
  try {
    return await signInWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    throw new Error(formatAuthError(err));
  }
}

export async function registerWithEmail(email: string, pass: string) {
  try {
    return await createUserWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    throw new Error(formatAuthError(err));
  }
}

export async function logoutUser() {
  return await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Firestore Review & Feedback Model
export interface RealtimeReview {
  id: string;
  name: string;
  email: string;
  rating: number;
  comment: string;
  createdAt: number;
  userId?: string;
}

export interface UploadedPreview {
  id: string;
  title: string;
  dataUrl: string;
  uploadedAt: number;
  authorEmail?: string;
}

// Real-time Reviews Listener
export function subscribeToReviews(callback: (reviews: RealtimeReview[]) => void) {
  try {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => {
          const data = d.data() as DocumentData;
          return {
            id: d.id,
            name: data.name || "Anonymous Creator",
            email: data.email || "no-email@centerface.ai",
            rating: typeof data.rating === "number" ? data.rating : 5,
            comment: data.comment || "",
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
            userId: data.userId,
          };
        });
        callback(items);
      },
      (error) => {
        console.warn("Firestore reviews listener offline / permissions:", error);
      }
    );
  } catch (err) {
    console.warn("Firestore subscribe error:", err);
    return () => {};
  }
}

// Add Review
export async function addReview(review: { name: string; email: string; rating: number; comment: string }) {
  const user = auth.currentUser;
  return await addDoc(collection(db, "reviews"), {
    ...review,
    createdAt: serverTimestamp(),
    userId: user?.uid || null,
  });
}

// Delete Review
export async function removeReview(id: string) {
  return await deleteDoc(doc(db, "reviews", id));
}

// Real-time Previews Listener
export function subscribeToPreviews(callback: (previews: UploadedPreview[]) => void) {
  try {
    const q = query(collection(db, "previews"), orderBy("uploadedAt", "desc"));
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => {
          const data = d.data() as DocumentData;
          return {
            id: d.id,
            title: data.title || "Motion Tracking Preview",
            dataUrl: data.dataUrl || "",
            uploadedAt: data.uploadedAt?.toMillis ? data.uploadedAt.toMillis() : Date.now(),
            authorEmail: data.authorEmail,
          };
        });
        callback(items);
      },
      (error) => {
        console.warn("Firestore previews listener offline:", error);
      }
    );
  } catch (err) {
    console.warn("Firestore previews subscribe error:", err);
    return () => {};
  }
}

// Upload Preview
export async function savePreview(preview: { title: string; dataUrl: string }) {
  const user = auth.currentUser;
  return await addDoc(collection(db, "previews"), {
    ...preview,
    authorEmail: user?.email || "anonymous",
    uploadedAt: serverTimestamp(),
  });
}

// Delete Preview
export async function removePreview(id: string) {
  return await deleteDoc(doc(db, "previews", id));
}
