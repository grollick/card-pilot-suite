import { useState } from "react";
import { Globe, Search, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function useGoogleSync() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["google-sync", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("google_business_sync" as any)
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });
}

function useUpsertGoogleSync() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Record<string, any>) => {
      const { error } = await supabase
        .from("google_business_sync" as any)
        .upsert({ ...settings, user_id: user!.id } as any, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["google-sync"] });
      toast.success("Settings saved");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export default function GoogleBusinessSync() {
  const { data: syncData } = useGoogleSync();
  const upsert = useUpsertGoogleSync();
  const [placeId, setPlaceId] = useState("");

  const isConnected = syncData?.status === "connected";

  const handleConnect = () => {
    if (!placeId.trim()) {
      toast.error("Please enter a Google Place ID");
      return;
    }
    upsert.mutate({
      place_id: placeId.trim(),
      status: "connected",
      business_name: "Connected Business",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Google Business Sync</CardTitle>
        </div>
        <CardDescription>
          Connect your Google Business Profile to auto-sync reviews, photos, and business info.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "secondary"} className="gap-1">
            {isConnected ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
            {isConnected ? "Connected" : "Not connected"}
          </Badge>
          {syncData?.business_name && isConnected && (
            <span className="text-sm text-muted-foreground">· {syncData.business_name}</span>
          )}
        </div>

        {!isConnected ? (
          <div className="space-y-3">
            <div>
              <Label>Google Place ID</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={placeId}
                  onChange={(e) => setPlaceId(e.target.value)}
                  placeholder="ChIJ..."
                />
                <Button onClick={handleConnect} disabled={upsert.isPending} className="gap-1.5">
                  <Search className="h-4 w-4" /> Connect
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Find your Place ID at{" "}
                <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener" className="underline">
                  Google's Place ID Finder
                </a>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Sync Reviews</Label>
              <Switch
                checked={syncData?.sync_reviews ?? true}
                onCheckedChange={(v) => upsert.mutate({ sync_reviews: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Sync Photos</Label>
              <Switch
                checked={syncData?.sync_photos ?? false}
                onCheckedChange={(v) => upsert.mutate({ sync_photos: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Sync Business Info</Label>
              <Switch
                checked={syncData?.sync_info ?? true}
                onCheckedChange={(v) => upsert.mutate({ sync_info: v })}
              />
            </div>
            {syncData?.last_synced_at && (
              <p className="text-xs text-muted-foreground">
                Last synced: {new Date(syncData.last_synced_at).toLocaleString()}
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info("Manual sync coming soon")}>
                <RefreshCw className="h-3.5 w-3.5" /> Sync Now
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => upsert.mutate({ status: "disconnected", place_id: null })}
              >
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
