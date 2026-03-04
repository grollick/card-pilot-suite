import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, ArrowLeft, Sparkles, Check, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { pickStylePackKey, getRecommendedPacks, type StylePack } from "@/lib/stylePackSelection";
import { useGenerateCardContent, type GeneratedCardContent } from "@/hooks/useGenerateContent";

interface Profession {
  id: string;
  name: string;
  category: string;
  default_card_sections: any;
  default_pipeline_stages: any;
  default_booking_services: any;
  default_email_templates: any;
}

const ctaOptions = [
  { id: "call", label: "Call Me", icon: "📞" },
  { id: "text", label: "Text Me", icon: "💬" },
  { id: "book", label: "Book Now", icon: "📅" },
  { id: "quote", label: "Get a Quote", icon: "💰" },
];

const styleChoices = [
  { id: "Modern", name: "Modern", desc: "Clean lines, bold colors", preview: "bg-gradient-to-br from-primary/20 to-primary/5" },
  { id: "Elegant", name: "Elegant", desc: "Refined, sophisticated", preview: "bg-gradient-to-br from-amber-100 to-amber-50" },
  { id: "Bold", name: "Bold", desc: "Strong, high-contrast", preview: "bg-gradient-to-br from-gray-900 to-gray-700" },
];

// Category key mapping from display name
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
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedProfessionId, setSelectedProfessionId] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("Modern");
  const [selectedPackKey, setSelectedPackKey] = useState("");
  const [selectedCTA, setSelectedCTA] = useState("call");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);
  const { generate, isGenerating, content: aiContent, setContent: setAiContent } = useGenerateCardContent();
  const [editingField, setEditingField] = useState<string | null>(null);

  const { data: professions = [] } = useQuery({
    queryKey: ["professions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("professions").select("*").order("category").order("name");
      if (error) throw error;
      return data as Profession[];
    },
  });

  const { data: stylePacks = [] } = useQuery({
    queryKey: ["style_packs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("style_packs").select("*");
      if (error) throw error;
      return data as unknown as StylePack[];
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

  // Get category key for selected profession
  const categoryKey = useMemo(() => {
    if (!selectedProfession) return "";
    return categoryKeyMap[selectedProfession.category] || selectedProfession.category.toLowerCase().replace(/[^a-z]+/g, "_");
  }, [selectedProfession]);

  // Filter and sort packs for the chosen style, prioritizing recommended ones
  const availablePacks = useMemo(() => {
    const packsForStyle = stylePacks.filter(p => p.style === selectedStyle);
    if (!categoryKey) return packsForStyle;

    const recommended = getRecommendedPacks(selectedStyle, categoryKey);
    return [...packsForStyle].sort((a, b) => {
      const aIdx = recommended.indexOf(a.key);
      const bIdx = recommended.indexOf(b.key);
      if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
      if (aIdx >= 0) return -1;
      if (bIdx >= 0) return 1;
      return 0;
    });
  }, [stylePacks, selectedStyle, categoryKey]);

  // Auto-select best pack when style or category changes
  const autoSelectedPackKey = useMemo(() => {
    if (!categoryKey) return availablePacks[0]?.key || "";
    return pickStylePackKey(selectedStyle, categoryKey);
  }, [selectedStyle, categoryKey, availablePacks]);

  // Use explicit selection or auto
  const effectivePackKey = selectedPackKey || autoSelectedPackKey;
  const effectivePack = stylePacks.find(p => p.key === effectivePackKey);

  const generateHandle = (fullName: string) => {
    return fullName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20) + Math.floor(Math.random() * 1000);
  };

  const handleLaunch = async () => {
    if (!user || !selectedProfession) return;
    setSaving(true);

    try {
      const handle = generateHandle(name || user.email || "user");
      const palette = effectivePack?.default_palettes?.[0] || {};

      // 1. Update profile
      const { error: profileErr } = await supabase.from("profiles").update({
        name,
        company: company || null,
        phone: phone || null,
        email,
        handle,
        profession_id: selectedProfession.id,
        style_pack: effectivePackKey,
        primary_cta: selectedCTA,
        onboarding_completed: true,
      }).eq("id", user.id);
      if (profileErr) throw profileErr;

      // 2. Create card with profession defaults + style pack tokens
      const themeJson = {
        style_pack: effectivePackKey,
        primary_cta: selectedCTA,
        tokens: effectivePack?.theme_tokens || {},
        palette,
      };
      const sectionsJson = selectedProfession.default_card_sections || [];
      const { error: cardErr } = await supabase.from("cards").insert({
        user_id: user.id,
        theme_json: themeJson,
        sections_json: sectionsJson,
        status: "draft",
      });
      if (cardErr) throw cardErr;

      // 3. Create pipeline stages
      const stages = (selectedProfession.default_pipeline_stages as string[]) || [];
      if (stages.length > 0) {
        const stageRows = stages.map((stageName: string, i: number) => ({
          user_id: user.id,
          name: stageName,
          sort_order: i,
        }));
        const { error: stagesErr } = await supabase.from("pipeline_stages").insert(stageRows);
        if (stagesErr) throw stagesErr;
      }

      // 4. Create booking services
      const services = (selectedProfession.default_booking_services as any[]) || [];
      if (services.length > 0) {
        const serviceRows = services.map((s: any) => ({
          user_id: user.id,
          name: s.name,
          duration_min: s.durationMin || s.duration_min || 30,
          price: s.price ?? null,
          description: s.description || null,
          active: true,
        }));
        const { error: servicesErr } = await supabase.from("booking_services").insert(serviceRows);
        if (servicesErr) throw servicesErr;
      }

      // 5. Create email templates
      const templates = (selectedProfession.default_email_templates as any[]) || [];
      if (templates.length > 0) {
        const templateRows = templates.map((t: any) => ({
          user_id: user.id,
          name: t.name,
          subject: t.subject,
          body: t.body,
        }));
        const { error: templatesErr } = await supabase.from("email_templates").insert(templateRows);
        if (templatesErr) throw templatesErr;
      }

      toast({ title: "You're all set! 🎉", description: "Your card and workspace are ready." });
      await queryClient.invalidateQueries({ queryKey: ["profile-onboarding"] });
      navigate("/app");
    } catch (err: any) {
      console.error("Onboarding error:", err);
      toast({ title: "Something went wrong", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const totalSteps = 5;

  const handleGenerateContent = async () => {
    if (!selectedProfession) return;
    setStep(4);
    await generate({
      profession: selectedProfession.name,
      name,
      company: company || undefined,
      city: city || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold gradient-text">CardPilot</h1>
          <p className="text-sm text-muted-foreground mt-1">The card that automatically follows up with every lead</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1 mb-6">
          {[...Array(totalSteps)].map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <AnimatePresence mode="wait">
            {/* Step 1: Profession */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">What do you do?</h2>
                  <p className="text-sm text-muted-foreground">Choose your profession</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search professions..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
                  {Object.entries(byCategory).map(([cat, profs]) => (
                    <div key={cat}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{cat}</p>
                      <div className="space-y-1">
                        {profs.map(p => (
                          <button key={p.id} onClick={() => setSelectedProfessionId(p.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                              selectedProfessionId === p.id ? "bg-primary/10 text-primary font-medium border border-primary/20" : "hover:bg-muted"
                            }`}>
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={() => setStep(2)} disabled={!selectedProfessionId} className="w-full">
                  Continue <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </motion.div>
            )}

            {/* Step 2: Style + Pack */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Choose your style</h2>
                  <p className="text-sm text-muted-foreground">Pick a vibe, then a theme</p>
                </div>

                {/* Style selector */}
                <div className="grid grid-cols-3 gap-3">
                  {styleChoices.map(s => (
                    <button key={s.id} onClick={() => { setSelectedStyle(s.id); setSelectedPackKey(""); }}
                      className={`rounded-xl border p-3 text-center transition-all ${
                        selectedStyle === s.id ? "border-primary shadow-glow" : "border-border hover:border-primary/30"
                      }`}>
                      <div className={`h-12 rounded-lg mb-2 ${s.preview}`} />
                      <p className="text-xs font-semibold">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Pack sub-selection */}
                {availablePacks.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Theme variant</p>
                    <div className="grid grid-cols-2 gap-2">
                      {availablePacks.map((pack, i) => {
                        const palette = (pack.default_palettes as any[])?.[0];
                        const isSelected = effectivePackKey === pack.key;
                        const isRecommended = i === 0;
                        return (
                          <button key={pack.key} onClick={() => setSelectedPackKey(pack.key)}
                            className={`relative rounded-xl border p-3 text-left transition-all ${
                              isSelected ? "border-primary bg-primary/5 shadow-glow" : "border-border hover:border-primary/30"
                            }`}>
                            {isRecommended && (
                              <span className="absolute -top-2 right-2 text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-semibold">
                                Best fit
                              </span>
                            )}
                            {/* Color preview */}
                            <div className="flex gap-1 mb-2">
                              {palette && (
                                <>
                                  <div className="h-6 w-6 rounded-full border border-border" style={{ background: palette.primary }} />
                                  <div className="h-6 w-6 rounded-full border border-border" style={{ background: palette.accent }} />
                                  <div className="h-6 w-6 rounded-full border border-border" style={{ background: palette.background }} />
                                </>
                              )}
                            </div>
                            <p className="text-xs font-semibold">{pack.name}</p>
                            {isSelected && <Check className="absolute top-3 right-3 h-3.5 w-3.5 text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
                  <Button onClick={() => setStep(3)} className="flex-1">Continue <ArrowRight className="h-4 w-4 ml-1" /></Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Essentials */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">The essentials</h2>
                  <p className="text-sm text-muted-foreground">Add your basic info</p>
                </div>
                <Input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
                <Input placeholder="Company (optional)" value={company} onChange={e => setCompany(e.target.value)} />
                <Input placeholder="City / Location (optional)" value={city} onChange={e => setCity(e.target.value)} />
                <Input placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)} />
                <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
                  <Button onClick={handleGenerateContent} className="flex-1" disabled={!name}>
                    <Sparkles className="h-4 w-4 mr-1" /> Generate Card <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: AI-Generated Content Review */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" /> AI-Generated Content
                  </h2>
                  <p className="text-sm text-muted-foreground">Review and edit your card copy</p>
                </div>

                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Writing your card content...</p>
                  </div>
                ) : aiContent ? (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {([
                      { key: "tagline", label: "Tagline" },
                      { key: "bio", label: "Bio" },
                      { key: "about", label: "About" },
                      { key: "cta_text", label: "Call to Action" },
                      { key: "instagram_bio", label: "Social Bio" },
                    ] as const).map(({ key, label }) => (
                      <div key={key} className="rounded-lg border border-border/50 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
                          <button onClick={() => setEditingField(editingField === key ? null : key)}
                            className="text-muted-foreground hover:text-foreground">
                            <Pencil className="h-3 w-3" />
                          </button>
                        </div>
                        {editingField === key ? (
                          <Textarea
                            value={aiContent[key]}
                            onChange={e => setAiContent({ ...aiContent, [key]: e.target.value })}
                            className="min-h-[40px] text-sm"
                            autoFocus
                          />
                        ) : (
                          <p className="text-sm">{aiContent[key]}</p>
                        )}
                      </div>
                    ))}

                    {/* Services */}
                    <div className="rounded-lg border border-border/50 p-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Services</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {aiContent.services.map((s, i) => (
                          <span key={i} className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground mb-3">Content generation failed</p>
                    <Button variant="outline" size="sm" onClick={handleGenerateContent}>
                      <Sparkles className="h-4 w-4 mr-1" /> Try Again
                    </Button>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
                  <Button onClick={() => setStep(5)} className="flex-1" disabled={isGenerating || !aiContent}>
                    Looks Great <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                {aiContent && (
                  <Button variant="ghost" size="sm" className="w-full text-xs" onClick={handleGenerateContent} disabled={isGenerating}>
                    <Sparkles className="h-3 w-3 mr-1" /> Regenerate
                  </Button>
                )}
              </motion.div>
            )}

            {/* Step 5: CTA */}
            {step === 5 && (
              <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Primary action</h2>
                  <p className="text-sm text-muted-foreground">What should visitors do first?</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {ctaOptions.map(c => (
                    <button key={c.id} onClick={() => setSelectedCTA(c.id)}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        selectedCTA === c.id ? "border-primary bg-primary/5 shadow-glow" : "border-border hover:border-primary/30"
                      }`}>
                      <span className="text-2xl mb-1 block">{c.icon}</span>
                      <p className="text-sm font-medium">{c.label}</p>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(4)} className="flex-1"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
                  <Button onClick={handleLaunch} disabled={saving} className="flex-1 shadow-glow">
                    {saving ? (
                      <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-1" /> Launch My Card</>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
