// src/components/PreferenceModal/steps/RelationshipOrientationPreferenceStep.tsx
import {
  RELATIONSHIP_STATUS_OPTIONS,
  SEXUAL_ORIENTATION_OPTIONS,
} from "../types";

interface RelationshipOrientationPreferenceStepProps {
  relationshipStatusPreference: string;
  sexualOrientationPreference: string;
  onRelationshipChange: (value: string) => void;
  onOrientationChange: (value: string) => void;
}

export default function RelationshipOrientationPreferenceStep({
  relationshipStatusPreference,
  sexualOrientationPreference,
  onRelationshipChange,
  onOrientationChange,
}: RelationshipOrientationPreferenceStepProps) {
  return (
    <>
      {/* Hero Image — exactement comme WorkStep & EducationStep */}
      <div className="relative h-85.75 w-full bg-linear-to-br from-secondary via-accent/60 to-primary overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full h-full max-w-md">
            <div className="text-8xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse">
              ❤️
            </div>
          </div>
        </div>
      </div>

      {/* Form Content — suit directement en dessous, même padding que les autres */}
      <div className="px-8 pt-5.5 pb-10">
        <div className="space-y-8">
          {/* Statut relationnel */}
          <div>
            <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-6">
              Statut relationnel recherché
            </h2>
            <div className="space-y-3">
              {RELATIONSHIP_STATUS_OPTIONS.map((option) => (
                <div
                  key={option.id}
                  className={`flex items-center justify-between px-6 py-3.25 h-12.5 rounded-full cursor-pointer transition-all duration-200 border-2 ${
                    relationshipStatusPreference === option.id
                      ? "bg-primary/10 border-primary"
                      : "bg-gray-50 border-transparent hover:bg-gray-100"
                  }`}
                  onClick={() => onRelationshipChange(option.id)}
                >
                  <span className="text-lg font-medium text-gray-800">
                    {option.label}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      relationshipStatusPreference === option.id
                        ? "border-primary bg-primary"
                        : "border-gray-400"
                    }`}
                  >
                    {relationshipStatusPreference === option.id && (
                      <div className="w-2.5 h-2.5 bg-white rounded-full" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Orientation sexuelle */}
          <div>
            <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-6">
              Orientation sexuelle recherchée
            </h2>
            <div className="space-y-3">
              {SEXUAL_ORIENTATION_OPTIONS.map((option) => (
                <div
                  key={option.id}
                  className={`flex items-center justify-between px-6 py-3.25 h-12.5 rounded-full cursor-pointer transition-all duration-200 border-2 ${
                    sexualOrientationPreference === option.id
                      ? "bg-primary/10 border-primary"
                      : "bg-gray-50 border-transparent hover:bg-gray-100"
                  }`}
                  onClick={() => onOrientationChange(option.id)}
                >
                  <span className="text-lg font-medium text-gray-800">
                    {option.label}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      sexualOrientationPreference === option.id
                        ? "border-primary bg-primary"
                        : "border-gray-400"
                    }`}
                  >
                    {sexualOrientationPreference === option.id && (
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
