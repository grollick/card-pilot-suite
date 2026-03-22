import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useCreatePost } from "@/hooks/useSocialPosts";
import { PLATFORMS } from "./constants";

interface ParsedRow {
  content: string;
  platforms: string[];
  scheduledAt: string | null;
  status: "valid" | "error";
  error?: string;
}

export default function SocialBulkImport() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const createPost = useCreatePost();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      
      // Skip header row
      const dataLines = lines.slice(1);
      const parsed: ParsedRow[] = dataLines.map(line => {
        const parts = line.split(",").map(p => p.trim().replace(/^"|"$/g, ""));
        const content = parts[0] || "";
        const platformsRaw = parts[1] || "";
        const scheduledAt = parts[2] || null;
        const platforms = platformsRaw
          .split("|")
          .map(p => p.trim())
          .filter(p => PLATFORMS.some(pl => pl.id.toLowerCase() === p.toLowerCase()));

        if (!content) return { content, platforms, scheduledAt, status: "error" as const, error: "Missing content" };
        if (platforms.length === 0) return { content, platforms: ["Instagram"], scheduledAt, status: "valid" as const };
        return { content, platforms, scheduledAt, status: "valid" as const };
      });
      setRows(parsed);
      setImported(0);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const validRows = rows.filter(r => r.status === "valid");
    if (validRows.length === 0) return;

    setImporting(true);
    let count = 0;
    for (const row of validRows) {
      try {
        await createPost.mutateAsync({
          content: row.content,
          platforms_json: row.platforms,
          scheduled_at: row.scheduledAt || null,
          status: row.scheduledAt ? "scheduled" : "draft",
          approval_status: row.scheduledAt ? "scheduled" : "draft",
        });
        count++;
        setImported(count);
      } catch {
        // continue on error
      }
    }
    setImporting(false);
    toast.success(`Imported ${count} posts successfully`);
  };

  const downloadTemplate = () => {
    const csv = `content,platforms,scheduled_at\n"Your post content here","Instagram|Facebook","2025-01-15T10:00:00"\n"Another post","LinkedIn",""\n`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "social-posts-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = rows.filter(r => r.status === "valid").length;
  const errorCount = rows.filter(r => r.status === "error").length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-bold">Bulk Import Posts</h2>
        <p className="text-sm text-muted-foreground">Upload a CSV file to schedule dozens of posts at once.</p>
      </div>

      {/* Upload area */}
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Upload className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium mb-1">Drop your CSV file here or click to upload</p>
          <p className="text-xs text-muted-foreground mb-4">Format: content, platforms (pipe-separated), scheduled_at (optional)</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <FileText className="h-4 w-4 mr-1.5" /> Choose File
            </Button>
            <Button variant="ghost" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-1.5" /> Download Template
            </Button>
          </div>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
        </CardContent>
      </Card>

      {/* Preview */}
      {rows.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Preview ({rows.length} rows)</CardTitle>
              <div className="flex gap-2">
                {validCount > 0 && <Badge variant="secondary" className="text-emerald-600"><CheckCircle className="h-3 w-3 mr-1" />{validCount} valid</Badge>}
                {errorCount > 0 && <Badge variant="secondary" className="text-destructive"><AlertCircle className="h-3 w-3 mr-1" />{errorCount} errors</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {rows.map((row, i) => (
                  <div key={i} className={`flex items-start gap-3 p-2.5 rounded-lg border text-sm ${row.status === "error" ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
                    <span className="text-xs text-muted-foreground w-6 shrink-0 pt-0.5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{row.content || <span className="text-muted-foreground italic">Empty</span>}</p>
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        {row.platforms.map(p => (
                          <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{p}</span>
                        ))}
                        {row.scheduledAt && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{row.scheduledAt}</span>
                        )}
                      </div>
                    </div>
                    {row.status === "error" && <span className="text-xs text-destructive shrink-0">{row.error}</span>}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                {importing ? `Importing... ${imported}/${validCount}` : `${validCount} posts ready to import`}
              </p>
              <Button onClick={handleImport} disabled={importing || validCount === 0} size="sm" className="gap-1.5">
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Import {validCount} Posts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
