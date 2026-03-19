import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { format, isPast, isFuture } from "date-fns";
import {
  Calendar, Clock, Building2, Star, RotateCw,
  ChevronRight, Loader2, LogOut, X, AlertTriangle, Sparkles, Lock, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  useClientProfile, useClientBusinesses, useClientBookings,
  type ClientBooking
} from "@/hooks/useClientPortalData";
import { useClientCancelBooking } from "@/hooks/useClientPortalActions";
import PortalReviewDialog from "@/modules/client/components/PortalReviewDialog";
import UpcomingAppointmentWidget from "@/modules/client/components/UpcomingAppointmentWidget";
import PaymentSummaryWidget from "@/modules/client/components/PaymentSummaryWidget";
import ProjectProgressWidget from "@/modules/client/components/ProjectProgressWidget";
import DocumentVaultWidget from "@/modules/client/components/DocumentVaultWidget";
import { toast } from "sonner";

const anim = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const statusColors: Record<string, string> = {
  pending: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
  confirmed: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]",
  completed: "bg-primary/15 text-primary",
  cancelled: "bg-destructive/15 text-destructive",
  no_show: "bg-muted text-muted-foreground",
};

export default function ClientDashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useClientProfile();
  const { data: businesses = [], isLoading: bizLoading } = useClientBusinesses();
  const { data: bookings = [], isLoading: bookingsLoading } = useClientBookings();
  const cancelBooking = useClientCancelBooking();
  const [cancelTarget, setCancelTarget] = useState<{ id: string; userId: string; leadId: string; serviceName?: string } | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{ businessUserId: string; businessName: string | null; leadId: string } | null>(null);

  const isLoading = profileLoading || bizLoading || bookingsLoading;
  const leadIds = useMemo(() => businesses.map(b => b.leadId), [businesses]);
  const upcomingBookings = bookings.filter(
    b => isFuture(new Date(b.start_datetime)) && b.status !== "cancelled"
  );
  const pastBookings = bookings.filter(
    b => isPast(new Date(b.start_datetime)) || b.status === "completed"
  );

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      await cancelBooking.mutateAsync({
        bookingId: cancelTarget.id,
        businessUserId: cancelTarget.userId,
        leadId: cancelTarget.leadId,
        serviceName: cancelTarget.serviceName,
      });
    } catch {
      // error handled in hook
    }
    setCancelTarget(null);
  };

  const handleBookAgain = (booking: ClientBooking) => {
    if (booking.user_id) {
      const biz = businesses.find(b => b.businessUserId === booking.user_id);
      if (biz?.businessHandle) {
        navigate(`/book/${biz.businessHandle}`);
        return;
      }
    }
    toast.info("Please contact the business to rebook.");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/client/auth");
  };

  // Find the lead_id for a booking's business
  const getLeadIdForBooking = (booking: ClientBooking): string | null => {
    const biz = businesses.find(b => b.businessUserId === booking.user_id);
    return biz?.leadId || booking.lead_id || null;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">My Portal</h1>
              <p className="text-2xs text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-1.5" /> Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome */}
        <motion.div {...anim}>
          <h2 className="text-xl font-bold tracking-tight">
            Welcome back{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your bookings and services.
          </p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Upcoming", value: upcomingBookings.length, icon: Calendar, color: "text-primary bg-primary/10" },
            { label: "Businesses", value: businesses.length, icon: Building2, color: "text-[hsl(var(--success))] bg-[hsl(var(--success))]/10" },
            { label: "Past Services", value: pastBookings.length, icon: RotateCw, color: "text-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10" },
          ].map((stat, i) => (
            <motion.div key={stat.label} {...anim} transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card p-4 shadow-card"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`h-7 w-7 rounded-md flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-3.5 w-3.5" />
                </div>
              </div>
              {isLoading ? <Skeleton className="h-7 w-10" /> : (
                <p className="text-xl font-bold">{stat.value}</p>
              )}
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ── New Portal Widgets ── */}
        <UpcomingAppointmentWidget
          bookings={bookings}
          onReschedule={(booking) => handleBookAgain(booking)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProjectProgressWidget leadIds={leadIds} />
          <PaymentSummaryWidget leadIds={leadIds} />
        </div>

        <DocumentVaultWidget leadIds={leadIds} />

        {/* Bookings */}
        <motion.div {...anim} transition={{ delay: 0.1 }}>
          <Tabs defaultValue="upcoming" className="space-y-4">
            <TabsList>
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({pastBookings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))
              ) : upcomingBookings.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-border bg-card">
                  <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No upcoming bookings</p>
                  {businesses.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        const biz = businesses[0];
                        if (biz?.businessHandle) navigate(`/book/${biz.businessHandle}`);
                      }}
                    >
                      Book a Service
                    </Button>
                  )}
                </div>
              ) : (
                upcomingBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onCancel={() => {
                      const leadId = getLeadIdForBooking(booking);
                      if (leadId) {
                        setCancelTarget({
                          id: booking.id,
                          userId: booking.user_id,
                          leadId,
                          serviceName: booking.serviceName,
                        });
                      }
                    }}
                    onReschedule={() => handleBookAgain(booking)}
                    variant="upcoming"
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))
              ) : pastBookings.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-border bg-card">
                  <RotateCw className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No past services yet</p>
                </div>
              ) : (
                pastBookings.map((booking) => {
                  const leadId = getLeadIdForBooking(booking);
                  return (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onBookAgain={() => handleBookAgain(booking)}
                      onReview={leadId ? () => {
                        const biz = businesses.find(b => b.businessUserId === booking.user_id);
                        setReviewTarget({
                          businessUserId: booking.user_id,
                          businessName: biz?.businessName || booking.businessName || null,
                          leadId,
                        });
                      } : undefined}
                      variant="past"
                    />
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* My Businesses */}
        {!isLoading && businesses.length > 0 && (
          <motion.div {...anim} transition={{ delay: 0.15 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <h3 className="font-semibold mb-3">My Service Providers</h3>
            <div className="space-y-2">
              {businesses.map((biz) => (
                <div key={biz.leadId}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  {biz.businessAvatar ? (
                    <img src={biz.businessAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{biz.businessName}</p>
                    {biz.businessHandle && (
                      <p className="text-xs text-muted-foreground">@{biz.businessHandle}</p>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReviewTarget({
                        businessUserId: biz.businessUserId,
                        businessName: biz.businessName,
                        leadId: biz.leadId,
                      })}
                    >
                      <Star className="h-3 w-3 mr-1" /> Review
                    </Button>
                    {biz.businessHandle && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/book/${biz.businessHandle}`)}
                      >
                        Book <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Marketplace Discovery CTA */}
        <motion.div {...anim} transition={{ delay: 0.2 }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-5"
        >
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Need another service?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Browse our marketplace to find trusted professionals near you — from plumbers to photographers.
              </p>
              <Button
                variant="default"
                size="sm"
                className="mt-3"
                onClick={() => navigate("/discover")}
              >
                Browse Marketplace <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Cancel Confirmation */}
      <AlertDialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancel Booking?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? The service provider will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelBooking.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <X className="h-4 w-4 mr-1" />
              )}
              Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Review Dialog */}
      {reviewTarget && (
        <PortalReviewDialog
          open={!!reviewTarget}
          onOpenChange={(open) => { if (!open) setReviewTarget(null); }}
          businessUserId={reviewTarget.businessUserId}
          businessName={reviewTarget.businessName}
          leadId={reviewTarget.leadId}
          clientName={profile?.name || "Client"}
          clientEmail={profile?.email}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by <span className="font-medium text-foreground"><span className="font-bold text-primary">guzzl</span>.pro</span>
        </p>
      </footer>
    </div>
  );
}

function BookingCard({
  booking,
  onCancel,
  onReschedule,
  onBookAgain,
  onReview,
  variant,
}: {
  booking: ClientBooking;
  onCancel?: () => void;
  onReschedule?: () => void;
  onBookAgain?: () => void;
  onReview?: () => void;
  variant: "upcoming" | "past";
}) {
  const statusColor = statusColors[booking.status] || statusColors.pending;

  return (
    <div className="rounded-xl border border-border bg-card p-4 hover:shadow-card transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold truncate">
              {booking.serviceName || "Service"}
            </p>
            <Badge className={`text-[10px] px-1.5 py-0 border-0 ${statusColor}`}>
              {booking.status}
            </Badge>
          </div>
          {booking.businessName && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" /> {booking.businessName}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(booking.start_datetime), "MMM d, yyyy")}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(booking.start_datetime), "h:mm a")}
            </span>
            {booking.servicePrice != null && (
              <span className="text-xs font-medium text-primary">
                ${booking.servicePrice}
              </span>
            )}
          </div>
          {variant === "past" && booking.notes && (
            <p className="text-xs text-muted-foreground mt-1.5 italic">"{booking.notes}"</p>
          )}
        </div>

        <div className="flex gap-1.5 shrink-0">
          {variant === "upcoming" && booking.status !== "cancelled" && (
            <>
              <Button variant="outline" size="sm" onClick={onReschedule}>
                Reschedule
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onCancel}>
                Cancel
              </Button>
            </>
          )}
          {variant === "past" && booking.status === "completed" && (
            <div className="flex gap-1.5">
              {onReview && (
                <Button variant="outline" size="sm" onClick={onReview}>
                  <Star className="h-3 w-3 mr-1" /> Review
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onBookAgain}>
                <RotateCw className="h-3 w-3 mr-1" /> Rebook
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
