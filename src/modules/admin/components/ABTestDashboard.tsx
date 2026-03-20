import { useState } from "react";
import { useABTests, useABTestVariants } from "@/hooks/useABTest";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FlaskConical, TrendingUp, Eye, MousePointerClick, UserPlus,
  Trophy, Plus, Pause, Play, CheckCircle2, BarChart3,
} from "lucide-react";
import { toast } from "sonner";

function ConversionBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function VariantCard({ variant, isWinner, totalViews }: {
  variant: any;
  isWinner: boolean;
  totalViews: number;
}) {
  const clickRate = variant.views > 0 ? ((variant.clicks / variant.views) * 100).toFixed(1) : "0.0";
  const signupRate = variant.views > 0 ? ((variant.signups / variant.views) * 100).toFixed(1) : "0.0";
  const viewShare = totalViews > 0 ? ((variant.views / totalViews) * 100).toFixed(0) : "0";

  return (
    <div className={`rounded-xl border p-5 transition-all ${isWinner ? "border-success/40 bg-success/5 shadow-sm" : "border-border bg-card"}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Variant {variant.variant_key}
          </span>
          {isWinner && (
            <span className="flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
              <Trophy className="h-3 w-3" /> Winner
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{viewShare}% traffic</span>
      </div>

      {variant.headline && (
        <p className="text-sm font-semibold text-foreground mb-1 line-clamp-2">"{variant.headline}"</p>
      )}
      {variant.cta_text && (
        <p className="text-xs text-muted-foreground mb-4">CTA: "{variant.cta_text}"</p>
      )}

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Eye className="h-3 w-3" />
            <span className="text-2xs font-medium">Views</span>
          </div>
          <p className="text-lg font-bold">{variant.views.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <MousePointerClick className="h-3 w-3" />
            <span className="text-2xs font-medium">Clicks</span>
          </div>
          <p className="text-lg font-bold">{variant.clicks.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <UserPlus className="h-3 w-3" />
            <span className="text-2xs font-medium">Signups</span>
          </div>
          <p className="text-lg font-bold">{variant.signups.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Click rate</span>
            <span className="font-semibold">{clickRate}%</span>
          </div>
          <ConversionBar value={variant.clicks} max={variant.views} />
        </div>
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Signup rate</span>
            <span className="font-semibold">{signupRate}%</span>
          </div>
          <ConversionBar value={variant.signups} max={variant.views} />
        </div>
      </div>
    </div>
  );
}

function CreateTestForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [headlineA, setHeadlineA] = useState("");
  const [ctaA, setCtaA] = useState("Start Free");
  const [headlineB, setHeadlineB] = useState("");
  const [ctaB, setCtaB] = useState("Get Started Free");

  const create = useMutation({
    mutationFn: async () => {
      const { data: test, error: testErr } = await (supabase as any)
        .from("ab_tests")
        .insert({ name, page: "landing", section: "hero", status: "active" })
        .select()
        .single();
      if (testErr) throw testErr;

      const { error: varErr } = await (supabase as any)
        .from("ab_test_variants")
        .insert([
          { test_id: test.id, variant_key: "A", headline: headlineA, cta_text: ctaA, weight: 50 },
          { test_id: test.id, variant_key: "B", headline: headlineB, cta_text: ctaB, weight: 50 },
        ]);
      if (varErr) throw varErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ab-tests-admin"] });
      toast.success("A/B test created and active");
      onClose();
    },
    onError: () => toast.error("Failed to create test"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">New A/B Test</CardTitle>
        <CardDescription>Create two hero variants to test</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Test Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Hero headline test v1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
            <p className="text-sm font-bold">Variant A</p>
            <div>
              <Label className="text-xs">Headline</Label>
              <Input value={headlineA} onChange={(e) => setHeadlineA(e.target.value)} placeholder="Get More Local Customers..." />
            </div>
            <div>
              <Label className="text-xs">CTA Text</Label>
              <Input value={ctaA} onChange={(e) => setCtaA(e.target.value)} />
            </div>
          </div>
          <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
            <p className="text-sm font-bold">Variant B</p>
            <div>
              <Label className="text-xs">Headline</Label>
              <Input value={headlineB} onChange={(e) => setHeadlineB(e.target.value)} placeholder="Turn Every Contact Into Revenue..." />
            </div>
            <div>
              <Label className="text-xs">CTA Text</Label>
              <Input value={ctaB} onChange={(e) => setCtaB(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => create.mutate()} disabled={!name || !headlineA || !headlineB || create.isPending}>
            <FlaskConical className="h-4 w-4 mr-1.5" /> Launch Test
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TestDetail({ test }: { test: any }) {
  const qc = useQueryClient();
  const { data: variants = [] } = useABTestVariants(test.id);
  const totalViews = variants.reduce((s: number, v: any) => s + v.views, 0);

  // Determine winner by signup rate
  const winner = variants.length > 0
    ? variants.reduce((best: any, v: any) => {
        const bestRate = best.views > 0 ? best.signups / best.views : 0;
        const vRate = v.views > 0 ? v.signups / v.views : 0;
        return vRate > bestRate ? v : best;
      }, variants[0])
    : null;

  const toggleStatus = useMutation({
    mutationFn: async () => {
      const newStatus = test.status === "active" ? "paused" : "active";
      const { error } = await (supabase as any)
        .from("ab_tests")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", test.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ab-tests-admin"] });
      toast.success(`Test ${test.status === "active" ? "paused" : "resumed"}`);
    },
  });

  const declareWinner = useMutation({
    mutationFn: async () => {
      if (!winner) return;
      const { error } = await (supabase as any)
        .from("ab_tests")
        .update({ status: "completed", winner_variant_id: winner.id, updated_at: new Date().toISOString() })
        .eq("id", test.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ab-tests-admin"] });
      toast.success("Winner declared! Test completed.");
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {test.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {totalViews.toLocaleString()} total views • Status: {test.status}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {test.status !== "completed" && (
              <>
                <Button variant="outline" size="sm" onClick={() => toggleStatus.mutate()}>
                  {test.status === "active" ? <><Pause className="h-3 w-3 mr-1" /> Pause</> : <><Play className="h-3 w-3 mr-1" /> Resume</>}
                </Button>
                {totalViews >= 50 && (
                  <Button size="sm" onClick={() => declareWinner.mutate()}>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Declare Winner
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {variants.map((v: any) => (
            <VariantCard
              key={v.id}
              variant={v}
              isWinner={test.status === "completed" && test.winner_variant_id === v.id}
              totalViews={totalViews}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ABTestDashboard() {
  const { data: tests = [] } = useABTests();
  const [creating, setCreating] = useState(false);

  const activeTests = tests.filter((t) => t.status === "active" || t.status === "paused");
  const completedTests = tests.filter((t) => t.status === "completed");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" /> Landing Page A/B Tests
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Test hero variations to optimize conversion rates
          </p>
        </div>
        {!creating && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> New Test
          </Button>
        )}
      </div>

      {creating && <CreateTestForm onClose={() => setCreating(false)} />}

      {activeTests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Tests</h3>
          {activeTests.map((t) => (
            <TestDetail key={t.id} test={t} />
          ))}
        </div>
      )}

      {completedTests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Completed Tests</h3>
          {completedTests.map((t) => (
            <TestDetail key={t.id} test={t} />
          ))}
        </div>
      )}

      {tests.length === 0 && !creating && (
        <Card>
          <CardContent className="py-12 text-center">
            <FlaskConical className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No A/B tests yet. Create one to start optimizing.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
