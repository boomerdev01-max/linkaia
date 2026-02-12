// src/components/profile/steps/OriginsStep.tsx
// ✨ OPTIMISÉ avec country-state-city

import { Label } from "@/components/ui/label";
import { Nationality } from "@/components/ModalSteps/types";
import { Check } from "lucide-react";

interface OriginsStepProps {
  countryOriginCode: string | null;
  selectedNationalityCodes: string[];
  nationalities: Nationality[];
  onCountryOriginChange: (code: string | null) => void;
  onNationalitiesChange: (codes: string[]) => void;
}

export default function OriginsStep({
  countryOriginCode,
  selectedNationalityCodes,
  nationalities,
  onCountryOriginChange,
  onNationalitiesChange,
}: OriginsStepProps) {
  const MAX_NATIONALITIES = 2;

  const toggleNationality = (natCode: string) => {
    if (selectedNationalityCodes.includes(natCode)) {
      onNationalitiesChange(
        selectedNationalityCodes.filter((code) => code !== natCode),
      );
    } else if (selectedNationalityCodes.length < MAX_NATIONALITIES) {
      onNationalitiesChange([...selectedNationalityCodes, natCode]);
    }
  };

  return (
    <>
      {/* Hero Image */}
      <div className="relative h-85.75 w-full bg-linear-to-br from-accent via-primary/50 to-secondary overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full h-full max-w-md">
            <div className="text-8xl absolute top-1/4 left-1/2 transform -translate-x-1/2 animate-bounce">
              🌍
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-8 pt-5.5 pb-10">
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-6">
          Vos origines
        </h2>

        {/* Pays d'origine */}
        <div className="mb-8">
          <Label className="block text-base font-semibold text-gray-800 mb-3">
            Pays d'origine
          </Label>
          <select
            value={countryOriginCode || ""}
            onChange={(e) => onCountryOriginChange(e.target.value || null)}
            className="w-full h-12 px-6 text-base border-2 border-gray-200 rounded-full focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white appearance-none"
          >
            <option value="">Sélectionnez votre pays d'origine</option>
            {nationalities.map((nat) => (
              <option key={nat.code} value={nat.code}>
                {nat.flag} {nat.nameFr}
              </option>
            ))}
            <option value="PREFER_NOT_TO_SAY">Je préfère ne pas le dire</option>
          </select>
        </div>

        {/* Nationalités (max 2) */}
        <div className="mb-6">
          <Label className="block text-base font-semibold text-gray-800 mb-3">
            Nationalité(s) (maximum {MAX_NATIONALITIES})
          </Label>
          <div className="flex flex-wrap gap-2">
            {nationalities.map((nat) => {
              const isSelected = selectedNationalityCodes.includes(nat.code);
              const isDisabled =
                !isSelected &&
                selectedNationalityCodes.length >= MAX_NATIONALITIES;

              return (
                <button
                  key={nat.code}
                  onClick={() => !isDisabled && toggleNationality(nat.code)}
                  disabled={isDisabled}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border-2
                    ${
                      isSelected
                        ? "bg-primary text-white border-primary"
                        : isDisabled
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-700 border-gray-200 hover:border-primary hover:bg-gray-50"
                    }
                  `}
                >
                  <span className="text-lg">{nat.flag}</span>
                  <span>{nat.nameFr}</span>
                  {isSelected && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Espace en bas */}
        <div className="h-24" />
      </div>
    </>
  );
}
