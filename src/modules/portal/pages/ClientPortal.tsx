import { useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Calendar, FileText, Receipt, MessageSquare, Star, Clock, History, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isPast, isFuture } from "date-fns";
import { motion } from "framer-motion";
import {
  usePortalSession,
  usePortalBookings,
  usePortalJobs,
  usePortalInvoices,
  usePortalEstimates,
  usePortalMessages,
  useSendPortalMessage,
  usePortalApproveEstimate,
} from "@/hooks/useClientPortal";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/10 text-primary",
  viewed: "bg-warning/10 text-warning",
  paid: "bg-success/10 text-success",
  overdue: "bg-destructive/10 text-destructive",
  approved: "bg-success/10 text-success",
  declined: "bg-destructive/10 text-destructive",
  completed: "bg-success/10 text-success",
  scheduled: "bg-primary/10 text-primary",
  in_progress: "bg-warning/10 text-warning",
  confirmed: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  requested: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

export default function ClientPortal() {
  const { token } = useParams<{ token: string }>();
  const { data: session, isLoading, isError, error } = usePortalSession(token);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-sm w-full text-center">
          <CardContent className="pt-6 space-y-2">
            <p className="text-lg font-semibold text-foreground">Portal Unavailable</p>
            <p className="text-sm text-muted-foreground">
              {(error as Error)?.message || "This portal link is invalid or has expired."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <PortalDashboard session={session} portalToken={token} />;
}

function PortalDashboard({ session, portalToken }: { session: { lead: any; profile: any; userId: string; leadId: string }; portalToken?: string }) {
  const { lead, profile, userId, leadId } = session;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Client Portal</p>
            <h1 className="text-lg font-bold text-foreground">{profile?.company || profile?.name || "Business"}</h1>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{lead?.name}</p>
            <p className="text-xs text-muted-foreground">{lead?.email}</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="quotes">Quotes</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab userId={userId} leadId={leadId} />
          </TabsContent>
          <TabsContent value="services">
            <ServicesTab userId={userId} leadId={leadId} />
          </TabsContent>
          <TabsContent value="invoices">
            <InvoicesTab userId={userId} leadId={leadId} />
          </TabsContent>
          <TabsContent value="quotes">
            <QuotesTab userId={userId} leadId={leadId} />
          </TabsContent>
          <TabsContent value="messages">
            <MessagesTab userId={userId} leadId={leadId} portalToken={portalToken} />
          </TabsContent>
          <TabsContent value="history">
            <HistoryTab userId={userId} leadId={leadId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ── Overview Tab ──
function OverviewTab({ userId, leadId }: { userId: string; leadId: string }) {
  const { data: bookings } = usePortalBookings(userId, leadId);
  const { data: invoices } = usePortalInvoices(userId, leadId);
  const { data: estimates } = usePortalEstimates(userId, leadId);

  const upcomingBookings = (bookings ?? []).filter((b: any) => isFuture(new Date(b.start_datetime)) && b.status !== "cancelled");
  const outstandingInvoices = (invoices ?? []).filter((i: any) => ["sent", "viewed", "overdue"].includes(i.status));
  const pendingQuotes = (estimates ?? []).filter((e: any) => e.status === "sent");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Upcoming Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{upcomingBookings.length}</p>
          {upcomingBookings[0] && (
            <p className="text-xs text-muted-foreground mt-1">
              Next: {format(new Date(upcomingBookings[0].start_datetime), "MMM d, h:mm a")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Receipt className="h-4 w-4 text-warning" /> Outstanding Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{outstandingInvoices.length}</p>
          {outstandingInvoices.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              ${outstandingInvoices.reduce((s: number, i: any) => s + Number(i.grand_total) - Number(i.amount_paid), 0).toFixed(2)} due
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" /> Pending Quotes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{pendingQuotes.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Awaiting your approval</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Services Tab ──
function ServicesTab({ userId, leadId }: { userId: string; leadId: string }) {
  const { data: bookings, isLoading } = usePortalBookings(userId, leadId);

  const upcoming = (bookings ?? []).filter((b: any) => isFuture(new Date(b.start_datetime)) && b.status !== "cancelled");

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin mx-auto mt-8 text-muted-foreground" />;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Upcoming Services</h2>
      {upcoming.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No upcoming services scheduled.
          </CardContent>
        </Card>
      ) : (
        upcoming.map((b: any) => (
          <Card key={b.id}>
            <CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{b.booking_services?.name || "Service"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(b.start_datetime), "EEEE, MMM d · h:mm a")}
                </p>
                {b.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{b.notes}"</p>}
              </div>
              <Badge className={STATUS_COLORS[b.status] || "bg-muted text-muted-foreground"}>
                {b.status}
              </Badge>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// ── Invoices Tab ──
function InvoicesTab({ userId, leadId }: { userId: string; leadId: string }) {
  const { data: invoices, isLoading } = usePortalInvoices(userId, leadId);

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin mx-auto mt-8 text-muted-foreground" />;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Invoices</h2>
      {(invoices ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No invoices yet.
          </CardContent>
        </Card>
      ) : (
        (invoices ?? []).map((inv: any) => (
          <Card key={inv.id}>
            <CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{inv.invoice_number}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Issued {format(new Date(inv.issue_date), "MMM d, yyyy")}
                  {inv.due_date && ` · Due ${format(new Date(inv.due_date), "MMM d")}`}
                </p>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <p className="font-semibold text-sm">${Number(inv.grand_total).toFixed(2)}</p>
                  {Number(inv.amount_paid) > 0 && Number(inv.amount_paid) < Number(inv.grand_total) && (
                    <p className="text-xs text-muted-foreground">${Number(inv.amount_paid).toFixed(2)} paid</p>
                  )}
                </div>
                <Badge className={STATUS_COLORS[inv.status] || "bg-muted text-muted-foreground"}>
                  {inv.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// ── Quotes Tab ──
function QuotesTab({ userId, leadId }: { userId: string; leadId: string }) {
  const { data: estimates, isLoading } = usePortalEstimates(userId, leadId);
  const approveEstimate = usePortalApproveEstimate();

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin mx-auto mt-8 text-muted-foreground" />;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Quotes & Estimates</h2>
      {(estimates ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No quotes available.
          </CardContent>
        </Card>
      ) : (
        (estimates ?? []).map((est: any) => (
          <Card key={est.id}>
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{est.estimate_number}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {est.job_type || "Service"} · {format(new Date(est.issue_date), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <p className="font-semibold text-sm">${Number(est.grand_total).toFixed(2)}</p>
                  <Badge className={STATUS_COLORS[est.status] || "bg-muted text-muted-foreground"}>
                    {est.status}
                  </Badge>
                </div>
              </div>
              {est.scope_of_work && (
                <p className="text-xs text-muted-foreground border-t border-border pt-2">{est.scope_of_work}</p>
              )}
              {est.status === "sent" && (
                <Button
                  size="sm"
                  onClick={() => approveEstimate.mutate(est.id)}
                  disabled={approveEstimate.isPending}
                  className="w-full"
                >
                  Approve Quote
                </Button>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// ── Messages Tab ──
function MessagesTab({ userId, leadId, portalToken }: { userId: string; leadId: string; portalToken?: string }) {
  const { data: messages, isLoading } = usePortalMessages(userId, leadId);
  const sendMessage = useSendPortalMessage();
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMessage.mutate({ userId, leadId, message: newMessage.trim(), portalToken });
    setNewMessage("");
  };

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin mx-auto mt-8 text-muted-foreground" />;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <MessageSquare className="h-5 w-5" /> Messages
      </h2>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {(messages ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No messages yet. Send one below.</p>
        )}
        {(messages ?? []).map((msg: any) => (
          <div
            key={msg.id}
            className={`p-3 rounded-xl text-sm max-w-[80%] ${
              msg.sender === "client"
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            <p>{msg.message}</p>
            <p className={`text-[10px] mt-1 ${msg.sender === "client" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
              {format(new Date(msg.created_at), "MMM d, h:mm a")}
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Textarea
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="min-h-[60px]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
          }}
        />
        <Button onClick={handleSend} disabled={!newMessage.trim() || sendMessage.isPending} className="self-end">
          Send
        </Button>
      </div>
    </div>
  );
}

// ── History Tab ──
function HistoryTab({ userId, leadId }: { userId: string; leadId: string }) {
  const { data: jobs, isLoading: jobsLoading } = usePortalJobs(userId, leadId);
  const { data: bookings, isLoading: bookingsLoading } = usePortalBookings(userId, leadId);

  const pastBookings = (bookings ?? []).filter((b: any) => isPast(new Date(b.start_datetime)) || b.status === "completed");
  const completedJobs = (jobs ?? []).filter((j: any) => ["completed", "paid"].includes(j.status));

  if (jobsLoading || bookingsLoading) return <Loader2 className="h-5 w-5 animate-spin mx-auto mt-8 text-muted-foreground" />;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <History className="h-5 w-5" /> Service History
      </h2>

      {completedJobs.length === 0 && pastBookings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No service history yet.
          </CardContent>
        </Card>
      ) : (
        <>
          {completedJobs.map((job: any) => (
            <Card key={job.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{job.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {job.job_number} · {job.actual_end ? format(new Date(job.actual_end), "MMM d, yyyy") : format(new Date(job.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <Badge className={STATUS_COLORS[job.status] || "bg-muted text-muted-foreground"}>
                  {job.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
