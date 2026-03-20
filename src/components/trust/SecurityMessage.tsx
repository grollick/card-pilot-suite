import { Shield, Lock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type MessagePreset = "auth" | "payment" | "dashboard" | "marketplace" | "card";

const presets: Record<MessagePreset, { icon: typeof Shield; text: string }> = {
  auth: {
    icon: Shield,
    text: "Your data is protected with modern security standards",
  },
  payment: {
    icon: Lock,
    text: "Secure and encrypted transactions",
  },
  dashboard: {
    icon: ShieldCheck,
    text: "Your data is securely stored and protected",
  },
  marketplace: {
    icon: ShieldCheck,
    text: "Trusted local professionals on a secure platform",
  },
  card: {
    icon: ShieldCheck,
    text: "Verified business on Guzzl",
  },
};

interface SecurityMessageProps {
  preset: MessagePreset;
  className?: string;
}

export default function SecurityMessage({ preset, className }: SecurityMessageProps) {
  const p = presets[preset];
  const Icon = p.icon;

  return (
    <p className={cn("flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/70", className)}>
      <Icon className="h-3 w-3 shrink-0" />
      <span>{p.text}</span>
    </p>
  );
}
