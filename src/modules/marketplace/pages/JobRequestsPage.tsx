import { useState } from "react";
import { useMyJobRequests, useMyJobResponses, useJobRequestStats } from "@/hooks/useJobRequests";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Briefcase, Loader2, Send, MapPin, DollarSign, Clock,
  CheckCircle2, MessageSquare, TrendingUp, Inbox, Zap,
} from "lucide-react";

export default function JobRequestsPage() {
  const { user } = useAuth();
  const { data: requests, isLoading, refetch } = useMyJobRequests();
  const { data: myResponses } = useMyJobResponses();
  const { data: stats } = useJobRequestStats();
  const [respondingTo, setRespondingTo] = useState<any | null>(null);
  const [responseForm, setResponseForm] = useState({ message: "", price_estimate: "", availability: "" });
  const [sending, setSending] = useState(false);

  const hasResponded = (requestId: string) =>
    myResponses?.some((r) => r.estimate_request_id === requestId);

  const handleSendResponse = async () => {
    if (!respondingTo || !user || !responseForm.message.trim()) return;
    setSending(true);
    try {
      const { error } = await (supabase as any)
        .from("job_request_responses")
        .insert({
          estimate_request_id: respondingTo.id,
          user_id: user.id,
          message: responseForm.message.trim(),
          price_estimate: responseForm.price_estimate ? parseFloat(responseForm.price_estimate) : null,
          availability: responseForm.availability.trim() || null,
        });
      if (error) throw error;

      await (supabase as any)
        .from("estimate_matches")
        .update({ status: "responded", responded_at: new Date().toISOString() })
        .eq("estimate_request_id", respondingTo.id)
        .eq("user_id", user.id);

      toast.success("Response sent — nice work 👍");
      setRespondingTo(null);
      setResponseForm({ message: "", price_estimate: "", availability: "" });
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to send response");
    } finally {
      setSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statItems = [
    { label: "New", value: stats?.newRequests || 0, icon: Inbox, accent: "bg-primary/10 text-primary" },
    { label: "Responded", value: stats?.responsesSent || 0, icon: Send, accent: "bg-accent/10 text-accent-foreground" },
    { label: "Won", value: stats?.won || 0, icon: CheckCircle2, accent: "bg-primary/10 text-primary" },
    { label: "Total", value: stats?.total || 0, icon: TrendingUp, accent: "bg-muted text-muted-foreground" },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          Job Requests
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Service requests from customers looking for your expertise.
        </p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statItems.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"
          >
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${stat.accent}`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs + list */}
      <Tabs defaultValue="new" className="space-y-4">
        <TabsList className="bg-muted/50 backdrop-blur-sm">
          <TabsTrigger value="new">
            New {(stats?.newRequests ?? 0) > 0 && <Badge variant="destructive" className="ml-1.5 text-[10px] h-4 px-1.5">{stats!.newRequests}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="responded">Responded</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        {["new", "responded", "all"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-3">
            {(requests || [])
              .filter((r) =>
                tab === "new" ? r.match_status === "pending" && !hasResponded(r.id) :
                tab === "responded" ? hasResponded(r.id) :
                true
              )
              .map((request, i) => {
                const responded = hasResponded(request.id);
                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className={`rounded-xl border border-border bg-card p-4 sm:p-5 transition-all ${
                      !responded ? "hover:border-primary/30 hover:shadow-sm" : ""
                    }`}
                  >
                    {/* Urgency nudge */}
                    {!responded && request.match_status === "pending" && (
                      <div className="flex items-center gap-2 text-xs text-warning bg-warning/10 rounded-lg px-3 py-1.5 mb-3">
                        <Zap className="h-3 w-3 shrink-0" />
                        <span>Respond quickly — fast replies win more jobs.</span>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-foreground">
                            {request.service_needed || "General Service"}
                          </p>
                          {responded && (
                            <Badge variant="default" className="text-[10px]">Responded</Badge>
                          )}
                          {!responded && request.match_status === "pending" && (
                            <Badge variant="secondary" className="text-[10px] bg-warning/10 text-warning">New</Badge>
                          )}
                          {request.match_score > 70 && (
                            <Badge variant="outline" className="text-[10px] text-primary border-primary/30">Good Match</Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" /> {request.requester_name}
                          </span>
                          {request.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {request.city}
                            </span>
                          )}
                          {request.budget && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" /> {request.budget}
                            </span>
                          )}
                          {request.timeline && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {request.timeline}
                            </span>
                          )}
                        </div>

                        {request.request_details && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{request.request_details}</p>
                        )}

                        <p className="text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {!responded ? (
                          <Button size="sm" className="gap-1.5 rounded-xl h-9 text-[13px] shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 transition-all hover:scale-[1.02]" onClick={() => setRespondingTo(request)}>
                            <Send className="h-3.5 w-3.5" /> Respond
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Sent
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

            {/* Empty state */}
            {(requests || []).filter((r) =>
              tab === "new" ? r.match_status === "pending" && !hasResponded(r.id) :
              tab === "responded" ? hasResponded(r.id) :
              true
            ).length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-dashed border-border bg-card/50 py-12 text-center"
              >
                <Inbox className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {tab === "new" ? "No new requests right now." : tab === "responded" ? "No responses sent yet." : "No job requests yet."}
                </p>
              </motion.div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Response dialog */}
      <Dialog open={!!respondingTo} onOpenChange={(v) => !v && setRespondingTo(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Respond to Request</DialogTitle>
          </DialogHeader>
          {respondingTo && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 border border-border p-3 text-sm space-y-1">
                <p className="font-medium text-foreground">{respondingTo.service_needed || "Service Request"}</p>
                <p className="text-xs text-muted-foreground">From: {respondingTo.requester_name}</p>
                {respondingTo.request_details && (
                  <p className="text-xs text-muted-foreground mt-1">{respondingTo.request_details}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium mb-1.5 block">Your message *</Label>
                <Textarea
                  value={responseForm.message}
                  onChange={(e) => setResponseForm({ ...responseForm, message: e.target.value })}
                  placeholder="Introduce yourself and explain how you can help..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Price estimate ($)</Label>
                  <Input
                    type="number"
                    value={responseForm.price_estimate}
                    onChange={(e) => setResponseForm({ ...responseForm, price_estimate: e.target.value })}
                    placeholder="500"
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Availability</Label>
                  <Input
                    value={responseForm.availability}
                    onChange={(e) => setResponseForm({ ...responseForm, availability: e.target.value })}
                    placeholder="Available this week"
                    className="h-9"
                  />
                </div>
              </div>

              <Button onClick={handleSendResponse} disabled={!responseForm.message.trim() || sending} className="w-full gap-2">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Response
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
