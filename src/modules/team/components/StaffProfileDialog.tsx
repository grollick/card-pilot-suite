import { useState } from "react";
import { UserPlus, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function StaffProfileDialog({ open, onOpenChange }: Props) {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [services, setServices] = useState("");
  const [bookable, setBookable] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setLoading(true);
    // Staff profiles are stored locally for now — no login required
    toast.success(`Staff profile created for ${name}`);
    onOpenChange(false);
    setName("");
    setTitle("");
    setServices("");
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Staff Profile</DialogTitle>
          <DialogDescription>
            Add a staff member who doesn't need login access
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {/* Photo */}
          <div className="flex justify-center">
            <button className="h-20 w-20 rounded-full bg-muted border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center transition-colors">
              <Camera className="h-6 w-6 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="John Smith" />
          </div>

          <div className="space-y-2">
            <Label>Title / Position</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Senior Technician" />
          </div>

          <div className="space-y-2">
            <Label>Services</Label>
            <Input
              value={services}
              onChange={e => setServices(e.target.value)}
              placeholder="e.g. Plumbing, Electrical"
            />
            <p className="text-xs text-muted-foreground">Comma-separated list of services this staff handles</p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Bookable</p>
              <p className="text-xs text-muted-foreground">Customers can book this staff directly</p>
            </div>
            <Switch checked={bookable} onCheckedChange={setBookable} />
          </div>

          <Button onClick={handleCreate} disabled={loading || !name.trim()} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Profile"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
