import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { upsertPublicUserProfile } from '../lib/social/userPublic';
import { loadAccountProfileForCurrentUser } from '../lib/accountProfile';

/**
 * Writes `users/{uid}` with `emailLower` as soon as the user is signed in so friend search works
 * even before the debounced SocialMetricsSync runs.
 */
export function AuthFirestoreBootstrap() {
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u?.email) return;

      loadAccountProfileForCurrentUser({ syncToStorage: true }).catch((e) => {
        if (__DEV__) {
          console.warn('[AuthFirestoreBootstrap] userProfiles/{uid} read failed:', e);
        }
      });

      upsertPublicUserProfile({
        uid: u.uid,
        email: u.email,
        displayName: '',
      }).catch((e) => {
        if (__DEV__) {
          console.warn('[AuthFirestoreBootstrap] users/{uid} write failed:', e);
        }
      });
    });
    return unsub;
  }, []);

  return null;
}
