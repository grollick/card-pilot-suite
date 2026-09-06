import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, ChevronDown, Crown, Plus, Star, Trash2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useMyCards, useCreateCard, useDeleteCard, useSetPrimaryCard,
  useProfessionOptions, useCardAllowance, slugifyCard,
} from "@/hooks/useCards";

interface Props {
  handle?: string | null;
  activeCardId?: string | null;
}

export default function CardSwitcher({ handle, activeCardId }: Props) {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const { data: cards = [] } = useMyCards();
  const { data: professions = [] } = useProfessionOptions();
  const { limit, canAddMore, isMultiCardPlan } = useCardAllowance();
  const createCard = useCreateCard();
  const deleteCard = useDeleteCard();
  const setPrimary = useSetPrimaryCard();

  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [company, setCompany] = useState("");
  const [professionId, setProfessionId] = useState<string>("");

  const active = cards.find((c) => c.id === activeCardId) ?? cards.find((c) => c.is_primary) ?? cards[0];
  const activeName = active?.label || active?.company || "Main card";

  const selectCard = (id: string, isPrimary: boolean) => {
    if (isPrimary) setSearchParams({});
    else setSearchParams({ card: id });
  };

  const handleCreate = async () => {
    const finalSlug = slugifyCard(slug || label);
    if (!label.trim() || !finalSlug) {
      toast.error("Give the card a name first");
      return;
    }
    if (cards.some((c) => (c.slug || "").toLowerCase() === finalSlug)) {
      toast.error("You already have a card at that address");
      return;
    }
    try {
      const created = await createCard.mutateAsync({
        label: label.trim(),
        slug: finalSlug,
        company: company.trim() || null,
        profession_id: professionId || null,
      });
      toast.success("New card created");
      setOpen(false);
      setLabel(""); setSlug(""); setCompany(""); setProfessionId("");
      setSearchParams({ card: (created as any).id });
    } catch (e: any) {
      toast.error(e.message || "Could not create the card");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg text-[11px] max-w-[190px]">
            <Layers className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate">{activeName}</span>
            <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72 z-50 bg-popover">
          <DropdownMenuLabel className="text-[11px] text-muted-foreground">
            Your cards {limit !== -1 && `(${cards.length}/${limit})`}
          </DropdownMenuLabel>
          {cards.map((c) => (
            <DropdownMenuItem
              key={c.id}
              className="flex items-center gap-2 text-xs"
              onSelect={() => selectCard(c.id, c.is_primary)}
            >
              {c.id === active?.id ? <Check className="h-3.5 w-3.5 text-primary" /> : <span className="w-3.5" />}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.label || c.company || "Main card"}</p>
                <p className="truncate text-[10px] text-muted-foreground">
                  /{handle}{c.slug && !c.is_primary ? `/${c.slug}` : ""}
                </p>
              </div>
              {c.is_primary && <Badge variant="secondary" className="text-[9px]">Main</Badge>}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {canAddMore ? (
            <DropdownMenuItem className="text-xs gap-2" onSelect={(e) => { e.preventDefault(); setOpen(true); }}>
              <Plus className="h-3.5 w-3.5" /> New card
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem className="text-xs gap-2" onSelect={() => navigate("/pricing")}>
              <Crown className="h-3.5 w-3.5 text-primary" />
              {isMultiCardPlan ? "Upgrade for more cards" : "Upgrade to add more cards"}
            </DropdownMenuItem>
          )}
          {active && !active.is_primary && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs gap-2" onSelect={() => setPrimary.mutate(active.id)}>
                <Star className="h-3.5 w-3.5" /> Make this my main card
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs gap-2 text-destructive focus:text-destructive"
                onSelect={() => {
                  deleteCard.mutate(active.id, {
                    onSuccess: () => { toast.success("Card deleted"); setSearchParams({}); },
                  });
                }}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete this card
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen} modal={false}>
        <DialogContent className="sm:max-w-md z-50">
          <DialogHeader>
            <DialogTitle>New card</DialogTitle>
            <DialogDescription>
              Give this card its own trade and business name. It gets its own web address.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Card name</Label>
              <Input
                value={label}
                placeholder="e.g. Plumbing"
                onChange={(e) => {
                  setLabel(e.target.value);
                  if (!slug) setSlug(slugifyCard(e.target.value));
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Web address</Label>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="shrink-0">guzzl.pro/{handle}/</span>
                <Input
                  value={slug}
                  placeholder="plumbing"
                  onChange={(e) => setSlug(slugifyCard(e.target.value))}
                  className="h-8"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Business name (optional)</Label>
              <Input value={company} placeholder="e.g. North Star Plumbing" onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Trade (optional)</Label>
              <Select value={professionId} onValueChange={setProfessionId}>
                <SelectTrigger><SelectValue placeholder="Choose a trade" /></SelectTrigger>
                <SelectContent className="z-50 bg-popover max-h-64">
                  {professions.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createCard.isPending}>Create card</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
