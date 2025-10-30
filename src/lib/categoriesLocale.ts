// Category localization helper for the 24 default categories
// Provides localized labels by slug across supported languages.

export type CategoryDoc = {
    name_en: string;
    name_ar?: string;
    name_fil?: string;
    [key: string]: any;
};

export const slugifyCategory = (name: string) =>
    name
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

// Slugs derived from English names in defaultCategories
// cleaning-services, repair-and-maintenance, healthcare-services, fitness-and-wellness, beauty-services, education-and-tutoring,
// engineering-services, legal-services, graphic-design, fashion-design, programming-and-it, architecture, marketing-and-advertising,
// photography-and-videography, translation-and-languages, business-consulting, event-planning, real-estate, financial-services,
// automotive-services, interior-design, writing-and-content, music-and-audio, travel-and-tourism

export const categoryTranslations: Record<string, Record<string, string>> = {
    'cleaning-services': {
        en: 'Cleaning Services', ar: 'خدمات التنظيف', fr: 'Services de nettoyage', es: 'Servicios de limpieza', fil: 'Serbisyong Paglilinis', ur: 'صفائی کی خدمات', id: 'Jasa Kebersihan', ko: '청소 서비스', ja: 'クリーニングサービス', tr: 'Temizlik Hizmetleri', de: 'Reinigungsdienste', it: 'Servizi di pulizia', pt: 'Serviços de limpeza', ru: 'Клининговые услуги', hi: 'सफाई सेवाएँ', zh: '清洁服务'
    },
    'repair-and-maintenance': {
        en: 'Repair & Maintenance', ar: 'الإصلاح والصيانة', fr: 'Réparation et maintenance', es: 'Reparación y mantenimiento', fil: 'Pag-aayos at Pagpapanatili', ur: 'مرمت اور دیکھ بھال', id: 'Perbaikan & Pemeliharaan', ko: '수리 및 유지보수', ja: '修理・メンテナンス', tr: 'Tamir ve Bakım', de: 'Reparatur & Wartung', it: 'Riparazione e manutenzione', pt: 'Reparo e manutenção', ru: 'Ремонт и обслуживание', hi: 'मरम्मत और रखरखाव', zh: '维修与保养'
    },
    'healthcare-services': {
        en: 'Healthcare Services', ar: 'الخدمات الصحية', fr: 'Services de santé', es: 'Servicios de salud', fil: 'Mga Serbisyong Pangkalusugan', ur: 'صحت کی خدمات', id: 'Layanan Kesehatan', ko: '헬스케어 서비스', ja: 'ヘルスケアサービス', tr: 'Sağlık Hizmetleri', de: 'Gesundheitsdienste', it: 'Servizi sanitari', pt: 'Serviços de saúde', ru: 'Медицинские услуги', hi: 'स्वास्थ्य सेवाएँ', zh: '医疗健康服务'
    },
    'fitness-and-wellness': {
        en: 'Fitness & Wellness', ar: 'اللياقة والعافية', fr: 'Fitness et bien-être', es: 'Fitness y bienestar', fil: 'Fitness at Wellness', ur: 'فٹنس اور ویلنس', id: 'Kebugaran & Kesejahteraan', ko: '피트니스 & 웰니스', ja: 'フィットネス・ウェルネス', tr: 'Fitness ve Wellness', de: 'Fitness & Wellness', it: 'Fitness e benessere', pt: 'Fitness e bem-estar', ru: 'Фитнес и wellness', hi: 'फिटनेस और वेलनेस', zh: '健身与康养'
    },
    'beauty-services': {
        en: 'Beauty Services', ar: 'خدمات التجميل', fr: 'Services de beauté', es: 'Servicios de belleza', fil: 'Mga Serbisyong Kagandahan', ur: 'بیوٹی سروسز', id: 'Layanan Kecantikan', ko: '뷰티 서비스', ja: 'ビューティーサービス', tr: 'Güzellik Hizmetleri', de: 'Schönheitsdienste', it: 'Servizi di bellezza', pt: 'Serviços de beleza', ru: 'Бьюти-услуги', hi: 'ब्यूटी सेवाएँ', zh: '美容服务'
    },
    'education-and-tutoring': {
        en: 'Education & Tutoring', ar: 'التعليم والدروس الخصوصية', fr: 'Éducation et tutorat', es: 'Educación y tutoría', fil: 'Edukasyon at Tutoring', ur: 'تعلیم اور ٹیوٹرنگ', id: 'Pendidikan & Les Privat', ko: '교육 & 과외', ja: '教育・家庭教師', tr: 'Eğitim ve Özel Ders', de: 'Bildung & Nachhilfe', it: 'Istruzione e ripetizioni', pt: 'Educação e aulas particulares', ru: 'Образование и репетиторство', hi: 'शिक्षा और ट्यूशन', zh: '教育与家教'
    },
    'engineering-services': {
        en: 'Engineering Services', ar: 'الخدمات الهندسية', fr: "Services d’ingénierie", es: 'Servicios de ingeniería', fil: 'Mga Serbisyong Inhinyero', ur: 'انجینئرنگ خدمات', id: 'Layanan Teknik', ko: '엔지니어링 서비스', ja: 'エンジニアリングサービス', tr: 'Mühendislik Hizmetleri', de: 'Ingenieurdienstleistungen', it: 'Servizi di ingegneria', pt: 'Serviços de engenharia', ru: 'Инженерные услуги', hi: 'इंजीनियरिंग सेवाएँ', zh: '工程服务'
    },
    'legal-services': {
        en: 'Legal Services', ar: 'الخدمات القانونية', fr: 'Services juridiques', es: 'Servicios legales', fil: 'Mga Serbisyong Legal', ur: 'قانونی خدمات', id: 'Layanan Hukum', ko: '법률 서비스', ja: '法律サービス', tr: 'Hukuk Hizmetleri', de: 'Rechtsdienstleistungen', it: 'Servizi legali', pt: 'Serviços jurídicos', ru: 'Юридические услуги', hi: 'कानूनी सेवाएँ', zh: '法律服务'
    },
    'graphic-design': {
        en: 'Graphic Design', ar: 'التصميم الجرافيكي', fr: 'Design graphique', es: 'Diseño gráfico', fil: 'Graphic Design', ur: 'گرافک ڈیزائن', id: 'Desain Grafis', ko: '그래픽 디자인', ja: 'グラフィックデザイン', tr: 'Grafik Tasarım', de: 'Grafikdesign', it: 'Graphic design', pt: 'Design gráfico', ru: 'Графический дизайн', hi: 'ग्राफिक डिजाइन', zh: '平面设计'
    },
    'fashion-design': {
        en: 'Fashion Design', ar: 'تصميم الأزياء', fr: 'Design de mode', es: 'Diseño de moda', fil: 'Fashion Design', ur: 'فیشن ڈیزائن', id: 'Desain Busana', ko: '패션 디자인', ja: 'ファッションデザイン', tr: 'Moda Tasarımı', de: 'Modedesign', it: 'Fashion design', pt: 'Design de moda', ru: 'Дизайн одежды', hi: 'फैशन डिजाइन', zh: '时装设计'
    },
    'programming-and-it': {
        en: 'Programming & IT', ar: 'البرمجة وتقنية المعلومات', fr: 'Programmation et informatique', es: 'Programación e informática', fil: 'Programming at IT', ur: 'پروگرامنگ اور آئی ٹی', id: 'Pemrograman & TI', ko: '프로그래밍 & IT', ja: 'プログラミング・IT', tr: 'Programlama ve BT', de: 'Programmierung & IT', it: 'Programmazione e IT', pt: 'Programação e TI', ru: 'Программирование и ИТ', hi: 'प्रोग्रामिंग और आईटी', zh: '编程与IT'
    },
    'architecture': {
        en: 'Architecture', ar: 'الهندسة المعمارية', fr: 'Architecture', es: 'Arquitectura', fil: 'Arkitektura', ur: 'معماری', id: 'Arsitektur', ko: '건축', ja: '建築', tr: 'Mimarlık', de: 'Architektur', it: 'Architettura', pt: 'Arquitetura', ru: 'Архитектура', hi: 'आर्किटेक्चर', zh: '建筑'
    },
    'marketing-and-advertising': {
        en: 'Marketing & Advertising', ar: 'التسويق والإعلان', fr: 'Marketing et publicité', es: 'Marketing y publicidad', fil: 'Marketing at Advertising', ur: 'مارکیٹنگ اور اشتہارات', id: 'Pemasaran & Periklanan', ko: '마케팅 & 광고', ja: 'マーケティング・広告', tr: 'Pazarlama ve Reklam', de: 'Marketing & Werbung', it: 'Marketing e pubblicità', pt: 'Marketing e publicidade', ru: 'Маркетинг и реклама', hi: 'मार्केटिंग और विज्ञापन', zh: '营销与广告'
    },
    'photography-and-videography': {
        en: 'Photography & Videography', ar: 'التصوير الفوتوغرافي والفيديو', fr: 'Photographie et vidéographie', es: 'Fotografía y videografía', fil: 'Photography at Videography', ur: 'فوٹوگرافی اور ویڈیوگرافی', id: 'Fotografi & Videografi', ko: '사진 & 비디오', ja: '写真・映像', tr: 'Fotoğraf ve Videografi', de: 'Fotografie & Videografie', it: 'Fotografia e videografia', pt: 'Fotografia e videografia', ru: 'Фото- и видеосъёмка', hi: 'फोटोग्राफी और वीडियोग्राफी', zh: '摄影与视频'
    },
    'translation-and-languages': {
        en: 'Translation & Languages', ar: 'الترجمة واللغات', fr: 'Traduction et langues', es: 'Traducción e idiomas', fil: 'Translation at Wika', ur: 'ترجمہ اور زبانیں', id: 'Terjemahan & Bahasa', ko: '번역 & 언어', ja: '翻訳・言語', tr: 'Çeviri ve Diller', de: 'Übersetzung & Sprachen', it: 'Traduzione e lingue', pt: 'Tradução e idiomas', ru: 'Перевод и языки', hi: 'अनुवाद और भाषाएँ', zh: '翻译与语言'
    },
    'business-consulting': {
        en: 'Business Consulting', ar: 'الاستشارات التجارية', fr: 'Conseil en affaires', es: 'Consultoría empresarial', fil: 'Business Consulting', ur: 'بزنس کنسلٹنگ', id: 'Konsultasi Bisnis', ko: '비즈니스 컨설팅', ja: 'ビジネスコンサルティング', tr: 'İş Danışmanlığı', de: 'Unternehmensberatung', it: 'Consulenza aziendale', pt: 'Consultoria empresarial', ru: 'Бизнес‑консалтинг', hi: 'व्यापार परामर्श', zh: '商业咨询'
    },
    'event-planning': {
        en: 'Event Planning', ar: 'تنظيم الأحداث', fr: 'Organisation d’événements', es: 'Planificación de eventos', fil: 'Event Planning', ur: 'ایونٹ پلاننگ', id: 'Perencanaan Acara', ko: '이벤트 기획', ja: 'イベント企画', tr: 'Etkinlik Planlama', de: 'Eventplanung', it: 'Organizzazione eventi', pt: 'Planejamento de eventos', ru: 'Организация мероприятий', hi: 'इवेंट प्लानिंग', zh: '活动策划'
    },
    'real-estate': {
        en: 'Real Estate', ar: 'العقارات', fr: 'Immobilier', es: 'Bienes raíces', fil: 'Real Estate', ur: 'رئیل اسٹیٹ', id: 'Properti', ko: '부동산', ja: '不動産', tr: 'Emlak', de: 'Immobilien', it: 'Immobiliare', pt: 'Imobiliário', ru: 'Недвижимость', hi: 'रियल एस्टेट', zh: '房地产'
    },
    'financial-services': {
        en: 'Financial Services', ar: 'الخدمات المالية', fr: 'Services financiers', es: 'Servicios financieros', fil: 'Financial Services', ur: 'مالیاتی خدمات', id: 'Layanan Keuangan', ko: '금융 서비스', ja: '金融サービス', tr: 'Finansal Hizmetler', de: 'Finanzdienstleistungen', it: 'Servizi finanziari', pt: 'Serviços financeiros', ru: 'Финансовые услуги', hi: 'वित्तीय सेवाएँ', zh: '金融服务'
    },
    'automotive-services': {
        en: 'Automotive Services', ar: 'خدمات السيارات', fr: 'Services automobiles', es: 'Servicios automotrices', fil: 'Automotive Services', ur: 'آٹوموٹیو سروسز', id: 'Layanan Otomotif', ko: '자동차 서비스', ja: '自動車サービス', tr: 'Otomotiv Hizmetleri', de: 'Kfz-Dienstleistungen', it: 'Servizi automobilistici', pt: 'Serviços automotivos', ru: 'Автомобильные услуги', hi: 'ऑटोमोटिव सेवाएँ', zh: '汽车服务'
    },
    'interior-design': {
        en: 'Interior Design', ar: 'التصميم الداخلي', fr: 'Design d’intérieur', es: 'Diseño de interiores', fil: 'Interior Design', ur: 'اندرونی ڈیزائن', id: 'Desain Interior', ko: '인테리어 디자인', ja: 'インテリアデザイン', tr: 'İç Mimari', de: 'Innenarchitektur', it: 'Interior design', pt: 'Design de interiores', ru: 'Дизайн интерьера', hi: 'इंटीरियर डिजाइन', zh: '室内设计'
    },
    'writing-and-content': {
        en: 'Writing & Content', ar: 'الكتابة والمحتوى', fr: 'Rédaction et contenu', es: 'Redacción y contenido', fil: 'Writing at Content', ur: 'تحریر اور مواد', id: 'Penulisan & Konten', ko: '글쓰기 & 콘텐츠', ja: 'ライティング・コンテンツ', tr: 'Yazı ve İçerik', de: 'Schreiben & Inhalte', it: 'Scrittura e contenuti', pt: 'Redação e conteúdo', ru: 'Копирайटинг и контент', hi: 'लेखन और कंटेंट', zh: '写作与内容'
    },
    'music-and-audio': {
        en: 'Music & Audio', ar: 'الموسيقى والصوتيات', fr: 'Musique et audio', es: 'Música y audio', fil: 'Music at Audio', ur: 'موسیقی اور آڈیو', id: 'Musik & Audio', ko: '음악 & 오디오', ja: '音楽・オーディオ', tr: 'Müzik ve Ses', de: 'Musik & Audio', it: 'Musica e audio', pt: 'Música e áudio', ru: 'Музыка и аудио', hi: 'संगीत और ऑडियो', zh: '音乐与音频'
    },
    'travel-and-tourism': {
        en: 'Travel & Tourism', ar: 'السفر والسياحة', fr: 'Voyage et tourisme', es: 'Viajes y turismo', fil: 'Travel at Tourism', ur: 'سفر اور سیاحت', id: 'Perjalanan & Pariwisata', ko: '여행 & 관광', ja: '旅行・観光', tr: 'Seyahat ve Turizm', de: 'Reisen & Tourismus', it: 'Viaggi e turismo', pt: 'Viagem e turismo', ru: 'Путешествия и туризм', hi: 'यात्रा और पर्यटन', zh: '旅行与旅游'
    },
};

export function getCategoryLabel(category: CategoryDoc, lang: string): string {
    // 1) Prefer explicit fields on the document (name_<lang>)
    const docName = category[`name_${lang}`] as string | undefined;
    if (docName && docName.trim()) return docName;

    // 2) Compute slug from English name and use translations map
    const base = category.name_en || '';
    const slug = slugifyCategory(base);
    const map = categoryTranslations[slug];
    if (map) {
        // Exact language match
        if (map[lang]) return map[lang];
        // Arabic/Filipino fallbacks
        if (lang === 'ar' && category.name_ar) return category.name_ar;
        if (lang === 'fil' && category.name_fil) return category.name_fil;
        // Fallback to English translation in map
        if (map.en) return map.en;
    }

    // 3) Last resort: try known doc fields or English
    if (lang === 'ar' && category.name_ar) return category.name_ar;
    if (lang === 'fil' && category.name_fil) return category.name_fil;
    return category.name_en || base || 'Unknown';
}
