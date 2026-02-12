"use client";

import { X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Steps
import IdentityStep from "./steps/IdentityStep";
import PhotoStep from "./steps/PhotoStep";
import OrientationRelationshipStep from "./steps/OrientationRelationshipStep";
import InterestsStep from "./steps/InterestsStep";
import BioStep from "./steps/BioStep";
import AppearanceStep from "./steps/AppearanceStep";
import EducationStep from "./steps/EducationStep";
import WorkStep from "./steps/WorkStep";
import OriginsStep from "./steps/OriginsStep";
import ResidenceStep from "./steps/ResidenceStep";
import HabitsStep from "./steps/HabitsStep";
import FamilyPersonalityStep from "./steps/FamilyPersonalityStep";
import ConvictionsStep from "./steps/ConvictionsStep";

// Navigation
import ModalNavigation from "./ModalNavigation";

// Types
import { ProfileFormData, ReferenceData } from "@/components/ModalSteps/types";

// Hook
import { useAutoSave } from "@/hooks/use-auto-save";

const TOTAL_STEPS = 13;

export default function ProfileModal() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingManually, setIsSavingManually] = useState(false);

  // Form data
  const [formData, setFormData] = useState<ProfileFormData>({
    // Step 1
    pseudo: "",
    birthdate: null,
    gender: "",
    // Step 2
    profilePhotoUrl: null,
    // Step 3
    sexualOrientation: "",
    relationshipStatus: "",
    // Step 4
    selectedInterestIds: [],
    // Step 5
    bio: "",
    // Step 6
    height: 175,
    weight: 70,
    skinTone: "medium",
    // Step 7
    educationLevel: "",
    studyPlace: "",
    // Step 8
    jobTitle: "",
    companyName: "",
    // Step 9 - Origins (✨ MISE À JOUR)
    countryOriginCode: null,
    selectedNationalityCodes: [],
    // Step 10 - Residence (✨ MISE À JOUR)
    countryResidenceCode: null,
    cityId: null,
    // Step 11 - Habits
    smoker: "",
    alcohol: "",
    // Step 12 - Family & Personality
    hasChildren: "",
    wantsChildren: "",
    hasPets: "",
    personalityType: "",
    // Step 13 - Convictions
    zodiacSign: "",
    religion: "",
    loveAnimals: "",
  });

  // Reference data
  const [referenceData, setReferenceData] = useState<ReferenceData>({
    interestCategories: [],
    cities: [],
    nationalities: [],
  });

  // Auto-save callback
  const saveProfile = useCallback(async (data: ProfileFormData) => {
    try {
      await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pseudo: data.pseudo || undefined,
          birthdate: data.birthdate?.toISOString() || undefined,
          gender: data.gender || undefined,
          sexualOrientation: data.sexualOrientation || undefined,
          relationshipStatus: data.relationshipStatus || undefined,
          interestIds:
            data.selectedInterestIds.length > 0
              ? data.selectedInterestIds
              : undefined,
          bio: data.bio || undefined,
          height: data.height,
          weight: data.weight,
          skinTone: data.skinTone || undefined,
          educationLevel: data.educationLevel || undefined,
          studyPlace: data.studyPlace || undefined,
          jobTitle: data.jobTitle || undefined,
          companyName: data.companyName || undefined,
          // Step 9 (✨ MISE À JOUR)
          countryOriginCode: data.countryOriginCode || undefined,
          nationalityCodes:
            data.selectedNationalityCodes.length > 0
              ? data.selectedNationalityCodes
              : undefined,
          // Step 10 (✨ MISE À JOUR)
          countryResidenceCode: data.countryResidenceCode || undefined,
          cityId: data.cityId || undefined,
          // Step 11
          smoker: data.smoker || undefined,
          alcohol: data.alcohol || undefined,
          // Step 12
          hasChildren: data.hasChildren || undefined,
          wantsChildren: data.wantsChildren || undefined,
          hasPets: data.hasPets || undefined,
          personalityType: data.personalityType || undefined,
          // Step 13
          zodiacSign: data.zodiacSign || undefined,
          religion: data.religion || undefined,
          loveAnimals: data.loveAnimals || undefined,
          isTerminated: false,
        }),
      });
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  }, []);

  // Auto-save with debounce
  const { isSaving } = useAutoSave(formData, saveProfile, 2000);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        // Load reference data
        const refResponse = await fetch("/api/profile/reference-data");
        const refData = await refResponse.json();
        setReferenceData(refData);

        // Initialize profile
        const initResponse = await fetch("/api/profile/init", {
          method: "POST",
        });
        const initData = await initResponse.json();

        if (initData.profile) {
          const profile = initData.profile;
          setFormData({
            pseudo: profile.pseudo || "",
            birthdate: profile.birthdate ? new Date(profile.birthdate) : null,
            gender: profile.gender || "",
            profilePhotoUrl: profile.profilePhotoUrl || null,
            sexualOrientation: profile.sexualOrientation || "",
            relationshipStatus: profile.relationshipStatus || "",
            selectedInterestIds:
              profile.interests?.map((i: any) => i.interestId) || [],
            bio: profile.bio || "",
            height: profile.height || 175,
            weight: profile.weight || 70,
            skinTone: profile.skinTone || "medium",
            educationLevel: profile.educationLevel || "",
            studyPlace: profile.studyPlace || "",
            jobTitle: profile.jobTitle || "",
            companyName: profile.companyName || "",
            // Step 9 (✨ MISE À JOUR)
            countryOriginCode: profile.countryOriginCode || null,
            selectedNationalityCodes:
              profile.nationalites
                ?.map((n: any) => n.nationality?.code)
                .filter(Boolean) || [],
            // Step 10 (✨ MISE À JOUR)
            countryResidenceCode: profile.countryResidenceCode || null,
            cityId: profile.cityId || null,
            // Step 11
            smoker: profile.smoker || "",
            alcohol: profile.alcohol || "",
            // Step 12
            hasChildren: profile.hasChildren || "",
            wantsChildren: profile.wantsChildren || "",
            hasPets: profile.hasPets || "",
            personalityType: profile.personalityType || "",
            // Step 13
            zodiacSign: profile.zodiacSign || "",
            religion: profile.religion || "",
            loveAnimals: profile.loveAnimals || "",
          });
        }
      } catch (error) {
        console.error("Failed to load profile data:", error);
        toast.error("Erreur de chargement");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Photo upload handler
  const handlePhotoUpload = async (file: File) => {
    const formDataUpload = new FormData();
    formDataUpload.append("photo", file);

    const response = await fetch("/api/profile/upload-photo", {
      method: "POST",
      body: formDataUpload,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const data = await response.json();
    setFormData((prev: any) => ({ ...prev, profilePhotoUrl: data.photoUrl }));
    toast.success("Photo uploadée !");
  };

  const handlePhotoRemove = () => {
    setFormData((prev: any) => ({ ...prev, profilePhotoUrl: null }));
  };

  // Navigation
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
      setIsSavingManually(true);

      await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          birthdate: formData.birthdate?.toISOString(),
          interestIds: formData.selectedInterestIds,
          // ✨ MISE À JOUR
          countryOriginCode: formData.countryOriginCode || undefined,
          nationalityCodes:
            formData.selectedNationalityCodes.length > 0
              ? formData.selectedNationalityCodes
              : undefined,
          countryResidenceCode: formData.countryResidenceCode || undefined,
          cityId: formData.cityId || undefined,
          loveAnimals: formData.loveAnimals || undefined,
          isTerminated: true,
        }),
      });

      toast.success("Profil complété ! 🎉");
      router.push("/home");
    } catch (error) {
      console.error("Failed to complete profile:", error);
      toast.error("Erreur lors de la finalisation");
    } finally {
      setIsSavingManually(false);
    }
  };

  const handleClose = async () => {
    await saveProfile(formData);
    router.push("/home");
  };

  // Validation par étape
  const hasSelection = () => {
    switch (currentStep) {
      case 0: // Identity
        return !!(formData.pseudo && formData.birthdate && formData.gender);
      case 1: // Photo
        return true; // Optionnel
      case 2: // Orientation & Relationship
        return !!(formData.sexualOrientation && formData.relationshipStatus);
      case 3: // Interests
        return formData.selectedInterestIds.length > 0;
      case 4: // Bio
        return formData.bio.length > 0;
      case 5: // Appearance
        return true;
      case 6: // Education
        return !!(formData.educationLevel || formData.studyPlace);
      case 7: // Work
        return !!(formData.jobTitle || formData.companyName);
      case 8: // Origins (✨ MISE À JOUR)
        return !!(
          formData.countryOriginCode ||
          formData.selectedNationalityCodes.length > 0
        );
      case 9: // Residence (✨ MISE À JOUR)
        return !!formData.cityId;
      case 10: // Habits
        return !!(formData.smoker || formData.alcohol);
      case 11: // Family & Personality
        return !!(
          formData.hasChildren ||
          formData.wantsChildren ||
          formData.hasPets ||
          formData.personalityType
        );
      case 12: // Convictions
        return !!(
          formData.zodiacSign ||
          formData.religion ||
          formData.loveAnimals
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
            {/* Step 1: Identity */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <IdentityStep
                gender={formData.gender}
                pseudo={formData.pseudo}
                birthdate={formData.birthdate}
                onGenderChange={(v) =>
                  setFormData((p: any) => ({ ...p, gender: v }))
                }
                onPseudoChange={(v) =>
                  setFormData((p: any) => ({ ...p, pseudo: v }))
                }
                onBirthdateChange={(v) =>
                  setFormData((p: any) => ({ ...p, birthdate: v }))
                }
              />
            </div>

            {/* Step 2: Photo */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <PhotoStep
                photoUrl={formData.profilePhotoUrl}
                onPhotoUpload={handlePhotoUpload}
                onPhotoRemove={handlePhotoRemove}
              />
            </div>

            {/* Step 3: Orientation & Relationship */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <OrientationRelationshipStep
                sexualOrientation={formData.sexualOrientation}
                relationshipStatus={formData.relationshipStatus}
                onOrientationChange={(v) =>
                  setFormData((p: any) => ({ ...p, sexualOrientation: v }))
                }
                onRelationshipChange={(v) =>
                  setFormData((p: any) => ({ ...p, relationshipStatus: v }))
                }
              />
            </div>

            {/* Step 4: Interests */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <InterestsStep
                selectedInterestIds={formData.selectedInterestIds}
                interestCategories={referenceData.interestCategories}
                onInterestsChange={(ids) =>
                  setFormData((p: any) => ({ ...p, selectedInterestIds: ids }))
                }
              />
            </div>

            {/* Step 5: Bio */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <BioStep
                bio={formData.bio}
                onBioChange={(v) => setFormData((p: any) => ({ ...p, bio: v }))}
              />
            </div>

            {/* Step 6: Appearance */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <AppearanceStep
                height={formData.height}
                weight={formData.weight}
                skinTone={formData.skinTone}
                onHeightChange={(v) =>
                  setFormData((p: any) => ({ ...p, height: v }))
                }
                onWeightChange={(v) =>
                  setFormData((p: any) => ({ ...p, weight: v }))
                }
                onSkinToneChange={(v) =>
                  setFormData((p: any) => ({ ...p, skinTone: v }))
                }
              />
            </div>

            {/* Step 7: Education */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <EducationStep
                educationLevel={formData.educationLevel}
                studyPlace={formData.studyPlace}
                onEducationLevelChange={(v) =>
                  setFormData((p: any) => ({ ...p, educationLevel: v }))
                }
                onStudyPlaceChange={(v) =>
                  setFormData((p: any) => ({ ...p, studyPlace: v }))
                }
              />
            </div>

            {/* Step 8: Work */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <WorkStep
                jobTitle={formData.jobTitle}
                companyName={formData.companyName}
                onJobTitleChange={(v) =>
                  setFormData((p: any) => ({ ...p, jobTitle: v }))
                }
                onCompanyNameChange={(v) =>
                  setFormData((p: any) => ({ ...p, companyName: v }))
                }
              />
            </div>

            {/* Step 9: Origins (✨ MISE À JOUR) */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <OriginsStep
                countryOriginCode={formData.countryOriginCode}
                selectedNationalityCodes={formData.selectedNationalityCodes}
                nationalities={referenceData.nationalities}
                onCountryOriginChange={(code) =>
                  setFormData((p: any) => ({ ...p, countryOriginCode: code }))
                }
                onNationalitiesChange={(codes) =>
                  setFormData((p: any) => ({
                    ...p,
                    selectedNationalityCodes: codes,
                  }))
                }
              />
            </div>

            {/* Step 10: Residence (✨ MISE À JOUR) */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <ResidenceStep
                countryResidenceCode={formData.countryResidenceCode}
                cityId={formData.cityId}
                cities={referenceData.cities}
                nationalities={referenceData.nationalities}
                onCountryChange={(code) =>
                  setFormData((p: any) => ({ ...p, countryResidenceCode: code }))
                }
                onCityChange={(cityId) =>
                  setFormData((p: any) => ({ ...p, cityId: cityId }))
                }
              />
            </div>

            {/* Step 11: Habits */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <HabitsStep
                smoker={formData.smoker}
                alcohol={formData.alcohol}
                onSmokerChange={(v) =>
                  setFormData((p: any) => ({ ...p, smoker: v }))
                }
                onAlcoholChange={(v) =>
                  setFormData((p: any) => ({ ...p, alcohol: v }))
                }
              />
            </div>

            {/* Step 12: Family & Personality */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <FamilyPersonalityStep
                hasChildren={formData.hasChildren}
                wantsChildren={formData.wantsChildren}
                hasPets={formData.hasPets}
                personalityType={formData.personalityType}
                onHasChildrenChange={(v) =>
                  setFormData((p: any) => ({ ...p, hasChildren: v }))
                }
                onWantsChildrenChange={(v) =>
                  setFormData((p: any) => ({ ...p, wantsChildren: v }))
                }
                onHasPetsChange={(v) =>
                  setFormData((p: any) => ({ ...p, hasPets: v }))
                }
                onPersonalityTypeChange={(v) =>
                  setFormData((p: any) => ({ ...p, personalityType: v }))
                }
              />
            </div>

            {/* Step 13: Convictions */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <ConvictionsStep
                zodiacSign={formData.zodiacSign}
                religion={formData.religion}
                loveAnimals={formData.loveAnimals}
                onZodiacSignChange={(v) =>
                  setFormData((p: any) => ({ ...p, zodiacSign: v }))
                }
                onReligionChange={(v) =>
                  setFormData((p: any) => ({ ...p, religion: v }))
                }
                onLoveAnimalsChange={(v) =>
                  setFormData((p: any) => ({ ...p, loveAnimals: v }))
                }
              />
            </div>
          </div>
        </div>

        {/* Fixed Bottom Navigation */}
        <ModalNavigation
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
