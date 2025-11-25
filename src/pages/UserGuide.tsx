import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { 
  Search, 
  User, 
  Calendar, 
  Star, 
  Heart, 
  MapPin, 
  Bell, 
  Settings,
  Building2,
  ShoppingBag,
  Globe,
  Clock,
  Shield,
  HelpCircle
} from "lucide-react";

interface UserGuideProps {
  currentLanguage: string;
}

const UserGuide = ({ currentLanguage }: UserGuideProps) => {
  const { t, isRTL } = useTranslation(currentLanguage);
  
  const guide = t.userGuide;

  const sections = [
    {
      icon: Search,
      title: guide?.gettingStarted?.title || "Getting Started",
      content: guide?.gettingStarted?.content || "Welcome to ServYard! Start by browsing services or creating an account.",
      steps: guide?.gettingStarted?.steps || [
        "Browse available services on the homepage",
        "Use the search to find specific services",
        "Filter by category, rating, or location"
      ]
    },
    {
      icon: User,
      title: guide?.createAccount?.title || "Create an Account",
      content: guide?.createAccount?.content || "Join ServYard as a customer or service provider.",
      steps: guide?.createAccount?.steps || [
        "Click 'Join as Customer' or 'Join as Provider'",
        "Fill in your details and verify your email",
        "Complete your profile for better visibility"
      ]
    },
    {
      icon: Calendar,
      title: guide?.bookingServices?.title || "Booking Services",
      content: guide?.bookingServices?.content || "Book appointments with service providers easily.",
      steps: guide?.bookingServices?.steps || [
        "Select a service you want to book",
        "Choose your preferred date and time",
        "Confirm your booking and wait for provider approval"
      ]
    },
    {
      icon: Star,
      title: guide?.ratingsReviews?.title || "Ratings & Reviews",
      content: guide?.ratingsReviews?.content || "Share your experience and help others make informed decisions.",
      steps: guide?.ratingsReviews?.steps || [
        "After a completed service, you can leave a review",
        "Rate the service from 1 to 5 stars",
        "Write detailed feedback about your experience"
      ]
    },
    {
      icon: Heart,
      title: guide?.favorites?.title || "Favorites",
      content: guide?.favorites?.content || "Save your favorite services and providers for quick access.",
      steps: guide?.favorites?.steps || [
        "Click the heart icon on any service or provider",
        "Access your favorites from the sidebar menu",
        "Easily book from your saved favorites"
      ]
    },
    {
      icon: MapPin,
      title: guide?.location?.title || "Location Services",
      content: guide?.location?.content || "Find services near you using location features.",
      steps: guide?.location?.steps || [
        "Enable location access or set your location manually",
        "Use the interactive map to explore nearby services",
        "Filter search results by distance"
      ]
    },
    {
      icon: Bell,
      title: guide?.notifications?.title || "Notifications",
      content: guide?.notifications?.content || "Stay updated on your bookings and new offers.",
      steps: guide?.notifications?.steps || [
        "Enable notifications when prompted",
        "Receive alerts for booking updates",
        "Get notified about special offers and promotions"
      ]
    },
    {
      icon: Globe,
      title: guide?.language?.title || "Language Settings",
      content: guide?.language?.content || "ServYard supports 16 languages for your convenience.",
      steps: guide?.language?.steps || [
        "Click the language icon in the header",
        "Select your preferred language",
        "The interface will update immediately"
      ]
    },
    {
      icon: Clock,
      title: guide?.timezone?.title || "Timezone Settings",
      content: guide?.timezone?.content || "Set your timezone for accurate appointment scheduling.",
      steps: guide?.timezone?.steps || [
        "Go to Timezone settings from the sidebar",
        "Select your timezone from the list",
        "All booking times will display in your local time"
      ]
    }
  ];

  const providerSections = [
    {
      icon: Building2,
      title: guide?.forProviders?.dashboard?.title || "Provider Dashboard",
      content: guide?.forProviders?.dashboard?.content || "Manage your business from the provider dashboard.",
      steps: guide?.forProviders?.dashboard?.steps || [
        "View your bookings and revenue statistics",
        "Manage pending booking requests",
        "Track your service performance"
      ]
    },
    {
      icon: Settings,
      title: guide?.forProviders?.services?.title || "Managing Services",
      content: guide?.forProviders?.services?.content || "Add and manage your service offerings.",
      steps: guide?.forProviders?.services?.steps || [
        "Add new services with detailed descriptions",
        "Set prices, duration, and availability",
        "Add photos to showcase your work"
      ]
    },
    {
      icon: ShoppingBag,
      title: guide?.forProviders?.offers?.title || "Special Offers",
      content: guide?.forProviders?.offers?.content || "Create promotional offers to attract customers.",
      steps: guide?.forProviders?.offers?.steps || [
        "Create discount offers for your services",
        "Set offer duration and terms",
        "Offers appear highlighted to customers"
      ]
    }
  ];

  const customerSections = [
    {
      icon: ShoppingBag,
      title: guide?.forCustomers?.dashboard?.title || "Customer Dashboard",
      content: guide?.forCustomers?.dashboard?.content || "Track your bookings and manage your account.",
      steps: guide?.forCustomers?.dashboard?.steps || [
        "View your booking history",
        "Track upcoming appointments",
        "Leave reviews for completed services"
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center flex items-center justify-center gap-3">
                <HelpCircle className="h-8 w-8 text-primary" />
                {guide?.title || "User Guide"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground text-lg">
                {guide?.subtitle || "Everything you need to know about using ServYard"}
              </p>
            </CardContent>
          </Card>

          {/* General Sections */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                {guide?.generalSection || "General Guide"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {sections.map((section, index) => (
                <div 
                  key={index} 
                  className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <section.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{section.title}</h3>
                      <p className="text-muted-foreground mb-3">{section.content}</p>
                      <ul className="space-y-2">
                        {section.steps.map((step, stepIndex) => (
                          <li 
                            key={stepIndex}
                            className="flex items-start gap-2 text-sm"
                          >
                            <span className="font-bold text-primary min-w-[20px]">
                              {stepIndex + 1}.
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* For Providers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-600" />
                {guide?.forProviders?.title || "For Service Providers"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {providerSections.map((section, index) => (
                <div 
                  key={index} 
                  className="border rounded-lg p-4 hover:border-green-500/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <section.icon className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{section.title}</h3>
                      <p className="text-muted-foreground mb-3">{section.content}</p>
                      <ul className="space-y-2">
                        {section.steps.map((step, stepIndex) => (
                          <li 
                            key={stepIndex}
                            className="flex items-start gap-2 text-sm"
                          >
                            <span className="font-bold text-green-600 min-w-[20px]">
                              {stepIndex + 1}.
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* For Customers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
                {guide?.forCustomers?.title || "For Customers"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {customerSections.map((section, index) => (
                <div 
                  key={index} 
                  className="border rounded-lg p-4 hover:border-blue-500/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <section.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{section.title}</h3>
                      <p className="text-muted-foreground mb-3">{section.content}</p>
                      <ul className="space-y-2">
                        {section.steps.map((step, stepIndex) => (
                          <li 
                            key={stepIndex}
                            className="flex items-start gap-2 text-sm"
                          >
                            <span className="font-bold text-blue-600 min-w-[20px]">
                              {stepIndex + 1}.
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                {guide?.needHelp?.title || "Need More Help?"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {guide?.needHelp?.content || "If you have any questions or need assistance, please don't hesitate to contact our support team."}
              </p>
              <div className="mt-4 flex flex-wrap gap-4">
                <a 
                  href="/contact" 
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  {guide?.needHelp?.contactUs || "Contact Us"} →
                </a>
                <a 
                  href="/terms" 
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  {guide?.needHelp?.termsOfService || "Terms of Service"} →
                </a>
                <a 
                  href="/privacy" 
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  {guide?.needHelp?.privacyPolicy || "Privacy Policy"} →
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer currentLanguage={currentLanguage} />
    </div>
  );
};

export default UserGuide;
