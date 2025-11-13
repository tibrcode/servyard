// Common Timezones List
// قائمة المناطق الزمنية الشائعة

export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
}

export const commonTimezones: TimezoneOption[] = [
  // Middle East & North Africa
  { value: 'Asia/Dubai', label: 'Dubai, Abu Dhabi (UAE)', offset: 'GMT+4' },
  { value: 'Asia/Riyadh', label: 'Riyadh, Jeddah (Saudi Arabia)', offset: 'GMT+3' },
  { value: 'Asia/Kuwait', label: 'Kuwait City', offset: 'GMT+3' },
  { value: 'Asia/Qatar', label: 'Doha', offset: 'GMT+3' },
  { value: 'Asia/Bahrain', label: 'Manama', offset: 'GMT+3' },
  { value: 'Asia/Muscat', label: 'Muscat (Oman)', offset: 'GMT+4' },
  { value: 'Africa/Cairo', label: 'Cairo (Egypt)', offset: 'GMT+2' },
  { value: 'Asia/Amman', label: 'Amman (Jordan)', offset: 'GMT+2' },
  { value: 'Asia/Beirut', label: 'Beirut (Lebanon)', offset: 'GMT+2' },
  { value: 'Asia/Damascus', label: 'Damascus (Syria)', offset: 'GMT+2' },
  { value: 'Asia/Baghdad', label: 'Baghdad (Iraq)', offset: 'GMT+3' },
  
  // Europe
  { value: 'Europe/London', label: 'London (UK)', offset: 'GMT+0' },
  { value: 'Europe/Paris', label: 'Paris, Berlin, Rome', offset: 'GMT+1' },
  { value: 'Europe/Istanbul', label: 'Istanbul (Turkey)', offset: 'GMT+3' },
  { value: 'Europe/Moscow', label: 'Moscow (Russia)', offset: 'GMT+3' },
  
  // North America
  { value: 'America/New_York', label: 'New York (EST)', offset: 'GMT-5' },
  { value: 'America/Chicago', label: 'Chicago (CST)', offset: 'GMT-6' },
  { value: 'America/Denver', label: 'Denver (MST)', offset: 'GMT-7' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST)', offset: 'GMT-8' },
  { value: 'America/Toronto', label: 'Toronto (Canada)', offset: 'GMT-5' },
  
  // Asia
  { value: 'Asia/Karachi', label: 'Karachi (Pakistan)', offset: 'GMT+5' },
  { value: 'Asia/Kolkata', label: 'Mumbai, Delhi (India)', offset: 'GMT+5:30' },
  { value: 'Asia/Dhaka', label: 'Dhaka (Bangladesh)', offset: 'GMT+6' },
  { value: 'Asia/Bangkok', label: 'Bangkok (Thailand)', offset: 'GMT+7' },
  { value: 'Asia/Singapore', label: 'Singapore', offset: 'GMT+8' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong', offset: 'GMT+8' },
  { value: 'Asia/Shanghai', label: 'Shanghai, Beijing (China)', offset: 'GMT+8' },
  { value: 'Asia/Tokyo', label: 'Tokyo (Japan)', offset: 'GMT+9' },
  { value: 'Asia/Seoul', label: 'Seoul (South Korea)', offset: 'GMT+9' },
  
  // Australia & Pacific
  { value: 'Australia/Sydney', label: 'Sydney, Melbourne', offset: 'GMT+10' },
  { value: 'Australia/Perth', label: 'Perth', offset: 'GMT+8' },
  { value: 'Pacific/Auckland', label: 'Auckland (New Zealand)', offset: 'GMT+12' },
  
  // Africa
  { value: 'Africa/Johannesburg', label: 'Johannesburg (South Africa)', offset: 'GMT+2' },
  { value: 'Africa/Lagos', label: 'Lagos (Nigeria)', offset: 'GMT+1' },
  { value: 'Africa/Nairobi', label: 'Nairobi (Kenya)', offset: 'GMT+3' },
  
  // South America
  { value: 'America/Sao_Paulo', label: 'São Paulo (Brazil)', offset: 'GMT-3' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (Argentina)', offset: 'GMT-3' },
];

/**
 * Get user's browser timezone
 * الحصول على المنطقة الزمنية للمتصفح
 */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'Asia/Dubai'; // Default fallback
  }
}

/**
 * Get timezone label from value
 * الحصول على تسمية المنطقة الزمنية
 */
export function getTimezoneLabel(timezone: string): string {
  const found = commonTimezones.find(tz => tz.value === timezone);
  return found ? found.label : timezone;
}

/**
 * Get current time in specific timezone
 * الحصول على الوقت الحالي في منطقة زمنية محددة
 */
export function getCurrentTimeInTimezone(timezone: string): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1;
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
  const second = parseInt(parts.find(p => p.type === 'second')?.value || '0');
  
  return new Date(year, month, day, hour, minute, second);
}

/**
 * Format date in specific timezone
 * تنسيق التاريخ في منطقة زمنية محددة
 */
export function formatDateInTimezone(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  return formatter.format(date);
}
