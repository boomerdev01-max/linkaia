import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function MultiUniverseSection() {
  return (
    <section
      className="py-24 px-6 md:px-12"
      style={{ backgroundColor: "rgba(150,211,205,0.08)" }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-14">
          <span
            className="inline-block text-xs font-bold uppercase tracking-[0.2em] mb-4 px-3 py-1 rounded-full border"
            style={{
              color: "#155dfc",
              borderColor: "rgba(21,93,252,0.2)",
              backgroundColor: "rgba(21,93,252,0.04)",
              fontFamily: "var(--font-montserrat)",
            }}
          >
            Two worlds, one platform
          </span>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <h2
              className="text-3xl md:text-4xl font-bold text-foreground max-w-xl"
              style={{ fontFamily: "var(--font-unbounded)" }}
            >
              A multi-universe experience
            </h2>
            <p
              className="text-muted-foreground max-w-xs text-sm leading-relaxed md:text-right"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              Tailored tools designed specifically for the two pillars of our community.
            </p>
          </div>
        </div>

        {/* Two cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* For Individuals */}
          <div className="rounded-2xl overflow-hidden bg-white border border-border flex flex-col">
            <div className="h-56 w-full relative">
              <Image
                src="/images/linka5.png"
                alt="Friends laughing outdoors"
                fill
                className="object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(251,199,168,0.6) 0%, transparent 60%)",
                }}
              />
            </div>
            <div className="p-8 flex flex-col grow">
              <span
                className="inline-block self-start mb-4 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full"
                style={{
                  backgroundColor: "rgba(251,199,168,0.3)",
                  color: "#c26a30",
                  fontFamily: "var(--font-montserrat)",
                }}
              >
                For people
              </span>
              <h3
                className="text-xl font-bold text-foreground mb-3"
                style={{ fontFamily: "var(--font-unbounded)", fontSize: "1.1rem" }}
              >
                For individuals
              </h3>
              <p
                className="text-muted-foreground text-sm leading-relaxed mb-8 grow"
                style={{ fontFamily: "var(--font-montserrat)" }}
              >
                Discover causes that ignite your passion, meet like-minded peers, volunteer for
                events, and build a verified profile of your social contributions.
              </p>
              <Button
                asChild
                className="self-start rounded-full text-white text-sm px-6"
                style={{ backgroundColor: "#155dfc" }}
              >
                <Link href="/signup">Join as individual</Link>
              </Button>
            </div>
          </div>

          {/* For Organizations */}
          <div className="rounded-2xl overflow-hidden bg-white border border-border flex flex-col">
            <div className="h-56 w-full relative">
              <Image
                src="/images/linka6.png"
                alt="Organization team working"
                fill
                className="object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(150,211,205,0.6) 0%, transparent 60%)",
                }}
              />
            </div>
            <div className="p-8 flex flex-col grow">
              <span
                className="inline-block self-start mb-4 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full"
                style={{
                  backgroundColor: "rgba(150,211,205,0.3)",
                  color: "#2a7d78",
                  fontFamily: "var(--font-montserrat)",
                }}
              >
                For organizations
              </span>
              <h3
                className="text-xl font-bold text-foreground mb-3"
                style={{ fontFamily: "var(--font-unbounded)", fontSize: "1.1rem" }}
              >
                For organizations
              </h3>
              <p
                className="text-muted-foreground text-sm leading-relaxed mb-8 grow"
                style={{ fontFamily: "var(--font-montserrat)" }}
              >
                Manage volunteers, run campaigns, publish impact reports, and connect with a
                verified community of changemakers ready to support your mission.
              </p>
              <Button
                asChild
                variant="outline"
                className="self-start rounded-full text-sm px-6 border-foreground"
              >
                <Link href="/signup/company">Create organization account</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}