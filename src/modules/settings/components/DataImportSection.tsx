import { useState, useRef } from "react";
import { Upload, FileText, Loader2, Users, Calendar, Wrench, FolderOpen, Star, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface ImportableDataSet {
  key: string;
  label: string;
  icon: typeof Users;
  description: string;
  table: string;
  requiredFields: string[];
  optionalFields: string[];
}

const IMPORT_SETS: ImportableDataSet[] = [
  {
    key: "contacts",
    label: "Contacts",
    icon: Users,
    description: "Import contacts with name, email, phone, company",
    table: "leads",
    requiredFields: ["name"],
    optionalFields: ["email", "phone", "company", "address", "notes", "source"],
  },
  {
    key: "bookings",
    label: "Bookings",
    icon: Calendar,
    description: "Import appointments with customer info and schedule",
    table: "bookings",
    requiredFields: ["customer_name", "start_datetime", "end_datetime"],
    optionalFields: ["customer_email", "customer_phone", "notes", "status"],
  },
  {
    key: "services",
    label: "Services",
    icon: Wrench,
    description: "Import services with pricing and duration",
    table: "booking_services",
    requiredFields: ["name"],
    optionalFields: ["description", "duration_min", "price", "active"],
  },
  {
    key: "projects",
    label: "Projects",
    icon: FolderOpen,
    description: "Import project showcase entries",
    table: "projects",
    requiredFields: ["title"],
    optionalFields: ["description", "before_image_url", "after_image_url", "services_used", "is_public"],
  },
  {
    key: "reviews",
    label: "Reviews",
    icon: Star,
    description: "Import customer reviews and ratings",
    table: "reviews",
    requiredFields: ["reviewer_name", "rating"],
    optionalFields: ["reviewer_email", "review_text", "is_public", "owner_response", "source"],
  },
];

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === "," && !inQuotes) { values.push(current.trim()); current = ""; }
      else { current += char; }
    }
    values.push(current.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  });
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function DataImportSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [importing, setImporting] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileSelect = async (ds: ImportableDataSet, file: File) => {
    if (!user) {
      toast.error("You must be logged in to import data");
      return;
    }

    setImporting(ds.key);
    setLastResult(null);

    try {
      const text = await file.text();
      let rows: Record<string, any>[];

      if (file.name.endsWith(".json")) {
        const parsed = JSON.parse(text);
        rows = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        rows = parseCsv(text);
      }

      if (rows.length === 0) {
        toast.error("No data rows found in file");
        setImporting(null);
        return;
      }

      // Validate required fields
      const missingFields = ds.requiredFields.filter(
        (f) => !Object.keys(rows[0]).includes(f)
      );
      if (missingFields.length > 0) {
        toast.error(`Missing required columns: ${missingFields.join(", ")}`);
        setImporting(null);
        return;
      }

      const allFields = [...ds.requiredFields, ...ds.optionalFields];
      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      // Process in batches of 50
      const batchSize = 50;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize).map((row) => {
          const clean: Record<string, any> = { user_id: user.id };
          for (const field of allFields) {
            if (row[field] !== undefined && row[field] !== "") {
              let val: any = row[field];
              if (field === "rating" || field === "duration_min") val = Number(val);
              if (field === "price") val = parseFloat(val) || null;
              if (field === "active" || field === "is_public") val = val === "true" || val === true;
              clean[field] = val;
            }
          }
          return clean;
        });

        const { error, data } = await supabase
          .from(ds.table as any)
          .insert(batch as any)
          .select("id");

        if (error) {
          failed += batch.length;
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        } else {
          success += (data as any[])?.length ?? batch.length;
        }
      }

      const result: ImportResult = { success, failed, errors };
      setLastResult(result);

      if (success > 0) {
        toast.success(`Imported ${success} ${ds.label.toLowerCase()} successfully`);
        queryClient.invalidateQueries();
      }
      if (failed > 0) {
        toast.error(`${failed} rows failed to import`);
      }
    } catch (err: any) {
      console.error("Import error:", err);
      toast.error(err.message || "Import failed");
    } finally {
      setImporting(null);
      if (fileRefs.current[ds.key]) fileRefs.current[ds.key]!.value = "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border border-border bg-card p-6 space-y-5"
    >
      <div className="flex items-center gap-2 mb-1">
        <Upload className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">Upload Your Data</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Import data from CSV or JSON files. Each file should include headers matching the fields below.
      </p>

      {lastResult && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
          <div className="flex items-center gap-2 text-sm">
            {lastResult.failed === 0 ? (
              <CheckCircle className="h-4 w-4 text-primary" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            )}
            <span className="font-medium">
              {lastResult.success} imported, {lastResult.failed} failed
            </span>
          </div>
          {lastResult.errors.map((e, i) => (
            <p key={i} className="text-xs text-destructive">{e}</p>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {IMPORT_SETS.map((ds) => {
          const Icon = ds.icon;
          const isLoading = importing === ds.key;

          return (
            <div
              key={ds.key}
              className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{ds.label}</p>
                <p className="text-xs text-muted-foreground">{ds.description}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {ds.requiredFields.map((f) => (
                    <Badge key={f} variant="default" className="text-2xs px-1.5 py-0">
                      {f}*
                    </Badge>
                  ))}
                  {ds.optionalFields.slice(0, 3).map((f) => (
                    <Badge key={f} variant="secondary" className="text-2xs px-1.5 py-0">
                      {f}
                    </Badge>
                  ))}
                  {ds.optionalFields.length > 3 && (
                    <Badge variant="outline" className="text-2xs px-1.5 py-0">
                      +{ds.optionalFields.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
              <div className="shrink-0">
                <input
                  type="file"
                  accept=".csv,.json"
                  className="hidden"
                  ref={(el) => { fileRefs.current[ds.key] = el; }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(ds, file);
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-8"
                  disabled={!!importing}
                  onClick={() => fileRefs.current[ds.key]?.click()}
                >
                  {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileText className="h-3.5 w-3.5" />
                  )}
                  CSV / JSON
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-2xs text-muted-foreground">
        Required fields are marked with *. Imports are added to your account with row-level security enforced. Duplicates are not automatically merged.
      </p>
    </motion.div>
  );
}
