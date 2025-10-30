// Comprehensive currency list focusing on Arab countries first, plus common world currencies
// Each entry includes code, symbol, English and Arabic names
export type CurrencyOption = {
    code: string;
    symbol: string;
    nameEn: string;
    nameAr: string;
};

export const currencyList: CurrencyOption[] = [
    // GCC + MENA
    { code: 'AED', symbol: 'د.إ', nameEn: 'United Arab Emirates Dirham', nameAr: 'درهم إماراتي' },
    { code: 'SAR', symbol: '﷼', nameEn: 'Saudi Riyal', nameAr: 'ريال سعودي' },
    { code: 'QAR', symbol: 'ر.ق', nameEn: 'Qatari Riyal', nameAr: 'ريال قطري' },
    { code: 'KWD', symbol: 'د.ك', nameEn: 'Kuwaiti Dinar', nameAr: 'دينار كويتي' },
    { code: 'OMR', symbol: 'ر.ع', nameEn: 'Omani Rial', nameAr: 'ريال عماني' },
    { code: 'BHD', symbol: 'د.ب', nameEn: 'Bahraini Dinar', nameAr: 'دينار بحريني' },
    { code: 'EGP', symbol: 'ج.م', nameEn: 'Egyptian Pound', nameAr: 'جنيه مصري' },
    { code: 'JOD', symbol: 'د.أ', nameEn: 'Jordanian Dinar', nameAr: 'دينار أردني' },
    { code: 'LBP', symbol: 'ل.ل', nameEn: 'Lebanese Pound', nameAr: 'ليرة لبنانية' },
    { code: 'SYP', symbol: 'ل.س', nameEn: 'Syrian Pound', nameAr: 'ليرة سورية' },
    { code: 'IQD', symbol: 'ع.د', nameEn: 'Iraqi Dinar', nameAr: 'دينار عراقي' },
    { code: 'DZD', symbol: 'د.ج', nameEn: 'Algerian Dinar', nameAr: 'دينار جزائري' },
    { code: 'MAD', symbol: 'د.م', nameEn: 'Moroccan Dirham', nameAr: 'درهم مغربي' },
    { code: 'TND', symbol: 'د.ت', nameEn: 'Tunisian Dinar', nameAr: 'دينار تونسي' },
    { code: 'LYD', symbol: 'د.ل', nameEn: 'Libyan Dinar', nameAr: 'دينار ليبي' },
    { code: 'SDG', symbol: 'ج.س', nameEn: 'Sudanese Pound', nameAr: 'جنيه سوداني' },
    { code: 'YER', symbol: 'ر.ي', nameEn: 'Yemeni Rial', nameAr: 'ريال يمني' },
    { code: 'SOS', symbol: 'S', nameEn: 'Somali Shilling', nameAr: 'شلن صومالي' },
    { code: 'MRU', symbol: 'UM', nameEn: 'Mauritanian Ouguiya', nameAr: 'أوقية موريتانية' },
    { code: 'DJF', symbol: 'Fdj', nameEn: 'Djiboutian Franc', nameAr: 'فرنك جيبوتي' },
    { code: 'KMF', symbol: 'CF', nameEn: 'Comorian Franc', nameAr: 'فرنك جزر القمر' },

    // Regional and global
    { code: 'USD', symbol: '$', nameEn: 'US Dollar', nameAr: 'دولار أمريكي' },
    { code: 'EUR', symbol: '€', nameEn: 'Euro', nameAr: 'يورو' },
    { code: 'GBP', symbol: '£', nameEn: 'British Pound', nameAr: 'جنيه إسترليني' },
    { code: 'TRY', symbol: '₺', nameEn: 'Turkish Lira', nameAr: 'ليرة تركية' },
    { code: 'INR', symbol: '₹', nameEn: 'Indian Rupee', nameAr: 'روبية هندية' },
    { code: 'PKR', symbol: '₨', nameEn: 'Pakistani Rupee', nameAr: 'روبية باكستانية' },
    { code: 'IDR', symbol: 'Rp', nameEn: 'Indonesian Rupiah', nameAr: 'روبية إندونيسية' },
    { code: 'CNY', symbol: '¥', nameEn: 'Chinese Yuan', nameAr: 'يوان صيني' },
    { code: 'JPY', symbol: '¥', nameEn: 'Japanese Yen', nameAr: 'ين ياباني' },
    { code: 'KRW', symbol: '₩', nameEn: 'South Korean Won', nameAr: 'وون كوري' },
    { code: 'RUB', symbol: '₽', nameEn: 'Russian Ruble', nameAr: 'روبل روسي' },
    { code: 'ZAR', symbol: 'R', nameEn: 'South African Rand', nameAr: 'راند جنوب أفريقي' },
    { code: 'AUD', symbol: 'A$', nameEn: 'Australian Dollar', nameAr: 'دولار أسترالي' },
    { code: 'CAD', symbol: 'C$', nameEn: 'Canadian Dollar', nameAr: 'دولار كندي' },
    { code: 'BRL', symbol: 'R$', nameEn: 'Brazilian Real', nameAr: 'ريال برازيلي' },
    { code: 'MXN', symbol: '$', nameEn: 'Mexican Peso', nameAr: 'بيزو مكسيكي' }
];

export const getCurrencyLabel = (code: string, language: string) => {
    const found = currencyList.find(c => c.code === code);
    if (!found) return code;
    const name = language === 'ar' ? found.nameAr : found.nameEn;
    return `${found.code} — ${name} (${found.symbol})`;
};

export const getCurrencyByCode = (code?: string) => {
    if (!code) return undefined;
    return currencyList.find(c => c.code === code);
};

export const getCurrencySymbol = (code?: string) => {
    const c = getCurrencyByCode(code || '');
    return c?.symbol || '';
};
