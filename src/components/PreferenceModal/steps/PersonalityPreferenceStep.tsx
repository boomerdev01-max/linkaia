// ============================================
// src/components/PreferenceModal/steps/PersonalityPreferenceStep.tsx
// ============================================
import { Check } from "lucide-react";
import { PersonalityType } from "../types";

interface PersonalityPreferenceStepProps {
  selectedPersonalityTypeIds: string[];
  personalityTypes: PersonalityType[];
  onPersonalityTypeIdsChange: (ids: string[]) => void;
}

export default function PersonalityPreferenceStep({
  selectedPersonalityTypeIds,
  personalityTypes,
  onPersonalityTypeIdsChange,
}: PersonalityPreferenceStepProps) {
  const handleToggleType = (typeId: string) => {
    if (selectedPersonalityTypeIds.includes(typeId)) {
      onPersonalityTypeIdsChange(
        selectedPersonalityTypeIds.filter((id) => id !== typeId),
      );
    } else {
      onPersonalityTypeIdsChange([...selectedPersonalityTypeIds, typeId]);
    }
  };

  return (
    <>
      <div className="relative h-85.75 w-full bg-linear-to-br from-secondary via-primary/50 to-accent overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="text-8xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse">
            🎭
          </div>
        </div>
      </div>

      <div className="px-8 pt-5.5 pb-10">
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-2">
          Type de personnalité recherché
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {selectedPersonalityTypeIds.length === 0
            ? "Aucun type sélectionné"
            : `${selectedPersonalityTypeIds.length} type(s) sélectionné(s)`}
        </p>

        <div className="space-y-3">
          {personalityTypes.map((type) => {
            const isSelected = selectedPersonalityTypeIds.includes(type.id);

            return (
              <div
                key={type.id}
                onClick={() => handleToggleType(type.id)}
                className={`flex items-center justify-between px-6 py-4 rounded-2xl cursor-pointer transition-all border-2 ${
                  isSelected
                    ? "bg-primary/10 border-primary"
                    : "bg-gray-50 border-transparent hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{type.emoji}</span>
                  <span className="text-lg font-medium text-gray-800">
                    {type.label}
                  </span>
                </div>
                {isSelected && <Check className="w-6 h-6 text-primary" />}
              </div>
            );
          })}
        </div>

        <div className="h-24" />
      </div>
    </>
  );
}
