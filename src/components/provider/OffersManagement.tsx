import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Edit, Calendar, Percent, DollarSign, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/firebase/client";
import { collection, addDoc, getDocs, query, where, updateDoc, doc, orderBy, deleteDoc } from "firebase/firestore";
import { Offer } from "@/lib/firebase/collections";
import { useTranslation } from "@/lib/i18n";

interface OffersManagementProps {
  currentLanguage: string;
}

export function OffersManagement({ currentLanguage }: OffersManagementProps) {
  const { user } = useAuth();
  const { t } = useTranslation(currentLanguage);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discount_type: "percentage" as "percentage" | "amount",
    discount_percentage: "",
    discount_amount: "",
    valid_from: "",
    valid_until: "",
    is_active: true
  });

  const loadOffers = async () => {
    if (!user) return;
    try {
      let offersQuery = query(
        collection(db, 'offers'),
        where('provider_id', '==', user.uid),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(offersQuery);
      const offersData = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data() as any;
        return {
          id: docSnap.id,
          provider_id: data.provider_id,
          title: data.title,
          description: data.description,
          discount_percentage: data.discount_percentage,
          discount_amount: data.discount_amount,
          valid_from: data.valid_from,
          valid_until: data.valid_until,
          is_active: data.is_active,
          created_at: data.created_at,
          updated_at: data.updated_at
        } as Offer;
      });

      setOffers(offersData);
    } catch (error) {
      // Fallback without orderBy
      try {
        const simpleQuery = query(
          collection(db, 'offers'),
          where('provider_id', '==', user.uid)
        );
        const querySnapshot = await getDocs(simpleQuery);
        const offersData = querySnapshot.docs.map(docSnap => {
          const data = docSnap.data() as any;
          return {
            id: docSnap.id,
            provider_id: data.provider_id,
            title: data.title,
            description: data.description,
            discount_percentage: data.discount_percentage,
            discount_amount: data.discount_amount,
            valid_from: data.valid_from,
            valid_until: data.valid_until,
            is_active: data.is_active,
            created_at: data.created_at,
            updated_at: data.updated_at
          } as Offer;
        });

        // Sort client-side if dates available
        offersData.sort((a, b) => {
          const dateA = a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at);
          const dateB = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at);
          return dateB.getTime() - dateA.getTime();
        });

        setOffers(offersData);
      } catch (e) {
        console.error('Error loading offers:', e);
        toast.error(t.offers.messages?.loadError || t.toast.error);
      }
    }
  };

  const handleOpenDialog = (offer?: Offer) => {
    if (offer) {
      // Editing existing offer - safe date conversion
      const safeToISODate = (dateField: any): string => {
        try {
          if (!dateField) return '';
          const date = dateField.seconds ? dateField.toDate() : new Date(dateField);
          if (isNaN(date.getTime())) return '';
          return date.toISOString().split('T')[0];
        } catch {
          return '';
        }
      };

      setEditingOffer(offer);
      setFormData({
        title: offer.title,
        description: offer.description || "",
        discount_type: offer.discount_percentage ? "percentage" : "amount",
        discount_percentage: offer.discount_percentage?.toString() || "",
        discount_amount: offer.discount_amount?.toString() || "",
        valid_from: safeToISODate(offer.valid_from),
        valid_until: safeToISODate(offer.valid_until),
        is_active: offer.is_active
      });
    } else {
      // Creating new offer
      setEditingOffer(null);
      setFormData({
        title: "",
        description: "",
        discount_type: "percentage",
        discount_percentage: "",
        discount_amount: "",
        valid_from: "",
        valid_until: "",
        is_active: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.valid_from || !formData.valid_until || !user) {
      toast.error(t.offers.messages?.requiredFields || t.ui.errorLoadingServices);
      return;
    }

    // Validate discount values
    if (formData.discount_type === 'percentage') {
      if (!formData.discount_percentage || parseFloat(formData.discount_percentage) <= 0 || parseFloat(formData.discount_percentage) > 100) {
        toast.error(t.offers.messages?.invalidDiscountPercentage || t.toast.error);
        return;
      }
    } else {
      if (!formData.discount_amount || parseFloat(formData.discount_amount) <= 0) {
        toast.error(t.offers.messages?.invalidDiscountAmount || t.toast.error);
        return;
      }
    }

    if (new Date(formData.valid_from) >= new Date(formData.valid_until)) {
      toast.error(t.offers.messages?.endDateAfterStart || t.toast.error);
      return;
    }

    setLoading(true);
    try {
      if (editingOffer) {
        // Update existing offer
        const offerData = {
          title: formData.title,
          description: formData.description || null,
          discount_percentage: formData.discount_type === 'percentage' ? parseFloat(formData.discount_percentage) : null,
          discount_amount: formData.discount_type === 'amount' ? parseFloat(formData.discount_amount) : null,
          valid_from: new Date(formData.valid_from),
          valid_until: new Date(formData.valid_until),
          is_active: formData.is_active,
          updated_at: new Date()
        };

        await updateDoc(doc(db, 'offers', editingOffer.id), offerData);
        toast.success(t.offers.messages?.updatedSuccess || t.editProfile.successTitle);
      } else {
        // Create new offer
        const offerData = {
          provider_id: user.uid,
          title: formData.title,
          description: formData.description || null,
          discount_type: formData.discount_type,
          discount_percentage: formData.discount_type === 'percentage' ? parseFloat(formData.discount_percentage) : null,
          discount_amount: formData.discount_type === 'amount' ? parseFloat(formData.discount_amount) : null,
          valid_from: new Date(formData.valid_from),
          valid_until: new Date(formData.valid_until),
          is_active: formData.is_active,
          created_at: new Date(),
          updated_at: new Date()
        };

        await addDoc(collection(db, 'offers'), offerData);
        toast.success(t.offers.messages?.createdSuccess || t.editProfile.successTitle);
      }

      setIsDialogOpen(false);
      setEditingOffer(null);
      loadOffers(); // Reload offers
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error(editingOffer ? (t.offers.messages?.saveErrorUpdate || t.toast.error) : (t.offers.messages?.saveErrorCreate || t.toast.error));
    } finally {
      setLoading(false);
    }
  };

  const isOfferExpired = (validUntil: any) => {
    const endDate = validUntil.seconds ? validUntil.toDate() : new Date(validUntil);
    return endDate < new Date();
  };

  const isOfferUpcoming = (validFrom: any) => {
    const startDate = validFrom.seconds ? validFrom.toDate() : new Date(validFrom);
    return startDate > new Date();
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!window.confirm(t.offers.messages?.deleteConfirm || 'Are you sure?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'offers', offerId));
      toast.success(t.offers.messages?.deleteSuccess || t.editProfile.successTitle);
      loadOffers(); // Reload offers
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error(t.offers.messages?.deleteError || t.toast.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{t.offers.offersManagement}</h2>
          <p className="text-muted-foreground">{t.offers.createManageOffers}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (open) {
            handleOpenDialog();
          } else {
            setIsDialogOpen(false);
            setEditingOffer(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t.offers.addNewOffer}
            </Button>
          </DialogTrigger>
          <DialogContent 
            className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
            onInteractOutside={(e) => {
              // Prevent closing on mobile when tapping outside
              if (window.innerWidth < 640) {
                e.preventDefault();
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>{editingOffer ? t.offers.editOffer : t.offers.addNewOffer}</DialogTitle>
              <DialogDescription>
                {editingOffer ? t.offers.editOfferDetails : t.offers.fillDetailsCreateOffer}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pb-2">
              <div className="space-y-2">
                <Label htmlFor="title">{t.offers.offerTitle}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t.offers.offerTitleExample}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t.offers.offerDescription}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t.offers.offerDetailsConditions}
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <Label>{t.offers.discountType}</Label>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="percentage"
                      name="discountType"
                      checked={formData.discount_type === "percentage"}
                      onChange={() => setFormData({ ...formData, discount_type: "percentage" })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="percentage" className="cursor-pointer">{t.offers.percentage}</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="amount"
                      name="discountType"
                      checked={formData.discount_type === "amount"}
                      onChange={() => setFormData({ ...formData, discount_type: "amount" })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="amount" className="cursor-pointer">{t.offers.fixedAmount}</label>
                  </div>
                </div>

                {formData.discount_type === "percentage" ? (
                  <div className="space-y-2">
                    <Label htmlFor="discount_percentage">{t.offers.discountPercentage}</Label>
                    <Input
                      id="discount_percentage"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                      placeholder="20"
                      required={formData.discount_type === 'percentage'}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="discount_amount">{t.offers.discountAmount}</Label>
                    <Input
                      id="discount_amount"
                      type="number"
                      min="1"
                      step="0.01"
                      value={formData.discount_amount}
                      onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                      placeholder="50.00"
                      required={formData.discount_type === 'amount'}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valid_from">{t.offers.startDate}</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valid_until">{t.offers.endDate}</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="active">{t.offers.activeOffer}</Label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2 sm:space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={loading} className="w-full sm:w-auto">
                  {t.actions.cancel}
                </Button>
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? (editingOffer ? t.offers.updating : t.offers.adding) : (editingOffer ? t.offers.update : t.offers.add)}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Offers List */}
      <div className="grid gap-4">
        {offers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-muted-foreground text-center">
                <Percent className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">{t.offers.noOffers}</h3>
                <p>{t.offers.createFirstOffer}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          offers.map((offer) => {
            const isExpired = isOfferExpired(offer.valid_until);
            const isUpcoming = isOfferUpcoming(offer.valid_from);

            return (
              <Card key={offer.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{offer.title}</CardTitle>
                        <div className="flex gap-2">
                          <Badge variant={offer.is_active ? "default" : "secondary"}>
                            {offer.is_active ? t.offers.active : t.offers.inactive}
                          </Badge>
                          {isExpired && (
                            <Badge variant="destructive">{t.offers.expired}</Badge>
                          )}
                          {isUpcoming && (
                            <Badge variant="outline">{t.offers.upcoming}</Badge>
                          )}
                        </div>
                      </div>
                      {offer.description && (
                        <CardDescription className="mt-2">
                          {offer.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDialog(offer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteOffer(offer.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {offer.discount_percentage ? (
                        <>
                          <Percent className="h-4 w-4" />
                          <span>
                            {offer.discount_percentage}
                            {t.offers.off || '%'}
                          </span>
                        </>
                      ) : (
                        <>
                          <DollarSign className="h-4 w-4" />
                          <span>
                            {offer.discount_amount} {t.offers.currencySar || ''}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(offer.valid_from.seconds ? offer.valid_from.toDate() : offer.valid_from).toLocaleDateString(currentLanguage)} -
                        {new Date(offer.valid_until.seconds ? offer.valid_until.toDate() : offer.valid_until).toLocaleDateString(currentLanguage)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}