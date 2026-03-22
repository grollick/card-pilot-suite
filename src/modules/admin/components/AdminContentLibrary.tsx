import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Image, Star, FileText, MessageSquare, Quote } from "lucide-react";
import { format } from "date-fns";

export default function AdminContentLibrary() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-content-library"],
    staleTime: 60_000,
    queryFn: async () => {
      // Reviews (testimonials / social proof)
      const { data: reviews } = await (supabase as any)
        .from("reviews")
        .select("id, reviewer_name, rating, review_text, is_public, source, created_at")
        .order("created_at", { ascending: false });

      const allReviews = reviews || [];
      const publicReviews = allReviews.filter((r: any) => r.is_public);
      const avgRating = allReviews.length > 0
        ? (allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length).toFixed(1)
        : "0";

      // Project showcases (portfolio content)
      const { data: projects } = await (supabase as any)
        .from("project_showcases")
        .select("id, title, created_at")
        .order("created_at", { ascending: false });

      // Social posts (content pieces)
      const { data: posts } = await (supabase as any)
        .from("social_posts")
        .select("id, platform, status, caption, created_at")
        .order("created_at", { ascending: false });

      const allPosts = posts || [];
      const publishedPosts = allPosts.filter((p: any) => p.status === "published");
      const scheduledPosts = allPosts.filter((p: any) => p.status === "scheduled");

      // Email templates
      const { data: emailTemplates } = await (supabase as any)
        .from("email_templates")
        .select("id, name, subject, created_at")
        .order("created_at", { ascending: false });

      // Success playbooks / content blocks
      const { data: contentBlocks } = await (supabase as any)
        .from("content_blocks")
        .select("id, block_type, title, created_at")
        .order("created_at", { ascending: false });

      return {
        reviews: { total: allReviews.length, public: publicReviews.length, avgRating, items: allReviews.slice(0, 10) },
        projects: { total: (projects || []).length, items: (projects || []).slice(0, 10) },
        posts: { total: allPosts.length, published: publishedPosts.length, scheduled: scheduledPosts.length },
        emailTemplates: { total: (emailTemplates || []).length, items: (emailTemplates || []).slice(0, 10) },
        contentBlocks: { total: (contentBlocks || []).length, items: (contentBlocks || []).slice(0, 10) },
      };
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Asset overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-[10px] text-muted-foreground">Reviews</p>
                <p className="text-lg font-bold">{data?.reviews.total || 0}</p>
                <p className="text-[10px] text-muted-foreground">Avg: ★{data?.reviews.avgRating}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-[10px] text-muted-foreground">Projects</p>
                <p className="text-lg font-bold">{data?.projects.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-[10px] text-muted-foreground">Social Posts</p>
                <p className="text-lg font-bold">{data?.posts.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-violet-500" />
              <div>
                <p className="text-[10px] text-muted-foreground">Email Templates</p>
                <p className="text-lg font-bold">{data?.emailTemplates.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-pink-500" />
              <div>
                <p className="text-[10px] text-muted-foreground">Content Blocks</p>
                <p className="text-lg font-bold">{data?.contentBlocks.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Testimonials */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Quote className="h-3.5 w-3.5" />Testimonials & Reviews</CardTitle>
            <CardDescription className="text-xs">{data?.reviews.public} public, {(data?.reviews.total || 0) - (data?.reviews.public || 0)} private</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.reviews.items?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No reviews yet</p>
            ) : (
              <div className="space-y-3">
                {data?.reviews.items?.map((r: any) => (
                  <div key={r.id} className="border-b border-border/50 pb-2 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{r.reviewer_name}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-amber-500">{"★".repeat(r.rating)}</span>
                        {r.is_public && <Badge variant="secondary" className="text-[9px]">Public</Badge>}
                      </div>
                    </div>
                    {r.review_text && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.review_text}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Templates */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Email Templates</CardTitle></CardHeader>
          <CardContent>
            {data?.emailTemplates.items?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No templates yet</p>
            ) : (
              <div className="space-y-2">
                {data?.emailTemplates.items?.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground">{t.subject}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{format(new Date(t.created_at), "MMM d")}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
