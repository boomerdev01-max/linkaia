// src/app/api/preference/update/route.ts
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
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      // Step 1
      genderPreference,
      ageMin,
      ageMax,

      // Step 2
      heightMin,
      heightMax,
      weightMin,
      weightMax,
      skinTonePreference,

      // Step 3
      relationshipStatusPreference,
      sexualOrientationPreference,

      // Step 4
      selectedInterestIds,

      // Step 5
      educationLevelPreference,

      // Step 6
      countryOriginPreference,
      selectedNationalityIds,

      // Step 7
      countryResidencePreference,
      selectedCityIds,

      // Step 8
      smokerPreference,
      alcoholPreference,

      // Step 9
      hasChildrenPreference,
      wantsChildrenPreference,
      hasPetsPreference,

      // Step 10
      personalityTypePreference,

      // Step 11
      zodiacSignPreference,
      religionPreference,
      loveAnimalsPreference,

      // Completion flag
      isTerminated,
    } = body;

    // Prepare update data
    const updateData: any = {};

    if (genderPreference !== undefined)
      updateData.genderPreference = genderPreference;
    if (ageMin !== undefined) updateData.ageMin = ageMin;
    if (ageMax !== undefined) updateData.ageMax = ageMax;
    if (heightMin !== undefined) updateData.heightMin = heightMin;
    if (heightMax !== undefined) updateData.heightMax = heightMax;
    if (weightMin !== undefined) updateData.weightMin = weightMin;
    if (weightMax !== undefined) updateData.weightMax = weightMax;
    if (skinTonePreference !== undefined)
      updateData.skinTonePreference = skinTonePreference;
    if (relationshipStatusPreference !== undefined)
      updateData.relationshipStatusPreference = relationshipStatusPreference;
    if (sexualOrientationPreference !== undefined)
      updateData.sexualOrientationPreference = sexualOrientationPreference;
    if (educationLevelPreference !== undefined)
      updateData.educationLevelPreference = educationLevelPreference;
    if (countryOriginPreference !== undefined)
      updateData.countryOriginPreference = countryOriginPreference;
    if (countryResidencePreference !== undefined)
      updateData.countryResidencePreference = countryResidencePreference;
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
    if (personalityTypePreference !== undefined)
      updateData.personalityTypePreference = personalityTypePreference;
    if (zodiacSignPreference !== undefined)
      updateData.zodiacSignPreference = zodiacSignPreference;
    if (religionPreference !== undefined)
      updateData.religionPreference = religionPreference;
    if (loveAnimalsPreference !== undefined)
      updateData.loveAnimalsPreference = loveAnimalsPreference;

    // Update preference
    await prisma.preference.update({
      where: { id: user.preference.id },
      data: updateData,
    });

    const preferenceId = user.preference.id;

    // Handle interests
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

    // Handle nationalities
    if (
      selectedNationalityIds !== undefined &&
      Array.isArray(selectedNationalityIds)
    ) {
      await prisma.preferenceNationality.deleteMany({
        where: { preferenceId },
      });

      if (selectedNationalityIds.length > 0) {
        await prisma.preferenceNationality.createMany({
          data: selectedNationalityIds.map((nationalityId) => ({
            preferenceId,
            nationalityId,
          })),
        });
      }
    }

    // Handle cities
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

    // Calculate if preference is completed
    const hasAtLeastOneField = checkPreferenceCompletion(updateData);

    // Update user flags
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isPreferenceCompleted: hasAtLeastOneField,
        isPreferenceTerminated: isTerminated === true,
      },
    });

    // Fetch updated preference
    const finalPreference = await prisma.preference.findUnique({
      where: { id: user.preference.id },
      include: {
        selectedInterests: {
          include: {
            interest: {
              include: {
                category: true,
              },
            },
          },
        },
        selectedNationalities: {
          include: {
            nationality: true,
          },
        },
        selectedCities: {
          include: {
            city: true,
          },
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
      { status: 500 }
    );
  }
}

function checkPreferenceCompletion(preference: any): boolean {
  const fieldsToCheck = [
    preference.genderPreference,
    preference.ageMin,
    preference.ageMax,
    preference.heightMin,
    preference.heightMax,
    preference.weightMin,
    preference.weightMax,
    preference.skinTonePreference,
    preference.relationshipStatusPreference,
    preference.sexualOrientationPreference,
    preference.educationLevelPreference,
    preference.countryOriginPreference,
    preference.countryResidencePreference,
    preference.smokerPreference,
    preference.alcoholPreference,
    preference.hasChildrenPreference,
    preference.wantsChildrenPreference,
    preference.hasPetsPreference,
    preference.personalityTypePreference,
    preference.zodiacSignPreference,
    preference.religionPreference,
    preference.loveAnimalsPreference,
  ];

  return fieldsToCheck.some(
    (field) => field !== null && field !== undefined && field !== ""
  );
}
