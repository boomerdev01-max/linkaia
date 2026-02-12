import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/profile/update
 *
 * Met à jour le profil de l'utilisateur
 * Gère aussi les flags isProfileCompleted et isProfileTerminated
 */
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      include: {
        profil: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.profil) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const {
      // Step 1: Identité
      pseudo,
      birthdate,
      gender,

      // Step 2: Photo (handled separately)

      // Step 3: Orientation & Situation
      sexualOrientation,
      relationshipStatus,

      // Step 4: Centres d'intérêt (handled separately)
      interestIds,

      // Step 5: Biographie
      bio,

      // Step 6: Apparence
      height,
      weight,
      skinTone,

      // Step 7: Études
      educationLevel,
      studyPlace,

      // Step 8: Travail
      jobTitle,
      companyName,

      // Step 9: Origines
      countryOrigin,
      nationalityIds, // Array of nationality IDs (max 2)

      // Step 10: Résidence
      countryResidence,
      location,

      // Step 11: Habitudes
      smoker,
      alcohol,

      // Step 12: Projet familial & Personnalité
      hasChildren,
      wantsChildren,
      hasPets,
      personalityType,

      // Step 13: Convictions
      zodiacSign,
      religion,
      loveAnimals,

      // Completion flag
      isTerminated, // true if user completed all steps
    } = body;

    // Prepare update data
    const updateData: any = {};

    // Only update fields that are provided
    if (pseudo !== undefined) updateData.pseudo = pseudo;
    if (birthdate !== undefined)
      updateData.birthdate = birthdate ? new Date(birthdate) : null;
    if (gender !== undefined) updateData.gender = gender;
    if (sexualOrientation !== undefined)
      updateData.sexualOrientation = sexualOrientation;
    if (relationshipStatus !== undefined)
      updateData.relationshipStatus = relationshipStatus;
    if (bio !== undefined) updateData.bio = bio;
    if (height !== undefined) updateData.height = height;
    if (weight !== undefined) updateData.weight = weight;
    if (skinTone !== undefined) updateData.skinTone = skinTone;
    if (educationLevel !== undefined)
      updateData.educationLevel = educationLevel;
    if (studyPlace !== undefined) updateData.studyPlace = studyPlace;
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (countryOrigin !== undefined) updateData.countryOrigin = countryOrigin;
    if (countryResidence !== undefined)
      updateData.countryResidence = countryResidence;
    if (location !== undefined) updateData.location = location;
    if (smoker !== undefined) updateData.smoker = smoker;
    if (alcohol !== undefined) updateData.alcohol = alcohol;
    if (hasChildren !== undefined) updateData.hasChildren = hasChildren;
    if (wantsChildren !== undefined) updateData.wantsChildren = wantsChildren;
    if (hasPets !== undefined) updateData.hasPets = hasPets;
    if (personalityType !== undefined)
      updateData.personalityType = personalityType;
    if (zodiacSign !== undefined) updateData.zodiacSign = zodiacSign;
    if (religion !== undefined) updateData.religion = religion;
    if (loveAnimals !== undefined) updateData.loveAnimals = loveAnimals;

    // Update profile
    const updatedProfile = await prisma.profil.update({
      where: { id: user.profil.id },
      data: updateData,
      include: {
        interests: {
          include: {
            interest: {
              include: {
                category: true,
              },
            },
          },
        },
        nationalites: {
          include: {
            nationality: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    // Get profile ID after confirming it exists
    const profilId = user.profil.id;

    // Handle interests (many-to-many)
    if (interestIds !== undefined && Array.isArray(interestIds)) {
      // Max 10 interests
      const limitedInterests = interestIds.slice(0, 10);

      // Delete all existing interests
      await prisma.profilInterest.deleteMany({
        where: { profilId },
      });

      // Create new interests
      if (limitedInterests.length > 0) {
        await prisma.profilInterest.createMany({
          data: limitedInterests.map((interestId) => ({
            profilId,
            interestId,
          })),
        });
      }
    }

    // Handle nationalities (many-to-many, max 2)
    if (nationalityIds !== undefined && Array.isArray(nationalityIds)) {
      // Max 2 nationalities
      const limitedNationalities = nationalityIds.slice(0, 2);

      // Delete all existing nationalities
      await prisma.profilNationalite.deleteMany({
        where: { profilId },
      });

      // Create new nationalities
      if (limitedNationalities.length > 0) {
        await prisma.profilNationalite.createMany({
          data: limitedNationalities.map((nationalityId, index) => ({
            profilId,
            nationalityId,
            order: index + 1,
          })),
        });
      }
    }

    // Calculate if profile is completed (at least 1 field filled that's not PREFER_NOT_TO_SAY)
    const hasAtLeastOneValidField = checkProfileCompletion(updatedProfile);

    // Update user flags
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isProfileCompleted: hasAtLeastOneValidField,
        isProfileTerminated: isTerminated === true,
      },
    });

    // Fetch updated profile with all relations
    const finalProfile = await prisma.profil.findUnique({
      where: { id: user.profil.id },
      include: {
        interests: {
          include: {
            interest: {
              include: {
                category: true,
              },
            },
          },
        },
        nationalites: {
          include: {
            nationality: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    return NextResponse.json({
      profile: finalProfile,
      user: {
        isProfileCompleted: updatedUser.isProfileCompleted,
        isProfileTerminated: updatedUser.isProfileTerminated,
        skipProfileSetup: updatedUser.skipProfileSetup,
      },
    });
  } catch (error) {
    console.error("❌ Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

/**
 * Check if profile has at least one valid field filled
 * (excludes PREFER_NOT_TO_SAY and required fields like pseudo, birthdate, gender)
 *
 * ✅ CORRECTION : Ajoute country_origin, country_residence et love_animals
 */
function checkProfileCompletion(profile: any): boolean {
  const fieldsToCheck = [
    profile.sexualOrientation,
    profile.relationshipStatus,
    profile.bio,
    profile.height,
    profile.weight,
    profile.skinTone,
    profile.educationLevel,
    profile.studyPlace,
    profile.jobTitle,
    profile.companyName,
    profile.countryOrigin, // ✅ Ajouté
    profile.countryResidence, // ✅ Ajouté
    profile.location,
    profile.smoker,
    profile.alcohol,
    profile.hasChildren,
    profile.wantsChildren,
    profile.hasPets,
    profile.personalityType,
    profile.zodiacSign,
    profile.religion,
    profile.loveAnimals, 
  ];

  // Check if at least one field is filled and NOT "PREFER_NOT_TO_SAY"
  return fieldsToCheck.some(
    (field) => field !== null && field !== "PREFER_NOT_TO_SAY" && field !== ""
  );
}
