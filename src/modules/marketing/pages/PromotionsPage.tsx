import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2, Loader2, Tag, ToggleLeft, ToggleRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";

function usePromotions() {
  return useQuery({
    queryKey: ["promotions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export default function PromotionsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: promos = [], isLoading } = usePromotions();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [badgeText, setBadgeText] = useState("Limited Offer");
  const [discountText, setDiscountText] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const createPromo = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("promotions").insert({
        user_id: user!.id,
        title: title.trim(),
        description: description.trim() || null,
        badge_text: badgeText.trim() || "Limited Offer",
        discount_text: discountText.trim() || null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["promotions"] });
      setShowForm(false);
      setTitle(""); setDescription(""); setDiscountText(""); setExpiresAt("");
      toast.success("Promotion created!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const togglePromo = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("promotions").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promotions"] }),
  });

  const deletePromo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promotions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["promotions"] });
      toast.success("Promotion deleted");
    },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight"><span className="font-extrabold text-primary">guzzl</span> <span className="font-normal">Promotions & Offers</span></h1>
          <p className="text-muted-foreground text-sm mt-1">Create time-limited offers that appear on your public card</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="shadow-glow gap-1.5">
          <Plus className="h-4 w-4" /> New Offer
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h3 className="font-semibold">Create Promotion</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Spring Special" />
            </div>
            <div className="space-y-2">
              <Label>Badge Text</Label>
              <Input value={badgeText} onChange={e => setBadgeText(e.target.value)} placeholder="Limited Offer" />
            </div>
            <div className="space-y-2">
              <Label>Discount Text</Label>
              <Input value={discountText} onChange={e => setDiscountText(e.target.value)} placeholder="10% off first visit" />
            </div>
            <div className="space-y-2">
              <Label>Expires At (optional)</Label>
              <Input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Details about this offer..." rows={2} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => createPromo.mutate()} disabled={!title.trim() || createPromo.isPending}>
              {createPromo.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Offer
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : promos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Tag className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No promotions yet. Create your first offer to display on your card.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {promos.map(promo => {
            const isExpired = promo.expires_at && new Date(promo.expires_at) < new Date();
            return (
              <motion.div key={promo.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className={`rounded-xl border bg-card p-4 flex items-start gap-4 ${!promo.active || isExpired ? "opacity-60" : "border-border"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{promo.title}</h3>
                    <Badge variant={promo.active && !isExpired ? "default" : "secondary"} className="text-[10px]">
                      {isExpired ? "Expired" : promo.active ? "Active" : "Inactive"}
                    </Badge>
                    {promo.badge_text && (
                      <Badge variant="outline" className="text-[10px]">{promo.badge_text}</Badge>
                    )}
                  </div>
                  {promo.discount_text && <p className="text-sm font-medium text-primary">{promo.discount_text}</p>}
                  {promo.description && <p className="text-sm text-muted-foreground mt-1">{promo.description}</p>}
                  {promo.expires_at && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Expires {format(new Date(promo.expires_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={promo.active}
                    onCheckedChange={(active) => togglePromo.mutate({ id: promo.id, active })}
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deletePromo.mutate(promo.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
