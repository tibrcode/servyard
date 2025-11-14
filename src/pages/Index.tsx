import React, { useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { SearchHero } from "@/components/home/SearchHero";
import { ServiceCategories } from "@/components/home/ServiceCategories";
import { useToast } from "@/hooks/use-toast";

const Index = ({ currentLanguage, onLanguageChange, onLocationChange }: {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
  onLocationChange: () => void;
}) => {
  const { toast } = useToast();

  const handleSearch = (query: string) => {
    window.location.href = `/services?q=${encodeURIComponent(query)}`;
  };

  const handleCategoryClick = (category: string) => {
    window.location.href = `/services?category=${encodeURIComponent(category)}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section with Search */}
        <SearchHero 
          currentLanguage={currentLanguage}
          onSearch={handleSearch}
          onLocationClick={onLocationChange}
        />

        {/* Service Categories */}
        <ServiceCategories 
          currentLanguage={currentLanguage}
          onCategoryClick={handleCategoryClick}
        />

      </main>

      <Footer currentLanguage={currentLanguage} />
    </div>
  );
};

export default Index;
