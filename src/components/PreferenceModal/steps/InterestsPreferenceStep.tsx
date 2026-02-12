// src/components/PreferenceModal/steps/InterestsPreferenceStep.tsx
import { Check } from "lucide-react";
import { InterestCategory } from "@/components/ModalSteps/types";
import { useState } from "react";

interface InterestsPreferenceStepProps {
  selectedInterestIds: string[];
  interestCategories: InterestCategory[];
  onInterestsChange: (ids: string[]) => void;
}

export default function InterestsPreferenceStep({
  selectedInterestIds,
  interestCategories,
  onInterestsChange,
}: InterestsPreferenceStepProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const MAX_INTERESTS = 10;

  // ✅ Renommé : "isPeuImporteActive" exprime clairement l'intention
  // true = aucun intérêt spécifique sélectionné = "Peu importe" est actif
  const isPeuImporteActive = selectedInterestIds.length === 0;

  const filteredCategories = interestCategories
    .map((category) => ({
      ...category,
      interests: category.interests.filter((interest) =>
        interest.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    }))
    .filter((category) => category.interests.length > 0);

  const handleToggleInterest = (interestId: string) => {
    if (selectedInterestIds.includes(interestId)) {
      onInterestsChange(selectedInterestIds.filter((id) => id !== interestId));
    } else if (selectedInterestIds.length < MAX_INTERESTS) {
      onInterestsChange([...selectedInterestIds, interestId]);
    }
  };

  const handleSetAny = () => {
    onInterestsChange([]);
  };

  return (
    <>
      {/* Hero Image */}
      <div className="relative h-85.75 w-full bg-linear-to-br from-accent via-primary/50 to-secondary overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full h-full max-w-md">
            <div className="text-7xl absolute top-1/4 left-1/4 animate-bounce">
              🎨
            </div>
            <div
              className="text-7xl absolute bottom-1/3 right-1/4 animate-pulse"
              style={{ animationDelay: "0.3s" }}
            >
              🎵
            </div>
            <div
              className="text-6xl absolute top-1/2 right-1/3 animate-bounce"
              style={{ animationDelay: "0.6s" }}
            >
              ⚽
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-8 pt-5.5 pb-10">
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-2">
          Centres d'intérêt recherchés
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {isPeuImporteActive
            ? "Peu importe les centres d'intérêt"
            : `${selectedInterestIds.length}/${MAX_INTERESTS} sélectionnés`}
        </p>

        {/* Option "Peu importe" */}
        <div
          className={`flex items-center justify-between px-6 py-3.25 h-12.5 rounded-full cursor-pointer transition-all duration-200 border-2 mb-6 ${
            isPeuImporteActive
              ? "bg-primary/10 border-primary"
              : "bg-gray-50 border-transparent hover:bg-gray-100"
          }`}
          onClick={handleSetAny}
        >
          <span className="text-lg font-medium text-gray-800">Peu importe</span>
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              isPeuImporteActive
                ? "border-primary bg-primary"
                : "border-gray-400"
            }`}
          >
            {isPeuImporteActive && (
              <div className="w-2.5 h-2.5 bg-white rounded-full" />
            )}
          </div>
        </div>

        {/* Séparateur */}
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
        <input
          type="text"
          placeholder="Rechercher un centre d'intérêt..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 rounded-full border border-gray-300 focus:border-primary focus:outline-none mb-6"
        />

        {/* ✅ Feedback si les catégories ne sont pas encore chargées */}
        {interestCategories.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">
            Chargement des centres d'intérêt...
          </p>
        )}

        {/* Interest Categories — toujours rendues, indépendamment de isPeuImporteActive */}
        {filteredCategories.map((category) => (
          <div key={category.id} className="mb-6">
            <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>{category.emoji}</span>
              <span>{category.name}</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {category.interests.map((interest) => {
                const isSelected = selectedInterestIds.includes(interest.id);
                const canSelect =
                  isSelected || selectedInterestIds.length < MAX_INTERESTS;

                return (
                  <button
                    key={interest.id}
                    onClick={() =>
                      canSelect && handleToggleInterest(interest.id)
                    }
                    disabled={!canSelect}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-primary text-white"
                        : canSelect
                          ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          : "bg-gray-50 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <span className="mr-1">{interest.emoji}</span>
                    {interest.name}
                    {isSelected && (
                      <Check className="inline-block w-4 h-4 ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="h-24" />
      </div>
    </>
  );
}
