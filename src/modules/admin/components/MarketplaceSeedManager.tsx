import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Store, Plus, MapPin, Star, Eye, EyeOff } from "lucide-react";


interface DemoBusiness {
  id: string;
  business_name: string;
  slug: string;
  description: string | null;
  location_city: string | null;
  location_region: string | null;
  is_active: boolean;
  is_marketplace_visible: boolean;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  marketplace_metrics: { avg_rating: number; review_count: number; marketplace_score: number } | null;
}

function useDemoBusinesses() {
  return useQuery({
    queryKey: ["admin-demo-businesses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, business_name, slug, description, location_city, location_region, is_active, is_marketplace_visible, latitude, longitude, phone, email, marketplace_metrics(avg_rating, review_count, marketplace_score)")
        .eq("is_demo", true)
        .order("business_name");
      if (error) throw error;
      return data as DemoBusiness[];
    },
  });
}

export default function MarketplaceSeedManager() {
  const { data: businesses = [], isLoading } = useDemoBusinesses();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const toggleVisibility = useMutation({
    mutationFn: async ({ id, visible }: { id: string; visible: boolean }) => {
      const { error } = await supabase
        .from("businesses")
        .update({ is_marketplace_visible: visible })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-demo-businesses"] });
      toast.success("Visibility updated");
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("businesses")
        .update({ is_active: active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-demo-businesses"] });
      toast.success("Status updated");
    },
  });

  const activeCount = businesses.filter(b => b.is_active && b.is_marketplace_visible).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Marketplace Seed Profiles
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activeCount} active demo businesses · labeled as "Featured Local Business"
          </p>
        </div>
        <CreateDemoDialog open={createOpen} onOpenChange={setCreateOpen} />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted/40" />
          ))}
        </div>
      ) : businesses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No demo businesses yet. Create one to seed the marketplace.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {businesses.map(biz => {
            const metrics = biz.marketplace_metrics?.[0];
            return (
              <div
                key={biz.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{biz.business_name}</p>
                    <Badge variant="outline" className="text-[10px] shrink-0">Demo</Badge>
                    {biz.is_marketplace_visible && biz.is_active && (
                      <Badge className="text-[10px] bg-green-500/15 text-green-700 dark:text-green-400 border-0 shrink-0">
                        Live
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {biz.location_city || "No city"}
                    </span>
                    {metrics && metrics.avg_rating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500" />
                        {metrics.avg_rating} ({metrics.review_count})
                      </span>
                    )}
                    {metrics && (
                      <span>Score: {metrics.marketplace_score}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => toggleVisibility.mutate({ id: biz.id, visible: !biz.is_marketplace_visible })}
                    title={biz.is_marketplace_visible ? "Hide from marketplace" : "Show in marketplace"}
                  >
                    {biz.is_marketplace_visible ? (
                      <Eye className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </Button>
                  <Switch
                    checked={biz.is_active}
                    onCheckedChange={(v) => toggleActive.mutate({ id: biz.id, active: v })}
                    className="scale-75"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Create Demo Business Dialog ── */
function CreateDemoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    business_name: "",
    description: "",
    location_city: "Thunder Bay",
    location_region: "Ontario",
    phone: "",
    email: "",
    latitude: "48.3809",
    longitude: "-89.2477",
  });

  const create = useMutation({
    mutationFn: async () => {
      // Get admin user id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const slug = form.business_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const { error } = await supabase.from("businesses").insert({
        owner_user_id: user.id,
        business_name: form.business_name,
        slug: slug + "-" + Date.now().toString(36),
        description: form.description || null,
        location_city: form.location_city,
        location_region: form.location_region,
        phone: form.phone || null,
        email: form.email || null,
        latitude: parseFloat(form.latitude) || null,
        longitude: parseFloat(form.longitude) || null,
        is_active: true,
        is_marketplace_visible: true,
        is_demo: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-demo-businesses"] });
      toast.success("Demo business created");
      onOpenChange(false);
      setForm({
        business_name: "",
        description: "",
        location_city: "Thunder Bay",
        location_region: "Ontario",
        phone: "",
        email: "",
        latitude: "48.3809",
        longitude: "-89.2477",
      });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Demo Business
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Demo Business</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Business Name *</Label>
            <Input
              value={form.business_name}
              onChange={(e) => setForm(f => ({ ...f, business_name: e.target.value }))}
              placeholder="e.g. Thunder Bay Plumbing"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Short description..."
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">City</Label>
              <Input
                value={form.location_city}
                onChange={(e) => setForm(f => ({ ...f, location_city: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Region</Label>
              <Input
                value={form.location_region}
                onChange={(e) => setForm(f => ({ ...f, location_region: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Latitude</Label>
              <Input
                value={form.latitude}
                onChange={(e) => setForm(f => ({ ...f, latitude: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Longitude</Label>
              <Input
                value={form.longitude}
                onChange={(e) => setForm(f => ({ ...f, longitude: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => create.mutate()}
            disabled={!form.business_name.trim() || create.isPending}
          >
            {create.isPending ? "Creating…" : "Create Demo Business"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
