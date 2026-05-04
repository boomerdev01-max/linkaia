import Image from "next/image"
import { Button } from "@/components/ui/button"

export function GamificationSection() {
  return (
    <section className="py-24 px-6 md:px-12 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Visual collage */}
          <div className="order-2 lg:order-1 grid grid-cols-2 gap-4">
            {/* Badge cards */}
            <div className="space-y-4">
              {/* Community Hero badge */}
              <div
                className="bg-white p-4 rounded-2xl shadow-lg border-l-4 transform -rotate-2 hover:rotate-0 transition-transform duration-300"
                style={{ borderLeftColor: "#fbc7a8" }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="p-2 rounded-full"
                    style={{ backgroundColor: "rgba(251,199,168,0.2)", color: "#c26a30" }}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <span
                    className="text-sm font-bold text-foreground"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    Community Hero
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full w-3/4"
                    style={{ backgroundColor: "#fbc7a8" }}
                  />
                </div>
              </div>

              {/* Live Fundraiser badge */}
              <div
                className="bg-white p-4 rounded-2xl shadow-lg border-l-4 transform rotate-2 hover:rotate-0 transition-transform duration-300"
                style={{ borderLeftColor: "#155dfc" }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="p-2 rounded-full"
                    style={{ backgroundColor: "rgba(21,93,252,0.08)", color: "#155dfc" }}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h1v-2h-1zm-2-2H7v4h6v-4zm2 0h1V9h-1v2zm1-4V5h-1v2h1zM5 5v2H4V5h1zm0 4H4v2h1V9zm-1 4h1v2H4v-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span
                    className="text-sm font-bold text-foreground"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    Live Fundraiser
                  </span>
                </div>
                <p
                  className="text-xs text-muted-foreground"
                  style={{ fontFamily: "var(--font-montserrat)" }}
                >
                  Currently hosting 1.2k viewers
                </p>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4 mt-6">
              {/* Top Donor badge */}
              <div
                className="bg-white p-4 rounded-2xl shadow-lg border-l-4 transform rotate-[4deg] hover:rotate-0 transition-transform duration-300"
                style={{ borderLeftColor: "#96d3cd" }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="p-2 rounded-full"
                    style={{ backgroundColor: "rgba(150,211,205,0.2)", color: "#2a7d78" }}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span
                    className="text-sm font-bold text-foreground"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    Top Donor
                  </span>
                </div>
                <p
                  className="text-xs text-muted-foreground"
                  style={{ fontFamily: "var(--font-montserrat)" }}
                >
                  Donated to 5 causes this month
                </p>
              </div>

              {/* Photo card */}
              <div className="rounded-2xl overflow-hidden shadow-lg h-32 w-full transform -rotate-2 hover:rotate-0 transition-transform duration-300 relative">
                <Image
                  src="/images/linka7.png"
                  alt="Friends celebrating"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* Right — Text content */}
          <div className="order-1 lg:order-2">
            <span
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] mb-6 px-3 py-1 rounded-full border"
              style={{
                color: "#155dfc",
                borderColor: "rgba(21,93,252,0.2)",
                backgroundColor: "rgba(21,93,252,0.04)",
                fontFamily: "var(--font-montserrat)",
              }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              Gamification &amp; Live
            </span>

            <h2
              className="text-3xl md:text-4xl font-bold text-foreground mb-6"
              style={{ fontFamily: "var(--font-unbounded)" }}
            >
              Earn trust badges &amp; go live
            </h2>

            <p
              className="text-muted-foreground mb-8 leading-relaxed"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              Engage with communities in real-time and gamify your social impact journey. Every
              hour volunteered and every dollar donated earns you recognition on your verified
              profile.
            </p>

            <ul className="space-y-4 mb-10">
              {[
                "Unlock achievement badges for impact milestones",
                "Host live streams to advocate for your cause",
                "Compete in global impact leaderboards",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(21,93,252,0.1)" }}
                  >
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      style={{ color: "#155dfc" }}
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <span
                    className="text-foreground text-sm leading-relaxed"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <Button
              className="rounded-full text-white px-8"
              style={{ backgroundColor: "#155dfc" }}
            >
              Explore Gamification
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}