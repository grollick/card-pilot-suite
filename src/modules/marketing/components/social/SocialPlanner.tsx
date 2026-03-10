import { useState } from "react";
import { GripVertical, Clock, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { useSocialPosts, useUpdatePost, type SocialPostExtended } from "@/hooks/useSocial";
import { PLANNER_COLUMNS, getPlatformConfig, getLabelConfig } from "./constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  onEdit: (post: SocialPostExtended) => void;
  onViewDetail: (post: SocialPostExtended) => void;
}

const STATUS_TO_COLUMN: Record<string, string> = {
  draft: "idea",
  pending_approval: "drafting",
  approved: "ready",
  scheduled: "scheduled",
  published: "published",
};

const COLUMN_TO_STATUS: Record<string, { approval_status: string; status: string }> = {
  idea: { approval_status: "draft", status: "draft" },
  drafting: { approval_status: "pending_approval", status: "draft" },
  ready: { approval_status: "approved", status: "draft" },
  scheduled: { approval_status: "scheduled", status: "scheduled" },
  published: { approval_status: "published", status: "published" },
};

export default function SocialPlanner({ onEdit, onViewDetail }: Props) {
  const { data: posts = [] } = useSocialPosts();
  const updatePost = useUpdatePost();
  const [draggedPost, setDraggedPost] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const getPostsForColumn = (colId: string) => {
    return posts.filter(p => {
      const mappedCol = STATUS_TO_COLUMN[p.approval_status ?? "draft"] ?? "idea";
      return mappedCol === colId;
    });
  };

  const handleDragStart = (postId: string) => setDraggedPost(postId);
  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverCol(colId);
  };
  const handleDragLeave = () => setDragOverCol(null);

  const handleDrop = async (colId: string) => {
    if (!draggedPost) return;
    setDragOverCol(null);
    setDraggedPost(null);

    const target = COLUMN_TO_STATUS[colId];
    if (!target) return;

    try {
      await updatePost.mutateAsync({ id: draggedPost, ...target } as any);
      toast.success("Post moved");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-3 min-w-[900px] pb-4">
        {PLANNER_COLUMNS.map(col => {
          const colPosts = getPostsForColumn(col.id);
          return (
            <div
              key={col.id}
              className={cn(
                "flex-1 min-w-[200px] rounded-xl border-2 bg-muted/20 transition-colors",
                col.color,
                dragOverCol === col.id && "border-primary bg-primary/5"
              )}
              onDragOver={e => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(col.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between p-3 pb-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold">{col.label}</h4>
                  <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{colPosts.length}</Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit({} as any)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* Cards */}
              <div className="space-y-2 p-2 pt-0 min-h-[200px]">
                {colPosts.map(post => {
                  const platforms = ((post.platforms_json as any) || []) as string[];
                  const label = post.content_label ? getLabelConfig(post.content_label) : null;
                  return (
                    <div
                      key={post.id}
                      draggable
                      onDragStart={() => handleDragStart(post.id)}
                      onClick={() => onViewDetail(post)}
                      className={cn(
                        "rounded-lg border border-border bg-card p-2.5 cursor-pointer hover:border-primary/30 transition-all group",
                        draggedPost === post.id && "opacity-50"
                      )}
                    >
                      <div className="flex items-start gap-1.5">
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] line-clamp-2 leading-relaxed">{post.content}</p>
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            {platforms.slice(0, 3).map(p => {
                              const cfg = getPlatformConfig(p);
                              return (
                                <span key={p} className={`text-[8px] px-1.5 py-0.5 rounded-full ${cfg?.color}`}>{p}</span>
                              );
                            })}
                            {label && (
                              <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${label.color}`}>{label.label}</span>
                            )}
                          </div>
                          {post.scheduled_at && (
                            <p className="text-[9px] text-muted-foreground mt-1 flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              {format(new Date(post.scheduled_at), "MMM d, h:mm a")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
