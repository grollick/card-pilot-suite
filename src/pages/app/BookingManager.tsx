import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar, Clock, Plus, Settings, Loader2, CheckCircle2,
  XCircle, AlertCircle, MoreHorizontal, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  useBookingServices, useCreateService, useUpdateService,
  useBookings, useUpdateBooking,
  useAvailability, useUpsertAvailability,
} from "@/hooks/useBookings";

const statusColors: Record<string, string> = {
  requested: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
  pending: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
  confirmed: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
  no_show: "bg-destructive/10 text-destructive",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function BookingManager() {
  const navigate = useNavigate();
  const { data: services = [], isLoading: sLoading } = useBookingServices();
  const { data: bookings = [], isLoading: bLoading } = useBookings();
  const { data: availability = [], isLoading: aLoading } = useAvailability();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const updateBooking = useUpdateBooking();
  const upsertAvailability = useUpsertAvailability();

  // New service dialog
  const [newOpen, setNewOpen] = useState(false);
  const [sName, setSName] = useState("");
  const [sDuration, setSDuration] = useState("30");
  const [sPrice, setSPrice] = useState("");
  const [sDesc, setSDesc] = useState("");

  // Availability editing
  const [editingAvail, setEditingAvail] = useState(false);
  const [availDays, setAvailDays] = useState<Record<number, { enabled: boolean; start: string; end: string }>>({});

  // Init availability state from DB
  useMemo(() => {
    if (availability.length > 0 && !editingAvail) {
      const map: Record<number, { enabled: boolean; start: string; end: string }> = {};
      for (let d = 0; d < 7; d++) {
        const rule = availability.find((r) => r.day_of_week === d);
        map[d] = rule
          ? { enabled: true, start: rule.start_time.slice(0, 5), end: rule.end_time.slice(0, 5) }
          : { enabled: false, start: "09:00", end: "17:00" };
      }
      setAvailDays(map);
    } else if (availability.length === 0 && Object.keys(availDays).length === 0) {
      const map: Record<number, { enabled: boolean; start: string; end: string }> = {};
      for (let d = 0; d < 7; d++) {
        map[d] = { enabled: d < 5, start: "09:00", end: "17:00" };
      }
      setAvailDays(map);
    }
  }, [availability]);

  const handleCreateService = async () => {
    if (!sName.trim()) return;
    await createService.mutateAsync({
      name: sName,
      duration_min: parseInt(sDuration) || 30,
      price: sPrice ? parseFloat(sPrice) : null,
      description: sDesc || null,
    });
    toast.success("Service created");
    setSName(""); setSDuration("30"); setSPrice(""); setSDesc("");
    setNewOpen(false);
  };

  const handleSaveAvailability = async () => {
    const rules = Object.entries(availDays)
      .filter(([_, v]) => v.enabled)
      .map(([d, v]) => ({
        day_of_week: parseInt(d),
        start_time: v.start,
        end_time: v.end,
      }));
    await upsertAvailability.mutateAsync(rules);
    toast.success("Availability saved");
    setEditingAvail(false);
  };

  const handleStatusChange = async (bookingId: string, status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show" | "requested") => {
    await updateBooking.mutateAsync({ id: bookingId, status });
    toast.success(`Booking ${status}`);
  };

  const isLoading = sLoading || bLoading || aLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Booking</h1>
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Booking</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {bookings.length} total bookings · {services.filter((s) => s.active).length} active services
          </p>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-glow"><Plus className="h-4 w-4 mr-2" /> Add Service</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Service</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Service name *" value={sName} onChange={(e) => setSName(e.target.value)} />
              <Input placeholder="Description" value={sDesc} onChange={(e) => setSDesc(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Duration (min)</label>
                  <Select value={sDuration} onValueChange={setSDuration}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[15, 30, 45, 60, 90, 120].map((m) => (
                        <SelectItem key={m} value={String(m)}>{m} min</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Price (optional)</label>
                  <Input type="number" placeholder="0" value={sPrice} onChange={(e) => setSPrice(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleCreateService} disabled={createService.isPending} className="w-full">Create Service</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="bookings">
        <TabsList>
          <TabsTrigger value="bookings">Bookings ({bookings.length})</TabsTrigger>
          <TabsTrigger value="services">Services ({services.length})</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="mt-4">
          {bookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No bookings yet. Share your card to start receiving bookings.
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-3 font-medium text-muted-foreground text-xs">Customer</th>
                    <th className="text-left p-3 font-medium text-muted-foreground text-xs hidden sm:table-cell">Service</th>
                    <th className="text-left p-3 font-medium text-muted-foreground text-xs">Date & Time</th>
                    <th className="text-left p-3 font-medium text-muted-foreground text-xs">Status</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b: any) => (
                    <tr key={b.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="p-3">
                        <p className="font-medium">{b.customer_name}</p>
                        {b.customer_email && <p className="text-xs text-muted-foreground">{b.customer_email}</p>}
                      </td>
                      <td className="p-3 text-muted-foreground hidden sm:table-cell">
                        {b.booking_services?.name ?? "—"}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {format(new Date(b.start_datetime), "MMM d, yyyy · h:mm a")}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[b.status] ?? "bg-muted text-muted-foreground"}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            {b.status !== "confirmed" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(b.id, "confirmed")}>
                                <CheckCircle2 className="h-4 w-4 mr-2 text-[hsl(var(--success))]" /> Confirm
                              </DropdownMenuItem>
                            )}
                            {b.status !== "completed" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(b.id, "completed")}>
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Complete
                              </DropdownMenuItem>
                            )}
                            {b.status !== "cancelled" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(b.id, "cancelled")}>
                                <XCircle className="h-4 w-4 mr-2 text-destructive" /> Cancel
                              </DropdownMenuItem>
                            )}
                            {b.status !== "no_show" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(b.id, "no_show")}>
                                <AlertCircle className="h-4 w-4 mr-2" /> No Show
                              </DropdownMenuItem>
                            )}
                            {b.lead_id && (
                              <DropdownMenuItem onClick={() => navigate(`/app/contacts/${b.lead_id}`)}>
                                <User className="h-4 w-4 mr-2" /> View Contact
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          {services.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No services yet. Add your first service to enable booking.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((s: any) => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl border border-border bg-card p-5 hover:shadow-card transition-shadow ${!s.active ? "opacity-50" : ""}`}>
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold">{s.name}</h3>
                    <Switch
                      checked={s.active}
                      onCheckedChange={(val) => updateService.mutate({ id: s.id, active: val })}
                    />
                  </div>
                  {s.description && <p className="text-sm text-muted-foreground mt-1">{s.description}</p>}
                  <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{s.duration_min} min</span>
                    {s.price != null ? (
                      <span className="font-medium text-foreground">${Number(s.price).toFixed(0)}</span>
                    ) : (
                      <span className="text-[hsl(var(--success))]">Free</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="availability" className="mt-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-xl border border-border bg-card p-5 max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Weekly Availability</h2>
              </div>
              {!editingAvail ? (
                <Button variant="outline" size="sm" onClick={() => setEditingAvail(true)}>Edit</Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditingAvail(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleSaveAvailability} disabled={upsertAvailability.isPending}>Save</Button>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {DAYS.map((day, i) => {
                const rule = availDays[i];
                if (!rule) return null;
                return (
                  <div key={day} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                    <span className="text-sm font-medium w-10">{day}</span>
                    {editingAvail ? (
                      <>
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={(val) => setAvailDays((p) => ({ ...p, [i]: { ...p[i], enabled: val } }))}
                        />
                        {rule.enabled && (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Input
                              type="time"
                              value={rule.start}
                              onChange={(e) => setAvailDays((p) => ({ ...p, [i]: { ...p[i], start: e.target.value } }))}
                              className="h-8 w-24 text-xs"
                            />
                            <span className="text-muted-foreground">–</span>
                            <Input
                              type="time"
                              value={rule.end}
                              onChange={(e) => setAvailDays((p) => ({ ...p, [i]: { ...p[i], end: e.target.value } }))}
                              className="h-8 w-24 text-xs"
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {rule.enabled ? `${rule.start} – ${rule.end}` : "Unavailable"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
