import { Button } from "@/components/ui/button";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { supportedLanguages } from "@/lib/i18n";

interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
}

export const LanguageSelector = ({
  currentLanguage,
  onLanguageChange
}: LanguageSelectorProps) => {
  const [open, setOpen] = React.useState(false);
  const languages = supportedLanguages;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center space-x-2">
          <Globe className="h-4 w-4" />
          <span className="hidden md:inline">
            {languages.find(l => l.code === currentLanguage)?.flag}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        // Portal to body so it isn't clipped by parent containers on mobile
        portalled
        align="end"
        side="bottom"
        sideOffset={8}
        // Wider like web, with max height and scroll for long language lists
        className="z-[60] w-64 max-h-[70vh] overflow-y-auto overscroll-contain rounded-xl"
        // Ensure smooth vertical scroll on Android WebView / iOS
        style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" as any }}
      >
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => {
              setOpen(false);
              if (language.code !== currentLanguage) {
                setTimeout(() => onLanguageChange(language.code), 0);
              }
            }}
            className={`flex items-center space-x-3 ${currentLanguage === language.code ? 'bg-accent' : ''}`}
          >
            <span className="text-lg">{language.flag}</span>
            <span>{language.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};