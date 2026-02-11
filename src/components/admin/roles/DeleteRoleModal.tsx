// src/components/admin/roles/DeleteRoleModal.tsx
"use client";

import { useState } from "react";
import { X, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roleId: string | null;
  roleName: string;
  userCount: number;
}

export default function DeleteRoleModal({
  isOpen,
  onClose,
  onSuccess,
  roleId,
  roleName,
  userCount,
}: DeleteRoleModalProps) {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    if (!roleId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      toast.success("Rôle supprimé avec succès !");
      onSuccess();
      handleClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmText("");
    onClose();
  };

  if (!isOpen) return null;

  const canDelete = confirmText === roleName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-red-600 to-red-500 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold">Supprimer le rôle</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              Vous êtes sur le point de supprimer le rôle{" "}
              <span className="font-bold">{roleName}</span>.
            </p>
            {userCount > 0 && (
              <p className="text-sm text-red-700 mt-2">
                ⚠️ Ce rôle est assigné à{" "}
                <span className="font-semibold">{userCount}</span> utilisateur
                {userCount > 1 ? "s" : ""}. Vous devez d'abord réassigner ces
                utilisateurs avant de pouvoir supprimer ce rôle.
              </p>
            )}
          </div>

          {/* Info */}
          {userCount === 0 && (
            <>
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  <strong>Cette action est irréversible.</strong> Toutes les
                  permissions associées à ce rôle seront également supprimées.
                </p>
              </div>

              {/* Confirmation Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pour confirmer, tapez le nom du rôle :{" "}
                  <span className="font-mono text-red-600">{roleName}</span>
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={roleName}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </>
          )}

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
            {userCount === 0 && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={loading || !canDelete}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Supprimer définitivement
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
