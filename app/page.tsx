import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

const navLinks = ["Home", "Drive & Earn", "About", "Contact"];

const stats = [
  { number: "300+", label: "Happy Customers" },
  { number: "200+", label: "Successful Moves Completed" },
  { number: "40+", label: "Partnered Drivers" },
  { number: "95%", label: "Positive Feedback" },
];

const vehicles = [
  {
    image: "/assets/truck.svg",
    title: "Medium Truck",
    capacity: "27,000kg max",
    description: "Suitable for moving items like electronics, retail products, and bulk packages.",
  },
  {
    image: "/assets/van.svg",
    title: "Van",
    capacity: "2,400kg max",
    description: "Suitable for light and bulky items like refrigerators, washing machines, and furniture.",
  },
  {
    image: "/assets/car.svg",
    title: "Compact Car",
    capacity: "150kg max",
    description: "Suitable for items that fit in a car boot like bags, shoes, and small parcels.",
  },
];

const steps = [
  {
    title: "Download the sphere app",
    description: "Get started with our tech-enabled logistics platform.",
  },
  {
    title: "Choose your vehicle type",
    description: "Select from van, truck, and car options based on your load and cargo needs.",
  },
  {
    title: "Set your price",
    description: "Drivers can accept your price or make a counter offer.",
  },
  {
    title: "Driver selection",
    description: "View profiles, ratings, and confirm instantly.",
  },
];

const driveBenefits = [
  "Earn as you go, keeping the majority of your pay.",
  "Flexible hours to suit your lifestyle.",
  "Quick approval process to start earning right away.",
];

const testimonials = [
  {
    quote:
      "Sphere made my house move so smooth. I booked a truck in minutes and had zero stress!",
    name: "Chinedu Okeke",
    city: "Lagos",
  },
  {
    quote:
      "I've used sphere twice for office moves. Great service and always on time.",
    name: "Tunde Adeyemi",
    city: "Lagos",
  },
  {
    quote:
      "Moving a lot of goods at once from my shop to warehouse has never been this easy. Highly recommend!",
    name: "Funke",
    city: "Lagos",
  },
];

function SectionTitle({
  title,
  subtitle,
}: {
  title: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-[760px] text-center">
      <h2 className="text-balance text-[clamp(2rem,3.8vw,3.25rem)] font-extrabold leading-[1.08] tracking-[-0.02em]">
        {title}
      </h2>
      {subtitle ? (
        <p className="mx-auto mt-3 max-w-[640px] text-sm leading-relaxed text-slate-600 md:text-[0.95rem]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export default function Home() {
  return (
    <main className="overflow-x-hidden bg-sphere-page text-slate-800">
      <header className="relative isolate min-h-[620px] overflow-hidden text-white md:min-h-[700px]">
        <div className="absolute inset-0 -z-20">
          <Image
            src="/assets/hero-trucks.png"
            alt="Fleet of trucks"
            fill
            priority
            className="object-cover object-center"
          />
        </div>
        <div className="hero-overlay absolute inset-0 -z-10" />

        <div className="mx-auto w-[min(1120px,92vw)]">
          <nav className="flex h-[76px] items-center justify-between pt-1">
            <a className="inline-flex items-center gap-2 text-[0.92rem] font-bold" href="#">
              <span className="relative h-[14px] w-[14px] rounded-full border border-white">
                <span className="absolute left-1/2 top-1/2 h-[1.7px] w-[7px] -translate-x-1/2 -translate-y-1/2 -rotate-[32deg] bg-white" />
              </span>
              Sphere
            </a>

            <ul className="hidden items-center gap-7 text-[11px] font-medium md:flex">
              {navLinks.map((link) => (
                <li key={link}>
                  <a className="text-white/90 transition hover:text-white" href="#">
                    {link}
                  </a>
                </li>
              ))}
            </ul>

            <a
              href="#download"
              className="inline-flex rounded-[11px] bg-white px-4 py-2 text-[11px] font-semibold text-sphere-blue shadow-[0_8px_20px_rgba(8,22,34,0.25)] transition hover:-translate-y-0.5"
            >
              Download the app
            </a>
          </nav>

          <div className="max-w-[700px] pb-16 pt-16 md:pt-24">
            <h1 className="text-balance text-[clamp(2.2rem,5.35vw,4.25rem)] font-extrabold leading-[1.04] tracking-[-0.03em]">
              Fast, Reliable, and <span className="hero-marker">Affordable</span>
              <br />
              <span className="hero-marker">Logistics</span> – On Your Terms
            </h1>
            <p className="mt-4 max-w-[530px] text-[0.97rem] leading-[1.6] text-white/92">
              Choose the right vehicle for your package, place a request, and receive
              competitive bids from trusted drivers. Fast, affordable, and stress-free
              logistics at your fingertips.
            </p>
            <a
              href="#download"
              className="mt-6 inline-flex rounded-[11px] bg-white px-5 py-3 text-sm font-bold text-sphere-blue transition hover:-translate-y-0.5"
            >
              Download the app
            </a>
          </div>
        </div>
      </header>

      <section className="py-20 md:py-24">
        <div className="mx-auto w-[min(1120px,92vw)]">
          <SectionTitle
            title={<span className="marker">Reliable, Proven, and Growing</span>}
            subtitle="With hundreds of successful moves completed and an expanding community of satisfied users and drivers, Sphere is quickly becoming the go-to solution for bulk logistics."
          />

          <div className="mt-10 grid grid-cols-2 gap-y-8 text-center md:grid-cols-4 md:gap-x-4">
            {stats.map((item) => (
              <article key={item.label}>
                <h3 className="text-5xl font-extrabold leading-none tracking-[-0.02em] md:text-[3.4rem]">
                  {item.number}
                </h3>
                <p className="mt-2 text-xs text-slate-600 md:text-sm">{item.label}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20 md:pb-24">
        <div className="mx-auto w-[min(1120px,92vw)]">
          <SectionTitle
            title={
              <>
                The <span className="marker">perfect Vehicle</span> For You
              </>
            }
            subtitle="The perfect vehicle for your delivery needs. Each option comes with a carefully selected tonnage and use-case for your intended move."
          />

          <div className="mt-8 grid gap-4 text-left md:grid-cols-3">
            {vehicles.map((vehicle, index) => (
              <article
                key={vehicle.title}
                className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-sphere-card shadow-card"
              >
                <span className={`vehicle-doodle vehicle-doodle-${index + 1}`} aria-hidden />
                <div className="bg-[#e4ebf5]">
                  <Image
                    src={vehicle.image}
                    alt={vehicle.title}
                    width={520}
                    height={260}
                    className="h-auto w-full"
                  />
                </div>
                <div className="px-4 pb-4 pt-3">
                  <h3 className="text-[1.15rem] font-bold leading-snug">
                    {vehicle.title} ({vehicle.capacity})
                  </h3>
                  <p className="mt-2 text-[0.86rem] leading-relaxed text-slate-600">{vehicle.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20 md:pb-24">
        <div className="mx-auto w-[min(1120px,92vw)]">
          <SectionTitle
            title={<span className="marker">How it works</span>}
            subtitle="Download, book, and transport with drivers in just a few taps."
          />

          <div className="mt-8 grid overflow-hidden rounded-2xl border border-slate-200/80 bg-sphere-card shadow-card md:grid-cols-2">
            <div className="bg-sphere-soft">
              <Image
                src="/assets/phone-hand.svg"
                alt="Sphere app on a phone"
                width={700}
                height={560}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="bg-sphere-card p-6 md:p-7">
              <div className="space-y-4">
                {steps.map((step, idx) => (
                  <article key={step.title} className="grid grid-cols-[34px_1fr] gap-3">
                    <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-sphere-blue text-sm font-extrabold text-white">
                      {idx + 1}
                    </span>
                    <div>
                      <h3 className="pt-0.5 text-base font-bold leading-snug">{step.title}</h3>
                      <p className="mt-1 text-[0.86rem] leading-relaxed text-slate-600">{step.description}</p>
                    </div>
                  </article>
                ))}
              </div>

              <a
                href="#download"
                className="mt-6 inline-flex rounded-[10px] bg-sphere-blue px-5 py-3 text-sm font-bold text-white transition hover:bg-sphere-dark"
              >
                Download the app
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 md:pb-24" id="drive">
        <div className="mx-auto w-[min(1120px,92vw)]">
          <SectionTitle
            title={
              <>
                <span className="marker">Drive and Earn</span> with Sphere
              </>
            }
            subtitle="Turn your vehicle into a money-making machine."
          />

          <div className="mt-8 grid items-end overflow-hidden rounded-2xl border border-slate-200/80 bg-sphere-card shadow-card md:grid-cols-2">
            <div className="p-6 md:p-8">
              <h3 className="max-w-[560px] text-3xl font-extrabold leading-tight tracking-[-0.01em] md:text-[2.1rem]">
                Turn Your Vehicle Into a Money-Making Machine
              </h3>
              <p className="mt-3 max-w-[560px] text-[0.95rem] leading-relaxed text-slate-600">
                Join Sphere&apos;s trusted driver network and start earning by helping people
                move their bulk items. Work on your schedule, keep 90% of your earnings,
                and enjoy reliable support every step of the way.
              </p>

              <ul className="mt-6 space-y-2.5">
                {driveBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2.5 text-[0.9rem]">
                    <CheckCircle2 className="mt-[2px] h-4 w-4 shrink-0 text-sphere-blue" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#download"
                className="mt-6 inline-flex rounded-[10px] bg-sphere-blue px-5 py-3 text-sm font-bold text-white transition hover:bg-sphere-dark"
              >
                Become a Driver Today
              </a>
            </div>

            <div className="relative bg-sphere-soft p-3 md:p-4">
              <div className="absolute inset-x-[12%] top-[18%] h-[62%] rounded-xl border-[7px] border-sphere-blue/80" />
              <Image
                src="/assets/driver.svg"
                alt="Driver partner"
                width={640}
                height={560}
                className="relative z-10 h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 md:pb-24">
        <div className="mx-auto w-[min(1120px,92vw)]">
          <SectionTitle
            title={
              <>
                What <span className="marker">Users</span> Are Saying
                <br />
                About <span className="marker">Sphere</span>
              </>
            }
            subtitle="Trusted by thousands and loved by all."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-[1.02fr_1fr]">
            <article className="grid min-h-[332px] content-between rounded-2xl border border-slate-200/80 bg-sphere-card p-5 shadow-card md:row-span-2">
              <p className="text-[0.98rem] leading-relaxed">{testimonials[0].quote}</p>
              <div>
                <h3 className="text-base font-bold">{testimonials[0].name}</h3>
                <span className="text-[0.82rem] text-slate-600">{testimonials[0].city}</span>
              </div>
            </article>

            {testimonials.slice(1).map((item) => (
              <article
                key={item.name}
                className="grid min-h-[158px] content-between rounded-2xl border border-slate-200/80 bg-sphere-card p-5 shadow-card"
              >
                <p className="text-[0.96rem] leading-relaxed">{item.quote}</p>
                <div>
                  <h3 className="text-base font-bold">{item.name}</h3>
                  <span className="text-[0.82rem] text-slate-600">{item.city}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-sphere-blue py-16 text-white md:py-20" id="download">
        <span className="cta-layer cta-layer-left" aria-hidden />
        <span className="cta-layer cta-layer-right" aria-hidden />
        <span className="cta-ring" aria-hidden />

        <div className="relative z-10 mx-auto grid w-[min(1120px,92vw)] items-end gap-8 md:grid-cols-[1fr_280px]">
          <div>
            <h2 className="max-w-[510px] text-balance text-[clamp(2rem,3.8vw,3.1rem)] font-extrabold leading-[1.08] tracking-[-0.02em]">
              Ready to Move with Sphere?
            </h2>
            <p className="mt-3 max-w-[560px] text-[0.95rem] leading-relaxed text-white/90">
              Whether it&apos;s your home, office, or business, Sphere makes moving your goods
              or belongings simple, reliable, and stress-free.
            </p>
            <a
              href="#"
              className="mt-6 inline-flex rounded-[10px] bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:-translate-y-0.5"
            >
              Download the app
            </a>
          </div>

          <Image
            src="/assets/app-phone.svg"
            alt="Sphere app on phone"
            width={420}
            height={640}
            className="h-auto w-full"
          />
        </div>
      </section>

      <footer className="relative overflow-hidden py-14 md:py-16">
        <div className="mx-auto grid w-[min(1120px,92vw)] gap-8 border-t border-slate-300/70 pt-11 md:grid-cols-[1.2fr_0.7fr_0.8fr]">
          <div>
            <a
              className="inline-flex items-center gap-2 text-[clamp(1.85rem,4vw,3.2rem)] font-bold text-sphere-blue"
              href="#"
            >
              <span className="relative h-[34px] w-[34px] rounded-full border-2 border-sphere-blue">
                <span className="absolute left-1/2 top-1/2 h-[2px] w-3.5 -translate-x-1/2 -translate-y-1/2 -rotate-[30deg] bg-sphere-blue" />
              </span>
              Sphere
            </a>
            <p className="mt-1 text-sm text-slate-600">Leading tech logistics solutions and services.</p>
            <p className="text-sm text-slate-600">Proudly built for Africa.</p>
          </div>

          <div className="grid content-start gap-2 text-sm">
            <a href="#">Home</a>
            <a href="#">Earn &amp; Drive</a>
            <a href="#">About</a>
            <a href="#">Contact</a>
          </div>

          <div className="grid content-start gap-2 text-sm">
            <a href="#">Riders&apos; Privacy Policy</a>
            <a href="#">Users&apos; Privacy Policy</a>
            <a href="#">Speak with Someone</a>
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-10 w-[min(1120px,92vw)] text-center">
          <div className="inline-flex gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sphere-blue text-[10px] font-bold text-white">
              x
            </span>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sphere-blue text-[10px] font-bold text-white">
              in
            </span>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sphere-blue text-[10px] font-bold text-white">
              ig
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-600">(c) 2026 Sphere. All rights reserved.</p>
        </div>

        <div className="pointer-events-none absolute bottom-[-76px] left-0 w-full text-center text-[clamp(5rem,19vw,14rem)] font-extrabold tracking-[0.04em] text-sphere-blue/10">
          SPHERE
        </div>
      </footer>
    </main>
  );
}
