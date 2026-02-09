// src/components/PreferenceModal/steps/ConvictionsPreferenceStep.tsx
import {
  ZODIAC_OPTIONS,
  RELIGION_OPTIONS,
  LOVE_ANIMALS_OPTIONS,
} from "../types";

interface ConvictionsPreferenceStepProps {
  zodiacSignPreference: string;
  religionPreference: string;
  loveAnimalsPreference: string;
  onZodiacChange: (value: string) => void;
  onReligionChange: (value: string) => void;
  onLoveAnimalsChange: (value: string) => void;
}

export default function ConvictionsPreferenceStep({
  zodiacSignPreference,
  religionPreference,
  loveAnimalsPreference,
  onZodiacChange,
  onReligionChange,
  onLoveAnimalsChange,
}: ConvictionsPreferenceStepProps) {
  return (
    <>
      {/* Hero Image — exactement comme WorkStep & EducationStep */}
      <div className="relative h-85.75 w-full bg-linear-to-br from-primary via-secondary/50 to-accent overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full h-full max-w-md">
            <div className="text-6xl absolute top-1/4 left-1/4 animate-spin-slow">
              ✨
            </div>
            <div className="text-7xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse">
              🙏
            </div>
            <div className="text-6xl absolute bottom-1/4 right-1/4 animate-bounce">
              🐾
            </div>
          </div>
        </div>
      </div>

      {/* Form Content — suit directement en dessous, même padding que les autres */}
      <div className="px-8 pt-5.5 pb-10">
        <div className="space-y-8">
          {/* Signe astrologique */}
          <div>
            <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-6">
              Signe astrologique recherché
            </h2>
            <div className="space-y-3">
              {ZODIAC_OPTIONS.map((option) => (
                <div
                  key={option.id}
                  className={`flex items-center justify-between px-6 py-3.25 h-12.5 rounded-full cursor-pointer transition-all duration-200 border-2 ${
                    zodiacSignPreference === option.id
                      ? "bg-primary/10 border-primary"
                      : "bg-gray-50 border-transparent hover:bg-gray-100"
                  }`}
                  onClick={() => onZodiacChange(option.id)}
                >
                  <span className="text-lg font-medium text-gray-800">
                    {option.label}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      zodiacSignPreference === option.id
                        ? "border-primary bg-primary"
                        : "border-gray-400"
                    }`}
                  >
                    {zodiacSignPreference === option.id && (
                      <div className="w-2.5 h-2.5 bg-white rounded-full" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Religion */}
          <div>
            <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-6">
              Religion recherchée
            </h2>
            <div className="space-y-3">
              {RELIGION_OPTIONS.map((option) => (
                <div
                  key={option.id}
                  className={`flex items-center justify-between px-6 py-3.25 h-12.5 rounded-full cursor-pointer transition-all duration-200 border-2 ${
                    religionPreference === option.id
                      ? "bg-primary/10 border-primary"
                      : "bg-gray-50 border-transparent hover:bg-gray-100"
                  }`}
                  onClick={() => onReligionChange(option.id)}
                >
                  <span className="text-lg font-medium text-gray-800">
                    {option.label}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      religionPreference === option.id
                        ? "border-primary bg-primary"
                        : "border-gray-400"
                    }`}
                  >
                    {religionPreference === option.id && (
                      <div className="w-2.5 h-2.5 bg-white rounded-full" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Aime les animaux */}
          <div>
            <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-6">
              Personnes aimant les animaux
            </h2>
            <div className="space-y-3">
              {LOVE_ANIMALS_OPTIONS.map((option) => (
                <div
                  key={option.id}
                  className={`flex items-center justify-between px-6 py-3.25 h-12.5 rounded-full cursor-pointer transition-all duration-200 border-2 ${
                    loveAnimalsPreference === option.id
                      ? "bg-primary/10 border-primary"
                      : "bg-gray-50 border-transparent hover:bg-gray-100"
                  }`}
                  onClick={() => onLoveAnimalsChange(option.id)}
                >
                  <span className="text-lg font-medium text-gray-800">
                    {option.label}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      loveAnimalsPreference === option.id
                        ? "border-primary bg-primary"
                        : "border-gray-400"
                    }`}
                  >
                    {loveAnimalsPreference === option.id && (
                      <div className="w-2.5 h-2.5 bg-white rounded-full" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Espace en bas pour que le dernier champ ne colle pas le bas de l'écran */}
        <div className="h-24" />
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
      `}</style>
    </>
  );
}
