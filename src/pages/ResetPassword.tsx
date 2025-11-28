import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/integrations/firebase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, KeyRound, CheckCircle, XCircle, Eye, EyeOff, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface ResetPasswordProps {
  currentLanguage: string;
}

export default function ResetPassword({ currentLanguage }: ResetPasswordProps) {
  const { t, isRTL } = useTranslation(currentLanguage);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [invalidCode, setInvalidCode] = useState(false);

  const oobCode = searchParams.get("oobCode");

  // Translations with fallbacks
  const resetT = {
    title: (t as any).auth?.resetPassword || (isRTL ? "إعادة تعيين كلمة المرور" : "Reset Password"),
    subtitle: (t as any).auth?.resetPasswordSubtitle || (isRTL ? "أدخل كلمة المرور الجديدة" : "Enter your new password"),
    newPassword: (t as any).auth?.newPassword || (isRTL ? "كلمة المرور الجديدة" : "New Password"),
    confirmPassword: (t as any).auth?.confirmPassword || (isRTL ? "تأكيد كلمة المرور" : "Confirm Password"),
    save: (t as any).actions?.save || (isRTL ? "حفظ" : "Save"),
    saving: (t as any).auth?.saving || (isRTL ? "جاري الحفظ..." : "Saving..."),
    success: (t as any).auth?.passwordResetSuccess || (isRTL ? "تم تغيير كلمة المرور بنجاح" : "Password changed successfully"),
    successDesc: (t as any).auth?.passwordResetSuccessDesc || (isRTL ? "يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة" : "You can now login with your new password"),
    backToLogin: t.auth?.backToLogin || (isRTL ? "العودة لتسجيل الدخول" : "Back to Login"),
    invalidLink: (t as any).auth?.invalidResetLink || (isRTL ? "رابط غير صالح" : "Invalid Link"),
    invalidLinkDesc: (t as any).auth?.invalidResetLinkDesc || (isRTL ? "رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية" : "The password reset link is invalid or has expired"),
    requestNewLink: (t as any).auth?.requestNewLink || (isRTL ? "طلب رابط جديد" : "Request New Link"),
    passwordMismatch: (t as any).auth?.passwordMismatch || (isRTL ? "كلمات المرور غير متطابقة" : "Passwords do not match"),
    passwordTooShort: (t as any).auth?.passwordTooShort || (isRTL ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters"),
    forEmail: (t as any).auth?.forEmail || (isRTL ? "للبريد الإلكتروني" : "for"),
    verifying: (t as any).auth?.verifying || (isRTL ? "جاري التحقق..." : "Verifying..."),
  };

  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        setInvalidCode(true);
        setIsVerifying(false);
        return;
      }

      try {
        const emailFromCode = await verifyPasswordResetCode(auth, oobCode);
        setEmail(emailFromCode);
        setIsVerifying(false);
      } catch (err) {
        console.error("Invalid reset code:", err);
        setInvalidCode(true);
        setIsVerifying(false);
      }
    };

    verifyCode();
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError(resetT.passwordTooShort);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(resetT.passwordMismatch);
      return;
    }

    if (!oobCode) {
      setError(resetT.invalidLink);
      return;
    }

    setIsLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
    } catch (err: any) {
      console.error("Reset password error:", err);
      if (err.code === "auth/expired-action-code") {
        setError(isRTL ? "انتهت صلاحية الرابط، يرجى طلب رابط جديد" : "Link expired, please request a new one");
      } else if (err.code === "auth/invalid-action-code") {
        setError(isRTL ? "الرابط غير صالح أو تم استخدامه من قبل" : "Link is invalid or has already been used");
      } else if (err.code === "auth/weak-password") {
        setError(isRTL ? "كلمة المرور ضعيفة جداً" : "Password is too weak");
      } else {
        setError(isRTL ? "حدث خطأ، يرجى المحاولة مرة أخرى" : "An error occurred, please try again");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4" dir={isRTL ? "rtl" : "ltr"}>
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">{resetT.verifying}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid code state
  if (invalidCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4" dir={isRTL ? "rtl" : "ltr"}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-xl">{resetT.invalidLink}</CardTitle>
            <CardDescription>{resetT.invalidLinkDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full" 
              onClick={() => navigate("/auth")}
            >
              {resetT.requestNewLink}
            </Button>
            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={() => navigate("/auth")}
            >
              <ArrowIcon className="w-4 h-4 mx-2" />
              {resetT.backToLogin}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4" dir={isRTL ? "rtl" : "ltr"}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-xl text-green-600">{resetT.success}</CardTitle>
            <CardDescription>{resetT.successDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full luxury-button" 
              onClick={() => navigate("/auth")}
            >
              <ArrowIcon className="w-4 h-4 mx-2" />
              {resetT.backToLogin}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4" dir={isRTL ? "rtl" : "ltr"}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">{resetT.title}</CardTitle>
          <CardDescription>
            {resetT.forEmail} <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">{resetT.newPassword}</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  disabled={isLoading}
                  className="pe-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{resetT.confirmPassword}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  disabled={isLoading}
                  className="pe-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full luxury-button" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mx-2" />
                  {resetT.saving}
                </>
              ) : (
                resetT.save
              )}
            </Button>

            <Button 
              type="button"
              variant="ghost" 
              className="w-full" 
              onClick={() => navigate("/auth")}
              disabled={isLoading}
            >
              <ArrowIcon className="w-4 h-4 mx-2" />
              {resetT.backToLogin}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
