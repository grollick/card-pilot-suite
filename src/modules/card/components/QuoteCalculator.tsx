import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Send, ChevronRight, Check } from "lucide-react";
import { captureLead, getVisitorMeta } from "@/lib/captureLead";
import type { ResolvedCardTheme } from "@/lib/cardTokens";
import CardSectionWrapper from "./CardSectionWrapper";
import CardButton from "./CardButton";

// ── Calculator shape (the pro's own price list is saved in this shape) ──

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

/**
 * Returns the pro's own saved calculator (options + prices) from section content,
 * or null when nothing priced has been saved. Built-in presets never count.
 */
export function getSavedCalcPreset(content: any): CalcPreset | null {
  const preset = content?.calcCustomPreset as CalcPreset | undefined;
  if (!preset || !Array.isArray(preset.fields) || preset.fields.length === 0) return null;
  const hasPrice =
    Number(preset.basePrice) > 0 || Number(preset.basePriceMax) > 0 ||
    preset.fields.some((f) =>
      (f.options || []).some((o) => Number(o.priceMin) > 0 || Number(o.priceMax) > 0) ||
      Number(f.pricePerUnit) > 0,
    );
  return hasPrice ? preset : null;
}

export default function QuoteCalculator(props: QuoteCalculatorProps) {
  // Never fall back to built-in price numbers: no saved prices, no calculator.
  if (!props.customPreset) return null;
  return <QuoteCalculatorInner {...props} customPreset={props.customPreset} />;
}

function QuoteCalculatorInner({
  theme,
  profileId,
  handle,
  profession,
  metallicEffect,
  customPreset,
}: QuoteCalculatorProps & { customPreset: CalcPreset }) {
  const preset = customPreset;
  const { palette, fonts, radii } = theme;

  const [values, setValues] = useState<Record<string, string | number>>({});
  const [step, setStep] = useState<"calc" | "result" | "form" | "done">("calc");
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

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
    const missingName = !formData.name.trim();
    const missingContact = !formData.phone.trim() && !formData.email.trim();
    setNameError(missingName ? "Please add your name." : null);
    setContactError(missingContact ? "Add a phone number or an email so we can reach you." : null);
    if (missingName || missingContact) return;
    setSubmitting(true);

    setSubmitError(null);
    try {
      const chosen = preset.fields
        .map((f) => {
          const opt = f.options?.find((o) => o.value === values[f.id]);
          return opt ? opt.label : null;
        })
        .filter(Boolean)
        .join(", ");
      await captureLead({
        ownerId: profileId,
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        source: "card_form",
        handle,
        activityType: "quote_requested",
        activityTitle: quoteActivityTitle(chosen, estimate.min, estimate.max),
        metaJson: {
          ...getVisitorMeta(),
          quote_calculator: { selections: values, job: chosen, estimateMin: estimate.min, estimateMax: estimate.max },
        },
      });
      setStep("done");
    } catch {
      setSubmitError("We couldn't send your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Track calculator usage
  const handleShowEstimate = () => {
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
    <div data-engagement-busy={step === "result" || step === "form" ? "true" : undefined} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
                          {" "}to ${estimate.max.toLocaleString()}
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
                        {" "}to ${estimate.max.toLocaleString()}
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
                    {estimate.max > estimate.min && ` to $${estimate.max.toLocaleString()}`}
                  </p>
                </div>

                <input
                  placeholder="Your name *"
                  value={formData.name}
                  onChange={(e) => { setFormData((f) => ({ ...f, name: e.target.value })); setNameError(null); }}
                  style={inputStyle}
                />
                {nameError && <p role="alert" style={{ fontSize: 12, color: palette.primary, margin: "-4px 0 0" }}>{nameError}</p>}
                <input
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={(e) => { setFormData((f) => ({ ...f, phone: e.target.value })); setContactError(null); }}
                  style={inputStyle}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => { setFormData((f) => ({ ...f, email: e.target.value })); setContactError(null); }}
                  style={inputStyle}
                />
                {contactError && <p role="alert" style={{ fontSize: 12, color: palette.primary, margin: "-4px 0 0" }}>{contactError}</p>}

                {submitError && (
                  <p role="alert" style={{ fontSize: 13, color: palette.primary, margin: 0 }}>{submitError}</p>
                )}
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

const money = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export function quoteActivityTitle(job: string, min: number, max: number): string {
  const price = max > min ? `${money(min)} to ${money(max)}` : money(min);
  return `Instant quote: ${job || "job"}, ${price}`;
}
