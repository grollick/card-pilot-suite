// ── Estimates module barrel ──
export {
  useEstimates,
  useEstimate,
  useCreateEstimate,
  useUpdateEstimate,
  useDeleteEstimate,
  useConvertEstimateToJob,
  generateEstimateNumber,
  calculateLineTotals,
  calculateEstimateTotals,
  type EstimateLineItem,
  type EstimateFormData,
  type EstimateSection,
  type EstimateStatus,
} from "@/hooks/useEstimates";
export {
  useEstimatePresets,
  useCreatePreset,
  useDeletePreset,
  DEFAULT_PRESETS,
  type PresetType,
  type EstimatePreset,
} from "@/hooks/useEstimatePresets";
export { exportEstimatePDF } from "@/lib/estimatePdf";
export { TRADES_TEMPLATES } from "@/lib/estimateTemplates";
export type { CalcMode } from "@/lib/estimateCalculators";
