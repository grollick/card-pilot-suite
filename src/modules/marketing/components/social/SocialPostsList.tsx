import { useState } from "react";
import { Edit2, Trash2, Send, Clock, CheckSquare, Square, MoreHorizontal, Copy, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import EmptyState from "@/components/EmptyState";
import { useSocialPosts, useDeletePost, useBulkDeletePosts, useBulkUpdatePosts, type SocialPostExtended } from "@/hooks/useSocial";
import { getPlatformConfig, getApprovalConfig, CONTENT_LABELS } from "./constants";

interface Props {
  onEdit: (post: SocialPostExtended) => void;
  onViewDetail: (post: SocialPostExtended) => void;
}

export default function SocialPostsList({ onEdit, onViewDetail }: Props) {
  const { data: posts = [], isLoading } = useSocialPosts();
  const deletePost = useDeletePost();
  const bulkDelete = useBulkDeletePosts();
  const bulkUpdate = useBulkUpdatePosts();
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = posts.filter(p => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (platformFilter !== "all") {
      const platforms = (p.platforms_json as any) || [];
      if (!platforms.includes(platformFilter)) return false;
    }
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(p => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    try {
      await bulkDelete.mutateAsync([...selectedIds]);
      toast.success(`${selectedIds.size} posts deleted`);
      setSelectedIds(new Set());
    } catch (e: any) { toast.error(e.message); }
  };

  const handleBulkStatus = async (status: string) => {
    try {
      await bulkUpdate.mutateAsync({ ids: [...selectedIds], updates: { approval_status: status } });
      toast.success(`${selectedIds.size} posts updated`);
      setSelectedIds(new Set());
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      {/* Filters + Bulk Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Platform" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="Instagram">Instagram</SelectItem>
            <SelectItem value="Facebook">Facebook</SelectItem>
            <SelectItem value="LinkedIn">LinkedIn</SelectItem>
            <SelectItem value="Twitter">Twitter</SelectItem>
          </SelectContent>
        </Select>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleBulkStatus("approved")}>Approve</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleBulkStatus("scheduled")}>Schedule</Button>
            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={handleBulkDelete}>Delete</Button>
          </div>
        )}
      </div>

      {/* Select All */}
      {filtered.length > 0 && (
        <button onClick={selectAll} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
          {selectedIds.size === filtered.length ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
          Select all ({filtered.length})
        </button>
      )}

      {/* Posts */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Send} title="No posts found" description="Create your first post or adjust filters." />
      ) : (
        filtered.map(post => {
          const approval = getApprovalConfig(post.approval_status ?? "draft");
          const label = post.content_label ? CONTENT_LABELS.find(l => l.value === post.content_label) : null;
          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card p-4 group hover:border-primary/20 transition-colors cursor-pointer"
              onClick={() => onViewDetail(post)}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedIds.has(post.id)}
                  onCheckedChange={() => toggleSelect(post.id)}
                  onClick={e => e.stopPropagation()}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {((post.platforms_json as any) || []).map((p: string) => {
                      const cfg = getPlatformConfig(p);
                      return (
                        <span key={p} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg?.color ?? "bg-muted"}`}>{p}</span>
                      );
                    })}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${approval.color}`}>
                      {approval.label}
                    </span>
                    {label && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${label.color}`}>
                        {label.label}
                      </span>
                    )}
                    {post.scheduled_at && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                        <Clock className="h-3 w-3" />
                        {format(new Date(post.scheduled_at), "MMM d, h:mm a")}
                      </span>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(post); }}>
                      <Edit2 className="h-3.5 w-3.5 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
                      <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try { await deletePost.mutateAsync(post.id); toast.success("Deleted"); } catch (err: any) { toast.error(err.message); }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
}
