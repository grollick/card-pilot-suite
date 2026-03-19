import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useLandingPage, type LandingPageSection } from "@/hooks/useLandingPages";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

const DEFAULTS: Record<string, { title: string; pageKey: string }> = {
  privacy: { title: "Privacy Policy", pageKey: "privacy" },
  terms: { title: "Terms of Service", pageKey: "terms" },
};

export default function LegalPage({ pageKey }: { pageKey: string }) {
  const config = DEFAULTS[pageKey] || { title: "Legal", pageKey };
  const { data: page, isLoading } = useLandingPage(config.pageKey);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Find the legal_content section
  const sections = (page?.sections_json || []) as LandingPageSection[];
  const legalSection = sections.find((s) => s.type === "legal_content" && s.enabled);
  const headerSection = sections.find((s) => s.type === "header" && s.enabled);

  const title = legalSection?.content?.title || config.title;
  const body = legalSection?.content?.body || "";
  const lastUpdated = legalSection?.content?.last_updated || "";

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title} | CardPilot</title>
        <meta name="description" content={`${title} for CardPilot`} />
      </Helmet>

      {/* Simple header */}
      {headerSection && (
        <header className="border-b border-border bg-card">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="text-lg font-bold text-foreground">
              {headerSection.content?.logo_text || "CardPilot"}
            </a>
            <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Home
            </a>
          </div>
        </header>
      )}

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
        {lastUpdated && (
          <p className="text-sm text-muted-foreground mb-8">Last updated: {lastUpdated}</p>
        )}

        {body ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{body}</ReactMarkdown>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">This page has not been published yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}
