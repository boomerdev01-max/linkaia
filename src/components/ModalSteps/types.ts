// Types for Profile Modal Steps
export interface Option {
  id: string;
  label: string;
}

export interface Interest {
  id: string;
  name: string;
  emoji: string;
  categoryId: string;
}

export interface InterestCategory {
  id: string;
  name: string;
  emoji: string;
  order: number;
  interests: Interest[];
}

export interface Nationality {
  id: string;
  code: string;
  nameFr: string;
  nameEn: string;
  flag: string;
}

export interface City {
  id: string;
  name: string;
  countryCode: string;
  countryName: string;
  displayName: string;
}

export interface ProfileFormData {
  // Step 1: Identité
  pseudo: string;
  birthdate: Date | null;
  gender: string;

  // Step 2: Photo
  profilePhotoUrl: string | null;

  // Step 3: Orientation & Situation
  sexualOrientation: string;
  relationshipStatus: string;

  // Step 4: Centres d'intérêt
  selectedInterestIds: string[];

  // Step 5: Biographie
  bio: string;

  // Step 6: Apparence
  height: number;
  weight: number;
  skinTone: string;

  // Step 7: Études
  educationLevel: string;
  studyPlace: string;

  // Step 8: Travail
  jobTitle: string;
  companyName: string;

  // Step 9: Origines
  countryOrigin: string; // ✅ Ajouté
  selectedNationalityIds: string[];

  // Step 10: Résidence
  countryResidence: string; // ✅ Ajouté
  location: string;

  // Step 11: Habitudes
  smoker: string;
  alcohol: string;

  // Step 12: Projet familial & Personnalité
  hasChildren: string;
  wantsChildren: string;
  hasPets: string;
  personalityType: string;

  // Step 13: Convictions
  zodiacSign: string;
  religion: string;
  loveAnimals: string; // ✅ Déjà présent
}

export interface ReferenceData {
  interestCategories: InterestCategory[];
  cities: City[];
  nationalities: Nationality[];
}
