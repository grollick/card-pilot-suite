import { Plus, Calendar as CalendarIcon, Send, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/EmptyState";
import { motion } from "framer-motion";

const mockPosts = [
  { id: 1, content: "Excited to announce our new service offerings! 🎉", platforms: ["Instagram", "Facebook"], scheduledAt: "Mar 5, 2026 10:00 AM", status: "scheduled" },
  { id: 2, content: "Tips for choosing the right professional for your needs...", platforms: ["LinkedIn"], scheduledAt: "Mar 7, 2026 2:00 PM", status: "draft" },
  { id: 3, content: "Thank you to all our amazing clients! ❤️", platforms: ["Instagram", "Facebook", "LinkedIn"], scheduledAt: "Mar 3, 2026 9:00 AM", status: "published" },
];

const platformColors: Record<string, string> = {
  Instagram: "bg-pink-500/10 text-pink-600",
  Facebook: "bg-blue-500/10 text-blue-600",
  LinkedIn: "bg-sky-600/10 text-sky-700",
  Twitter: "bg-gray-500/10 text-gray-600",
};

export default function SocialScheduler() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Social</h1>
          <p className="text-muted-foreground text-sm mt-1">Schedule and manage your social media posts</p>
        </div>
        <Button className="shadow-glow">
          <Plus className="h-4 w-4 mr-2" /> New Post
        </Button>
      </div>

      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">All Posts</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4 space-y-4">
          {mockPosts.map(post => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    {post.platforms.map(p => (
                      <span key={p} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${platformColors[p] || "bg-muted"}`}>{p}</span>
                    ))}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {post.scheduledAt}
                    </span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                  post.status === "published" ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" :
                  post.status === "scheduled" ? "bg-primary/10 text-primary" :
                  "bg-muted text-muted-foreground"
                }`}>{post.status}</span>
              </div>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <EmptyState
            icon={CalendarIcon}
            title="Content Calendar"
            description="Visual calendar view coming soon. Your scheduled posts will appear here."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
