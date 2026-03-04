import { useState } from "react";
import { Calendar, Clock, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/EmptyState";
import { motion } from "framer-motion";

const mockServices = [
  { id: 1, name: "Free Consultation", duration: 30, price: null, description: "Discuss your needs" },
  { id: 2, name: "Strategy Session", duration: 60, price: 150, description: "In-depth strategy session" },
  { id: 3, name: "Follow-Up", duration: 30, price: 75, description: "Follow-up meeting" },
];

const mockBookings = [
  { id: 1, customer: "Sarah Johnson", service: "Free Consultation", date: "Mar 4, 2026", time: "2:00 PM", status: "confirmed" },
  { id: 2, customer: "John Doe", service: "Strategy Session", date: "Mar 5, 2026", time: "10:00 AM", status: "confirmed" },
  { id: 3, customer: "Lisa Park", service: "Follow-Up", date: "Mar 6, 2026", time: "3:00 PM", status: "pending" },
];

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function BookingManager() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Booking</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage services, availability, and appointments</p>
        </div>
        <Button className="shadow-glow">
          <Plus className="h-4 w-4 mr-2" /> Add Service
        </Button>
      </div>

      <Tabs defaultValue="bookings">
        <TabsList>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="mt-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Service</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Date & Time</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockBookings.map(b => (
                  <tr key={b.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-medium">{b.customer}</td>
                    <td className="p-3 text-muted-foreground hidden sm:table-cell">{b.service}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {b.date} · {b.time}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        b.status === "confirmed" ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" : "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]"
                      }`}>{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockServices.map(s => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card p-5 hover:shadow-card transition-shadow">
                <h3 className="font-semibold">{s.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{s.duration} min</span>
                  {s.price && <span className="font-medium text-foreground">${s.price}</span>}
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="availability" className="mt-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card p-5 max-w-lg">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Weekly Availability</h2>
            </div>
            <div className="space-y-3">
              {days.map(day => (
                <div key={day} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm font-medium w-12">{day}</span>
                  <span className="text-sm text-muted-foreground">
                    {["Sat", "Sun"].includes(day) ? "Unavailable" : "9:00 AM – 5:00 PM"}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
