import { auth, db } from "@/integrations/firebase/client";
import { deleteUser, reauthenticateWithPopup, GoogleAuthProvider } from "firebase/auth";
import { collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";

// Small helper to delete all docs from a query
async function deleteByQuery(col: string, field: string, value: string) {
  const q = query(collection(db, col), where(field, "==", value));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map(d => deleteDoc(doc(db, col, d.id))));
}

// Delete docs by service ids (for availability/special_dates/reviews)
async function deleteByServiceIds(col: string, serviceIds: string[]) {
  if (serviceIds.length === 0) return;
  for (const serviceId of serviceIds) {
    await deleteByQuery(col, "service_id", serviceId);
  }
}

export async function deleteCurrentUserFully() {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");

  // Try to infer role from profile doc
  let role: "provider" | "customer" | null = null;
  try {
    // Profiles hold user_type
    const profileRef = doc(db, "profiles", user.uid);
    const profileSnap = await import("firebase/firestore").then(m => m.getDoc(profileRef));
    const data = profileSnap.exists() ? profileSnap.data() as any : null;
    role = (data?.user_type as any) || null;
  } catch {}

  // 1) Provider-related cascades
  if (role === "provider") {
    // Fetch services created by provider
    const servicesQ = query(collection(db, "services"), where("provider_id", "==", user.uid));
    const servicesSnap = await getDocs(servicesQ);
    const serviceIds = servicesSnap.docs.map(d => d.id);

    // Delete availability/special dates for each service
    await deleteByServiceIds("service_availability", serviceIds);
    await deleteByServiceIds("service_special_dates", serviceIds);

    // Delete reviews addressed to provider services
    await deleteByQuery("reviews", "provider_id", user.uid);

    // Delete offers by provider
    await deleteByQuery("offers", "provider_id", user.uid);

    // Delete bookings where provider is owner
    await deleteByQuery("bookings", "provider_id", user.uid);

    // Finally delete services themselves
    await Promise.all(servicesSnap.docs.map(d => deleteDoc(doc(db, "services", d.id))));
  }

  // 2) Customer-related cascades (if user wrote reviews or booked services)
  await deleteByQuery("bookings", "customer_id", user.uid);
  await deleteByQuery("reviews", "customer_id", user.uid);

  // 3) Profile
  await deleteDoc(doc(db, "profiles", user.uid));

  // 4) Delete the Auth account (may require recent login)
  try {
    await deleteUser(user);
  } catch (err: any) {
    if (err?.code === "auth/requires-recent-login") {
      // Attempt silent reauth with Google if available
      try {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(user, provider);
        await deleteUser(user);
      } catch (reauthErr) {
        throw new Error("يجب إعادة تسجيل الدخول قبل حذف الحساب. سجّل دخولًا مرة أخرى ثم أعد المحاولة.");
      }
    } else {
      throw err;
    }
  }
}
