// src/components/admin/roles/PermissionsModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle, Loader2, Save, Key, Search } from "lucide-react";
import { toast } from "sonner";

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roleId: string | null;
  roleName: string;
}

interface Permission {
  id: string;
  name: string;
  description: string | null;
}

export default function PermissionsModal({
  isOpen,
  onClose,
  onSuccess,
  roleId,
  roleName,
}: PermissionsModalProps) {
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<
    Record<string, Permission[]>
  >({});
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen && roleId) {
      fetchData();
    }
  }, [isOpen, roleId]);

  const fetchData = async () => {
    if (!roleId) return;

    setFetchLoading(true);
    try {
      // Fetch all permissions
      const permResponse = await fetch("/api/admin/permissions");
      const permData = await permResponse.json();

      if (!permResponse.ok) {
        throw new Error("Erreur lors du chargement des permissions");
      }

      setAllPermissions(permData.permissions);
      setGroupedPermissions(permData.grouped);

      // Fetch current role permissions
      const roleResponse = await fetch(`/api/admin/roles/${roleId}`);
      const roleData = await roleResponse.json();

      if (!roleResponse.ok) {
        throw new Error("Erreur lors du chargement du rôle");
      }

      const currentPermIds = roleData.role.permissions.map((p: any) => p.id);
      setSelectedPermissions(new Set(currentPermIds));
    } catch (err: any) {
      toast.error(err.message);
      onClose();
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!roleId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/roles/${roleId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permissionIds: Array.from(selectedPermissions),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      toast.success("Permissions mises à jour avec succès !");
      onSuccess();
      handleClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedPermissions(new Set());
    setSearchQuery("");
    onClose();
  };

  const togglePermission = (permId: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permId)) {
      newSelected.delete(permId);
    } else {
      newSelected.add(permId);
    }
    setSelectedPermissions(newSelected);
  };

  const toggleCategory = (category: string) => {
    const categoryPerms = groupedPermissions[category] || [];
    const allSelected = categoryPerms.every((p) =>
      selectedPermissions.has(p.id),
    );

    const newSelected = new Set(selectedPermissions);
    categoryPerms.forEach((p) => {
      if (allSelected) {
        newSelected.delete(p.id);
      } else {
        newSelected.add(p.id);
      }
    });
    setSelectedPermissions(newSelected);
  };

  const selectAll = () => {
    setSelectedPermissions(new Set(allPermissions.map((p) => p.id)));
  };

  const deselectAll = () => {
    setSelectedPermissions(new Set());
  };

  // Filter permissions based on search
  const filteredGrouped = Object.entries(groupedPermissions).reduce(
    (acc, [category, perms]) => {
      const filtered = perms.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      if (filtered.length > 0) {
        acc[category] = filtered;
      }
      return acc;
    },
    {} as Record<string, Permission[]>,
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-linear-to-r from-[#0F4C5C] to-primary px-6 py-4 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Gérer les permissions</h2>
              <p className="text-sm text-white/80 mt-1">
                Rôle : <span className="font-semibold">{roleName}</span>
              </p>
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
        {fetchLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#0F4C5C]" />
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-gray-200 shrink-0 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une permission..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F4C5C] focus:border-transparent"
                />
              </div>

              {/* Stats & Actions */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-[#0F4C5C]">
                    {selectedPermissions.size}
                  </span>{" "}
                  / {allPermissions.length} permissions sélectionnées
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="px-3 py-1.5 text-xs font-medium text-[#0F4C5C] bg-[#0F4C5C]/10 rounded-lg hover:bg-[#0F4C5C]/20 transition-colors"
                  >
                    Tout sélectionner
                  </button>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Tout désélectionner
                  </button>
                </div>
              </div>
            </div>

            {/* Permissions List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {Object.entries(filteredGrouped).map(([category, perms]) => {
                  const allCategorySelected = perms.every((p) =>
                    selectedPermissions.has(p.id),
                  );
                  const someCategorySelected = perms.some((p) =>
                    selectedPermissions.has(p.id),
                  );

                  return (
                    <div
                      key={category}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {/* Category Header */}
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={allCategorySelected}
                              ref={(el) => {
                                if (el) {
                                  el.indeterminate =
                                    someCategorySelected &&
                                    !allCategorySelected;
                                }
                              }}
                              onChange={() => toggleCategory(category)}
                              className="w-4 h-4 text-[#0F4C5C] border-gray-300 rounded focus:ring-2 focus:ring-[#0F4C5C]"
                            />
                            <h3 className="text-sm font-semibold text-gray-900">
                              {category}
                            </h3>
                          </div>
                          <span className="text-xs text-gray-500">
                            {
                              perms.filter((p) => selectedPermissions.has(p.id))
                                .length
                            }{" "}
                            / {perms.length}
                          </span>
                        </div>
                      </div>

                      {/* Permissions */}
                      <div className="divide-y divide-gray-100">
                        {perms.map((perm) => (
                          <label
                            key={perm.id}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.has(perm.id)}
                              onChange={() => togglePermission(perm.id)}
                              className="w-4 h-4 text-[#0F4C5C] border-gray-300 rounded focus:ring-2 focus:ring-[#0F4C5C] mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Key className="h-4 w-4 text-gray-400 shrink-0" />
                                <p className="text-sm font-medium text-gray-900">
                                  {perm.name}
                                </p>
                              </div>
                              {perm.description && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {perm.description}
                                </p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {Object.keys(filteredGrouped).length === 0 && (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Aucune permission trouvée</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 shrink-0">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={loading}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
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
                      Enregistrer les permissions
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
