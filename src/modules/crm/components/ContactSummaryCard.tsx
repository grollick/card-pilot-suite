import { useState } from "react";
import {
  Building2, Plus, Phone, Mail, MapPin, User, Clock, Star, Globe,
  DollarSign, Crown, Briefcase, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import { format, formatDistanceToNow } from "date-fns";
import { useUpdateContact } from "@/hooks/useContactActions";
import { useTags, useToggleContactTag, useCreateTag, usePipelineStages } from "@/hooks/useContacts";
import { useContactCLV } from "@/hooks/useCustomerValue";
import { toast } from "sonner";

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "nurture", label: "Nurture" },
];

interface Props {
  contact: any;
}

export default function ContactSummaryCard({ contact }: Props) {
  const { data: allTags = [] } = useTags();
  const { data: stages = [] } = usePipelineStages();
  const { data: clv } = useContactCLV(contact?.id);
  const updateContact = useUpdateContact();
  const toggleTag = useToggleContactTag();
  const createTagMut = useCreateTag();
  const [newTagName, setNewTagName] = useState("");

  const stage = contact.pipeline_stages;
  const contactTags = (contact.contact_tags ?? []).map((ct: any) => ct.tags).filter(Boolean);
  const contactTagIds = new Set(contactTags.map((t: any) => t.id));
  const initials = contact.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);

  const handleStageChange = async (stageId: string) => {
    await updateContact.mutateAsync({ id: contact.id, stage_id: stageId });
    toast.success("Stage updated");
  };

  const handleStatusChange = async (status: string) => {
    await updateContact.mutateAsync({ id: contact.id, status });
    toast.success("Status updated");
  };

  const properties = [
    { icon: Phone, label: "Phone", value: contact.phone },
    { icon: Mail, label: "Email", value: contact.email },
    { icon: Building2, label: "Company", value: contact.company },
    { icon: MapPin, label: "Address", value: contact.address },
    { icon: User, label: "Preferred", value: contact.preferred_contact_method },
    { icon: Clock, label: "Created", value: format(new Date(contact.created_at), "MMM d, yyyy") },
    { icon: Clock, label: "Last activity", value: contact.last_activity_at ? formatDistanceToNow(new Date(contact.last_activity_at), { addSuffix: true }) : "Never" },
    { icon: Clock, label: "Next activity", value: contact.next_activity_at ? formatDistanceToNow(new Date(contact.next_activity_at), { addSuffix: true }) : "None" },
    { icon: Star, label: "Lead score", value: String(contact.lead_score ?? 0) },
    { icon: Globe, label: "Lifecycle", value: contact.lifecycle_stage ?? "lead" },
  ];

  const isVip = clv && clv.lifetimeValue > 0 && clv.totalJobs >= 2;
  const needsRebooking = clv?.daysSinceLastService !== null && (clv?.daysSinceLastService ?? 0) > 90;

  return (
    <div className="space-y-4">
      {/* Identity */}
      <div className="rounded-xl border border-border bg-muted p-5 space-y-4 shadow-sm ring-1 ring-inset ring-foreground/[0.04]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary shrink-0">{initials}</div>
            {isVip && (
              <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-warning flex items-center justify-center">
                <Crown className="h-3 w-3 text-warning-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold truncate">{contact.name}</h1>
              {isVip && (
                <Badge variant="outline" className="text-[10px] border-warning/50 text-warning shrink-0">
                  VIP
                </Badge>
              )}
            </div>
            {contact.company && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                <Building2 className="h-3 w-3 shrink-0" />{contact.company}
              </p>
            )}
          </div>
        </div>

        {/* Stage + Status */}
        <div className="flex items-center gap-2">
          <Select value={contact.stage_id ?? "none"} onValueChange={handleStageChange}>
            <SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="Set stage" /></SelectTrigger>
            <SelectContent>
              {stages.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={contact.status ?? "open"} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-8 text-xs w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {statusOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Tags */}
        <div className="flex gap-1.5 flex-wrap items-center">
          {contactTags.map((tag: any) => (
            <button key={tag.id} onClick={() => toggleTag.mutate({ leadId: contact.id, tagId: tag.id, add: false })}
              className="text-xs px-2 py-0.5 rounded-full border hover:line-through transition-all"
              style={{ borderColor: tag.color, color: tag.color }} title="Remove">
              {tag.name}
            </button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 text-xs px-1.5"><Plus className="h-3 w-3" /></Button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-2" align="start">
              <div className="space-y-1 max-h-32 overflow-auto">
                {allTags.filter((t: any) => !contactTagIds.has(t.id)).map((t: any) => (
                  <button key={t.id} onClick={() => toggleTag.mutate({ leadId: contact.id, tagId: t.id, add: true })}
                    className="w-full text-left text-sm px-2 py-1 rounded hover:bg-muted flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />{t.name}
                  </button>
                ))}
              </div>
              <Separator className="my-2" />
              <div className="flex gap-1">
                <Input placeholder="New tag..." value={newTagName} onChange={e => setNewTagName(e.target.value)} className="h-7 text-xs" />
                <Button size="sm" className="h-7 text-xs px-2" onClick={async () => {
                  if (!newTagName.trim()) return;
                  const tag = await createTagMut.mutateAsync(newTagName);
                  await toggleTag.mutateAsync({ leadId: contact.id, tagId: tag.id, add: true });
                  setNewTagName(""); toast.success("Tag added");
                }}>Add</Button>
              </div>
            </PopoverContent>
          </Popover>
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground ml-auto">{contact.source}</span>
        </div>
      </div>

      {/* Customer Value Card */}
      {clv && (clv.lifetimeValue > 0 || clv.totalJobs > 0 || clv.repeatCount > 0) && (
        <div className="rounded-xl border border-border bg-muted p-4 space-y-3 shadow-sm ring-1 ring-inset ring-foreground/[0.04]">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="h-3 w-3" />
            Customer Value
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <p className="text-lg font-bold tabular-nums">${clv.lifetimeValue.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">Lifetime Value</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-lg font-bold tabular-nums">{clv.totalJobs}</p>
              <p className="text-[11px] text-muted-foreground">Completed Jobs</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold tabular-nums">${clv.avgJobValue.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">Avg Job Value</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold tabular-nums">
                {clv.lastServiceDate
                  ? formatDistanceToNow(new Date(clv.lastServiceDate), { addSuffix: true })
                  : "—"}
              </p>
              <p className="text-[11px] text-muted-foreground">Last Service</p>
            </div>
          </div>

          {/* Repeat customer insight */}
          {clv.repeatCount > 1 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-success/5 border border-success/10">
              <RotateCcw className="h-3.5 w-3.5 text-success shrink-0" />
              <p className="text-xs text-success">
                Repeat customer — booked {clv.repeatCount} times
              </p>
            </div>
          )}

          {/* Rebooking alert */}
          {needsRebooking && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/5 border border-warning/10">
              <Briefcase className="h-3.5 w-3.5 text-warning shrink-0" />
              <p className="text-xs text-warning">
                Last service was {clv.daysSinceLastService} days ago — consider reaching out
              </p>
            </div>
          )}
        </div>
      )}

      {/* Properties */}
      <div className="rounded-xl border border-border bg-muted p-4 space-y-3 shadow-sm ring-1 ring-inset ring-foreground/[0.04]">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Properties</p>
        {properties.map((prop, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <prop.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground text-xs w-24 shrink-0">{prop.label}</span>
            <span className={`truncate flex-1 text-xs ${!prop.value || prop.value === "Never" || prop.value === "None" ? "text-muted-foreground/50" : ""}`}>
              {prop.value || "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
