// src/components/profile/steps/ResidenceStep.tsx
// ✨ OPTIMISÉ avec country-state-city

import { useState, useMemo } from "react";
import { Search, MapPin, Globe } from "lucide-react";
import { City, Nationality } from "@/components/ModalSteps/types";

interface ResidenceStepProps {
  countryResidenceCode: string | null;
  cityId: string | null;
  cities: City[];
  nationalities: Nationality[];
  onCountryChange: (code: string | null) => void;
  onCityChange: (cityId: string | null) => void;
}

export default function ResidenceStep({
  countryResidenceCode,
  cityId,
  cities,
  nationalities,
  onCountryChange,
  onCityChange,
}: ResidenceStepProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // ✨ Filtrer les villes par pays sélectionné
  const filteredCities = useMemo(() => {
    let result = cities;

    // Filtre par pays si sélectionné
    if (countryResidenceCode) {
      result = result.filter((city) => city.countryCode === countryResidenceCode);
    }

    // Filtre par recherche
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (city) =>
          city.name.toLowerCase().includes(search) ||
          city.stateName.toLowerCase().includes(search) ||
          city.displayName.toLowerCase().includes(search)
      );
    }

    return result;
  }, [cities, countryResidenceCode, searchTerm]);

  // ✨ Grouper les villes par état (pour l'affichage organisé)
  const citiesByState = useMemo(() => {
    const grouped: Record<string, City[]> = {};

    filteredCities.forEach((city) => {
      const key = `${city.stateName}, ${city.countryName}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(city);
    });

    return grouped;
  }, [filteredCities]);

  // ✨ Ville sélectionnée
  const selectedCity = useMemo(() => {
    return cities.find((c) => c.id === cityId);
  }, [cities, cityId]);

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
          Où habitez-vous ?
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {selectedCity
            ? selectedCity.displayName
            : "Sélectionnez votre pays puis votre ville"}
        </p>

        {/* ✨ Sélection du Pays */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Globe className="inline w-4 h-4 mr-2" />
            Pays de résidence
          </label>
          <select
            value={countryResidenceCode || ""}
            onChange={(e) => {
              onCountryChange(e.target.value || null);
              onCityChange(null); // Reset ville quand le pays change
            }}
            className="w-full px-4 py-3 rounded-full border border-gray-300 focus:border-primary focus:outline-none"
          >
            <option value="">Sélectionnez un pays</option>
            {nationalities.map((nat) => (
              <option key={nat.code} value={nat.code}>
                {nat.flag} {nat.nameFr}
              </option>
            ))}
          </select>
        </div>

        {/* ✨ Recherche de Ville (seulement si un pays est sélectionné) */}
        {countryResidenceCode && (
          <>
            <div className="relative mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <MapPin className="inline w-4 h-4 mr-2" />
                Ville
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une ville..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* ✨ Liste des Villes par État */}
            <div className="space-y-6 max-h-96 overflow-y-auto">
              {Object.entries(citiesByState).length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  Aucune ville trouvée
                </p>
              ) : (
                Object.entries(citiesByState).map(([stateName, stateCities]) => (
                  <div key={stateName}>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {stateName}
                    </h3>
                    <div className="space-y-2">
                      {stateCities.map((city) => {
                        const isSelected = cityId === city.id;

                        return (
                          <div
                            key={city.id}
                            onClick={() => onCityChange(city.id)}
                            className={`flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all border-2 ${
                              isSelected
                                ? "bg-primary/10 border-primary"
                                : "bg-gray-50 border-transparent hover:bg-gray-100"
                            }`}
                          >
                            <div>
                              <span className="text-sm font-medium text-gray-800">
                                {city.name}
                              </span>
                              {city.latitude && city.longitude && (
                                <p className="text-xs text-gray-500 mt-1">
                                  📍 {city.latitude.toFixed(2)}°, {city.longitude.toFixed(2)}°
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                <div className="w-2.5 h-2.5 bg-white rounded-full" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Espace en bas */}
        <div className="h-24" />
      </div>
    </>
  );
}