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

interface ProfileEditModalProps {
  userId: string;
}

export default function ProfileEditModal({ userId }: ProfileEditModalProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingManually, setIsSavingManually] = useState(false);

  // Form data (✨ MISE À JOUR)
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

  // Auto-save callback (✨ MISE À JOUR)
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

  // Load initial data (✨ MISE À JOUR)
  useEffect(() => {
    async function loadData() {
      try {
        // Load reference data
        const refResponse = await fetch("/api/profile/reference-data");
        const refData = await refResponse.json();
        setReferenceData(refData);

        // Load existing profile data for editing (reuse init API)
        const editResponse = await fetch("/api/profile/init", {
          method: "POST",
        });
        const editData = await editResponse.json();

        if (editData.profile) {
          const profile = editData.profile;
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
        toast.error("Erreur de chargement du profil");
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

    try {
      const response = await fetch("/api/profile/upload-photo", {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setFormData((prev) => ({
        ...prev,
        profilePhotoUrl: data.photoUrl,
      }));

      toast.success("Photo uploadée avec succès !");
    } catch (error) {
      console.error("Photo upload failed:", error);
      toast.error("Erreur lors de l'upload de la photo");
      throw error;
    }
  };

  const handlePhotoRemove = () => {
    setFormData((prev) => ({
      ...prev,
      profilePhotoUrl: null,
    }));
  };

  const handleSkip = async () => {
    try {
      setIsSavingManually(true);

      // Sauvegarder les modifications actuelles
      await saveProfile(formData);

      toast.success("Modifications enregistrées !");

      // Rediriger vers le profil
      router.push(`/profile/${userId}`);
    } catch (error) {
      console.error("Failed to save on skip:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSavingManually(false);
    }
  };

  const handleClose = async () => {
    try {
      setIsSavingManually(true);

      // Sauvegarder les modifications actuelles
      await saveProfile(formData);

      // Rediriger vers le profil
      router.push(`/profile/${userId}`);
    } catch (error) {
      console.error("Failed to save on close:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSavingManually(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = async () => {
    // Si on est à la dernière étape, on finalise (✨ MISE À JOUR)
    if (currentStep === TOTAL_STEPS - 1) {
      try {
        setIsSavingManually(true);

        // Sauvegarde finale avec isTerminated = true
        const response = await fetch("/api/profile/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pseudo: formData.pseudo || undefined,
            birthdate: formData.birthdate?.toISOString() || undefined,
            gender: formData.gender || undefined,
            sexualOrientation: formData.sexualOrientation || undefined,
            relationshipStatus: formData.relationshipStatus || undefined,
            interestIds:
              formData.selectedInterestIds.length > 0
                ? formData.selectedInterestIds
                : undefined,
            bio: formData.bio || undefined,
            height: formData.height,
            weight: formData.weight,
            skinTone: formData.skinTone || undefined,
            educationLevel: formData.educationLevel || undefined,
            studyPlace: formData.studyPlace || undefined,
            jobTitle: formData.jobTitle || undefined,
            companyName: formData.companyName || undefined,
            // Step 9 (✨ MISE À JOUR)
            countryOriginCode: formData.countryOriginCode || undefined,
            nationalityCodes:
              formData.selectedNationalityCodes.length > 0
                ? formData.selectedNationalityCodes
                : undefined,
            // Step 10 (✨ MISE À JOUR)
            countryResidenceCode: formData.countryResidenceCode || undefined,
            cityId: formData.cityId || undefined,
            // Step 11
            smoker: formData.smoker || undefined,
            alcohol: formData.alcohol || undefined,
            // Step 12
            hasChildren: formData.hasChildren || undefined,
            wantsChildren: formData.wantsChildren || undefined,
            hasPets: formData.hasPets || undefined,
            personalityType: formData.personalityType || undefined,
            // Step 13
            zodiacSign: formData.zodiacSign || undefined,
            religion: formData.religion || undefined,
            loveAnimals: formData.loveAnimals || undefined,
            isTerminated: true,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save profile");
        }

        toast.success("Profil mis à jour avec succès ! 🎉");

        // Rediriger vers le profil
        router.push(`/profile/${userId}`);
      } catch (error) {
        console.error("Failed to finalize profile:", error);
        toast.error("Erreur lors de la sauvegarde finale");
      } finally {
        setIsSavingManually(false);
      }
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  // Déterminer si le bouton "Suivant" doit être actif
  const hasSelection = () => {
    switch (currentStep) {
      case 0: // Identity
        return !!formData.gender && !!formData.pseudo && !!formData.birthdate;
      case 1: // Photo (optionnel)
        return true;
      case 2: // Orientation & Relationship
        return !!formData.sexualOrientation && !!formData.relationshipStatus;
      case 3: // Interests
        return formData.selectedInterestIds.length > 0;
      case 4: // Bio (optionnel)
        return true;
      case 5: // Appearance
        return !!formData.skinTone;
      case 6: // Education (optionnel)
        return true;
      case 7: // Work (optionnel)
        return true;
      case 8: // Origins (optionnel)
        return true;
      case 9: // Residence (optionnel)
        return true;
      case 10: // Habits (optionnel)
        return true;
      case 11: // Family & Personality (optionnel)
        return true;
      case 12: // Convictions (optionnel)
        return true;
      default:
        return false;
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">
            Modifier mon profil
          </h1>
          {isSaving && (
            <span className="text-sm text-gray-500 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              Sauvegarde...
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSkip}
            disabled={isSavingManually}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            Enregistrer et quitter
          </button>
          <button
            onClick={handleClose}
            disabled={isSavingManually}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-hidden">
          <div
            className="h-full flex transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(-${currentStep * 100}%)`,
            }}
          >
            {/* Step 1: Identity */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <IdentityStep
                gender={formData.gender}
                pseudo={formData.pseudo}
                birthdate={formData.birthdate}
                onGenderChange={(v) =>
                  setFormData((p) => ({ ...p, gender: v }))
                }
                onPseudoChange={(v) =>
                  setFormData((p) => ({ ...p, pseudo: v }))
                }
                onBirthdateChange={(v) =>
                  setFormData((p) => ({ ...p, birthdate: v }))
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
                  setFormData((p) => ({ ...p, sexualOrientation: v }))
                }
                onRelationshipChange={(v) =>
                  setFormData((p) => ({ ...p, relationshipStatus: v }))
                }
              />
            </div>

            {/* Step 4: Interests */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <InterestsStep
                selectedInterestIds={formData.selectedInterestIds}
                interestCategories={referenceData.interestCategories}
                onInterestsChange={(ids) =>
                  setFormData((p) => ({ ...p, selectedInterestIds: ids }))
                }
              />
            </div>

            {/* Step 5: Bio */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <BioStep
                bio={formData.bio}
                onBioChange={(v) => setFormData((p) => ({ ...p, bio: v }))}
              />
            </div>

            {/* Step 6: Appearance */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <AppearanceStep
                height={formData.height}
                weight={formData.weight}
                skinTone={formData.skinTone}
                onHeightChange={(v) =>
                  setFormData((p) => ({ ...p, height: v }))
                }
                onWeightChange={(v) =>
                  setFormData((p) => ({ ...p, weight: v }))
                }
                onSkinToneChange={(v) =>
                  setFormData((p) => ({ ...p, skinTone: v }))
                }
              />
            </div>

            {/* Step 7: Education */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <EducationStep
                educationLevel={formData.educationLevel}
                studyPlace={formData.studyPlace}
                onEducationLevelChange={(v) =>
                  setFormData((p) => ({ ...p, educationLevel: v }))
                }
                onStudyPlaceChange={(v) =>
                  setFormData((p) => ({ ...p, studyPlace: v }))
                }
              />
            </div>

            {/* Step 8: Work */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <WorkStep
                jobTitle={formData.jobTitle}
                companyName={formData.companyName}
                onJobTitleChange={(v) =>
                  setFormData((p) => ({ ...p, jobTitle: v }))
                }
                onCompanyNameChange={(v) =>
                  setFormData((p) => ({ ...p, companyName: v }))
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
                  setFormData((p) => ({ ...p, countryOriginCode: code }))
                }
                onNationalitiesChange={(codes) =>
                  setFormData((p) => ({
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
                  setFormData((p) => ({ ...p, countryResidenceCode: code }))
                }
                onCityChange={(cityId) =>
                  setFormData((p) => ({ ...p, cityId: cityId }))
                }
              />
            </div>

            {/* Step 11: Habits */}
            <div className="min-w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
              <HabitsStep
                smoker={formData.smoker}
                alcohol={formData.alcohol}
                onSmokerChange={(v) =>
                  setFormData((p) => ({ ...p, smoker: v }))
                }
                onAlcoholChange={(v) =>
                  setFormData((p) => ({ ...p, alcohol: v }))
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
                  setFormData((p) => ({ ...p, hasChildren: v }))
                }
                onWantsChildrenChange={(v) =>
                  setFormData((p) => ({ ...p, wantsChildren: v }))
                }
                onHasPetsChange={(v) =>
                  setFormData((p) => ({ ...p, hasPets: v }))
                }
                onPersonalityTypeChange={(v) =>
                  setFormData((p) => ({ ...p, personalityType: v }))
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
                  setFormData((p) => ({ ...p, zodiacSign: v }))
                }
                onReligionChange={(v) =>
                  setFormData((p) => ({ ...p, religion: v }))
                }
                onLoveAnimalsChange={(v) =>
                  setFormData((p) => ({ ...p, loveAnimals: v }))
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
