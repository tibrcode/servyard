// Settings Component with Tabs
// مكون الإعدادات مع التبويبات

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Database, Calendar } from 'lucide-react';
import { NotificationSettings } from './NotificationSettings';
import { BackupSettings } from './BackupSettings';
import { CalendarSettings } from './CalendarSettings';
import { useTranslation } from '@/lib/i18n';

interface SettingsProps {
  userId: string;
  userType: 'customer' | 'provider';
  language?: 'ar' | 'en';
}

export function Settings({ userId, userType, language = 'ar' }: SettingsProps) {
  const { t, isRTL } = useTranslation(language);

  return (
    <div className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span>{isRTL ? 'الإشعارات' : 'Notifications'}</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{isRTL ? 'التقويم' : 'Calendar'}</span>
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span>{isRTL ? 'النسخ الاحتياطي' : 'Backup'}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <NotificationSettings userId={userId} language={language} />
        </TabsContent>

        <TabsContent value="calendar">
          <CalendarSettings language={language} />
        </TabsContent>

        <TabsContent value="backup">
          <BackupSettings 
            userId={userId} 
            userType={userType}
            language={language}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
