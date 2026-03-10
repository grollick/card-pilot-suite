import { Edit2, Copy, Trash2, Send, Clock, ListOrdered } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { toast } from "sonner";
import { useDeletePost, useUpdatePost } from "@/hooks/useSocialPosts";
import type { SocialPost } from "@/hooks/useSocialPosts";
import { getPlatformConfig, getStatusConfig, getLabelConfig, deriveDbStatus } from "./constants";
import type { PostStatus } from "./constants";
import PlatformPreview from "./PlatformPreview";

interface Props {
  post: SocialPost | null;
  onClose: () => void;
  onEdit: (post: SocialPost) => void;
}

export default function PostDetailDrawer({ post, onClose, onEdit }: Props) {
  const deletePost = useDeletePost();
  const updatePost = useUpdatePost();

  if (!post) return null;

  const platforms = ((post.platforms_json as any) || []) as string[];
  const statusCfg = getStatusConfig(post.approval_status ?? "draft");
  const label = post.content_label ? getLabelConfig(post.content_label) : null;

  const changeStatus = async (newStatus: PostStatus) => {
    try {
      await updatePost.mutateAsync({ id: post.id, approval_status: newStatus, status: deriveDbStatus(newStatus) } as any);
      toast.success(`Post marked as ${newStatus}`);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async () => {
    try {
      await deletePost.mutateAsync(post.id);
      toast.success("Post deleted");
      onClose();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Sheet open={!!post} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-base">Post Details</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          {/* Status & Labels */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`text-[10px] ${statusCfg.color}`}>{statusCfg.label}</Badge>
            {label && <Badge className={`text-[10px] ${label.color}`}>{label.label}</Badge>}
            {platforms.map(p => {
              const cfg = getPlatformConfig(p);
              return <Badge key={p} variant="outline" className={`text-[10px] ${cfg?.color}`}>{p}</Badge>;
            })}
          </div>

          <Separator />

          <div>
            <p className="text-xs text-muted-foreground mb-1">Content</p>
            <p className="text-sm whitespace-pre-wrap">{post.content}</p>
          </div>

          {post.platform_overrides && Object.keys(post.platform_overrides).length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Platform Customizations</p>
              {Object.entries(post.platform_overrides).map(([platform, override]) => (
                override?.content ? (
                  <div key={platform} className="mb-2">
                    <p className="text-[10px] font-medium text-primary">{platform}</p>
                    <p className="text-xs text-muted-foreground">{override.content}</p>
                  </div>
                ) : null
              ))}
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-sm font-medium">{statusCfg.label}</p>
            </div>
            {post.scheduled_at && (
              <div>
                <p className="text-xs text-muted-foreground">Scheduled</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(post.scheduled_at), "MMM d, h:mm a")}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm">{format(new Date(post.created_at), "MMM d, yyyy")}</p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-xs text-muted-foreground mb-2">Previews</p>
            <div className="space-y-3">
              {platforms.slice(0, 2).map(p => (
                <PlatformPreview
                  key={p}
                  platform={p}
                  content={post.platform_overrides?.[p]?.content || post.content}
                  hashtags={post.platform_overrides?.[p]?.hashtags}
                />
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Actions</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="text-xs h-8 gap-1" onClick={() => { onClose(); onEdit(post); }}>
                <Edit2 className="h-3 w-3" /> Edit
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-8 gap-1">
                <Copy className="h-3 w-3" /> Duplicate
              </Button>
              {post.approval_status === "pending_approval" && (
                <Button variant="outline" size="sm" className="text-xs h-8 gap-1 text-emerald-600" onClick={() => changeStatus("approved")}>
                  <Send className="h-3 w-3" /> Approve
                </Button>
              )}
              <Button variant="outline" size="sm" className="text-xs h-8 gap-1" onClick={() => changeStatus("published")}>
                <Send className="h-3 w-3" /> Publish Now
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-8 gap-1" onClick={() => changeStatus("queued")}>
                <ListOrdered className="h-3 w-3" /> Add to Queue
              </Button>
              <Button variant="destructive" size="sm" className="text-xs h-8 gap-1" onClick={handleDelete}>
                <Trash2 className="h-3 w-3" /> Delete
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
