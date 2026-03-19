import { useState } from "react";
import { Download, FileText, FileJson, Loader2, Users, Calendar, Wrench, FolderOpen, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type ExportFormat = "csv" | "json";

interface DataSet {
  key: string;
  label: string;
  icon: typeof Users;
  description: string;
  table: string;
  select: string;
  filenamePrefix: string;
}

const DATA_SETS: DataSet[] = [
  {
    key: "contacts",
    label: "Contacts",
    icon: Users,
    description: "All CRM contacts, lead scores, and lifecycle data",
    table: "leads",
    select: "id, name, email, phone, company, address, source, status, lifecycle_stage, lead_score, notes, created_at, last_activity_at",
    filenamePrefix: "guzzl-pro-contacts",
  },
  {
    key: "bookings",
    label: "Bookings",
    icon: Calendar,
    description: "All appointments with customer details and status",
    table: "bookings",
    select: "id, customer_name, customer_email, customer_phone, start_datetime, end_datetime, status, notes, created_at",
    filenamePrefix: "guzzl-pro-bookings",
  },
  {
    key: "services",
    label: "Services",
    icon: Wrench,
    description: "Booking services with pricing and duration",
    table: "booking_services",
    select: "id, name, description, duration_min, price, active, created_at",
    filenamePrefix: "guzzl-pro-services",
  },
  {
    key: "projects",
    label: "Projects",
    icon: FolderOpen,
    description: "Before/after project showcase entries",
    table: "projects",
    select: "id, title, description, before_image_url, after_image_url, services_used, is_public, created_at",
    filenamePrefix: "guzzl-pro-projects",
  },
  {
    key: "reviews",
    label: "Reviews",
    icon: Star,
    description: "Customer reviews, ratings, and responses",
    table: "reviews",
    select: "id, reviewer_name, reviewer_email, rating, review_text, is_public, owner_response, source, created_at",
    filenamePrefix: "guzzl-pro-reviews",
  },
];

function toCsv(rows: Record<string, any>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v == null) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function DataExportSection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (ds: DataSet, format: ExportFormat) => {
    if (!user) {
      toast.error("You must be logged in to export data");
      return;
    }

    const loadingKey = `${ds.key}-${format}`;
    setLoading(loadingKey);

    try {
      const { data, error } = await supabase
        .from(ds.table as any)
        .select(ds.select)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as Record<string, any>[];

      if (rows.length === 0) {
        toast.info(`No ${ds.label.toLowerCase()} to export`);
        setLoading(null);
        return;
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      if (format === "csv") {
        downloadBlob(toCsv(rows), `${ds.filenamePrefix}-${timestamp}.csv`, "text/csv;charset=utf-8");
      } else {
        downloadBlob(JSON.stringify(rows, null, 2), `${ds.filenamePrefix}-${timestamp}.json`, "application/json");
      }

      toast.success(`${rows.length} ${ds.label.toLowerCase()} exported as ${format.toUpperCase()}`);
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error(err.message || "Export failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border border-border bg-card p-6 space-y-5"
    >
      <div className="flex items-center gap-2 mb-1">
        <Download className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">Download Your Data</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Export your business data as CSV or JSON. Only your own data is included — exports are scoped to your account.
      </p>

      <div className="space-y-3">
        {DATA_SETS.map((ds) => {
          const Icon = ds.icon;
          const csvLoading = loading === `${ds.key}-csv`;
          const jsonLoading = loading === `${ds.key}-json`;

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
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-8"
                  disabled={!!loading}
                  onClick={() => handleExport(ds, "csv")}
                >
                  {csvLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-8"
                  disabled={!!loading}
                  onClick={() => handleExport(ds, "json")}
                >
                  {jsonLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileJson className="h-3.5 w-3.5" />}
                  JSON
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-2xs text-muted-foreground">
        Exports include up to 1,000 records per data set. Data is fetched directly from your account with row-level security enforced.
      </p>
    </motion.div>
  );
}
