import { Button } from "@/components/ui/button";
import Image from "next/image";

export function HeroSection() {
  return (
    <section className="pt-16 pb-8 px-6 md:px-12">
      <div className="max-w-5xl mx-auto text-center">
        {/* Joined Badge */}
        <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-border/50 rounded-full py-2 px-4 mb-8 shadow-sm">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
                alt="User avatar"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
                alt="User avatar"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face"
                alt="User avatar"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <span className="text-sm font-medium text-foreground">
            1k+ joined
          </span>
        </div>

        {/* Main Headline */}
        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight tracking-tight mb-6 text-balance"
          style={{ fontFamily: "var(--font-unbounded)" }}
        >
          Linkaïa : Where Trust Builds Tomorrow.
        </h1>

        {/* Subtitle */}
        <p
          className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed tracking-wide"
          style={{
            fontFamily: "var(--font-montserrat)",
            letterSpacing: "0.02em",
          }}
        >
          Le premier réseau social hybride qui unit les cœurs et les ambitions à
          travers les frontières. Rencontres sérieuses ou impact social :
          construisez l&apos;avenir sur une base de confiance absolue.
        </p>

        {/* CTA Button */}
        <Button
          size="lg"
          className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-8 py-6 text-base font-medium shadow-lg"
        >
          Get a demo
        </Button>
      </div>
    </section>
  );
}
