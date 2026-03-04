import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, ArrowLeft, Check, Upload, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { professions, getProfessionsByCategory } from "@/data/professions";

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

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedProfession, setSelectedProfession] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("modern");
  const [selectedCTA, setSelectedCTA] = useState("call");

  const byCategory = getProfessionsByCategory();
  const filteredProfessions = search
    ? professions.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : professions;

  const filteredByCategory = search
    ? { "Search Results": filteredProfessions }
    : byCategory;

  const totalSteps = 4;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg">
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
                  {Object.entries(filteredByCategory).map(([cat, profs]) => (
                    <div key={cat}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{cat}</p>
                      <div className="space-y-1">
                        {profs.map(p => (
                          <button key={p.name} onClick={() => setSelectedProfession(p.name)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                              selectedProfession === p.name ? "bg-primary/10 text-primary font-medium border border-primary/20" : "hover:bg-muted"
                            }`}>
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={() => setStep(2)} disabled={!selectedProfession} className="w-full">
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
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/70 transition-colors">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="text-sm text-muted-foreground">Upload headshot</div>
                </div>
                <Input placeholder="Full name" />
                <Input placeholder="Company (optional)" />
                <Input placeholder="Phone number" />
                <Input type="email" placeholder="Email" />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
                  <Button onClick={() => setStep(4)} className="flex-1">Continue <ArrowRight className="h-4 w-4 ml-1" /></Button>
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
                  <Button onClick={() => navigate("/app")} className="flex-1 shadow-glow">
                    <Sparkles className="h-4 w-4 mr-1" /> Launch My Card
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
