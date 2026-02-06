// src/components/PreferenceModal/steps/FamilyPreferenceStep.tsx
import { HAS_CHILDREN_OPTIONS, WANTS_CHILDREN_OPTIONS, HAS_PETS_OPTIONS } from "../types";

interface FamilyPreferenceStepProps {
  hasChildrenPreference: string;
  wantsChildrenPreference: string;
  hasPetsPreference: string;
  onHasChildrenChange: (value: string) => void;
  onWantsChildrenChange: (value: string) => void;
  onHasPetsChange: (value: string) => void;
}

export default function FamilyPreferenceStep({
  hasChildrenPreference,
  wantsChildrenPreference,
  hasPetsPreference,
  onHasChildrenChange,
  onWantsChildrenChange,
  onHasPetsChange,
}: FamilyPreferenceStepProps) {
  return (
    <>
      {/* Hero Image — exactement comme WorkStep & EducationStep */}
      <div className="relative h-85.75 w-full bg-linear-to-br from-secondary via-primary/50 to-accent overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full h-full max-w-md">
            <div className="text-7xl absolute top-1/4 left-1/4 animate-bounce">👨‍👩‍👧‍👦</div>
            <div className="text-6xl absolute bottom-1/3 right-1/4 animate-pulse" style={{ animationDelay: "0.4s" }}>🐕</div>
          </div>
        </div>
      </div>

      {/* Form Content — suit directement en dessous, même padding que les autres */}
      <div className="px-8 pt-5.5 pb-10">
        <div className="space-y-8">
          {/* A des enfants */}
          <div>
            <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-6">
              Enfants actuels recherchés
            </h2>
            <div className="space-y-3">
              {HAS_CHILDREN_OPTIONS.map((option) => (
                <div
                  key={option.id}
                  className={`flex items-center justify-between px-6 py-3.25 h-12.5 rounded-full cursor-pointer transition-all duration-200 border-2 ${
                    hasChildrenPreference === option.id
                      ? "bg-primary/10 border-primary"
                      : "bg-gray-50 border-transparent hover:bg-gray-100"
                  }`}
                  onClick={() => onHasChildrenChange(option.id)}
                >
                  <span className="text-lg font-medium text-gray-800">{option.label}</span>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      hasChildrenPreference === option.id
                        ? "border-primary bg-primary"
                        : "border-gray-400"
                    }`}
                  >
                    {hasChildrenPreference === option.id && (
                      <div className="w-2.5 h-2.5 bg-white rounded-full" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Veut des enfants */}
          <div>
            <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-6">
              Projet d'enfants recherché
            </h2>
            <div className="space-y-3">
              {WANTS_CHILDREN_OPTIONS.map((option) => (
                <div
                  key={option.id}
                  className={`flex items-center justify-between px-6 py-3.25 h-12.5 rounded-full cursor-pointer transition-all duration-200 border-2 ${
                    wantsChildrenPreference === option.id
                      ? "bg-primary/10 border-primary"
                      : "bg-gray-50 border-transparent hover:bg-gray-100"
                  }`}
                  onClick={() => onWantsChildrenChange(option.id)}
                >
                  <span className="text-lg font-medium text-gray-800">{option.label}</span>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      wantsChildrenPreference === option.id
                        ? "border-primary bg-primary"
                        : "border-gray-400"
                    }`}
                  >
                    {wantsChildrenPreference === option.id && (
                      <div className="w-2.5 h-2.5 bg-white rounded-full" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Animaux */}
          <div>
            <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-6">
              Possession d'animaux recherchée
            </h2>
            <div className="space-y-3">
              {HAS_PETS_OPTIONS.map((option) => (
                <div
                  key={option.id}
                  className={`flex items-center justify-between px-6 py-3.25 h-12.5 rounded-full cursor-pointer transition-all duration-200 border-2 ${
                    hasPetsPreference === option.id
                      ? "bg-primary/10 border-primary"
                      : "bg-gray-50 border-transparent hover:bg-gray-100"
                  }`}
                  onClick={() => onHasPetsChange(option.id)}
                >
                  <span className="text-lg font-medium text-gray-800">{option.label}</span>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      hasPetsPreference === option.id
                        ? "border-primary bg-primary"
                        : "border-gray-400"
                    }`}
                  >
                    {hasPetsPreference === option.id && (
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