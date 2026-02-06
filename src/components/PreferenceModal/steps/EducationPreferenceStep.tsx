// src/components/PreferenceModal/steps/EducationPreferenceStep.tsx
import { EDUCATION_LEVEL_OPTIONS } from "../types";

interface EducationPreferenceStepProps {
  educationLevelPreference: string;
  onEducationLevelChange: (value: string) => void;
}

export default function EducationPreferenceStep({
  educationLevelPreference,
  onEducationLevelChange,
}: EducationPreferenceStepProps) {
  return (
    <>
      {/* Hero Image */}
      <div className="relative h-85.75 w-full bg-linear-to-br from-primary via-accent/50 to-secondary overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full h-full max-w-md">
            <div className="text-8xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-bounce">
              🎓
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-8 pt-5.5 pb-10">
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-6">
          Niveau d'éducation recherché
        </h2>

        <div className="space-y-3">
          {EDUCATION_LEVEL_OPTIONS.map((option) => (
            <div
              key={option.id}
              className={`flex items-center justify-between px-6 py-3.25 h-12.5 rounded-full cursor-pointer transition-all duration-200 border-2 ${
                educationLevelPreference === option.id
                  ? "bg-primary/10 border-primary"
                  : "bg-gray-50 border-transparent hover:bg-gray-100"
              }`}
              onClick={() => onEducationLevelChange(option.id)}
            >
              <span className="text-lg font-medium text-gray-800">
                {option.label}
              </span>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  educationLevelPreference === option.id
                    ? "border-primary bg-primary"
                    : "border-gray-400"
                }`}
              >
                {educationLevelPreference === option.id && (
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="h-24" />
      </div>
    </>
  );
}
