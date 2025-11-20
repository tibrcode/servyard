export interface ProviderProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone_numbers: string[];
  whatsapp_number?: string;
  city: string;
  country: string;
  profile_description: string;
  avatar_url?: string;
  is_verified: boolean;
  is_online?: boolean;
  rating?: number;
  total_reviews?: number;
  user_type: string;
  website_url?: string;
  google_business_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  tiktok_url?: string;
  currency_code?: string;
  main_category_id?: string;
  latitude?: number;
  longitude?: number;
  location_address?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  provider_id: string;
  approximate_price?: string;
  duration_minutes?: number;
  is_active: boolean;
  category_id?: string;
  created_at?: any;
  updated_at?: any;
  provider?: any;
  category?: any;
  // Booking settings
  booking_enabled?: boolean;
  max_concurrent_bookings?: number;
  advance_booking_days?: number;
  buffer_time_minutes?: number;
  cancellation_policy_hours?: number;
  require_confirmation?: boolean;
  price_range?: string;
  allow_customer_cancellation?: boolean;
  has_discount?: boolean;
  discount_price?: string;
  discount_percentage?: number;
  specialty_description?: string;
  averageRating?: number;
  reviewCount?: number;
}

export interface Offer {
  id: string;
  provider_id?: string;
  title: string;
  description?: string;
  discount_percentage?: number;
  discount_amount?: number;
  valid_until: any;
  valid_from?: any;
  is_active: boolean;
  created_at?: any;
  updated_at?: any;
}

export interface Review {
  id: string;
  customer_id: string;
  provider_id: string;
  service_id?: string;
  rating: number;
  comment?: string;
  created_at: any;
  is_approved?: boolean;
  customer_name?: string;
}
