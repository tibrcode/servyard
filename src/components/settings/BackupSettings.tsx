// Backup Settings Component
// مكون إعدادات النسخ الاحتياطي

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, Database, FileJson, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '@/integrations/firebase/client';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useTranslation } from '@/lib/i18n';

interface BackupSettingsProps {
  userId: string;
  userType: 'customer' | 'provider';
  language?: 'ar' | 'en';
}

export function BackupSettings({ userId, userType, language = 'ar' }: BackupSettingsProps) {
  const { toast } = useToast();
  const { t, isRTL } = useTranslation(language);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Export/Backup data
  const handleExportData = async () => {
    try {
      setIsExporting(true);
      
      const backupData: any = {
        exportDate: new Date().toISOString(),
        userType,
        userId,
        profile: null,
        bookings: [],
        reviews: [],
      };

      // Get profile
      const profileQuery = query(
        collection(db, 'profiles'),
        where('user_id', '==', userId)
      );
      const profileSnapshot = await getDocs(profileQuery);
      if (!profileSnapshot.empty) {
        backupData.profile = profileSnapshot.docs[0].data();
      }

      // Get bookings
      const bookingField = userType === 'customer' ? 'customer_id' : 'provider_id';
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where(bookingField, '==', profileSnapshot.docs[0]?.id || '')
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      backupData.bookings = bookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get reviews
      if (userType === 'customer') {
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('customer_id', '==', userId)
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        backupData.reviews = reviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else {
        // Provider reviews
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('provider_id', '==', profileSnapshot.docs[0]?.id || '')
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        backupData.reviews = reviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Get services
        const servicesQuery = query(
          collection(db, 'services'),
          where('provider_id', '==', profileSnapshot.docs[0]?.id || '')
        );
        const servicesSnapshot = await getDocs(servicesQuery);
        backupData.services = servicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Get offers
        const offersQuery = query(
          collection(db, 'offers'),
          where('provider_id', '==', profileSnapshot.docs[0]?.id || '')
        );
        const offersSnapshot = await getDocs(offersQuery);
        backupData.offers = offersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      // Create and download file
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      
      const date = new Date().toISOString().split('T')[0];
      const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
      link.download = `servyard_backup_${userType}_${date}_${time}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: isRTL ? 'تم تصدير البيانات' : 'Data Exported',
        description: isRTL ? 'تم حفظ النسخة الاحتياطية بنجاح' : 'Backup saved successfully',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: isRTL ? 'خطأ في التصدير' : 'Export Error',
        description: isRTL ? 'فشل في إنشاء النسخة الاحتياطية' : 'Failed to create backup',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Import/Restore data
  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const backupData = JSON.parse(e.target?.result as string);

          // Validate backup data
          if (!backupData.userId || !backupData.userType) {
            throw new Error('Invalid backup file format');
          }

          // Show confirmation with data summary
          const itemsCount = 
            (backupData.bookings?.length || 0) +
            (backupData.reviews?.length || 0) +
            (backupData.services?.length || 0) +
            (backupData.offers?.length || 0);

          const confirmed = window.confirm(
            isRTL 
              ? `هل تريد استعادة النسخة الاحتياطية؟\n\nتاريخ النسخة: ${new Date(backupData.exportDate).toLocaleString('ar-SA')}\nعدد العناصر: ${itemsCount}\n\nملاحظة: سيتم دمج البيانات مع البيانات الموجودة`
              : `Do you want to restore this backup?\n\nBackup Date: ${new Date(backupData.exportDate).toLocaleString()}\nItems: ${itemsCount}\n\nNote: Data will be merged with existing data`
          );

          if (!confirmed) {
            setIsImporting(false);
            return;
          }

          // Note: Actual import would require Cloud Functions with admin privileges
          // This is a placeholder for the UI
          toast({
            title: isRTL ? 'معلومة' : 'Information',
            description: isRTL 
              ? 'استعادة البيانات تتطلب صلاحيات إدارية. يرجى الاتصال بالدعم الفني.'
              : 'Data restoration requires admin privileges. Please contact support.',
            variant: 'default',
          });

        } catch (error) {
          console.error('Import error:', error);
          toast({
            title: isRTL ? 'خطأ في الاستيراد' : 'Import Error',
            description: isRTL ? 'فشل في قراءة ملف النسخة الاحتياطية' : 'Failed to read backup file',
            variant: 'destructive',
          });
        } finally {
          setIsImporting(false);
        }
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('File read error:', error);
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            <CardTitle>{isRTL ? 'تصدير البيانات' : 'Export Data'}</CardTitle>
          </div>
          <CardDescription>
            {isRTL 
              ? 'إنشاء نسخة احتياطية من جميع بياناتك'
              : 'Create a backup of all your data'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex items-start gap-2">
              <Database className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground">
                {isRTL 
                  ? 'سيتم تصدير: الملف الشخصي، الحجوزات، التقييمات'
                  : 'Will export: Profile, Bookings, Reviews'}
                {userType === 'provider' && (
                  <span>{isRTL ? '، الخدمات، العروض' : ', Services, Offers'}</span>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FileJson className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground">
                {isRTL 
                  ? 'صيغة الملف: JSON (يمكن فتحه بأي محرر نصوص)'
                  : 'File format: JSON (can be opened with any text editor)'}
              </div>
            </div>
          </div>

          <Button
            onClick={handleExportData}
            disabled={isExporting}
            className="w-full"
            size="lg"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting 
              ? (isRTL ? 'جاري التصدير...' : 'Exporting...') 
              : (isRTL ? 'تنزيل النسخة الاحتياطية' : 'Download Backup')}
          </Button>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            <CardTitle>{isRTL ? 'استيراد البيانات' : 'Import Data'}</CardTitle>
          </div>
          <CardDescription>
            {isRTL 
              ? 'استعادة أو دمج بيانات من نسخة احتياطية'
              : 'Restore or merge data from a backup'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                {isRTL 
                  ? 'تحذير: استعادة البيانات قد تستغرق بعض الوقت وتتطلب صلاحيات خاصة'
                  : 'Warning: Data restoration may take time and requires special permissions'}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="backup-file">
              {isRTL ? 'اختر ملف النسخة الاحتياطية' : 'Select Backup File'}
            </Label>
            <input
              id="backup-file"
              type="file"
              accept=".json"
              onChange={handleImportData}
              disabled={isImporting}
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90
                file:cursor-pointer cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {isImporting && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 animate-spin" />
              {isRTL ? 'جاري المعالجة...' : 'Processing...'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                {isRTL ? 'ملاحظات مهمة:' : 'Important Notes:'}
              </p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>{isRTL ? 'احتفظ بالنسخ الاحتياطية في مكان آمن' : 'Keep backups in a safe place'}</li>
                <li>{isRTL ? 'قم بإنشاء نسخة احتياطية بشكل دوري' : 'Create backups regularly'}</li>
                <li>{isRTL ? 'تحقق من صحة الملف قبل الاستيراد' : 'Verify file integrity before importing'}</li>
                <li>{isRTL ? 'الاستيراد سيدمج البيانات مع الموجودة' : 'Import will merge with existing data'}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
