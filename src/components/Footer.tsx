import Image from "next/image";
import Link from "next/link";

const navigation = {
  platform: [
    { name: "Individuals", href: "#" },
    { name: "Organizations", href: "#" },
    { name: "Gamification", href: "#" },
    { name: "Pricing", href: "#" },
  ],
  resources: [
    { name: "Blog", href: "#" },
    { name: "Trust Center", href: "#" },
    { name: "Support", href: "#" },
    { name: "Contact", href: "#" },
  ],
  legal: [
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Cookie Policy", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-white border-t border-border pt-16 pb-8 px-6 md:px-12">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-14">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-5">
              <div className="flex w-8 h-8 items-center justify-center rounded-lg overflow-hidden">
                <Image
                  src="/images/fuck.png"
                  alt="Linkaïa Logo"
                  width={32}
                  height={64}
                  className="object-contain h-full w-auto"
                />
              </div>
              <span
                className="text-lg font-bold"
                style={{
                  fontFamily: "var(--font-unbounded)",
                  fontSize: "0.95rem",
                }}
              >
                Linkaïa
              </span>
            </div>
            <p
              className="text-sm text-muted-foreground mb-6 leading-relaxed"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              Connecting the world through trust, transparency, and tangible
              social impact.
            </p>
            {/* Socials */}
            <div className="flex gap-3">
              <Link
                href="#"
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-[#155dfc] hover:border-transparent hover:text-white transition-all duration-200"
              >
                <span className="sr-only">Twitter</span>
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
              <Link
                href="#"
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-[#155dfc] hover:border-transparent hover:text-white transition-all duration-200"
              >
                <span className="sr-only">LinkedIn</span>
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    clipRule="evenodd"
                    d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
                    fillRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3
              className="text-xs font-bold uppercase tracking-[0.15em] mb-5 text-foreground"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              Platform
            </h3>
            <ul className="space-y-3">
              {navigation.platform.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3
              className="text-xs font-bold uppercase tracking-[0.15em] mb-5 text-foreground"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              Resources
            </h3>
            <ul className="space-y-3">
              {navigation.resources.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3
              className="text-xs font-bold uppercase tracking-[0.15em] mb-5 text-foreground"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              Legal
            </h3>
            <ul className="space-y-3">
              {navigation.legal.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p
            className="text-sm text-muted-foreground"
            style={{ fontFamily: "var(--font-montserrat)" }}
          >
            © 2026 Linkaïa Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: "#fbc7a8" }}
            />
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: "#96d3cd" }}
            />
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: "#155dfc" }}
            />
            <span
              className="text-sm text-muted-foreground ml-2"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              English (US)
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
