// Service Schedule Setup Component
// مكون إعداد الجدول الأسبوعي للخدمة

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ServiceSchedule, DayOfWeek, BreakTime } from '@/types/booking';
import { getDayName } from '@/lib/bookingUtils';
import { 
  createServiceSchedule, 
  updateServiceSchedule, 
  getAllServiceSchedules,
  bulkCreateSchedules 
} from '@/lib/firebase/bookingFunctions';
import { Calendar, Clock, Plus, Trash2, Copy, Save } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DaySchedule {
  day_of_week: DayOfWeek;
  is_active: boolean;
  start_time: string;
  end_time: string;
  break_times: BreakTime[];
  schedule_id?: string;
}

interface ServiceScheduleSetupProps {
  serviceId: string;
  providerId: string;
  language?: 'ar' | 'en';
  onScheduleChange?: () => void;
}

export function ServiceScheduleSetup({
  serviceId,
  providerId,
  language = 'ar',
  onScheduleChange,
}: ServiceScheduleSetupProps) {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(0);

  const isRTL = language === 'ar';

  // Translation
  const t = {
    title: isRTL ? 'الجدول الأسبوعي' : 'Weekly Schedule',
    subtitle: isRTL ? 'حدد ساعات العمل لكل يوم في الأسبوع' : 'Set working hours for each day of the week',
    workingHours: isRTL ? 'ساعات العمل' : 'Working Hours',
    startTime: isRTL ? 'وقت البداية' : 'Start Time',
    endTime: isRTL ? 'وقت النهاية' : 'End Time',
    breakTimes: isRTL ? 'فترات الراحة' : 'Break Times',
    addBreak: isRTL ? 'إضافة فترة راحة' : 'Add Break',
    removeBreak: isRTL ? 'حذف' : 'Remove',
    enableDay: isRTL ? 'تفعيل' : 'Enable',
    copyTo: isRTL ? 'نسخ إلى' : 'Copy to',
    allDays: isRTL ? 'كل الأيام' : 'All Days',
    weekdays: isRTL ? 'أيام الأسبوع' : 'Weekdays',
    weekend: isRTL ? 'عطلة نهاية الأسبوع' : 'Weekend',
    save: isRTL ? 'حفظ الجدول' : 'Save Schedule',
    saved: isRTL ? 'تم حفظ الجدول' : 'Schedule Saved',
    saveFailed: isRTL ? 'فشل حفظ الجدول' : 'Failed to Save',
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
    noBreaks: isRTL ? 'لا توجد فترات راحة' : 'No break times',
    closed: isRTL ? 'مغلق' : 'Closed',
  };

  // Initialize schedules for all days
  useEffect(() => {
    loadSchedules();
  }, [serviceId]);

  const loadSchedules = async () => {
    setIsLoading(true);
    try {
      console.log('📥 Loading schedules for service:', serviceId);
      const existingSchedules = await getAllServiceSchedules(serviceId);
      console.log('📋 Found existing schedules:', existingSchedules.length);
      
      // Create schedule objects for all 7 days
      const allDays: DaySchedule[] = [];
      for (let day = 0; day < 7; day++) {
        const existing = existingSchedules.find(s => s.day_of_week === day);
        
        if (existing) {
          console.log(`✅ Day ${day} has schedule: ${existing.start_time}-${existing.end_time} (active: ${existing.is_active})`);
          allDays.push({
            day_of_week: day as DayOfWeek,
            is_active: existing.is_active,
            start_time: existing.start_time,
            end_time: existing.end_time,
            break_times: existing.break_times || [],
            schedule_id: existing.schedule_id,
          });
        } else {
          console.log(`⚠️ Day ${day} has no schedule, using defaults`);
          // Default schedule
          allDays.push({
            day_of_week: day as DayOfWeek,
            is_active: day !== 5, // Friday closed by default
            start_time: '09:00',
            end_time: '21:00',
            break_times: [],
          });
        }
      }
      
      setSchedules(allDays);
    } catch (error) {
      console.error('❌ Error loading schedules:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'فشل تحميل الجدول' : 'Failed to load schedule',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateDaySchedule = (day: DayOfWeek, updates: Partial<DaySchedule>) => {
    setSchedules(prev =>
      prev.map(schedule =>
        schedule.day_of_week === day
          ? { ...schedule, ...updates }
          : schedule
      )
    );
  };

  const addBreakTime = (day: DayOfWeek) => {
    const schedule = schedules.find(s => s.day_of_week === day);
    if (!schedule) return;

    const newBreak: BreakTime = {
      start: '13:00',
      end: '14:00',
    };

    updateDaySchedule(day, {
      break_times: [...schedule.break_times, newBreak],
    });
  };

  const removeBreakTime = (day: DayOfWeek, index: number) => {
    const schedule = schedules.find(s => s.day_of_week === day);
    if (!schedule) return;

    updateDaySchedule(day, {
      break_times: schedule.break_times.filter((_, i) => i !== index),
    });
  };

  const updateBreakTime = (
    day: DayOfWeek,
    index: number,
    field: 'start' | 'end',
    value: string
  ) => {
    const schedule = schedules.find(s => s.day_of_week === day);
    if (!schedule) return;

    const newBreakTimes = [...schedule.break_times];
    newBreakTimes[index] = {
      ...newBreakTimes[index],
      [field]: value,
    };

    updateDaySchedule(day, { break_times: newBreakTimes });
  };

  const copySchedule = async (targetType: 'all' | 'weekdays' | 'weekend') => {
    const sourceSchedule = schedules.find(s => s.day_of_week === selectedDay);
    if (!sourceSchedule) return;

    const targetDays: DayOfWeek[] = [];
    
    if (targetType === 'all') {
      targetDays.push(0, 1, 2, 3, 4, 5, 6);
    } else if (targetType === 'weekdays') {
      targetDays.push(0, 1, 2, 3, 4); // Sunday-Thursday
    } else {
      targetDays.push(5, 6); // Friday-Saturday
    }

    setSchedules(prev =>
      prev.map(schedule =>
        targetDays.includes(schedule.day_of_week)
          ? {
              ...schedule,
              start_time: sourceSchedule.start_time,
              end_time: sourceSchedule.end_time,
              break_times: [...sourceSchedule.break_times],
            }
          : schedule
      )
    );

    toast({
      title: isRTL ? 'تم النسخ' : 'Copied',
      description: isRTL ? 'تم نسخ الجدول بنجاح' : 'Schedule copied successfully',
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validate times
      for (const schedule of schedules) {
        if (schedule.is_active) {
          if (schedule.start_time >= schedule.end_time) {
            toast({
              title: isRTL ? 'خطأ' : 'Error',
              description: `${getDayName(schedule.day_of_week, language)}: ${
                isRTL ? 'وقت البداية يجب أن يكون قبل وقت النهاية' : 'Start time must be before end time'
              }`,
              variant: 'destructive',
            });
            return;
          }

          // Validate break times
          for (const breakTime of schedule.break_times) {
            if (breakTime.start >= breakTime.end) {
              toast({
                title: isRTL ? 'خطأ' : 'Error',
                description: isRTL ? 'أوقات الراحة غير صحيحة' : 'Invalid break times',
                variant: 'destructive',
              });
              return;
            }
          }
        }
      }

      // Save each schedule
      for (const schedule of schedules) {
        const scheduleData = {
          service_id: serviceId,
          provider_id: providerId,
          day_of_week: schedule.day_of_week,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          break_times: schedule.break_times,
          is_active: schedule.is_active,
        };

        console.log('💾 Saving schedule:', {
          day: schedule.day_of_week,
          active: schedule.is_active,
          times: `${schedule.start_time} - ${schedule.end_time}`,
          breaks: schedule.break_times.length
        });

        if (schedule.schedule_id) {
          // Update existing
          await updateServiceSchedule(schedule.schedule_id, scheduleData);
          console.log('✅ Updated schedule:', schedule.schedule_id);
        } else {
          // Create new
          const newId = await createServiceSchedule(scheduleData);
          schedule.schedule_id = newId;
          console.log('✅ Created new schedule:', newId);
        }
      }

      toast({
        title: t.saved,
        description: isRTL ? 'تم حفظ الجدول الأسبوعي بنجاح' : 'Weekly schedule saved successfully',
      });

      if (onScheduleChange) {
        onScheduleChange();
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: t.saveFailed,
        description: isRTL ? 'حدث خطأ أثناء الحفظ' : 'An error occurred while saving',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card dir={isRTL ? 'rtl' : 'ltr'}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <p className="text-muted-foreground">{t.loading}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentSchedule = schedules.find(s => s.day_of_week === selectedDay);

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Day Selector */}
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {schedules.map((schedule) => (
            <Button
              key={schedule.day_of_week}
              variant={selectedDay === schedule.day_of_week ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDay(schedule.day_of_week)}
              className="flex flex-col h-auto py-3 md:py-2 px-1 md:px-3 min-w-0"
            >
              <span className="text-[10px] md:text-xs font-normal md:truncate w-full writing-mode-vertical-rl md:writing-mode-horizontal rotate-180 md:rotate-0 whitespace-nowrap">
                {getDayName(schedule.day_of_week, language)}
              </span>
              {schedule.is_active ? (
                <span className="text-[9px] md:text-[10px] text-muted-foreground mt-1 md:truncate w-full writing-mode-vertical-rl md:writing-mode-horizontal rotate-180 md:rotate-0 whitespace-nowrap">
                  {schedule.start_time}
                </span>
              ) : (
                <span className="text-[9px] md:text-[10px] text-destructive mt-1 writing-mode-vertical-rl md:writing-mode-horizontal rotate-180 md:rotate-0">{t.closed}</span>
              )}
            </Button>
          ))}
        </div>

        <Separator />

        {currentSchedule && (
          <>
            {/* Enable Day Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor={`enable-${selectedDay}`} className="text-base font-semibold">
                {getDayName(selectedDay, language)}
              </Label>
              <Switch
                id={`enable-${selectedDay}`}
                checked={currentSchedule.is_active}
                onCheckedChange={(checked) =>
                  updateDaySchedule(selectedDay, { is_active: checked })
                }
              />
            </div>

            {currentSchedule.is_active && (
              <>
                {/* Working Hours */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 text-sm md:text-base">
                    <Clock className="h-4 w-4" />
                    {t.workingHours}
                  </Label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">{t.startTime}</Label>
                      <Input
                        type="time"
                        value={currentSchedule.start_time}
                        onChange={(e) => {
                          updateDaySchedule(selectedDay, { start_time: e.target.value });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">{t.endTime}</Label>
                      <Input
                        type="time"
                        value={currentSchedule.end_time}
                        onChange={(e) => {
                          updateDaySchedule(selectedDay, { end_time: e.target.value });
                        }}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Break Times */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>{t.breakTimes}</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBreakTime(selectedDay)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {t.addBreak}
                    </Button>
                  </div>

                  {currentSchedule.break_times.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t.noBreaks}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {currentSchedule.break_times.map((breakTime, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={breakTime.start}
                            onChange={(e) => {
                              updateBreakTime(selectedDay, index, 'start', e.target.value);
                            }}
                            className="flex-1"
                          />
                          <span className="text-muted-foreground">-</span>
                          <Input
                            type="time"
                            value={breakTime.end}
                            onChange={(e) => {
                              updateBreakTime(selectedDay, index, 'end', e.target.value);
                            }}
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBreakTime(selectedDay, index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Copy Actions */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm md:text-base">
                    <Copy className="h-4 w-4" />
                    {t.copyTo}
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copySchedule('all')}
                      className="flex-1"
                    >
                      {t.allDays}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copySchedule('weekdays')}
                      className="flex-1"
                    >
                      {t.weekdays}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copySchedule('weekend')}
                      className="flex-1"
                    >
                      {t.weekend}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        <Separator />

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
          size="lg"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : t.save}
        </Button>
      </CardContent>
    </Card>
  );
}
