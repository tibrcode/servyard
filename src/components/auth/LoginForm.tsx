import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock } from "lucide-react";
import { auth, db } from "@/integrations/firebase/client";
import { signInWithGoogle } from "@/lib/firebase/googleAuth";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface LoginFormProps {
  currentLanguage: string;
}

export const LoginForm = ({ currentLanguage }: LoginFormProps) => {
  const { t } = useTranslation(currentLanguage);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      if (userCredential.user) {
        toast({
          title: t.auth.loginSuccess,
          description: t.auth.welcomeBack
        });
        
        // Navigate to auth page and let AuthContext handle redirect based on role
        navigate('/auth');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      let errorMessage = err.message || t.auth.loginError;
      
      // Handle specific Firebase auth errors
      if (errorMessage.includes('user-not-found')) {
        errorMessage = 'المستخدم غير موجود. يرجى التحقق من البريد الإلكتروني.';
      } else if (errorMessage.includes('wrong-password')) {
        errorMessage = 'كلمة المرور غير صحيحة.';
      } else if (errorMessage.includes('too-many-requests')) {
        errorMessage = 'تم تسجيل محاولات دخول كثيرة. يرجى المحاولة لاحقاً.';
      } else if (errorMessage.includes('network-request-failed')) {
        errorMessage = 'خطأ في الاتصال بالشبكة. يرجى المحاولة لاحقاً.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      const user = result.user;
      
      // Check if this is a new user by checking if profile exists in Firestore
      const profileRef = doc(db, 'profiles', user.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (!profileSnap.exists() || !profileSnap.data()?.user_type || profileSnap.data()?.user_type === 'unknown') {
        // New user or user without a role - redirect to role selection
        navigate('/select-role', { replace: true });
      } else {
        // Existing user with role - welcome back
        toast({ title: t.auth.loginSuccess, description: t.auth.welcomeBack });
        navigate('/auth', { replace: true });
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      let errorMessage = err?.message || t.auth.loginError;
      if (errorMessage.includes('popup-closed-by-user') || errorMessage.includes('User cancelled')) {
        errorMessage = '';
      } else if (errorMessage.includes('auth/popup-blocked')) {
        errorMessage = 'تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة أو المحاولة مجدداً.';
      }
      if (errorMessage) setError(errorMessage);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">{t.auth.login}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {t.auth.email}
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              placeholder={t.auth.emailPlaceholder}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              {t.auth.password}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange('password')}
              placeholder={t.auth.passwordPlaceholder}
              required
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full luxury-button" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {t.auth.login}
          </Button>
          
          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">أو</span>
            </div>
          </div>

          {/* Google Sign-In */}
          <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading}>
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 mr-2">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.201,6.053,28.791,4,24,4C12.955,4,4,12.955,4,24 s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.817C14.655,16.108,18.961,13,24,13c3.059,0,5.842,1.154,7.961,3.039 l5.657-5.657C33.201,6.053,28.791,4,24,4C16.318,4,9.656,8.336,6.306,14.691z"/>
                <path fill="#4CAF50" d="M24,44c4.721,0,9.039-1.807,12.304-4.757l-5.682-4.733C28.562,36.976,26.396,38,24,38 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.081,5.51 c0.001-0.001,0.002-0.001,0.003-0.002l5.682,4.733C35.56,39.205,40,35.333,42.443,30.59c0.643-1.498,1.043-3.122,1.168-4.807 C43.862,21.35,44,22.659,43.611,20.083z"/>
              </svg>
            )}
            {t.auth.continueWithGoogle || 'Continue with Google'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};