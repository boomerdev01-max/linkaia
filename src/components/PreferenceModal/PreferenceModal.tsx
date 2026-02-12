// src/components/PreferenceModal/PreferenceModal.tsx
"use client";

import { X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Steps
import GenderAgeStep from "./steps/GenderAgeStep";
import AppearancePreferenceStep from "./steps/AppearancePreferenceStep";
import RelationshipOrientationPreferenceStep from "./steps/RelationshipOrientationPreferenceStep";
import InterestsPreferenceStep from "./steps/InterestsPreferenceStep";
import EducationPreferenceStep from "./steps/EducationPreferenceStep";
import OriginsPreferenceStep from "./steps/OriginsPreferenceStep";
import ResidencePreferenceStep from "./steps/ResidencePreferenceStep";
import HabitsPreferenceStep from "./steps/HabitsPreferenceStep";
import FamilyPreferenceStep from "./steps/FamilyPreferenceStep";
import PersonalityPreferenceStep from "./steps/PersonalityPreferenceStep";
import ConvictionsPreferenceStep from "./steps/ConvictionsPreferenceStep";

// Navigation
import PreferenceModalNavigation from "./PreferenceModalNavigation";

// Types
import { PreferenceFormData, ReferenceData } from "./types";

// Hook
import { useAutoSave } from "@/hooks/use-auto-save";

const TOTAL_STEPS = 11;

export default function PreferenceModal() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState<PreferenceFormData>({
    // Step 1: Genre & Âge
    selectedGenderCodes: [],
    ageMin: 18,
    ageMax: 35,

    // Step 2: Apparence
    heightMin: 150,
    heightMax: 190,
    weightMin: 50,
    weightMax: 90,
    selectedSkinToneIds: [],

    // Step 3: Statut & Orientation
    selectedRelationshipStatusIds: [],
    selectedSexualOrientationIds: [],

    // Step 4: Centres d'intérêt
    selectedInterestIds: [],

    // Step 5: Éducation
    selectedEducationLevelIds: [],

    // Step 6: Origines
    selectedNationalityCodes: [],

    // Step 7: Résidence
    selectedResidenceCountryCodes: [],
    selectedCityIds: [],

    // Step 8: Habitudes
    smokerPreference: "",
    alcoholPreference: "",

    // Step 9: Projet familial
    hasChildrenPreference: "",
    wantsChildrenPreference: "",
    hasPetsPreference: "",

    // Step 10: Personnalité
    selectedPersonalityTypeIds: [],

    // Step 11: Convictions
    selectedZodiacSignIds: [],
    selectedReligionIds: [],
    loveAnimalsPreference: "",
  });

  const [referenceData, setReferenceData] = useState<ReferenceData>({
    religions: [],
    zodiacSigns: [],
    sexualOrientations: [],
    relationshipStatuses: [],
    skinTones: [],
    personalityTypes: [],
    educationLevels: [],
    interestCategories: [],
    cities: [],
    nationalities: [],
  });

  const savePreference = useCallback(async (data: PreferenceFormData) => {
    try {
      await fetch("/api/preference/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedGenderCodes:
            data.selectedGenderCodes.length > 0
              ? data.selectedGenderCodes
              : undefined,
          ageMin: data.ageMin,
          ageMax: data.ageMax,
          heightMin: data.heightMin,
          heightMax: data.heightMax,
          weightMin: data.weightMin,
          weightMax: data.weightMax,
          selectedSkinToneIds:
            data.selectedSkinToneIds.length > 0
              ? data.selectedSkinToneIds
              : undefined,
          selectedRelationshipStatusIds:
            data.selectedRelationshipStatusIds.length > 0
              ? data.selectedRelationshipStatusIds
              : undefined,
          selectedSexualOrientationIds:
            data.selectedSexualOrientationIds.length > 0
              ? data.selectedSexualOrientationIds
              : undefined,
          // ✅ On envoie toujours selectedInterestIds, même vide ([])
          // Un tableau vide signifie "Peu importe" et doit effacer les anciens choix
          selectedInterestIds: data.selectedInterestIds,
          selectedEducationLevelIds:
            data.selectedEducationLevelIds.length > 0
              ? data.selectedEducationLevelIds
              : undefined,
          selectedNationalityCodes:
            data.selectedNationalityCodes.length > 0
              ? data.selectedNationalityCodes
              : undefined,
          selectedResidenceCountryCodes:
            data.selectedResidenceCountryCodes.length > 0
              ? data.selectedResidenceCountryCodes
              : undefined,
          selectedCityIds:
            data.selectedCityIds.length > 0 ? data.selectedCityIds : undefined,
          smokerPreference: data.smokerPreference || undefined,
          alcoholPreference: data.alcoholPreference || undefined,
          hasChildrenPreference: data.hasChildrenPreference || undefined,
          wantsChildrenPreference: data.wantsChildrenPreference || undefined,
          hasPetsPreference: data.hasPetsPreference || undefined,
          selectedPersonalityTypeIds:
            data.selectedPersonalityTypeIds.length > 0
              ? data.selectedPersonalityTypeIds
              : undefined,
          selectedZodiacSignIds:
            data.selectedZodiacSignIds.length > 0
              ? data.selectedZodiacSignIds
              : undefined,
          selectedReligionIds:
            data.selectedReligionIds.length > 0
              ? data.selectedReligionIds
              : undefined,
          loveAnimalsPreference: data.loveAnimalsPreference || undefined,
          isTerminated: false,
        }),
      });
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  }, []);

  const { isSaving } = useAutoSave(formData, savePreference, 2000);

  useEffect(() => {
    async function loadData() {
      try {
        // ✅ Les deux fetches en parallèle avec gestion d'erreur indépendante
        const [refResponse, initResponse] = await Promise.all([
          fetch("/api/profile/reference-data"),
          fetch("/api/preference/init", { method: "POST" }),
        ]);

        // ✅ Gestion explicite de l'échec du fetch reference-data
        if (!refResponse.ok) {
          console.error(
            "❌ reference-data fetch failed:",
            refResponse.status,
            refResponse.statusText,
          );
          toast.error("Impossible de charger les centres d'intérêt");
        } else {
          const refData = await refResponse.json();
          // ✅ Vérification défensive : s'assure que interestCategories est bien un tableau
          setReferenceData({
            ...refData,
            interestCategories: Array.isArray(refData.interestCategories)
              ? refData.interestCategories
              : [],
          });
        }

        if (!initResponse.ok) {
          console.error(
            "❌ preference/init fetch failed:",
            initResponse.status,
            initResponse.statusText,
          );
        } else {
          const initData = await initResponse.json();

          if (initData.preference) {
            const pref = initData.preference;

            setFormData({
              selectedGenderCodes:
                pref.selectedGenders?.map((g: any) => g.genderCode) || [],
              ageMin: pref.ageMin ?? 18,
              ageMax: pref.ageMax ?? 35,
              heightMin: pref.heightMin ?? 150,
              heightMax: pref.heightMax ?? 190,
              weightMin: pref.weightMin ?? 50,
              weightMax: pref.weightMax ?? 90,
              selectedSkinToneIds:
                pref.selectedSkinTones?.map((st: any) => st.skinToneId) || [],
              selectedRelationshipStatusIds:
                pref.selectedRelationshipStatuses?.map(
                  (rs: any) => rs.relationshipStatusId,
                ) || [],
              selectedSexualOrientationIds:
                pref.selectedSexualOrientations?.map(
                  (so: any) => so.sexualOrientationId,
                ) || [],
              selectedInterestIds:
                pref.selectedInterests?.map((i: any) => i.interestId) || [],
              selectedEducationLevelIds:
                pref.selectedEducationLevels?.map(
                  (el: any) => el.educationLevelId,
                ) || [],
              selectedNationalityCodes:
                pref.selectedNationalities?.map((n: any) => n.countryCode) ||
                [],
              selectedResidenceCountryCodes:
                pref.selectedResidenceCountries?.map(
                  (rc: any) => rc.countryCode,
                ) || [],
              selectedCityIds:
                pref.selectedCities?.map((c: any) => c.cityId) || [],
              smokerPreference: pref.smokerPreference || "",
              alcoholPreference: pref.alcoholPreference || "",
              hasChildrenPreference: pref.hasChildrenPreference || "",
              wantsChildrenPreference: pref.wantsChildrenPreference || "",
              hasPetsPreference: pref.hasPetsPreference || "",
              selectedPersonalityTypeIds:
                pref.selectedPersonalityTypes?.map(
                  (pt: any) => pt.personalityTypeId,
                ) || [],
              selectedZodiacSignIds:
                pref.selectedZodiacSigns?.map((zs: any) => zs.zodiacSignId) ||
                [],
              selectedReligionIds:
                pref.selectedReligions?.map((r: any) => r.religionId) || [],
              loveAnimalsPreference: pref.loveAnimalsPreference || "",
            });
          }
        }
      } catch (error) {
        console.error("Failed to load preference data:", error);
        toast.error("Erreur de chargement");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    try {
      await fetch("/api/preference/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          selectedGenderCodes: formData.selectedGenderCodes,
          selectedSkinToneIds: formData.selectedSkinToneIds,
          selectedRelationshipStatusIds: formData.selectedRelationshipStatusIds,
          selectedSexualOrientationIds: formData.selectedSexualOrientationIds,
          selectedInterestIds: formData.selectedInterestIds,
          selectedEducationLevelIds: formData.selectedEducationLevelIds,
          selectedNationalityCodes: formData.selectedNationalityCodes,
          selectedResidenceCountryCodes: formData.selectedResidenceCountryCodes,
          selectedCityIds: formData.selectedCityIds,
          selectedPersonalityTypeIds: formData.selectedPersonalityTypeIds,
          selectedZodiacSignIds: formData.selectedZodiacSignIds,
          selectedReligionIds: formData.selectedReligionIds,
          isTerminated: true,
        }),
      });

      toast.success("Préférences enregistrées ! 🎉");
      router.push("/home");
    } catch (error) {
      console.error("Failed to complete preferences:", error);
      toast.error("Erreur lors de la finalisation");
    }
  };

  const handleClose = async () => {
    await savePreference(formData);
    router.push("/home");
  };

  const hasSelection = () => {
    switch (currentStep) {
      case 0: // Genre & Âge
        return (
          formData.selectedGenderCodes.length > 0 ||
          formData.ageMin !== 18 ||
          formData.ageMax !== 35
        );
      case 1: // Apparence
        return true;
      case 2: // Statut & Orientation
        return (
          formData.selectedRelationshipStatusIds.length > 0 ||
          formData.selectedSexualOrientationIds.length > 0
        );
      case 3: // Centres d'intérêt
        // ✅ FIX : "Peu importe" (tableau vide) est une réponse valide → toujours true
        // Un utilisateur qui ne sélectionne rien a explicitement choisi "peu importe"
        return true;
      case 4: // Éducation
        return formData.selectedEducationLevelIds.length > 0;
      case 5: // Origines
        return formData.selectedNationalityCodes.length > 0;
      case 6: // Résidence
        return (
          formData.selectedResidenceCountryCodes.length > 0 ||
          formData.selectedCityIds.length > 0
        );
      case 7: // Habitudes
        return !!(formData.smokerPreference || formData.alcoholPreference);
      case 8: // Famille
        return !!(
          formData.hasChildrenPreference ||
          formData.wantsChildrenPreference ||
          formData.hasPetsPreference
        );
      case 9: // Personnalité
        return formData.selectedPersonalityTypeIds.length > 0;
      case 10: // Convictions
        return (
          formData.selectedZodiacSignIds.length > 0 ||
          formData.selectedReligionIds.length > 0 ||
          !!formData.loveAnimalsPreference
        );
      default:
        return false;
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-linear-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-black/5" />

      <div className="relative w-142.5 h-screen bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 left-4 z-50 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-gray-100 transition-all duration-200 hover:scale-110"
          aria-label="Fermer"
        >
          <X className="w-6 h-6 text-gray-700" strokeWidth={2.5} />
        </button>

        {/* Auto-save indicator */}
        {isSaving && (
          <div className="absolute top-4 right-4 z-50 bg-blue-500 text-white text-xs px-3 py-1 rounded-full shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Sauvegarde...
          </div>
        )}

        {/* Step Content */}
        <div className="flex-1 overflow-hidden">
          <div
            className="h-full flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentStep * 100}%)` }}
          >
            {/* Step 1: Genre & Âge */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <GenderAgeStep
                selectedGenderCodes={formData.selectedGenderCodes}
                ageMin={formData.ageMin}
                ageMax={formData.ageMax}
                onGenderCodesChange={(codes: any) =>
                  setFormData((p) => ({ ...p, selectedGenderCodes: codes }))
                }
                onAgeMinChange={(v) =>
                  setFormData((p) => ({ ...p, ageMin: v }))
                }
                onAgeMaxChange={(v) =>
                  setFormData((p) => ({ ...p, ageMax: v }))
                }
              />
            </div>

            {/* Step 2: Apparence */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <AppearancePreferenceStep
                heightMin={formData.heightMin}
                heightMax={formData.heightMax}
                weightMin={formData.weightMin}
                weightMax={formData.weightMax}
                selectedSkinToneIds={formData.selectedSkinToneIds}
                skinTones={referenceData.skinTones}
                onHeightMinChange={(v) =>
                  setFormData((p) => ({ ...p, heightMin: v }))
                }
                onHeightMaxChange={(v) =>
                  setFormData((p) => ({ ...p, heightMax: v }))
                }
                onWeightMinChange={(v) =>
                  setFormData((p) => ({ ...p, weightMin: v }))
                }
                onWeightMaxChange={(v) =>
                  setFormData((p) => ({ ...p, weightMax: v }))
                }
                onSkinToneIdsChange={(ids: any) =>
                  setFormData((p) => ({ ...p, selectedSkinToneIds: ids }))
                }
              />
            </div>

            {/* Step 3: Statut & Orientation */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <RelationshipOrientationPreferenceStep
                selectedRelationshipStatusIds={
                  formData.selectedRelationshipStatusIds
                }
                selectedSexualOrientationIds={
                  formData.selectedSexualOrientationIds
                }
                relationshipStatuses={referenceData.relationshipStatuses}
                sexualOrientations={referenceData.sexualOrientations}
                onRelationshipStatusIdsChange={(ids: any) =>
                  setFormData((p) => ({
                    ...p,
                    selectedRelationshipStatusIds: ids,
                  }))
                }
                onSexualOrientationIdsChange={(ids: any) =>
                  setFormData((p) => ({
                    ...p,
                    selectedSexualOrientationIds: ids,
                  }))
                }
              />
            </div>

            {/* Step 4: Centres d'intérêt */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <InterestsPreferenceStep
                selectedInterestIds={formData.selectedInterestIds}
                interestCategories={referenceData.interestCategories}
                onInterestsChange={(ids) =>
                  setFormData((p) => ({ ...p, selectedInterestIds: ids }))
                }
              />
            </div>

            {/* Step 5: Éducation */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <EducationPreferenceStep
                selectedEducationLevelIds={formData.selectedEducationLevelIds}
                educationLevels={referenceData.educationLevels}
                onEducationLevelIdsChange={(ids: any) =>
                  setFormData((p) => ({ ...p, selectedEducationLevelIds: ids }))
                }
              />
            </div>

            {/* Step 6: Origines */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <OriginsPreferenceStep
                selectedNationalityCodes={formData.selectedNationalityCodes}
                nationalities={referenceData.nationalities}
                onNationalityCodesChange={(codes: any) =>
                  setFormData((p) => ({
                    ...p,
                    selectedNationalityCodes: codes,
                  }))
                }
              />
            </div>

            {/* Step 7: Résidence */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <ResidencePreferenceStep
                selectedResidenceCountryCodes={
                  formData.selectedResidenceCountryCodes
                }
                selectedCityIds={formData.selectedCityIds}
                nationalities={referenceData.nationalities}
                cities={referenceData.cities}
                onResidenceCountryCodesChange={(codes: any) =>
                  setFormData((p) => ({
                    ...p,
                    selectedResidenceCountryCodes: codes,
                  }))
                }
                onCityIdsChange={(ids: any) =>
                  setFormData((p) => ({ ...p, selectedCityIds: ids }))
                }
              />
            </div>

            {/* Step 8: Habitudes */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <HabitsPreferenceStep
                smokerPreference={formData.smokerPreference}
                alcoholPreference={formData.alcoholPreference}
                onSmokerChange={(v) =>
                  setFormData((p) => ({ ...p, smokerPreference: v }))
                }
                onAlcoholChange={(v) =>
                  setFormData((p) => ({ ...p, alcoholPreference: v }))
                }
              />
            </div>

            {/* Step 9: Famille */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <FamilyPreferenceStep
                hasChildrenPreference={formData.hasChildrenPreference}
                wantsChildrenPreference={formData.wantsChildrenPreference}
                hasPetsPreference={formData.hasPetsPreference}
                onHasChildrenChange={(v) =>
                  setFormData((p) => ({ ...p, hasChildrenPreference: v }))
                }
                onWantsChildrenChange={(v) =>
                  setFormData((p) => ({ ...p, wantsChildrenPreference: v }))
                }
                onHasPetsChange={(v) =>
                  setFormData((p) => ({ ...p, hasPetsPreference: v }))
                }
              />
            </div>

            {/* Step 10: Personnalité */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <PersonalityPreferenceStep
                selectedPersonalityTypeIds={formData.selectedPersonalityTypeIds}
                personalityTypes={referenceData.personalityTypes}
                onPersonalityTypeIdsChange={(ids: any) =>
                  setFormData((p) => ({
                    ...p,
                    selectedPersonalityTypeIds: ids,
                  }))
                }
              />
            </div>

            {/* Step 11: Convictions */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <ConvictionsPreferenceStep
                selectedZodiacSignIds={formData.selectedZodiacSignIds}
                selectedReligionIds={formData.selectedReligionIds}
                loveAnimalsPreference={formData.loveAnimalsPreference}
                zodiacSigns={referenceData.zodiacSigns}
                religions={referenceData.religions}
                onZodiacSignIdsChange={(ids: any) =>
                  setFormData((p) => ({ ...p, selectedZodiacSignIds: ids }))
                }
                onReligionIdsChange={(ids: any) =>
                  setFormData((p) => ({ ...p, selectedReligionIds: ids }))
                }
                onLoveAnimalsChange={(v) =>
                  setFormData((p) => ({ ...p, loveAnimalsPreference: v }))
                }
              />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <PreferenceModalNavigation
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          hasSelection={hasSelection()}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        html,
        body {
          overscroll-behavior: none;
        }
      `}</style>
    </div>
  );
}
