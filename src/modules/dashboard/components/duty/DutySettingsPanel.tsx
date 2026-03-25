import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { useEstimateDuty } from "@/hooks/useEstimateDuty";

interface DutySettingsPanelProps {
  isOnDuty: boolean;
  isProPlus: boolean;
  isPending: boolean;
  onSave: (settings: {
    available_until?: string | null;
    max_leads?: number | null;
    service_radius_km?: number | null;
    auto_off_after_hours?: number | null;
    auto_off_outside_hours?: boolean;
  }) => void;
}

export default function DutySettingsPanel({ isOnDuty, isProPlus, isPending, onSave }: DutySettingsPanelProps) {
  const { status } = useEstimateDuty();
  const [availableUntil, setAvailableUntil] = useState("");
  const [maxLeads, setMaxLeads] = useState("");
  const [radiusKm, setRadiusKm] = useState("");
  const [autoOffHours, setAutoOffHours] = useState("");
  const [autoOffOutside, setAutoOffOutside] = useState(false);

  // Hydrate from existing duty settings
  useEffect(() => {
    if (!status) return;
    if (status.available_until) {
      try {
        const d = new Date(status.available_until);
        setAvailableUntil(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
      } catch { /* ignore invalid dates */ }
    }
    if (status.max_leads != null) setMaxLeads(String(status.max_leads));
    if (status.service_radius_km != null) setRadiusKm(String(status.service_radius_km));
    if (status.auto_off_after_hours != null) setAutoOffHours(String(status.auto_off_after_hours));
    if (status.auto_off_outside_hours) setAutoOffOutside(true);
  }, [status]);

  const handleSave = () => {
    let parsedUntil: string | null = null;
    if (availableUntil) {
      const [hours, minutes] = availableUntil.split(":").map(Number);
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      if (d <= new Date()) d.setDate(d.getDate() + 1);
      parsedUntil = d.toISOString();
    }

    onSave({
      available_until: parsedUntil,
      max_leads: maxLeads ? parseInt(maxLeads) : null,
      service_radius_km: radiusKm ? parseInt(radiusKm) : null,
      auto_off_after_hours: autoOffHours ? parseInt(autoOffHours) : null,
      auto_off_outside_hours: autoOffOutside,
    });
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden"
    >
      <div className="space-y-3 border-t border-border pt-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[10px] text-muted-foreground">Available until</Label>
            <Input
              type="time"
              value={availableUntil}
              onChange={(e) => setAvailableUntil(e.target.value)}
              className="h-8 text-xs"
              placeholder="HH:MM"
            />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Max leads</Label>
            <Input
              type="number"
              value={maxLeads}
              onChange={(e) => setMaxLeads(e.target.value)}
              className="h-8 text-xs"
              placeholder="e.g. 5"
              min={1}
            />
          </div>
        </div>

        {isProPlus && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] text-muted-foreground">Service radius (km)</Label>
              <Input
                type="number"
                value={radiusKm}
                onChange={(e) => setRadiusKm(e.target.value)}
                className="h-8 text-xs"
                placeholder="e.g. 25"
                min={1}
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Auto-off after (hrs)</Label>
              <Input
                type="number"
                value={autoOffHours}
                onChange={(e) => setAutoOffHours(e.target.value)}
                className="h-8 text-xs"
                placeholder="e.g. 8"
                min={1}
              />
            </div>
          </div>
        )}

        {isProPlus && (
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Auto-off outside business hours</Label>
            <Switch
              checked={autoOffOutside}
              onCheckedChange={setAutoOffOutside}
              className="scale-90"
            />
          </div>
        )}

        <Button
          size="sm"
          className="w-full h-8 text-xs"
          onClick={handleSave}
          disabled={isPending}
        >
          {isOnDuty ? "Update settings" : "Go On Duty"}
        </Button>
      </div>
    </motion.div>
  );
}
