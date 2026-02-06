// src/components/PreferenceModal/steps/OriginsPreferenceStep.tsx
import { useState } from "react";
import { Check, Search } from "lucide-react";
import { Nationality } from "@/components/ModalSteps/types";

interface OriginsPreferenceStepProps {
  selectedNationalityIds: string[];
  nationalities: Nationality[];
  onNationalitiesChange: (ids: string[]) => void;
}

export default function OriginsPreferenceStep({
  selectedNationalityIds,
  nationalities,
  onNationalitiesChange,
}: OriginsPreferenceStepProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const isAnySelected = selectedNationalityIds.length === 0;

  const filteredNationalities = nationalities.filter((nat) =>
    nat.nameFr.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleToggleNationality = (nationalityId: string) => {
    if (selectedNationalityIds.includes(nationalityId)) {
      onNationalitiesChange(
        selectedNationalityIds.filter((id) => id !== nationalityId),
      );
    } else {
      onNationalitiesChange([...selectedNationalityIds, nationalityId]);
    }
  };

  const handleSetAny = () => {
    onNationalitiesChange([]);
  };

  return (
    <>
      {/* Hero Image — exactement comme WorkStep & EducationStep */}
      <div className="relative h-85.75 w-full bg-linear-to-br from-secondary via-primary/50 to-accent overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full h-full max-w-md">
            <div className="text-8xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse">
              🌍
            </div>
          </div>
        </div>
      </div>

      {/* Form Content — suit directement en dessous, même padding que les autres */}
      <div className="px-8 pt-5.5 pb-10">
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-2">
          Origines recherchées
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {isAnySelected
            ? "Peu importe les origines"
            : `${selectedNationalityIds.length} nationalité(s) sélectionnée(s)`}
        </p>

        {/* Option "Peu importe" */}
        <div
          className={`flex items-center justify-between px-6 py-3.25-[50px] rounded-full cursor-pointer transition-all duration-200 border-2 mb-6 ${
            isAnySelected
              ? "bg-primary/10 border-primary"
              : "bg-gray-50 border-transparent hover:bg-gray-100"
          }`}
          onClick={handleSetAny}
        >
          <span className="text-lg font-medium text-gray-800">Peu importe</span>
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              isAnySelected ? "border-primary bg-primary" : "border-gray-400"
            }`}
          >
            {isAnySelected && (
              <div className="w-2.5 h-2.5 bg-white rounded-full" />
            )}
          </div>
        </div>

        {!isAnySelected && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  Ou choisir spécifiquement
                </span>
              </div>
            </div>

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
                const isSelected = selectedNationalityIds.includes(
                  nationality.id,
                );

                return (
                  <div
                    key={nationality.id}
                    onClick={() => handleToggleNationality(nationality.id)}
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
          </>
        )}

        {/* Espace en bas pour que le dernier champ ne colle pas le bas de l'écran */}
        <div className="h-24" />
      </div>
    </>
  );
}
