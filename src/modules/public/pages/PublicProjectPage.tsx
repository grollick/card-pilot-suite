import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, Phone, Calendar, MapPin, ArrowLeft, Share2, Facebook, Linkedin, Twitter, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import BeforeAfterSlider from "@/modules/card/components/BeforeAfterSlider";
import { toast } from "sonner";

interface ProjectData {
  id: string;
  title: string;
  description: string | null;
  before_image_url: string | null;
  after_image_url: string | null;
  services_used: string[];
  location: string | null;
  created_at: string;
  user_id: string;
}

interface ProfileData {
  id: string;
  name: string | null;
  handle: string | null;
  phone: string | null;
  company: string | null;
  avatar_url: string | null;
}

export default function PublicProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const viewTracked = useRef(false);

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      const { data: proj } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .eq("is_public", true)
        .maybeSingle();

      if (!proj) { setLoading(false); return; }
      setProject(proj as unknown as ProjectData);

      const { data: prof } = await supabase
        .from("public_profiles" as any)
        .select("id, name, handle, company, avatar_url")
        .eq("id", (proj as any).user_id)
        .maybeSingle() as { data: any; error: any };
      setProfile(prof as ProfileData | null);
      setLoading(false);
    })();
  }, [projectId]);

  // Track view
  useEffect(() => {
    if (!project || !profile || viewTracked.current) return;
    viewTracked.current = true;
    supabase.from("analytics_events").insert({
      user_id: project.user_id,
      handle: profile.handle || "unknown",
      event_type: "button_click" as const,
      meta_json: { cta: "project_view", project_id: project.id, referrer: document.referrer },
    }).then();
  }, [project, profile]);

  const projectUrl = useMemo(() => `${window.location.origin}/project/${projectId}`, [projectId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(projectUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(projectUrl)}`, "_blank");
  const shareToLinkedIn = () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(projectUrl)}`, "_blank");
  const shareToTwitter = () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(projectUrl)}&text=${encodeURIComponent(`Check out this project: ${project?.title || ""}`)}`, "_blank");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  const cardUrl = profile.handle ? `/${profile.handle}` : "#";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Back to card */}
        {profile.handle && (
          <Link to={cardUrl} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to {profile.name || "card"}
          </Link>
        )}

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{project.title}</h1>
          {project.location && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
              <MapPin className="h-3.5 w-3.5" />
              {project.location}
            </div>
          )}
        </motion.div>

        {/* Before / After Slider */}
        {project.before_image_url && project.after_image_url && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <BeforeAfterSlider
              beforeSrc={project.before_image_url}
              afterSrc={project.after_image_url}
              radius="12px"
              height={300}
              accentColor="hsl(var(--primary))"
            />
          </motion.div>
        )}

        {/* Single image fallback */}
        {(!project.before_image_url || !project.after_image_url) && (project.before_image_url || project.after_image_url) && (
          <motion.img
            src={project.before_image_url || project.after_image_url || ""}
            alt={project.title}
            className="w-full rounded-xl object-cover max-h-80"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          />
        )}

        {/* Description */}
        {project.description && (
          <motion.p
            className="text-sm leading-relaxed text-muted-foreground"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          >
            {project.description}
          </motion.p>
        )}

        {/* Services */}
        {project.services_used && project.services_used.length > 0 && (
          <motion.div
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          >
            {project.services_used.map((s) => (
              <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
            ))}
          </motion.div>
        )}

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col gap-3"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        >
          <Link
            to={profile.handle ? `/book/${profile.handle}` : "#"}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 text-sm font-medium shadow-sm hover:opacity-90 transition-opacity"
          >
            <Calendar className="h-4 w-4" />
            Book Consultation
          </Link>
          {profile.phone && (
            <a
              href={`tel:${profile.phone}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card text-foreground px-6 py-3 text-sm font-medium hover:bg-accent transition-colors"
            >
              <Phone className="h-4 w-4" />
              Request Quote
            </a>
          )}
        </motion.div>

        {/* Social Sharing */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        >
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Share this project</p>
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy Link"}
            </button>
            <button onClick={shareToFacebook} className="inline-flex items-center justify-center rounded-lg border border-border bg-card w-9 h-9 text-foreground hover:bg-accent transition-colors">
              <Facebook className="h-4 w-4" />
            </button>
            <button onClick={shareToLinkedIn} className="inline-flex items-center justify-center rounded-lg border border-border bg-card w-9 h-9 text-foreground hover:bg-accent transition-colors">
              <Linkedin className="h-4 w-4" />
            </button>
            <button onClick={shareToTwitter} className="inline-flex items-center justify-center rounded-lg border border-border bg-card w-9 h-9 text-foreground hover:bg-accent transition-colors">
              <Twitter className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        {/* Business card link */}
        {profile.handle && (
          <motion.div
            className="rounded-xl border border-border bg-card p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          >
            <div className="flex items-center gap-3">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {(profile.name || "?")[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{profile.name}</p>
                {profile.company && <p className="text-xs text-muted-foreground truncate">{profile.company}</p>}
              </div>
              <Link
                to={cardUrl}
                className="text-xs font-medium text-primary hover:underline"
              >
                View Card →
              </Link>
            </div>
          </motion.div>
        )}

        {/* Viral footer */}
        <div className="text-center pt-4 border-t border-border space-y-1">
          <a
            href="/?ref=project"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Powered by <span className="font-bold text-primary"><span className="font-extrabold text-primary">guzzl</span>.pro</span>
          </a>
          <p>
            <a
              href="/auth?ref=project"
              className="text-[11px] font-medium text-primary hover:underline"
            >
              Create your own smart business card →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
