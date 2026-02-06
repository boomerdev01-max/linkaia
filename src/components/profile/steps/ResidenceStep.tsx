import { Label } from "@/components/ui/label";
import { City, Nationality } from "@/components/ModalSteps/types";

interface ResidenceStepProps {
  countryResidence: string;
  location: string;
  cities: City[];
  nationalities: Nationality[];
  onCountryResidenceChange: (value: string) => void;
  onLocationChange: (value: string) => void;
}

export default function ResidenceStep({
  countryResidence,
  location,
  cities,
  nationalities,
  onCountryResidenceChange,
  onLocationChange,
}: ResidenceStepProps) {
  // Group cities by country
  const citiesByCountry = cities.reduce((acc, city) => {
    if (!acc[city.countryName]) {
      acc[city.countryName] = [];
    }
    acc[city.countryName].push(city);
    return acc;
  }, {} as Record<string, City[]>);

  return (
    <>
      {/* Hero Image */}
      <div className="relative h-85.75 w-full bg-linear-to-br from-primary via-secondary/50 to-accent overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full h-full max-w-md">
            <div className="text-8xl absolute top-1/4 left-1/2 transform -translate-x-1/2 animate-pulse">
              🏙️
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-8 pt-5.5 pb-10">
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-6">
          Où habitez-vous ?
        </h2>

        {/* ✅ NOUVEAU : Pays de résidence */}
        <div className="mb-6">
          <Label className="block text-base font-semibold text-gray-800 mb-3">
            Pays de résidence
          </Label>
          <select
            value={countryResidence}
            onChange={(e) => onCountryResidenceChange(e.target.value)}
            className="w-full h-12 px-6 text-base border-2 border-gray-200 rounded-full focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white"
          >
            <option value="">Sélectionnez votre pays de résidence</option>
            {nationalities.map((nat) => (
              <option key={nat.id} value={nat.code}>
                {nat.flag} {nat.nameFr}
              </option>
            ))}
            <option value="PREFER_NOT_TO_SAY">Je préfère ne pas le dire</option>
          </select>
        </div>

        {/* Ville/Localisation */}
        <div>
          <Label
            htmlFor="location"
            className="block text-base font-semibold text-gray-800 mb-3"
          >
            Localisation (ville)
          </Label>
          <select
            id="location"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full h-12 px-6 text-base border-2 border-gray-200 rounded-full focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white"
          >
            <option value="">Sélectionnez une ville</option>
            {Object.entries(citiesByCountry).map(([country, citiesList]) => (
              <optgroup key={country} label={country}>
                {citiesList.map((city) => (
                  <option key={city.id} value={city.displayName}>
                    {city.displayName}
                  </option>
                ))}
              </optgroup>
            ))}
            <option value="PREFER_NOT_TO_SAY">Je préfère ne pas le dire</option>
          </select>
        </div>

        <div className="h-24" />
      </div>
    </>
  );
}