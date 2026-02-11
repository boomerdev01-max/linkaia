// src/components/PreferenceModal/types.ts

import {
  InterestCategory,
  Nationality,
  City,
} from "@/components/ModalSteps/types";

export interface PreferenceFormData {
  // Step 1: Genre & Âge
  genderPreference: string; // "man" | "woman" | "non-binary" | "both" | "any"
  ageMin: number;
  ageMax: number;

  // Step 2: Apparence
  heightMin: number;
  heightMax: number;
  weightMin: number;
  weightMax: number;
  skinTonePreference: string; // "very-light" | "light" | "medium" | "tanned" | "brown" | "dark" | "any"

  // Step 3: Statut & Orientation
  relationshipStatusPreference: string; // "single" | "couple" | "complicated" | "open" | "any"
  sexualOrientationPreference: string; // "hetero" | "homo" | "bi" | "pan" | "asexual" | "any"

  // Step 4: Centres d'intérêt
  selectedInterestIds: string[]; // Max 10 ou vide pour "any"

  // Step 5: Éducation
  educationLevelPreference: string; // "high-school" | "bachelor" | "master" | "doctorate" | "any"

  // Step 6: Origines
  countryOriginPreference: string; // "any" ou code pays
  selectedNationalityIds: string[];

  // Step 7: Résidence
  countryResidencePreference: string; // "any" ou code pays
  selectedCityIds: string[];

  // Step 8: Habitudes
  smokerPreference: string; // "never" | "sometimes" | "regularly" | "any"
  alcoholPreference: string; // "never" | "socially" | "regularly" | "any"

  // Step 9: Projet familial
  hasChildrenPreference: string; // "yes" | "no" | "soon" | "any"
  wantsChildrenPreference: string; // "yes" | "no" | "maybe" | "any"
  hasPetsPreference: string; // "yes" | "no" | "want-one" | "any"

  // Step 10: Personnalité
  personalityTypePreference: string; // "introvert" | "extrovert" | "ambivert" | "any"

  // Step 11: Convictions
  zodiacSignPreference: string; // "aries" | "taurus" | ... | "any"
  religionPreference: string; // "atheist" | "christian" | "muslim" | ... | "any"
  loveAnimalsPreference: string; // "yes" | "no" | "neutral" | "any"
}

export interface ReferenceData {
  interestCategories: InterestCategory[];
  cities: City[];
  nationalities: Nationality[];
}

export interface Option {
  id: string;
  label: string;
  emoji?: string;
}

// Options communes
export const GENDER_OPTIONS: Option[] = [
  { id: "man", label: "Homme" },
  { id: "woman", label: "Femme" },
  { id: "non-binary", label: "Non-binaire" },
  { id: "both", label: "Homme et Femme" },
  { id: "any", label: "Peu importe" },
];

export const SKIN_TONE_OPTIONS: Option[] = [
  { id: "very-light", label: "Peau très claire" },
  { id: "light", label: "Peau claire" },
  { id: "medium", label: "Peau médium" },
  { id: "tanned", label: "Peau bronzée" },
  { id: "brown", label: "Peau brune" },
  { id: "dark", label: "Peau noire" },
  { id: "any", label: "Peu importe" },
];

export const RELATIONSHIP_STATUS_OPTIONS: Option[] = [
  { id: "single", label: "Célibataire" },
  { id: "couple", label: "En couple" },
  { id: "complicated", label: "C'est compliqué" },
  { id: "open", label: "En relation libre" },
  { id: "any", label: "Peu importe" },
];

export const SEXUAL_ORIENTATION_OPTIONS: Option[] = [
  { id: "hetero", label: "Hétérosexuel(le)" },
  { id: "homo", label: "Homosexuel(le)" },
  { id: "bi", label: "Bisexuel(le)" },
  { id: "pan", label: "Pansexuel(le)" },
  { id: "asexual", label: "Asexuel(le)" },
  { id: "any", label: "Peu importe" },
];

export const EDUCATION_LEVEL_OPTIONS: Option[] = [
  { id: "high-school", label: "Lycée" },
  { id: "bachelor", label: "Licence / Bachelor" },
  { id: "master", label: "Master" },
  { id: "doctorate", label: "Doctorat" },
  { id: "any", label: "Peu importe" },
];

export const SMOKER_OPTIONS: Option[] = [
  { id: "never", label: "Jamais" },
  { id: "sometimes", label: "Parfois" },
  { id: "regularly", label: "Régulièrement" },
  { id: "any", label: "Peu importe" },
];

export const ALCOHOL_OPTIONS: Option[] = [
  { id: "never", label: "Jamais" },
  { id: "socially", label: "Occasionnel" },
  { id: "regularly", label: "Régulièrement" },
  { id: "any", label: "Peu importe" },
];

export const HAS_CHILDREN_OPTIONS: Option[] = [
  { id: "yes", label: "Oui" },
  { id: "no", label: "Non" },
  { id: "soon", label: "Bientôt" },
  { id: "any", label: "Peu importe" },
];

export const WANTS_CHILDREN_OPTIONS: Option[] = [
  { id: "yes", label: "Oui" },
  { id: "no", label: "Non" },
  { id: "maybe", label: "Peut-être" },
  { id: "any", label: "Peu importe" },
];

export const HAS_PETS_OPTIONS: Option[] = [
  { id: "yes", label: "Oui" },
  { id: "no", label: "Non" },
  { id: "want-one", label: "J'en veux un" },
  { id: "any", label: "Peu importe" },
];

export const PERSONALITY_OPTIONS: Option[] = [
  { id: "introvert", label: "Introverti(e)" },
  { id: "extrovert", label: "Extraverti(e)" },
  { id: "ambivert", label: "Ambivert(e)" },
  { id: "any", label: "Peu importe" },
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
  { id: "any", label: "Peu importe" },
];

export const RELIGION_OPTIONS: Option[] = [
  { id: "atheist", label: "Athée" },
  { id: "christian", label: "Chrétien(ne)" },
  { id: "muslim", label: "Musulman(e)" },
  { id: "jewish", label: "Juif/Juive" },
  { id: "buddhist", label: "Bouddhiste" },
  { id: "hindu", label: "Hindou(e)" },
  { id: "other", label: "Autre" },
  { id: "any", label: "Peu importe" },
];

export const LOVE_ANIMALS_OPTIONS: Option[] = [
  { id: "yes", label: "Oui" },
  { id: "no", label: "Non" },
  { id: "neutral", label: "Neutre" },
  { id: "any", label: "Peu importe" },
];
