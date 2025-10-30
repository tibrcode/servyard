import { db } from "@/integrations/firebase/client";
import { collection, doc, setDoc, addDoc, getDocs, query, where } from "firebase/firestore";

// Collection names
export const COLLECTIONS = {
  PROFILES: 'profiles',
  SERVICES: 'services',
  SERVICE_CATEGORIES: 'service_categories',
  BOOKINGS: 'bookings',
  REVIEWS: 'reviews',
  OFFERS: 'offers',
  SERVICE_AVAILABILITY: 'service_availability',
  SERVICE_SPECIAL_DATES: 'service_special_dates'
};

// Initialize service categories if they don't exist
export const initializeServiceCategories = async () => {
  const categoriesRef = collection(db, COLLECTIONS.SERVICE_CATEGORIES);
  const snapshot = await getDocs(categoriesRef);

  if (snapshot.empty) {
    const categories = [
      {
        name_en: "Cleaning Services",
        name_ar: "خدمات التنظيف",
        name_fil: "Serbisyong Paglilinis",
        icon_name: "Sparkles",
        color_scheme: "blue",
        is_active: true,
        display_order: 1,
        parent_id: null,
        created_at: new Date()
      },
      {
        name_en: "Repair & Maintenance",
        name_ar: "الإصلاح والصيانة",
        name_fil: "Pag-aayos at Pagpapanatili",
        icon_name: "Wrench",
        color_scheme: "orange",
        is_active: true,
        display_order: 2,
        parent_id: null,
        created_at: new Date()
      },
      {
        name_en: "Healthcare Services",
        name_ar: "الخدمات الصحية",
        name_fil: "Mga Serbisyong Pangkalusugan",
        icon_name: "Heart",
        color_scheme: "red",
        is_active: true,
        display_order: 3,
        parent_id: null,
        created_at: new Date()
      },
      {
        name_en: "Fitness & Wellness",
        name_ar: "اللياقة والعافية",
        name_fil: "Fitness at Wellness",
        icon_name: "Dumbbell",
        color_scheme: "green",
        is_active: true,
        display_order: 4,
        parent_id: null,
        created_at: new Date()
      },
      {
        name_en: "Beauty Services",
        name_ar: "خدمات التجميل",
        name_fil: "Mga Serbisyong Kagandahan",
        icon_name: "Scissors",
        color_scheme: "pink",
        is_active: true,
        display_order: 5,
        parent_id: null,
        created_at: new Date()
      },
      {
        name_en: "Education & Tutoring",
        name_ar: "التعليم والدروس الخصوصية",
        name_fil: "Edukasyon at Tutoring",
        icon_name: "GraduationCap",
        color_scheme: "purple",
        is_active: true,
        display_order: 6,
        parent_id: null,
        created_at: new Date()
      },
      {
        name_en: "Engineering Services",
        name_ar: "الخدمات الهندسية",
        name_fil: "Mga Serbisyong Inhinyero",
        icon_name: "Cog",
        color_scheme: "slate",
        is_active: true,
        display_order: 7,
        parent_id: null,
        created_at: new Date()
      },
      {
        name_en: "Legal Services",
        name_ar: "الخدمات القانونية",
        name_fil: "Mga Serbisyong Legal",
        icon_name: "Scale",
        color_scheme: "gray",
        is_active: true,
        display_order: 8,
        parent_id: null,
        created_at: new Date()
      },
      {
        name_en: "Graphic Design",
        name_ar: "التصميم الجرافيكي",
        name_fil: "Graphic Design",
        icon_name: "Palette",
        color_scheme: "violet",
        is_active: true,
        display_order: 9,
        parent_id: null,
        created_at: new Date()
      },
      {
        name_en: "Fashion Design",
        name_ar: "تصميم الأزياء",
        name_fil: "Fashion Design",
        icon_name: "Shirt",
        color_scheme: "rose",
        is_active: true,
        display_order: 10,
        parent_id: null,
        created_at: new Date()
      },
      {
        name_en: "Programming & IT",
        name_ar: "البرمجة وتقنية المعلومات",
        name_fil: "Programming at IT",
        icon_name: "Code",
        color_scheme: "emerald",
        is_active: true,
        display_order: 11,
        parent_id: null,
        created_at: new Date()
      },
      {
        name_en: "Architecture",
        name_ar: "الهندسة المعمارية",
        name_fil: "Arkitektura",
        icon_name: "Building",
        color_scheme: "amber",
        is_active: true,
        display_order: 12,
        parent_id: null,
        created_at: new Date()
      },
      {
        name_en: "Marketing & Advertising",
        name_ar: "التسويق والإعلان",
        name_fil: "Marketing at Advertising",
        icon_name: "Megaphone",
        color_scheme: "cyan",
        is_active: true,
        display_order: 13,
        parent_id: null,
        created_at: new Date()
      },
      {
        name_en: "Photography & Videography",
        name_ar: "التصوير الفوتوغرافي والفيديو",
        name_fil: "Photography at Videography",
        icon_name: "Camera",
        color_scheme: "indigo",
        is_active: true,
        display_order: 14,
        parent_id: null,
        created_at: new Date()
      },
      {
        name_en: "Translation & Languages",
        name_ar: "الترجمة واللغات",
        name_fil: "Translation at Wika",
        icon_name: "Languages",
        color_scheme: "teal",
        is_active: true,
        display_order: 15,
        parent_id: null,
        created_at: new Date()
      },
      {
        name_en: "Business Consulting",
        name_ar: "الاستشارات التجارية",
        name_fil: "Business Consulting",
        icon_name: "Briefcase",
        color_scheme: "stone",
        is_active: true,
        display_order: 16,
        parent_id: null,
        created_at: new Date()
      },
      {
        name_en: "Event Planning",
        name_ar: "تنظيم الأحداث",
        name_fil: "Event Planning",
        icon_name: "Calendar",
        color_scheme: "lime",
        is_active: true,
        display_order: 17,
        parent_id: null,
        created_at: new Date()
      },
      {
        name_en: "Real Estate",
        name_ar: "العقارات",
        name_fil: "Real Estate",
        icon_name: "Home",
        color_scheme: "sky",
        is_active: true,
        display_order: 18,
        parent_id: null,
        created_at: new Date()
      },
      {
        name_en: "Financial Services",
        name_ar: "الخدمات المالية",
        name_fil: "Financial Services",
        icon_name: "DollarSign",
        color_scheme: "yellow",
        is_active: true,
        display_order: 19,
        parent_id: null,
        created_at: new Date()
      },
      {
        name_en: "Automotive Services",
        name_ar: "خدمات السيارات",
        name_fil: "Automotive Services",
        icon_name: "Car",
        color_scheme: "red",
        is_active: true,
        display_order: 20,
        parent_id: null,
        created_at: new Date()
      },
      {
        name_en: "Interior Design",
        name_ar: "التصميم الداخلي",
        name_fil: "Interior Design",
        icon_name: "Sofa",
        color_scheme: "orange",
        is_active: true,
        display_order: 21,
        parent_id: null,
        created_at: new Date()
      },
      {
        name_en: "Writing & Content",
        name_ar: "الكتابة والمحتوى",
        name_fil: "Writing at Content",
        icon_name: "PenTool",
        color_scheme: "blue",
        is_active: true,
        display_order: 22,
        parent_id: null,
        created_at: new Date()
      },
      {
        name_en: "Music & Audio",
        name_ar: "الموسيقى والصوتيات",
        name_fil: "Music at Audio",
        icon_name: "Music",
        color_scheme: "purple",
        is_active: true,
        display_order: 23,
        parent_id: null,
        created_at: new Date()
      },
      {
        name_en: "Travel & Tourism",
        name_ar: "السفر والسياحة",
        name_fil: "Travel at Tourism",
        icon_name: "Plane",
        color_scheme: "green",
        is_active: true,
        display_order: 24,
        parent_id: null,
        created_at: new Date()
      }
    ];

    for (const category of categories) {
      await addDoc(categoriesRef, category);
    }
  }
};

// Data interfaces
export interface ServiceCategory {
  id: string;
  name_en: string;
  name_ar: string;
  name_fil?: string;
  icon_name?: string;
  color_scheme?: string;
  is_active: boolean;
  display_order?: number;
  parent_id?: string | null;
  created_at: any;
}

export interface Booking {
  id: string;
  customer_id: string;
  provider_id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'confirmed_completed' | 'cancelled';
  customer_notes?: string;
  provider_response?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  created_at: any;
  updated_at: any;
}

export interface Review {
  id: string;
  customer_id: string;
  provider_id: string;
  service_id: string;
  booking_id: string;
  rating: number;
  comment?: string;
  is_approved: boolean;
  is_comment_enabled: boolean;
  created_at: any;
}

export interface Offer {
  id: string;
  provider_id: string;
  title: string;
  description?: string;
  discount_percentage?: number;
  discount_amount?: number;
  valid_from: any; // Can be string or Firebase Timestamp
  valid_until: any; // Can be string or Firebase Timestamp
  is_active: boolean;
  created_at: any;
  updated_at: any;
}