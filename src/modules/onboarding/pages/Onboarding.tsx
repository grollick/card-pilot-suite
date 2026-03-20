import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Rocket, ArrowRight, Sparkles, CalendarCheck, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { pickStylePackKey } from "@/lib/stylePackSelection";
import { getBestTemplateForProfession, getTemplate, CARD_TEMPLATES } from "@/lib/cardTemplates";
import { generateEstimateNumber, calculateLineTotals } from "@/hooks/useEstimates";
import { getChecklistTemplate } from "@/lib/checklistTemplates";

import StepProfession from "../components/StepProfession";
import StepBusinessInfo from "../components/StepBusinessInfo";
import StepServices from "../components/StepServices";
import StepCardPreview from "../components/StepCardPreview";
import StepFirstEstimate from "../components/StepFirstEstimate";
import StepSharing from "../components/StepSharing";
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

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [selectedProfessionId, setSelectedProfessionId] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [estimateSaving, setEstimateSaving] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [estimateCreated, setEstimateCreated] = useState(false);

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

  const categoryKey = useMemo(() => {
    if (!selectedProfession) return "";
    return categoryKeyMap[selectedProfession.category] || selectedProfession.category.toLowerCase().replace(/[^a-z]+/g, "_");
  }, [selectedProfession]);

  const generateHandle = (fullName: string) =>
    fullName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20) + Math.floor(Math.random() * 1000);

  // Generate AI setup
  const generateAISetup = async () => {
    if (!selectedProfession) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-onboarding-setup", {
        body: {
          profession: selectedProfession.name,
          name: name || undefined,
          company: company || undefined,
          city: city || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const setup = data.setup as AISetup;
      setAiSetup(setup);
      setServices(setup.services.map(s => s.name));
    } catch (err: any) {
      console.error("AI setup error:", err);
      // Fallback to defaults
      const defaultServices = (selectedProfession.default_booking_services as any[]) || [];
      setServices(defaultServices.slice(0, 5).map((s: any) => s.name));
    } finally {
      setAiLoading(false);
    }
  };

  // Launch card + save everything to DB
  const handleLaunchCard = async () => {
    if (!user || !selectedProfession) return;
    setSaving(true);
    try {
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();
      const isReOnboarding = currentProfile?.onboarding_completed === true;

      const handle = generateHandle(name || user.email || "user");
      const packKey = pickStylePackKey("Modern", categoryKey);

      // 1. Profile — auto-enable marketplace listing
      const { error: profileErr } = await supabase.from("profiles").update({
        name, company: company || null, phone: phone || null,
        email: user.email, city: city || null, handle,
        profession_id: selectedProfession.id,
        style_pack: packKey, primary_cta: "call",
        bio: aiSetup?.bio || null,
        onboarding_completed: true,
        marketplace_enabled: true,
      } as any).eq("id", user.id);
      if (profileErr) throw profileErr;

      // 2. Card
      const bestTemplate = aiSetup?.suggested_template
        ? (CARD_TEMPLATES.find(t => t.id === aiSetup.suggested_template) ? aiSetup.suggested_template : getBestTemplateForProfession(selectedProfession.name))
        : getBestTemplateForProfession(selectedProfession.name);
      const template = getTemplate(bestTemplate);
      const sectionsJson = template
        ? template.sections.map(s => ({ id: s.id, label: s.id.charAt(0).toUpperCase() + s.id.slice(1).replace(/_/g, " "), enabled: s.enabled }))
        : (selectedProfession.default_card_sections || []);

      const { error: cardErr } = await supabase.from("cards").upsert({
        user_id: user.id,
        theme_json: {
          style_pack: packKey,
          primary_cta: aiSetup?.cta_text || "call",
          tagline: aiSetup?.tagline || "",
          about: aiSetup?.about || "",
        },
        sections_json: sectionsJson,
        status: "published",
        published_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (cardErr) throw cardErr;

      // 3. Pipeline stages
      if (isReOnboarding) {
        await supabase.from("pipeline_stages").delete().eq("user_id", user.id);
      }
      const stages = (selectedProfession.default_pipeline_stages as string[]) || [];
      if (stages.length > 0) {
        await supabase.from("pipeline_stages").insert(
          stages.map((stageName: string, i: number) => ({ user_id: user.id, name: stageName, sort_order: i }))
        );
      }

      // 4. Booking services
      if (isReOnboarding) {
        await supabase.from("booking_services").delete().eq("user_id", user.id);
      }
      if (services.length > 0) {
        const aiServiceMap = new Map(aiSetup?.services.map(s => [s.name, s]) || []);
        await supabase.from("booking_services").insert(
          services.map(s => {
            const aiSvc = aiServiceMap.get(s);
            return {
              user_id: user.id, name: s,
              description: aiSvc?.description || null,
              duration_min: aiSvc?.duration_min || 30,
              active: true,
            };
          })
        );
      }

      // 5. Email templates
      if (isReOnboarding) {
        await supabase.from("email_templates").delete().eq("user_id", user.id);
      }
      const templates = (selectedProfession.default_email_templates as any[]) || [];
      if (templates.length > 0) {
        await supabase.from("email_templates").insert(
          templates.map((t: any) => ({ user_id: user.id, name: t.name, subject: t.subject, body: t.body }))
        );
      }

      await queryClient.invalidateQueries({ queryKey: ["profile-onboarding"] });
      setLaunched(true);

      // Record referral signup if user was referred
      try {
        await supabase.functions.invoke("referral-system", {
          body: { action: "record_signup" },
        });
      } catch {
        // Non-critical, don't block onboarding
      }
    } catch (err: any) {
      console.error("Onboarding error:", err);
      toast({ title: "Something went wrong", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Create real estimate
  const handleCreateEstimate = async (data: {
    clientName: string; clientEmail: string; clientPhone: string;
    serviceName: string; price: number; sendNow: boolean;
  }) => {
    if (!user) return;
    setEstimateSaving(true);
    try {
      // Create lead first
      let leadId: string | null = null;
      if (data.clientName) {
        const { data: lead, error: leadErr } = await supabase
          .from("leads")
          .insert([{
            user_id: user.id,
            name: data.clientName,
            email: data.clientEmail || null,
            phone: data.clientPhone || null,
            source: "manual" as const,
          }])
          .select("id")
          .single();
        if (leadErr) throw leadErr;
        leadId = lead.id;
      }

      // Create estimate
      const lineItem = calculateLineTotals({
        title: data.serviceName,
        quantity: 1,
        unit: "job",
        unit_price: data.price,
        labor_hours: 0,
        labor_rate: 0,
        material_cost: 0,
        markup_percent: 0,
        tax_percent: 0,
        sort_order: 0,
        calc_mode: "manual" as any,
        calc_length: 0,
        calc_width: 0,
        calc_depth: 0,
        is_optional: false,
      });

      const estimateNumber = generateEstimateNumber();
      const status = data.sendNow ? "sent" : "draft";

      const { data: estimate, error: estErr } = await supabase
        .from("estimates")
        .insert({
          user_id: user.id,
          estimate_number: estimateNumber,
          status,
          issue_date: new Date().toISOString().split("T")[0],
          lead_id: leadId,
          subtotal: lineItem.line_total,
          grand_total: lineItem.line_total,
        } as any)
        .select()
        .single();
      if (estErr) throw estErr;

      // Add line item
      const { error: liErr } = await supabase.from("estimate_line_items").insert({
        estimate_id: estimate.id,
        title: lineItem.title,
        quantity: lineItem.quantity,
        unit: lineItem.unit,
        unit_price: lineItem.unit_price,
        line_total: lineItem.line_total,
        sort_order: 0,
      } as any);
      if (liErr) throw liErr;

      setEstimateCreated(true);
      toast({
        title: data.sendNow ? "Estimate sent! 🎉" : "Estimate saved as draft",
        description: data.sendNow
          ? `Sent to ${data.clientName}`
          : "You can send it from the Estimates page",
      });
      setStep(6); // Go to sharing
    } catch (err: any) {
      console.error("Estimate error:", err);
      toast({ title: "Error creating estimate", description: err.message, variant: "destructive" });
    } finally {
      setEstimateSaving(false);
    }
  };

  // Auto-launch card when we reach step 4 (card preview) 
  useEffect(() => {
    if (step === 4 && !launched && !saving) {
      handleLaunchCard();
    }
  }, [step]);

  const totalSteps = 7;
  const handle = (name || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const cardUrl = `${window.location.origin}/${handle}`;
  const shareMessage = `Hey! I just set up my digital business card — check it out and let me know if you ever need ${selectedProfession?.name?.toLowerCase() || "my"} services: ${cardUrl}`;

  // Use profession-aware checklist template
  const checklistTemplate = getChecklistTemplate(
    selectedProfession?.name,
    selectedProfession?.category,
  );

  const onboardingSignals: Record<string, boolean> = {
    card_published: launched,
    has_services: services.length > 0,
    has_image: launched,
    estimate_sent: estimateCreated,
    has_views: false,
    has_lead: false,
    has_booking: false,
    has_review: false,
  };

  const checklistItems = checklistTemplate.steps.map((step) => ({
    label: step.label,
    done: onboardingSignals[step.signal] ?? false,
    route: step.route,
  }));

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">
            <span className="font-extrabold text-primary">guzzl</span><span className="text-foreground">.pro</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Set up → Send an estimate → Start earning</p>
        </div>

        {/* Progress */}
        {step > 0 && step < totalSteps && (
          <div className="flex gap-1.5 mb-6">
            {[...Array(totalSteps)].map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i < step ? "bg-primary" : i === step ? "bg-primary/50" : "bg-muted"
              }`} />
            ))}
          </div>
        )}

        <div className={`rounded-2xl border border-border bg-card shadow-lg ${step === 0 || step === 7 ? "p-8" : "p-6"}`}>
          <AnimatePresence mode="wait">
            {/* Step 0: Welcome */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -20 }} className="text-center space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                  className="mx-auto h-20 w-20 rounded-2xl flex items-center justify-center"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Rocket className="h-10 w-10 text-primary-foreground" />
                </motion.div>
                <div className="space-y-2">
                  <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-foreground">
                    Start earning in 5 minutes
                  </motion.h2>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    className="text-sm text-muted-foreground max-w-xs mx-auto">
                    We'll create your digital card, set up your services, and help you send your first estimate — right now.
                  </motion.p>
                </div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="space-y-3">
                  <div className="flex items-center gap-3 text-left px-4">
                    {[
                      { icon: Sparkles, text: "AI builds your card instantly" },
                      { icon: CalendarCheck, text: "Send an estimate in minutes" },
                      { icon: Share2, text: "Share & start getting leads" },
                    ].map(({ icon: Icon, text }, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50">
                        <Icon className="h-5 w-5 text-primary" />
                        <span className="text-xs text-center text-muted-foreground font-medium">{text}</span>
                      </div>
                    ))}
                  </div>
                  <Button onClick={() => setStep(1)} size="lg" className="w-full h-12 text-base font-semibold gap-2">
                    Get Started <ArrowRight className="h-5 w-5" />
                  </Button>
                  <p className="text-[11px] text-muted-foreground">Takes less than 5 minutes · No credit card required</p>
                </motion.div>
              </motion.div>
            )}

            {/* Step 1: Profession */}
            {step === 1 && (
              <StepProfession
                professions={professions}
                selectedId={selectedProfessionId}
                onSelect={setSelectedProfessionId}
                onNext={() => setStep(2)}
              />
            )}

            {/* Step 2: Business Info */}
            {step === 2 && (
              <StepBusinessInfo
                name={name} company={company} phone={phone} city={city}
                onNameChange={setName} onCompanyChange={setCompany}
                onPhoneChange={setPhone} onCityChange={setCityOrGenerate}
                onNext={() => {
                  setStep(3);
                  generateAISetup();
                }}
                onBack={() => setStep(1)}
              />
            )}

            {/* Step 3: Services */}
            {step === 3 && (
              <StepServices
                services={services}
                onServicesChange={setServices}
                aiServices={aiSetup?.services}
                professionName={selectedProfession?.name}
                defaultServices={selectedProfession?.default_booking_services as any[]}
                onNext={() => setStep(4)}
                onBack={() => setStep(2)}
              />
            )}

            {/* Step 4: Card Preview + Auto-publish */}
            {step === 4 && (
              <StepCardPreview
                name={name}
                company={company}
                phone={phone}
                city={city}
                tagline={aiSetup?.tagline}
                services={services}
                aiLoading={saving || aiLoading}
                onNext={() => setStep(5)}
                onBack={() => setStep(3)}
              />
            )}

            {/* Step 5: First Estimate */}
            {step === 5 && (
              <StepFirstEstimate
                services={services}
                aiServices={aiSetup?.services}
                onCreateEstimate={handleCreateEstimate}
                onSkip={() => setStep(6)}
                onBack={() => setStep(4)}
                saving={estimateSaving}
              />
            )}

            {/* Step 6: Sharing */}
            {step === 6 && (
              <StepSharing
                cardUrl={cardUrl}
                shareMessage={shareMessage}
                onNext={() => setStep(7)}
              />
            )}

            {/* Step 7: Activation Checklist */}
            {step === 7 && (
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

  // Helper: setCity wrapper (used in JSX as onCityChange)
  function setCityOrGenerate(v: string) {
    setCity(v);
  }
}
