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

  // Form data with default values
  const [formData, setFormData] = useState<PreferenceFormData>({
    // Step 1: Genre & Âge
    genderPreference: "",
    ageMin: 18,
    ageMax: 35,

    // Step 2: Apparence
    heightMin: 150,
    heightMax: 190,
    weightMin: 50,
    weightMax: 90,
    skinTonePreference: "",

    // Step 3: Statut & Orientation
    relationshipStatusPreference: "",
    sexualOrientationPreference: "",

    // Step 4: Centres d'intérêt
    selectedInterestIds: [],

    // Step 5: Éducation
    educationLevelPreference: "",

    // Step 6: Origines
    countryOriginPreference: "",
    selectedNationalityIds: [],

    // Step 7: Résidence
    countryResidencePreference: "",
    selectedCityIds: [],

    // Step 8: Habitudes
    smokerPreference: "",
    alcoholPreference: "",

    // Step 9: Projet familial
    hasChildrenPreference: "",
    wantsChildrenPreference: "",
    hasPetsPreference: "",

    // Step 10: Personnalité
    personalityTypePreference: "",

    // Step 11: Convictions
    zodiacSignPreference: "",
    religionPreference: "",
    loveAnimalsPreference: "",
  });

  // Reference data
  const [referenceData, setReferenceData] = useState<ReferenceData>({
    interestCategories: [],
    cities: [],
    nationalities: [],
  });

  // Auto-save callback
  const savePreference = useCallback(async (data: PreferenceFormData) => {
    try {
      await fetch("/api/preference/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genderPreference: data.genderPreference || undefined,
          ageMin: data.ageMin,
          ageMax: data.ageMax,
          heightMin: data.heightMin,
          heightMax: data.heightMax,
          weightMin: data.weightMin,
          weightMax: data.weightMax,
          skinTonePreference: data.skinTonePreference || undefined,
          relationshipStatusPreference:
            data.relationshipStatusPreference || undefined,
          sexualOrientationPreference:
            data.sexualOrientationPreference || undefined,
          selectedInterestIds:
            data.selectedInterestIds.length > 0
              ? data.selectedInterestIds
              : undefined,
          educationLevelPreference: data.educationLevelPreference || undefined,
          countryOriginPreference: data.countryOriginPreference || undefined,
          selectedNationalityIds:
            data.selectedNationalityIds.length > 0
              ? data.selectedNationalityIds
              : undefined,
          countryResidencePreference:
            data.countryResidencePreference || undefined,
          selectedCityIds:
            data.selectedCityIds.length > 0 ? data.selectedCityIds : undefined,
          smokerPreference: data.smokerPreference || undefined,
          alcoholPreference: data.alcoholPreference || undefined,
          hasChildrenPreference: data.hasChildrenPreference || undefined,
          wantsChildrenPreference: data.wantsChildrenPreference || undefined,
          hasPetsPreference: data.hasPetsPreference || undefined,
          personalityTypePreference:
            data.personalityTypePreference || undefined,
          zodiacSignPreference: data.zodiacSignPreference || undefined,
          religionPreference: data.religionPreference || undefined,
          loveAnimalsPreference: data.loveAnimalsPreference || undefined,
          isTerminated: false,
        }),
      });
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  }, []);

  // Auto-save with debounce
  const { isSaving } = useAutoSave(formData, savePreference, 2000);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        // Load reference data
        const refResponse = await fetch("/api/profile/reference-data");
        const refData = await refResponse.json();
        setReferenceData(refData);

        // Initialize preference
        const initResponse = await fetch("/api/preference/init", {
          method: "POST",
        });
        const initData = await initResponse.json();

        if (initData.preference) {
          const pref = initData.preference;
          setFormData({
            genderPreference: pref.genderPreference || "",
            ageMin: pref.ageMin ?? 18,
            ageMax: pref.ageMax ?? 35,
            heightMin: pref.heightMin ?? 150,
            heightMax: pref.heightMax ?? 190,
            weightMin: pref.weightMin ?? 50,
            weightMax: pref.weightMax ?? 90,
            skinTonePreference: pref.skinTonePreference || "",
            relationshipStatusPreference:
              pref.relationshipStatusPreference || "",
            sexualOrientationPreference: pref.sexualOrientationPreference || "",
            selectedInterestIds:
              pref.selectedInterests?.map((i: any) => i.interestId) || [],
            educationLevelPreference: pref.educationLevelPreference || "",
            countryOriginPreference: pref.countryOriginPreference || "",
            selectedNationalityIds:
              pref.selectedNationalities?.map((n: any) => n.nationalityId) ||
              [],
            countryResidencePreference: pref.countryResidencePreference || "",
            selectedCityIds:
              pref.selectedCities?.map((c: any) => c.cityId) || [],
            smokerPreference: pref.smokerPreference || "",
            alcoholPreference: pref.alcoholPreference || "",
            hasChildrenPreference: pref.hasChildrenPreference || "",
            wantsChildrenPreference: pref.wantsChildrenPreference || "",
            hasPetsPreference: pref.hasPetsPreference || "",
            personalityTypePreference: pref.personalityTypePreference || "",
            zodiacSignPreference: pref.zodiacSignPreference || "",
            religionPreference: pref.religionPreference || "",
            loveAnimalsPreference: pref.loveAnimalsPreference || "",
          });
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

  // Navigation handlers
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
          selectedInterestIds: formData.selectedInterestIds,
          selectedNationalityIds: formData.selectedNationalityIds,
          selectedCityIds: formData.selectedCityIds,
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

  // Validation par étape
  const hasSelection = () => {
    switch (currentStep) {
      case 0: // Genre & Âge
        return !!(
          formData.genderPreference ||
          formData.ageMin !== 18 ||
          formData.ageMax !== 35
        );
      case 1: // Apparence
        return true;
      case 2: // Statut & Orientation
        return !!(
          formData.relationshipStatusPreference ||
          formData.sexualOrientationPreference
        );
      case 3: // Centres d'intérêt
        return formData.selectedInterestIds.length > 0;
      case 4: // Éducation
        return !!formData.educationLevelPreference;
      case 5: // Origines
        return formData.selectedNationalityIds.length > 0;
      case 6: // Résidence
        return formData.selectedCityIds.length > 0;
      case 7: // Habitudes
        return !!(formData.smokerPreference || formData.alcoholPreference);
      case 8: // Famille
        return !!(
          formData.hasChildrenPreference ||
          formData.wantsChildrenPreference ||
          formData.hasPetsPreference
        );
      case 9: // Personnalité
        return !!formData.personalityTypePreference;
      case 10: // Convictions
        return !!(
          formData.zodiacSignPreference ||
          formData.religionPreference ||
          formData.loveAnimalsPreference
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
                genderPreference={formData.genderPreference}
                ageMin={formData.ageMin}
                ageMax={formData.ageMax}
                onGenderChange={(v) =>
                  setFormData((p) => ({ ...p, genderPreference: v }))
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
                skinTonePreference={formData.skinTonePreference}
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
                onSkinToneChange={(v) =>
                  setFormData((p) => ({ ...p, skinTonePreference: v }))
                }
              />
            </div>

            {/* Step 3: Statut & Orientation */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <RelationshipOrientationPreferenceStep
                relationshipStatusPreference={
                  formData.relationshipStatusPreference
                }
                sexualOrientationPreference={
                  formData.sexualOrientationPreference
                }
                onRelationshipChange={(v) =>
                  setFormData((p) => ({
                    ...p,
                    relationshipStatusPreference: v,
                  }))
                }
                onOrientationChange={(v) =>
                  setFormData((p) => ({ ...p, sexualOrientationPreference: v }))
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
                educationLevelPreference={formData.educationLevelPreference}
                onEducationLevelChange={(v) =>
                  setFormData((p) => ({ ...p, educationLevelPreference: v }))
                }
              />
            </div>

            {/* Step 6: Origines */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <OriginsPreferenceStep
                selectedNationalityIds={formData.selectedNationalityIds}
                nationalities={referenceData.nationalities}
                onNationalitiesChange={(ids) =>
                  setFormData((p) => ({ ...p, selectedNationalityIds: ids }))
                }
              />
            </div>

            {/* Step 7: Résidence */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <ResidencePreferenceStep
                selectedCityIds={formData.selectedCityIds}
                cities={referenceData.cities}
                onCitiesChange={(ids) =>
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
                personalityTypePreference={formData.personalityTypePreference}
                onPersonalityChange={(v) =>
                  setFormData((p) => ({ ...p, personalityTypePreference: v }))
                }
              />
            </div>

            {/* Step 11: Convictions */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <ConvictionsPreferenceStep
                zodiacSignPreference={formData.zodiacSignPreference}
                religionPreference={formData.religionPreference}
                loveAnimalsPreference={formData.loveAnimalsPreference}
                onZodiacChange={(v) =>
                  setFormData((p) => ({ ...p, zodiacSignPreference: v }))
                }
                onReligionChange={(v) =>
                  setFormData((p) => ({ ...p, religionPreference: v }))
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
