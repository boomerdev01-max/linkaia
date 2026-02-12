// src/app/api/preference/update/route.ts - VERSION COMPLÈTE CORRIGÉE

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      include: { preference: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.preference) {
      return NextResponse.json(
        { error: "Preference not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const {
      // Step 1: Genre & Âge
      selectedGenderCodes,
      ageMin,
      ageMax,

      // Step 2: Apparence
      heightMin,
      heightMax,
      weightMin,
      weightMax,
      selectedSkinToneIds,

      // Step 3: Statut & Orientation
      selectedRelationshipStatusIds,
      selectedSexualOrientationIds,

      // Step 4: Centres d'intérêt
      selectedInterestIds,

      // Step 5: Éducation
      selectedEducationLevelIds,

      // Step 6: Origines
      selectedNationalityCodes, // ✅ FIXÉ : utilise countryCode

      // Step 7: Résidence
      selectedResidenceCountryCodes, // ✅ FIXÉ
      selectedCityIds,

      // Step 8: Habitudes
      smokerPreference,
      alcoholPreference,

      // Step 9: Projet familial
      hasChildrenPreference,
      wantsChildrenPreference,
      hasPetsPreference,

      // Step 10: Personnalité
      selectedPersonalityTypeIds,

      // Step 11: Convictions
      selectedZodiacSignIds,
      selectedReligionIds,
      loveAnimalsPreference,

      // Completion flag
      isTerminated,
    } = body;

    const preferenceId = user.preference.id;

    // ============================================
    // MISE À JOUR DES CHAMPS SIMPLES
    // ============================================
    const updateData: any = {};

    if (ageMin !== undefined) updateData.ageMin = ageMin;
    if (ageMax !== undefined) updateData.ageMax = ageMax;
    if (heightMin !== undefined) updateData.heightMin = heightMin;
    if (heightMax !== undefined) updateData.heightMax = heightMax;
    if (weightMin !== undefined) updateData.weightMin = weightMin;
    if (weightMax !== undefined) updateData.weightMax = weightMax;
    if (smokerPreference !== undefined)
      updateData.smokerPreference = smokerPreference;
    if (alcoholPreference !== undefined)
      updateData.alcoholPreference = alcoholPreference;
    if (hasChildrenPreference !== undefined)
      updateData.hasChildrenPreference = hasChildrenPreference;
    if (wantsChildrenPreference !== undefined)
      updateData.wantsChildrenPreference = wantsChildrenPreference;
    if (hasPetsPreference !== undefined)
      updateData.hasPetsPreference = hasPetsPreference;
    if (loveAnimalsPreference !== undefined)
      updateData.loveAnimalsPreference = loveAnimalsPreference;

    // Update simple fields
    await prisma.preference.update({
      where: { id: preferenceId },
      data: updateData,
    });
    // ============================================
    // GESTION DES RELATIONS MANY-TO-MANY
    // ============================================

    // 1️⃣ GENRES (hardcodé - pas de table de référence)
    if (
      selectedGenderCodes !== undefined &&
      Array.isArray(selectedGenderCodes)
    ) {
      await prisma.preferenceGender.deleteMany({
        where: { preferenceId },
      });

      if (selectedGenderCodes.length > 0) {
        await prisma.preferenceGender.createMany({
          data: selectedGenderCodes.map((code) => ({
            preferenceId,
            genderCode: code,
          })),
        });
      }
    }

    // 2️⃣ TEINTS DE PEAU
    if (
      selectedSkinToneIds !== undefined &&
      Array.isArray(selectedSkinToneIds)
    ) {
      await prisma.preferenceSkinTone.deleteMany({
        where: { preferenceId },
      });

      if (selectedSkinToneIds.length > 0) {
        await prisma.preferenceSkinTone.createMany({
          data: selectedSkinToneIds.map((skinToneId) => ({
            preferenceId,
            skinToneId,
          })),
        });
      }
    }

    // 3️⃣ STATUTS RELATIONNELS
    if (
      selectedRelationshipStatusIds !== undefined &&
      Array.isArray(selectedRelationshipStatusIds)
    ) {
      await prisma.preferenceRelationshipStatus.deleteMany({
        where: { preferenceId },
      });

      if (selectedRelationshipStatusIds.length > 0) {
        await prisma.preferenceRelationshipStatus.createMany({
          data: selectedRelationshipStatusIds.map((statusId) => ({
            preferenceId,
            relationshipStatusId: statusId,
          })),
        });
      }
    }

    // 4️⃣ ORIENTATIONS SEXUELLES
    if (
      selectedSexualOrientationIds !== undefined &&
      Array.isArray(selectedSexualOrientationIds)
    ) {
      await prisma.preferenceSexualOrientation.deleteMany({
        where: { preferenceId },
      });

      if (selectedSexualOrientationIds.length > 0) {
        await prisma.preferenceSexualOrientation.createMany({
          data: selectedSexualOrientationIds.map((orientationId) => ({
            preferenceId,
            sexualOrientationId: orientationId,
          })),
        });
      }
    }

    // 5️⃣ CENTRES D'INTÉRÊT
    if (
      selectedInterestIds !== undefined &&
      Array.isArray(selectedInterestIds)
    ) {
      await prisma.preferenceInterest.deleteMany({
        where: { preferenceId },
      });

      if (selectedInterestIds.length > 0) {
        await prisma.preferenceInterest.createMany({
          data: selectedInterestIds.slice(0, 10).map((interestId) => ({
            preferenceId,
            interestId,
          })),
        });
      }
    }

    // 6️⃣ NIVEAUX D'ÉDUCATION
    if (
      selectedEducationLevelIds !== undefined &&
      Array.isArray(selectedEducationLevelIds)
    ) {
      await prisma.preferenceEducationLevel.deleteMany({
        where: { preferenceId },
      });

      if (selectedEducationLevelIds.length > 0) {
        await prisma.preferenceEducationLevel.createMany({
          data: selectedEducationLevelIds.map((levelId) => ({
            preferenceId,
            educationLevelId: levelId,
          })),
        });
      }
    }

    // 7️⃣ NATIONALITÉS (ORIGINES) - ✅ FIXÉ : utilise countryCode
    if (
      selectedNationalityCodes !== undefined &&
      Array.isArray(selectedNationalityCodes)
    ) {
      await prisma.preferenceNationality.deleteMany({
        where: { preferenceId },
      });

      if (selectedNationalityCodes.length > 0) {
        await prisma.preferenceNationality.createMany({
          data: selectedNationalityCodes.map((countryCode) => ({
            preferenceId,
            countryCode, // ✅ Utilise countryCode (ex: "FR") au lieu de nationalityId
          })),
        });
      }
    }

    // 8️⃣ PAYS DE RÉSIDENCE - ✅ FIXÉ : utilise countryCode
    if (
      selectedResidenceCountryCodes !== undefined &&
      Array.isArray(selectedResidenceCountryCodes)
    ) {
      await prisma.preferenceResidenceCountry.deleteMany({
        where: { preferenceId },
      });

      if (selectedResidenceCountryCodes.length > 0) {
        await prisma.preferenceResidenceCountry.createMany({
          data: selectedResidenceCountryCodes.map((countryCode) => ({
            preferenceId,
            countryCode, // ✅ Utilise countryCode
          })),
        });
      }
    }

    // 9️⃣ VILLES DE RÉSIDENCE
    if (selectedCityIds !== undefined && Array.isArray(selectedCityIds)) {
      await prisma.preferenceCity.deleteMany({
        where: { preferenceId },
      });

      if (selectedCityIds.length > 0) {
        await prisma.preferenceCity.createMany({
          data: selectedCityIds.map((cityId) => ({
            preferenceId,
            cityId,
          })),
        });
      }
    }

    // 🔟 TYPES DE PERSONNALITÉ
    if (
      selectedPersonalityTypeIds !== undefined &&
      Array.isArray(selectedPersonalityTypeIds)
    ) {
      await prisma.preferencePersonalityType.deleteMany({
        where: { preferenceId },
      });

      if (selectedPersonalityTypeIds.length > 0) {
        await prisma.preferencePersonalityType.createMany({
          data: selectedPersonalityTypeIds.map((typeId) => ({
            preferenceId,
            personalityTypeId: typeId,
          })),
        });
      }
    }

    // 1️⃣1️⃣ SIGNES ASTROLOGIQUES
    if (
      selectedZodiacSignIds !== undefined &&
      Array.isArray(selectedZodiacSignIds)
    ) {
      await prisma.preferenceZodiacSign.deleteMany({
        where: { preferenceId },
      });

      if (selectedZodiacSignIds.length > 0) {
        await prisma.preferenceZodiacSign.createMany({
          data: selectedZodiacSignIds.map((signId) => ({
            preferenceId,
            zodiacSignId: signId,
          })),
        });
      }
    }

    // 1️⃣2️⃣ RELIGIONS
    if (
      selectedReligionIds !== undefined &&
      Array.isArray(selectedReligionIds)
    ) {
      await prisma.preferenceReligion.deleteMany({
        where: { preferenceId },
      });

      if (selectedReligionIds.length > 0) {
        await prisma.preferenceReligion.createMany({
          data: selectedReligionIds.map((religionId) => ({
            preferenceId,
            religionId,
          })),
        });
      }
    }

    // ============================================
    // VÉRIFICATION DE COMPLÉTION - ✅ NOUVELLE LOGIQUE
    // ============================================
    const hasAtLeastOneSelection =
      await checkPreferenceCompletion(preferenceId);

    // Update user flags
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isPreferenceCompleted: hasAtLeastOneSelection,
        isPreferenceTerminated: isTerminated === true,
      },
    });

    // Fetch updated preference avec toutes les relations
    const finalPreference = await prisma.preference.findUnique({
      where: { id: preferenceId },
      include: {
        selectedGenders: true,
        selectedSkinTones: {
          include: { skinTone: true },
        },
        selectedRelationshipStatuses: {
          include: { relationshipStatus: true },
        },
        selectedSexualOrientations: {
          include: { sexualOrientation: true },
        },
        selectedInterests: {
          include: {
            interest: {
              include: {
                category: true,
              },
            },
          },
        },
        selectedEducationLevels: {
          include: { educationLevel: true },
        },
        selectedNationalities: {
          include: {
            country: true,
          },
        },
        selectedResidenceCountries: {
          include: {
            country: true,
          },
        },
        selectedCities: {
          include: {
            city: true,
          },
        },
        selectedPersonalityTypes: {
          include: { personalityType: true },
        },
        selectedZodiacSigns: {
          include: { zodiacSign: true },
        },
        selectedReligions: {
          include: { religion: true },
        },
      },
    });

    return NextResponse.json({
      preference: finalPreference,
      user: {
        isPreferenceCompleted: updatedUser.isPreferenceCompleted,
        isPreferenceTerminated: updatedUser.isPreferenceTerminated,
        skipPreferenceSetup: updatedUser.skipPreferenceSetup,
      },
    });
  } catch (error) {
    console.error("❌ Error updating preference:", error);
    return NextResponse.json(
      { error: "Failed to update preference" },
      { status: 500 },
    );
  }
}

// ============================================
// FONCTION DE VÉRIFICATION DE COMPLÉTION - ✅ REFAITE
// ============================================
async function checkPreferenceCompletion(
  preferenceId: string,
): Promise<boolean> {
  try {
    // Récupérer la préférence avec toutes ses relations
    const preference = await prisma.preference.findUnique({
      where: { id: preferenceId },
      include: {
        selectedGenders: true,
        selectedSkinTones: true,
        selectedRelationshipStatuses: true,
        selectedSexualOrientations: true,
        selectedInterests: true,
        selectedEducationLevels: true,
        selectedNationalities: true,
        selectedResidenceCountries: true,
        selectedCities: true,
        selectedPersonalityTypes: true,
        selectedZodiacSigns: true,
        selectedReligions: true,
      },
    });

    if (!preference) return false;

    // ✅ LA PRÉFÉRENCE EST COMPLÈTE SI :
    // Au moins UN champ simple est rempli OU
    // Au moins UNE sélection multiple a été faite

    const hasSimpleField =
      preference.ageMin !== null ||
      preference.ageMax !== null ||
      preference.heightMin !== null ||
      preference.heightMax !== null ||
      preference.weightMin !== null ||
      preference.weightMax !== null ||
      preference.smokerPreference !== null ||
      preference.alcoholPreference !== null ||
      preference.hasChildrenPreference !== null ||
      preference.wantsChildrenPreference !== null ||
      preference.hasPetsPreference !== null ||
      preference.loveAnimalsPreference !== null;

    const hasMultiSelection =
      preference.selectedGenders.length > 0 ||
      preference.selectedSkinTones.length > 0 ||
      preference.selectedRelationshipStatuses.length > 0 ||
      preference.selectedSexualOrientations.length > 0 ||
      preference.selectedInterests.length > 0 ||
      preference.selectedEducationLevels.length > 0 ||
      preference.selectedNationalities.length > 0 ||
      preference.selectedResidenceCountries.length > 0 ||
      preference.selectedCities.length > 0 ||
      preference.selectedPersonalityTypes.length > 0 ||
      preference.selectedZodiacSigns.length > 0 ||
      preference.selectedReligions.length > 0;

    return hasSimpleField || hasMultiSelection;
  } catch (error) {
    console.error("❌ Error checking preference completion:", error);
    return false;
  }
}
