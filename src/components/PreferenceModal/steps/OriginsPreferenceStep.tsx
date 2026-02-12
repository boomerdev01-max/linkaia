// src/components/PreferenceModal/steps/OriginsPreferenceStep.tsx - CORRIGÉ
import { useState } from "react";
import { Check, Search } from "lucide-react";
import { Nationality } from "../types";

interface OriginsPreferenceStepProps {
  selectedNationalityCodes: string[]; // ✅ FIXÉ : utilise codes ISO
  nationalities: Nationality[];
  onNationalityCodesChange: (codes: string[]) => void;
}

export default function OriginsPreferenceStep({
  selectedNationalityCodes,
  nationalities,
  onNationalityCodesChange,
}: OriginsPreferenceStepProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredNationalities = nationalities.filter((nat) =>
    nat.nameFr.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleToggleNationality = (countryCode: string) => {
    if (selectedNationalityCodes.includes(countryCode)) {
      onNationalityCodesChange(
        selectedNationalityCodes.filter((code) => code !== countryCode),
      );
    } else {
      onNationalityCodesChange([...selectedNationalityCodes, countryCode]);
    }
  };

  return (
    <>
      {/* Hero Image */}
      <div className="relative h-85.75 w-full bg-linear-to-br from-secondary via-primary/50 to-accent overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full h-full max-w-md">
            <div className="text-8xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse">
              🌍
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-8 pt-5.5 pb-10">
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-2">
          Origines recherchées
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {selectedNationalityCodes.length === 0
            ? "Aucune origine sélectionnée"
            : `${selectedNationalityCodes.length} origine(s) sélectionnée(s)`}
        </p>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une nationalité..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:border-primary focus:outline-none"
          />
        </div>

        {/* Nationalities Grid */}
        <div className="grid grid-cols-2 gap-3">
          {filteredNationalities.map((nationality) => {
            const isSelected = selectedNationalityCodes.includes(
              nationality.code, // ✅ Utilise le code ISO
            );

            return (
              <div
                key={nationality.code}
                onClick={() => handleToggleNationality(nationality.code)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${
                  isSelected
                    ? "bg-primary/10 border-primary"
                    : "bg-gray-50 border-transparent hover:bg-gray-100"
                }`}
              >
                <span className="text-2xl">{nationality.flag}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {nationality.nameFr}
                  </p>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-primary shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Espace en bas */}
        <div className="h-24" />
      </div>
    </>
  );
}
