// src/components/PreferenceModal/steps/AppearancePreferenceStep.tsx - MULTI-CHOIX TEINTS
import { Check } from "lucide-react";
import { SkinTone } from "../types";

interface AppearancePreferenceStepProps {
  heightMin: number;
  heightMax: number;
  weightMin: number;
  weightMax: number;
  selectedSkinToneIds: string[];
  skinTones: SkinTone[];
  onHeightMinChange: (value: number) => void;
  onHeightMaxChange: (value: number) => void;
  onWeightMinChange: (value: number) => void;
  onWeightMaxChange: (value: number) => void;
  onSkinToneIdsChange: (ids: string[]) => void;
}

export default function AppearancePreferenceStep({
  heightMin,
  heightMax,
  weightMin,
  weightMax,
  selectedSkinToneIds,
  skinTones,
  onHeightMinChange,
  onHeightMaxChange,
  onWeightMinChange,
  onWeightMaxChange,
  onSkinToneIdsChange,
}: AppearancePreferenceStepProps) {
  const handleToggleSkinTone = (skinToneId: string) => {
    if (selectedSkinToneIds.includes(skinToneId)) {
      onSkinToneIdsChange(
        selectedSkinToneIds.filter((id) => id !== skinToneId),
      );
    } else {
      onSkinToneIdsChange([...selectedSkinToneIds, skinToneId]);
    }
  };

  return (
    <>
      {/* Hero Image */}
      <div className="relative h-85.75 w-full bg-linear-to-br from-secondary via-accent/50 to-primary overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full h-full max-w-md">
            <div className="text-8xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse">
              👤
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-8 pt-5.5 pb-10">
        {/* Taille */}
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-2">
          Taille recherchée
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          De {heightMin} cm à {heightMax} cm
        </p>

        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taille minimum
            </label>
            <input
              type="range"
              min="140"
              max="220"
              value={heightMin}
              onChange={(e) => onHeightMinChange(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-lg font-semibold text-primary mt-2">
              {heightMin} cm
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taille maximum
            </label>
            <input
              type="range"
              min="140"
              max="220"
              value={heightMax}
              onChange={(e) => onHeightMaxChange(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-lg font-semibold text-primary mt-2">
              {heightMax} cm
            </div>
          </div>
        </div>

        {/* Poids */}
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-2">
          Poids recherché
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          De {weightMin} kg à {weightMax} kg
        </p>

        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poids minimum
            </label>
            <input
              type="range"
              min="40"
              max="150"
              value={weightMin}
              onChange={(e) => onWeightMinChange(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-lg font-semibold text-primary mt-2">
              {weightMin} kg
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poids maximum
            </label>
            <input
              type="range"
              min="40"
              max="150"
              value={weightMax}
              onChange={(e) => onWeightMaxChange(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-lg font-semibold text-primary mt-2">
              {weightMax} kg
            </div>
          </div>
        </div>

        {/* Teints de peau */}
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-2">
          Teints de peau recherchés
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {selectedSkinToneIds.length === 0
            ? "Aucun teint sélectionné"
            : `${selectedSkinToneIds.length} teint(s) sélectionné(s)`}
        </p>

        <div className="grid grid-cols-2 gap-3">
          {skinTones.map((tone) => {
            const isSelected = selectedSkinToneIds.includes(tone.id);

            return (
              <div
                key={tone.id}
                onClick={() => handleToggleSkinTone(tone.id)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${
                  isSelected
                    ? "bg-primary/10 border-primary"
                    : "bg-gray-50 border-transparent hover:bg-gray-100"
                }`}
              >
                <span className="text-2xl">{tone.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {tone.label}
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
