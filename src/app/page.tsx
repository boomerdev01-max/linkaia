import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-foreground dark:text-white antialiased overflow-x-hidden selection:bg-primary selection:text-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border dark:border-border-dark bg-white/80 dark:bg-background-dark/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex w-8 items-center justify-center rounded-lg overflow-hidden">
              <Image
                src="/images/fuck.png"
                alt="Linkaïa Logo"
                width={32}
                height={64} // hauteur plus grande pour respecter le ratio vertical
                className="object-contain h-full w-auto"
              />
            </div>

            <h1 className="text-xl font-bold tracking-tight">Linkaïa</h1>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="#about"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              About
            </Link>
            <Link
              href="#ngos"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              For organizations
            </Link>
            <Link
              href="#people"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              For people
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex"
              asChild
            >
              <Link href="/signin">Login</Link>
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary-dark"
              asChild
            >
              <Link href="/signup">Join Linkaïa</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-auto">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              <div className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                  Connect with trust, <br />
                  <span className="text-primary">impact the world.</span>
                </h1>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  The hybrid social network bridging individuals and
                  organizations across borders. Verify your identity, join
                  trusted communities, and track your social impact in
                  real-time.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary-dark shadow-lg shadow-primary/25 transition-all transform hover:-translate-y-0.5"
                    asChild
                  >
                    <Link href="/signup">Join as individual</Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-border hover:border-primary"
                    asChild
                  >
                    <Link href="/signup/company">Create organization account</Link>
                  </Button>
                </div>
                <div className="mt-10 flex items-center justify-center lg:justify-start gap-4 text-sm text-muted-foreground">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-muted border-2 border-background overflow-hidden">
                      <Image
                        src="/images/linka4.png"
                        alt="User"
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-muted border-2 border-background overflow-hidden">
                      <Image
                        src="/images/linka2.png"
                        alt="User"
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-muted border-2 border-background overflow-hidden">
                      <Image
                        src="/images/linka3.png"
                        alt="User"
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <p>Join 10,000+ Changemakers</p>
                </div>
              </div>
              <div className="relative lg:h-auto">
                <div className="aspect-4/3 w-full rounded-2xl bg-muted overflow-hidden shadow-2xl relative">
                  <Image
                    src="/images/linka1.png"
                    alt="Group of diverse people working together"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 p-4 bg-card/95 backdrop-blur rounded-xl shadow-lg border border-border flex items-center gap-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                        Trusted Partner
                      </p>
                      <p className="text-sm font-bold">
                        Global relief initiative verified
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-20 bg-card">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold sm:text-4xl mb-4">
                Trust at the core
              </h2>
              <p className="text-lg text-muted-foreground">
                We&apos;ve rebuilt social networking on a foundation of
                verification and transparency, ensuring every connection is real
                and every impact is tracked.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="group p-8 rounded-2xl bg-background border border-transparent hover:border-primary/20 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Verified profiles</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Mandatory identity verification ensures you connect with real
                  people and legitimate organizations, eliminating bots and
                  fraud.
                </p>
              </div>

              <div className="group p-8 rounded-2xl bg-background border border-transparent hover:border-primary/20 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path
                      fillRule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Transparent impact</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Track where your donations go and see the real-world outcome
                  of your volunteering with our open impact ledger.
                </p>
              </div>

              <div className="group p-8 rounded-2xl bg-background border border-transparent hover:border-primary/20 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Secure data</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Your data belongs to you. We use end-to-end encryption and
                  give you granular control over who sees your information.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Multi-Universe Section */}
        <section className="py-24 bg-muted/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold sm:text-4xl mb-4">
                  A multi-universe experience
                </h2>
                <p className="text-lg text-muted-foreground">
                  Tailored tools designed specifically for the two pillars of
                  our community.
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Individual Universe */}
              <div className="relative overflow-hidden rounded-2xl bg-card shadow-sm border border-border flex flex-col h-full">
                <div className="h-64 w-full relative">
                  <Image
                    src="/images/linka5.png"
                    alt="Friends laughing outdoors"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-8 flex flex-col grow">
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs font-bold tracking-wide uppercase">
                      For people
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">For individuals</h3>
                  <p className="text-muted-foreground mb-8 grow">
                    Discover causes that ignite your passion, meet like-minded
                    peers, volunteer for events, and build a verified profile of
                    your social contributions.
                  </p>
                  <Link
                    href="#"
                    className="inline-flex items-center text-primary font-bold hover:gap-2 transition-all"
                  >
                    Explore individual features
                    <svg
                      className="w-5 h-5 ml-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Org Universe */}
              <div className="relative overflow-hidden rounded-2xl bg-card shadow-sm border border-border flex flex-col h-full">
                <div className="h-64 w-full relative">
                  <Image
                    src="/images/linka6.png"
                    alt="Team meeting in modern office"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-8 flex flex-col grow">
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold tracking-wide uppercase">
                      For NGOs &amp; Companies
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">For organizations</h3>
                  <p className="text-muted-foreground mb-8 grow">
                    Recruit verified talent, manage your community, fundraise
                    securely, and showcase your Corporate Social Responsibility
                    (CSR) impact.
                  </p>
                  <Link
                    href="#"
                    className="inline-flex items-center text-primary font-bold hover:gap-2 transition-all"
                  >
                    Explore organization features
                    <svg
                      className="w-5 h-5 ml-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gamification Section */}
        <section className="py-24 bg-primary/10 dark:bg-primary/5">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4 mt-8">
                    <div className="bg-card p-4 rounded-xl shadow-lg border-l-4 border-secondary transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-secondary/10 rounded-full text-secondary">
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                        <span className="text-sm font-bold">
                          Community Hero
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-secondary w-3/4" />
                      </div>
                    </div>
                    <div className="bg-card p-4 rounded-xl shadow-lg border-l-4 border-primary transform rotate-2 hover:rotate-0 transition-transform duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-full text-primary">
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h1v-2h-1zm-2-2H7v4h6v-4zm2 0h1V9h-1v2zm1-4V5h-1v2h1zM5 5v2H4V5h1zm0 4H4v2h1V9zm-1 4h1v2H4v-2z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <span className="text-sm font-bold">
                          Live Fundraiser
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Currently hosting 1.2k viewers
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-card p-4 rounded-xl shadow-lg border-l-4 border-accent transform rotate-[4deg] hover:rotate-0 transition-transform duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-accent/10 rounded-full text-accent">
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <span className="text-sm font-bold">Top Donor</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Donated to 5 causes this month
                      </p>
                    </div>
                    <div className="rounded-xl shadow-lg object-cover h-32 w-full transform -rotate-2 hover:rotate-0 transition-transform duration-300 relative overflow-hidden">
                      <Image
                        src="/images/linka7.png"
                        alt="Friends celebrating"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-6">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Gamification &amp; Live
                </div>
                <h2 className="text-4xl font-extrabold mb-6">
                  Earn trust badges &amp; go live
                </h2>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  Engage with communities in real-time and gamify your social
                  impact journey. Every hour volunteered and every dollar
                  donated earns you recognition on your verified profile.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-primary shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Unlock achievement badges for impact milestones</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-primary shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Host live streams to advocate for your cause</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-primary shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Compete in global impact leaderboards</span>
                  </li>
                </ul>
                <Button
                  size="lg"
                  className="bg-primary-dark hover:bg-primary-dark/90"
                >
                  Explore Gamification
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 bg-card">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold sm:text-4xl mb-4">
                Voices of the community
              </h2>
              <p className="text-muted-foreground">
                Join thousands of individuals and NGOs making a difference.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="bg-background p-8 rounded-2xl flex flex-col">
                <div className="flex items-center gap-1 text-secondary mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-foreground mb-6 italic grow">
                  &quot;Finally, a social network where I know my contributions
                  are actually reaching the people in need. The transparency
                  reports are game changers.&quot;
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden relative bg-muted">
                    <Image
                      src="/images/linka8.png"
                      alt="Sarah Jenkins"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold">Sarah Jenkins</h4>
                    <p className="text-sm text-muted-foreground">
                      Individual Member
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-background p-8 rounded-2xl flex flex-col relative overflow-hidden">
                <span className="absolute top-4 right-6 text-9xl leading-none text-muted/20 font-serif opacity-50 z-0">
                  &quot;
                </span>
                <div className="flex items-center gap-1 text-secondary mb-4 z-10 relative">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-foreground mb-6 italic grow z-10 relative">
                  &quot;Linkaïa has transformed how we recruit volunteers. The
                  verification system saves us hundreds of hours of vetting
                  time.&quot;
                </p>
                <div className="flex items-center gap-4 z-10 relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden relative bg-muted">
                    <Image
                      src="/images/linka9.png"
                      alt="David Chen"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold">David Chen</h4>
                    <p className="text-sm text-muted-foreground">
                      Director at EcoGuardians
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-background p-8 rounded-2xl flex flex-col">
                <div className="flex items-center gap-1 text-secondary mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-foreground mb-6 italic grow">
                  &quot;The gamification elements make giving back fun and
                  competitive in a healthy way. I love earning badges for my
                  profile!&quot;
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden relative bg-muted">
                    <Image
                      src="/images/linka10.png"
                      alt="Elena Rodriguez"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold">Elena Rodriguez</h4>
                    <p className="text-sm text-muted-foreground">
                      Student Activist
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-primary-dark text-white relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="mx-auto max-w-4xl px-4 text-center relative z-10">
            <h2 className="text-3xl sm:text-5xl font-bold mb-6 tracking-tight">
              Ready to make an impact?
            </h2>
            <p className="text-lg sm:text-xl text-gray-200 mb-10 max-w-2xl mx-auto">
              Join the global network where trust enables action. Start your
              journey today as an individual or organization.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-primary-dark hover:bg-gray-100"
                asChild
              >
                <Link href="/signup">Get Started Now</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-[#0F4C5C] hover:bg-gray-100"
                asChild
              >
                <Link href="#contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-border pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex w-8 items-center justify-center rounded-lg overflow-hidden">
              <Image
                src="/images/fuck.png"
                alt="Linkaïa Logo"
                width={32}
                height={64} // hauteur plus grande pour respecter le ratio vertical
                className="object-contain h-full w-auto"
              />
            </div>
                <h2 className="text-lg font-bold">Linkaïa</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Connecting the world through trust, transparency, and tangible
                social impact.
              </p>
              <div className="flex gap-4">
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <span className="sr-only">Twitter</span>
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </Link>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <span className="sr-only">LinkedIn</span>
                  <svg
                    className="h-5 w-5"
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
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4">
                Platform
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Individuals
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Organizations
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Gamification
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4">
                Resources
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Trust Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Support
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4">
                Legal
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 Linkaïa Inc. All rights reserved.
            </p>
            <div className="flex gap-4">
              <span className="text-sm text-muted-foreground">
                English (US)
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
