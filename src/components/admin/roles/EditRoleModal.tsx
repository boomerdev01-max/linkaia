// src/components/admin/roles/EditRoleModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roleId: string | null;
}

interface RoleData {
  name: string;
  description: string;
  isActive: boolean;
}

export default function EditRoleModal({
  isOpen,
  onClose,
  onSuccess,
  roleId,
}: EditRoleModalProps) {
  const [formData, setFormData] = useState<RoleData>({
    name: "",
    description: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalName, setOriginalName] = useState("");

  useEffect(() => {
    if (isOpen && roleId) {
      fetchRoleData();
    }
  }, [isOpen, roleId]);

  const fetchRoleData = async () => {
    if (!roleId) return;

    setFetchLoading(true);
    try {
      const response = await fetch(`/api/admin/roles/${roleId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du chargement");
      }

      setFormData({
        name: data.role.name,
        description: data.role.description || "",
        isActive: data.role.isActive,
      });
      setOriginalName(data.role.name);
    } catch (err: any) {
      toast.error(err.message);
      onClose();
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleId) return;

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la modification");
      }

      toast.success("Rôle modifié avec succès !");
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: "", description: "", isActive: true });
    setError(null);
    setOriginalName("");
    onClose();
  };

  if (!isOpen) return null;

  // Vérifier si c'est un rôle système
  const systemRoles = ["administrator", "standard_user", "moderator"];
  const isSystemRole = systemRoles.includes(originalName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-[#0F4C5C] to-primary px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Modifier le rôle</h2>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        {fetchLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#0F4C5C]" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* System Role Warning */}
            {isSystemRole && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">
                    Rôle système
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Ce rôle est un rôle système. Certaines modifications peuvent
                    être limitées.
                  </p>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Erreur</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Nom du rôle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du rôle <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F4C5C] focus:border-transparent transition-all"
                required
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F4C5C] focus:border-transparent transition-all resize-none"
                disabled={loading}
              />
            </div>

            {/* Statut */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive-edit"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-4 h-4 text-[#0F4C5C] border-gray-300 rounded focus:ring-2 focus:ring-[#0F4C5C]"
                disabled={loading || isSystemRole}
              />
              <label
                htmlFor="isActive-edit"
                className="text-sm font-medium text-gray-700"
              >
                Rôle actif
                {isSystemRole && (
                  <span className="ml-2 text-xs text-amber-600">
                    (Non modifiable pour les rôles système)
                  </span>
                )}
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#0F4C5C] rounded-lg hover:bg-[#0F4C5C]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
