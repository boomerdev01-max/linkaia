"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, ArrowRight } from "lucide-react";

const FRANCOPHONE_COUNTRIES = [
  { code: "BJ", name: "Bénin" },
  { code: "BF", name: "Burkina Faso" },
  { code: "CM", name: "Cameroun" },
  { code: "CA", name: "Canada" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "FR", name: "France" },
  { code: "GA", name: "Gabon" },
  { code: "GN", name: "Guinée" },
  { code: "HT", name: "Haïti" },
  { code: "ML", name: "Mali" },
  { code: "MA", name: "Maroc" },
  { code: "NE", name: "Niger" },
  { code: "CD", name: "République démocratique du Congo" },
  { code: "SN", name: "Sénégal" },
  { code: "CH", name: "Suisse" },
  { code: "TG", name: "Togo" },
  { code: "TN", name: "Tunisie" },
];

const REGISTRATION_TYPES = [
  { value: "ONG", label: "ONG (Organisation Non Gouvernementale)" },
  { value: "SARL", label: "SARL (Société à Responsabilité Limitée)" },
  { value: "SAS", label: "SAS (Société par Actions Simplifiée)" },
  { value: "SASU", label: "SASU (SAS Unipersonnelle)" },
  { value: "EURL", label: "EURL (Entreprise Unipersonnelle à Responsabilité Limitée)" },
  { value: "SA", label: "SA (Société Anonyme)" },
  { value: "SNC", label: "SNC (Société en Nom Collectif)" },
  { value: "SCS", label: "SCS (Société en Commandite Simple)" },
  { value: "ASSOCIATION", label: "Association" },
  { value: "FONDATION", label: "Fondation" },
  { value: "GIE", label: "GIE (Groupement d'Intérêt Économique)" },
  { value: "COOPERATIVE", label: "Coopérative" },
  { value: "AUTO_ENTREPRENEUR", label: "Auto-Entrepreneur" },
  { value: "OTHER", label: "Autre" },
];

export default function CompanyLegalDetailsForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    country: "",
    registrationType: "",
    legalRepresentative: "",
    legalAddress: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.country) newErrors.country = "Le pays est requis";
    if (!formData.registrationType)
      newErrors.registrationType = "Le type d'enregistrement est requis";
    if (!formData.legalRepresentative)
      newErrors.legalRepresentative = "Le représentant légal est requis";
    if (!formData.legalAddress)
      newErrors.legalAddress = "L'adresse légale est requise";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/company/legal-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erreur lors de l'enregistrement");
        return;
      }

      toast.success("Informations légales enregistrées avec succès");
      router.push("/company/documents");
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Informations Légales</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Complétez les détails légaux de votre entreprise
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
              ✓
            </div>
            <div className="w-16 h-1 bg-primary"></div>
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
              2
            </div>
            <div className="w-16 h-1 bg-gray-300 dark:bg-gray-700"></div>
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 flex items-center justify-center text-sm font-bold">
              3
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="country"
                className={errors.country ? "text-red-600" : ""}
              >
                Pays d'enregistrement légal *
              </Label>
              <Select
                value={formData.country}
                onValueChange={(value) =>
                  setFormData({ ...formData, country: value })
                }
                disabled={loading}
              >
                <SelectTrigger
                  className={errors.country ? "border-red-600" : ""}
                >
                  <SelectValue placeholder="Sélectionnez un pays" />
                </SelectTrigger>
                <SelectContent>
                  {FRANCOPHONE_COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.name}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.country && (
                <p className="text-xs text-red-600">{errors.country}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="registrationType"
                className={errors.registrationType ? "text-red-600" : ""}
              >
                Type d'enregistrement *
              </Label>
              <Select
                value={formData.registrationType}
                onValueChange={(value) =>
                  setFormData({ ...formData, registrationType: value })
                }
                disabled={loading}
              >
                <SelectTrigger
                  className={errors.registrationType ? "border-red-600" : ""}
                >
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  {REGISTRATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.registrationType && (
                <p className="text-xs text-red-600">
                  {errors.registrationType}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="legalRepresentative"
              className={errors.legalRepresentative ? "text-red-600" : ""}
            >
              Représentant légal *
            </Label>
            <Input
              id="legalRepresentative"
              value={formData.legalRepresentative}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  legalRepresentative: e.target.value,
                })
              }
              className={errors.legalRepresentative ? "border-red-600" : ""}
              disabled={loading}
              placeholder="Nom complet du représentant légal"
            />
            {errors.legalRepresentative && (
              <p className="text-xs text-red-600">
                {errors.legalRepresentative}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="legalAddress"
              className={errors.legalAddress ? "text-red-600" : ""}
            >
              Adresse légale *
            </Label>
            <Input
              id="legalAddress"
              value={formData.legalAddress}
              onChange={(e) =>
                setFormData({ ...formData, legalAddress: e.target.value })
              }
              className={errors.legalAddress ? "border-red-600" : ""}
              disabled={loading}
              placeholder="Adresse complète du siège social"
            />
            {errors.legalAddress && (
              <p className="text-xs text-red-600">{errors.legalAddress}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              "Enregistrement..."
            ) : (
              <>
                Continuer
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}