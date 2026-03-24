import { useState } from "react";
import { Megaphone, Mail, FileText, BookOpen, BarChart3, Users, UserCheck, Target, Send, Workflow, ShieldAlert, Loader2, FlaskConical, Globe, Gift, Search, UserX } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdminStats, useIsAdmin } from "@/hooks/useAdminStats";
import AdminCampaignBuilder from "@/modules/admin/components/AdminCampaignBuilder";
import AdminEmailTemplates from "@/modules/admin/components/AdminEmailTemplates";
import AdminSuccessPlaybooks from "@/modules/admin/components/AdminSuccessPlaybooks";
import AdminMarketingAnalytics from "@/modules/admin/components/AdminMarketingAnalytics";
import AdminEmailSequences from "@/modules/admin/components/AdminEmailSequences";
import ABTestDashboard from "@/modules/admin/components/ABTestDashboard";
import LandingPageManager from "@/modules/admin/pages/LandingPageManager";
import AdminEmailPerformance from "@/modules/admin/components/AdminEmailPerformance";
import AdminOnboardingFunnel from "@/modules/admin/components/AdminOnboardingFunnel";
import AdminReferralAnalytics from "@/modules/admin/components/AdminReferralAnalytics";
import AdminSeoPerformance from "@/modules/admin/components/AdminSeoPerformance";
import AdminReengagement from "@/modules/admin/components/AdminReengagement";
import AdminContentLibrary from "@/modules/admin/components/AdminContentLibrary";

export default function AdminMarketingDashboard() {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: stats, isLoading } = useAdminStats();
  const [activeTab, setActiveTab] = useState("overview");

  if (adminLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <ShieldAlert className="h-10 w-10 text-destructive" />
        <h2 className="text-lg font-semibold">Access Denied</h2>
        <p className="text-sm text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    );
  }

  const activeUsers = stats ? Math.round((stats.signups30d / Math.max(stats.totalUsers, 1)) * stats.totalUsers * 0.4) : 0;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight"><span className="font-black text-primary text-4xl">guzzl</span> <span className="font-normal text-muted-foreground">Admin Marketing</span></h1>
            <p className="text-muted-foreground text-sm mt-1">Manage campaigns, templates, and user growth</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="email-perf">Email Perf</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="sequences">Sequences</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="playbooks">Playbooks</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="ab-tests">A/B Tests</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="reengagement">Re-engage</TabsTrigger>
          <TabsTrigger value="content-lib">Content</TabsTrigger>
          <TabsTrigger value="landing-pages">Pages</TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard icon={Users} label="Total Users" value={stats?.totalUsers ?? 0} loading={isLoading} onClick={() => setActiveTab("analytics")} />
            <MetricCard icon={UserCheck} label="Active Users (est.)" value={activeUsers} loading={isLoading} onClick={() => setActiveTab("funnel")} />
            <MetricCard icon={Target} label="Leads (30d)" value={stats?.leads30d ?? 0} loading={isLoading} onClick={() => setActiveTab("campaigns")} />
            <MetricCard icon={Mail} label="Signups (7d)" value={stats?.signups7d ?? 0} loading={isLoading} onClick={() => setActiveTab("email-perf")} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:shadow-card transition-shadow" onClick={() => setActiveTab("email-perf")}>
              <CardHeader className="pb-2">
                <Mail className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-base">Email Performance</CardTitle>
                <CardDescription>Delivery rates, bounces, errors</CardDescription>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:shadow-card transition-shadow" onClick={() => setActiveTab("funnel")}>
              <CardHeader className="pb-2">
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-base">Onboarding Funnel</CardTitle>
                <CardDescription>Track user activation journey</CardDescription>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:shadow-card transition-shadow" onClick={() => setActiveTab("reengagement")}>
              <CardHeader className="pb-2">
                <UserX className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-base">Re-engagement</CardTitle>
                <CardDescription>Win back inactive users</CardDescription>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:shadow-card transition-shadow" onClick={() => setActiveTab("referrals")}>
              <CardHeader className="pb-2">
                <Gift className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-base">Referral Analytics</CardTitle>
                <CardDescription>Track invite performance</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:shadow-card transition-shadow" onClick={() => setActiveTab("campaigns")}>
              <CardHeader className="pb-2">
                <Send className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-base">Send Campaign</CardTitle>
                <CardDescription>Create and send targeted emails</CardDescription>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:shadow-card transition-shadow" onClick={() => setActiveTab("templates")}>
              <CardHeader className="pb-2">
                <FileText className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-base">View Templates</CardTitle>
                <CardDescription>Manage pre-built email templates</CardDescription>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:shadow-card transition-shadow" onClick={() => setActiveTab("seo")}>
              <CardHeader className="pb-2">
                <Search className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-base">SEO Performance</CardTitle>
                <CardDescription>Landing page & request analytics</CardDescription>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:shadow-card transition-shadow" onClick={() => setActiveTab("content-lib")}>
              <CardHeader className="pb-2">
                <BookOpen className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-base">Content Library</CardTitle>
                <CardDescription>Reviews, templates, social proof</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="email-perf" className="mt-4">
          <AdminEmailPerformance />
        </TabsContent>

        <TabsContent value="funnel" className="mt-4">
          <AdminOnboardingFunnel />
        </TabsContent>

        <TabsContent value="campaigns" className="mt-4">
          <AdminCampaignBuilder stats={stats} />
        </TabsContent>

        <TabsContent value="sequences" className="mt-4">
          <AdminEmailSequences />
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <AdminEmailTemplates />
        </TabsContent>

        <TabsContent value="playbooks" className="mt-4">
          <AdminSuccessPlaybooks />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <AdminMarketingAnalytics stats={stats} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="ab-tests" className="mt-4">
          <ABTestDashboard />
        </TabsContent>

        <TabsContent value="referrals" className="mt-4">
          <AdminReferralAnalytics />
        </TabsContent>

        <TabsContent value="seo" className="mt-4">
          <AdminSeoPerformance />
        </TabsContent>

        <TabsContent value="reengagement" className="mt-4">
          <AdminReengagement />
        </TabsContent>

        <TabsContent value="content-lib" className="mt-4">
          <AdminContentLibrary />
        </TabsContent>

        <TabsContent value="landing-pages" className="mt-4">
          <LandingPageManager adminOnly={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, loading }: { icon: any; label: string; value: number; loading: boolean }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">
              {loading ? <span className="animate-pulse text-muted-foreground">—</span> : value.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
