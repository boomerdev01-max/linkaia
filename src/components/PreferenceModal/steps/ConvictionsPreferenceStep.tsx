// ============================================
// src/components/PreferenceModal/steps/ConvictionsPreferenceStep.tsx
// ============================================
import { Check } from "lucide-react";
import { ZodiacSign, Religion } from "../types";

interface ConvictionsPreferenceStepProps {
  selectedZodiacSignIds: string[];
  selectedReligionIds: string[];
  loveAnimalsPreference: string;
  zodiacSigns: ZodiacSign[];
  religions: Religion[];
  onZodiacSignIdsChange: (ids: string[]) => void;
  onReligionIdsChange: (ids: string[]) => void;
  onLoveAnimalsChange: (value: string) => void;
}

export default function ConvictionsPreferenceStep({
  selectedZodiacSignIds,
  selectedReligionIds,
  loveAnimalsPreference,
  zodiacSigns,
  religions,
  onZodiacSignIdsChange,
  onReligionIdsChange,
  onLoveAnimalsChange,
}: ConvictionsPreferenceStepProps) {
  const handleToggleZodiac = (signId: string) => {
    if (selectedZodiacSignIds.includes(signId)) {
      onZodiacSignIdsChange(
        selectedZodiacSignIds.filter((id) => id !== signId),
      );
    } else {
      onZodiacSignIdsChange([...selectedZodiacSignIds, signId]);
    }
  };

  const handleToggleReligion = (religionId: string) => {
    if (selectedReligionIds.includes(religionId)) {
      onReligionIdsChange(
        selectedReligionIds.filter((id) => id !== religionId),
      );
    } else {
      onReligionIdsChange([...selectedReligionIds, religionId]);
    }
  };

  const loveAnimalsOptions = [
    { value: "yes", label: "Oui", emoji: "❤️" },
    { value: "no", label: "Non", emoji: "🚫" },
    { value: "neutral", label: "Neutre", emoji: "😐" },
    { value: "any", label: "Peu importe", emoji: "🤷" },
  ];

  return (
    <>
      <div className="relative h-85.75 w-full bg-linear-to-br from-accent via-secondary/50 to-primary overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="text-8xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse">
            ✨
          </div>
        </div>
      </div>

      <div className="px-8 pt-5.5 pb-10">
        {/* Signes astrologiques */}
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-2">
          Signes astrologiques recherchés
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {selectedZodiacSignIds.length === 0
            ? "Aucun signe sélectionné"
            : `${selectedZodiacSignIds.length} signe(s) sélectionné(s)`}
        </p>

        <div className="grid grid-cols-3 gap-2 mb-8">
          {zodiacSigns.map((sign) => {
            const isSelected = selectedZodiacSignIds.includes(sign.id);

            return (
              <div
                key={sign.id}
                onClick={() => handleToggleZodiac(sign.id)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl cursor-pointer transition-all border-2 ${
                  isSelected
                    ? "bg-primary/10 border-primary"
                    : "bg-gray-50 border-transparent hover:bg-gray-100"
                }`}
              >
                <span className="text-2xl">{sign.emoji}</span>
                <span className="text-xs font-medium text-gray-800 text-center">
                  {sign.label}
                </span>
                {isSelected && <Check className="w-4 h-4 text-primary mt-1" />}
              </div>
            );
          })}
        </div>

        {/* Religions */}
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-2">
          Religions recherchées
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {selectedReligionIds.length === 0
            ? "Aucune religion sélectionnée"
            : `${selectedReligionIds.length} religion(s) sélectionnée(s)`}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {religions.map((religion) => {
            const isSelected = selectedReligionIds.includes(religion.id);

            return (
              <div
                key={religion.id}
                onClick={() => handleToggleReligion(religion.id)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${
                  isSelected
                    ? "bg-primary/10 border-primary"
                    : "bg-gray-50 border-transparent hover:bg-gray-100"
                }`}
              >
                <span className="text-2xl">{religion.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {religion.label}
                  </p>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-primary shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Amour des animaux */}
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-2">
          Aime les animaux ?
        </h2>
        <p className="text-sm text-gray-600 mb-6">Sélectionne une préférence</p>

        <div className="grid grid-cols-2 gap-3">
          {loveAnimalsOptions.map((option) => {
            const isSelected = loveAnimalsPreference === option.value;

            return (
              <div
                key={option.value}
                onClick={() => onLoveAnimalsChange(option.value)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${
                  isSelected
                    ? "bg-primary/10 border-primary"
                    : "bg-gray-50 border-transparent hover:bg-gray-100"
                }`}
              >
                <span className="text-2xl">{option.emoji}</span>
                <span className="text-sm font-medium text-gray-800">
                  {option.label}
                </span>
                {isSelected && (
                  <Check className="w-5 h-5 text-primary ml-auto" />
                )}
              </div>
            );
          })}
        </div>

        <div className="h-24" />
      </div>
    </>
  );
}
