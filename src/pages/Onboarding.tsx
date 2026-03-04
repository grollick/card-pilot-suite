import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const stylePacks = [
  { id: "modern", name: "Modern", desc: "Clean lines, bold colors", preview: "bg-gradient-to-br from-primary/20 to-primary/5" },
  { id: "elegant", name: "Elegant", desc: "Refined, sophisticated", preview: "bg-gradient-to-br from-amber-100 to-amber-50" },
  { id: "bold", name: "Bold", desc: "Strong, high-contrast", preview: "bg-gradient-to-br from-gray-900 to-gray-700" },
];

const ctaOptions = [
  { id: "call", label: "Call Me", icon: "📞" },
  { id: "text", label: "Text Me", icon: "💬" },
  { id: "book", label: "Book Now", icon: "📅" },
  { id: "quote", label: "Get a Quote", icon: "💰" },
];

interface Profession {
  id: string;
  name: string;
  category: string;
  default_card_sections: any;
  default_pipeline_stages: any;
  default_booking_services: any;
  default_email_templates: any;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedProfessionId, setSelectedProfessionId] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("modern");
  const [selectedCTA, setSelectedCTA] = useState("call");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);

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

  const generateHandle = (fullName: string) => {
    return fullName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20) + Math.floor(Math.random() * 1000);
  };

  const handleLaunch = async () => {
    if (!user || !selectedProfession) return;
    setSaving(true);

    try {
      const handle = generateHandle(name || user.email || "user");

      // 1. Update profile
      const { error: profileErr } = await supabase.from("profiles").update({
        name,
        company: company || null,
        phone: phone || null,
        email,
        handle,
        profession_id: selectedProfession.id,
        style_pack: selectedStyle,
        primary_cta: selectedCTA,
        onboarding_completed: true,
      }).eq("id", user.id);
      if (profileErr) throw profileErr;

      // 2. Create card with profession defaults
      const themeJson = { style_pack: selectedStyle, primary_cta: selectedCTA };
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
      navigate("/app");
    } catch (err: any) {
      console.error("Onboarding error:", err);
      toast({ title: "Something went wrong", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const totalSteps = 4;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold gradient-text">CardPilot</h1>
          <p className="text-sm text-muted-foreground mt-1">Let's set up your digital business card</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1 mb-6">
          {[...Array(totalSteps)].map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <AnimatePresence mode="wait">
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

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Choose your style</h2>
                  <p className="text-sm text-muted-foreground">Pick a card template</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {stylePacks.map(s => (
                    <button key={s.id} onClick={() => setSelectedStyle(s.id)}
                      className={`rounded-xl border p-3 text-center transition-all ${
                        selectedStyle === s.id ? "border-primary shadow-glow" : "border-border hover:border-primary/30"
                      }`}>
                      <div className={`h-20 rounded-lg mb-2 ${s.preview}`} />
                      <p className="text-xs font-semibold">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
                  <Button onClick={() => setStep(3)} className="flex-1">Continue <ArrowRight className="h-4 w-4 ml-1" /></Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">The essentials</h2>
                  <p className="text-sm text-muted-foreground">Add your basic info</p>
                </div>
                <Input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
                <Input placeholder="Company (optional)" value={company} onChange={e => setCompany(e.target.value)} />
                <Input placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)} />
                <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
                  <Button onClick={() => setStep(4)} className="flex-1" disabled={!name}>Continue <ArrowRight className="h-4 w-4 ml-1" /></Button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
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
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
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
