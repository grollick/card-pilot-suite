import { useState } from "react";
import { Search, BookOpen, Users, Calendar, Rocket, TrendingUp, ChevronRight, PlayCircle, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import HelpVideoCard from "@/components/HelpVideoCard";

interface HelpSection {
  id: string;
  title: string;
  icon: typeof BookOpen;
  description: string;
  articles: { title: string; description: string }[];
  video?: { title: string; description: string; duration: string };
  faqs: { q: string; a: string }[];
}

const helpSections: HelpSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Rocket,
    description: "Set up your account and launch your digital card in minutes.",
    articles: [
      { title: "Create your profile", description: "Set your name, photo, and business handle." },
      { title: "Publish your card", description: "Choose a template and go live." },
      { title: "Share your card", description: "Use your link, QR code, or NFC to share." },
    ],
    video: { title: "Quick Start Guide", description: "Get your first lead in under 5 minutes.", duration: "3 min" },
    faqs: [
      { q: "How long does setup take?", a: "Most users are live in under 2 minutes with our AI onboarding." },
      { q: "Can I customize my card?", a: "Yes! Choose templates, colors, sections, and add your branding." },
    ],
  },
  {
    id: "capturing-leads",
    title: "Capturing Leads",
    icon: Users,
    description: "Turn card viewers into leads with forms, quotes, and bookings.",
    articles: [
      { title: "Lead capture forms", description: "How the contact form on your card works." },
      { title: "Quote calculator", description: "Let customers request instant quotes." },
      { title: "QR code sharing", description: "Generate and share QR codes for your card." },
    ],
    video: { title: "How to Capture More Leads", description: "Best practices for lead generation.", duration: "4 min" },
    faqs: [
      { q: "Where do leads go?", a: "All submissions appear in your Contacts page automatically." },
      { q: "Do I get notifications?", a: "Yes, you'll be notified when a new lead comes in." },
    ],
  },
  {
    id: "managing-contacts",
    title: "Managing Contacts",
    icon: Users,
    description: "Organize leads, track conversations, and close more deals.",
    articles: [
      { title: "Contact pipeline", description: "Move leads through stages from new to won." },
      { title: "Follow-up tasks", description: "Set reminders so you never miss a follow-up." },
      { title: "Tags and filtering", description: "Organize contacts with tags and saved views." },
    ],
    video: { title: "Manage Your Leads Like a Pro", description: "CRM best practices for service businesses.", duration: "3 min" },
    faqs: [
      { q: "Can I import contacts?", a: "Currently, contacts are created from card submissions and bookings." },
      { q: "How do I follow up?", a: "Use the task system to set follow-up reminders per contact." },
    ],
  },
  {
    id: "booking-clients",
    title: "Booking Clients",
    icon: Calendar,
    description: "Let customers book appointments directly from your card.",
    articles: [
      { title: "Set your availability", description: "Define your working hours and buffer time." },
      { title: "Create services", description: "Add services with descriptions and pricing." },
      { title: "Manage bookings", description: "View, confirm, and reschedule appointments." },
    ],
    video: { title: "Set Up Online Booking", description: "Let customers book you in seconds.", duration: "2 min" },
    faqs: [
      { q: "Do customers get confirmations?", a: "Yes, booking confirmations are sent automatically." },
      { q: "Can I set different availability per day?", a: "Yes, availability rules are set per day of the week." },
    ],
  },
  {
    id: "growing-business",
    title: "Growing Your Business",
    icon: TrendingUp,
    description: "Use analytics, marketing, and automation to scale.",
    articles: [
      { title: "Track card analytics", description: "See who views your card and where they come from." },
      { title: "Email marketing", description: "Send targeted campaigns to your contacts." },
      { title: "Social media scheduling", description: "Plan and schedule posts to stay visible." },
    ],
    video: { title: "Growth Strategies", description: "Scale your business with CardPilot tools.", duration: "5 min" },
    faqs: [
      { q: "What analytics are available?", a: "Card views, lead sources, conversion rates, and revenue tracking." },
      { q: "Is there an autopilot mode?", a: "Yes! Autopilot automates follow-ups, review requests, and social posts." },
    ],
  },
];

export default function HelpCenter() {
  const [search, setSearch] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>("getting-started");

  const filtered = search
    ? helpSections.filter(
        (s) =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.articles.some((a) => a.title.toLowerCase().includes(search.toLowerCase())) ||
          s.faqs.some((f) => f.q.toLowerCase().includes(search.toLowerCase()))
      )
    : helpSections;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <HelpCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="page-title">Help Center</h1>
            <p className="page-description">Learn how to generate leads and grow your business with CardPilot.</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search help articles, FAQs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {filtered.map((section) => {
          const isExpanded = expandedSection === section.id;
          const Icon = section.icon;

          return (
            <motion.div
              key={section.id}
              layout
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              {/* Section Header */}
              <button
                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors text-left"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground">{section.title}</h3>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>
                <ChevronRight
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                />
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="border-t border-border"
                >
                  <div className="p-4 space-y-5">
                    {/* Video */}
                    {section.video && (
                      <div className="max-w-xs">
                        <HelpVideoCard
                          title={section.video.title}
                          description={section.video.description}
                          duration={section.video.duration}
                        />
                      </div>
                    )}

                    {/* Articles */}
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Step-by-Step Guides
                      </h4>
                      <div className="space-y-1">
                        {section.articles.map((article) => (
                          <div
                            key={article.title}
                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer group"
                          >
                            <BookOpen className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                            <div>
                              <p className="text-sm font-medium group-hover:text-primary transition-colors">{article.title}</p>
                              <p className="text-xs text-muted-foreground">{article.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* FAQs */}
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Frequently Asked Questions
                      </h4>
                      <div className="space-y-3">
                        {section.faqs.map((faq) => (
                          <div key={faq.q} className="text-sm">
                            <p className="font-medium text-foreground">{faq.q}</p>
                            <p className="text-muted-foreground mt-0.5">{faq.a}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
