import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Send, ChevronRight, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ResolvedCardTheme } from "@/lib/cardTokens";
import CardSectionWrapper from "./CardSectionWrapper";
import CardButton from "./CardButton";

// ── Profession calculator presets ──

export interface CalcOption {
  label: string;
  value: string;
  priceMin: number;
  priceMax: number;
}

export interface CalcField {
  id: string;
  label: string;
  type: "select" | "slider" | "toggle";
  options?: CalcOption[];
  /** For sliders */
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  /** Price per unit for sliders */
  pricePerUnit?: number;
  pricePerUnitMax?: number;
}

export interface CalcPreset {
  id: string;
  name: string;
  professions: string[];
  fields: CalcField[];
  basePrice: number;
  basePriceMax: number;
  disclaimer?: string;
}

export const CALCULATOR_PRESETS: CalcPreset[] = [
  {
    id: "landscaper",
    name: "Landscaping",
    professions: ["landscaper", "lawn care", "gardener"],
    basePrice: 0,
    basePriceMax: 0,
    fields: [
      {
        id: "service",
        label: "Service Type",
        type: "select",
        options: [
          { label: "Lawn Mowing", value: "mowing", priceMin: 40, priceMax: 80 },
          { label: "Garden Design", value: "garden", priceMin: 200, priceMax: 500 },
          { label: "Hardscaping", value: "hardscape", priceMin: 500, priceMax: 2000 },
          { label: "Tree Trimming", value: "tree", priceMin: 100, priceMax: 400 },
          { label: "Full Landscaping", value: "full", priceMin: 800, priceMax: 3000 },
        ],
      },
      {
        id: "size",
        label: "Property Size (sq ft)",
        type: "slider",
        min: 500,
        max: 10000,
        step: 500,
        unit: "sq ft",
        pricePerUnit: 0.02,
        pricePerUnitMax: 0.05,
      },
    ],
    disclaimer: "Final pricing depends on property assessment.",
  },
  {
    id: "cleaner",
    name: "Cleaning",
    professions: ["cleaner", "cleaning", "maid", "janitor"],
    basePrice: 0,
    basePriceMax: 0,
    fields: [
      {
        id: "service",
        label: "Cleaning Type",
        type: "select",
        options: [
          { label: "Standard Clean", value: "standard", priceMin: 80, priceMax: 150 },
          { label: "Deep Clean", value: "deep", priceMin: 150, priceMax: 300 },
          { label: "Move-In/Out Clean", value: "move", priceMin: 200, priceMax: 450 },
          { label: "Post-Construction", value: "construction", priceMin: 300, priceMax: 600 },
        ],
      },
      {
        id: "rooms",
        label: "Number of Rooms",
        type: "slider",
        min: 1,
        max: 10,
        step: 1,
        unit: "rooms",
        pricePerUnit: 15,
        pricePerUnitMax: 30,
      },
    ],
    disclaimer: "Prices may vary based on condition and special requests.",
  },
  {
    id: "painter",
    name: "Painting",
    professions: ["painter", "painting"],
    basePrice: 0,
    basePriceMax: 0,
    fields: [
      {
        id: "service",
        label: "Project Type",
        type: "select",
        options: [
          { label: "Interior Room", value: "interior", priceMin: 200, priceMax: 500 },
          { label: "Exterior Paint", value: "exterior", priceMin: 800, priceMax: 3000 },
          { label: "Cabinet Refinishing", value: "cabinets", priceMin: 400, priceMax: 1200 },
          { label: "Deck Staining", value: "deck", priceMin: 200, priceMax: 800 },
        ],
      },
      {
        id: "size",
        label: "Area Size (sq ft)",
        type: "slider",
        min: 100,
        max: 3000,
        step: 100,
        unit: "sq ft",
        pricePerUnit: 0.5,
        pricePerUnitMax: 1.5,
      },
    ],
    disclaimer: "Includes standard paint. Premium paints may cost extra.",
  },
  {
    id: "detailer",
    name: "Auto Detailing",
    professions: ["auto detailer", "detailer", "car wash", "detailing"],
    basePrice: 0,
    basePriceMax: 0,
    fields: [
      {
        id: "vehicle",
        label: "Vehicle Type",
        type: "select",
        options: [
          { label: "Sedan / Coupe", value: "sedan", priceMin: 80, priceMax: 150 },
          { label: "SUV / Crossover", value: "suv", priceMin: 120, priceMax: 200 },
          { label: "Truck / Van", value: "truck", priceMin: 150, priceMax: 250 },
          { label: "Luxury / Exotic", value: "luxury", priceMin: 200, priceMax: 400 },
        ],
      },
      {
        id: "service",
        label: "Service Level",
        type: "select",
        options: [
          { label: "Exterior Wash", value: "exterior", priceMin: 0, priceMax: 0 },
          { label: "Interior Detail", value: "interior", priceMin: 30, priceMax: 60 },
          { label: "Full Detail", value: "full", priceMin: 60, priceMax: 120 },
          { label: "Paint Correction", value: "correction", priceMin: 150, priceMax: 400 },
        ],
      },
    ],
    disclaimer: "Prices may vary based on vehicle condition.",
  },
  {
    id: "general",
    name: "General Service",
    professions: [],
    basePrice: 50,
    basePriceMax: 100,
    fields: [
      {
        id: "service",
        label: "Service Type",
        type: "select",
        options: [
          { label: "Basic Service", value: "basic", priceMin: 50, priceMax: 100 },
          { label: "Standard Service", value: "standard", priceMin: 100, priceMax: 250 },
          { label: "Premium Service", value: "premium", priceMin: 250, priceMax: 500 },
          { label: "Custom Project", value: "custom", priceMin: 500, priceMax: 1500 },
        ],
      },
      {
        id: "scope",
        label: "Project Scope",
        type: "select",
        options: [
          { label: "Small", value: "small", priceMin: 0, priceMax: 0 },
          { label: "Medium", value: "medium", priceMin: 50, priceMax: 100 },
          { label: "Large", value: "large", priceMin: 150, priceMax: 300 },
        ],
      },
    ],
    disclaimer: "This is a rough estimate. Contact us for exact pricing.",
  },
];

/**
 * Find the best calculator preset for a profession name.
 */
export function getCalcPresetForProfession(profession?: string): CalcPreset {
  if (!profession) return CALCULATOR_PRESETS[CALCULATOR_PRESETS.length - 1];
  const lower = profession.toLowerCase();
  for (const preset of CALCULATOR_PRESETS) {
    if (preset.professions.some((p) => lower.includes(p) || p.includes(lower))) {
      return preset;
    }
  }
  return CALCULATOR_PRESETS[CALCULATOR_PRESETS.length - 1];
}

// ── Component ──

interface QuoteCalculatorProps {
  theme: ResolvedCardTheme;
  profileId: string;
  handle: string;
  profession?: string;
  metallicEffect?: any;
  /** Custom preset from card section content */
  customPreset?: CalcPreset;
}

export default function QuoteCalculator({
  theme,
  profileId,
  handle,
  profession,
  metallicEffect,
  customPreset,
}: QuoteCalculatorProps) {
  const preset = customPreset ?? getCalcPresetForProfession(profession);
  const { palette, fonts, radii } = theme;

  const [values, setValues] = useState<Record<string, string | number>>({});
  const [step, setStep] = useState<"calc" | "result" | "form" | "done">("calc");
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);

  const updateValue = useCallback((fieldId: string, val: string | number) => {
    setValues((prev) => ({ ...prev, [fieldId]: val }));
  }, []);

  const estimate = useMemo(() => {
    let min = preset.basePrice;
    let max = preset.basePriceMax;

    for (const field of preset.fields) {
      const val = values[field.id];
      if (field.type === "select" && field.options) {
        const opt = field.options.find((o) => o.value === val);
        if (opt) {
          min += opt.priceMin;
          max += opt.priceMax;
        }
      } else if (field.type === "slider" && typeof val === "number") {
        min += val * (field.pricePerUnit ?? 0);
        max += val * (field.pricePerUnitMax ?? field.pricePerUnit ?? 0);
      }
    }

    return { min: Math.round(min), max: Math.round(max) };
  }, [values, preset]);

  const hasSelections = preset.fields.some((f) => values[f.id] !== undefined);

  const handleSubmitLead = async () => {
    if (!formData.name) return;
    setSubmitting(true);

    try {
      // Check for existing lead
      let existingLead: { id: string } | null = null;
      if (formData.email) {
        const { data } = await supabase
          .from("leads")
          .select("id")
          .eq("user_id", profileId)
          .eq("email", formData.email)
          .limit(1)
          .maybeSingle();
        if (data) existingLead = data;
      }
      if (!existingLead && formData.phone) {
        const { data } = await supabase
          .from("leads")
          .select("id")
          .eq("user_id", profileId)
          .eq("phone", formData.phone)
          .limit(1)
          .maybeSingle();
        if (data) existingLead = data;
      }

      const { data: stages } = await supabase
        .from("pipeline_stages")
        .select("id")
        .eq("user_id", profileId)
        .order("sort_order", { ascending: true })
        .limit(1);

      const estimateDetails = {
        preset: preset.id,
        selections: values,
        estimateMin: estimate.min,
        estimateMax: estimate.max,
      };

      let leadId: string | undefined;

      if (existingLead) {
        await supabase
          .from("leads")
          .update({
            name: formData.name,
            ...(formData.phone ? { phone: formData.phone } : {}),
            ...(formData.email ? { email: formData.email } : {}),
            notes: `Instant quote: $${estimate.min}–$${estimate.max}`,
            custom_fields_json: { quote_calculator: estimateDetails },
          })
          .eq("id", existingLead.id);
        leadId = existingLead.id;
      } else {
        const { data: lead } = await supabase
          .from("leads")
          .insert({
            user_id: profileId,
            name: formData.name,
            phone: formData.phone || null,
            email: formData.email || null,
            notes: `Instant quote: $${estimate.min}–$${estimate.max}`,
            source: "card_form" as const,
            stage_id: stages?.[0]?.id ?? null,
            custom_fields_json: { quote_calculator: estimateDetails },
          })
          .select("id")
          .maybeSingle();
        leadId = lead?.id;
      }

      if (leadId) {
        await supabase.from("contact_activities").insert({
          user_id: profileId,
          lead_id: leadId,
          activity_type: "quote_calculator",
          title: `Quote calculator: $${estimate.min}–$${estimate.max}`,
          description: JSON.stringify(estimateDetails),
          occurred_at: new Date().toISOString(),
        });
      }

      // Analytics
      await supabase.from("analytics_events").insert({
        user_id: profileId,
        handle,
        event_type: "form_submit" as const,
        meta_json: { type: "quote_calculator", lead_id: leadId, ...estimateDetails },
      });

      setStep("done");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // Track calculator usage
  const handleShowEstimate = () => {
    supabase.from("analytics_events").insert({
      user_id: profileId,
      handle,
      event_type: "button_click" as const,
      meta_json: { type: "quote_calculator_estimate", ...values, estimateMin: estimate.min, estimateMax: estimate.max },
    }).then();
    setStep("result");
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: radii.button,
    border: `1px solid ${palette.secondary}30`,
    fontSize: 14,
    fontFamily: `'${fonts.secondary}', sans-serif`,
    outline: "none",
    background: "transparent",
    color: palette.primary,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <AnimatePresence mode="wait">
        {step === "calc" && (
          <motion.div
            key="calc"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <CardSectionWrapper theme={theme} index={20} metallicEffect={metallicEffect}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {preset.fields.map((field) => (
                  <div key={field.id}>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: palette.secondary,
                        marginBottom: 6,
                        display: "block",
                        fontFamily: `'${fonts.secondary}', sans-serif`,
                      }}
                    >
                      {field.label}
                    </label>

                    {field.type === "select" && field.options && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {field.options.map((opt) => {
                          const isSelected = values[field.id] === opt.value;
                          return (
                            <motion.button
                              key={opt.value}
                              onClick={() => updateValue(field.id, opt.value)}
                              whileTap={{ scale: 0.97 }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "10px 14px",
                                borderRadius: radii.button,
                                border: `1.5px solid ${isSelected ? palette.primary : `${palette.secondary}25`}`,
                                background: isSelected ? `${palette.primary}10` : "transparent",
                                cursor: "pointer",
                                fontFamily: `'${fonts.secondary}', sans-serif`,
                                fontSize: 14,
                                color: isSelected ? palette.primary : palette.secondary,
                                fontWeight: isSelected ? 600 : 400,
                                transition: "all 0.15s",
                              }}
                            >
                              <span>{opt.label}</span>
                              {isSelected && <Check style={{ width: 16, height: 16 }} />}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}

                    {field.type === "slider" && (
                      <div>
                        <input
                          type="range"
                          min={field.min ?? 0}
                          max={field.max ?? 100}
                          step={field.step ?? 1}
                          value={(values[field.id] as number) ?? field.min ?? 0}
                          onChange={(e) => updateValue(field.id, Number(e.target.value))}
                          style={{
                            width: "100%",
                            accentColor: palette.primary,
                            cursor: "pointer",
                          }}
                        />
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 12,
                            color: palette.secondary,
                            marginTop: 4,
                            fontFamily: `'${fonts.secondary}', sans-serif`,
                          }}
                        >
                          <span>
                            {(values[field.id] as number) ?? field.min ?? 0} {field.unit}
                          </span>
                          <span style={{ opacity: 0.5 }}>
                            max {field.max} {field.unit}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Live estimate preview */}
                {hasSelections && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    style={{
                      padding: "14px 16px",
                      borderRadius: radii.button,
                      background: `${palette.primary}08`,
                      border: `1px solid ${palette.primary}15`,
                      textAlign: "center",
                    }}
                  >
                    <p style={{ fontSize: 11, color: palette.secondary, margin: 0, marginBottom: 4 }}>
                      Estimated Price
                    </p>
                    <p
                      style={{
                        fontSize: 28,
                        fontWeight: 700,
                        color: palette.primary,
                        margin: 0,
                        fontFamily: `'${fonts.primary}', sans-serif`,
                      }}
                    >
                      ${estimate.min.toLocaleString()}
                      {estimate.max > estimate.min && (
                        <span style={{ fontSize: 20, fontWeight: 500 }}>
                          {" "}– ${estimate.max.toLocaleString()}
                        </span>
                      )}
                    </p>
                  </motion.div>
                )}

                <CardButton
                  theme={theme}
                  fullWidth
                  metallicEffect={metallicEffect}
                  onClick={handleShowEstimate}
                >
                  <Calculator style={{ width: 16, height: 16 }} />
                  <span>Get Estimate</span>
                </CardButton>
              </div>
            </CardSectionWrapper>
          </motion.div>
        )}

        {step === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <CardSectionWrapper theme={theme} index={21} metallicEffect={metallicEffect}>
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <p style={{ fontSize: 12, color: palette.secondary, margin: 0, marginBottom: 4 }}>
                    Your Estimated Price
                  </p>
                  <p
                    style={{
                      fontSize: 36,
                      fontWeight: 800,
                      color: palette.primary,
                      margin: 0,
                      fontFamily: `'${fonts.primary}', sans-serif`,
                      lineHeight: 1.2,
                    }}
                  >
                    ${estimate.min.toLocaleString()}
                    {estimate.max > estimate.min && (
                      <span style={{ fontSize: 24, fontWeight: 500 }}>
                        {" "}– ${estimate.max.toLocaleString()}
                      </span>
                    )}
                  </p>
                  {preset.disclaimer && (
                    <p style={{ fontSize: 11, color: `${palette.secondary}80`, margin: "8px 0 0" }}>
                      {preset.disclaimer}
                    </p>
                  )}
                </motion.div>

                <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  <CardButton
                    theme={theme}
                    fullWidth
                    metallicEffect={metallicEffect}
                    onClick={() => setStep("form")}
                  >
                    <Send style={{ width: 16, height: 16 }} />
                    <span>Request Exact Quote</span>
                  </CardButton>
                  <button
                    onClick={() => setStep("calc")}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: palette.primary,
                      fontSize: 13,
                      cursor: "pointer",
                      fontFamily: `'${fonts.secondary}', sans-serif`,
                      padding: "8px 0",
                    }}
                  >
                    ← Adjust selections
                  </button>
                </div>
              </div>
            </CardSectionWrapper>
          </motion.div>
        )}

        {step === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <CardSectionWrapper theme={theme} index={22} metallicEffect={metallicEffect}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: radii.button,
                    background: `${palette.primary}08`,
                    border: `1px solid ${palette.primary}15`,
                    textAlign: "center",
                    marginBottom: 4,
                  }}
                >
                  <p style={{ fontSize: 11, color: palette.secondary, margin: 0 }}>Your estimate</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: palette.primary, margin: 0 }}>
                    ${estimate.min.toLocaleString()}
                    {estimate.max > estimate.min && ` – $${estimate.max.toLocaleString()}`}
                  </p>
                </div>

                <input
                  placeholder="Your name *"
                  value={formData.name}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  style={inputStyle}
                />
                <input
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
                  style={inputStyle}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                  style={inputStyle}
                />

                <CardButton
                  theme={theme}
                  fullWidth
                  metallicEffect={metallicEffect}
                  onClick={handleSubmitLead}
                >
                  <Send style={{ width: 16, height: 16 }} />
                  <span>{submitting ? "Sending..." : "Send Quote Request"}</span>
                </CardButton>

                <button
                  onClick={() => setStep("result")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: palette.primary,
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: `'${fonts.secondary}', sans-serif`,
                    padding: "4px 0",
                  }}
                >
                  ← Back to estimate
                </button>
              </div>
            </CardSectionWrapper>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <CardSectionWrapper theme={theme} index={23} metallicEffect={metallicEffect}>
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: `${palette.primary}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                  }}
                >
                  <Check style={{ width: 24, height: 24, color: palette.primary }} />
                </motion.div>
                <p style={{ fontSize: 16, fontWeight: 700, color: palette.primary, margin: 0 }}>
                  Quote Request Sent!
                </p>
                <p style={{ fontSize: 13, color: palette.secondary, margin: "6px 0 0" }}>
                  We'll get back to you with an exact price shortly.
                </p>
              </div>
            </CardSectionWrapper>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
