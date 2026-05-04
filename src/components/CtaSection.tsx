import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  return (
    <section className="py-24 px-6 md:px-12 relative overflow-hidden bg-white">
      {/* Background blobs mirroring the hero */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute -left-20 bottom-0 w-[60%] h-full opacity-60"
          style={{
            background:
              "radial-gradient(ellipse at 20% 80%, #f9a87c 0%, #fcc9a8 25%, #fde4d0 45%, transparent 70%)",
          }}
        />
        <div
          className="absolute -right-20 bottom-0 w-[60%] h-full opacity-60"
          style={{
            background:
              "radial-gradient(ellipse at 80% 80%, #6dd3c8 0%, #a0e4de 25%, #cff2ee 45%, transparent 70%)",
          }}
        />
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[50%] h-[80%] opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at 50% 90%, #f5d4b8 0%, #e8ece0 30%, transparent 65%)",
          }}
        />
      </div>

      <div className="max-w-3xl mx-auto text-center">
        {/* Badge */}
        <span
          className="inline-block text-xs font-bold uppercase tracking-[0.2em] mb-6 px-3 py-1 rounded-full border"
          style={{
            color: "#155dfc",
            borderColor: "rgba(21,93,252,0.2)",
            backgroundColor: "rgba(255,255,255,0.8)",
            fontFamily: "var(--font-montserrat)",
          }}
        >
          Start today
        </span>

        <h2
          className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight"
          style={{ fontFamily: "var(--font-unbounded)" }}
        >
          Ready to make an impact?
        </h2>

        <p
          className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed"
          style={{ fontFamily: "var(--font-montserrat)" }}
        >
          Join the global network where trust enables action. Start your journey today as an
          individual or organization.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="rounded-full text-white px-10 shadow-lg"
            style={{ backgroundColor: "#155dfc" }}
            asChild
          >
            <Link href="/signup">Get Started Now</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full px-10 border-foreground/30 bg-white/70 backdrop-blur-sm"
            asChild
          >
            <Link href="#contact">Contact Sales</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}