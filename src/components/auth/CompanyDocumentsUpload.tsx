"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Building2, Upload, FileText, Image as ImageIcon, X } from "lucide-react";

export default function CompanyDocumentsUpload() {
  const router = useRouter();

  const [registrationDocument, setRegistrationDocument] = useState<File | null>(
    null
  );
  const [logo, setLogo] = useState<File | null>(null);
  const [registrationPreview, setRegistrationPreview] = useState<string>("");
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const documentInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRegistrationDocument(file);
      setRegistrationPreview(file.name);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!registrationDocument) {
      toast.error("Le document d'enregistrement est requis");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("registrationDocument", registrationDocument);
      if (logo) {
        formData.append("logo", logo);
      }

      const response = await fetch("/api/auth/company/documents", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erreur lors de l'upload");
        return;
      }

      toast.success("Documents enregistrés avec succès !");
      router.push("/home");
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
          <h1 className="text-3xl font-bold">Documents Légaux</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Téléchargez vos documents officiels
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
              ✓
            </div>
            <div className="w-16 h-1 bg-primary"></div>
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
              ✓
            </div>
            <div className="w-16 h-1 bg-primary"></div>
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
              3
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800"
        >
          {/* Document d'enregistrement */}
          <div className="space-y-2">
            <Label htmlFor="registrationDocument">
              Document d'enregistrement légal *
            </Label>
            <div
              onClick={() => documentInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            >
              <input
                ref={documentInputRef}
                type="file"
                id="registrationDocument"
                onChange={handleDocumentChange}
                className="hidden"
                disabled={loading}
              />
              {registrationPreview ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-8 h-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{registrationPreview}</p>
                    <p className="text-xs text-muted-foreground">
                      {(registrationDocument!.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRegistrationDocument(null);
                      setRegistrationPreview("");
                    }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Cliquez pour télécharger votre document
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Tous formats acceptés
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Logo (optionnel) */}
          <div className="space-y-2">
            <Label htmlFor="logo">Logo de l'organisation (optionnel)</Label>
            <div
              onClick={() => logoInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            >
              <input
                ref={logoInputRef}
                type="file"
                id="logo"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
                disabled={loading}
              />
              {logoPreview ? (
                <div className="flex items-center justify-center gap-3">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-16 h-16 object-contain rounded"
                  />
                  <div className="text-left">
                    <p className="font-medium">{logo!.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(logo!.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLogo(null);
                      setLogoPreview("");
                    }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Cliquez pour télécharger votre logo
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    PNG, JPG, SVG acceptés
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note :</strong> Vos documents seront vérifiés par notre
              équipe. Votre compte sera activé dès validation (sous 24-48h).
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !registrationDocument}
          >
            {loading ? "Upload en cours..." : "Finaliser l'inscription"}
          </Button>
        </form>
      </div>
    </div>
  );
}