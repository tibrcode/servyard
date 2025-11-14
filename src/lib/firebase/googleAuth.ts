import { GoogleAuthProvider, signInWithPopup, signInWithCredential } from "firebase/auth";
import { auth } from "@/integrations/firebase/client";
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

// Initialize Google Auth for Capacitor
if (Capacitor.isNativePlatform()) {
  GoogleAuth.initialize({
    clientId: '866507388194-klhudvu1tasm4fp8dt4dd6f8ttinqhnq.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
    grantOfflineAccess: true,
  });
}

// Sign out from Google to force account selection
async function clearGoogleSession() {
  try {
    if (Capacitor.isNativePlatform()) {
      // Sign out from Google Auth to clear cached account
      await GoogleAuth.signOut().catch(() => {
        // Ignore errors if not signed in
      });
    }
  } catch (error) {
    console.log('Clear session error (ignored):', error);
  }
}

export async function signInWithGoogle() {
  try {
    // Clear previous session to force account selection
    await clearGoogleSession();
    
    // For native platforms (iOS/Android)
    if (Capacitor.isNativePlatform()) {
      // Force account selection on mobile
      const googleUser = await GoogleAuth.signIn();
      
      // Create Firebase credential from Google token
      const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
      
      // Sign in to Firebase with the credential
      const result = await signInWithCredential(auth, credential);
      return result;
    } 
    // For web
    else {
      const provider = new GoogleAuthProvider();
      // Force account selection on web
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      const result = await signInWithPopup(auth, provider);
      return result;
    }
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

// Function to sign out from Google on mobile
export async function signOutGoogle() {
  try {
    if (Capacitor.isNativePlatform()) {
      await GoogleAuth.signOut();
    }
    await auth.signOut();
  } catch (error) {
    console.error('Google Sign-Out Error:', error);
    throw error;
  }
}
