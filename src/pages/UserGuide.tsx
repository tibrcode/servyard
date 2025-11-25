import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { 
  Calendar,
  Star, 
  TrendingUp,
  Clock,
  Bell,
  Shield,
  Zap,
  Target,
  Award,
  BarChart3,
  Smartphone,
  Globe,
  CheckCircle2,
  ArrowRight,
  Building2,
  ShoppingBag,
  MapPin,
  Search,
  Settings,
  HelpCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface UserGuideProps {
  currentLanguage: string;
}

const UserGuide = ({ currentLanguage }: UserGuideProps) => {
  const { t, isRTL } = useTranslation(currentLanguage);
  
  const guide = t.userGuide;

  // Provider Benefits - Main focus
  const providerBenefits = [
    {
      icon: Calendar,
      title: guide?.providerBenefits?.organizeSchedule?.title || "Organize Your Schedule",
      description: guide?.providerBenefits?.organizeSchedule?.description || "No more messy appointment books or missed calls. ServYard automatically manages your schedule, sends reminders, and keeps everything organized in one place.",
      highlights: guide?.providerBenefits?.organizeSchedule?.highlights || [
        "Automatic booking management",
        "Smart conflict detection",
        "Weekly availability settings",
        "Holiday & special dates management"
      ]
    },
    {
      icon: TrendingUp,
      title: guide?.providerBenefits?.growBusiness?.title || "Grow Your Business",
      description: guide?.providerBenefits?.growBusiness?.description || "Reach new customers who are actively searching for your services. Your profile appears to thousands of potential clients in your area.",
      highlights: guide?.providerBenefits?.growBusiness?.highlights || [
        "Appear in search results",
        "Get discovered on the map",
        "Build your online reputation",
        "Attract customers 24/7"
      ]
    },
    {
      icon: Clock,
      title: guide?.providerBenefits?.saveTime?.title || "Save Precious Time",
      description: guide?.providerBenefits?.saveTime?.description || "Stop wasting time on phone calls and manual scheduling. Customers book directly, you approve with one tap, and everyone gets notified automatically.",
      highlights: guide?.providerBenefits?.saveTime?.highlights || [
        "One-tap booking approval",
        "Automatic notifications",
        "No phone tag needed",
        "Focus on your craft"
      ]
    },
    {
      icon: Star,
      title: guide?.providerBenefits?.buildReputation?.title || "Build Your Reputation",
      description: guide?.providerBenefits?.buildReputation?.description || "Collect reviews from satisfied customers and showcase your quality. Good reviews bring more customers, creating a growth cycle for your business.",
      highlights: guide?.providerBenefits?.buildReputation?.highlights || [
        "Verified customer reviews",
        "Star rating display",
        "TOP provider badges",
        "Trust indicators"
      ]
    },
    {
      icon: BarChart3,
      title: guide?.providerBenefits?.trackPerformance?.title || "Track Your Performance",
      description: guide?.providerBenefits?.trackPerformance?.description || "See exactly how your business is doing. Track bookings, revenue, and customer satisfaction all in your personalized dashboard.",
      highlights: guide?.providerBenefits?.trackPerformance?.highlights || [
        "Revenue tracking",
        "Booking statistics",
        "Rating analytics",
        "Growth insights"
      ]
    },
    {
      icon: Zap,
      title: guide?.providerBenefits?.specialOffers?.title || "Create Special Offers",
      description: guide?.providerBenefits?.specialOffers?.description || "Attract more customers with promotional discounts. Create time-limited offers that appear highlighted to potential customers.",
      highlights: guide?.providerBenefits?.specialOffers?.highlights || [
        "Percentage discounts",
        "Fixed amount offers",
        "Scheduled promotions",
        "Highlighted visibility"
      ]
    }
  ];

  // How it works for providers
  const providerSteps = [
    {
      step: "1",
      title: guide?.howItWorks?.provider?.step1?.title || "Create Your Profile",
      description: guide?.howItWorks?.provider?.step1?.description || "Sign up in minutes. Add your business details, services, pricing, and photos to create a professional profile."
    },
    {
      step: "2",
      title: guide?.howItWorks?.provider?.step2?.title || "Set Your Availability",
      description: guide?.howItWorks?.provider?.step2?.description || "Define your working hours for each day. Add holidays or special dates when you're unavailable."
    },
    {
      step: "3",
      title: guide?.howItWorks?.provider?.step3?.title || "Receive Bookings",
      description: guide?.howItWorks?.provider?.step3?.description || "Customers find you and book appointments. You get instant notifications and can approve or reschedule with one tap."
    },
    {
      step: "4",
      title: guide?.howItWorks?.provider?.step4?.title || "Deliver & Grow",
      description: guide?.howItWorks?.provider?.step4?.description || "Provide your excellent service, collect reviews, and watch your business grow as more customers discover you."
    }
  ];

  // Customer benefits - Secondary focus
  const customerBenefits = [
    {
      icon: Search,
      title: guide?.customerBenefits?.findServices?.title || "Find Services Easily",
      description: guide?.customerBenefits?.findServices?.description || "Search by category, location, or rating to find exactly what you need."
    },
    {
      icon: Calendar,
      title: guide?.customerBenefits?.bookInstantly?.title || "Book Instantly",
      description: guide?.customerBenefits?.bookInstantly?.description || "See real-time availability and book appointments in seconds."
    },
    {
      icon: Star,
      title: guide?.customerBenefits?.trustedProviders?.title || "Trusted Providers",
      description: guide?.customerBenefits?.trustedProviders?.description || "Read real reviews from other customers to make informed decisions."
    },
    {
      icon: Bell,
      title: guide?.customerBenefits?.stayInformed?.title || "Stay Informed",
      description: guide?.customerBenefits?.stayInformed?.description || "Get notifications for booking confirmations, reminders, and special offers."
    }
  ];

  // General features
  const generalFeatures = [
    {
      icon: Globe,
      title: guide?.features?.multiLanguage?.title || "16 Languages",
      description: guide?.features?.multiLanguage?.description || "Use ServYard in your preferred language"
    },
    {
      icon: MapPin,
      title: guide?.features?.locationBased?.title || "Location-Based",
      description: guide?.features?.locationBased?.description || "Find services near you with interactive maps"
    },
    {
      icon: Smartphone,
      title: guide?.features?.mobileFirst?.title || "Mobile Friendly",
      description: guide?.features?.mobileFirst?.description || "Works perfectly on any device"
    },
    {
      icon: Shield,
      title: guide?.features?.secure?.title || "Secure & Private",
      description: guide?.features?.secure?.description || "Your data is protected and encrypted"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* Hero Section */}
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
            <CardContent className="pt-8 pb-10 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <HelpCircle className="h-10 w-10 text-primary" />
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {guide?.title || "User Guide"}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {guide?.heroSubtitle || "Discover how ServYard helps service providers organize their business and reach more customers"}
              </p>
            </CardContent>
          </Card>

          {/* Why Providers Choose ServYard */}
          <section>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Building2 className="h-4 w-4" />
                {guide?.forProviders?.badge || "For Service Providers"}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                {guide?.forProviders?.title || "Transform How You Manage Your Business"}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {guide?.forProviders?.subtitle || "Join thousands of service providers who have simplified their scheduling and grown their customer base with ServYard"}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providerBenefits.map((benefit, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow border-green-500/20 hover:border-green-500/40">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-green-500/10 shrink-0">
                        <benefit.icon className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{benefit.description}</p>
                        <ul className="space-y-1.5">
                          {benefit.highlights.map((highlight, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* How It Works - Providers */}
          <section>
            <Card className="bg-gradient-to-r from-green-500/5 to-emerald-500/5 border-green-500/20">
              <CardHeader>
                <CardTitle className="text-center text-xl md:text-2xl">
                  {guide?.howItWorks?.provider?.title || "How to Get Started as a Provider"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-6">
                  {providerSteps.map((step, index) => (
                    <div key={index} className="relative">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-green-500 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">
                          {step.step}
                        </div>
                        <h3 className="font-semibold mb-2">{step.title}</h3>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                      {index < providerSteps.length - 1 && (
                        <div className="hidden md:block absolute top-6 left-[calc(50%+30px)] w-[calc(100%-60px)]">
                          <ArrowRight className={`h-5 w-5 text-green-300 ${isRTL ? 'rotate-180' : ''}`} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-center mt-8">
                  <Link to="/provider-signup">
                    <Button size="lg" className="bg-green-600 hover:bg-green-700">
                      <Building2 className="h-5 w-5 mr-2" />
                      {guide?.cta?.becomeProvider || "Become a Provider Now"}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Provider Dashboard Preview */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  {guide?.dashboardPreview?.title || "Your Provider Dashboard"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  {guide?.dashboardPreview?.description || "Everything you need to manage your business in one powerful dashboard:"}
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { 
                      icon: BarChart3, 
                      label: guide?.dashboardPreview?.stats || "Real-time Statistics",
                      desc: guide?.dashboardPreview?.statsDesc || "Bookings, revenue, ratings"
                    },
                    { 
                      icon: Calendar, 
                      label: guide?.dashboardPreview?.bookings || "Booking Management",
                      desc: guide?.dashboardPreview?.bookingsDesc || "Approve, reject, reschedule"
                    },
                    { 
                      icon: Settings, 
                      label: guide?.dashboardPreview?.services || "Service Management",
                      desc: guide?.dashboardPreview?.servicesDesc || "Add, edit, price services"
                    },
                    { 
                      icon: Award, 
                      label: guide?.dashboardPreview?.reviews || "Reviews & Ratings",
                      desc: guide?.dashboardPreview?.reviewsDesc || "Monitor your reputation"
                    }
                  ].map((item, index) => (
                    <div key={index} className="p-4 rounded-lg border bg-muted/30 text-center">
                      <item.icon className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <h4 className="font-medium text-sm">{item.label}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted-foreground/20"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-sm text-muted-foreground">
                {guide?.divider || "Also for Customers"}
              </span>
            </div>
          </div>

          {/* For Customers - Secondary */}
          <section>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <ShoppingBag className="h-4 w-4" />
                {guide?.forCustomers?.badge || "For Customers"}
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {guide?.forCustomers?.title || "Find & Book Services Effortlessly"}
              </h2>
              <p className="text-muted-foreground">
                {guide?.forCustomers?.subtitle || "Discover trusted service providers and book appointments in seconds"}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {customerBenefits.map((benefit, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 text-center">
                    <div className="p-3 rounded-xl bg-blue-500/10 w-fit mx-auto mb-3">
                      <benefit.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-6">
              <Link to="/customer-signup">
                <Button variant="outline" size="lg">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  {guide?.cta?.joinAsCustomer || "Join as Customer"}
                </Button>
              </Link>
            </div>
          </section>

          {/* General Features */}
          <section>
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-center">
                  {guide?.features?.title || "Platform Features"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {generalFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-background">
                      <feature.icon className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <h4 className="font-medium text-sm">{feature.title}</h4>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Help Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">
                  {guide?.needHelp?.title || "Need More Help?"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {guide?.needHelp?.content || "Our support team is here to help you succeed"}
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link to="/contact" className="text-primary hover:underline flex items-center gap-1">
                    {guide?.needHelp?.contactUs || "Contact Us"} <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link to="/terms" className="text-primary hover:underline flex items-center gap-1">
                    {guide?.needHelp?.termsOfService || "Terms of Service"} <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link to="/privacy" className="text-primary hover:underline flex items-center gap-1">
                    {guide?.needHelp?.privacyPolicy || "Privacy Policy"} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
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
