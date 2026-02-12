// ============================================
// src/components/PreferenceModal/steps/EducationPreferenceStep.tsx
// ============================================
import { Check } from "lucide-react";
import { EducationLevel } from "../types";

interface EducationPreferenceStepProps {
  selectedEducationLevelIds: string[];
  educationLevels: EducationLevel[];
  onEducationLevelIdsChange: (ids: string[]) => void;
}

export default function EducationPreferenceStep({
  selectedEducationLevelIds,
  educationLevels,
  onEducationLevelIdsChange,
}: EducationPreferenceStepProps) {
  const handleToggleLevel = (levelId: string) => {
    if (selectedEducationLevelIds.includes(levelId)) {
      onEducationLevelIdsChange(
        selectedEducationLevelIds.filter((id) => id !== levelId),
      );
    } else {
      onEducationLevelIdsChange([...selectedEducationLevelIds, levelId]);
    }
  };

  return (
    <>
      <div className="relative h-85.75 w-full bg-linear-to-br from-primary via-accent/50 to-secondary overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="text-8xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse">
            🎓
          </div>
        </div>
      </div>

      <div className="px-8 pt-5.5 pb-10">
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-2">
          Niveau d'éducation recherché
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {selectedEducationLevelIds.length === 0
            ? "Aucun niveau sélectionné"
            : `${selectedEducationLevelIds.length} niveau(x) sélectionné(s)`}
        </p>

        <div className="space-y-3">
          {educationLevels.map((level) => {
            const isSelected = selectedEducationLevelIds.includes(level.id);

            return (
              <div
                key={level.id}
                onClick={() => handleToggleLevel(level.id)}
                className={`flex items-center justify-between px-6 py-4 rounded-2xl cursor-pointer transition-all border-2 ${
                  isSelected
                    ? "bg-primary/10 border-primary"
                    : "bg-gray-50 border-transparent hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{level.emoji}</span>
                  <span className="text-lg font-medium text-gray-800">
                    {level.label}
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
