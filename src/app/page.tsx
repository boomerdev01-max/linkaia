import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { DashboardImage } from "@/components/DashboardImage";
import { TrustSection } from "@/components/TrustSection";
import { MultiUniverseSection } from "@/components/MultiUniverseSection";
import { GamificationSection } from "@/components/GamificationSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { CtaSection } from "@/components/CtaSection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* ── Gradient background (hero only) ── */}
      <div className="absolute inset-0 -z-10 h-screen pointer-events-none">
        {/* White base */}
        <div className="absolute inset-0 bg-white" />

        {/* Peach blob — bottom left */}
        <div
          className="absolute -left-20 bottom-0 w-[70%] h-[80%] opacity-80"
          style={{
            background:
              "radial-gradient(ellipse at 20% 80%, #f9a87c 0%, #fcc9a8 25%, #fde4d0 45%, transparent 70%)",
          }}
        />

        {/* Mint blob — bottom right */}
        <div
          className="absolute -right-20 bottom-0 w-[70%] h-[80%] opacity-80"
          style={{
            background:
              "radial-gradient(ellipse at 80% 80%, #6dd3c8 0%, #a0e4de 25%, #cff2ee 45%, transparent 70%)",
          }}
        />

        {/* Center blend */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[60%] h-[70%] opacity-60"
          style={{
            background:
              "radial-gradient(ellipse at 50% 90%, #f5d4b8 0%, #e8ece0 30%, transparent 65%)",
          }}
        />

        {/* Cream center accent */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-10 w-[50%] h-[50%] opacity-50"
          style={{
            background:
              "radial-gradient(ellipse at center bottom, #fef6e0 0%, #f8f0e0 30%, transparent 60%)",
          }}
        />

        {/* Extra peach extension */}
        <div
          className="absolute left-[10%] bottom-[10%] w-[50%] h-[60%] opacity-50"
          style={{
            background:
              "radial-gradient(ellipse at 30% 70%, #fdd5b5 0%, transparent 60%)",
          }}
        />

        {/* Extra mint extension */}
        <div
          className="absolute right-[10%] bottom-[10%] w-[50%] h-[60%] opacity-50"
          style={{
            background:
              "radial-gradient(ellipse at 70% 70%, #b5e8e3 0%, transparent 60%)",
          }}
        />
      </div>

      {/* ── Sections ── */}
      <Header />
      <HeroSection />
      <DashboardImage />
      <TrustSection />
      <MultiUniverseSection />
      <GamificationSection />
      <TestimonialsSection />
      <CtaSection />
      <Footer />
    </main>
  );
}
