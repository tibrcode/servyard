// Types for Favorites System
// أنواع نظام المفضلة

import { Timestamp } from 'firebase/firestore';

/**
 * Favorite Item Type
 * نوع عنصر المفضلة
 */
export type FavoriteType = 'service' | 'provider';

/**
 * Favorite - User's favorite service or provider
 * المفضلة - خدمة أو مزود خدمة مفضل للمستخدم
 */
export interface Favorite {
  favorite_id: string;
  user_id: string;
  type: FavoriteType;
  item_id: string; // service_id or provider_id
  
  // Cached data for quick display
  item_title?: string; // service title or provider name
  item_image?: string; // service/provider image
  item_category?: string; // service category
  item_rating?: number; // provider rating
  item_location?: string; // provider location
  
  created_at: Timestamp;
}

/**
 * Favorite with full details
 * المفضلة مع التفاصيل الكاملة
 */
export interface FavoriteWithDetails extends Favorite {
  // Full service or provider data
  details?: any;
}
