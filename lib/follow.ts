// lib/follow.ts
'use client';

import { db } from './firebase';
import { doc, setDoc, deleteDoc, getDoc, getDocs, collection, runTransaction, increment, serverTimestamp } from 'firebase/firestore';
import { sendTemplateNotification } from './notifications';
import { trackUserInteraction } from './analytics';

export async function followUser(targetId: string, currentUserId: string) {
  if (targetId === currentUserId) throw new Error('Cannot follow yourself');
  await runTransaction(db, async (transaction) => {
    const followRef = doc(db, `users/${targetId}/followers`, currentUserId);
    const followingRef = doc(db, `users/${currentUserId}/following`, targetId);
    const targetUserRef = doc(db, 'users', targetId);
    const currentUserRef = doc(db, 'users', currentUserId);
    const followSnap = await transaction.get(followRef);
    if (followSnap.exists()) throw new Error('Already following');
    transaction.set(followRef, { followedAt: serverTimestamp() });
    transaction.set(followingRef, { followedAt: serverTimestamp() });
    transaction.update(targetUserRef, { followersCount: increment(1) });
    transaction.update(currentUserRef, { followingCount: increment(1) });
  });
  const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
  const currentUsername = currentUserDoc.exists() ? currentUserDoc.data().username || 'Anonymous' : 'Anonymous';
  await sendTemplateNotification(targetId, 'follower_added', { username: currentUsername }, currentUserId, { followerId: currentUserId });
  await trackUserInteraction(currentUserId, 'follow', { category: 'social', metadata: { targetId } });
}

export async function unfollowUser(targetId: string, currentUserId: string) {
  await runTransaction(db, async (transaction) => {
    const followRef = doc(db, `users/${targetId}/followers`, currentUserId);
    const followingRef = doc(db, `users/${currentUserId}/following`, targetId);
    const targetUserRef = doc(db, 'users', targetId);
    const currentUserRef = doc(db, 'users', currentUserId);
    const followSnap = await transaction.get(followRef);
    if (!followSnap.exists()) throw new Error('Not following');
    transaction.delete(followRef);
    transaction.delete(followingRef);
    transaction.update(targetUserRef, { followersCount: increment(-1) });
    transaction.update(currentUserRef, { followingCount: increment(-1) });
  });
  await trackUserInteraction(currentUserId, 'unfollow', { category: 'social', metadata: { targetId } });
}

export async function isFollowing(targetId: string, currentUserId: string) {
  const docRef = doc(db, `users/${currentUserId}/following`, targetId);
  const snap = await getDoc(docRef);
  return snap.exists();
}

export async function getFollowers(userId: string) {
  const col = collection(db, `users/${userId}/followers`);
  const snap = await getDocs(col);
  return snap.docs.map(d => d.id);
}

export async function getFollowing(userId: string) {
  const col = collection(db, `users/${userId}/following`);
  const snap = await getDocs(col);
  return snap.docs.map(d => d.id);
}