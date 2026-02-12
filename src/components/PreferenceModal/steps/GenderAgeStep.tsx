// src/components/PreferenceModal/steps/GenderAgeStep.tsx - MULTI-CHOIX
import { Check } from "lucide-react";
import { GENDER_OPTIONS } from "../types";

interface GenderAgeStepProps {
  selectedGenderCodes: string[];
  ageMin: number;
  ageMax: number;
  onGenderCodesChange: (codes: string[]) => void;
  onAgeMinChange: (value: number) => void;
  onAgeMaxChange: (value: number) => void;
}

export default function GenderAgeStep({
  selectedGenderCodes,
  ageMin,
  ageMax,
  onGenderCodesChange,
  onAgeMinChange,
  onAgeMaxChange,
}: GenderAgeStepProps) {
  const handleToggleGender = (code: string) => {
    if (selectedGenderCodes.includes(code)) {
      onGenderCodesChange(selectedGenderCodes.filter((c) => c !== code));
    } else {
      onGenderCodesChange([...selectedGenderCodes, code]);
    }
  };

  return (
    <>
      {/* Hero Image */}
      <div className="relative h-85.75 w-full bg-linear-to-br from-primary via-secondary/50 to-accent/60 overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full h-full max-w-md">
            <div className="text-8xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse">
              💑
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-8 pt-5.5 pb-10">
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-2">
          Genre recherché
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {selectedGenderCodes.length === 0
            ? "Aucun genre sélectionné"
            : `${selectedGenderCodes.length} genre(s) sélectionné(s)`}
        </p>

        {/* Gender Options - Multi-select */}
        <div className="space-y-3 mb-8">
          {GENDER_OPTIONS.map((option) => {
            const isSelected = selectedGenderCodes.includes(option.code);

            return (
              <div
                key={option.code}
                onClick={() => handleToggleGender(option.code)}
                className={`flex items-center justify-between px-6 py-4 rounded-2xl cursor-pointer transition-all duration-200 border-2 ${
                  isSelected
                    ? "bg-primary/10 border-primary"
                    : "bg-gray-50 border-transparent hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{option.emoji}</span>
                  <span className="text-lg font-medium text-gray-800">
                    {option.label}
                  </span>
                </div>
                {isSelected && <Check className="w-6 h-6 text-primary" />}
              </div>
            );
          })}
        </div>

        {/* Séparateur */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Tranche d'âge</span>
          </div>
        </div>

        {/* Age Range */}
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-2">
          Âge recherché
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          De {ageMin} à {ageMax} ans
        </p>

        <div className="space-y-4">
          {/* Age Min */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Âge minimum
              </span>
              <span className="text-lg font-semibold text-primary">
                {ageMin} ans
              </span>
            </div>
            <input
              type="range"
              min="18"
              max="100"
              value={ageMin}
              onChange={(e) => onAgeMinChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${
                  ((ageMin - 18) / 82) * 100
                }%, #E5E7EB ${((ageMin - 18) / 82) * 100}%, #E5E7EB 100%)`,
              }}
            />
          </div>

          {/* Age Max */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Âge maximum
              </span>
              <span className="text-lg font-semibold text-primary">
                {ageMax} ans
              </span>
            </div>
            <input
              type="range"
              min="18"
              max="100"
              value={ageMax}
              onChange={(e) => onAgeMaxChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${
                  ((ageMax - 18) / 82) * 100
                }%, #E5E7EB ${((ageMax - 18) / 82) * 100}%, #E5E7EB 100%)`,
              }}
            />
          </div>
        </div>

        {/* Bottom Spacing */}
        <div className="h-24" />
      </div>

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          border: 2px solid white;
          transition: all 0.1s ease;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          background: #2563eb;
        }

        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          border: 2px solid white;
          transition: all 0.1s ease;
        }

        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.1);
          background: #2563eb;
        }
      `}</style>
    </>
  );
}
