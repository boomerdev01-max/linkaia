import Image from "next/image";

const testimonials = [
  {
    quote:
      "Finally, a social network where I know my contributions are actually reaching the people in need. The transparency reports are game changers.",
    name: "Sarah Jenkins",
    role: "Individual Member",
    avatar: "/images/linka8.png",
    accentColor: "#fbc7a8",
  },
  {
    quote:
      "Linkaïa has transformed how we recruit volunteers. The verification system saves us hundreds of hours of vetting time.",
    name: "David Chen",
    role: "Director at EcoGuardians",
    avatar: "/images/linka9.png",
    accentColor: "#155dfc",
  },
  {
    quote:
      "The gamification elements make giving back fun and competitive in a healthy way. I love earning badges for my profile!",
    name: "Elena Rodriguez",
    role: "Student Activist",
    avatar: "/images/linka10.png",
    accentColor: "#96d3cd",
  },
];

function StarRating() {
  return (
    <div className="flex items-center gap-1 mb-5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className="w-4 h-4" fill="#fbc7a8" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section
      className="py-24 px-6 md:px-12"
      style={{ backgroundColor: "rgba(150,211,205,0.08)" }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span
            className="inline-block text-xs font-bold uppercase tracking-[0.2em] mb-4 px-3 py-1 rounded-full border"
            style={{
              color: "#155dfc",
              borderColor: "rgba(21,93,252,0.2)",
              backgroundColor: "rgba(21,93,252,0.04)",
              fontFamily: "var(--font-montserrat)",
            }}
          >
            Community voices
          </span>
          <h2
            className="text-3xl md:text-4xl font-bold text-foreground mb-3"
            style={{ fontFamily: "var(--font-unbounded)" }}
          >
            Voices of the community
          </h2>
          <p
            className="text-muted-foreground"
            style={{ fontFamily: "var(--font-montserrat)" }}
          >
            Join thousands of individuals and NGOs making a difference.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-white p-8 rounded-2xl flex flex-col border border-border/50 relative overflow-hidden group hover:shadow-lg transition-shadow duration-300"
            >
              {/* Top accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                style={{ backgroundColor: t.accentColor }}
              />

              {/* Big quote mark */}
              <span
                className="absolute top-3 right-5 text-8xl leading-none font-serif opacity-10 select-none"
                style={{ color: t.accentColor }}
              >
                &quot;
              </span>

              <StarRating />

              <p
                className="text-foreground mb-6 italic grow text-sm leading-relaxed relative z-10"
                style={{ fontFamily: "var(--font-montserrat)" }}
              >
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3 relative z-10">
                <div
                  className="w-11 h-11 rounded-full overflow-hidden relative shrink-0"
                  style={{ boxShadow: `0 0 0 2px ${t.accentColor}` }}
                >
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4
                    className="font-bold text-sm text-foreground"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    {t.name}
                  </h4>
                  <p
                    className="text-xs text-muted-foreground"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    {t.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
