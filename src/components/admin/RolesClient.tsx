// src/components/admin/RolesClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Users,
  Key,
  CheckCircle,
  XCircle,
  Filter,
  Calendar,
  AlertCircle,
  Settings,
} from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  userCount: number;
  permissionCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function RolesClient() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all"); // "all" | "true" | "false"
  const [showFilters, setShowFilters] = useState(false);

  // 📡 Fetch roles
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeFilter !== "all") {
        params.append("active", activeFilter);
      }

      const response = await fetch(`/api/admin/roles?${params}`);
      const data = await response.json();

      if (data.success) {
        setRoles(data.roles);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Initial load
  useEffect(() => {
    fetchRoles();
  }, [activeFilter]);

  // 🎨 Helper functions
  const getRoleDisplayName = (name: string) => {
    const labels: Record<string, string> = {
      administrator: "Administrateur",
      moderator: "Modérateur",
      accountant: "Comptable",
      assistant: "Assistant",
      company_user: "Utilisateur Entreprise",
      standard_user: "Utilisateur Standard",
    };
    return labels[name] || name;
  };

  const getRoleBadgeColor = (name: string) => {
    const colors: Record<string, string> = {
      administrator: "bg-red-100 text-red-800 border-red-200",
      moderator: "bg-purple-100 text-purple-800 border-purple-200",
      accountant: "bg-blue-100 text-blue-800 border-blue-200",
      assistant: "bg-green-100 text-green-800 border-green-200",
      company_user: "bg-orange-100 text-orange-800 border-orange-200",
      standard_user: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[name] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getRoleIcon = (name: string) => {
    const icons: Record<string, any> = {
      administrator: Shield,
      moderator: AlertCircle,
      accountant: Key,
      assistant: Users,
      company_user: Shield,
      standard_user: Users,
    };
    return icons[name] || Shield;
  };

  return (
    <div className="p-6 space-y-6">
      {/* 📊 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Rôles</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {roles.length}
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Rôles Actifs</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {roles.filter((r) => r.isActive).length}
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">
                Total utilisateurs
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {roles.reduce((sum, r) => sum + r.userCount, 0)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 🔍 Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Liste des Rôles
          </h2>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/users/roles/manage")}
              className="flex items-center gap-2 px-4 py-2 bg-[#0F4C5C] text-white rounded-lg hover:bg-[#0F4C5C]/90 transition-colors font-medium"
            >
              <Settings className="h-5 w-5" />
              Gérer les rôles
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-5 w-5" />
              Filtres
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F4C5C] focus:border-transparent"
              >
                <option value="all">Tous les rôles</option>
                <option value="true">Actifs uniquement</option>
                <option value="false">Inactifs uniquement</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setActiveFilter("all")}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 📋 Roles Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F4C5C]"></div>
          </div>
        ) : roles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Shield className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">Aucun rôle trouvé</p>
            <p className="text-sm">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateurs
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {roles.map((role) => {
                  const Icon = getRoleIcon(role.name);
                  return (
                    <tr
                      key={role.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Role Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-lg flex items-center justify-center ${getRoleBadgeColor(role.name).split(" ")[0]}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {getRoleDisplayName(role.name)}
                            </p>
                            <p className="text-xs text-gray-500 font-mono">
                              {role.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 max-w-xs truncate">
                          {role.description || (
                            <span className="text-gray-400 italic">
                              Aucune description
                            </span>
                          )}
                        </p>
                      </td>

                      {/* User Count */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                          <Users className="h-4 w-4" />
                          <span className="text-sm font-semibold">
                            {role.userCount}
                          </span>
                        </div>
                      </td>

                      {/* Permission Count */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-full">
                          <Key className="h-4 w-4" />
                          <span className="text-sm font-semibold">
                            {role.permissionCount}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {role.isActive ? (
                          <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-semibold">Actif</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full">
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm font-semibold">
                              Inactif
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Dates */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Créé:{" "}
                              {new Date(role.createdAt).toLocaleDateString(
                                "fr-FR",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span>
                              Modifié:{" "}
                              {new Date(role.updatedAt).toLocaleDateString(
                                "fr-FR",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 📊 Summary Footer */}
      {!loading && roles.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600 text-center">
            Affichage de <span className="font-semibold">{roles.length}</span>{" "}
            rôle{roles.length > 1 ? "s" : ""} au total
          </p>
        </div>
      )}
    </div>
  );
}
