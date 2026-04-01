import { useSocialPostLimits } from "../components/social/SocialPlanGate";
import SocialDashboard from "../components/social/SocialDashboard";
import { cn } from "@/lib/utils";

export default function SocialScheduler() {
  const socialLimits = useSocialPostLimits();

  return (
    <div className="min-h-[calc(100vh-4rem)] -m-4 md:-m-6 lg:-m-8">
      {/* Top bar */}
      <div className="flex items-center justify-between h-14 px-6 border-b border-border bg-background sticky top-0 z-10">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="font-black text-primary text-3xl">guzzl</span>{" "}
          <span className="font-normal text-muted-foreground">Social</span>
        </h1>
        {socialLimits.monthlyLimit !== -1 && (
          <div className="text-right">
            <p className={cn("text-xs font-medium", socialLimits.isAtLimit ? "text-destructive" : "text-muted-foreground")}>
              {socialLimits.postsThisMonth}/{socialLimits.monthlyLimit} posts this month
            </p>
          </div>
        )}
      </div>

      {/* Dashboard */}
      <div className="p-4 md:p-6 lg:p-8">
        <SocialDashboard />
      </div>
    </div>
  );
}
