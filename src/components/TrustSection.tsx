const trustFeatures = [
  {
    title: "Verified profiles",
    description:
      "Mandatory identity verification ensures you connect with real people and legitimate organizations, eliminating bots and fraud.",
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    title: "Transparent impact",
    description:
      "Track where your donations go and see the real-world outcome of your volunteering with our open impact ledger.",
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path
          fillRule="evenodd"
          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    title: "Secure data",
    description:
      "Your data belongs to you. We use end-to-end encryption and give you granular control over who sees your information.",
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
];

export function TrustSection() {
  return (
    <section className="py-24 px-6 md:px-12 bg-white">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span
            className="inline-block text-xs font-bold uppercase tracking-[0.2em] mb-4 px-3 py-1 rounded-full border"
            style={{
              color: "#155dfc",
              borderColor: "rgba(21,93,252,0.2)",
              backgroundColor: "rgba(21,93,252,0.04)",
              fontFamily: "var(--font-montserrat)",
            }}
          >
            Built different
          </span>
          <h2
            className="text-3xl md:text-4xl font-bold text-foreground mb-4"
            style={{ fontFamily: "var(--font-unbounded)" }}
          >
            Trust at the core
          </h2>
          <p
            className="text-lg text-muted-foreground leading-relaxed"
            style={{ fontFamily: "var(--font-montserrat)" }}
          >
            We&apos;ve rebuilt social networking on a foundation of verification
            and transparency — ensuring every connection is real and every
            impact is tracked.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {trustFeatures.map((feature, i) => (
            <div
              key={i}
              className="group p-8 rounded-2xl bg-white border border-border hover:border-transparent transition-all duration-300 hover:shadow-xl relative overflow-hidden"
            >
              {/* Hover color wash */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(150,211,205,0.08) 0%, rgba(21,93,252,0.04) 100%)",
                }}
              />

              <div className="relative z-10">
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-all duration-300"
                  style={{
                    backgroundColor: "rgba(150,211,205,0.2)",
                    color: "#155dfc",
                  }}
                >
                  {feature.icon}
                </div>

                <h3
                  className="text-xl font-bold text-foreground mb-3"
                  style={{
                    fontFamily: "var(--font-unbounded)",
                    fontSize: "1rem",
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-muted-foreground leading-relaxed text-sm"
                  style={{ fontFamily: "var(--font-montserrat)" }}
                >
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
