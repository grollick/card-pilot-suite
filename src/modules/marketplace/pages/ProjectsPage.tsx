import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, ExternalLink, Share2, Loader2, Image, MapPin, Facebook, Linkedin, Twitter, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { useProjects, useCreateProject, useDeleteProject, type Project } from "@/hooks/useProjects";
import { useProfile } from "@/hooks/useCard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function ProjectsPage() {
  const { data: projects = [], isLoading } = useProjects();
  const { data: profile } = useProfile();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", location: "", services_used: "",
    before_image_url: "", after_image_url: "", is_public: true,
  });
  const [uploading, setUploading] = useState<"before" | "after" | null>(null);

  const handleImageUpload = async (file: File, type: "before" | "after") => {
    setUploading(type);
    const ext = file.name.split(".").pop();
    const path = `projects/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("card-assets").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(null); return; }
    const { data: urlData } = supabase.storage.from("card-assets").getPublicUrl(path);
    setForm(f => ({ ...f, [`${type}_image_url`]: urlData.publicUrl }));
    setUploading(null);
  };

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    await createProject.mutateAsync({
      title: form.title.trim(),
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      services_used: form.services_used.split(",").map(s => s.trim()).filter(Boolean),
      before_image_url: form.before_image_url || null,
      after_image_url: form.after_image_url || null,
      is_public: form.is_public,
    });
    toast.success("Project created!");
    setDialogOpen(false);
    setForm({ title: "", description: "", location: "", services_used: "", before_image_url: "", after_image_url: "", is_public: true });
  };

  const handleShare = (project: Project) => {
    const url = `${window.location.origin}/project/${project.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Project link copied!");
  };

  const shareToFacebook = (project: Project) => {
    const url = `${window.location.origin}/project/${project.id}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
  };

  const shareToLinkedIn = (project: Project) => {
    const url = `${window.location.origin}/project/${project.id}`;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank");
  };

  const shareToTwitter = (project: Project) => {
    const url = `${window.location.origin}/project/${project.id}`;
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`Check out: ${project.title}`)}`, "_blank");
  };

  const generateSocialPost = (project: Project) => {
    const url = `${window.location.origin}/project/${project.id}`;
    const text = `✨ Check out my latest project: "${project.title}"${project.description ? `\n\n${project.description}` : ""}\n\n📍 ${project.location || ""}${project.services_used.length ? `\n🔧 ${project.services_used.join(", ")}` : ""}\n\n👉 See the transformation: ${url}`;
    navigator.clipboard.writeText(text);
    toast.success("Social post copied to clipboard!");
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight"><span className="font-black text-primary text-4xl">guzzl</span> <span className="font-normal text-muted-foreground">Projects</span></h1>
          <p className="text-muted-foreground text-sm mt-1">Showcase your work with before/after project cards</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-glow gap-1.5">
              <Plus className="h-4 w-4" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Project Card</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Kitchen Renovation" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Full kitchen remodel with custom cabinets…" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Before Image</Label>
                  <div className="relative">
                    {form.before_image_url ? (
                      <img src={form.before_image_url} alt="Before" className="w-full h-32 object-cover rounded-lg border border-border" />
                    ) : (
                      <label className="flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors">
                        {uploading === "before" ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <><Image className="h-6 w-6 text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">Upload</span></>}
                        <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], "before")} />
                      </label>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>After Image</Label>
                  <div className="relative">
                    {form.after_image_url ? (
                      <img src={form.after_image_url} alt="After" className="w-full h-32 object-cover rounded-lg border border-border" />
                    ) : (
                      <label className="flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors">
                        {uploading === "after" ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <><Image className="h-6 w-6 text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">Upload</span></>}
                        <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], "after")} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Services Used</Label>
                <Input value={form.services_used} onChange={e => setForm(f => ({ ...f, services_used: e.target.value }))} placeholder="Painting, Tiling, Plumbing" />
                <p className="text-xs text-muted-foreground">Comma-separated</p>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Toronto, ON" />
              </div>
              <div className="flex items-center justify-between">
                <Label>Public</Label>
                <Switch checked={form.is_public} onCheckedChange={v => setForm(f => ({ ...f, is_public: v }))} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createProject.isPending} className="shadow-glow">
                {createProject.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-20 rounded-xl border border-dashed border-border bg-card/50">
          <Image className="h-10 w-10 mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="font-semibold text-lg mb-1">No projects yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Create your first before/after project card to showcase your work.</p>
          <Button onClick={() => setDialogOpen(true)} className="shadow-glow gap-1.5">
            <Plus className="h-4 w-4" /> Create First Project
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project, i) => (
            <motion.div key={project.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card overflow-hidden group"
            >
              {/* Before/After Images */}
              <div className="grid grid-cols-2 h-40">
                {project.before_image_url ? (
                  <div className="relative overflow-hidden">
                    <img src={project.before_image_url} alt="Before" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 text-[10px] font-bold uppercase bg-background/80 px-1.5 py-0.5 rounded">Before</span>
                  </div>
                ) : (
                  <div className="bg-muted flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Before</span>
                  </div>
                )}
                {project.after_image_url ? (
                  <div className="relative overflow-hidden">
                    <img src={project.after_image_url} alt="After" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 text-[10px] font-bold uppercase bg-primary text-primary-foreground px-1.5 py-0.5 rounded">After</span>
                  </div>
                ) : (
                  <div className="bg-muted flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">After</span>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-2">
                <h3 className="font-semibold truncate">{project.title}</h3>
                {project.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                )}
                {project.location && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {project.location}
                  </div>
                )}
                {project.services_used.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {project.services_used.slice(0, 3).map(s => (
                      <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-1 pt-2 border-t border-border">
                  <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => handleShare(project)} title="Copy link">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => shareToFacebook(project)} title="Share to Facebook">
                    <Facebook className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => shareToLinkedIn(project)} title="Share to LinkedIn">
                    <Linkedin className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => shareToTwitter(project)} title="Share to X">
                    <Twitter className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs gap-1 flex-1" onClick={() => generateSocialPost(project)}>
                    <Share2 className="h-3 w-3" /> Post
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive" onClick={() => { deleteProject.mutate(project.id); toast.success("Project deleted"); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
