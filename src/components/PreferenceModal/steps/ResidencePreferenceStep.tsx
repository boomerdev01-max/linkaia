// src/components/PreferenceModal/steps/ResidencePreferenceStep.tsx
import { useState } from "react";
import { Check, Search, MapPin } from "lucide-react";
import { City } from "@/components/ModalSteps/types";

interface ResidencePreferenceStepProps {
  selectedCityIds: string[];
  cities: City[];
  onCitiesChange: (ids: string[]) => void;
}

export default function ResidencePreferenceStep({
  selectedCityIds,
  cities,
  onCitiesChange,
}: ResidencePreferenceStepProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const isAnySelected = selectedCityIds.length === 0;

  const filteredCities = cities.filter((city) =>
    city.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group cities by country
  const citiesByCountry = filteredCities.reduce((acc, city) => {
    if (!acc[city.countryName]) {
      acc[city.countryName] = [];
    }
    acc[city.countryName].push(city);
    return acc;
  }, {} as Record<string, City[]>);

  const handleToggleCity = (cityId: string) => {
    if (selectedCityIds.includes(cityId)) {
      onCitiesChange(selectedCityIds.filter((id) => id !== cityId));
    } else {
      onCitiesChange([...selectedCityIds, cityId]);
    }
  };

  const handleSetAny = () => {
    onCitiesChange([]);
  };

  return (
    <>
      {/* Hero Image — exactement comme WorkStep & EducationStep */}
      <div className="relative h-85.75 w-full bg-linear-to-br from-accent via-secondary/50 to-primary overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full h-full max-w-md">
            <div className="text-8xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-bounce">
              📍
            </div>
          </div>
        </div>
      </div>

      {/* Form Content — suit directement en dessous, même padding que les autres */}
      <div className="px-8 pt-5.5 pb-10">
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-2">
          Résidence recherchée
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {isAnySelected
            ? "Peu importe la localisation"
            : `${selectedCityIds.length} ville(s) sélectionnée(s)`}
        </p>

        {/* Option "Peu importe" */}
        <div
          className={`flex items-center justify-between px-6 py-3.25 h-12.5 rounded-full cursor-pointer transition-all duration-200 border-2 mb-6 ${
            isAnySelected
              ? "bg-primary/10 border-primary"
              : "bg-gray-50 border-transparent hover:bg-gray-100"
          }`}
          onClick={handleSetAny}
        >
          <span className="text-lg font-medium text-gray-800">Peu importe</span>
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              isAnySelected ? "border-primary bg-primary" : "border-gray-400"
            }`}
          >
            {isAnySelected && (
              <div className="w-2.5 h-2.5 bg-white rounded-full" />
            )}
          </div>
        </div>

        {!isAnySelected && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  Ou choisir spécifiquement
                </span>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une ville..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:border-primary focus:outline-none"
              />
            </div>

            {/* Cities by Country */}
            {Object.entries(citiesByCountry).map(([country, countryCities]) => (
              <div key={country} className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {country}
                </h3>
                <div className="space-y-2">
                  {countryCities.map((city) => {
                    const isSelected = selectedCityIds.includes(city.id);

                    return (
                      <div
                        key={city.id}
                        onClick={() => handleToggleCity(city.id)}
                        className={`flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all border-2 ${
                          isSelected
                            ? "bg-primary/10 border-primary"
                            : "bg-gray-50 border-transparent hover:bg-gray-100"
                        }`}
                      >
                        <span className="text-sm font-medium text-gray-800">
                          {city.name}
                        </span>
                        {isSelected && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Espace en bas pour que le dernier champ ne colle pas le bas de l'écran */}
        <div className="h-24" />
      </div>
    </>
  );
}