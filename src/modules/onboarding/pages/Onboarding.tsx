import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { pickStylePackKey } from "@/lib/stylePackSelection";
import { getBestTemplateForProfession, getTemplate, CARD_TEMPLATES } from "@/lib/cardTemplates";
import { getChecklistTemplate } from "@/lib/checklistTemplates";

import StepWelcome from "../components/StepWelcome";
import StepProfession from "../components/StepProfession";
import StepAutoBuild from "../components/StepAutoBuild";
import StepCardPreview from "../components/StepCardPreview";
import StepYoureLive from "../components/StepYoureLive";
import StepActionPrompt from "../components/StepActionPrompt";
import StepSocialLinks from "../components/StepSocialLinks";
import StepSharing from "../components/StepSharing";
import StepActivationChecklist from "../components/StepActivationChecklist";
import StepAIPersonality from "../components/StepAIPersonality";

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

// Steps:
// 0 = Welcome
// 1 = Profession
// 2 = AI Personality
// 3 = Auto-Build (business name + optional URL)
// 4 = Card Preview (generating / preview)
// 5 = You're Live (success moment)
// 6 = Action Prompt
// 7 = Social Links
// 8 = Sharing
// 9 = Activation Checklist

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
  const [services, setServices] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([]);
  const [aiPersonality, setAiPersonality] = useState("copilot");

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

  // Generate AI setup and launch card
  const handleGenerateAndLaunch = async () => {
    if (!user || !selectedProfession) return;
    setStep(3); // Go to card preview/loading
    setAiLoading(true);
    setSaving(true);

    try {
      // 1. Generate AI content
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
      let instantCard: any = null;
      if (externalUrl) {
        try {
          const { data, error } = await supabase.functions.invoke("instant-card", {
            body: { business_name: company, url: externalUrl },
          });
          if (!error && !data?.error) {
            instantCard = data.card;
          }
        } catch {
          // Non-critical
        }
      }

      // 2. Save profile
      const handle = generateHandle(company || user.email || "user");
      const packKey = pickStylePackKey("Modern", categoryKey);
      const name = company; // Use business name as display name

      const { error: profileErr } = await supabase.from("profiles").update({
        name,
        company: company || null,
        handle,
        profession_id: selectedProfession.id,
        style_pack: packKey,
        primary_cta: "call",
        bio: instantCard?.bio || setup?.bio || null,
        onboarding_completed: true,
        marketplace_enabled: true,
      } as any).eq("id", user.id);
      if (profileErr) throw profileErr;

      // 3. Card
      const bestTemplate = setup?.suggested_template
        ? (CARD_TEMPLATES.find(t => t.id === setup!.suggested_template) ? setup.suggested_template : getBestTemplateForProfession(selectedProfession.name))
        : getBestTemplateForProfession(selectedProfession.name);
      const template = getTemplate(bestTemplate);
      const sectionsJson = template
        ? template.sections.map(s => ({ id: s.id, label: s.id.charAt(0).toUpperCase() + s.id.slice(1).replace(/_/g, " "), enabled: s.enabled }))
        : (selectedProfession.default_card_sections || []);

      const { error: cardErr } = await supabase.from("cards").upsert({
        user_id: user.id,
        theme_json: {
          style_pack: packKey,
          primary_cta: instantCard?.cta_text || setup?.cta_text || "call",
          tagline: instantCard?.tagline || setup?.tagline || "",
          about: instantCard?.about || setup?.about || "",
          primary_color: instantCard?.theme?.primary_color,
        },
        sections_json: sectionsJson,
        status: "published",
        published_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (cardErr) throw cardErr;

      // 4. Pipeline stages
      const stages = (selectedProfession.default_pipeline_stages as string[]) || [];
      if (stages.length > 0) {
        await supabase.from("pipeline_stages").insert(
          stages.map((stageName: string, i: number) => ({ user_id: user.id, name: stageName, sort_order: i }))
        );
      }

      // 5. Services
      const finalServices = setup?.services || instantCard?.services || [];
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

      // 6. Email templates
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
        await supabase.functions.invoke("referral-system", {
          body: { action: "record_signup" },
        });
      } catch { /* Non-critical */ }

      // Move to success screen
      setAiLoading(false);
      setSaving(false);
      setStep(4);
    } catch (err: any) {
      console.error("Onboarding error:", err);
      toast({ title: "Something went wrong", description: err.message, variant: "destructive" });
      setAiLoading(false);
      setSaving(false);
      setStep(2); // Go back to auto-build
    }
  };

  const totalSteps = 9;
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">
            <span className="font-extrabold text-primary">guzzl</span><span className="text-foreground">.pro</span>
          </h1>
        </div>

        {/* Progress */}
        {step > 0 && step < 8 && (
          <div className="flex gap-1.5 mb-6">
            {[...Array(totalSteps)].map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i < step ? "bg-primary" : i === step ? "bg-primary/50" : "bg-muted"
              }`} />
            ))}
          </div>
        )}

        <div className={`rounded-2xl border border-border bg-card shadow-lg ${step === 0 || step === 4 || step === 8 ? "p-8" : "p-6"}`}>
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

            {/* Step 2: Auto-Build */}
            {step === 2 && (
              <StepAutoBuild
                businessName={company}
                externalUrl={externalUrl}
                onBusinessNameChange={setCompany}
                onExternalUrlChange={setExternalUrl}
                onGenerate={handleGenerateAndLaunch}
                onBack={() => setStep(1)}
              />
            )}

            {/* Step 3: Card Preview / Generating */}
            {step === 3 && (
              <StepCardPreview
                name={company}
                company={company}
                phone=""
                city=""
                tagline={aiSetup?.tagline}
                services={services}
                aiLoading={aiLoading || saving}
                onNext={() => setStep(4)}
                onBack={() => setStep(2)}
              />
            )}

            {/* Step 4: You're Live */}
            {step === 4 && (
              <StepYoureLive
                company={company}
                onNext={() => setStep(5)}
              />
            )}

            {/* Step 5: Action Prompt */}
            {step === 5 && (
              <StepActionPrompt
                onTurnOnDuty={() => navigate("/app/duty")}
                onShareCard={() => setStep(7)}
                onSkip={() => navigate("/app")}
              />
            )}

            {/* Step 6: Social Links */}
            {step === 6 && (
              <StepSocialLinks
                onNext={async (links) => {
                  setSocialLinks(links);
                  if (links.length > 0 && user) {
                    try {
                      const { data: card } = await supabase
                        .from("cards")
                        .select("sections_json")
                        .eq("user_id", user.id)
                        .single();
                      if (card) {
                        const sections = (card.sections_json as any[]) || [];
                        const socialIdx = sections.findIndex((s: any) => s.id === "social");
                        const socialSection = {
                          id: "social",
                          label: "Social",
                          enabled: true,
                          content: { links },
                        };
                        const updatedSections = socialIdx >= 0
                          ? sections.map((s: any, i: number) => i === socialIdx ? socialSection : s)
                          : [...sections, socialSection];
                        await supabase
                          .from("cards")
                          .update({ sections_json: updatedSections as any })
                          .eq("user_id", user.id);
                      }
                    } catch (err) {
                      console.error("Failed to save social links:", err);
                    }
                  }
                  setStep(7);
                }}
                onBack={() => setStep(5)}
              />
            )}

            {/* Step 7: Sharing */}
            {step === 7 && (
              <StepSharing
                cardUrl={cardUrl}
                shareMessage={shareMessage}
                onNext={() => setStep(8)}
              />
            )}

            {/* Step 8: Activation Checklist */}
            {step === 8 && (
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
