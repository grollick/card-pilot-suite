import { Phone, MessageSquare, Navigation, Camera, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileQuickActionsProps {
  phone?: string | null;
  address?: string | null;
  contactId?: string | null;
  onUploadPhoto: () => void;
  onOpenContact: () => void;
}

export default function MobileQuickActions({ phone, address, contactId, onUploadPhoto, onOpenContact }: MobileQuickActionsProps) {
  const mapUrl = address
    ? `https://maps.google.com/?q=${encodeURIComponent(address)}`
    : null;

  return (
    <div className="grid grid-cols-5 gap-1.5">
      <Button
        variant="outline"
        className="flex-col h-16 gap-1 text-[10px] font-medium p-1"
        disabled={!phone}
        asChild={!!phone}
      >
        {phone ? (
          <a href={`tel:${phone}`}>
            <Phone className="h-5 w-5 text-success" />
            Call
          </a>
        ) : (
          <span>
            <Phone className="h-5 w-5 text-muted-foreground" />
            Call
          </span>
        )}
      </Button>

      <Button
        variant="outline"
        className="flex-col h-16 gap-1 text-[10px] font-medium p-1"
        disabled={!phone}
        asChild={!!phone}
      >
        {phone ? (
          <a href={`sms:${phone}`}>
            <MessageSquare className="h-5 w-5 text-primary" />
            Text
          </a>
        ) : (
          <span>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            Text
          </span>
        )}
      </Button>

      <Button
        variant="outline"
        className="flex-col h-16 gap-1 text-[10px] font-medium p-1"
        disabled={!mapUrl}
        asChild={!!mapUrl}
      >
        {mapUrl ? (
          <a href={mapUrl} target="_blank" rel="noopener noreferrer">
            <Navigation className="h-5 w-5 text-warning" />
            Navigate
          </a>
        ) : (
          <span>
            <Navigation className="h-5 w-5 text-muted-foreground" />
            Navigate
          </span>
        )}
      </Button>

      <Button
        variant="outline"
        className="flex-col h-16 gap-1 text-[10px] font-medium p-1"
        onClick={onUploadPhoto}
      >
        <Camera className="h-5 w-5 text-accent" />
        Photo
      </Button>

      <Button
        variant="outline"
        className="flex-col h-16 gap-1 text-[10px] font-medium p-1"
        disabled={!contactId}
        onClick={onOpenContact}
      >
        <User className="h-5 w-5 text-primary" />
        Contact
      </Button>
    </div>
  );
}
