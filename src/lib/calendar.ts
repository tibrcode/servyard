import { Service, ProviderProfile } from "@/types/service";
import { Booking } from "@/types/booking";

export const generateGoogleCalendarUrl = (
  service: Service,
  provider: ProviderProfile,
  bookingDate: Date,
  isRTL: boolean = false
) => {
  const startTime = new Date(bookingDate);
  const endTime = new Date(startTime.getTime() + (service.duration_minutes || 60) * 60000);

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, "");
  };

  const title = encodeURIComponent(`${isRTL ? 'حجز:' : 'Booking:'} ${service.name}`);
  const details = encodeURIComponent(
    `${isRTL ? 'المزود:' : 'Provider:'} ${provider.full_name}\n` +
    `${isRTL ? 'الخدمة:' : 'Service:'} ${service.name}\n` +
    `${isRTL ? 'السعر:' : 'Price:'} ${service.approximate_price} ${provider.currency_code || 'AED'}`
  );
  const location = encodeURIComponent(provider.city || "");

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDate(startTime)}/${formatDate(endTime)}&details=${details}&location=${location}`;
};

export const downloadICSFile = (
  service: Service,
  provider: ProviderProfile,
  bookingDate: Date,
  isRTL: boolean = false
) => {
  const startTime = new Date(bookingDate);
  const endTime = new Date(startTime.getTime() + (service.duration_minutes || 60) * 60000);

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, "");
  };

  const title = `${isRTL ? 'حجز:' : 'Booking:'} ${service.name}`;
  const description = 
    `${isRTL ? 'المزود:' : 'Provider:'} ${provider.full_name}\\n` +
    `${isRTL ? 'الخدمة:' : 'Service:'} ${service.name}\\n` +
    `${isRTL ? 'السعر:' : 'Price:'} ${service.approximate_price} ${provider.currency_code || 'AED'}`;
  
  const location = provider.city || "";

  createAndDownloadICS(title, description, location, startTime, endTime);
};

export const downloadBookingICS = (
  booking: Booking,
  isRTL: boolean = false
) => {
  // Parse date and time
  const [year, month, day] = booking.booking_date.split('-').map(Number);
  const [startHour, startMinute] = booking.start_time.split(':').map(Number);
  const [endHour, endMinute] = booking.end_time.split(':').map(Number);

  const startTime = new Date(year, month - 1, day, startHour, startMinute);
  const endTime = new Date(year, month - 1, day, endHour, endMinute);

  const title = `${isRTL ? 'حجز:' : 'Booking:'} ${booking.service_title}`;
  const description = 
    `${isRTL ? 'العميل:' : 'Customer:'} ${booking.customer_name}\\n` +
    `${isRTL ? 'الهاتف:' : 'Phone:'} ${booking.customer_phone || 'N/A'}\\n` +
    `${isRTL ? 'السعر:' : 'Price:'} ${booking.price} ${booking.currency}\\n` +
    `${isRTL ? 'ملاحظات:' : 'Notes:'} ${booking.notes || ''}`;
  
  // For provider, location might be their own location or customer location if mobile
  // We'll leave location empty or generic for now as it's not always available in Booking object
  const location = ""; 

  createAndDownloadICS(title, description, location, startTime, endTime);
};

const createAndDownloadICS = (
  title: string,
  description: string,
  location: string,
  startTime: Date,
  endTime: Date
) => {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, "");
  };

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ServYard//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@servyard.com`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startTime)}`,
    `DTEND:${formatDate(endTime)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", "booking.ics");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
