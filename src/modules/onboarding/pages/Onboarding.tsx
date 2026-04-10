import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import GuzzlLogo from "@/components/brand/GuzzlLogo";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { pickStylePackKey } from "@/lib/stylePackSelection";
import { getBestTemplateForProfession, getTemplate, CARD_TEMPLATES } from "@/lib/cardTemplates";
import { getChecklistTemplate } from "@/lib/checklistTemplates";
import { getProfessionCardDefaults } from "@/lib/professionCardDefaults";

import StepWelcome from "../components/StepWelcome";
import StepProfession from "../components/StepProfession";
import StepAutoBuild from "../components/StepAutoBuild";
import StepCardPreview from "../components/StepCardPreview";
import StepContactDetails from "../components/StepContactDetails";
import StepSocialLinks from "../components/StepSocialLinks";
import StepBookingSetup from "../components/StepBookingSetup";
import StepYoureLive from "../components/StepYoureLive";
import StepActionPrompt from "../components/StepActionPrompt";
import StepSharing from "../components/StepSharing";
import StepUpgradePrompt from "../components/StepUpgradePrompt";
import StepActivationChecklist from "../components/StepActivationChecklist";

interface Profession {
  id: string;
  name: string;
  category: string;
  default_card_sections: any;
  default_pipeline_stages: any;
  default_booking_services: any;
  default_email_templates: any;
}

interface AIService {
  name: string;
  description: string;
  duration_min: number;
  price_range: string;
}

interface AISetup {
  tagline: string;
  bio: string;
  about: string;
  cta_text: string;
  marketplace_summary: string;
  services: AIService[];
  suggested_template: string;
  suggested_categories: string[];
  setup_tips: string[];
}

const categoryKeyMap: Record<string, string> = {
  "Sales & Advising": "sales_advising",
  "Home & Trade": "home_trade",
  "Health & Wellness": "health_wellness",
  "Beauty & Personal Care": "beauty_personal_care",
  "Creative & Media": "creative_media",
  "Automotive Services": "automotive_services",
  "Legal & Finance": "legal_finance",
  "Education & Lessons": "education_services",
  "Food & Events": "food_events",
  "Pet & Other Services": "pet_other",
};

// New optimized flow:
// 0 = Welcome
// 1 = Profession
// 2 = Business Name (Auto-Build)
// 3 = Card Preview (generating / preview)
// 4 = Contact + Details (phone, email, services, location)
// 5 = Social Links (guided)
// 6 = Booking Setup (optional)
// 7 = Activate Card — "You're Live!" moment
// 8 = Action Prompt (Aha Moment triggers)
// 9 = Sharing
// 10 = Upgrade Prompt
// 11 = Activation Checklist (dashboard)

const TOTAL_STEPS = 12;

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [selectedProfessionId, setSelectedProfessionId] = useState("");
  const [company, setCompany] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [bookingEnabled, setBookingEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([]);

  // AI state
  const [aiSetup, setAiSetup] = useState<AISetup | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const { data: professions = [] } = useQuery({
    queryKey: ["professions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("professions").select("*").order("category").order("name");
      if (error) throw error;
      return data as Profession[];
    },
  });

  const selectedProfession = professions.find(p => p.id === selectedProfessionId);

  // Auto-select profession from URL param
  useEffect(() => {
    if (selectedProfessionId || professions.length === 0) return;
    const profParam = searchParams.get("profession")?.toLowerCase().trim();
    if (!profParam) return;

    const profMap: Record<string, string[]> = {
      contractor: ["contractor", "general contractor"],
      contractors: ["contractor", "general contractor"],
      realtor: ["realtor", "real estate agent"],
      realtors: ["realtor", "real estate agent"],
      barber: ["barber"],
      barbers: ["barber"],
      photographer: ["photographer"],
      landscaper: ["landscaper"],
      plumber: ["plumber"],
      electrician: ["electrician"],
      painter: ["painter", "interior painter"],
      cleaner: ["house cleaner", "cleaner"],
      trainer: ["personal trainer"],
    };

    const matchNames = profMap[profParam] || [profParam];
    const match = professions.find(p =>
      matchNames.some(n => p.name.toLowerCase().includes(n))
    );
    if (match) {
      setSelectedProfessionId(match.id);
      if (step === 0) setStep(1);
    }
  }, [professions, searchParams, selectedProfessionId, step]);

  const categoryKey = useMemo(() => {
    if (!selectedProfession) return "";
    return categoryKeyMap[selectedProfession.category] || selectedProfession.category.toLowerCase().replace(/[^a-z]+/g, "_");
  }, [selectedProfession]);

  const generateHandle = (input: string) =>
    input.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20) + Math.floor(Math.random() * 1000);

  // Generate AI content and show preview (does NOT save yet)
  const handleGeneratePreview = async () => {
    if (!user || !selectedProfession) return;
    setStep(3);
    setAiLoading(true);

    try {
      let setup: AISetup | null = null;
      try {
        const { data, error } = await supabase.functions.invoke("ai-onboarding-setup", {
          body: {
            profession: selectedProfession.name,
            company: company || undefined,
            city: undefined,
          },
        });
        if (!error && !data?.error) {
          setup = data.setup as AISetup;
          setAiSetup(setup);
          setServices(setup.services.map(s => s.name));
        }
      } catch {
        // Fallback to defaults
      }

      if (!setup) {
        const defaultServices = (selectedProfession.default_booking_services as any[]) || [];
        setServices(defaultServices.slice(0, 5).map((s: any) => s.name));
      }

      // Also try instant-card if URL provided
      if (externalUrl) {
        try {
          const { data, error } = await supabase.functions.invoke("instant-card", {
            body: { business_name: company, url: externalUrl },
          });
          if (!error && !data?.error && data.card) {
            if (data.card.bio && !setup?.bio) setAiSetup(prev => prev ? { ...prev, bio: data.card.bio } : prev);
          }
        } catch {
          // Non-critical
        }
      }

      setAiLoading(false);
    } catch (err: any) {
      console.error("AI setup error:", err);
      setAiLoading(false);
      setStep(2);
    }
  };

  // Full save — called when activating the card (step 7)
  const handleActivateCard = async () => {
    if (!user || !selectedProfession) return;
    setSaving(true);

    try {
      const handle = generateHandle(company || user.email || "user");
      const packKey = pickStylePackKey("Modern", categoryKey);

      const { error: profileErr } = await supabase.from("profiles").update({
        name: company,
        company: company || null,
        handle,
        profession_id: selectedProfession.id,
        style_pack: packKey,
        primary_cta: "call",
        bio: aiSetup?.bio || null,
        onboarding_completed: true,
        marketplace_enabled: true,
        phone: phone || null,
        email: email || null,
        city: city || null,
      } as any).eq("id", user.id);
      if (profileErr) throw profileErr;

      // Card — build rich default content
      const profDefaults = getProfessionCardDefaults(selectedProfession.name);
      const bestTemplate = aiSetup?.suggested_template
        ? (CARD_TEMPLATES.find(t => t.id === aiSetup!.suggested_template) ? aiSetup.suggested_template : getBestTemplateForProfession(selectedProfession.name))
        : getBestTemplateForProfession(selectedProfession.name);
      const template = getTemplate(bestTemplate);

      // Build sections with pre-populated content so the card never looks empty
      const rawSections = template
        ? template.sections.map(s => ({ id: s.id, label: s.id.charAt(0).toUpperCase() + s.id.slice(1).replace(/_/g, " "), enabled: s.enabled }))
        : (selectedProfession.default_card_sections || []);

      const enrichedSections = rawSections.map((sec: any) => {
        switch (sec.id) {
          case "hero":
            return { ...sec, content: { tagline: aiSetup?.tagline || profDefaults.tagline } };
          case "about":
            return { ...sec, content: { text: aiSetup?.about || profDefaults.about } };
          case "services": {
            const aiServices = aiSetup?.services?.map((s: any) => ({ name: s.name, description: s.description || "", price: "" }));
            return { ...sec, content: { items: aiServices && aiServices.length > 0 ? aiServices : profDefaults.services } };
          }
          case "testimonials":
            return { ...sec, content: { testimonials: profDefaults.testimonials } };
          case "contact":
            return { ...sec, content: { heading: "Get in Touch", description: `Ready to work with ${company || "us"}? Send a message and we'll get back to you quickly.` } };
          case "booking":
            return { ...sec, content: { bookingHeading: "Book an Appointment" } };
          default:
            return sec;
        }
      });

      // Add social links to sections if provided
      let finalSections = enrichedSections;
      if (socialLinks.length > 0) {
        const existingSocial = enrichedSections.findIndex((s: any) => s.id === "social");
        if (existingSocial >= 0) {
          finalSections = enrichedSections.map((s: any, i: number) =>
            i === existingSocial ? { ...s, enabled: true, content: { links: socialLinks } } : s
          );
        } else {
          finalSections = [...enrichedSections, { id: "social", label: "Social", enabled: true, content: { links: socialLinks } }];
        }
      }

      const { error: cardErr } = await supabase.from("cards").upsert({
        user_id: user.id,
        theme_json: {
          style_pack: packKey,
          primary_cta: aiSetup?.cta_text || profDefaults.ctaPriority[0] || "call",
          tagline: aiSetup?.tagline || profDefaults.tagline,
          about: aiSetup?.about || profDefaults.about,
          booking_enabled: bookingEnabled,
          cardLayout: "modern",
          ...(profDefaults.palette ? { palette: profDefaults.palette } : {}),
        },
        sections_json: finalSections,
        status: "published",
        published_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (cardErr) throw cardErr;

      // Pipeline stages
      const stages = (selectedProfession.default_pipeline_stages as string[]) || [];
      if (stages.length > 0) {
        await supabase.from("pipeline_stages").insert(
          stages.map((stageName: string, i: number) => ({ user_id: user.id, name: stageName, sort_order: i }))
        );
      }

      // Services
      const finalServices = aiSetup?.services || [];
      if (finalServices.length > 0) {
        await supabase.from("booking_services").insert(
          finalServices.map((s: any) => ({
            user_id: user.id,
            name: s.name,
            description: s.description || null,
            duration_min: s.duration_min || 30,
            active: true,
          }))
        );
      }

      // Email templates
      const templates = (selectedProfession.default_email_templates as any[]) || [];
      if (templates.length > 0) {
        await supabase.from("email_templates").insert(
          templates.map((t: any) => ({ user_id: user.id, name: t.name, subject: t.subject, body: t.body }))
        );
      }

      await queryClient.invalidateQueries({ queryKey: ["profile-onboarding"] });
      setLaunched(true);

      // Record referral signup
      try {
        await supabase.functions.invoke("referral-system", { body: { action: "record_signup" } });
      } catch { /* Non-critical */ }

      setSaving(false);
      setStep(7); // Show "You're Live!"
    } catch (err: any) {
      console.error("Onboarding error:", err);
      toast({ title: "Something went wrong", description: err.message, variant: "destructive" });
      setSaving(false);
    }
  };

  const handle = (company || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const cardUrl = `${window.location.origin}/${handle}`;
  const shareMessage = `Hey! I just set up my digital business card — check it out and let me know if you ever need ${selectedProfession?.name?.toLowerCase() || "my"} services: ${cardUrl}`;

  const checklistTemplate = getChecklistTemplate(
    selectedProfession?.name,
    selectedProfession?.category,
  );

  const onboardingSignals: Record<string, boolean> = {
    card_published: launched,
    has_services: services.length > 0,
    has_image: launched,
    estimate_sent: false,
    has_views: false,
    has_lead: false,
    has_booking: false,
    has_review: false,
  };

  const checklistItems = checklistTemplate.steps.map((s) => ({
    label: s.label,
    done: onboardingSignals[s.signal] ?? false,
    route: s.route,
  }));

  // Progress bar: show for middle steps only
  const showProgress = step >= 1 && step <= 10;
  const progressSteps = TOTAL_STEPS;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <GuzzlLogo size="xl" />
        </div>

        {/* Progress */}
        {showProgress && (
          <div className="flex gap-1.5 mb-6">
            {[...Array(progressSteps)].map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i < step ? "bg-primary" : i === step ? "bg-primary/50" : "bg-muted"
              }`} />
            ))}
          </div>
        )}

        <div className={`rounded-2xl border border-border bg-card shadow-lg ${
          step === 0 || step === 7 || step === 11 ? "p-8" : "p-6"
        }`}>
          <AnimatePresence mode="wait">
            {/* Step 0: Welcome */}
            {step === 0 && (
              <StepWelcome
                onStart={() => setStep(1)}
                onInstant={() => navigate("/app/card/instant")}
              />
            )}

            {/* Step 1: Profession */}
            {step === 1 && (
              <StepProfession
                professions={professions}
                selectedId={selectedProfessionId}
                onSelect={setSelectedProfessionId}
                onNext={() => setStep(2)}
                onCustomProfession={async (customName) => {
                  try {
                    const { data, error } = await supabase
                      .from("professions")
                      .insert({
                        name: customName,
                        category: "Other",
                        default_card_sections: [],
                        default_pipeline_stages: [],
                        default_booking_services: [],
                        default_email_templates: [],
                      } as any)
                      .select()
                      .single();
                    if (error) throw error;
                    queryClient.invalidateQueries({ queryKey: ["professions"] });
                    setSelectedProfessionId((data as any).id);
                    setStep(2);
                  } catch (err: any) {
                    console.error("Custom profession error:", err);
                    toast({ title: "Error", description: "Could not create custom profession.", variant: "destructive" });
                  }
                }}
              />
            )}

            {/* Step 2: Business Name (Auto-Build) */}
            {step === 2 && (
              <StepAutoBuild
                businessName={company}
                externalUrl={externalUrl}
                onBusinessNameChange={setCompany}
                onExternalUrlChange={setExternalUrl}
                onGenerate={handleGeneratePreview}
                onBack={() => setStep(1)}
              />
            )}

            {/* Step 3: Card Preview (generating / preview) */}
            {step === 3 && (
              <StepCardPreview
                name={company}
                company={company}
                phone={phone}
                city={city}
                tagline={aiSetup?.tagline}
                services={services}
                aiLoading={aiLoading}
                onNext={() => setStep(4)}
                onBack={() => setStep(2)}
              />
            )}

            {/* Step 4: Contact + Details */}
            {step === 4 && (
              <StepContactDetails
                phone={phone}
                email={email}
                city={city}
                services={services}
                onPhoneChange={setPhone}
                onEmailChange={setEmail}
                onCityChange={setCity}
                onServicesChange={setServices}
                onNext={() => setStep(5)}
                onBack={() => setStep(3)}
              />
            )}

            {/* Step 5: Social Links */}
            {step === 5 && (
              <StepSocialLinks
                onNext={(links) => {
                  setSocialLinks(links);
                  setStep(6);
                }}
                onBack={() => setStep(4)}
              />
            )}

            {/* Step 6: Booking Setup */}
            {step === 6 && (
              <StepBookingSetup
                bookingEnabled={bookingEnabled}
                onToggleBooking={setBookingEnabled}
                onNext={() => {
                  // Now activate the card
                  handleActivateCard();
                }}
                onBack={() => setStep(5)}
              />
            )}

            {/* Step 7: You're Live! (Activate Card moment) */}
            {step === 7 && (
              <StepYoureLive
                company={company}
                onNext={() => setStep(8)}
              />
            )}

            {/* Step 8: Action Prompt (Aha Moment) */}
            {step === 8 && (
              <StepActionPrompt
                onTurnOnDuty={() => navigate("/app/duty")}
                onShareCard={() => setStep(9)}
                onSkip={() => setStep(10)}
              />
            )}

            {/* Step 9: Sharing */}
            {step === 9 && (
              <StepSharing
                cardUrl={cardUrl}
                shareMessage={shareMessage}
                onNext={() => setStep(10)}
              />
            )}

            {/* Step 10: Upgrade Prompt */}
            {step === 10 && (
              <StepUpgradePrompt
                onUpgrade={() => navigate("/app/billing")}
                onSkip={() => setStep(11)}
              />
            )}

            {/* Step 11: Activation Checklist */}
            {step === 11 && (
              <StepActivationChecklist
                items={checklistItems}
                headline={checklistTemplate.headline}
                onGoToDashboard={() => navigate("/app")}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
