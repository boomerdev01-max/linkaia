// src/components/PreferenceModal/steps/HabitsPreferenceStep.tsx
import { SMOKER_OPTIONS, ALCOHOL_OPTIONS } from "../types";

interface HabitsPreferenceStepProps {
  smokerPreference: string;
  alcoholPreference: string;
  onSmokerChange: (value: string) => void;
  onAlcoholChange: (value: string) => void;
}

export default function HabitsPreferenceStep({
  smokerPreference,
  alcoholPreference,
  onSmokerChange,
  onAlcoholChange,
}: HabitsPreferenceStepProps) {
  return (
    <>
      {/* Hero Image — exactement comme WorkStep & EducationStep */}
      <div className="relative h-85.75 w-full bg-linear-to-br from-primary via-accent/50 to-secondary overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full h-full max-w-md">
            <div className="text-7xl absolute top-1/3 left-1/3 animate-pulse">
              🚭
            </div>
            <div
              className="text-7xl absolute bottom-1/3 right-1/3 animate-bounce"
              style={{ animationDelay: "0.5s" }}
            >
              🍷
            </div>
          </div>
        </div>
      </div>

      {/* Form Content — suit directement en dessous, même padding que les autres */}
      <div className="px-8 pt-5.5 pb-10">
        <div className="space-y-8">
          {/* Fumeur */}
          <div>
            <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-6">
              Habitude tabagique recherchée
            </h2>
            <div className="space-y-3">
              {SMOKER_OPTIONS.map((option) => (
                <div
                  key={option.id}
                  className={`flex items-center justify-between px-6 py-3.25 h-12.5 rounded-full cursor-pointer transition-all duration-200 border-2 ${
                    smokerPreference === option.id
                      ? "bg-primary/10 border-primary"
                      : "bg-gray-50 border-transparent hover:bg-gray-100"
                  }`}
                  onClick={() => onSmokerChange(option.id)}
                >
                  <span className="text-lg font-medium text-gray-800">
                    {option.label}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      smokerPreference === option.id
                        ? "border-primary bg-primary"
                        : "border-gray-400"
                    }`}
                  >
                    {smokerPreference === option.id && (
                      <div className="w-2.5 h-2.5 bg-white rounded-full" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alcool */}
          <div>
            <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-6">
              Consommation d'alcool recherchée
            </h2>
            <div className="space-y-3">
              {ALCOHOL_OPTIONS.map((option) => (
                <div
                  key={option.id}
                  className={`flex items-center justify-between px-6 py-3.25 h-12.5 rounded-full cursor-pointer transition-all duration-200 border-2 ${
                    alcoholPreference === option.id
                      ? "bg-primary/10 border-primary"
                      : "bg-gray-50 border-transparent hover:bg-gray-100"
                  }`}
                  onClick={() => onAlcoholChange(option.id)}
                >
                  <span className="text-lg font-medium text-gray-800">
                    {option.label}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      alcoholPreference === option.id
                        ? "border-primary bg-primary"
                        : "border-gray-400"
                    }`}
                  >
                    {alcoholPreference === option.id && (
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
    </>
  );
}
