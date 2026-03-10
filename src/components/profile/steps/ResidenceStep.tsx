// src/components/ModalSteps/steps/ResidenceStep.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface City {
  id: string;
  name: string;
  stateName: string | null;
  countryCode: string;
  countryName: string;
  displayName: string;
}

interface Nationality {
  id: string;
  code: string;
  nameFr: string;
  flag: string;
}

interface ResidenceStepProps {
  countryResidenceCode: string | null;
  cityId: string | null;
  nationalities: Nationality[];
  onCountryChange: (code: string | null) => void;
  onCityChange: (cityId: string | null) => void;
}

export default function ResidenceStep({
  countryResidenceCode,
  cityId,
  nationalities,
  onCountryChange,
  onCityChange,
}: ResidenceStepProps) {
  const [citySearch, setCitySearch] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<City[]>([]);
  const [selectedCityLabel, setSelectedCityLabel] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Charger le label de la ville déjà sélectionnée (au chargement)
  useEffect(() => {
    if (!cityId) return;
    fetch(`/api/cities?id=${cityId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.cities?.[0]) {
          setSelectedCityLabel(data.cities[0].displayName);
          setCitySearch(data.cities[0].displayName);
        }
      })
      .catch(() => {});
  }, [cityId]);

  // ✅ Recherche avec debounce — déclenché uniquement si l'user tape
  const handleCitySearchChange = useCallback(
    (value: string) => {
      setCitySearch(value);

      // Si l'user efface, reset la sélection
      if (!value) {
        onCityChange(null);
        setCitySuggestions([]);
        setSelectedCityLabel("");
        return;
      }

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        if (value.length < 2) return;
        setIsSearching(true);
        try {
          const params = new URLSearchParams({ search: value });
          if (countryResidenceCode)
            params.append("country", countryResidenceCode);
          const res = await fetch(`/api/cities?${params}`);
          const data = await res.json();
          setCitySuggestions(data.cities ?? []);
        } catch {
          setCitySuggestions([]);
        } finally {
          setIsSearching(false);
        }
      }, 400);
    },
    [countryResidenceCode, onCityChange],
  );

  const handleSelectCity = (city: City) => {
    onCityChange(city.id);
    setCitySearch(city.displayName);
    setSelectedCityLabel(city.displayName);
    setCitySuggestions([]);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <h2 className="text-2xl font-bold text-gray-900">Lieu de résidence</h2>

      {/* Sélection du pays */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Pays</label>
        <select
          value={countryResidenceCode ?? ""}
          onChange={(e) => {
            onCountryChange(e.target.value || null);
            // Reset ville si on change de pays
            onCityChange(null);
            setCitySearch("");
            setSelectedCityLabel("");
            setCitySuggestions([]);
          }}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Sélectionner un pays</option>
          {nationalities.map((n) => (
            <option key={n.code} value={n.code}>
              {n.flag} {n.nameFr}
            </option>
          ))}
        </select>
      </div>

      {/* Recherche de ville — autocomplete */}
      <div className="flex flex-col gap-2 relative">
        <label className="text-sm font-medium text-gray-700">Ville</label>
        <div className="relative">
          <input
            type="text"
            value={citySearch}
            onChange={(e) => handleCitySearchChange(e.target.value)}
            placeholder="Rechercher une ville..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Suggestions dropdown */}
        {citySuggestions.length > 0 && (
          <ul className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto mt-1">
            {citySuggestions.map((city) => (
              <li
                key={city.id}
                onClick={() => handleSelectCity(city)}
                className="px-4 py-3 text-sm hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
              >
                <span className="font-medium">{city.name}</span>
                {city.stateName && (
                  <span className="text-gray-500 ml-1">— {city.stateName}</span>
                )}
                <span className="text-gray-400 ml-1">({city.countryName})</span>
              </li>
            ))}
          </ul>
        )}

        {/* Ville sélectionnée */}
        {selectedCityLabel && citySuggestions.length === 0 && (
          <p className="text-xs text-green-600 mt-1">✓ {selectedCityLabel}</p>
        )}
      </div>
    </div>
  );
}
