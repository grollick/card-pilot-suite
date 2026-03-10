import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, ArrowRight, ArrowLeft, Sparkles, Check, Loader2,
  Rocket, Eye, Share2, QrCode, LayoutDashboard, Camera, CalendarCheck, FileText, Plus, X, Star,
  Wand2, Edit3, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { pickStylePackKey } from "@/lib/stylePackSelection";
import { getBestTemplateForProfession, getTemplate, CARD_TEMPLATES, type CardTemplate } from "@/lib/cardTemplates";

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

/* ── Mini live card preview ── */
function LiveCardPreview({ name, company, phone, city, profession, tagline }: {
  name: string; company: string; phone: string; city: string; profession?: string; tagline?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-md">
      <div className="h-20 bg-gradient-to-br from-primary to-accent relative">
        <div className="absolute -bottom-6 left-4 h-12 w-12 rounded-full bg-card border-2 border-card flex items-center justify-center text-primary font-bold text-lg">
          {name ? name[0].toUpperCase() : "?"}
        </div>
      </div>
      <div className="pt-8 px-4 pb-4 space-y-1">
        <p className="font-semibold text-sm text-foreground">{name || "Your Name"}</p>
        {tagline && <p className="text-xs text-primary font-medium">{tagline}</p>}
        {(company || profession) && (
          <p className="text-xs text-muted-foreground">{company || profession}</p>
        )}
        {city && <p className="text-[11px] text-muted-foreground">📍 {city}</p>}
        {phone && <p className="text-[11px] text-muted-foreground">📞 {phone}</p>}
        <div className="pt-2 flex gap-2">
          <span className="flex-1 text-center py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-medium">Call</span>
          <span className="flex-1 text-center py-1.5 rounded-lg bg-secondary text-secondary-foreground text-[11px] font-medium">Book</span>
        </div>
      </div>
    </div>
  );
}

/* ── Template mini card ── */
function TemplateMiniCard({ template, selected, onSelect, aiRecommended }: {
  template: CardTemplate; selected: boolean; onSelect: () => void; aiRecommended?: boolean;
}) {
  const enabledSections = template.sections.filter(s => s.enabled).map(s => s.id);
  return (
    <button
      onClick={onSelect}
      className={`rounded-xl border p-3 text-left transition-all relative ${
        selected ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20" : "border-border hover:border-primary/30"
      }`}
    >
      {selected && <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />}
      {aiRecommended && !selected && (
        <span className="absolute -top-2 left-2 z-10 text-[9px] bg-accent text-accent-foreground px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
          <Wand2 className="h-2.5 w-2.5" /> AI Pick
        </span>
      )}
      <p className="text-sm font-semibold mb-0.5">{template.name}</p>
      <p className="text-[11px] text-muted-foreground mb-2 line-clamp-2">{template.description}</p>
      <div className="flex flex-wrap gap-1">
        {enabledSections.slice(0, 5).map(s => (
          <span key={s} className="px-1.5 py-0.5 rounded bg-muted text-[9px] font-medium text-muted-foreground capitalize">
            {s.replace(/_/g, " ")}
          </span>
        ))}
        {enabledSections.length > 5 && (
          <span className="px-1.5 py-0.5 rounded bg-muted text-[9px] text-muted-foreground">+{enabledSections.length - 5}</span>
        )}
      </div>
    </button>
  );
}

/* ── AI Greeting messages ── */
const AI_MESSAGES = [
  "Analyzing your profession...",
  "Generating service recommendations...",
  "Crafting your bio and tagline...",
  "Finding the perfect template...",
  "Almost ready!",
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedProfessionId, setSelectedProfessionId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");

  // AI state
  const [aiSetup, setAiSetup] = useState<AISetup | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiMessageIdx, setAiMessageIdx] = useState(0);
  const [editingField, setEditingField] = useState<string | null>(null);

  const { data: professions = [] } = useQuery({
    queryKey: ["professions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("professions").select("*").order("category").order("name");
      if (error) throw error;
      return data as Profession[];
    },
  });

  const filtered = search
    ? professions.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : professions;

  const byCategory = filtered.reduce<Record<string, Profession[]>>((acc, p) => {
    const cat = search ? "Search Results" : p.category;
    (acc[cat] = acc[cat] || []).push(p);
    return acc;
  }, {});

  const selectedProfession = professions.find(p => p.id === selectedProfessionId);

  const categoryKey = useMemo(() => {
    if (!selectedProfession) return "";
    return categoryKeyMap[selectedProfession.category] || selectedProfession.category.toLowerCase().replace(/[^a-z]+/g, "_");
  }, [selectedProfession]);

  // Rotate AI loading messages
  useEffect(() => {
    if (!aiLoading) return;
    const interval = setInterval(() => {
      setAiMessageIdx(prev => (prev + 1) % AI_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [aiLoading]);

  // Generate AI setup
  const generateAISetup = async () => {
    if (!selectedProfession) return;
    setAiLoading(true);
    setAiError(null);
    setAiMessageIdx(0);

    try {
      const { data, error } = await supabase.functions.invoke("ai-onboarding-setup", {
        body: {
          profession: selectedProfession.name,
          name: name || undefined,
          company: company || undefined,
          city: city || undefined,
          business_description: businessDescription || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const setup = data.setup as AISetup;
      setAiSetup(setup);
      setServices(setup.services.map(s => s.name));

      // Use AI-recommended template or fallback
      const aiTemplate = CARD_TEMPLATES.find(t => t.id === setup.suggested_template);
      setSelectedTemplateId(aiTemplate ? setup.suggested_template : getBestTemplateForProfession(selectedProfession.name));
    } catch (err: any) {
      console.error("AI setup error:", err);
      setAiError(err.message || "AI setup failed");
      // Fallback to defaults
      const bestTemplate = getBestTemplateForProfession(selectedProfession.name);
      setSelectedTemplateId(bestTemplate);
      const defaultServices = (selectedProfession.default_booking_services as any[]) || [];
      setServices(defaultServices.slice(0, 4).map((s: any) => s.name));
    } finally {
      setAiLoading(false);
    }
  };

  // When profession selected, move to description input step
  const handleProfessionNext = () => {
    if (!selectedProfession) return;
    setStep(2);
  };

  // Trigger AI generation from step 2
  const handleDescriptionNext = () => {
    setStep(3);
    generateAISetup();
  };

  const sortedTemplates = useMemo(() => {
    const aiSuggested = aiSetup?.suggested_template;
    return [...CARD_TEMPLATES].sort((a, b) => {
      const aAI = a.id === aiSuggested ? 2 : 0;
      const bAI = b.id === aiSuggested ? 2 : 0;
      const aMatch = a.recommendedFor.includes(categoryKey) ? 1 : 0;
      const bMatch = b.recommendedFor.includes(categoryKey) ? 1 : 0;
      return (bAI + bMatch) - (aAI + aMatch);
    });
  }, [categoryKey, aiSetup]);

  const generateHandle = (fullName: string) => {
    return fullName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20) + Math.floor(Math.random() * 1000);
  };

  const addService = () => {
    const trimmed = newService.trim();
    if (trimmed && !services.includes(trimmed)) {
      setServices(prev => [...prev, trimmed]);
      setNewService("");
    }
  };

  const removeService = (idx: number) => {
    setServices(prev => prev.filter((_, i) => i !== idx));
  };

  const handleLaunch = async () => {
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

      // 1. Update profile with AI-generated bio
      const { error: profileErr } = await supabase.from("profiles").update({
        name,
        company: company || null,
        phone: phone || null,
        email: user.email,
        city: city || null,
        handle,
        profession_id: selectedProfession.id,
        style_pack: packKey,
        primary_cta: "call",
        bio: aiSetup?.bio || null,
        onboarding_completed: true,
      }).eq("id", user.id);
      if (profileErr) throw profileErr;

      // 2. Create card with AI content
      const selectedTemplate = selectedTemplateId ? getTemplate(selectedTemplateId) : null;
      const sectionsJson = selectedTemplate
        ? selectedTemplate.sections.map(s => ({
            id: s.id,
            label: s.id.charAt(0).toUpperCase() + s.id.slice(1).replace(/_/g, " "),
            enabled: s.enabled,
          }))
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
        status: "draft",
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

      // 4. Booking services with AI descriptions
      if (isReOnboarding) {
        await supabase.from("booking_services").delete().eq("user_id", user.id);
      }
      if (services.length > 0) {
        const aiServiceMap = new Map(aiSetup?.services.map(s => [s.name, s]) || []);
        await supabase.from("booking_services").insert(
          services.map(s => {
            const aiSvc = aiServiceMap.get(s);
            return {
              user_id: user.id,
              name: s,
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
      setStep(7);
    } catch (err: any) {
      console.error("Onboarding error:", err);
      toast({ title: "Something went wrong", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const totalSteps = 7;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
            CardPilot
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Launch your card in under 2 minutes</p>
        </div>

        {/* Progress */}
        {step < 7 && (
          <div className="flex gap-1.5 mb-6">
            {[...Array(totalSteps)].map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i < step ? "bg-primary" : "bg-muted"
              }`} />
            ))}
          </div>
        )}

        <div className={`rounded-2xl border border-border bg-card shadow-lg ${step === 7 ? "p-8" : "p-6"}`}>
          <AnimatePresence mode="wait">
            {/* ── Step 1: Profession ── */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">What do you do?</h2>
                  <p className="text-sm text-muted-foreground">We'll customize everything for your profession</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search professions..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
                  {Object.entries(byCategory).map(([cat, profs]) => (
                    <div key={cat}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{cat}</p>
                      <div className="space-y-0.5">
                        {profs.map(p => (
                          <button key={p.id} onClick={() => setSelectedProfessionId(p.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                              selectedProfessionId === p.id
                                ? "bg-primary/10 text-primary font-medium border border-primary/20"
                                : "hover:bg-muted"
                            }`}>
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={handleProfessionNext} disabled={!selectedProfessionId} className="w-full">
                  Continue <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </motion.div>
            )}

            {/* ── Step 2: Business Description ── */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Describe your business</h2>
                  <p className="text-sm text-muted-foreground">Tell us in one sentence what you do — AI will craft your entire card from this.</p>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Hi! I can help set up your card in seconds.</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Describe your business and I'll generate your tagline, bio, services, and more.</p>
                  </div>
                </div>

                <textarea
                  value={businessDescription}
                  onChange={e => setBusinessDescription(e.target.value)}
                  placeholder={`e.g. "Landscaping company specializing in patios and garden design."`}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring resize-none placeholder:text-muted-foreground"
                />

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button onClick={handleDescriptionNext} className="flex-1">
                    <Sparkles className="h-4 w-4 mr-1" /> Generate My Card <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                <button
                  onClick={() => { setStep(3); generateAISetup(); }}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
                >
                  Skip — set up without a description
                </button>
              </motion.div>
            )}

            {/* ── Step 3: AI Setup Assistant ── */}
            {step === 3 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                {aiLoading ? (
                  <div className="text-center py-10 space-y-5">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      <Sparkles className="h-8 w-8 text-primary-foreground" />
                    </motion.div>
                    <div>
                      <h2 className="text-lg font-semibold">Setting up your card</h2>
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={aiMessageIdx}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-sm text-muted-foreground mt-1"
                        >
                          {AI_MESSAGES[aiMessageIdx]}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                    <div className="flex justify-center gap-1.5">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                          className="h-2 w-2 rounded-full bg-primary"
                        />
                      ))}
                    </div>
                  </div>
                ) : aiSetup ? (
                  <>
                    {/* AI greeting */}
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
                        <Sparkles className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Hi! I've set up your {selectedProfession?.name} card.</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Review what I've prepared — edit anything you'd like to change.</p>
                      </div>
                    </div>

                    {/* Generated content preview */}
                    <div className="space-y-3">
                      {/* Tagline */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <Wand2 className="h-3 w-3" /> Tagline
                        </label>
                        {editingField === "tagline" ? (
                          <Input
                            value={aiSetup.tagline}
                            onChange={e => setAiSetup({ ...aiSetup, tagline: e.target.value })}
                            onBlur={() => setEditingField(null)}
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => setEditingField("tagline")}
                            className="w-full text-left px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm hover:border-primary/30 transition-colors flex items-center justify-between group"
                          >
                            <span>{aiSetup.tagline}</span>
                            <Edit3 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        )}
                      </div>

                      {/* Bio */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <Wand2 className="h-3 w-3" /> Bio
                        </label>
                        {editingField === "bio" ? (
                          <textarea
                            value={aiSetup.bio}
                            onChange={e => setAiSetup({ ...aiSetup, bio: e.target.value })}
                            onBlur={() => setEditingField(null)}
                            autoFocus
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:ring-1 focus:ring-ring resize-none"
                          />
                        ) : (
                          <button
                            onClick={() => setEditingField("bio")}
                            className="w-full text-left px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm hover:border-primary/30 transition-colors flex items-center justify-between group"
                          >
                            <span className="line-clamp-2">{aiSetup.bio}</span>
                            <Edit3 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </button>
                        )}
                      </div>

                      {/* Services preview */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <Wand2 className="h-3 w-3" /> Services ({aiSetup.services.length})
                        </label>
                        <div className="space-y-1">
                          {aiSetup.services.slice(0, 4).map((svc, i) => (
                            <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-muted/30 border border-border text-sm">
                              <span className="font-medium text-foreground">{svc.name}</span>
                              <span className="text-xs text-muted-foreground">{svc.price_range}</span>
                            </div>
                          ))}
                          {aiSetup.services.length > 4 && (
                            <p className="text-xs text-muted-foreground text-center">+{aiSetup.services.length - 4} more</p>
                          )}
                        </div>
                      </div>

                      {/* Setup tips */}
                      {aiSetup.setup_tips.length > 0 && (
                        <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 space-y-1.5">
                          <p className="text-xs font-semibold text-accent-foreground">💡 Tips for your card</p>
                          {aiSetup.setup_tips.map((tip, i) => (
                            <p key={i} className="text-xs text-muted-foreground">• {tip}</p>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setAiSetup(null);
                        setStep(2);
                      }}>
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back
                      </Button>
                      <Button variant="ghost" size="sm" onClick={generateAISetup} className="text-muted-foreground">
                        <RefreshCw className="h-3.5 w-3.5 mr-1" /> Regenerate
                      </Button>
                      <Button onClick={() => setStep(4)} className="flex-1">
                        Looks good! <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </>
                ) : (
                  /* AI failed — fallback */
                  <div className="text-center py-6 space-y-4">
                    <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">AI setup isn't available right now</p>
                      <p className="text-xs text-muted-foreground mt-1">{aiError || "Don't worry — you can set everything up manually!"}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back
                      </Button>
                      <Button onClick={() => setStep(4)} className="flex-1">
                        Continue manually <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Step 4: Business Info + Live Preview ── */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Your business info</h2>
                  <p className="text-sm text-muted-foreground">This appears on your card</p>
                </div>

                <LiveCardPreview name={name} company={company} phone={phone} city={city} profession={selectedProfession?.name} tagline={aiSetup?.tagline} />

                <div className="space-y-3">
                  <Input placeholder="Full name *" value={name} onChange={e => setName(e.target.value)} />
                  <Input placeholder="Business name (optional)" value={company} onChange={e => setCompany(e.target.value)} />
                  <Input placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)} />
                  <Input placeholder="City / Location" value={city} onChange={e => setCity(e.target.value)} />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button onClick={() => setStep(5)} disabled={!name} className="flex-1">
                    Continue <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── Step 5: Template Selection ── */}
            {step === 5 && (
              <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Choose a layout</h2>
                  <p className="text-sm text-muted-foreground">
                    {aiSetup ? "We've highlighted our AI recommendation" : "Pick the template that fits your business"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                  {sortedTemplates.map((t) => (
                    <div key={t.id} className="relative">
                      <TemplateMiniCard
                        template={t}
                        selected={selectedTemplateId === t.id}
                        onSelect={() => setSelectedTemplateId(t.id)}
                        aiRecommended={t.id === aiSetup?.suggested_template}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(4)} className="flex-1">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button onClick={() => setStep(5)} className="flex-1">
                    Continue <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── Step 5: Services ── */}
            {step === 5 && (
              <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Your services</h2>
                  <p className="text-sm text-muted-foreground">
                    {aiSetup ? "AI-generated for you — edit or add more" : "Add a few services you offer"}
                  </p>
                </div>

                {/* Service chips */}
                <div className="flex flex-wrap gap-2 min-h-[40px]">
                  {services.map((s, i) => (
                    <motion.span
                      key={s}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
                    >
                      {s}
                      <button onClick={() => removeService(i)} className="hover:text-destructive transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </motion.span>
                  ))}
                  {services.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No services added yet</p>
                  )}
                </div>

                {/* Add new */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a service..."
                    value={newService}
                    onChange={e => setNewService(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addService()}
                  />
                  <Button variant="outline" size="icon" onClick={addService} disabled={!newService.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* AI service details */}
                {aiSetup && (() => {
                  const unusedAI = aiSetup.services.filter(s => !services.includes(s.name));
                  if (unusedAI.length === 0) return null;
                  return (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        <Wand2 className="h-3 w-3" /> More AI suggestions:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {unusedAI.map(s => (
                          <button key={s.name} onClick={() => setServices(prev => [...prev, s.name])}
                            className="px-2.5 py-1 rounded-full border border-dashed border-primary/30 text-xs text-primary hover:bg-primary/5 transition-colors">
                            + {s.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Fallback: profession default suggestions */}
                {!aiSetup && selectedProfession && (() => {
                  const defaults = (selectedProfession.default_booking_services as any[]) || [];
                  const suggestions = defaults.map((s: any) => s.name).filter((s: string) => !services.includes(s));
                  if (suggestions.length === 0) return null;
                  return (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">Suggested for {selectedProfession.name}:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions.slice(0, 6).map((s: string) => (
                          <button key={s} onClick={() => setServices(prev => [...prev, s])}
                            className="px-2.5 py-1 rounded-full border border-dashed border-primary/30 text-xs text-primary hover:bg-primary/5 transition-colors">
                            + {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(4)} className="flex-1">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button onClick={handleLaunch} disabled={saving} className="flex-1">
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <><Rocket className="h-4 w-4 mr-1" /> Launch My Card</>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── Step 6: Launch Celebration ── */}
            {step === 6 && launched && (
              <motion.div key="s6" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
                  className="mx-auto h-20 w-20 rounded-full flex items-center justify-center text-4xl"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  🎉
                </motion.div>

                <div>
                  <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-xl font-bold">
                    Your card is live!
                  </motion.h2>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-sm text-muted-foreground mt-1">
                    {aiSetup ? "AI helped you set up in record time" : "You're ready to start capturing leads"}
                  </motion.p>
                </div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="grid grid-cols-2 gap-3">
                  <Button onClick={() => navigate("/app/card")} className="gap-2">
                    <Eye className="h-4 w-4" /> View Card
                  </Button>
                  <Button variant="outline" onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + "/c/" + (name || "").toLowerCase().replace(/[^a-z0-9]+/g, ""));
                    toast({ title: "Link copied!" });
                  }} className="gap-2">
                    <Share2 className="h-4 w-4" /> Share Link
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/app/card")} className="gap-2">
                    <QrCode className="h-4 w-4" /> QR Code
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/app")} className="gap-2">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Button>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="pt-4 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-3">Optional: Make it even better</p>
                  <div className="flex flex-col gap-2">
                    {[
                      { icon: Camera, label: "Add photos to your card", path: "/app/card" },
                      { icon: CalendarCheck, label: "Enable online booking", path: "/app/bookings" },
                      { icon: FileText, label: "Create your first estimate", path: "/app/estimates" },
                    ].map(({ icon: Icon, label, path }) => (
                      <button
                        key={label}
                        onClick={() => navigate(path)}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
                      >
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">{label}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
