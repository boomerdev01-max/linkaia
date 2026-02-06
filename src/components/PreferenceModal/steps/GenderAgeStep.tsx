// src/components/PreferenceModal/steps/GenderAgeStep.tsx
import { GENDER_OPTIONS } from "../types";

interface GenderAgeStepProps {
  genderPreference: string;
  ageMin: number;
  ageMax: number;
  onGenderChange: (value: string) => void;
  onAgeMinChange: (value: number) => void;
  onAgeMaxChange: (value: number) => void;
}

export default function GenderAgeStep({
  genderPreference,
  ageMin,
  ageMax,
  onGenderChange,
  onAgeMinChange,
  onAgeMaxChange,
}: GenderAgeStepProps) {
  return (
    <>
      {/* Hero Image */}
      <div className="relative h-85.75 w-full bg-linear-to-br from-primary via-secondary/50 to-accent/60 overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full h-full max-w-md">
            <div className="text-8xl absolute top-1/4 left-1/4 animate-bounce">
              👤
            </div>
            <div
              className="text-8xl absolute bottom-1/4 right-1/4 animate-pulse"
              style={{ animationDelay: "0.5s" }}
            >
              💫
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-8 pt-5.5 pb-10">
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-6">
          Qui souhaitez-vous rencontrer ?
        </h2>

        {/* Genre */}
        <div className="mb-8">
          <label className="block text-base font-semibold text-gray-800 mb-3">
            Genre recherché
          </label>
          <div className="space-y-3">
            {GENDER_OPTIONS.map((option) => (
              <div
                key={option.id}
                className={`flex items-center justify-between px-6 py-3.25 h-12.5 rounded-full cursor-pointer transition-all duration-200 border-2 ${
                  genderPreference === option.id
                    ? "bg-primary/10 border-primary"
                    : "bg-gray-50 border-transparent hover:bg-gray-100"
                }`}
                onClick={() => onGenderChange(option.id)}
              >
                <span className="text-lg font-medium text-gray-800">
                  {option.label}
                </span>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    genderPreference === option.id
                      ? "border-primary bg-primary"
                      : "border-gray-400"
                  }`}
                >
                  {genderPreference === option.id && (
                    <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tranche d'âge */}
        <div>
          <label className="block text-base font-semibold text-gray-800 mb-4">
            Tranche d'âge souhaitée
          </label>

          {/* Age Min */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Âge minimum</span>
              <span className="text-xl font-bold text-primary">
                {ageMin} ans
              </span>
            </div>
            <input
              type="range"
              min="18"
              max="100"
              value={ageMin}
              onChange={(e) => onAgeMinChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
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
              <span className="text-sm text-gray-600">Âge maximum</span>
              <span className="text-xl font-bold text-primary">
                {ageMax} ans
              </span>
            </div>
            <input
              type="range"
              min="18"
              max="100"
              value={ageMax}
              onChange={(e) => onAgeMaxChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${
                  ((ageMax - 18) / 82) * 100
                }%, #E5E7EB ${((ageMax - 18) / 82) * 100}%, #E5E7EB 100%)`,
              }}
            />
          </div>
        </div>

        <div className="h-24" />
      </div>

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          border: 2px solid white;
        }
      `}</style>
    </>
  );
}
