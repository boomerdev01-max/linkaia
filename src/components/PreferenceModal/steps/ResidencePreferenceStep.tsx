// src/components/PreferenceModal/steps/ResidencePreferenceStep.tsx
"use client";

import { useState, useCallback, useRef } from "react";
import { Check, Search, MapPin, Globe, X } from "lucide-react";
import { Nationality } from "../types";

interface City {
  id: string;
  name: string;
  stateName: string | null;
  countryCode: string;
  countryName: string;
  displayName: string;
}

interface ResidencePreferenceStepProps {
  selectedResidenceCountryCodes: string[];
  selectedCityIds: string[];
  nationalities: Nationality[];
  onResidenceCountryCodesChange: (codes: string[]) => void;
  onCityIdsChange: (ids: string[]) => void;
}

export default function ResidencePreferenceStep({
  selectedResidenceCountryCodes,
  selectedCityIds,
  nationalities,
  onResidenceCountryCodesChange,
  onCityIdsChange,
}: ResidencePreferenceStepProps) {
  const [activeTab, setActiveTab] = useState<"countries" | "cities">(
    "countries",
  );
  const [countrySearch, setCountrySearch] = useState("");

  // ✅ State autocomplete villes
  const [citySearch, setCitySearch] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<City[]>([]);
  const [selectedCities, setSelectedCities] = useState<City[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const filteredCountries = nationalities.filter((nat) =>
    nat.nameFr.toLowerCase().includes(countrySearch.toLowerCase()),
  );

  const handleToggleCountry = (countryCode: string) => {
    if (selectedResidenceCountryCodes.includes(countryCode)) {
      onResidenceCountryCodesChange(
        selectedResidenceCountryCodes.filter((c) => c !== countryCode),
      );
    } else {
      onResidenceCountryCodesChange([
        ...selectedResidenceCountryCodes,
        countryCode,
      ]);
    }
  };

  // ✅ Recherche autocomplete
  const handleCitySearchChange = useCallback((value: string) => {
    setCitySearch(value);
    if (!value) {
      setCitySuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (value.length < 2) return;
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/cities?search=${encodeURIComponent(value)}`,
        );
        const data = await res.json();
        setCitySuggestions(data.cities ?? []);
      } catch {
        setCitySuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  }, []);

  const handleSelectCity = (city: City) => {
    if (selectedCityIds.includes(city.id)) return;
    const updated = [...selectedCities, city];
    setSelectedCities(updated);
    onCityIdsChange([...selectedCityIds, city.id]);
    setCitySearch("");
    setCitySuggestions([]);
  };

  const handleRemoveCity = (cityId: string) => {
    setSelectedCities(selectedCities.filter((c) => c.id !== cityId));
    onCityIdsChange(selectedCityIds.filter((id) => id !== cityId));
  };

  return (
    <>
      {/* Hero */}
      <div className="relative h-85.75 w-full bg-linear-to-br from-accent via-secondary/50 to-primary overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-8xl animate-bounce">📍</div>
        </div>
      </div>

      {/* Content */}
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

        {/* Tab Pays */}
        {activeTab === "countries" && (
          <>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un pays..."
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:border-primary focus:outline-none"
              />
            </div>
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
                    <p className="text-sm font-medium text-gray-800 truncate flex-1">
                      {country.nameFr}
                    </p>
                    {isSelected && (
                      <Check className="w-5 h-5 text-primary shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Tab Villes — autocomplete */}
        {activeTab === "cities" && (
          <>
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une ville..."
                value={citySearch}
                onChange={(e) => handleCitySearchChange(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:border-primary focus:outline-none"
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Suggestions */}
            {citySuggestions.length > 0 && (
              <ul className="border border-gray-200 rounded-xl shadow-md mb-4 max-h-52 overflow-y-auto">
                {citySuggestions.map((city) => (
                  <li
                    key={city.id}
                    onClick={() => handleSelectCity(city)}
                    className="px-4 py-3 text-sm hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                  >
                    <span className="font-medium">{city.name}</span>
                    {city.stateName && (
                      <span className="text-gray-500 ml-1">
                        — {city.stateName}
                      </span>
                    )}
                    <span className="text-gray-400 ml-1">
                      ({city.countryName})
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {/* Villes sélectionnées */}
            {selectedCities.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Villes sélectionnées :
                </p>
                {selectedCities.map((city) => (
                  <div
                    key={city.id}
                    className="flex items-center justify-between px-4 py-3 bg-primary/10 border-2 border-primary rounded-xl"
                  >
                    <span className="text-sm font-medium text-gray-800">
                      {city.displayName}
                    </span>
                    <button onClick={() => handleRemoveCity(city.id)}>
                      <X className="w-4 h-4 text-gray-500 hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedCities.length === 0 && citySearch.length < 2 && (
              <p className="text-sm text-gray-400 text-center mt-6">
                Tapez au moins 2 caractères pour rechercher une ville
              </p>
            )}
          </>
        )}

        <div className="h-24" />
      </div>
    </>
  );
}
