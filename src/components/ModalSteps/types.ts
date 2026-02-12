// src/components/ModalSteps/types.ts
// ✨ TYPES OPTIMISÉS avec country-state-city

export interface Interest {
  id: string;
  name: string;
  emoji: string;
}

export interface InterestCategory {
  id: string;
  name: string;
  emoji: string;
  interests: Interest[];
}

// ✨ NOUVELLE STRUCTURE : Nationality avec code ISO
export interface Nationality {
  id: string;
  code: string; // ISO 3166-1 alpha-2 (ex: "FR", "US", "BJ")
  nameFr: string; // Nom en français
  nameEn: string; // Nom en anglais
  flag: string; // Emoji drapeau
}

// ✨ NOUVELLE STRUCTURE : City avec stateCode et stateName
export interface City {
  id: string;
  name: string; // Nom de la ville (ex: "Paris")
  stateCode: string; // Code ISO de l'état (ex: "IDF" pour Île-de-France)
  stateName: string; // Nom complet de l'état (ex: "Île-de-France")
  countryCode: string; // Code ISO du pays (ex: "FR")
  countryName: string; // Nom complet du pays (ex: "France")
  displayName: string; // Format: "Paris, Île-de-France, France"
  latitude: number | null; // Coordonnées GPS
  longitude: number | null;
}

// Options pour les formulaires (restent inchangés)
export interface Option {
  id: string;
  label: string;
  emoji?: string;
}

// ============================================
// FORM DATA TYPES
// ============================================

export interface ProfileFormData {
  // Step 1 - Identity
  pseudo: string;
  birthdate: Date | null;
  gender: string;

  // Step 2 - Photo
  profilePhotoUrl: string | null;

  // Step 3 - Orientation & Relationship
  sexualOrientation: string;
  relationshipStatus: string;

  // Step 4 - Interests
  selectedInterestIds: string[];

  // Step 5 - Bio
  bio: string;

  // Step 6 - Appearance
  height: number;
  weight: number;
  skinTone: string;

  // Step 7 - Education
  educationLevel: string;
  studyPlace: string;

  // Step 8 - Work
  jobTitle: string;
  companyName: string;

  // Step 9 - Origins (✨ MISE À JOUR)
  countryOriginCode: string | null;
  selectedNationalityCodes: string[];

  // Step 10 - Residence (✨ MISE À JOUR)
  countryResidenceCode: string | null;
  cityId: string | null;

  // Step 11 - Habits
  smoker: string;
  alcohol: string;

  // Step 12 - Family & Personality
  hasChildren: string;
  wantsChildren: string;
  hasPets: string;
  personalityType: string;

  // Step 13 - Convictions
  zodiacSign: string;
  religion: string;
  loveAnimals: string;
}

export interface ReferenceData {
  interestCategories: InterestCategory[];
  nationalities: Nationality[];
  cities: City[];
}

// ============================================
// OPTIONS COMMUNES (INCHANGÉES)
// ============================================

export const GENDER_OPTIONS: Option[] = [
  { id: "man", label: "Homme" },
  { id: "woman", label: "Femme" },
  { id: "non-binary", label: "Non-binaire" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

export const SKIN_TONE_OPTIONS: Option[] = [
  { id: "very-light", label: "Peau très claire" },
  { id: "light", label: "Peau claire" },
  { id: "medium", label: "Peau médium" },
  { id: "tanned", label: "Peau bronzée" },
  { id: "brown", label: "Peau brune" },
  { id: "dark", label: "Peau noire" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

export const RELATIONSHIP_STATUS_OPTIONS: Option[] = [
  { id: "single", label: "Célibataire" },
  { id: "couple", label: "En couple" },
  { id: "complicated", label: "C'est compliqué" },
  { id: "open", label: "En relation libre" },
  { id: "married", label: "Marié(e)" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

export const SEXUAL_ORIENTATION_OPTIONS: Option[] = [
  { id: "hetero", label: "Hétérosexuel(le)" },
  { id: "homo", label: "Homosexuel(le)" },
  { id: "bi", label: "Bisexuel(le)" },
  { id: "pan", label: "Pansexuel(le)" },
  { id: "asexual", label: "Asexuel(le)" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

export const EDUCATION_LEVEL_OPTIONS: Option[] = [
  { id: "high-school", label: "Lycée" },
  { id: "bachelor", label: "Licence / Bachelor" },
  { id: "master", label: "Master" },
  { id: "doctorate", label: "Doctorat" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

export const SMOKER_OPTIONS: Option[] = [
  { id: "never", label: "Jamais" },
  { id: "sometimes", label: "Parfois" },
  { id: "regularly", label: "Régulièrement" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

export const ALCOHOL_OPTIONS: Option[] = [
  { id: "never", label: "Jamais" },
  { id: "socially", label: "Occasionnel" },
  { id: "regularly", label: "Régulièrement" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

export const HAS_CHILDREN_OPTIONS: Option[] = [
  { id: "yes", label: "Oui" },
  { id: "no", label: "Non" },
  { id: "soon", label: "Bientôt" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

export const WANTS_CHILDREN_OPTIONS: Option[] = [
  { id: "yes", label: "Oui" },
  { id: "no", label: "Non" },
  { id: "maybe", label: "Peut-être" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

export const HAS_PETS_OPTIONS: Option[] = [
  { id: "yes", label: "Oui" },
  { id: "no", label: "Non" },
  { id: "want-one", label: "J'en veux un" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

export const PERSONALITY_OPTIONS: Option[] = [
  { id: "introvert", label: "Introverti(e)" },
  { id: "extrovert", label: "Extraverti(e)" },
  { id: "ambivert", label: "Ambivert(e)" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

export const ZODIAC_OPTIONS: Option[] = [
  { id: "aries", label: "♈ Bélier" },
  { id: "taurus", label: "♉ Taureau" },
  { id: "gemini", label: "♊ Gémeaux" },
  { id: "cancer", label: "♋ Cancer" },
  { id: "leo", label: "♌ Lion" },
  { id: "virgo", label: "♍ Vierge" },
  { id: "libra", label: "♎ Balance" },
  { id: "scorpio", label: "♏ Scorpion" },
  { id: "sagittarius", label: "♐ Sagittaire" },
  { id: "capricorn", label: "♑ Capricorne" },
  { id: "aquarius", label: "♒ Verseau" },
  { id: "pisces", label: "♓ Poissons" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

export const RELIGION_OPTIONS: Option[] = [
  { id: "atheist", label: "Athée" },
  { id: "christian", label: "Chrétien(ne)" },
  { id: "muslim", label: "Musulman(e)" },
  { id: "jewish", label: "Juif/Juive" },
  { id: "buddhist", label: "Bouddhiste" },
  { id: "hindu", label: "Hindou(e)" },
  { id: "other", label: "Autre" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

export const LOVE_ANIMALS_OPTIONS: Option[] = [
  { id: "yes", label: "Oui" },
  { id: "no", label: "Non" },
  { id: "neutral", label: "Neutre" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];
