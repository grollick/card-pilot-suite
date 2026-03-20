import { useState } from "react";
import { Clock, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}

const defaultSchedule: DaySchedule[] = DAYS.map((_, i) => ({
  enabled: i >= 1 && i <= 5,
  start: "09:00",
  end: "17:00",
}));

export default function AvailabilityEditor() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(defaultSchedule);
  const [saving, setSaving] = useState(false);

  const updateDay = (index: number, updates: Partial<DaySchedule>) => {
    setSchedule(prev =>
      prev.map((d, i) => (i === index ? { ...d, ...updates } : d))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    toast.success("Availability schedule saved");
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Weekly Availability
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Set working hours for each day of the week</p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save
        </Button>
      </div>

      <div className="space-y-2">
        {DAYS.map((day, i) => (
          <div
            key={day}
            className={`flex items-center gap-3 rounded-lg border border-border p-3 transition-colors ${
              schedule[i].enabled ? "bg-card" : "bg-muted/30 opacity-60"
            }`}
          >
            <Switch
              checked={schedule[i].enabled}
              onCheckedChange={v => updateDay(i, { enabled: v })}
            />
            <span className="text-sm font-medium w-24">{day}</span>
            {schedule[i].enabled ? (
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={schedule[i].start}
                  onChange={e => updateDay(i, { start: e.target.value })}
                  className="w-28 h-8 text-xs"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="time"
                  value={schedule[i].end}
                  onChange={e => updateDay(i, { end: e.target.value })}
                  className="w-28 h-8 text-xs"
                />
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Off</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
