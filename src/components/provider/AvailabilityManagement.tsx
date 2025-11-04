import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { auth, db } from "@/integrations/firebase/client";
import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
import { Plus, Edit, Calendar, Clock, Copy, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface Service {
  id: string;
  name: string;
}

interface ServiceAvailability {
  id: string;
  service_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface ServiceSpecialDate {
  id: string;
  service_id: string;
  special_date: string;
  is_available: boolean;
  note?: string;
}

interface AvailabilityManagementProps {
  services: Service[];
  currentLanguage: string;
}

export function AvailabilityManagement({ services, currentLanguage }: AvailabilityManagementProps) {
  const { t } = useTranslation(currentLanguage);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [availability, setAvailability] = useState<ServiceAvailability[]>([]);
  const [specialDates, setSpecialDates] = useState<ServiceSpecialDate[]>([]);
  const [selectedService, setSelectedService] = useState<string>("");
  const [isAvailabilityDialogOpen, setIsAvailabilityDialogOpen] = useState(false);
  const [isSpecialDateDialogOpen, setIsSpecialDateDialogOpen] = useState(false);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);

  const daysOfWeek = [
    { value: 0, label: new Date(2024, 8, 1).toLocaleDateString(currentLanguage, { weekday: 'long' }) }, // Sunday reference
    { value: 1, label: new Date(2024, 8, 2).toLocaleDateString(currentLanguage, { weekday: 'long' }) }, // Monday
    { value: 2, label: new Date(2024, 8, 3).toLocaleDateString(currentLanguage, { weekday: 'long' }) }, // Tuesday
    { value: 3, label: new Date(2024, 8, 4).toLocaleDateString(currentLanguage, { weekday: 'long' }) }, // Wednesday
    { value: 4, label: new Date(2024, 8, 5).toLocaleDateString(currentLanguage, { weekday: 'long' }) }, // Thursday
    { value: 5, label: new Date(2024, 8, 6).toLocaleDateString(currentLanguage, { weekday: 'long' }) }, // Friday
    { value: 6, label: new Date(2024, 8, 7).toLocaleDateString(currentLanguage, { weekday: 'long' }) }, // Saturday
  ];

  const [availabilityForm, setAvailabilityForm] = useState({
    service_id: "",
    day_of_week: "",
    start_time: "",
    end_time: "",
    is_available: true
  });

  const [specialDateForm, setSpecialDateForm] = useState({
    service_id: "",
    special_date: "",
    is_available: false,
    note: ""
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (services.length > 0) {
      setSelectedService(services[0].id);
    }
  }, [services]);

  const loadAvailability = useCallback(async () => {
    if (!selectedService || !currentUser) return;

    try {
      const availabilityQuery = query(
        collection(db, 'service_availability'),
        where('service_id', '==', selectedService),
        where('provider_id', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(availabilityQuery);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ServiceAvailability[];

      setAvailability(data);
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  }, [selectedService, currentUser]);

  const loadSpecialDates = useCallback(async () => {
    if (!selectedService || !currentUser) return;

    try {
      const specialDatesQuery = query(
        collection(db, 'service_special_dates'),
        where('service_id', '==', selectedService),
        where('provider_id', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(specialDatesQuery);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ServiceSpecialDate[];

      setSpecialDates(data);
    } catch (error) {
      console.error('Error loading special dates:', error);
    }
  }, [selectedService, currentUser]);

  useEffect(() => {
    if (selectedService && currentUser) {
      loadAvailability();
      loadSpecialDates();
    }
  }, [selectedService, currentUser, loadAvailability, loadSpecialDates]);

  const handleAvailabilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!availabilityForm.service_id || !availabilityForm.day_of_week ||
      !availabilityForm.start_time || !availabilityForm.end_time || !currentUser) {
      toast.error(t.availability.messages?.requiredFields || t.ui.errorLoadingServices);
      return;
    }

    if (availabilityForm.start_time >= availabilityForm.end_time) {
      toast.error(t.availability.messages?.endTimeAfterStart || t.ui.errorLoadingServices);
      return;
    }

    try {
      // Check if availability already exists for this day
      const existingAvailability = availability.find(
        a => a.day_of_week === parseInt(availabilityForm.day_of_week)
      );

      if (existingAvailability) {
        // Update existing
        await updateDoc(doc(db, 'service_availability', existingAvailability.id), {
          start_time: availabilityForm.start_time,
          end_time: availabilityForm.end_time,
          is_available: availabilityForm.is_available,
          updated_at: new Date()
        });
        toast.success(t.availability.messages?.updatedSuccess || t.editProfile.successTitle);
      } else {
        // Create new
        await addDoc(collection(db, 'service_availability'), {
          service_id: availabilityForm.service_id,
          provider_id: currentUser.uid,
          day_of_week: parseInt(availabilityForm.day_of_week),
          start_time: availabilityForm.start_time,
          end_time: availabilityForm.end_time,
          is_available: availabilityForm.is_available,
          created_at: new Date()
        });
        toast.success(t.availability.messages?.createdSuccess || t.editProfile.successTitle);
      }

      setIsAvailabilityDialogOpen(false);
      loadAvailability();
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error(t.availability.messages?.saveError || t.toast.error);
    }
  };

  const handleSpecialDateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!specialDateForm.service_id || !specialDateForm.special_date || !currentUser) {
      toast.error(t.availability.messages?.specialDateRequiredFields || t.ui.errorLoadingServices);
      return;
    }

    try {
      await addDoc(collection(db, 'service_special_dates'), {
        service_id: specialDateForm.service_id,
        provider_id: currentUser.uid,
        special_date: specialDateForm.special_date,
        is_available: specialDateForm.is_available,
        note: specialDateForm.note || null,
        created_at: new Date()
      });

      toast.success(t.availability.messages?.specialDateCreatedSuccess || t.editProfile.successTitle);
      setIsSpecialDateDialogOpen(false);
      loadSpecialDates();

      // Reset form
      setSpecialDateForm({
        service_id: selectedService,
        special_date: "",
        is_available: false,
        note: ""
      });
    } catch (error) {
      console.error('Error saving special date:', error);
      toast.error(t.availability.messages?.specialDateSaveError || t.toast.error);
    }
  };

  const openAvailabilityDialog = (dayOfWeek?: number) => {
    const existingAvailability = dayOfWeek !== undefined ?
      availability.find(a => a.day_of_week === dayOfWeek) : null;

    setAvailabilityForm({
      service_id: selectedService,
      day_of_week: dayOfWeek !== undefined ? dayOfWeek.toString() : "",
      start_time: existingAvailability?.start_time || "09:00",
      end_time: existingAvailability?.end_time || "17:00",
      is_available: existingAvailability?.is_available ?? true
    });
    setIsAvailabilityDialogOpen(true);
  };

  const openSpecialDateDialog = () => {
    setSpecialDateForm({
      service_id: selectedService,
      special_date: "",
      is_available: false,
      note: ""
    });
    setIsSpecialDateDialogOpen(true);
  };

  if (!currentUser) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t.availability.availabilityManagement}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{t.availability.availabilityManagement}</h2>
          <p className="text-muted-foreground">{t.availability.setWorkingHours}</p>
        </div>
      </div>

      {/* Service Selector */}
      <Card>
        <CardHeader>
          <CardTitle>{t.availability.serviceSelection}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedService} onValueChange={setSelectedService}>
            <SelectTrigger>
              <SelectValue placeholder={t.availability.selectService} />
            </SelectTrigger>
            <SelectContent>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedService && (
        <>
          {/* Weekly Availability */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{t.availability.weeklyAvailability}</CardTitle>
                  <CardDescription>
                    {t.availability.setAvailableDaysTime}
                  </CardDescription>
                </div>
                <Dialog open={isAvailabilityDialogOpen} onOpenChange={setIsAvailabilityDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openAvailabilityDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t.availability.addAvailability}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t.availability.editAvailability}</DialogTitle>
                      <DialogDescription>
                        {t.availability.setAvailableDaysTime}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAvailabilitySubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>{t.availability.day}</Label>
                        <Select
                          value={availabilityForm.day_of_week}
                          onValueChange={(value) => setAvailabilityForm({ ...availabilityForm, day_of_week: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t.availability.selectDay} />
                          </SelectTrigger>
                          <SelectContent>
                            {daysOfWeek.map((day) => (
                              <SelectItem key={day.value} value={day.value.toString()}>
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t.availability.startTime}</Label>
                          <Input
                            type="time"
                            value={availabilityForm.start_time}
                            onChange={(e) => setAvailabilityForm({ ...availabilityForm, start_time: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t.availability.endTime}</Label>
                          <Input
                            type="time"
                            value={availabilityForm.end_time}
                            onChange={(e) => setAvailabilityForm({ ...availabilityForm, end_time: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={availabilityForm.is_available}
                          onCheckedChange={(checked) => setAvailabilityForm({ ...availabilityForm, is_available: checked })}
                        />
                        <Label>{t.availability.available}</Label>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsAvailabilityDialogOpen(false)}>
                          {t.actions.cancel}
                        </Button>
                        <Button type="submit">{t.actions.save}</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {daysOfWeek.map((day) => {
                  const dayAvailability = availability.find(a => a.day_of_week === day.value);

                  return (
                    <div key={day.value} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="font-medium w-20">{day.label}</span>
                        {dayAvailability ? (
                          <div className="flex items-center gap-4">
                            <Badge variant={dayAvailability.is_available ? "default" : "secondary"}>
                              {dayAvailability.is_available ? t.availability.available : t.availability.notAvailable}
                            </Badge>
                            {dayAvailability.is_available && (
                              <span className="text-sm text-muted-foreground">
                                {dayAvailability.start_time} - {dayAvailability.end_time}
                              </span>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline">{t.availability.notSet}</Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAvailabilityDialog(day.value)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Special Dates */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{t.availability.specialDates}</CardTitle>
                  <CardDescription>
                    {t.availability.addHolidaysSpecialDays}
                  </CardDescription>
                </div>
                <Dialog open={isSpecialDateDialogOpen} onOpenChange={setIsSpecialDateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openSpecialDateDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t.availability.addSpecialDate}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t.availability.addSpecialDate}</DialogTitle>
                      <DialogDescription>
                        {t.availability.setSpecialDateHoliday}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSpecialDateSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>{t.availability.date}</Label>
                        <Input
                          type="date"
                          value={specialDateForm.special_date}
                          onChange={(e) => setSpecialDateForm({ ...specialDateForm, special_date: e.target.value })}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={specialDateForm.is_available}
                          onCheckedChange={(checked) => setSpecialDateForm({ ...specialDateForm, is_available: checked })}
                        />
                        <Label>{t.availability.availableForWork}</Label>
                      </div>

                      <div className="space-y-2">
                        <Label>{t.availability.noteOptional}</Label>
                        <Textarea
                          value={specialDateForm.note}
                          onChange={(e) => setSpecialDateForm({ ...specialDateForm, note: e.target.value })}
                          placeholder={t.availability.noteExample}
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsSpecialDateDialogOpen(false)}>
                          {t.actions.cancel}
                        </Button>
                        <Button type="submit">{t.actions.save}</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {specialDates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t.availability.noSpecialDatesAvailable}</p>
                  </div>
                ) : (
                  specialDates.map((date) => (
                    <div key={date.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4" />
                        <div>
                          <span className="font-medium">{new Date(date.special_date).toLocaleDateString(currentLanguage)}</span>
                          {date.note && (
                            <p className="text-sm text-muted-foreground">{date.note}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant={date.is_available ? "default" : "secondary"}>
                        {date.is_available ? t.availability.available : t.availability.notAvailable}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}