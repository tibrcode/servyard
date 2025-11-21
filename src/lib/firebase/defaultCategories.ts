import { db } from "@/integrations/firebase/client";
import { collection, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";

// Centralized default categories list (24 categories)
const defaultCategories = [
  { name_en: "Cleaning Services", name_ar: "خدمات التنظيف", name_fil: "Serbisyong Paglilinis", icon_name: "Sparkles", color_scheme: "blue", display_order: 1 },
  { name_en: "Repair & Maintenance", name_ar: "الإصلاح والصيانة", name_fil: "Pag-aayos at Pagpapanatili", icon_name: "Wrench", color_scheme: "orange", display_order: 2 },
  { name_en: "Healthcare Services", name_ar: "الخدمات الصحية", name_fil: "Mga Serbisyong Pangkalusugan", icon_name: "Stethoscope", color_scheme: "red", display_order: 3 },
  { name_en: "Fitness & Wellness", name_ar: "اللياقة والعافية", name_fil: "Fitness at Wellness", icon_name: "Dumbbell", color_scheme: "green", display_order: 4 },
  { name_en: "Beauty Services", name_ar: "خدمات التجميل", name_fil: "Mga Serbisyong Kagandahan", icon_name: "Scissors", color_scheme: "pink", display_order: 5 },
  { name_en: "Education & Tutoring", name_ar: "التعليم والدروس الخصوصية", name_fil: "Edukasyon at Tutoring", icon_name: "GraduationCap", color_scheme: "purple", display_order: 6 },
  { name_en: "Engineering Services", name_ar: "الخدمات الهندسية", name_fil: "Mga Serbisyong Inhinyero", icon_name: "Cog", color_scheme: "slate", display_order: 7 },
  { name_en: "Legal Services", name_ar: "الخدمات القانونية", name_fil: "Mga Serbisyong Legal", icon_name: "Scale", color_scheme: "gray", display_order: 8 },
  { name_en: "Graphic Design", name_ar: "التصميم الجرافيكي", name_fil: "Graphic Design", icon_name: "Palette", color_scheme: "violet", display_order: 9 },
  { name_en: "Fashion Design", name_ar: "تصميم الأزياء", name_fil: "Fashion Design", icon_name: "Shirt", color_scheme: "rose", display_order: 10 },
  { name_en: "Programming & IT", name_ar: "البرمجة وتقنية المعلومات", name_fil: "Programming at IT", icon_name: "Code", color_scheme: "emerald", display_order: 11 },
  { name_en: "Architecture", name_ar: "الهندسة المعمارية", name_fil: "Arkitektura", icon_name: "Building", color_scheme: "amber", display_order: 12 },
  { name_en: "Marketing & Advertising", name_ar: "التسويق والإعلان", name_fil: "Marketing at Advertising", icon_name: "Megaphone", color_scheme: "cyan", display_order: 13 },
  { name_en: "Photography & Videography", name_ar: "التصوير الفوتوغرافي والفيديو", name_fil: "Photography at Videography", icon_name: "Camera", color_scheme: "indigo", display_order: 14 },
  { name_en: "Translation & Languages", name_ar: "الترجمة واللغات", name_fil: "Translation at Wika", icon_name: "Languages", color_scheme: "teal", display_order: 15 },
  { name_en: "Business Consulting", name_ar: "الاستشارات التجارية", name_fil: "Business Consulting", icon_name: "Briefcase", color_scheme: "stone", display_order: 16 },
  { name_en: "Event Planning", name_ar: "تنظيم الأحداث", name_fil: "Event Planning", icon_name: "Calendar", color_scheme: "lime", display_order: 17 },
  { name_en: "Real Estate", name_ar: "العقارات", name_fil: "Real Estate", icon_name: "Home", color_scheme: "sky", display_order: 18 },
  { name_en: "Financial Services", name_ar: "الخدمات المالية", name_fil: "Financial Services", icon_name: "DollarSign", color_scheme: "yellow", display_order: 19 },
  { name_en: "Automotive Services", name_ar: "خدمات السيارات", name_fil: "Automotive Services", icon_name: "Car", color_scheme: "red", display_order: 20 },
  { name_en: "Interior Design", name_ar: "التصميم الداخلي", name_fil: "Interior Design", icon_name: "Sofa", color_scheme: "orange", display_order: 21 },
  { name_en: "Writing & Content", name_ar: "الكتابة والمحتوى", name_fil: "Writing at Content", icon_name: "PenTool", color_scheme: "blue", display_order: 22 },
  { name_en: "Music & Audio", name_ar: "الموسيقى والصوتيات", name_fil: "Music at Audio", icon_name: "Music", color_scheme: "purple", display_order: 23 },
  { name_en: "Travel & Tourism", name_ar: "السفر والسياحة", name_fil: "Travel at Tourism", icon_name: "Plane", color_scheme: "green", display_order: 24 },
];

// Upsert default categories into Firestore if missing or needs update
export const upsertDefaultServiceCategories = async () => {
  const categoriesRef = collection(db, 'service_categories');
  const snapshot = await getDocs(categoriesRef);

  const existingDocs = new Map();
  snapshot.docs.forEach((d) => {
    const data = d.data();
    if (data.name_en) {
      existingDocs.set(data.name_en, d);
    }
  });

  let updatesCount = 0;
  let insertsCount = 0;

  for (const cat of defaultCategories) {
    const existingDoc = existingDocs.get(cat.name_en);

    if (existingDoc) {
      // Check if update is needed (e.g. icon changed)
      const data = existingDoc.data();
      if (data.icon_name !== cat.icon_name || data.color_scheme !== cat.color_scheme) {
         await updateDoc(doc(db, 'service_categories', existingDoc.id), {
           icon_name: cat.icon_name,
           color_scheme: cat.color_scheme,
         });
         updatesCount++;
      }
    } else {
      // Insert new
      await addDoc(categoriesRef, {
        ...cat,
        is_active: true,
        parent_id: null,
        created_at: new Date(),
        display_order: cat.display_order,
      });
      insertsCount++;
    }
  }

  return { inserts: insertsCount, updates: updatesCount };
};

export default defaultCategories;
