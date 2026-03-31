import {
  collection,
  doc,
  getDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { db, auth } from '../firebase';
import { friendRequestDocId, friendshipPairId } from './ids';
import { findUserUidByEmail, normalizeEmail } from './userPublic';
import type { FriendRequestDoc, FriendshipDoc } from './types';

async function resolveTargetUidForFriendRequest(targetEmail: string): Promise<string> {
  const uid = await findUserUidByEmail(targetEmail);
  if (uid) return uid;

  let methods: string[] = [];
  try {
    methods = await fetchSignInMethodsForEmail(auth, normalizeEmail(targetEmail));
  } catch {
    // Email-enumeration protection or network — fall through to generic message
    methods = [];
  }
  if (methods.length > 0) {
    throw new Error(
      'That email is registered, but their profile is not in search yet. Ask them to open NutriFit once while logged in (so their account syncs), then try again.'
    );
  }

  throw new Error('No NutriFit account uses that email.');
}

export async function isFriendWith(myUid: string, otherUid: string): Promise<boolean> {
  const pid = friendshipPairId(myUid, otherUid);
  const snap = await getDoc(doc(db, 'friendships', pid));
  return snap.exists();
}

export async function sendFriendRequest(params: {
  myUid: string;
  targetEmail: string;
}): Promise<'sent' | 'already_friends' | 'pending_out' | 'accepted_reverse'> {
  const { myUid, targetEmail } = params;
  const toUid = await resolveTargetUidForFriendRequest(targetEmail);
  if (toUid === myUid) throw new Error('You cannot add yourself.');

  if (await isFriendWith(myUid, toUid)) {
    return 'already_friends';
  }

  const reverseId = friendRequestDocId(toUid, myUid);
  const reverseSnap = await getDoc(doc(db, 'friendRequests', reverseId));
  if (reverseSnap.exists()) {
    const d = reverseSnap.data() as FriendRequestDoc;
    if (d.status === 'pending') {
      await acceptFriendRequest({ myUid, requestId: reverseId });
      return 'accepted_reverse';
    }
  }

  const outId = friendRequestDocId(myUid, toUid);
  const existing = await getDoc(doc(db, 'friendRequests', outId));
  if (existing.exists()) {
    const d = existing.data() as FriendRequestDoc;
    if (d.status === 'pending') return 'pending_out';
  }

  await setDoc(doc(db, 'friendRequests', outId), {
    fromUid: myUid,
    toUid,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return 'sent';
}

export async function acceptFriendRequest(params: {
  myUid: string;
  requestId: string;
}): Promise<void> {
  const { myUid, requestId } = params;
  const ref = doc(db, 'friendRequests', requestId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Request not found.');
  const data = snap.data() as FriendRequestDoc;
  if (data.toUid !== myUid) throw new Error('You cannot accept this request.');
  if (data.status !== 'pending') throw new Error('Request is no longer pending.');

  const pairId = friendshipPairId(data.fromUid, data.toUid);
  const uidA = data.fromUid < data.toUid ? data.fromUid : data.toUid;
  const uidB = data.fromUid < data.toUid ? data.toUid : data.fromUid;
  const batch = writeBatch(db);
  batch.delete(ref);
  batch.set(doc(db, 'friendships', pairId), {
    uidA,
    uidB,
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function declineFriendRequest(params: {
  myUid: string;
  requestId: string;
}): Promise<void> {
  const { myUid, requestId } = params;
  const ref = doc(db, 'friendRequests', requestId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as FriendRequestDoc;
  if (data.toUid !== myUid) throw new Error('You cannot decline this request.');
  await deleteDoc(ref);
}

export async function cancelOutgoingRequest(params: {
  myUid: string;
  requestId: string;
}): Promise<void> {
  const { myUid, requestId } = params;
  const ref = doc(db, 'friendRequests', requestId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as FriendRequestDoc;
  if (data.fromUid !== myUid) throw new Error('Not your outgoing request.');
  await deleteDoc(ref);
}

export async function removeFriendship(myUid: string, otherUid: string): Promise<void> {
  const pairId = friendshipPairId(myUid, otherUid);
  await deleteDoc(doc(db, 'friendships', pairId));
}

export function subscribeIncomingFriendRequests(
  myUid: string,
  onChange: (rows: { id: string; data: FriendRequestDoc }[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'friendRequests'),
    where('toUid', '==', myUid),
    where('status', '==', 'pending')
  );
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({
        id: d.id,
        data: d.data() as FriendRequestDoc,
      }));
      onChange(rows);
    },
    (err) => {
      if (__DEV__) console.warn('[friendRequests incoming]', err);
      onChange([]);
    }
  );
}

export function subscribeOutgoingFriendRequests(
  myUid: string,
  onChange: (rows: { id: string; data: FriendRequestDoc }[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'friendRequests'),
    where('fromUid', '==', myUid),
    where('status', '==', 'pending')
  );
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({
        id: d.id,
        data: d.data() as FriendRequestDoc,
      }));
      onChange(rows);
    },
    (err) => {
      if (__DEV__) console.warn('[friendRequests outgoing]', err);
      onChange([]);
    }
  );
}

export function subscribeFriendships(
  myUid: string,
  onChange: (friendUids: string[]) => void
): Unsubscribe {
  const q1 = query(collection(db, 'friendships'), where('uidA', '==', myUid));
  const q2 = query(collection(db, 'friendships'), where('uidB', '==', myUid));

  let last1: string[] = [];
  let last2: string[] = [];

  const merge = () => {
    const set = new Set<string>();
    for (const id of last1) set.add(id);
    for (const id of last2) set.add(id);
    onChange([...set]);
  };

  const u1 = onSnapshot(
    q1,
    (snap) => {
      last1 = snap.docs.map((d) => {
        const x = d.data() as FriendshipDoc;
        return x.uidB;
      });
      merge();
    },
    () => {
      last1 = [];
      merge();
    }
  );

  const u2 = onSnapshot(
    q2,
    (snap) => {
      last2 = snap.docs.map((d) => {
        const x = d.data() as FriendshipDoc;
        return x.uidA;
      });
      merge();
    },
    () => {
      last2 = [];
      merge();
    }
  );

  return () => {
    u1();
    u2();
  };
}
