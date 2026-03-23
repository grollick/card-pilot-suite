import { useState } from "react";
import { useMyJobRequests, useMyJobResponses, useJobRequestStats } from "@/hooks/useJobRequests";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useLeadPerformance } from "@/hooks/useLeadPerformance";
import {
  Briefcase, Loader2, Send, MapPin, DollarSign, Clock,
  CheckCircle2, MessageSquare, TrendingUp, ArrowRight, Inbox, Zap, AlertTriangle,
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

      // Update match status
      await (supabase as any)
        .from("estimate_matches")
        .update({ status: "responded", responded_at: new Date().toISOString() })
        .eq("estimate_request_id", respondingTo.id)
        .eq("user_id", user.id);

      toast.success("Response sent!");
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-primary" /> <span className="font-extrabold text-primary">guzzl</span> <span className="font-normal">Job Requests</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Service requests from customers looking for your expertise.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "New Requests", value: stats?.newRequests || 0, icon: Inbox, color: "text-blue-600" },
          { label: "Responses Sent", value: stats?.responsesSent || 0, icon: Send, color: "text-emerald-600" },
          { label: "Leads Won", value: stats?.won || 0, icon: CheckCircle2, color: "text-primary" },
          { label: "Total Received", value: stats?.total || 0, icon: TrendingUp, color: "text-muted-foreground" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-2xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Requests list */}
      <Tabs defaultValue="new" className="space-y-4">
        <TabsList>
          <TabsTrigger value="new">
            New {stats?.newRequests ? <Badge variant="destructive" className="ml-1.5 text-2xs h-4 px-1.5">{stats.newRequests}</Badge> : null}
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
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className={`border-border transition-all ${!responded ? "hover:border-primary/30 hover:shadow-md" : ""}`}>
                      <CardContent className="p-5">
                        {/* Competition nudge for unresponded */}
                        {!responded && request.match_status === "pending" && (
                          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-500/10 rounded-lg px-3 py-1.5 mb-3">
                            <Zap className="h-3 w-3 shrink-0" />
                            <span>Respond quickly to improve your chances — fast replies win more leads.</span>
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm">{request.service_needed || "General Service"}</p>
                              {responded && <Badge variant="default" className="text-2xs">Responded</Badge>}
                              {!responded && request.match_status === "pending" && (
                                <Badge variant="secondary" className="text-2xs bg-amber-500/10 text-amber-700">New</Badge>
                              )}
                              {request.match_score > 70 && (
                                <Badge variant="outline" className="text-2xs text-primary border-primary/30">Good Match</Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {request.requester_name}</span>
                              {request.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {request.city}</span>}
                              {request.budget && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {request.budget}</span>}
                              {request.timeline && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {request.timeline}</span>}
                            </div>

                            {request.request_details && (
                              <p className="text-sm text-foreground/80 line-clamp-2">{request.request_details}</p>
                            )}

                            <p className="text-2xs text-muted-foreground">
                              {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                            </p>
                          </div>

                          <div className="shrink-0">
                            {!responded ? (
                              <Button size="sm" className="gap-1.5" onClick={() => setRespondingTo(request)}>
                                <Send className="h-3 w-3" /> Respond
                              </Button>
                            ) : (
                              <Badge variant="outline" className="text-2xs"><CheckCircle2 className="h-3 w-3 mr-1" /> Sent</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}

            {(requests || []).filter((r) =>
              tab === "new" ? r.match_status === "pending" && !hasResponded(r.id) :
              tab === "responded" ? hasResponded(r.id) :
              true
            ).length === 0 && (
              <Card className="border-dashed border-border">
                <CardContent className="py-12 text-center">
                  <Inbox className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {tab === "new" ? "No new requests right now." : tab === "responded" ? "No responses sent yet." : "No job requests yet."}
                  </p>
                </CardContent>
              </Card>
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
              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                <p className="font-medium">{respondingTo.service_needed || "Service Request"}</p>
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
