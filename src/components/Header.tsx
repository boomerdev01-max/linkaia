"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="w-full py-4 px-6 md:px-12">
      <nav className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-amber-400 via-blue-400 to-cyan-400 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-linear-to-br from-amber-300 via-blue-300 to-teal-400" />
          </div>
          <span className="text-xl font-semibold text-foreground">Linkaïa</span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Industries
          </Link>
          <Link
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Documents
          </Link>
          <Link
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Partnership
          </Link>
          <Link
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Contact us
          </Link>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <Link
            href="/signin"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
          >
            Log in
          </Link>
          <Button
            asChild
            className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-5"
          >
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
