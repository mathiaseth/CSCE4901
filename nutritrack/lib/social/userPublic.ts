import {
  doc,
  setDoc,
  getDoc,
  query,
  where,
  limit,
  getDocs,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { PublicUserDoc } from './types';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function buildInitials(displayName: string, emailFallback: string): string {
  const n = displayName.trim();
  if (n.length > 0) {
    return n
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  if (emailFallback.length > 0) return emailFallback[0]!.toUpperCase();
  return '?';
}

/** Creates/merges the public user directory row (required for friend search + leaderboard). */
export async function upsertPublicUserProfile(params: {
  uid: string;
  email: string;
  displayName: string;
}): Promise<void> {
  const emailLower = normalizeEmail(params.email);
  if (!emailLower) return;

  const ref = doc(db, 'users', params.uid);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? (snap.data() as Partial<PublicUserDoc>) : {};
  const displayName =
    params.displayName.trim() ||
    existing.displayName ||
    params.email.split('@')[0] ||
    'User';

  await setDoc(
    ref,
    {
      emailLower,
      displayName,
      initials: buildInitials(displayName, emailLower),
      profileUpdatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function findUserUidByEmail(email: string): Promise<string | null> {
  const emailLower = normalizeEmail(email);
  if (!emailLower) return null;

  try {
    const q = query(
      collection(db, 'users'),
      where('emailLower', '==', emailLower),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0]!.id;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `Could not search for users (${msg}). Deploy Firestore rules and enable Firestore in the Firebase console.`
    );
  }
}

export async function getPublicUser(uid: string): Promise<PublicUserDoc | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as PublicUserDoc;
}
