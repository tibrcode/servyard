import { additionalLanguages } from './languageData';
import { supportedLanguages as defaultSupported, rtlLanguages as rtlDefault } from './languages';

// ServYard Internationalization System
// Supporting 20+ languages with RTL support
// Updated: 2025-11-10 - Added booking management translations

export interface Translation {
  // Navigation
  nav: {
    home: string;
    services: string;
    providerLogin: string;
    customerLogin: string;
    register: string;
    language: string;
    location: string;
    theme?: string;
    notifications?: string;
    settings?: string;
  };

  // Homepage
  home: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    findServices: string;
    becomeProvider: string;
    featuredCategories: string;
    servicesOnMap?: string;
    login?: string;
    myAccount?: string;
    dashboard?: string;
  };

  // Authentication
  auth: {
    welcome: string;
    subtitle: string;
    login: string;
    signup: string;
    email: string;
    password: string;
    fullName: string;
    phoneNumber: string;
    phoneNumbers: string;
    whatsappNumber: string;
    city: string;
    country: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    fullNamePlaceholder: string;
    phoneNumberPlaceholder: string;
    whatsappNumberPlaceholder: string;
    cityPlaceholder: string;
    countryPlaceholder: string;
    joinAsProvider: string;
    joinAsCustomer: string;
    providerDescription: string;
    customerDescription: string;
    providerSignup: string;
    customerSignup: string;
    basicInfo: string;
    contactInfo: string;
    location: string;
    businessInfo: string;
    website: string;
    googleBusiness: string;
    licenseNumber: string;
    licenseVerification: string;
    description: string;
    websitePlaceholder: string;
    googleBusinessPlaceholder: string;
    licenseNumberPlaceholder: string;
    licenseVerificationPlaceholder: string;
    descriptionPlaceholder: string;
    addPhone: string;
    currency?: string;
    termsAgreement: string;
    termsRequired: string;
    createProviderAccount: string;
    createCustomerAccount: string;
    signupSuccess: string;
    checkEmailVerification: string;
    signupError: string;
    loginSuccess: string;
    welcomeBack: string;
    loginError: string;
    alreadyHaveAccount: string;
    dontHaveAccount: string;
    forgotPassword: string;
    resetPassword: string;
    backToLogin: string;
    createAccount: string;
    signingIn: string;
    signingUp: string;
    accountCreated: string;
    // Optional helpers for social auth
    continueWithGoogle?: string;
  };

  // Service categories
  categories: {
    medical: string;
    homeServices: string;
    automotive: string;
    education: string;
    beauty: string;
    fitness: string;
    technology: string;
    legal: string;
    financial: string;
    cleaning: string;
    repair: string;
    consulting: string;
  };

  // Common actions
  actions: {
    search: string;
    book: string;
    contact: string;
    share?: string;
    websiteLabel?: string;
    locationLabel?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    viewProvider?: string;
    login: string;
    register: string;
    save: string;
    cancel: string;
    edit: string;
    delete: string;
    confirm: string;
    back: string;
    next: string;
    submit: string;
    // New: view terms button
    viewTerms?: string;
  };

  // Dashboard navigation translations
  dashboard: {
    main: string;
    account: string;
    dashboards: string;
    providerDashboard: string;
    customerDashboard: string;
  };

  // Notifications UI
  notificationsUI?: {
    historyTitle: string;
    all: string;
    foreground: string;
    background: string;
    clear: string;
    markAllRead: string;
    searchPlaceholder: string;
    noNotifications: string;
    openBooking: string;
    categoryAll?: string;
    categoryBooking?: string;
    categoryReminder?: string;
    categorySystem?: string;
    categoryOther?: string;
    // Booking status sub-filters (only shown when categoryBooking active)
    bookingStatusAll?: string;
    bookingStatusPending?: string;
    bookingStatusConfirmed?: string;
    bookingStatusCancelled?: string;
    bookingStatusCompleted?: string;
    bookingStatusNoShow?: string;
  };

  // User interface text
  ui: {
    languageChanged: string;
    interfaceUpdated: string;
    loadMore: string;
    noData: string;
    coming_soon: string;
    relevance: string;
    highestRated: string;
    priceLowHigh: string;
    priceHighLow: string;
    // Added reusable UI messages
    loading: string;
    loadingMoreServices: string;
    allCategories: string;
    accessDenied: string;
    providerAccessRequired: string;
    statusUpdated: string;
    serviceDeleted: string;
    serviceDeleteFailed: string;
    errorLoadingServices: string;
    verified?: string;
    minutes?: string;
    pageNotFound?: string;
    goHome?: string;
    serviceNotFound?: string;
    serviceUpdated?: string;
    serviceUpdateFailed?: string;
    providerNotFound?: string;
    errorLoadingData?: string;
    // Booking helpers
    missingBookingInfo: string;
    bookingRequestSent: string;
    loginRequired: string;
    customerAccessRequired: string;
    serviceCreated: string;
    serviceCreateFailed: string;
  };

  // Provider related
  provider: {
    profile: string;
    services: string;
    schedule: string;
    bookings: string;
    reviews: string;
    dashboard: string;
    addService: string;
    editService: string;
    availability: string;
    settings: string;
    shareProfile: string;
    customLink: string;
    generateLink: string;
    copyLink: string;
    linkCopied: string;
    myServices: string;
    manageServices: string;
    rating: string;
    revenue: string;
    thisMonth: string;
    pendingBookings: string;
    pendingBookingsTitle?: string;
    bookingsAwaitingApproval?: string;
    noBookingsFound?: string;
    bookingManagementTitle?: string;
    bookingManagementSubtitle?: string;
    today?: string;
    thisWeek?: string;
    allTime?: string;
    filterByStatus?: string;
    bookingStatusAll?: string;
    bookingStatusNoShow?: string;
    activeServices: string;
    recentBookings: string;
    manageBookings: string;
    offers: string;
    noServicesYet: string;
    createFirstService: string;
    addFirstService: string;
    active: string;
    inactive: string;
    price: string;
    duration: string;
    range: string;
  };

  // Customer related
  customer: {
    myBookings: string;
    favorites: string;
    reviews: string;
    profile: string;
    history: string;
    dashboard: string;
    managementDescription: string;
    pendingBookings: string;
    awaitingConfirmation: string;
    savedProviders: string;
    reviewsGiven: string;
    completed: string;
    findServices: string;
    recentBookings: string;
    favoriteProviders: string;
    bookingHistory: string;
    rate: string;
    bookings: string;
    welcomeBack: string;
    manageBookings: string;
    logout: string;
    editProfile: string;
    browseServices: string;
    totalBookings: string;
    myReviews: string;
    providerResponse: string;
    call: string;
    whatsapp: string;
    notes: string;
    profileInformation: string;
    fullName: string;
    location: string;
    noBookingsYet: string;
    startBrowsing: string;
    confirmCompletion: string;
    writeReview: string;
    editReview: string;
    cancel: string;
    contactProvider: string;
    noReviewsYet: string;
    startReviewing: string;
    // Added for reviews modal and provider label
    providerLabel?: string;
    reviewsModal?: {
      editTitle: string;
      createTitle: string;
      editDescription: string;
      createDescription: string;
      ratingLabels: string[];
    };
    // Optional suffix/label for rating display (e.g., "out of 5")
    outOf5?: string;
    viewManageBookings?: string;
    upcoming?: string;
    past?: string;
    noUpcomingBookings?: string;
    statusConfirmed?: string;
    statusCompleted?: string;
    alreadyReviewed?: string;
    reviewService?: string;
  };

  booking: {
    selectService: string;
    selectTime: string;
    confirmDetails: string;
    bookingConfirmed: string;
    bookingPending: string;
    bookingCancelled: string;
    contactProvider: string;
    customer: string;
    serviceId: string;
    notes: string;
    clientRating: string;
    noRatingYet: string;
    confirm: string;
    reject: string;
    completed: string;
    call: string;
    whatsapp: string;
    statuses: {
      pending: string;
      confirmed: string;
      rejected: string;
      completed: string;
      confirmed_completed: string;
      cancelled: string;
    };
  };

  notificationSettings?: {
    title: string;
    subtitle: string;
    enableNotifications: string;
    enableDesc: string;
    notificationsEnabled?: string;
    notificationsEnabledDesc?: string;
    bookingReminders: string;
    bookingRemindersDesc: string;
    reminderTimes: string;
    reminderTimesDesc: string;
    min15: string;
    min30: string;
    hour1: string;
    hour2: string;
    hour3: string;
    day1: string;
    bookingUpdates: string;
    bookingUpdatesDesc: string;
    confirmations: string;
    cancellations: string;
    completions: string;
    quietHours: string;
    quietHoursDesc: string;
    quietHoursTooltip: string;
    startTime: string;
    endTime: string;
    save: string;
    saving: string;
    saved: string;
    savedDesc: string;
    saveFailed: string;
    permissionDenied: string;
    permissionDeniedDesc: string;
    requestPermission: string;
    reminderSummaryLabel: string;
    noneSelected: string;
    sendTestNotification: string;
    testNotificationSent: string;
    testNotificationFailed: string;
    checkNotificationCenter: string;
  };

  // Forms
  forms: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    description: string;
    price: string;
    duration: string;
    category: string;
    specialty: string;
    license: string;
    website: string;
    submit: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    create: string;
    update: string;
  };

  editProfile: {
    title: string;
    subtitle: string;
    basicInfo: string;
    contactNumbers: string;
    additionalPhones: string;
    profileDescription: string;
    providerInfo: string;
    backToDashboard: string;
    loading: string;
    saving: string;
    saveChanges: string;
    fullName: string;
    email: string;
    city: string;
    country: string;
    whatsappNumber: string;
    whatsappPlaceholder: string;
    additionalPhonePlaceholder: string;
    descriptionPlaceholder: string;
    website: string;
    googleBusiness: string;
    licenseNumber: string;
    websitePlaceholder: string;
    googleBusinessPlaceholder: string;
    licensePlaceholder: string;
    fullNamePlaceholder: string;
    emailPlaceholder: string;
    cityPlaceholder: string;
    countryPlaceholder: string;
    currency?: string;
    successTitle: string;
    successMessage: string;
    errorTitle: string;
    errorMessage: string;
    validationError: string;
    validationMessage: string;
    cancel: string;
  };

  // Add Service
  addService: {
    title: string;
    subtitle: string;
    serviceDetails: string;
    basicInfo: string;
    serviceName: string;
    category: string;
    selectCategory: string;
    description: string;
    describeService: string;
    pricingDuration: string;
    approximatePrice: string;
    priceRange: string;
    priceRangeBudget?: string;
    priceRangeStandard?: string;
    priceRangePremium?: string;
    selectRange: string;
    durationMinutes: string;
    specialtyInfo: string;
    specialtyDescription: string;
    whatMakesUnique: string;
    createService: string;
    creating: string;
    enterServiceName: string;
  };

  toast: {
    locationNotSupported: string;
    locationNotSupportedDesc: string;
    locatingUser: string;
    locatingUserDesc: string;
    locationSuccess: string;
    locationFailed: string;
    locationPermissionDenied: string;
    locationUnavailable: string;
    locationTimeout: string;
    onlineStatus: string;
    offlineStatus: string;
    onlineStatusDesc: string;
    offlineStatusDesc: string;
    error: string;
    statusUpdateError: string;
    bookingConfirmed: string;
    bookingRejected: string;
    bookingCompleted: string;
    bookingConfirmedDesc: string;
    bookingRejectedDesc: string;
    bookingCompletedDesc: string;
    bookingError: string;
    bookingErrorDesc: string;
    // Added for review flows
    reviewUpdated?: string;
    reviewUpdatedDesc?: string;
    reviewSubmitted?: string;
    reviewSubmittedDesc?: string;
    reviewErrorDesc?: string;
  };

  userInterface: {
    welcome: string;
    editProfile: string;
    logout: string;
    providerPanel: string;
    customerPanel: string;
    onlineNow: string;
    offline: string;
    browseServices: string;
  };

  // Availability Management
  availability: {
    availabilityManagement: string;
    setWorkingHours: string;
    serviceSelection: string;
    selectService: string;
    weeklyAvailability: string;
    setAvailableDaysTime: string;
    addAvailability: string;
    editAvailability: string;
    day: string;
    selectDay: string;
    startTime: string;
    endTime: string;
    available: string;
    notAvailable: string;
    notSet: string;
    specialDates: string;
    addHolidaysSpecialDays: string;
    addSpecialDate: string;
    setSpecialDateHoliday: string;
    date: string;
    availableForWork: string;
    noteOptional: string;
    noteExample: string;
    noSpecialDatesAvailable: string;
    messages?: {
      requiredFields: string;
      endTimeAfterStart: string;
      updatedSuccess: string;
      createdSuccess: string;
      saveError: string;
      specialDateRequiredFields: string;
      specialDateCreatedSuccess: string;
      specialDateSaveError: string;
    };
  };

  // Offers Management
  offers: {
    offersManagement: string;
    createManageOffers: string;
    addNewOffer: string;
    editOffer: string;
    fillDetailsCreateOffer: string;
    editOfferDetails: string;
    offerTitle: string;
    offerTitleExample: string;
    offerDescription: string;
    offerDetailsConditions: string;
    discountType: string;
    percentage: string;
    fixedAmount: string;
    discountPercentage: string;
    discountAmount: string;
    startDate: string;
    endDate: string;
    activeOffer: string;
    updating: string;
    adding: string;
    update: string;
    add: string;
    noOffers: string;
    createFirstOffer: string;
    active: string;
    inactive: string;
    expired: string;
    upcoming: string;
    off?: string;
    currencySar?: string;
    messages?: {
      loadError: string;
      requiredFields: string;
      invalidDiscountPercentage: string;
      invalidDiscountAmount: string;
      endDateAfterStart: string;
      updatedSuccess: string;
      createdSuccess: string;
      saveErrorUpdate: string;
      saveErrorCreate: string;
      deleteConfirm: string;
      deleteSuccess: string;
      deleteError: string;
    };
  };

  // Share Profile
  shareProfile: {
    shareProfile: string;
    profileLink: string;
    shareWithClients: string;
    qrCode: string;
    downloadQRCode: string;
    qrCodeDescription: string;
  };

  // Legal Documents
  legal: {
    terms: {
      title: string;
      lastUpdated: string;
      intro: string;
      purpose: {
        title: string;
        content: string;
      };
      userAccounts: {
        title: string;
        points: string[];
      };
      serviceListings: {
        title: string;
        points: string[];
      };
      payments: {
        title: string;
        points: string[];
      };
      location: {
        title: string;
        points: string[];
      };
      intellectualProperty: {
        title: string;
        points: string[];
      };
      liability: {
        title: string;
        content: string;
      };
      governingLaw: {
        title: string;
        content: string;
      };
      acknowledgment: string;
    };
    privacy: {
      title: string;
      lastUpdated: string;
      intro: string;
      dataCollection: {
        title: string;
        clients: {
          title: string;
          content: string;
        };
        providers: {
          title: string;
          content: string;
        };
        general: {
          title: string;
          content: string;
        };
      };
      purpose: {
        title: string;
        points: string[];
      };
      dataSharing: {
        title: string;
        intro: string;
        points: string[];
      };
      compliance: {
        title: string;
        content: string;
      };
      security: {
        title: string;
        content: string;
      };
      userRights: {
        title: string;
        intro: string;
        points: string[];
        contact: string;
      };
      acknowledgment: string;
    };
    disclaimer: {
      title: string;
      lastUpdated: string;
      intro: string;
      points: string[];
      acknowledgment: string;
    };
    contentPolicy: {
      title: string;
      lastUpdated: string;
      acceptable: {
        title: string;
        content: string;
      };
      prohibited: {
        title: string;
        points: string[];
      };
      moderation: {
        title: string;
        points: string[];
      };
      reporting: {
        title: string;
        content: string;
      };
      acknowledgment: string;
    };
    aboutUs: {
      title: string;
      content: string[];
    };
    contactUs: {
      title: string;
      website: string;
      email: string;
      address: string;
    };
    providerTerms: {
      title: string;
      intro: string;
      points: string[];
    };
    customerTerms: {
      title: string;
      intro: string;
      points: string[];
    };
  };

  // Footer
  footer: {
    tagline: string;
    copyright: string;
    paymentDisclaimer: string;
    links: {
      terms: string;
      privacy: string;
      disclaimer: string;
      contentPolicy: string;
      aboutUs: string;
      contactUs: string;
    };
  };
}

// Base translations (English + a few fully covered langs)
export const translations: Record<string, Translation> = {
  en: {
    nav: {
      home: "Home",
      services: "Services",
      providerLogin: "Provider Login",
      customerLogin: "Customer Login",
      register: "Register",
      language: "Language",
      location: "Location",
      theme: "Theme",
      notifications: "Notifications",
      settings: "Settings",
    },
    home: {
      title: "ServYard - Premium Service Marketplace",
      subtitle: "Connect with verified service providers in your area",
      searchPlaceholder: "Search for services...",
      findServices: "Find Services",
      becomeProvider: "Become a Provider",
      featuredCategories: "Featured Categories",
      servicesOnMap: "Services on Map",
      login: "Login",
      myAccount: "My Account",
      dashboard: "Dashboard",
    },
    ui: {
      languageChanged: "Language Changed",
      interfaceUpdated: "Interface language updated",
      loadMore: "Load More Services",
      noData: "No data available",
      coming_soon: "Coming Soon",
      relevance: "Relevance",
      highestRated: "Highest Rated",
      priceLowHigh: "Price: Low to High",
      priceHighLow: "Price: High to Low",
      // New reusable UI messages
      loading: "Loading...",
      loadingMoreServices: "Loading more services...",
      allCategories: "All Categories",
      accessDenied: "Access Denied",
      providerAccessRequired: "You need to be logged in as a provider to access this page.",
      statusUpdated: "Status updated",
      serviceDeleted: "Service deleted successfully",
      serviceDeleteFailed: "Failed to delete service",
      errorLoadingServices: "Failed to load services",
      verified: "Verified",
      minutes: "minutes",
      pageNotFound: "Page not found",
      goHome: "Go Home",
      serviceNotFound: "Service not found",
      serviceUpdated: "Service updated successfully",
      serviceUpdateFailed: "Failed to update service",
      providerNotFound: "Provider not found",
      errorLoadingData: "Error loading data",
      // Booking helpers
      missingBookingInfo: "Please select date and time for your booking",
      bookingRequestSent: "Your booking request has been sent to the provider",
      loginRequired: "Please log in to continue",
      customerAccessRequired: "You need to be logged in as a customer to access this action.",
      serviceCreated: "Service created successfully",
      serviceCreateFailed: "Failed to create service",
    },
    dashboard: {
      main: "Main Navigation",
      account: "Account",
      dashboards: "Dashboards",
      providerDashboard: "Provider Dashboard",
      customerDashboard: "Customer Dashboard",
    },
    notificationsUI: {
      historyTitle: "Notification History",
      all: "All",
      foreground: "Foreground",
      background: "Background",
      clear: "Clear",
      markAllRead: "Mark all as read",
      searchPlaceholder: "Search...",
      noNotifications: "No notifications",
      openBooking: "Open Booking",
      categoryAll: "All types",
      categoryBooking: "Bookings",
      categoryReminder: "Reminders",
      categorySystem: "System",
      categoryOther: "Other",
      bookingStatusAll: "All statuses",
      bookingStatusPending: "Pending",
      bookingStatusConfirmed: "Confirmed",
      bookingStatusCancelled: "Cancelled",
      bookingStatusCompleted: "Completed",
      bookingStatusNoShow: "No Show",
    },
    auth: {
      welcome: 'Welcome to ServYard',
      subtitle: 'Join our premium service marketplace',
      login: 'Login',
      signup: 'Sign Up',
      email: 'Email',
      password: 'Password',
      fullName: 'Full Name',
      phoneNumber: 'Phone Number',
      phoneNumbers: 'Phone Numbers',
      whatsappNumber: 'WhatsApp Number',
      city: 'City',
      country: 'Country',
      emailPlaceholder: 'Enter your email',
      passwordPlaceholder: 'Enter your password',
      fullNamePlaceholder: 'Enter your full name',
      phoneNumberPlaceholder: 'Enter your phone number',
      whatsappNumberPlaceholder: 'Enter your WhatsApp number',
      cityPlaceholder: 'Enter your city',
      countryPlaceholder: 'Enter your country',
      joinAsProvider: 'Join as Service Provider',
      joinAsCustomer: 'Join as Customer',
      providerDescription: 'Offer your services to customers',
      customerDescription: 'Find and book services you need',
      providerSignup: 'Provider Registration',
      customerSignup: 'Customer Registration',
      basicInfo: 'Basic Information',
      contactInfo: 'Contact Information',
      location: 'Location',
      businessInfo: 'Business Information',
      website: 'Website',
      googleBusiness: 'Google Business',
      licenseNumber: 'License Number',
      licenseVerification: 'License Verification URL',
      description: 'Description',
      websitePlaceholder: 'https://yourwebsite.com',
      googleBusinessPlaceholder: 'Google Business URL',
      licenseNumberPlaceholder: 'Professional license number',
      licenseVerificationPlaceholder: 'License verification URL',
      descriptionPlaceholder: 'Describe your services...',
      addPhone: 'Add Phone Number',
      currency: 'Preferred Currency',
      termsAgreement: 'I agree to the Terms & Conditions and Privacy Policy',
      termsRequired: 'You must accept the terms and conditions',
      createProviderAccount: 'Create Provider Account',
      createCustomerAccount: 'Create Customer Account',
      signupSuccess: 'Account Created Successfully',
      checkEmailVerification: 'Please check your email to verify your account',
      signupError: 'Failed to create account',
      loginSuccess: 'Login Successful',
      welcomeBack: 'Welcome back to ServYard',
      loginError: 'Failed to login',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?",
      forgotPassword: 'Forgot Password?',
      resetPassword: 'Reset Password',
      backToLogin: 'Back to Login',
      createAccount: 'Create Account',
      signingIn: 'Signing In...',
      signingUp: 'Creating Account...',
      accountCreated: 'Account Created Successfully'
    },
    categories: {
      medical: "Medical",
      homeServices: "Home Services",
      automotive: "Automotive",
      education: "Education",
      beauty: "Beauty & Wellness",
      fitness: "Fitness",
      technology: "Technology",
      legal: "Legal",
      financial: "Financial",
      cleaning: "Cleaning",
      repair: "Repair",
      consulting: "Consulting",
    },
    actions: {
      search: "Search",
      book: "Book Now",
      contact: "Contact",
      share: "Share",
      websiteLabel: "Website",
      locationLabel: "Location",
      instagram: "Instagram",
      facebook: "Facebook",
      tiktok: "TikTok",
      viewProvider: "View Provider",
      login: "Login",
      register: "Register",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      confirm: "Confirm",
      back: "Back",
      next: "Next",
      submit: "Submit",
      viewTerms: "View Terms & Conditions",
    },
    provider: {
      profile: "Profile",
      services: "Services",
      schedule: "Schedule",
      bookings: "Bookings",
      reviews: "Reviews",
      dashboard: "Dashboard",
      addService: "Add Service",
      editService: "Edit Service",
      availability: "Availability",
      settings: "Settings",
      shareProfile: "Share Profile",
      customLink: "Custom Link",
      generateLink: "Generate Link",
      copyLink: "Copy Link",
      linkCopied: "Link Copied",
      myServices: "My Services",
      manageServices: "Manage your service offerings",
      rating: "Rating",
      revenue: "Revenue",
      thisMonth: "This Month",
      pendingBookings: "Pending Bookings",
      pendingBookingsTitle: "Pending Bookings",
      bookingsAwaitingApproval: "Bookings awaiting your approval",
      noBookingsFound: "No bookings found",
      bookingManagementTitle: "Booking Management",
      bookingManagementSubtitle: "View and manage all your service bookings",
      today: "Today",
      thisWeek: "This Week",
      allTime: "All",
      filterByStatus: "Filter by Status",
      bookingStatusAll: "All",
      bookingStatusNoShow: "No Show",
      activeServices: "Active Services",
      recentBookings: "Recent Bookings",
      manageBookings: "Manage your upcoming bookings",
      offers: "Offers",
      noServicesYet: "No services yet",
      createFirstService: "Create your first service to start receiving bookings",
      addFirstService: "Add Your First Service",
      active: "Active",
      inactive: "Inactive",
      price: "Price",
      duration: "Duration",
      range: "Range",
    },
    customer: {
      myBookings: "My Bookings",
      favorites: "Favorites",
      reviews: "Reviews",
      profile: "Profile",
      history: "History",
      dashboard: "My Dashboard",
      managementDescription: "Manage your bookings and preferences",
      pendingBookings: "Pending Bookings",
      awaitingConfirmation: "Awaiting confirmation",
      savedProviders: "Saved providers",
      reviewsGiven: "Reviews Given",
      completed: "completed",
      findServices: "Find Services",
      recentBookings: "Recent Bookings",
      favoriteProviders: "Favorite Providers",
      bookingHistory: "Booking History",
      rate: "Rate",
      bookings: "bookings",
      welcomeBack: "Welcome Back",
      manageBookings: "Manage your bookings and discover new services",
      logout: "Logout",
      editProfile: "Edit Profile",
      browseServices: "Browse Services",
      totalBookings: "Total Bookings",
      myReviews: "My Reviews",
      providerResponse: "Provider Response",
      call: "Call",
      whatsapp: "WhatsApp",
      notes: "Notes",
      profileInformation: "Profile Information",
      fullName: "Full Name",
      location: "Location",
      noBookingsYet: "No bookings yet",
      startBrowsing: "Start by browsing services and making your first booking",
      confirmCompletion: "Confirm Service Completion",
      writeReview: "Write Review",
      editReview: "Edit",
      cancel: "Cancel",
      contactProvider: "Contact Provider",
      noReviewsYet: "No reviews yet",
      startReviewing: "Book a service and share your experience",
      providerLabel: "Provider:",
      reviewsModal: {
        editTitle: "Edit Review",
        createTitle: "Rate Service",
        editDescription: "You can update your service rating here",
        createDescription: "Choose stars to rate the service quality",
        ratingLabels: ["Poor", "Fair", "Good", "Very Good", "Excellent"],
      },
      outOf5: "out of 5",
      viewManageBookings: "View and manage your bookings",
      upcoming: "Upcoming",
      past: "Past",
      noUpcomingBookings: "You don't have any upcoming bookings",
      statusConfirmed: "Confirmed",
      statusCompleted: "Completed",
      alreadyReviewed: "Already Reviewed",
      reviewService: "Review Service",
    },
    booking: {
      selectService: "Select Service",
      selectTime: "Select Time",
      confirmDetails: "Confirm Details",
      bookingConfirmed: "Booking Confirmed",
      bookingPending: "Booking Pending",
      bookingCancelled: "Booking Cancelled",
      contactProvider: "Contact Provider",
      customer: "Client",
      serviceId: "Service ID",
      notes: "Notes",
      clientRating: "Client Rating",
      noRatingYet: "No rating yet",
      confirm: "Confirm",
      reject: "Reject",
      completed: "Completed",
      call: "Call",
      whatsapp: "WhatsApp",
      statuses: {
        pending: "Pending",
        confirmed: "Confirmed",
        rejected: "Rejected",
        completed: "Completed - Needs Confirmation",
        confirmed_completed: "Completed",
        cancelled: "Cancelled",
      },
    },
    notificationSettings: {
      title: "Notification Settings",
      subtitle: "Manage how you receive notifications",
      enableNotifications: "Enable Notifications",
      enableDesc: "Receive all notifications from the app",
      notificationsEnabled: "Notifications Enabled ✓",
      notificationsEnabledDesc: "You can now receive notifications",
      bookingReminders: "Booking Reminders",
      bookingRemindersDesc: "Remind you of upcoming appointments",
      reminderTimes: "Reminder Times",
      reminderTimesDesc: "Choose when to receive reminders before your appointment",
      min15: "15 minutes before",
      min30: "30 minutes before",
      hour1: "1 hour before",
      hour2: "2 hours before",
      hour3: "3 hours before",
      day1: "1 day before",
      bookingUpdates: "Booking Updates",
      bookingUpdatesDesc: "Notifications about booking status changes",
      confirmations: "Booking Confirmations",
      cancellations: "Booking Cancellations",
      completions: "Service Completions",
      quietHours: "Quiet Hours",
      quietHoursDesc: "You won't receive notifications during these hours",
      quietHoursTooltip: "Notifications (except critical reminders) are suppressed in this window. Reminders are deferred until it ends.",
      startTime: "From",
      endTime: "To",
      save: "Save Settings",
      saving: "Saving...",
      saved: "Settings saved",
      savedDesc: "Notification settings updated successfully",
      saveFailed: "Failed to save settings",
      permissionDenied: "Notification Permission Denied",
      permissionDeniedDesc: "Please enable notifications in browser settings",
      requestPermission: "Request Permission",
      reminderSummaryLabel: "Reminder Summary",
      noneSelected: "No times selected",
      sendTestNotification: "Send Test Notification",
      testNotificationSent: "✅ Test notification sent successfully",
      testNotificationFailed: "❌ Failed to send test notification",
      checkNotificationCenter: "Check the notification center at the top",
    },
    forms: {
      name: "Name",
      email: "Email",
      phone: "Phone",
      address: "Address",
      city: "City",
      country: "Country",
      description: "Description",
      price: "Price",
      duration: "Duration",
      category: "Category",
      specialty: "Specialty",
      license: "License",
      website: "Website",
      submit: "Submit",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      create: "Create",
      update: "Update",
    },
    editProfile: {
      title: "Edit Profile",
      subtitle: "Update your personal information and contact details",
      basicInfo: "Basic Information",
      contactNumbers: "Contact Numbers",
      additionalPhones: "Additional Phone Numbers",
      profileDescription: "Profile Description",
      providerInfo: "Provider Information",
      backToDashboard: "Back to Dashboard",
      loading: "Loading...",
      saving: "Saving...",
      saveChanges: "Save Changes",
      fullName: "Full Name",
      email: "Email",
      city: "City",
      country: "Country",
      whatsappNumber: "WhatsApp Number",
      whatsappPlaceholder: "Enter WhatsApp number with country code (+971...)",
      additionalPhonePlaceholder: "Enter additional phone number",
      descriptionPlaceholder: "Write about yourself or your services...",
      website: "Website",
      googleBusiness: "Google Business Link",
      licenseNumber: "License Number",
      websitePlaceholder: "https://example.com",
      googleBusinessPlaceholder: "Google Business page link",
      licensePlaceholder: "Professional license number",
      fullNamePlaceholder: "Enter your full name",
      emailPlaceholder: "Enter your email",
      cityPlaceholder: "Enter your city",
      countryPlaceholder: "Enter your country",
      currency: "Preferred Currency",
      successTitle: "Success",
      successMessage: "Profile updated successfully",
      errorTitle: "Error",
      errorMessage: "An error occurred while saving data",
      validationError: "Error",
      validationMessage: "Please fill in full name and email",
      cancel: "Cancel",
    },
    addService: {
      title: "Add New Service",
      subtitle: "Create a new service offering for your customers",
      serviceDetails: "Service Details",
      basicInfo: "Basic Information",
      serviceName: "Service Name",
      category: "Category",
      selectCategory: "Select category",
      description: "Description",
      describeService: "Describe your service",
      pricingDuration: "Pricing & Duration",
      approximatePrice: "Approximate Price",
      priceRange: "Price Range",
      priceRangeBudget: "Budget",
      priceRangeStandard: "Standard",
      priceRangePremium: "Premium",
      selectRange: "Select range",
      durationMinutes: "Duration (minutes)",
      specialtyInfo: "Specialty Information",
      specialtyDescription: "Specialty Description",
      whatMakesUnique: "What makes your service unique?",
      createService: "Create Service",
      creating: "Creating...",
      enterServiceName: "Enter service name",
    },
    toast: {
      locationNotSupported: "Location not supported",
      locationNotSupportedDesc: "Your browser doesn't support geolocation",
      locatingUser: "Locating...",
      locatingUserDesc: "Please wait while we determine your location",
      locationSuccess: "Location determined successfully! ✅",
      locationFailed: "Failed to determine location",
      locationPermissionDenied: "Permission denied to access location",
      locationUnavailable: "Location information unavailable",
      locationTimeout: "Location timeout expired",
      onlineStatus: "You are now available",
      offlineStatus: "You are now unavailable",
      onlineStatusDesc: "Customers can see that you are available for booking",
      offlineStatusDesc: "Customers won't be able to book your services",
      error: "Error",
      statusUpdateError: "Error updating status",
      bookingConfirmed: "Booking Confirmed",
      bookingRejected: "Booking Rejected",
      bookingCompleted: "Service Completed",
      bookingConfirmedDesc: "Booking confirmed successfully",
      bookingRejectedDesc: "Booking has been rejected",
      bookingCompletedDesc: "Service marked as completed, awaiting customer confirmation",
      bookingError: "Error",
      bookingErrorDesc: "Error updating booking",
      reviewUpdated: "Review updated",
      reviewUpdatedDesc: "Your review has been updated",
      reviewSubmitted: "Review submitted",
      reviewSubmittedDesc: "Thanks for rating the service",
      reviewErrorDesc: "An error occurred while processing your review",
    },
    userInterface: {
      welcome: "Welcome back",
      editProfile: "Edit Profile",
      logout: "Logout",
      providerPanel: "Provider Panel",
      customerPanel: "Customer Panel",
      onlineNow: "Available Now",
      offline: "Unavailable",
      browseServices: "Browse Services",
    },

    // Availability Management
    availability: {
      availabilityManagement: "Availability Management",
      setWorkingHours: "Set working hours and available days",
      serviceSelection: "Service Selection",
      selectService: "Select a service",
      weeklyAvailability: "Weekly Availability",
      setAvailableDaysTime: "Set available days and times for work",
      addAvailability: "Add Availability",
      editAvailability: "Add/Edit Availability",
      day: "Day",
      selectDay: "Select day",
      startTime: "Start Time",
      endTime: "End Time",
      available: "Available",
      notAvailable: "Not Available",
      notSet: "Not Set",
      specialDates: "Special Dates",
      addHolidaysSpecialDays: "Add holidays or exceptional working days",
      addSpecialDate: "Add Special Date",
      setSpecialDateHoliday: "Set a specific date as holiday or exceptional working day",
      date: "Date",
      availableForWork: "Available for Work",
      noteOptional: "Note (Optional)",
      noteExample: "Example: Official holiday, Extra work day...",
      noSpecialDatesAvailable: "No special dates available",
      messages: {
        requiredFields: "Please fill in all required fields",
        endTimeAfterStart: "End time must be after start time",
        updatedSuccess: "Availability updated successfully",
        createdSuccess: "Availability added successfully",
        saveError: "Error saving availability",
        specialDateRequiredFields: "Please fill in the required fields",
        specialDateCreatedSuccess: "Special date added successfully",
        specialDateSaveError: "Error saving special date",
      },
    },

    // Offers Management
    offers: {
      offersManagement: "Offers Management",
      createManageOffers: "Create and manage special offers and discounts",
      addNewOffer: "Add New Offer",
      editOffer: "Edit Offer",
      fillDetailsCreateOffer: "Fill in the following details to create a special offer",
      editOfferDetails: "Edit offer details",
      offerTitle: "Offer Title *",
      offerTitleExample: "Example: 20% off cleaning services",
      offerDescription: "Offer Description",
      offerDetailsConditions: "Offer details and conditions...",
      discountType: "Discount Type",
      percentage: "Percentage",
      fixedAmount: "Fixed Amount",
      discountPercentage: "Discount Percentage (%)",
      discountAmount: "Discount Amount (SAR)",
      startDate: "Start Date *",
      endDate: "End Date *",
      activeOffer: "Active Offer",
      updating: "Updating...",
      adding: "Adding...",
      update: "Update",
      add: "Add",
      noOffers: "No Offers",
      createFirstOffer: "Start by creating your first offer",
      active: "Active",
      inactive: "Inactive",
      expired: "Expired",
      upcoming: "Upcoming",
      off: "% off",
      currencySar: "SAR",
      messages: {
        loadError: "Error loading offers",
        requiredFields: "Please fill in the required fields",
        invalidDiscountPercentage: "Please enter a valid discount percentage between 1 and 100",
        invalidDiscountAmount: "Please enter a valid discount amount",
        endDateAfterStart: "Offer end date must be after the start date",
        updatedSuccess: "Offer updated successfully",
        createdSuccess: "Offer created successfully",
        saveErrorUpdate: "Error updating offer",
        saveErrorCreate: "Error creating offer",
        deleteConfirm: "Are you sure you want to delete this offer?",
        deleteSuccess: "Offer deleted successfully",
        deleteError: "Error deleting offer",
      },
    },

    // Share Profile
    shareProfile: {
      shareProfile: "Share Your Profile",
      profileLink: "Your Profile Link",
      shareWithClients: "Share this link with clients so they can view your services and make bookings",
      qrCode: "QR Code (Quick Response)",
      downloadQRCode: "Download QR Code",
      qrCodeDescription: "Clients can scan this code with their phone cameras to access your profile directly",
    },
    legal: {
      terms: {
        title: "Terms and Conditions",
        lastUpdated: "Last updated",
        intro: "Welcome to ServYard. By accessing or using our website (www.servyard.com) or mobile applications (Android, iOS, Huawei), you agree to be bound by these Terms & Conditions. If you do not agree, you may not use the platform.",
        purpose: {
          title: "1. Purpose of the Platform",
          content: "ServYard is a global platform designed to connect service providers (\"Providers\") with clients (\"Clients\"). ServYard itself does not supply, supervise, or guarantee any services. All transactions and communications occur directly between Providers and Clients."
        },
        userAccounts: {
          title: "2. User Accounts",
          points: [
            "Providers must provide accurate and lawful information about their services, including valid licenses when required by law.",
            "Clients must provide accurate contact details and use the platform only for lawful purposes.",
            "Both Providers and Clients agree to sign an electronic agreement releasing ServYard from liability for any disputes or damages.",
            "Accounts may be suspended or terminated at ServYard's discretion for violations of these Terms."
          ]
        },
        serviceListings: {
          title: "3. Service Listings",
          points: [
            "Providers are solely responsible for the accuracy, legality, and quality of their service descriptions, schedules, and prices.",
            "Providers must not list illegal or restricted services.",
            "ServYard reserves the right to remove content that violates laws or policies."
          ]
        },
        payments: {
          title: "4. Payments",
          points: [
            "ServYard does not process payments.",
            "Payments, delivery, and after-service support are the sole responsibility of Providers and Clients."
          ]
        },
        location: {
          title: "5. Location Services",
          points: [
            "Clients may allow ServYard to access their location to display services nearby.",
            "Location data is used only to improve relevance and is not sold to third parties."
          ]
        },
        intellectualProperty: {
          title: "6. Intellectual Property",
          points: [
            "Users must only upload content they own or have the right to use.",
            "By posting, Providers grant ServYard a non-exclusive license to display such content on the platform."
          ]
        },
        liability: {
          title: "7. Limitation of Liability",
          content: "ServYard is not liable for any damages, losses, or disputes arising from the use of the platform. Responsibility lies entirely with Providers and Clients."
        },
        governingLaw: {
          title: "8. Governing Law",
          content: "These Terms are governed by international standards of electronic commerce and applicable local laws in the country of the Provider and Client."
        },
        acknowledgment: "By using ServYard, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions."
      },
      privacy: {
        title: "Privacy Policy",
        lastUpdated: "Last updated",
        intro: "ServYard values your privacy. This Privacy Policy explains how we collect, use, and protect your information.",
        dataCollection: {
          title: "1. Data We Collect",
          clients: {
            title: "Clients:",
            content: "Name, contact information, location, login credentials."
          },
          providers: {
            title: "Providers:",
            content: "Business name, license details, contact information, service descriptions, optional images."
          },
          general: {
            title: "General:",
            content: "IP address, device type, browser, cookies."
          }
        },
        purpose: {
          title: "2. Purpose of Collection",
          points: [
            "To create and manage user accounts.",
            "To connect Clients with Providers based on location and preferences.",
            "To ensure compliance with platform policies.",
            "To serve relevant advertising (Google AdSense/AdMob)."
          ]
        },
        dataSharing: {
          title: "3. Data Sharing",
          intro: "We do not sell personal data. Data may be shared only with:",
          points: [
            "Authorities, when required by law.",
            "Service providers (e.g., hosting, analytics) under confidentiality agreements."
          ]
        },
        compliance: {
          title: "4. International Compliance",
          content: "ServYard complies with GDPR (EU), PDPL (UAE), CCPA (California), and similar international data protection standards."
        },
        security: {
          title: "5. Data Security",
          content: "We use encryption, access controls, and monitoring to protect your data. No system is 100% secure, but we implement industry-standard safeguards."
        },
        userRights: {
          title: "6. User Rights",
          intro: "You have the right to:",
          points: [
            "Request a copy of your data.",
            "Request correction or deletion.",
            "Withdraw consent for data processing."
          ],
          contact: "Contact: support@servyard.com"
        },
        acknowledgment: "By using ServYard, you acknowledge that you have read and understood this Privacy Policy."
      },
      disclaimer: {
        title: "Disclaimer",
        lastUpdated: "Last updated",
        intro: "ServYard is a neutral digital platform.",
        points: [
          "We do not endorse, control, or guarantee the quality, legality, safety, or accuracy of any services offered by Providers.",
          "All responsibility rests solely with Providers and Clients.",
          "By registering, all users release ServYard from liability for any claims, damages, or disputes.",
          "ServYard reserves the right to suspend or terminate accounts that misuse the platform."
        ],
        acknowledgment: "By using ServYard, you acknowledge and accept this disclaimer in its entirety."
      },
      contentPolicy: {
        title: "Content Policy",
        lastUpdated: "Last updated",
        acceptable: {
          title: "1. Acceptable Content",
          content: "Users may only post content that is accurate, lawful, and respectful."
        },
        prohibited: {
          title: "2. Prohibited Content",
          points: [
            "Illegal services (e.g., drugs, weapons, gambling).",
            "Offensive, harmful, or discriminatory material.",
            "False or misleading claims.",
            "Intellectual property violations."
          ]
        },
        moderation: {
          title: "3. Moderation",
          points: [
            "ServYard uses automated tools and human review to detect prohibited content.",
            "Violations may result in content removal or account termination."
          ]
        },
        reporting: {
          title: "4. Reporting",
          content: "Users may report suspicious or illegal content. ServYard will investigate and act as necessary."
        },
        acknowledgment: "By using ServYard, you agree to comply with our Content Policy."
      },
      aboutUs: {
        title: "About Us",
        content: [
          "ServYard is a cutting-edge digital marketplace that bridges the gap between service seekers and service providers worldwide.",
          "Our mission is to create a trusted ecosystem where quality services meet genuine needs, fostering community connections and economic opportunities.",
          "Whether you're looking for professional services or wanting to offer your expertise, ServYard provides the platform to make meaningful connections happen."
        ]
      },
      contactUs: {
        title: "Contact Us",
        website: "Website",
        email: "Email",
        address: "Address"
      },
      providerTerms: {
        title: "Provider Terms & Conditions",
        intro: "By creating an account on ServYard, I, the undersigned Service Provider, confirm that:",
        points: [
          "I am fully responsible for the legality, quality, and accuracy of my services.",
          "I will comply with all applicable local and international laws and licensing requirements.",
          "I am solely responsible for customer service, scheduling, pricing, and delivery.",
          "I release ServYard from all liability arising from my services, clients, or transactions.",
          "I understand that failure to comply may result in suspension or termination of my account."
        ]
      },
      customerTerms: {
        title: "Client Terms & Conditions",
        intro: "By creating an account on ServYard, I, the undersigned Client, acknowledge that:",
        points: [
          "ServYard is only a platform connecting me with independent service providers.",
          "I am responsible for verifying the provider's details and suitability before engaging.",
          "I understand that ServYard does not guarantee the quality, legality, or safety of services.",
          "I release ServYard from all liability related to my use of the platform or any transactions with providers.",
          "I agree to use the platform only for lawful purposes."
        ]
      }
    },
    footer: {
      tagline: "Connecting service providers with customers worldwide",
      copyright: "© 2024 ServYard. All rights reserved.",
      paymentDisclaimer: "Payments are processed directly between providers and customers",
      links: {
        terms: "Terms",
        privacy: "Privacy",
        disclaimer: "Disclaimer",
        contentPolicy: "Content Policy",
        aboutUs: "About Us",
        contactUs: "Contact Us"
      }
    },
  },
  ar: {
    nav: {
      home: "الرئيسية",
      services: "الخدمات",
      providerLogin: "دخول مقدم الخدمة",
      customerLogin: "دخول العميل",
      register: "تسجيل",
      language: "اللغة",
      location: "الموقع",
      theme: "المظهر",
      notifications: "الإشعارات",
    },
    home: {
      title: "سيرف يارد - منصة الخدمات المتميزة",
      subtitle: "تواصل مع مقدمي الخدمات المعتمدين في منطقتك",
      searchPlaceholder: "البحث عن خدمات...",
      findServices: "العثور على الخدمات",
      becomeProvider: "كن مقدم خدمة",
      featuredCategories: "الفئات المميزة",
      servicesOnMap: "الخدمات عبر الخريطة",
      login: "تسجيل الدخول",
      myAccount: "حسابي",
      dashboard: "لوحة التحكم",
    },
    ui: {
      languageChanged: "تم تغيير اللغة",
      interfaceUpdated: "تم تحديث لغة الواجهة",
      loadMore: "تحميل المزيد من الخدمات",
      noData: "لا توجد بيانات متاحة",
      coming_soon: "قريباً",
      relevance: "الصلة",
      highestRated: "الأعلى تقييماً",
      priceLowHigh: "السعر: من المنخفض إلى العالي",
      priceHighLow: "السعر: من العالي إلى المنخفض",
      // New reusable UI messages (Arabic)
      loading: "جاري التحميل...",
      loadingMoreServices: "جاري تحميل المزيد من الخدمات...",
      allCategories: "جميع الفئات",
      accessDenied: "تم رفض الوصول",
      providerAccessRequired: "يجب أن تقوم بتسجيل الدخول كمقدم خدمة للوصول إلى هذه الصفحة.",
      statusUpdated: "تم تحديث الحالة",
      serviceDeleted: "تم حذف الخدمة بنجاح",
      serviceDeleteFailed: "فشل حذف الخدمة",
      errorLoadingServices: "فشل في تحميل الخدمات",
      verified: "موثّق",
      minutes: "دقائق",
      pageNotFound: "الصفحة غير موجودة",
      goHome: "العودة للرئيسية",
      serviceNotFound: "لم يتم العثور على الخدمة",
      serviceUpdated: "تم تحديث الخدمة بنجاح",
      serviceUpdateFailed: "حدث خطأ في تحديث الخدمة",
      providerNotFound: "لم يتم العثور على مقدم الخدمة",
      errorLoadingData: "حدث خطأ في تحميل البيانات",
      // Booking helpers (Arabic)
      missingBookingInfo: "يرجى اختيار التاريخ والوقت للحجز",
      bookingRequestSent: "تم إرسال طلب الحجز إلى مقدم الخدمة",
      loginRequired: "يرجى تسجيل الدخول للمتابعة",
      customerAccessRequired: "يجب أن تقوم بتسجيل الدخول كعميل للمتابعة",
      serviceCreated: "تم إنشاء الخدمة بنجاح",
      serviceCreateFailed: "فشل إنشاء الخدمة",
    },
    dashboard: {
      main: "التنقل الرئيسي",
      account: "الحساب",
      dashboards: "لوحات التحكم",
      providerDashboard: "لوحة تحكم مقدم الخدمة",
      customerDashboard: "لوحة تحكم العميل",
    },
    notificationsUI: {
      historyTitle: "سجل الإشعارات",
      all: "الكل",
      foreground: "أمام",
      background: "خلفية",
      clear: "مسح",
      markAllRead: "تعليم الكل كمقروء",
      searchPlaceholder: "بحث...",
      noNotifications: "لا يوجد إشعارات",
      openBooking: "فتح الحجز",
      categoryAll: "كل الأنواع",
      categoryBooking: "الحجوزات",
      categoryReminder: "التذكيرات",
      categorySystem: "النظام",
      categoryOther: "أخرى",
      bookingStatusAll: "كل الحالات",
      bookingStatusPending: "معلق",
      bookingStatusConfirmed: "مؤكد",
      bookingStatusCancelled: "ملغي",
      bookingStatusCompleted: "مكتمل",
      bookingStatusNoShow: "لم يحضر",
    },
    auth: {
      welcome: "مرحباً بك في سيرف يارد",
      subtitle: "انضم إلى منصة الخدمات المتميزة",
      login: "تسجيل الدخول",
      signup: "إنشاء حساب",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      fullName: "الاسم الكامل",
      phoneNumber: "رقم الهاتف",
      phoneNumbers: "أرقام الهواتف",
      whatsappNumber: "رقم الواتساب",
      city: "المدينة",
      country: "البلد",
      emailPlaceholder: "أدخل بريدك الإلكتروني",
      passwordPlaceholder: "أدخل كلمة المرور",
      fullNamePlaceholder: "أدخل اسمك الكامل",
      phoneNumberPlaceholder: "أدخل رقم هاتفك",
      whatsappNumberPlaceholder: "أدخل رقم الواتساب",
      cityPlaceholder: "أدخل مدينتك",
      countryPlaceholder: "أدخل بلدك",
      joinAsProvider: "الانضمام كمقدم خدمة",
      joinAsCustomer: "الانضمام كعميل",
      providerDescription: "قدم خدماتك للعملاء",
      customerDescription: "ابحث واحجز الخدمات التي تحتاجها",
      providerSignup: "تسجيل مقدم الخدمة",
      customerSignup: "تسجيل العميل",
      basicInfo: "المعلومات الأساسية",
      contactInfo: "معلومات الاتصال",
      location: "الموقع",
      businessInfo: "معلومات العمل",
      website: "الموقع الإلكتروني",
      googleBusiness: "جوجل بزنس",
      licenseNumber: "رقم الترخيص",
      licenseVerification: "رابط التحقق من الترخيص",
      description: "الوصف",
      websitePlaceholder: "https://موقعك.com",
      googleBusinessPlaceholder: "رابط جوجل بزنس",
      licenseNumberPlaceholder: "رقم الترخيص المهني",
      licenseVerificationPlaceholder: "رابط التحقق من الترخيص",
      descriptionPlaceholder: "اوصف خدماتك...",
      addPhone: "إضافة رقم هاتف",
      termsAgreement: "أوافق على الشروط والأحكام وسياسة الخصوصية",
      termsRequired: "يجب قبول الشروط والأحكام",
      createProviderAccount: "إنشاء حساب مقدم خدمة",
      createCustomerAccount: "إنشاء حساب عميل",
      signupSuccess: "تم إنشاء الحساب بنجاح",
      checkEmailVerification: "يرجى التحقق من بريدك الإلكتروني لتفعيل حسابك",
      signupError: "فشل في إنشاء الحساب",
      loginSuccess: "تم تسجيل الدخول بنجاح",
      welcomeBack: "مرحباً بعودتك إلى سيرف يارد",
      loginError: "فشل في تسجيل الدخول",
      alreadyHaveAccount: "لديك حساب بالفعل؟",
      dontHaveAccount: "ليس لديك حساب؟",
      forgotPassword: "نسيت كلمة المرور؟",
      resetPassword: "إعادة تعيين كلمة المرور",
      backToLogin: "العودة لتسجيل الدخول",
      createAccount: "إنشاء حساب",
      signingIn: "جاري تسجيل الدخول...",
      signingUp: "جاري إنشاء الحساب...",
      accountCreated: "تم إنشاء الحساب بنجاح"
    },
    categories: {
      medical: "طبي",
      homeServices: "خدمات منزلية",
      automotive: "خدمات السيارات",
      education: "التعليم",
      beauty: "الجمال والعافية",
      fitness: "اللياقة البدنية",
      technology: "التكنولوجيا",
      legal: "قانوني",
      financial: "مالي",
      cleaning: "تنظيف",
      repair: "إصلاح",
      consulting: "استشارات",
    },
    actions: {
      search: "بحث",
      book: "احجز الآن",
      contact: "اتصل",
      share: "مشاركة",
      login: "تسجيل دخول",
      register: "تسجيل",
      save: "حفظ",
      cancel: "إلغاء",
      edit: "تعديل",
      delete: "حذف",
      confirm: "تأكيد",
      back: "رجوع",
      next: "التالي",
      submit: "إرسال",
    },
    provider: {
      profile: "الملف الشخصي",
      services: "الخدمات",
      schedule: "الجدول الزمني",
      bookings: "الحجوزات",
      reviews: "التقييمات",
      dashboard: "لوحة التحكم",
      addService: "إضافة خدمة",
      editService: "تعديل الخدمة",
      availability: "التوفر",
      settings: "الإعدادات",
      shareProfile: "مشاركة الملف الشخصي",
      customLink: "رابط مخصص",
      generateLink: "إنشاء رابط",
      copyLink: "نسخ الرابط",
      linkCopied: "تم نسخ الرابط",
      myServices: "خدماتي",
      manageServices: "إدارة عروض الخدمات الخاصة بك",
      rating: "التقييم",
      revenue: "الإيرادات",
      thisMonth: "هذا الشهر",
      pendingBookings: "الحجوزات المعلقة",
      pendingBookingsTitle: "الحجوزات المعلقة",
      bookingsAwaitingApproval: "الحجوزات التي تحتاج موافقتك",
      noBookingsFound: "لا توجد حجوزات",
      bookingManagementTitle: "إدارة الحجوزات",
      bookingManagementSubtitle: "عرض وإدارة جميع حجوزات خدماتك",
      today: "اليوم",
      thisWeek: "هذا الأسبوع",
      allTime: "الكل",
      filterByStatus: "تصفية حسب الحالة",
      bookingStatusAll: "الكل",
      bookingStatusNoShow: "لم يحضر",
      activeServices: "الخدمات النشطة",
      recentBookings: "الحجوزات الأخيرة",
      manageBookings: "إدارة حجوزاتك القادمة",
      offers: "العروض",
      noServicesYet: "لا توجد خدمات بعد",
      createFirstService: "أنشئ خدمتك الأولى لبدء استقبال الحجوزات",
      addFirstService: "أضف خدمتك الأولى",
      active: "نشط",
      inactive: "غير نشط",
      price: "السعر",
      duration: "المدة",
      range: "النطاق",
    },
    customer: {
      myBookings: "حجوزاتي",
      favorites: "المفضلة",
      reviews: "التقييمات",
      profile: "الملف الشخصي",
      history: "السجل",
      dashboard: "لوحة التحكم الخاصة بي",
      managementDescription: "إدارة حجوزاتك وتفضيلاتك",
      pendingBookings: "الحجوزات المعلقة",
      awaitingConfirmation: "في انتظار التأكيد",
      savedProviders: "مقدمو الخدمات المحفوظون",
      reviewsGiven: "التقييمات المُعطاة",
      completed: "مكتملة",
      findServices: "العثور على الخدمات",
      recentBookings: "الحجوزات الأخيرة",
      favoriteProviders: "مقدمو الخدمات المفضلون",
      bookingHistory: "تاريخ الحجوزات",
      rate: "قيم",
      bookings: "حجوزات",
      welcomeBack: "مرحباً بعودتك",
      manageBookings: "إدارة حجوزاتك واكتشاف خدمات جديدة",
      logout: "تسجيل خروج",
      editProfile: "تعديل الملف الشخصي",
      browseServices: "تصفح الخدمات",
      totalBookings: "إجمالي الحجوزات",
      myReviews: "تقييماتي",
      providerResponse: "رد مزود الخدمة",
      call: "اتصال",
      whatsapp: "واتساب",
      notes: "ملاحظات",
      profileInformation: "معلومات الملف الشخصي",
      fullName: "الاسم الكامل",
      location: "الموقع",
      noBookingsYet: "لا توجد حجوزات بعد",
      startBrowsing: "ابدأ بتصفح الخدمات وقم بأول حجز لك",
      confirmCompletion: "تأكيد إتمام الخدمة",
      writeReview: "كتابة تقييم",
      editReview: "تعديل",
      cancel: "إلغاء",
      contactProvider: "تواصل مع مزود الخدمة",
      noReviewsYet: "لا توجد تقييمات بعد",
      startReviewing: "احجز خدمة وشارك تجربتك",
      providerLabel: "مقدم الخدمة:",
      upcoming: "القادمة",
      past: "الماضية",
      noUpcomingBookings: "ليس لديك أي حجوزات قادمة",
      noPastBookings: "لا توجد حجوزات سابقة",
      viewDetails: "عرض التفاصيل",
      reviewsModal: {
        editTitle: "تعديل التقييم",
        createTitle: "تقييم الخدمة",
        editDescription: "يمكنك تعديل تقييمك للخدمة هنا",
        createDescription: "اختر عدد النجوم لتقييم جودة الخدمة المقدمة",
        ratingLabels: ["ضعيف", "مقبول", "جيد", "جيد جداً", "ممتاز"],
      },
      outOf5: "من 5",
    },
    booking: {
      selectService: "اختر الخدمة",
      selectTime: "اختر الوقت",
      confirmDetails: "أكد التفاصيل",
      bookingConfirmed: "تم تأكيد الحجز",
      bookingPending: "الحجز معلق",
      bookingCancelled: "تم إلغاء الحجز",
      contactProvider: "اتصل بمقدم الخدمة",
      customer: "العميل",
      serviceId: "رقم الخدمة",
      notes: "ملاحظات",
      clientRating: "تقييم العميل",
      noRatingYet: "لم يتم التقييم بعد",
      confirm: "تأكيد",
      reject: "رفض",
      completed: "مكتمل",
      call: "اتصال",
      whatsapp: "واتس اب",
      statuses: {
        pending: "في الانتظار",
        confirmed: "مؤكد",
        rejected: "مرفوض",
        completed: "تمت - يحتاج تأكيد",
        confirmed_completed: "مكتمل",
        cancelled: "ملغي",
      },
    },
    forms: {
      name: "الاسم",
      email: "البريد الإلكتروني",
      phone: "الهاتف",
      address: "العنوان",
      city: "المدينة",
      country: "البلد",
      description: "الوصف",
      price: "السعر",
      duration: "المدة",
      category: "الفئة",
      specialty: "التخصص",
      license: "الترخيص",
      website: "الموقع الإلكتروني",
      submit: "إرسال",
      cancel: "إلغاء",
      save: "حفظ",
      delete: "حذف",
      edit: "تعديل",
      create: "إنشاء",
      update: "تحديث",
    },
    editProfile: {
      title: "تعديل الملف الشخصي",
      subtitle: "قم بتحديث معلوماتك الشخصية وبيانات التواصل",
      basicInfo: "المعلومات الأساسية",
      contactNumbers: "أرقام التواصل",
      additionalPhones: "أرقام الهاتف الإضافية",
      profileDescription: "وصف الملف الشخصي",
      providerInfo: "معلومات مزود الخدمة",
      backToDashboard: "العودة إلى لوحة التحكم",
      loading: "جاري التحميل...",
      saving: "جاري الحفظ...",
      saveChanges: "حفظ التغييرات",
      fullName: "الاسم الكامل",
      email: "البريد الإلكتروني",
      city: "المدينة",
      country: "البلد",
      whatsappNumber: "رقم الواتس اب",
      whatsappPlaceholder: "أدخل رقم الواتس اب مع رمز البلد (+971...)",
      additionalPhonePlaceholder: "أدخل رقم هاتف إضافي",
      descriptionPlaceholder: "اكتب نبذة عنك أو عن خدماتك...",
      website: "موقع الويب",
      googleBusiness: "رابط Google Business",
      licenseNumber: "رقم الترخيص",
      websitePlaceholder: "https://example.com",
      googleBusinessPlaceholder: "رابط صفحة Google Business",
      licensePlaceholder: "رقم ترخيص مزاولة المهنة",
      fullNamePlaceholder: "أدخل اسمك الكامل",
      emailPlaceholder: "أدخل بريدك الإلكتروني",
      cityPlaceholder: "أدخل مدينتك",
      countryPlaceholder: "أدخل بلدك",
      successTitle: "تم بنجاح",
      successMessage: "تم تحديث الملف الشخصي بنجاح",
      errorTitle: "خطأ",
      errorMessage: "حدث خطأ في حفظ البيانات",
      validationError: "خطأ",
      validationMessage: "يرجى ملء الاسم الكامل والإيميل",
      cancel: "إلغاء",
    },
    addService: {
      title: "إضافة خدمة جديدة",
      subtitle: "أنشئ عرض خدمة جديد لعملائك",
      serviceDetails: "تفاصيل الخدمة",
      basicInfo: "المعلومات الأساسية",
      serviceName: "اسم الخدمة",
      category: "الفئة",
      selectCategory: "اختر الفئة",
      description: "الوصف",
      describeService: "اوصف خدمتك",
      pricingDuration: "التسعير والمدة",
      approximatePrice: "السعر التقريبي",
      priceRange: "نطاق السعر",
      priceRangeBudget: "اقتصادي",
      priceRangeStandard: "متوسط",
      priceRangePremium: "مميز",
      selectRange: "اختر النطاق",
      durationMinutes: "المدة (بالدقائق)",
      specialtyInfo: "معلومات التخصص",
      specialtyDescription: "وصف التخصص",
      whatMakesUnique: "ما الذي يجعل خدمتك فريدة؟",
      createService: "إنشاء الخدمة",
      creating: "جاري الإنشاء...",
      enterServiceName: "أدخل اسم الخدمة",
    },
    toast: {
      locationNotSupported: "الموقع غير مدعوم",
      locationNotSupportedDesc: "متصفحك لا يدعم تحديد الموقع الجغرافي",
      locatingUser: "جاري تحديد الموقع...",
      locatingUserDesc: "يرجى الانتظار بينما نحدد موقعك",
      locationSuccess: "تم تحديد الموقع بنجاح! ✅",
      locationFailed: "فشل في تحديد الموقع",
      locationPermissionDenied: "تم رفض الإذن للوصول إلى الموقع",
      locationUnavailable: "معلومات الموقع غير متاحة",
      locationTimeout: "انتهت مهلة تحديد الموقع",
      onlineStatus: "أصبحت متاحاً الآن",
      offlineStatus: "أصبحت غير متاح",
      onlineStatusDesc: "سيتمكن العملاء من رؤية أنك متاح للحجز",
      offlineStatusDesc: "لن يتمكن العملاء من حجز خدماتك",
      error: "خطأ",
      statusUpdateError: "خطأ في تحديث الحالة",
      bookingConfirmed: "تم تأكيد الحجز",
      bookingRejected: "تم رفض الحجز",
      bookingCompleted: "تمت الخدمة",
      bookingConfirmedDesc: "تم تأكيد الحجز بنجاح",
      bookingRejectedDesc: "تم رفض الحجز",
      bookingCompletedDesc: "تم تحديد الخدمة كمكتملة، في انتظار تأكيد العميل",
      bookingError: "خطأ",
      bookingErrorDesc: "حدث خطأ أثناء تحديث الحجز",
      reviewUpdated: "تم تحديث التقييم",
      reviewUpdatedDesc: "تم تحديث تقييمك بنجاح",
      reviewSubmitted: "تم إرسال التقييم",
      reviewSubmittedDesc: "شكراً لك على تقييم الخدمة",
      reviewErrorDesc: "حدث خطأ أثناء معالجة التقييم",
    },
    userInterface: {
      welcome: "مرحباً بعودتك",
      editProfile: "تعديل الملف الشخصي",
      logout: "تسجيل الخروج",
      providerPanel: "لوحة مقدم الخدمة",
      customerPanel: "لوحة العميل",
      onlineNow: "متاح الآن",
      offline: "غير متاح",
      browseServices: "تصفح الخدمات",
    },

    // Availability Management  
    availability: {
      availabilityManagement: "إدارة التوفر",
      setWorkingHours: "تحديد أوقات العمل والأيام المتوفرة",
      serviceSelection: "اختيار الخدمة",
      selectService: "اختر خدمة",
      weeklyAvailability: "التوفر الأسبوعي",
      setAvailableDaysTime: "حدد الأيام والأوقات المتوفرة للعمل",
      addAvailability: "إضافة توفر",
      editAvailability: "إضافة/تعديل التوفر",
      day: "اليوم",
      selectDay: "اختر اليوم",
      startTime: "وقت البداية",
      endTime: "وقت النهاية",
      available: "متوفر",
      notAvailable: "غير متوفر",
      notSet: "غير محدد",
      specialDates: "التواريخ الخاصة",
      addHolidaysSpecialDays: "إضافة عطلات أو أيام عمل استثنائية",
      addSpecialDate: "إضافة تاريخ خاص",
      setSpecialDateHoliday: "حدد تاريخ معين كعطلة أو يوم عمل استثنائي",
      date: "التاريخ",
      availableForWork: "متوفر للعمل",
      noteOptional: "ملاحظة (اختيارية)",
      noteExample: "مثال: عطلة رسمية، يوم عمل إضافي...",
      noSpecialDatesAvailable: "لا توجد تواريخ خاصة متاحة",
      messages: {
        requiredFields: "يرجى ملء جميع الحقول المطلوبة",
        endTimeAfterStart: "وقت النهاية يجب أن يكون بعد وقت البداية",
        updatedSuccess: "تم تحديث التوفر بنجاح",
        createdSuccess: "تم إضافة التوفر بنجاح",
        saveError: "حدث خطأ في حفظ التوفر",
        specialDateRequiredFields: "يرجى ملء الحقول المطلوبة",
        specialDateCreatedSuccess: "تم إضافة التاريخ الخاص بنجاح",
        specialDateSaveError: "حدث خطأ في حفظ التاريخ الخاص",
      },
    },

    // Offers Management
    offers: {
      offersManagement: "إدارة العروض",
      createManageOffers: "إنشاء وإدارة العروض الخاصة والخصومات",
      addNewOffer: "إضافة عرض جديد",
      editOffer: "تعديل العرض",
      fillDetailsCreateOffer: "املأ التفاصيل التالية لإنشاء عرض خاص",
      editOfferDetails: "قم بتعديل تفاصيل العرض",
      offerTitle: "عنوان العرض *",
      offerTitleExample: "مثال: خصم 20% على خدمات التنظيف",
      offerDescription: "وصف العرض",
      offerDetailsConditions: "تفاصيل العرض وشروطه...",
      discountType: "نوع الخصم",
      percentage: "نسبة مئوية",
      fixedAmount: "مبلغ ثابت",
      discountPercentage: "نسبة الخصم (%)",
      discountAmount: "مبلغ الخصم (ريال)",
      startDate: "تاريخ البداية *",
      endDate: "تاريخ الانتهاء *",
      activeOffer: "عرض نشط",
      updating: "جاري التحديث...",
      adding: "جاري الإضافة...",
      update: "تحديث",
      add: "إضافة",
      noOffers: "لا توجد عروض",
      createFirstOffer: "ابدأ بإنشاء عرضك الأول",
      active: "نشط",
      inactive: "متوقف",
      expired: "منتهي",
      upcoming: "قادم",
      off: "% خصم",
      currencySar: "ريال",
      messages: {
        loadError: "حدث خطأ في تحميل العروض",
        requiredFields: "يرجى ملء الحقول المطلوبة",
        invalidDiscountPercentage: "يرجى إدخال نسبة خصم صحيحة بين 1 و 100",
        invalidDiscountAmount: "يرجى إدخال مبلغ خصم صحيح",
        endDateAfterStart: "تاريخ انتهاء العرض يجب أن يكون بعد تاريخ البداية",
        updatedSuccess: "تم تحديث العرض بنجاح",
        createdSuccess: "تم إضافة العرض بنجاح",
        saveErrorUpdate: "حدث خطأ في تحديث العرض",
        saveErrorCreate: "حدث خطأ في إنشاء العرض",
        deleteConfirm: "هل أنت متأكد من حذف هذا العرض؟",
        deleteSuccess: "تم حذف العرض بنجاح",
        deleteError: "حدث خطأ في حذف العرض",
      },
    },

    // Share Profile
    shareProfile: {
      shareProfile: "مشاركة ملفك الشخصي",
      profileLink: "رابط ملفك الشخصي",
      shareWithClients: "شارك هذا الرابط مع العملاء ليتمكنوا من رؤية خدماتك وحجزها",
      qrCode: "رمز الاستجابة السريعة (QR Code)",
      downloadQRCode: "تحميل رمز الاستجابة السريعة",
      qrCodeDescription: "يمكن للعملاء مسح هذا الرمز بكاميرا هواتفهم للوصول إلى ملفك الشخصي مباشرة",
    },
    legal: {
      terms: {
        title: "الشروط والأحكام",
        lastUpdated: "آخر تحديث",
        intro: "مرحباً بك في سيرف يارد. باستخدام موقعنا الإلكتروني (www.servyard.com) أو تطبيقاتنا المحمولة (أندرويد، iOS، هواوي)، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق، فلا يجوز لك استخدام المنصة.",
        purpose: {
          title: "1. الغرض من المنصة",
          content: "سيرف يارد هي منصة عالمية مصممة لربط مقدمي الخدمات بالعملاء. سيرف يارد نفسها لا تقدم أو تشرف أو تضمن أي خدمات. جميع المعاملات والاتصالات تحدث مباشرة بين مقدمي الخدمات والعملاء."
        },
        userAccounts: {
          title: "2. حسابات المستخدمين",
          points: [
            "يجب على مقدمي الخدمات تقديم معلومات دقيقة وقانونية حول خدماتهم، بما في ذلك التراخيص الصحيحة عند اقتضاء القانون.",
            "يجب على العملاء تقديم تفاصيل اتصال دقيقة واستخدام المنصة للأغراض القانونية فقط.",
            "يوافق كل من مقدمي الخدمات والعملاء على توقيع اتفاقية إلكترونية تحرر سيرف يارد من المسؤولية عن أي نزاعات أو أضرار.",
            "يمكن تعليق الحسابات أو إنهاؤها وفقاً لتقدير سيرف يارد عند انتهاك هذه الشروط."
          ]
        },
        serviceListings: {
          title: "3. قوائم الخدمات",
          points: [
            "مقدمو الخدمات مسؤولون وحدهم عن دقة وقانونية وجودة أوصاف خدماتهم وجداولهم وأسعارهم.",
            "يجب على مقدمي الخدمات عدم إدراج خدمات غير قانونية أو مقيدة.",
            "تحتفظ سيرف يارد بالحق في إزالة المحتوى الذي ينتهك القوانين أو السياسات."
          ]
        },
        payments: {
          title: "4. المدفوعات",
          points: [
            "سيرف يارد لا تعالج المدفوعات.",
            "المدفوعات والتسليم ودعم ما بعد الخدمة هي مسؤولية مقدمي الخدمات والعملاء وحدهم."
          ]
        },
        location: {
          title: "5. خدمات الموقع",
          points: [
            "قد يسمح العملاء لسيرف يارد بالوصول إلى موقعهم لعرض الخدمات القريبة.",
            "بيانات الموقع تُستخدم فقط لتحسين الصلة ولا تُباع لأطراف ثالثة."
          ]
        },
        intellectualProperty: {
          title: "6. الملكية الفكرية",
          points: [
            "يجب على المستخدمين تحميل المحتوى الذي يملكونه أو لديهم الحق في استخدامه فقط.",
            "بالنشر، يمنح مقدمو الخدمات سيرف يارد ترخيصاً غير حصري لعرض هذا المحتوى على المنصة."
          ]
        },
        liability: {
          title: "7. تحديد المسؤولية",
          content: "سيرف يارد غير مسؤولة عن أي أضرار أو خسائر أو نزاعات تنشأ عن استخدام المنصة. المسؤولية تقع بالكامل على مقدمي الخدمات والعملاء."
        },
        governingLaw: {
          title: "8. القانون المعمول به",
          content: "هذه الشروط محكومة بالمعايير الدولية للتجارة الإلكترونية والقوانين المحلية المعمول بها في بلد مقدم الخدمة والعميل."
        },
        acknowledgment: "باستخدام سيرف يارد، فإنك تقر بأنك قرأت وفهمت ووافقت على الالتزام بهذه الشروط والأحكام."
      },
      privacy: {
        title: "سياسة الخصوصية",
        lastUpdated: "آخر تحديث",
        intro: "تقدر سيرف يارد خصوصيتك. تشرح سياسة الخصوصية هذه كيف نجمع ونستخدم ونحمي معلوماتك.",
        dataCollection: {
          title: "1. البيانات التي نجمعها",
          clients: {
            title: "العملاء:",
            content: "الاسم، معلومات الاتصال، الموقع، بيانات تسجيل الدخول."
          },
          providers: {
            title: "مقدمو الخدمات:",
            content: "اسم العمل، تفاصيل الترخيص، معلومات الاتصال، أوصاف الخدمات، صور اختيارية."
          },
          general: {
            title: "عام:",
            content: "عنوان IP، نوع الجهاز، المتصفح، ملفات تعريف الارتباط."
          }
        },
        purpose: {
          title: "2. الغرض من الجمع",
          points: [
            "لإنشاء وإدارة حسابات المستخدمين.",
            "لربط العملاء بمقدمي الخدمات بناءً على الموقع والتفضيلات.",
            "لضمان الامتثال لسياسات المنصة.",
            "لعرض الإعلانات ذات الصلة (Google AdSense/AdMob)."
          ]
        },
        dataSharing: {
          title: "3. مشاركة البيانات",
          intro: "نحن لا نبيع البيانات الشخصية. قد تُشارك البيانات فقط مع:",
          points: [
            "السلطات، عند المطلوب بموجب القانون.",
            "مقدمي الخدمات (مثل الاستضافة، التحليلات) تحت اتفاقيات السرية."
          ]
        },
        compliance: {
          title: "4. الامتثال الدولي",
          content: "تتوافق سيرف يارد مع GDPR (الاتحاد الأوروبي)، PDPL (الإمارات)، CCPA (كاليفورنيا)، ومعايير حماية البيانات الدولية المماثلة."
        },
        security: {
          title: "5. أمان البيانات",
          content: "نستخدم التشفير وضوابط الوصول والمراقبة لحماية بياناتك. لا يوجد نظام آمن بنسبة 100%، لكننا ننفذ ضمانات معيارية في الصناعة."
        },
        userRights: {
          title: "6. حقوق المستخدم",
          intro: "لديك الحق في:",
          points: [
            "طلب نسخة من بياناتك.",
            "طلب التصحيح أو الحذف.",
            "سحب الموافقة على معالجة البيانات."
          ],
          contact: "اتصل: support@servyard.com"
        },
        acknowledgment: "باستخدام سيرف يارد، فإنك تقر بأنك قرأت وفهمت سياسة الخصوصية هذه."
      },
      disclaimer: {
        title: "إخلاء المسؤولية",
        lastUpdated: "آخر تحديث",
        intro: "سيرف يارد هي منصة رقمية محايدة.",
        points: [
          "نحن لا نصادق على أو نتحكم في أو نضمن جودة أو قانونية أو سلامة أو دقة أي خدمات يقدمها مقدمو الخدمات.",
          "جميع المسؤوليات تقع وحدها على مقدمي الخدمات والعملاء.",
          "بالتسجيل، جميع المستخدمين يحررون سيرف يارد من المسؤولية عن أي مطالبات أو أضرار أو نزاعات.",
          "تحتفظ سيرف يارد بالحق في تعليق أو إنهاء الحسابات التي تسيء استخدام المنصة."
        ],
        acknowledgment: "باستخدام سيرف يارد، فإنك تقر وتقبل إخلاء المسؤولية هذا بالكامل."
      },
      contentPolicy: {
        title: "سياسة المحتوى",
        lastUpdated: "آخر تحديث",
        acceptable: {
          title: "1. المحتوى المقبول",
          content: "يجوز للمستخدمين نشر محتوى دقيق وقانوني ومحترم فقط."
        },
        prohibited: {
          title: "2. المحتوى المحظور",
          points: [
            "الخدمات غير القانونية (مثل المخدرات، الأسلحة، القمار).",
            "المواد المسيئة أو الضارة أو التمييزية.",
            "الادعاءات الكاذبة أو المضللة.",
            "انتهاكات الملكية الفكرية."
          ]
        },
        moderation: {
          title: "3. الإشراف",
          points: [
            "تستخدم سيرف يارد أدوات آلية ومراجعة بشرية للكشف عن المحتوى المحظور.",
            "قد تؤدي الانتهاكات إلى إزالة المحتوى أو إنهاء الحساب."
          ]
        },
        reporting: {
          title: "4. الإبلاغ",
          content: "يمكن للمستخدمين الإبلاغ عن المحتوى المشبوه أو غير القانوني. ستقوم سيرف يارد بالتحقيق واتخاذ الإجراءات اللازمة."
        },
        acknowledgment: "باستخدام سيرف يارد، فإنك توافق على الالتزام بسياسة المحتوى الخاصة بنا."
      },
      aboutUs: {
        title: "من نحن",
        content: [
          "سيرف يارد هي سوق رقمية متطورة تسد الفجوة بين الباحثين عن الخدمات ومقدمي الخدمات في جميع أنحاء العالم.",
          "مهمتنا هي خلق نظام بيئي موثوق حيث تلتقي الخدمات عالية الجودة بالاحتياجات الحقيقية، وتعزز الروابط المجتمعية والفرص الاقتصادية.",
          "سواء كنت تبحث عن خدمات مهنية أو تريد تقديم خبرتك، توفر سيرف يارد المنصة لجعل الاتصالات المعنوية تحدث."
        ]
      },
      contactUs: {
        title: "اتصل بنا",
        website: "الموقع الإلكتروني",
        email: "البريد الإلكتروني",
        address: "العنوان"
      },
      providerTerms: {
        title: "شروط وأحكام مقدم الخدمة",
        intro: "بإنشاء حساب في سيرف يارد، أنا، مقدم الخدمة الموقع أدناه، أؤكد أن:",
        points: [
          "أنا مسؤول بالكامل عن قانونية وجودة ودقة خدماتي.",
          "سأتوافق مع جميع القوانين ومتطلبات الترخيص المحلية والدولية المعمول بها.",
          "أنا مسؤول وحدي عن خدمة العملاء والجدولة والتسعير والتسليم.",
          "أحرر سيرف يارد من جميع المسؤوليات الناشئة عن خدماتي أو عملائي أو معاملاتي.",
          "أفهم أن عدم الامتثال قد يؤدي إلى تعليق أو إنهاء حسابي."
        ]
      },
      customerTerms: {
        title: "شروط وأحكام العميل",
        intro: "بإنشاء حساب في سيرف يارد، أنا، العميل الموقع أدناه، أقر بأن:",
        points: [
          "سيرف يارد هي مجرد منصة تربطني بمقدمي خدمات مستقلين.",
          "أنا مسؤول عن التحقق من تفاصيل مقدم الخدمة ومدى ملاءمته قبل التعامل.",
          "أفهم أن سيرف يارد لا تضمن جودة أو قانونية أو سلامة الخدمات.",
          "أحرر سيرف يارد من جميع المسؤوليات المتعلقة باستخدامي للمنصة أو أي معاملات مع مقدمي الخدمات.",
          "أوافق على استخدام المنصة للأغراض القانونية فقط."
        ]
      }
    },
    notificationSettings: {
      title: "إعدادات الإشعارات",
      subtitle: "إدارة كيفية تلقي الإشعارات",
      enableNotifications: "تفعيل الإشعارات",
      enableDesc: "تلقي جميع الإشعارات من التطبيق",
      notificationsEnabled: "الإشعارات مفعلة ✓",
      notificationsEnabledDesc: "يمكنك الآن تلقي الإشعارات",
      bookingReminders: "تذكيرات الحجز",
      bookingRemindersDesc: "تذكيرك بالمواعيد القادمة",
      reminderTimes: "أوقات التذكير",
      reminderTimesDesc: "اختر متى تريد تلقي التذكيرات قبل موعدك",
      min15: "15 دقيقة قبل",
      min30: "30 دقيقة قبل",
      hour1: "ساعة واحدة قبل",
      hour2: "ساعتان قبل",
      hour3: "3 ساعات قبل",
      day1: "يوم واحد قبل",
      bookingUpdates: "تحديثات الحجز",
      bookingUpdatesDesc: "إشعارات حول تغييرات حالة الحجز",
      confirmations: "تأكيدات الحجز",
      cancellations: "إلغاءات الحجز",
      completions: "اكتمال الخدمة",
      quietHours: "ساعات الهدوء",
      quietHoursDesc: "تعطيل الإشعارات خلال ساعات معينة",
      enableQuietHours: "تفعيل ساعات الهدوء",
      quietStart: "بداية الهدوء",
      quietEnd: "نهاية الهدوء",
      testNotification: "اختبار الإشعار",
      sendTest: "إرسال إشعار تجريبي",
      testSent: "تم إرسال الإشعار التجريبي!",
      notificationHistory: "سجل الإشعارات",
      viewHistory: "عرض سجل الإشعارات",
      clearHistory: "مسح السجل",
      historyCleared: "تم مسح سجل الإشعارات",
      permissionDenied: "تم رفض إذن الإشعارات",
      permissionDeniedDesc: "يرجى تفعيل الإشعارات في إعدادات المتصفح",
      browserNotSupported: "المتصفح لا يدعم الإشعارات",
      browserNotSupportedDesc: "يرجى استخدام متصفح حديث"
    },
    footer: {
      tagline: "ربط مقدمي الخدمات بالعملاء في جميع أنحاء العالم",
      copyright: "© 2024 سيرف يارد. جميع الحقوق محفوظة.",
      paymentDisclaimer: "المدفوعات تتم معالجتها مباشرة بين مقدمي الخدمات والعملاء",
      links: {
        terms: "الشروط",
        privacy: "الخصوصية",
        disclaimer: "إخلاء المسؤولية",
        contentPolicy: "سياسة المحتوى",
        aboutUs: "من نحن",
        contactUs: "اتصل بنا"
      }
    },
  },
};

// Deep merge helper to allow partial language packs to fall back to English
function deepMerge<T>(base: T, patch: Partial<T>): T {
  const result: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
  for (const key in patch) {
    const baseVal: any = (base as any)[key];
    const patchVal: any = (patch as any)[key];
    if (patchVal && typeof patchVal === 'object' && !Array.isArray(patchVal) && baseVal && typeof baseVal === 'object' && !Array.isArray(baseVal)) {
      result[key] = deepMerge(baseVal, patchVal);
    } else if (patchVal !== undefined) {
      result[key] = patchVal as any;
    }
  }
  return result as T;
}

// Build full translation map by merging additionalLanguages over English baseline
const baseline = translations.en;
const mergedTranslations: Record<string, Translation> = { ...translations } as any;
for (const [code, pack] of Object.entries(additionalLanguages)) {
  // Only merge from additionalLanguages if not already in base translations
  if (!mergedTranslations[code]) {
    mergedTranslations[code] = deepMerge(baseline, pack as any);
  }
}

// Normalize language codes (e.g., zh-CN -> zh)
const languageAliases: Record<string, string> = {
  'en-us': 'en', 'en-gb': 'en', 'en-au': 'en', 'en-ca': 'en',
  'ar-sa': 'ar', 'ar-ae': 'ar', 'ar-eg': 'ar',
  'fr-fr': 'fr', 'fr-ca': 'fr',
  'es-es': 'es', 'es-419': 'es', 'es-mx': 'es', 'es-ar': 'es',
  'de-de': 'de', 'it-it': 'it', 'pt-pt': 'pt', 'pt-br': 'pt',
  'ru-ru': 'ru', 'tr-tr': 'tr', 'id-id': 'id',
  'ja-jp': 'ja', 'ko-kr': 'ko',
  'zh-cn': 'zh', 'zh-sg': 'zh', 'zh-hans': 'zh', 'zh-my': 'zh',
};

const normalizeLanguage = (language: string | undefined): string => {
  if (!language) return 'en';
  const lc = language.toLowerCase().replace('_', '-');
  if (languageAliases[lc]) return languageAliases[lc];
  // Fallback: use base part before dash
  const base = lc.split('-')[0];
  return mergedTranslations[base] ? base : 'en';
};

export const getTranslations = (language: string): Translation => {
  const norm = normalizeLanguage(language);
  return mergedTranslations[norm] || mergedTranslations.en;
};

export const supportedLanguages = defaultSupported;

export const rtlLanguages = rtlDefault;

export const useTranslation = (language: string = 'en') => {
  const norm = normalizeLanguage(language);
  const t = getTranslations(norm);
  const isRTL = rtlLanguages.includes(norm);
  // Dev helper: warn about missing translation keys for current language
  if ((import.meta as any)?.env?.DEV && norm !== 'en') {
    const pack = (additionalLanguages as any)[norm] as Partial<Translation> | undefined;
    const missing: string[] = [];
    const traverse = (base: any, p: any, path: string[]) => {
      for (const k of Object.keys(base)) {
        const nextPath = [...path, k];
        if (p && typeof p[k] !== 'undefined') {
          if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
            traverse(base[k], p[k], nextPath);
          }
        } else {
          missing.push(nextPath.join('.'));
        }
      }
    };
    if (!pack) {
      console.warn(`[i18n] No language pack for "${norm}". Falling back to English for all keys.`);
    } else {
      traverse(baseline as any, pack as any, []);
      if (missing.length) {
        console.warn(`[i18n] Missing ${missing.length} keys in "${norm}" pack. Examples:`, missing.slice(0, 10));
      }
    }
  }

  return { t, isRTL };
};