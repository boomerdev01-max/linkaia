// src/components/PreferenceModal/types.ts

export interface PreferenceFormData {
  // === GENRE & ÂGE (Step 1) ===
  selectedGenderCodes: string[]; // ✅ NOUVEAU : multi-choix ["man", "woman", "non-binary"]
  ageMin: number;
  ageMax: number;

  // === APPARENCE (Step 2) ===
  heightMin: number;
  heightMax: number;
  weightMin: number;
  weightMax: number;
  selectedSkinToneIds: string[]; // ✅ NOUVEAU : multi-choix

  // === STATUT & ORIENTATION (Step 3) ===
  selectedRelationshipStatusIds: string[]; // ✅ NOUVEAU : multi-choix
  selectedSexualOrientationIds: string[]; // ✅ NOUVEAU : multi-choix

  // === CENTRES D'INTÉRÊT (Step 4) ===
  selectedInterestIds: string[];

  // === ÉDUCATION (Step 5) ===
  selectedEducationLevelIds: string[]; // ✅ NOUVEAU : multi-choix

  // === ORIGINES (Step 6) ===
  selectedNationalityCodes: string[]; // ✅ FIXÉ : utilise countryCode au lieu de ID

  // === RÉSIDENCE (Step 7) ===
  selectedResidenceCountryCodes: string[]; // ✅ FIXÉ : utilise countryCode
  selectedCityIds: string[];

  // === HABITUDES (Step 8) ===
  smokerPreference: string;
  alcoholPreference: string;

  // === PROJET FAMILIAL (Step 9) ===
  hasChildrenPreference: string;
  wantsChildrenPreference: string;
  hasPetsPreference: string;

  // === PERSONNALITÉ (Step 10) ===
  selectedPersonalityTypeIds: string[]; // ✅ NOUVEAU : multi-choix

  // === CONVICTIONS (Step 11) ===
  selectedZodiacSignIds: string[]; // ✅ NOUVEAU : multi-choix
  selectedReligionIds: string[]; // ✅ NOUVEAU : multi-choix
  loveAnimalsPreference: string;
}

// ============================================
// TYPES POUR LES DONNÉES DE RÉFÉRENCE
// ============================================

export interface ReferenceData {
  religions: Religion[];
  zodiacSigns: ZodiacSign[];
  sexualOrientations: SexualOrientation[];
  relationshipStatuses: RelationshipStatus[];
  skinTones: SkinTone[];
  personalityTypes: PersonalityType[];
  educationLevels: EducationLevel[];
  interestCategories: InterestCategory[];
  cities: City[];
  nationalities: Nationality[];
}

export interface Religion {
  id: string;
  code: string;
  label: string;
  emoji: string;
  order: number;
}

export interface ZodiacSign {
  id: string;
  code: string;
  label: string;
  emoji: string;
  order: number;
}

export interface SexualOrientation {
  id: string;
  code: string;
  label: string;
  emoji: string;
  order: number;
}

export interface RelationshipStatus {
  id: string;
  code: string;
  label: string;
  emoji: string;
  order: number;
}

export interface SkinTone {
  id: string;
  code: string;
  label: string;
  emoji: string;
  order: number;
}

export interface PersonalityType {
  id: string;
  code: string;
  label: string;
  emoji: string;
  order: number;
}

export interface EducationLevel {
  id: string;
  code: string;
  label: string;
  emoji: string;
  order: number;
}

export interface InterestCategory {
  id: string;
  name: string;
  emoji: string;
  interests: Interest[];
}

export interface Interest {
  id: string;
  name: string;
  emoji: string;
}

export interface City {
  id: string;
  name: string;
  stateCode: string;
  stateName: string;
  countryCode: string;
  countryName: string;
  displayName: string;
  latitude: number | null;
  longitude: number | null;
}

export interface Nationality {
  id: string;
  code: string; // ✅ Code ISO (ex: "FR")
  nameFr: string;
  nameEn: string;
  flag: string;
}

// ============================================
// GENRE OPTIONS (hardcodé car simple)
// ============================================
export const GENDER_OPTIONS = [
  { code: "man", label: "Homme", emoji: "👨" },
  { code: "woman", label: "Femme", emoji: "👩" },
  { code: "non-binary", label: "Non-binaire", emoji: "🧑" },
];

// ============================================
// OPTIONS POUR HABITS (Step 8)
// ============================================

export const SMOKER_OPTIONS = [
  { id: "non_smoker", label: "Non fumeur" },
  { id: "occasional", label: "Fumeur occasionnel" },
  { id: "regular_smoker", label: "Fumeur régulier" },
  { id: "no_preference", label: "Peu importe" },
];

export const ALCOHOL_OPTIONS = [
  { id: "non_drinker", label: "Ne boit pas" },
  { id: "occasional", label: "Boit occasionnellement" },
  { id: "social_drinker", label: "Boit en société" },
  { id: "regular_drinker", label: "Boit régulièrement" },
  { id: "no_preference", label: "Peu importe" },
];

// ============================================
// OPTIONS POUR PROJET FAMILIAL & ANIMAUX (Step 9)
// ============================================

export const HAS_CHILDREN_OPTIONS = [
  { id: "has_children", label: "A des enfants" },
  { id: "no_children", label: "N'a pas d'enfants" },
  { id: "no_preference", label: "Peu importe" },
];

export const WANTS_CHILDREN_OPTIONS = [
  { id: "wants_children", label: "Veut des enfants" },
  { id: "does_not_want", label: "Ne veut pas d'enfants" },
  { id: "maybe_open", label: "Ouvert·e à discussion" },
  { id: "no_preference", label: "Peu importe" },
];

export const HAS_PETS_OPTIONS = [
  { id: "has_pets", label: "A des animaux" },
  { id: "no_pets", label: "N'a pas d'animaux" },
  { id: "no_preference", label: "Peu importe" },
];

// ============================================
// OPTIONS POUR AMOUR DES ANIMAUX
// ============================================

export const LOVE_ANIMALS_OPTIONS = [
  { id: "loves_animals", label: "Adore les animaux" },
  { id: "likes_animals", label: "Aime bien les animaux" },
  { id: "neutral", label: "Neutre" },
  { id: "dislikes_animals", label: "N'aime pas les animaux" },
  { id: "no_preference", label: "Peu importe" },
];
