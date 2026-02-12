// src/components/PreferenceModal/steps/ResidencePreferenceStep.tsx - CORRIGÉ
import { useState } from "react";
import { Check, Search, MapPin, Globe } from "lucide-react";
import { City, Nationality } from "../types";

interface ResidencePreferenceStepProps {
  selectedResidenceCountryCodes: string[]; // ✅ Pays de résidence
  selectedCityIds: string[]; // ✅ Villes spécifiques
  nationalities: Nationality[];
  cities: City[];
  onResidenceCountryCodesChange: (codes: string[]) => void;
  onCityIdsChange: (ids: string[]) => void;
}

export default function ResidencePreferenceStep({
  selectedResidenceCountryCodes,
  selectedCityIds,
  nationalities,
  cities,
  onResidenceCountryCodesChange,
  onCityIdsChange,
}: ResidencePreferenceStepProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"countries" | "cities">(
    "countries",
  );

  // Filtres
  const filteredCountries = nationalities.filter((nat) =>
    nat.nameFr.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredCities = cities.filter((city) =>
    city.displayName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Group cities by country
  const citiesByCountry = filteredCities.reduce(
    (acc, city) => {
      if (!acc[city.countryName]) {
        acc[city.countryName] = [];
      }
      acc[city.countryName].push(city);
      return acc;
    },
    {} as Record<string, City[]>,
  );

  const handleToggleCountry = (countryCode: string) => {
    if (selectedResidenceCountryCodes.includes(countryCode)) {
      onResidenceCountryCodesChange(
        selectedResidenceCountryCodes.filter((code) => code !== countryCode),
      );
    } else {
      onResidenceCountryCodesChange([
        ...selectedResidenceCountryCodes,
        countryCode,
      ]);
    }
  };

  const handleToggleCity = (cityId: string) => {
    if (selectedCityIds.includes(cityId)) {
      onCityIdsChange(selectedCityIds.filter((id) => id !== cityId));
    } else {
      onCityIdsChange([...selectedCityIds, cityId]);
    }
  };

  return (
    <>
      {/* Hero Image */}
      <div className="relative h-85.75 w-full bg-linear-to-br from-accent via-secondary/50 to-primary overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full h-full max-w-md">
            <div className="text-8xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-bounce">
              📍
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-8 pt-5.5 pb-10">
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-2">
          Lieu de résidence recherché
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {selectedResidenceCountryCodes.length} pays • {selectedCityIds.length}{" "}
          ville(s)
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("countries")}
            className={`flex-1 py-3 rounded-full font-medium transition-all ${
              activeTab === "countries"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Globe className="inline-block w-4 h-4 mr-2" />
            Pays
          </button>
          <button
            onClick={() => setActiveTab("cities")}
            className={`flex-1 py-3 rounded-full font-medium transition-all ${
              activeTab === "cities"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <MapPin className="inline-block w-4 h-4 mr-2" />
            Villes
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={
              activeTab === "countries"
                ? "Rechercher un pays..."
                : "Rechercher une ville..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:border-primary focus:outline-none"
          />
        </div>

        {/* Countries Tab */}
        {activeTab === "countries" && (
          <div className="grid grid-cols-2 gap-3">
            {filteredCountries.map((country) => {
              const isSelected = selectedResidenceCountryCodes.includes(
                country.code,
              );

              return (
                <div
                  key={country.code}
                  onClick={() => handleToggleCountry(country.code)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${
                    isSelected
                      ? "bg-primary/10 border-primary"
                      : "bg-gray-50 border-transparent hover:bg-gray-100"
                  }`}
                >
                  <span className="text-2xl">{country.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {country.nameFr}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="w-5 h-5 text-primary shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Cities Tab */}
        {activeTab === "cities" && (
          <>
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

        {/* Espace en bas */}
        <div className="h-24" />
      </div>
    </>
  );
}
