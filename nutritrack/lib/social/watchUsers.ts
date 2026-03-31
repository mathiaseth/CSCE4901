import {
  collection,
  query,
  where,
  documentId,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { PublicUserDoc } from './types';

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Live-updates public `users/{uid}` docs for leaderboard (max 10 per Firestore `in` query — chunked). */
export function subscribeToPublicUsers(
  uids: string[],
  onMap: (map: Record<string, PublicUserDoc | null>) => void
): Unsubscribe {
  const unique = [...new Set(uids.filter(Boolean))];
  if (unique.length === 0) {
    onMap({});
    return () => {};
  }

  const chunks = chunk(unique, 10);
  const accum: Record<string, PublicUserDoc | null> = {};
  const unsubs = chunks.map((ids) => {
    const q = query(collection(db, 'users'), where(documentId(), 'in', ids));
    return onSnapshot(
      q,
      (snap) => {
        const seen = new Set(snap.docs.map((d) => d.id));
        for (const id of ids) {
          if (!seen.has(id)) accum[id] = null;
        }
        for (const d of snap.docs) {
          accum[d.id] = d.data() as PublicUserDoc;
        }
        onMap({ ...accum });
      },
      () => {
        for (const id of ids) accum[id] = null;
        onMap({ ...accum });
      }
    );
  });

  return () => unsubs.forEach((u) => u());
}
