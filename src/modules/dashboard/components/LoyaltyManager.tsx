import { useState } from "react";
import { Gift, Plus, Stamp, Award, RotateCcw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  useLoyaltyProgram, useUpsertLoyaltyProgram,
  useLoyaltyCards, useAddStamp, useCreateLoyaltyCard, useRedeemReward,
} from "@/hooks/useLoyalty";

function PunchCard({ card, stampsRequired, onStamp, onRedeem }: {
  card: any; stampsRequired: number; onStamp: () => void; onRedeem: () => void;
}) {
  const progress = Math.min(card.stamps_collected / stampsRequired, 1);
  const isComplete = card.stamps_collected >= stampsRequired && !card.reward_redeemed;

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-sm">{card.client_name}</p>
              <p className="text-xs text-muted-foreground">{card.client_email || card.client_phone || "No contact"}</p>
            </div>
            <Badge variant={isComplete ? "default" : card.reward_redeemed ? "secondary" : "outline"} className="text-[10px]">
              {card.reward_redeemed ? "Redeemed" : isComplete ? "Ready!" : `${card.stamps_collected}/${stampsRequired}`}
            </Badge>
          </div>

          {/* Visual punch card */}
          <div className="grid grid-cols-5 gap-1.5 mb-3">
            {Array.from({ length: stampsRequired }, (_, i) => (
              <motion.div
                key={i}
                className={`aspect-square rounded-lg border-2 flex items-center justify-center transition-colors ${
                  i < card.stamps_collected
                    ? "bg-primary/15 border-primary/30"
                    : "bg-muted/30 border-border/50"
                }`}
                initial={false}
                animate={i < card.stamps_collected ? { scale: [1, 1.2, 1] } : {}}
              >
                {i < card.stamps_collected ? (
                  <Stamp className="h-3.5 w-3.5 text-primary" />
                ) : i === stampsRequired - 1 ? (
                  <Gift className="h-3.5 w-3.5 text-muted-foreground/40" />
                ) : null}
              </motion.div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="flex gap-2">
            {!card.reward_redeemed && !isComplete && (
              <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={onStamp}>
                <Stamp className="h-3 w-3 mr-1" /> Add Stamp
              </Button>
            )}
            {isComplete && (
              <Button size="sm" className="flex-1 text-xs h-8 shadow-glow" onClick={onRedeem}>
                <Award className="h-3 w-3 mr-1" /> Redeem Reward
              </Button>
            )}
            {card.reward_redeemed && (
              <Button size="sm" variant="ghost" className="flex-1 text-xs h-8" onClick={onStamp}>
                <RotateCcw className="h-3 w-3 mr-1" /> Start New Cycle
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function LoyaltyManager() {
  const { data: program, isLoading: loadingProgram } = useLoyaltyProgram();
  const { data: cards = [] } = useLoyaltyCards();
  const upsertProgram = useUpsertLoyaltyProgram();
  const addStamp = useAddStamp();
  const createCard = useCreateLoyaltyCard();
  const redeemReward = useRedeemReward();

  const [showSetup, setShowSetup] = useState(false);
  const [showNewCard, setShowNewCard] = useState(false);
  const [setupForm, setSetupForm] = useState({ name: "Loyalty Card", stamps_required: 10, reward_description: "Free service" });
  const [newCardForm, setNewCardForm] = useState({ clientName: "", clientEmail: "", clientPhone: "" });

  if (loadingProgram) return null;

  const handleSetupSave = async () => {
    await upsertProgram.mutateAsync({
      name: setupForm.name,
      stamps_required: setupForm.stamps_required,
      reward_description: setupForm.reward_description,
      is_active: true,
    });
    toast.success("Loyalty program saved!");
    setShowSetup(false);
  };

  const handleCreateCard = async () => {
    if (!newCardForm.clientName.trim()) { toast.error("Client name required"); return; }
    if (!program) return;
    await createCard.mutateAsync({
      programId: program.id,
      clientName: newCardForm.clientName.trim(),
      clientEmail: newCardForm.clientEmail.trim() || undefined,
      clientPhone: newCardForm.clientPhone.trim() || undefined,
    });
    toast.success("Loyalty card created!");
    setNewCardForm({ clientName: "", clientEmail: "", clientPhone: "" });
    setShowNewCard(false);
  };

  const activeCards = cards.filter(c => !c.reward_redeemed);
  const redeemedCards = cards.filter(c => c.reward_redeemed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" /> Client Loyalty
          </h2>
          <p className="text-sm text-muted-foreground">Reward repeat customers with a digital punch card</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showSetup} onOpenChange={setShowSetup}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">{program ? "Edit Program" : "Set Up Program"}</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Loyalty Program Settings</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <Input placeholder="Program name" value={setupForm.name}
                  onChange={e => setSetupForm(s => ({ ...s, name: e.target.value }))} />
                <div className="flex gap-3 items-center">
                  <Input type="number" min={3} max={20} value={setupForm.stamps_required}
                    onChange={e => setSetupForm(s => ({ ...s, stamps_required: parseInt(e.target.value) || 10 }))}
                    className="w-20" />
                  <span className="text-sm text-muted-foreground">stamps for reward</span>
                </div>
                <Input placeholder="Reward (e.g., Free haircut)" value={setupForm.reward_description}
                  onChange={e => setSetupForm(s => ({ ...s, reward_description: e.target.value }))} />
                <Button onClick={handleSetupSave} disabled={upsertProgram.isPending} className="w-full">Save Program</Button>
              </div>
            </DialogContent>
          </Dialog>
          {program && (
            <Dialog open={showNewCard} onOpenChange={setShowNewCard}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Card</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>New Loyalty Card</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <Input placeholder="Client name *" value={newCardForm.clientName}
                    onChange={e => setNewCardForm(s => ({ ...s, clientName: e.target.value }))} />
                  <Input placeholder="Email (optional)" value={newCardForm.clientEmail}
                    onChange={e => setNewCardForm(s => ({ ...s, clientEmail: e.target.value }))} />
                  <Input placeholder="Phone (optional)" value={newCardForm.clientPhone}
                    onChange={e => setNewCardForm(s => ({ ...s, clientPhone: e.target.value }))} />
                  <Button onClick={handleCreateCard} disabled={createCard.isPending} className="w-full">Create Card</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats */}
      {program && (
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-4 text-center">
            <Users className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{activeCards.length}</p>
            <p className="text-xs text-muted-foreground">Active Cards</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Award className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{redeemedCards.length}</p>
            <p className="text-xs text-muted-foreground">Rewards Given</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Stamp className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{cards.reduce((s, c) => s + c.stamps_collected, 0)}</p>
            <p className="text-xs text-muted-foreground">Total Stamps</p>
          </CardContent></Card>
        </div>
      )}

      {/* No program yet */}
      {!program && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Gift className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No Loyalty Program Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a digital punch card to reward repeat customers and boost retention.
            </p>
            <Button onClick={() => setShowSetup(true)}>Set Up Program</Button>
          </CardContent>
        </Card>
      )}

      {/* Active cards */}
      {program && activeCards.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Active Cards ({activeCards.length})</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <AnimatePresence>
              {activeCards.map(card => (
                <PunchCard
                  key={card.id}
                  card={card}
                  stampsRequired={program.stamps_required}
                  onStamp={() => addStamp.mutateAsync({ cardId: card.id }).then(() => toast.success("Stamp added!"))}
                  onRedeem={() => redeemReward.mutateAsync(card.id).then(() => toast.success("Reward redeemed! 🎉"))}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Redeemed */}
      {program && redeemedCards.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Previously Redeemed ({redeemedCards.length})</h3>
          <div className="grid gap-3 sm:grid-cols-2 opacity-60">
            {redeemedCards.slice(0, 4).map(card => (
              <PunchCard
                key={card.id}
                card={card}
                stampsRequired={program.stamps_required}
                onStamp={() => addStamp.mutateAsync({ cardId: card.id }).then(() => toast.success("New cycle started!"))}
                onRedeem={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {program && cards.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No loyalty cards yet. Create one for a returning client!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
