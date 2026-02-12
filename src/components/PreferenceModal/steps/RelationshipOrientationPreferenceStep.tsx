// src/components/PreferenceModal/steps/RelationshipOrientationPreferenceStep.tsx - MULTI-CHOIX
import { Check } from "lucide-react";
import { RelationshipStatus, SexualOrientation } from "../types";

interface RelationshipOrientationPreferenceStepProps {
  selectedRelationshipStatusIds: string[];
  selectedSexualOrientationIds: string[];
  relationshipStatuses: RelationshipStatus[];
  sexualOrientations: SexualOrientation[];
  onRelationshipStatusIdsChange: (ids: string[]) => void;
  onSexualOrientationIdsChange: (ids: string[]) => void;
}

export default function RelationshipOrientationPreferenceStep({
  selectedRelationshipStatusIds,
  selectedSexualOrientationIds,
  relationshipStatuses,
  sexualOrientations,
  onRelationshipStatusIdsChange,
  onSexualOrientationIdsChange,
}: RelationshipOrientationPreferenceStepProps) {
  const handleToggleRelationshipStatus = (statusId: string) => {
    if (selectedRelationshipStatusIds.includes(statusId)) {
      onRelationshipStatusIdsChange(
        selectedRelationshipStatusIds.filter((id) => id !== statusId),
      );
    } else {
      onRelationshipStatusIdsChange([
        ...selectedRelationshipStatusIds,
        statusId,
      ]);
    }
  };

  const handleToggleSexualOrientation = (orientationId: string) => {
    if (selectedSexualOrientationIds.includes(orientationId)) {
      onSexualOrientationIdsChange(
        selectedSexualOrientationIds.filter((id) => id !== orientationId),
      );
    } else {
      onSexualOrientationIdsChange([
        ...selectedSexualOrientationIds,
        orientationId,
      ]);
    }
  };

  return (
    <>
      {/* Hero Image */}
      <div className="relative h-85.75 w-full bg-linear-to-br from-accent via-primary/50 to-secondary overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full h-full max-w-md">
            <div className="text-8xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse">
              💕
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-8 pt-5.5 pb-10">
        {/* Statut relationnel */}
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-2">
          Statut relationnel recherché
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {selectedRelationshipStatusIds.length === 0
            ? "Aucun statut sélectionné"
            : `${selectedRelationshipStatusIds.length} statut(s) sélectionné(s)`}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {relationshipStatuses.map((status) => {
            const isSelected = selectedRelationshipStatusIds.includes(
              status.id,
            );

            return (
              <div
                key={status.id}
                onClick={() => handleToggleRelationshipStatus(status.id)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${
                  isSelected
                    ? "bg-primary/10 border-primary"
                    : "bg-gray-50 border-transparent hover:bg-gray-100"
                }`}
              >
                <span className="text-2xl">{status.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {status.label}
                  </p>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-primary shrink-0" />
                )}
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
            <span className="bg-white px-2 text-gray-500">
              Orientation sexuelle
            </span>
          </div>
        </div>

        {/* Orientation sexuelle */}
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-2">
          Orientation sexuelle recherchée
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {selectedSexualOrientationIds.length === 0
            ? "Aucune orientation sélectionnée"
            : `${selectedSexualOrientationIds.length} orientation(s) sélectionnée(s)`}
        </p>

        <div className="grid grid-cols-2 gap-3">
          {sexualOrientations.map((orientation) => {
            const isSelected = selectedSexualOrientationIds.includes(
              orientation.id,
            );

            return (
              <div
                key={orientation.id}
                onClick={() => handleToggleSexualOrientation(orientation.id)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${
                  isSelected
                    ? "bg-primary/10 border-primary"
                    : "bg-gray-50 border-transparent hover:bg-gray-100"
                }`}
              >
                <span className="text-2xl">{orientation.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {orientation.label}
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
