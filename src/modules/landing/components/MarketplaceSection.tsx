import { motion } from "framer-motion";
import { Eye, MapPin, Radio, Search, Users } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const highlights = [
  {
    icon: Radio,
    title: "On Duty — Real-Time Visibility",
    desc: "Toggle 'On Duty' and instantly appear on the local map. Customers see who's available right now.",
  },
  {
    icon: Search,
    title: "Get Found by Profession & Location",
    desc: "Homeowners search 'plumber near me' and find you. Optimized for local discovery.",
  },
  {
    icon: Eye,
    title: "Your Profile, Always Working",
    desc: "Your card acts as a living storefront — services, reviews, portfolio, and booking — 24/7.",
  },
  {
    icon: Users,
    title: "Community Trust Signals",
    desc: "Verified badges, star ratings, and real reviews build instant credibility with new customers.",
  },
];

const marketplacePins = [
  { top: "28%", left: "24%", name: "Jake M.", role: "Plumber", active: true },
  { top: "43%", left: "56%", name: "Sarah L.", role: "Painter", active: true },
  { top: "64%", left: "39%", name: "Marco R.", role: "Electrician", active: false },
  { top: "31%", left: "74%", name: "Lisa K.", role: "Cleaner", active: true },
  { top: "72%", left: "67%", name: "Tom B.", role: "Landscaper", active: true },
];

function ThunderBayMapPreview() {
  return (
    <div className="absolute inset-0 rounded-xl overflow-hidden bg-card">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,hsl(var(--primary)/0.12),transparent_32%),radial-gradient(circle_at_74%_68%,hsl(var(--accent)/0.10),transparent_28%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.85))]" />

      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <rect width="100" height="100" style={{ fill: "hsl(var(--card))" }} />
        <path
          d="M0 0H37C44 4 48 10 49 18C50 26 46 32 42 37C37 43 33 48 31 55C28 65 31 79 36 100H0Z"
          style={{ fill: "hsl(var(--accent) / 0.16)" }}
        />
        <path
          d="M10 12C18 18 24 23 30 31C35 38 36 46 33 55"
          fill="none"
          style={{ stroke: "hsl(var(--border))" }}
          strokeWidth="0.7"
          strokeLinecap="round"
        />
        <path
          d="M23 8C34 16 44 28 49 40C53 50 57 60 66 68C74 75 83 79 95 82"
          fill="none"
          style={{ stroke: "hsl(var(--border))" }}
          strokeWidth="0.9"
          strokeLinecap="round"
        />
        <path
          d="M18 61C28 57 38 55 49 56C61 57 74 61 89 70"
          fill="none"
          style={{ stroke: "hsl(var(--border))" }}
          strokeWidth="0.8"
          strokeLinecap="round"
        />
        <path
          d="M54 23C61 29 68 34 77 39C83 42 90 44 100 45"
          fill="none"
          style={{ stroke: "hsl(var(--border))" }}
          strokeWidth="0.65"
          strokeLinecap="round"
        />
        <path
          d="M58 12C62 22 64 32 64 43C64 54 68 64 76 74"
          fill="none"
          style={{ stroke: "hsl(var(--border))" }}
          strokeWidth="0.55"
          strokeLinecap="round"
          strokeDasharray="2.5 2"
        />
        <path
          d="M70 16C73 27 74 38 78 48C82 58 88 67 96 75"
          fill="none"
          style={{ stroke: "hsl(var(--border))" }}
          strokeWidth="0.55"
          strokeLinecap="round"
          strokeDasharray="2.5 2"
        />
      </svg>

      <div className="absolute left-5 top-16 rounded-full border border-border bg-background/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground shadow-card backdrop-blur-sm">
        Thunder Bay, Ontario
      </div>
      <div className="absolute left-8 top-[36%] text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground/80">
        Lake Superior
      </div>
      <div className="absolute right-8 top-[23%] text-[9px] font-semibold text-muted-foreground/80">
        Port Arthur
      </div>
      <div className="absolute right-10 bottom-[22%] text-[9px] font-semibold text-muted-foreground/80">
        Fort William
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.22)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.22)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30" />

      {marketplacePins.map((pin) => (
        <div
          key={pin.name}
          className="absolute flex flex-col items-center"
          style={{ top: pin.top, left: pin.left }}
        >
          <div
            className={`h-3.5 w-3.5 rounded-full border-2 border-card shadow-sm ${
              pin.active ? "bg-success animate-pulse" : "bg-muted-foreground/40"
            }`}
          />
          <div className="mt-1 rounded-md border border-border bg-card/92 px-2 py-0.5 shadow-sm backdrop-blur-sm">
            <p className="text-[9px] font-semibold leading-tight text-foreground">{pin.name}</p>
            <p className="text-[8px] text-muted-foreground">{pin.role}</p>
          </div>
        </div>
      ))}

      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-card">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Search pros near you…</span>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1.5 backdrop-blur-sm">
        <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
        <span className="text-[10px] font-semibold text-success">4 Pros On Duty</span>
      </div>

      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1 rounded-full border border-border bg-background/90 px-2.5 py-1 text-[10px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
        <MapPin className="h-3 w-3 text-primary" />
        Local visibility map
      </div>
    </div>
  );
}

export default function MarketplaceSection() {
  return (
    <section className="py-20 md:py-28 relative">
      <div className="absolute inset-0 -z-10 gradient-mesh" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">
            Local Discovery
          </p>
          <h2 className="text-display text-3xl md:text-4xl lg:text-5xl mb-4">
            Be the first pro customers find{" "}
            <span className="gradient-text">in your area</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-lg">
            The guzzl.pro marketplace connects you with local customers actively looking for your services.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
            className="lg:col-span-2 landing-card rounded-2xl p-1 relative overflow-hidden min-h-[320px]"
          >
            <ThunderBayMapPreview />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {highlights.map((h) => (
              <motion.div
                key={h.title}
                variants={scaleIn}
                className="landing-card rounded-2xl p-6"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <h.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1.5">{h.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{h.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
