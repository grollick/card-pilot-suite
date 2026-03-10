import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Play,
  CreditCard,
  Phone,
  MessageSquare,
  Calendar,
  UserPlus,
  ClipboardList,
  Briefcase,
  BarChart3,
  Share2,
  CheckCircle2,
  Star,
  Camera,
  Clock,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  ChevronRight,
} from "lucide-react";

/* ── Tour steps ── */

interface TourStep {
  id: number;
  title: string;
  headline: string;
  description: string;
  highlights: { icon: React.ReactNode; label: string }[];
  ui: React.ReactNode;
  accent: string;
}

/* ── Mock UI components ── */

function MockCard() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden w-full max-w-[320px] mx-auto">
      {/* Cover */}
      <div className="h-20 bg-gradient-to-r from-primary to-accent relative">
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
          <div className="h-16 w-16 rounded-full bg-card border-4 border-card shadow-md flex items-center justify-center">
            <span className="text-lg font-bold text-foreground">JS</span>
          </div>
        </div>
      </div>
      <div className="pt-10 pb-5 px-5 text-center">
        <p className="font-bold text-foreground">John Smith</p>
        <p className="text-xs text-muted-foreground">Smith Renovations · Austin, TX</p>
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { icon: <Phone className="h-3.5 w-3.5" />, label: "Call" },
            { icon: <MessageSquare className="h-3.5 w-3.5" />, label: "Text" },
            { icon: <Calendar className="h-3.5 w-3.5" />, label: "Book" },
          ].map((b) => (
            <div key={b.label} className="flex items-center justify-center gap-1 rounded-lg bg-primary text-primary-foreground py-2 text-xs font-medium">
              {b.icon} {b.label}
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1.5">
          {["Kitchen Remodels", "Bathroom Upgrades", "New Construction"].map((s) => (
            <div key={s} className="flex items-center gap-2 text-xs text-foreground bg-muted/60 rounded-lg px-3 py-2">
              <ChevronRight className="h-3 w-3 text-muted-foreground" /> {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockCRM() {
  const leads = [
    { name: "Sarah Johnson", status: "New Lead", time: "2 min ago", dot: "bg-success" },
    { name: "Mike Chen", status: "Contacted", time: "1 hour ago", dot: "bg-primary" },
    { name: "Lisa Park", status: "Estimate Sent", time: "3 hours ago", dot: "bg-warning" },
  ];
  return (
    <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden w-full max-w-[360px] mx-auto">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Contacts</span>
        <span className="text-xs bg-success/15 text-success px-2 py-0.5 rounded-full font-medium">+1 new</span>
      </div>
      <div className="divide-y divide-border">
        {leads.map((l) => (
          <div key={l.name} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground">
              {l.name.split(" ").map((w) => w[0]).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{l.name}</p>
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${l.dot}`} />
                <span className="text-xs text-muted-foreground">{l.status}</span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{l.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockBooking() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const slots = [
    { day: 0, time: "9:00 AM", booked: true },
    { day: 1, time: "10:30 AM", booked: false },
    { day: 2, time: "2:00 PM", booked: false },
    { day: 3, time: "11:00 AM", booked: true },
    { day: 4, time: "3:30 PM", booked: false },
  ];
  return (
    <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden w-full max-w-[360px] mx-auto">
      <div className="px-5 py-3 border-b border-border">
        <span className="text-sm font-semibold text-foreground">Book an Appointment</span>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-5 gap-1.5 mb-4">
          {days.map((d, i) => (
            <div key={d} className={`text-center rounded-lg py-2 text-xs font-medium ${i === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
              <p>{d}</p>
              <p className="text-lg font-bold">{10 + i}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {slots.map((s, i) => (
            <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm ${s.booked ? "bg-muted/60 text-muted-foreground" : "border border-primary/30 bg-primary/5 text-foreground cursor-pointer hover:bg-primary/10"}`}>
              <span className="font-medium">{s.time}</span>
              {s.booked ? (
                <span className="text-xs text-muted-foreground">Booked</span>
              ) : (
                <span className="text-xs text-primary font-medium">Available</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockEstimate() {
  const items = [
    { name: "Kitchen demo & removal", qty: 1, price: 2400 },
    { name: "Countertop install", qty: 1, price: 3800 },
    { name: "Tile backsplash", qty: 45, price: 12, unit: "sq ft" },
  ];
  const total = 2400 + 3800 + 45 * 12;
  return (
    <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden w-full max-w-[360px] mx-auto">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Estimate #1042</span>
        <span className="text-xs bg-warning/15 text-warning px-2 py-0.5 rounded-full font-medium">Pending</span>
      </div>
      <div className="p-4 space-y-2">
        {items.map((it) => (
          <div key={it.name} className="flex items-center justify-between text-sm">
            <span className="text-foreground">{it.name}</span>
            <span className="text-muted-foreground font-medium">${(it.qty * it.price).toLocaleString()}</span>
          </div>
        ))}
        <div className="border-t border-border pt-2 flex items-center justify-between text-sm font-bold text-foreground">
          <span>Total</span>
          <span>${total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

function MockJobs() {
  const jobs = [
    { title: "Kitchen Remodel – Johnson", status: "In Progress", progress: 65 },
    { title: "Bathroom Tile – Chen", status: "Scheduled", progress: 0 },
  ];
  return (
    <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden w-full max-w-[360px] mx-auto">
      <div className="px-5 py-3 border-b border-border">
        <span className="text-sm font-semibold text-foreground">Active Jobs</span>
      </div>
      <div className="divide-y divide-border">
        {jobs.map((j) => (
          <div key={j.title} className="px-5 py-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-sm font-medium text-foreground">{j.title}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${j.progress > 0 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                {j.status}
              </span>
            </div>
            {j.progress > 0 && (
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${j.progress}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MockSocial() {
  const posts = [
    { platform: "Instagram", time: "Today 2:00 PM", status: "Scheduled" },
    { platform: "Facebook", time: "Tomorrow 10:00 AM", status: "Queued" },
    { platform: "LinkedIn", time: "Wed 9:00 AM", status: "Draft" },
  ];
  return (
    <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden w-full max-w-[360px] mx-auto">
      <div className="px-5 py-3 border-b border-border">
        <span className="text-sm font-semibold text-foreground">Social Planner</span>
      </div>
      <div className="divide-y divide-border">
        {posts.map((p) => (
          <div key={p.platform} className="px-5 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{p.platform}</p>
              <p className="text-xs text-muted-foreground">{p.time}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              p.status === "Scheduled" ? "bg-success/15 text-success" :
              p.status === "Queued" ? "bg-primary/15 text-primary" :
              "bg-muted text-muted-foreground"
            }`}>
              {p.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockAnalytics() {
  const stats = [
    { label: "Leads", value: "142", change: "+23%", icon: <Users className="h-4 w-4" /> },
    { label: "Bookings", value: "38", change: "+12%", icon: <Calendar className="h-4 w-4" /> },
    { label: "Revenue", value: "$24.5K", change: "+18%", icon: <DollarSign className="h-4 w-4" /> },
  ];
  return (
    <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden w-full max-w-[360px] mx-auto">
      <div className="px-5 py-3 border-b border-border">
        <span className="text-sm font-semibold text-foreground">Business Analytics</span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-border">
        {stats.map((s) => (
          <div key={s.label} className="p-4 text-center">
            <div className="flex items-center justify-center text-muted-foreground mb-1">{s.icon}</div>
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-xs text-success font-medium mt-0.5">{s.change}</p>
          </div>
        ))}
      </div>
      {/* Mini chart */}
      <div className="px-5 pb-4 pt-2">
        <div className="flex items-end gap-1.5 h-12">
          {[30, 45, 35, 55, 50, 70, 65, 80, 75, 90, 85, 95].map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-primary/20 hover:bg-primary/40 transition-colors" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Tour steps config ── */

const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    title: "Digital Card",
    headline: "Your smart business card",
    description: "Customers discover your business and open your smart card. One tap to call, text, book, or view your services.",
    highlights: [
      { icon: <Phone className="h-4 w-4" />, label: "One-tap calling" },
      { icon: <ClipboardList className="h-4 w-4" />, label: "Services showcase" },
      { icon: <Calendar className="h-4 w-4" />, label: "Instant booking" },
      { icon: <UserPlus className="h-4 w-4" />, label: "Lead capture form" },
    ],
    ui: <MockCard />,
    accent: "from-primary to-accent",
  },
  {
    id: 2,
    title: "Lead Capture",
    headline: "Every lead, automatically saved",
    description: "When someone contacts you, their information is automatically saved to your CRM with full activity history.",
    highlights: [
      { icon: <UserPlus className="h-4 w-4" />, label: "Auto-captured contacts" },
      { icon: <Clock className="h-4 w-4" />, label: "Activity timeline" },
      { icon: <Star className="h-4 w-4" />, label: "Lead scoring" },
    ],
    ui: <MockCRM />,
    accent: "from-success to-emerald-400",
  },
  {
    id: 3,
    title: "Booking",
    headline: "Customers book online, 24/7",
    description: "No more phone tag. Customers see your real-time availability and book appointments directly from your card.",
    highlights: [
      { icon: <ClipboardList className="h-4 w-4" />, label: "Service selection" },
      { icon: <Calendar className="h-4 w-4" />, label: "Live availability" },
      { icon: <CheckCircle2 className="h-4 w-4" />, label: "Instant confirmation" },
    ],
    ui: <MockBooking />,
    accent: "from-primary to-blue-400",
  },
  {
    id: 4,
    title: "Estimates",
    headline: "Professional quotes in minutes",
    description: "Create detailed estimates with line items, materials, and labor. Send them instantly and track approvals.",
    highlights: [
      { icon: <FileText className="h-4 w-4" />, label: "Line items & pricing" },
      { icon: <DollarSign className="h-4 w-4" />, label: "Auto calculations" },
      { icon: <ArrowRight className="h-4 w-4" />, label: "One-click send" },
    ],
    ui: <MockEstimate />,
    accent: "from-warning to-amber-400",
  },
  {
    id: 5,
    title: "Job Management",
    headline: "Track jobs from start to finish",
    description: "Manage tasks, track progress, upload photos, and collect signatures — all from your phone.",
    highlights: [
      { icon: <CheckCircle2 className="h-4 w-4" />, label: "Task tracking" },
      { icon: <Camera className="h-4 w-4" />, label: "Job photos" },
      { icon: <TrendingUp className="h-4 w-4" />, label: "Progress tracking" },
    ],
    ui: <MockJobs />,
    accent: "from-accent to-purple-400",
  },
  {
    id: 6,
    title: "Marketing",
    headline: "Promote across all platforms",
    description: "Schedule posts, plan campaigns, and keep your business visible across Instagram, Facebook, LinkedIn, and more.",
    highlights: [
      { icon: <Share2 className="h-4 w-4" />, label: "Multi-platform posting" },
      { icon: <Calendar className="h-4 w-4" />, label: "Content calendar" },
      { icon: <Briefcase className="h-4 w-4" />, label: "Campaign tools" },
    ],
    ui: <MockSocial />,
    accent: "from-rose-500 to-pink-400",
  },
  {
    id: 7,
    title: "Analytics",
    headline: "See your business growing",
    description: "Understand what's working. Track leads, bookings, revenue, and performance — all in one dashboard.",
    highlights: [
      { icon: <Users className="h-4 w-4" />, label: "Leads captured" },
      { icon: <BarChart3 className="h-4 w-4" />, label: "Performance charts" },
      { icon: <TrendingUp className="h-4 w-4" />, label: "Growth trends" },
    ],
    ui: <MockAnalytics />,
    accent: "from-primary to-accent",
  },
];

/* ── Single tour step with scroll-triggered animation ── */

function TourStepBlock({ step, index }: { step: TourStep; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const isEven = index % 2 === 0;

  return (
    <div ref={ref} className="relative">
      {/* Connecting line */}
      {index < TOUR_STEPS.length - 1 && (
        <div className="hidden md:block absolute left-1/2 -translate-x-px top-full w-0.5 h-16 bg-gradient-to-b from-border to-transparent" />
      )}

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.1 }}
        className={`grid md:grid-cols-2 gap-8 md:gap-14 items-center ${isEven ? "" : "md:direction-rtl"}`}
      >
        {/* Text side */}
        <div className={`space-y-5 ${isEven ? "md:order-1" : "md:order-2 md:text-left"}`} style={{ direction: "ltr" }}>
          {/* Step badge */}
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br ${step.accent} text-white text-sm font-bold shadow-md`}>
              {step.id}
            </span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{step.title}</span>
          </div>

          <h3 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
            {step.headline}
          </h3>
          <p className="text-muted-foreground leading-relaxed">{step.description}</p>

          {/* Highlight chips */}
          <div className="flex flex-wrap gap-2">
            {step.highlights.map((h) => (
              <span key={h.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-foreground">
                <span className="text-primary">{h.icon}</span>
                {h.label}
              </span>
            ))}
          </div>
        </div>

        {/* UI preview side */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.25 }}
          className={`${isEven ? "md:order-2" : "md:order-1"}`}
          style={{ direction: "ltr" }}
        >
          {step.ui}
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ── Main component ── */

export default function ProductTourSection() {
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  const scrollToStep = (idx: number) => {
    setActiveStep(idx);
    const el = document.getElementById(`tour-step-${idx}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section id="product-tour" ref={sectionRef} className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <Play className="h-4 w-4" /> Product Tour
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Take a Quick Product Tour
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how CardPilot helps you capture leads, book customers, and manage your business — all in one platform.
          </p>
        </motion.div>

        {/* ── Step nav pills ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap items-center justify-center gap-2 mb-16"
        >
          {TOUR_STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => scrollToStep(i)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                activeStep === i
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40"
              }`}
            >
              <span className="font-bold">{s.id}</span>
              <span className="hidden sm:inline">{s.title}</span>
            </button>
          ))}
        </motion.div>

        {/* ── Tour steps ── */}
        <div className="space-y-24">
          {TOUR_STEPS.map((step, i) => (
            <div key={step.id} id={`tour-step-${i}`}>
              <TourStepBlock step={step} index={i} />
            </div>
          ))}
        </div>

        {/* ── Final CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mt-24 rounded-2xl border border-primary/20 bg-primary/[0.03] p-10 md:p-14"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Ready to grow your business?
          </h3>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Everything you just saw is included for free. Create your card and start getting leads today.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/onboarding">
              <Button size="lg" className="shadow-glow px-8">
                Start Free <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <a href="#demo-builder">
              <Button size="lg" variant="outline" className="px-8">
                Create Your Card
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
