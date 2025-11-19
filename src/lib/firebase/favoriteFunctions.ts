// Favorites Functions
// دوال المفضلة

import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { Favorite, FavoriteType } from '@/types/favorites';

const favoritesCollection = collection(db, 'favorites');

/**
 * Add item to favorites
 * إضافة عنصر إلى المفضلة
 */
export async function addFavorite(
  userId: string,
  type: FavoriteType,
  itemId: string,
  cachedData?: {
    title?: string;
    image?: string;
    category?: string;
    rating?: number;
    location?: string;
  }
): Promise<string> {
  // Check if already exists
  const existing = await isFavorite(userId, itemId);
  if (existing) {
    return existing;
  }

  const favoriteData: Omit<Favorite, 'favorite_id'> = {
    user_id: userId,
    type,
    item_id: itemId,
    item_title: cachedData?.title,
    item_image: cachedData?.image,
    item_category: cachedData?.category,
    item_rating: cachedData?.rating,
    item_location: cachedData?.location,
    created_at: Timestamp.now(),
  };

  const docRef = await addDoc(favoritesCollection, favoriteData);

  // Update with ID
  await updateDoc(docRef, {
    favorite_id: docRef.id,
  });

  return docRef.id;
}

/**
 * Remove item from favorites
 * إزالة عنصر من المفضلة
 */
export async function removeFavorite(userId: string, itemId: string): Promise<void> {
  const q = query(
    favoritesCollection,
    where('user_id', '==', userId),
    where('item_id', '==', itemId)
  );

  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
}

/**
 * Check if item is in favorites
 * التحقق من وجود عنصر في المفضلة
 */
export async function isFavorite(userId: string, itemId: string): Promise<string | null> {
  const q = query(
    favoritesCollection,
    where('user_id', '==', userId),
    where('item_id', '==', itemId)
  );

  const snapshot = await getDocs(q);
  return snapshot.empty ? null : snapshot.docs[0].id;
}

/**
 * Get all user favorites
 * الحصول على جميع مفضلات المستخدم
 */
export async function getUserFavorites(userId: string): Promise<Favorite[]> {
  const q = query(favoritesCollection, where('user_id', '==', userId));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as Favorite);
}

/**
 * Get user favorites by type
 * الحصول على مفضلات المستخدم حسب النوع
 */
export async function getUserFavoritesByType(
  userId: string,
  type: FavoriteType
): Promise<Favorite[]> {
  const q = query(
    favoritesCollection,
    where('user_id', '==', userId),
    where('type', '==', type)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => doc.data() as Favorite)
    .sort((a, b) => b.created_at.seconds - a.created_at.seconds);
}

/**
 * Get favorite count for an item
 * الحصول على عدد المفضلات لعنصر
 */
export async function getFavoriteCount(itemId: string): Promise<number> {
  const q = query(favoritesCollection, where('item_id', '==', itemId));
  const snapshot = await getDocs(q);
  return snapshot.size;
}

/**
 * Toggle favorite (add if not exists, remove if exists)
 * تبديل المفضلة (إضافة إذا لم تكن موجودة، إزالة إذا كانت موجودة)
 */
export async function toggleFavorite(
  userId: string,
  type: FavoriteType,
  itemId: string,
  cachedData?: {
    title?: string;
    image?: string;
    category?: string;
    rating?: number;
    location?: string;
  }
): Promise<boolean> {
  const existing = await isFavorite(userId, itemId);

  if (existing) {
    await removeFavorite(userId, itemId);
    return false; // Removed
  } else {
    await addFavorite(userId, type, itemId, cachedData);
    return true; // Added
  }
}
