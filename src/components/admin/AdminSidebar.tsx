// src/components/admin/AdminSidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, X, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Users,
  Bell,
  Settings,
  BarChart3,
  CreditCard,
  Wallet,
  UserCheck,
  Shield,
  Crown,
  FileImage,
  Receipt,
  TrendingUp,
  Mail,
  Wrench,
} from "lucide-react";
import { Image as ImageIcon } from "lucide-react";

// ─── Icon map ─────────────────────────────────────────────────────
const iconMap: Record<string, any> = {
  Users,
  UserCheck,
  Shield,
  Crown,
  Image: ImageIcon,
  ImageIcon,
  FileImage,
  CreditCard,
  Receipt,
  TrendingUp,
  BarChart3,
  Bell,
  Mail,
  Settings,
  Wrench,
  Wallet,
};

// ─── Types ────────────────────────────────────────────────────────
interface Menu {
  id: string;
  name: string;
  path: string | null;
  icon: string | null;
  order: number;
  parentId: string | null;
  children?: Menu[];
}

interface AdminSidebarProps {
  menus: Menu[];
}

// ─── Sidebar principale ──────────────────────────────────────────
export default function AdminSidebar({ menus }: AdminSidebarProps) {
  // ── State ──
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const pathname = usePathname();

  // ── Helpers ──
  const toggleMenu = (id: string) =>
    setExpandedMenus((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const isActive = (path: string | null) => {
    if (!path) return false;
    return pathname === path || pathname.startsWith(path + "/");
  };

  // ─── Composant MenuItem ─────────────────────────────────────────
  const MenuItem = ({ menu }: { menu: Menu }) => {
    const Icon = menu.icon ? iconMap[menu.icon] || Users : Users;
    const hasChildren = !!(menu.children && menu.children.length > 0);
    const isExpanded = expandedMenus.includes(menu.id);

    return (
      <div>
        {/* Item principal */}
        {menu.path ? (
          <Link
            href={menu.path}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200",
              isActive(menu.path)
                ? "bg-[#0F4C5C] text-white shadow-md"
                : "text-gray-700 hover:bg-gray-100",
            )}
          >
            <div className="flex items-center space-x-3">
              <Icon className="h-5 w-5 shrink-0" />
              {isOpen && (
                <span className="text-sm font-medium">{menu.name}</span>
              )}
            </div>
          </Link>
        ) : (
          <button
            onClick={() => hasChildren && toggleMenu(menu.id)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200",
              "text-gray-700 hover:bg-gray-100",
            )}
          >
            <div className="flex items-center space-x-3">
              <Icon className="h-5 w-5 shrink-0" />
              {isOpen && (
                <span className="text-sm font-medium">{menu.name}</span>
              )}
            </div>
            {isOpen && hasChildren && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform shrink-0",
                  isExpanded && "rotate-180",
                )}
              />
            )}
          </button>
        )}

        {/* Sous-menus */}
        {hasChildren && isExpanded && isOpen && (
          <div className="ml-4 mt-1 space-y-1 border-l-2 border-[#B88A4F]/30 pl-3">
            {menu.children!.map((child) => {
              const ChildIcon = child.icon
                ? iconMap[child.icon] || Users
                : Users;
              return (
                <Link
                  key={child.id}
                  href={child.path || "#"}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors duration-200",
                    isActive(child.path)
                      ? "bg-[#B88A4F]/10 text-[#B88A4F] font-medium"
                      : "text-gray-700 hover:bg-gray-100",
                  )}
                >
                  <ChildIcon className="h-4 w-4 shrink-0" />
                  <span>{child.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ─── Contenu partagé sidebar (desktop + mobile) ────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* ══ Header : logo toggle ══ */}
      <div className="border-b border-gray-200 bg-primary-dark">
        <div className="flex items-center justify-between p-3">
          {isOpen ? (
            <>
              {/* Logo image + nom */}
              <Link
                href="/admin"
                className="flex items-center space-x-2.5 flex-1 min-w-0"
              >
                <div className="h-10 shrink-0 flex items-center">
                  <Image
                    src="/images/fuck.png"
                    alt="Linkaïa Logo"
                    width={32}
                    height={64}
                    className="object-contain h-full w-auto"
                  />
                </div>
                <h2 className="font-bold text-white text-lg tracking-tight truncate">
                  Linkaïa
                </h2>
              </Link>

              {/* Bouton collapse → affiche PanelLeft */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 shrink-0"
              >
                <PanelLeft className="h-5 w-5" />
              </Button>
            </>
          ) : (
            /* Sidebar collapsée → un seul bouton PanelLeft pour re-étendre */
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(true)}
              className="text-white hover:bg-white/20 mx-auto"
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* ══ Navigation (menus RBAC) ══ */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {menus.map((menu) => (
          <MenuItem key={menu.id} menu={menu} />
        ))}
      </nav>
    </div>
  );

  // ─── Rendu ──────────────────────────────────────────────────────
  return (
    <>
      {/* ══ Bouton hamburger mobile ══ */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-[#0F4C5C] text-white shadow-lg hover:bg-[#0a3540]"
      >
        {isMobileOpen ? <X /> : <PanelLeft />}
      </Button>

      {/* ══ Sidebar desktop ══ */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen sticky top-0 transition-all duration-300 border-r border-gray-200",
          isOpen ? "w-64" : "w-20",
        )}
      >
        <SidebarContent />
      </aside>

      {/* ══ Sidebar mobile + overlay ══ */}
      {isMobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 h-screen w-64 z-50">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
