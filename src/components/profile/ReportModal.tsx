// src/components/profile/ReportModal.tsx
'use client';

import { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useReports } from '@/hooks/useReports';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  profileName: string;
}

export default function ReportModal({
  isOpen,
  onClose,
  profileId,
  profileName,
}: ReportModalProps) {
  const { categories, submitReport } = useReports();
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategoryId) {
      toast.error('Veuillez sélectionner un motif de signalement');
      return;
    }

    if (reason.trim().length < 20) {
      toast.error('Veuillez décrire la raison du signalement (minimum 20 caractères)');
      return;
    }

    if (reason.trim().length > 1000) {
      toast.error('La description ne peut pas dépasser 1000 caractères');
      return;
    }

    try {
      setSubmitting(true);
      await submitReport(profileId, selectedCategoryId, reason.trim());
      toast.success('Signalement envoyé avec succès');
      onClose();
      
      // Reset form
      setSelectedCategoryId('');
      setReason('');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de l\'envoi du signalement'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative bg-linear-to-r from-red-600 to-red-700 px-6 py-4">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white pr-8">
                Signaler ce profil
              </h2>
              <p className="text-white/90 text-sm mt-1">
                {profileName}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-900">
              <strong>Important :</strong> Les signalements abusifs peuvent entraîner la
              suspension de votre compte. Veuillez signaler uniquement les comportements
              inappropriés réels.
            </p>
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Motif du signalement
            </label>
            <select
              id="category"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              disabled={submitting}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed appearance-none bg-white"
            >
              <option value="">-- Sélectionnez un motif --</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
            {selectedCategory?.description && (
              <p className="mt-2 text-xs text-gray-600">
                {selectedCategory.description}
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label
              htmlFor="reason"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Détails du signalement <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Décrivez précisément la raison de votre signalement... (minimum 20 caractères)"
              rows={6}
              disabled={submitting}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-colors resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
              maxLength={1000}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">
                Minimum 20 caractères
              </span>
              <span
                className={`text-xs ${
                  reason.length > 1000
                    ? 'text-red-500 font-medium'
                    : 'text-gray-500'
                }`}
              >
                {reason.length}/1000
              </span>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-600 leading-relaxed">
              Ce signalement sera examiné par notre équipe de modération. Nous vous
              tiendrons informé des suites données. Les informations fournies resteront
              confidentielles.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={
                submitting ||
                !selectedCategoryId ||
                reason.trim().length < 20
              }
              className="flex-1 px-4 py-3 bg-linear-to-r from-red-600 to-red-700 text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Envoi...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Envoyer le signalement</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}