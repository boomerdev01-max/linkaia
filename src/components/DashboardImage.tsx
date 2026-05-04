import Image from "next/image";

export function DashboardImage() {
  return (
    <section className="px-6 md:px-12 pt-12 pb-24">
      <div className="max-w-5xl mx-auto">
        <Image
          src="/images/linkaia-pitch-high.png"
          alt="Linkaïa dashboard interface"
          width={1200}
          height={800}
          className="w-full h-auto"
          priority
        />
      </div>
    </section>
  );
}
