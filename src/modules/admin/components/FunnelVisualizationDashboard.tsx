import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserCheck, Zap, Briefcase, MessageSquare, Target, ArrowDown,
  AlertTriangle, CheckCircle2, Lightbulb, ChevronDown, ChevronUp,
  Filter, Calendar, MapPin, X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAdminFunnelStats, type FunnelStage } from "@/hooks/useAdminFunnelStats";
import FunnelHealthMonitor from "@/modules/admin/components/FunnelHealthMonitor";

const stageIcons: Record<string, typeof Users> = {
  leads: Users,
  replies: MessageSquare,
  signups: UserCheck,
  activated: Zap,
  first_lead: Target,
  first_response: MessageSquare,
  first_job: Briefcase,
};

const stageColors: Record<string, string> = {
  leads: "bg-primary",
  replies: "bg-[hsl(var(--chart-2))]",
  signups: "bg-[hsl(var(--chart-3))]",
  activated: "bg-[hsl(var(--success))]",
  first_lead: "bg-[hsl(var(--warning))]",
  first_response: "bg-[hsl(var(--chart-4))]",
  first_job: "bg-[hsl(var(--chart-5))]",
};

function getConversionColor(rate: number): string {
  if (rate >= 50) return "text-[hsl(var(--success))]";
  if (rate >= 20) return "text-[hsl(var(--warning))]";
  return "text-destructive";
}

function getConversionBg(rate: number): string {
  if (rate >= 50) return "bg-[hsl(var(--success))]/10 border-[hsl(var(--success))]/20";
  if (rate >= 20) return "bg-[hsl(var(--warning))]/10 border-[hsl(var(--warning))]/20";
  return "bg-destructive/10 border-destructive/20";
}

export default function FunnelVisualizationDashboard() {
  const [days, setDays] = useState(30);
  const [profession, setProfession] = useState("");
  const [location, setLocation] = useState("");
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  const { data, isLoading } = useAdminFunnelStats(
    days,
    profession || undefined,
    location || undefined,
  );

  const stages = data?.stages || [];
  const insights = data?.insights || [];
  const maxCount = Math.max(...stages.map(s => s.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Funnel Visualization
          </h2>
          <p className="text-sm text-muted-foreground">
            Track user journey from acquisition to first job
          </p>
        </div>
      </div>

      {/* Health Monitor */}
      <FunnelHealthMonitor />

      {/* Filters */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="60">Last 60 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Filter by profession..."
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              className="w-[160px] h-8 text-xs"
            />

            <div className="relative">
              <MapPin className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-[140px] h-8 text-xs pl-7"
              />
            </div>

            {(profession || location) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() => { setProfession(""); setLocation(""); }}
              >
                <X className="h-3 w-3" /> Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Funnel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">User Journey Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4 py-4">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {stages.map((stage, idx) => {
                const Icon = stageIcons[stage.id] || Users;
                const barColor = stageColors[stage.id] || "bg-primary";
                const widthPct = Math.max((stage.count / maxCount) * 100, 4);
                const prevCount = idx > 0 ? stages[idx - 1].count : 0;
                const convRate = prevCount > 0 ? (stage.count / prevCount) * 100 : 100;
                const dropOff = prevCount > 0 ? prevCount - stage.count : 0;
                const isExpanded = expandedStage === stage.id;

                return (
                  <div key={stage.id}>
                    {/* Drop-off indicator between stages */}
                    {idx > 0 && (
                      <div className="flex items-center gap-2 py-1 px-4">
                        <div className="flex-1 border-t border-dashed border-border/60" />
                        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 border text-xs ${getConversionBg(convRate)}`}>
                          <ArrowDown className="h-3 w-3" />
                          <span className={`font-bold tabular-nums ${getConversionColor(convRate)}`}>
                            {convRate.toFixed(0)}%
                          </span>
                          {dropOff > 0 && (
                            <span className="text-muted-foreground text-[10px]">
                              (-{dropOff.toLocaleString()})
                            </span>
                          )}
                        </div>
                        <div className="flex-1 border-t border-dashed border-border/60" />
                      </div>
                    )}

                    {/* Stage row */}
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      className="rounded-xl border border-border/50 hover:border-border transition-colors cursor-pointer"
                      onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                    >
                      <div className="flex items-center gap-3 p-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${barColor}/10`}>
                          <Icon className={`h-5 w-5 ${barColor.replace("bg-", "text-").replace("/10", "")}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{stage.label}</span>
                              <Badge variant="outline" className="text-[10px]">
                                Stage {idx + 1}
                              </Badge>
                            </div>
                            <span className="text-2xl font-bold tabular-nums text-foreground">
                              {stage.count.toLocaleString()}
                            </span>
                          </div>
                          <div className="h-2.5 rounded-full bg-muted/60 overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${barColor}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${widthPct}%` }}
                              transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1], delay: idx * 0.08 }}
                            />
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </div>

                      {/* Drill-down panel */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-border/50 px-4 py-3">
                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                Users in this stage ({stage.users.length} shown)
                              </p>
                              {stage.users.length === 0 ? (
                                <p className="text-xs text-muted-foreground/60 py-2">No users in this stage</p>
                              ) : (
                                <ScrollArea className="max-h-[200px]">
                                  <div className="space-y-1.5">
                                    {stage.users.map((user, ui) => (
                                      <div key={user.id || ui} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-muted/30">
                                        <div>
                                          <span className="font-medium">{user.name || "Unknown"}</span>
                                          {user.email && (
                                            <span className="text-muted-foreground ml-2">{user.email}</span>
                                          )}
                                          {user.business && (
                                            <span className="text-muted-foreground ml-2">{user.business}</span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {user.profession && (
                                            <Badge variant="outline" className="text-[9px]">{user.profession}</Badge>
                                          )}
                                          <span className="text-[10px] text-muted-foreground">
                                            {new Date(user.created_at).toLocaleDateString()}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversion Summary */}
      {!isLoading && stages.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Stage-to-Stage Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {stages.slice(1).map((stage, idx) => {
                const prev = stages[idx];
                const rate = prev.count > 0 ? (stage.count / prev.count) * 100 : 0;
                return (
                  <div key={stage.id} className="text-center p-3 rounded-xl border border-border/50">
                    <p className="text-[10px] text-muted-foreground mb-1">
                      {prev.label} → {stage.label}
                    </p>
                    <p className={`text-xl font-bold tabular-nums ${getConversionColor(rate)}`}>
                      {rate.toFixed(0)}%
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {!isLoading && insights.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-[hsl(var(--warning))]" />
              Automated Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.map((insight, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 text-sm p-3 rounded-lg border ${
                  insight.type === "warning"
                    ? "bg-[hsl(var(--warning))]/5 border-[hsl(var(--warning))]/10"
                    : insight.type === "success"
                    ? "bg-[hsl(var(--success))]/5 border-[hsl(var(--success))]/10"
                    : "bg-primary/5 border-primary/10"
                }`}
              >
                {insight.type === "warning" ? (
                  <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))] shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))] shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">{insight.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{insight.suggestion}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Overall Conversion */}
      {!isLoading && stages.length >= 2 && (
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Conversion</p>
                <p className="text-xs text-muted-foreground">
                  {stages[0].label} → {stages[stages.length - 1].label}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-bold tabular-nums ${
                  getConversionColor(stages[0].count > 0 ? (stages[stages.length - 1].count / stages[0].count) * 100 : 0)
                }`}>
                  {stages[0].count > 0
                    ? ((stages[stages.length - 1].count / stages[0].count) * 100).toFixed(1)
                    : "0"}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {stages[stages.length - 1].count.toLocaleString()} of {stages[0].count.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
