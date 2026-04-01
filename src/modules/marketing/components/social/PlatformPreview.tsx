import { Heart, MessageCircle, Share2, Bookmark, ThumbsUp, Repeat2 } from "lucide-react";
import { getPlatformConfig } from "./constants";

interface Props {
  platform: string;
  content: string;
  hashtags?: string[];
  imageUrl?: string;
}

function InstagramPreview({ content, hashtags, imageUrl }: { content: string; hashtags?: string[]; imageUrl?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 p-2.5">
        <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-[2px]">
          <div className="h-full w-full rounded-full bg-card" />
        </div>
        <span className="text-[10px] font-semibold">your_business</span>
      </div>
      <div className="h-32 bg-muted flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt="Post" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://source.unsplash.com/800x600/?professional+service`; }} />
        ) : (
          <span className="text-xs text-muted-foreground">Image preview</span>
        )}
      </div>
      <div className="p-2.5 space-y-1.5">
        <div className="flex items-center gap-3">
          <Heart className="h-4 w-4" />
          <MessageCircle className="h-4 w-4" />
          <Share2 className="h-4 w-4" />
          <Bookmark className="h-4 w-4 ml-auto" />
        </div>
        <p className="text-[10px] leading-relaxed line-clamp-3">
          <span className="font-semibold">your_business </span>
          {content || "Your post content..."}
        </p>
        {hashtags && hashtags.length > 0 && (
          <p className="text-[10px] text-primary">{hashtags.map(h => `#${h}`).join(" ")}</p>
        )}
      </div>
    </div>
  );
}

function FacebookPreview({ content, imageUrl }: { content: string; imageUrl?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 p-2.5">
        <div className="h-7 w-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-[9px] font-bold">YB</div>
        <div>
          <span className="text-[10px] font-semibold block leading-tight">Your Business</span>
          <span className="text-[8px] text-muted-foreground">Just now · 🌐</span>
        </div>
      </div>
      <div className="px-2.5 pb-2">
        <p className="text-[10px] leading-relaxed line-clamp-4">{content || "Your post content..."}</p>
      </div>
      {imageUrl && (
        <div className="h-32 bg-muted overflow-hidden">
          <img src={imageUrl} alt="Post" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
      )}
      <div className="border-t border-border flex">
        <button className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] text-muted-foreground hover:bg-accent/50">
          <ThumbsUp className="h-3 w-3" /> Like
        </button>
        <button className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] text-muted-foreground hover:bg-accent/50">
          <MessageCircle className="h-3 w-3" /> Comment
        </button>
        <button className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] text-muted-foreground hover:bg-accent/50">
          <Share2 className="h-3 w-3" /> Share
        </button>
      </div>
    </div>
  );
}

function LinkedInPreview({ content }: { content: string }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 p-2.5">
        <div className="h-7 w-7 rounded-full bg-sky-600 flex items-center justify-center text-white text-[9px] font-bold">YB</div>
        <div>
          <span className="text-[10px] font-semibold block leading-tight">Your Business</span>
          <span className="text-[8px] text-muted-foreground">Professional · 1m</span>
        </div>
      </div>
      <div className="px-2.5 pb-2.5">
        <p className="text-[10px] leading-relaxed line-clamp-4">{content || "Your post content..."}</p>
      </div>
      <div className="border-t border-border flex">
        <button className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] text-muted-foreground">
          <ThumbsUp className="h-3 w-3" /> Like
        </button>
        <button className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] text-muted-foreground">
          <MessageCircle className="h-3 w-3" /> Comment
        </button>
        <button className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] text-muted-foreground">
          <Repeat2 className="h-3 w-3" /> Repost
        </button>
      </div>
    </div>
  );
}

function TwitterPreview({ content }: { content: string }) {
  const charCount = (content || "").length;
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden p-2.5">
      <div className="flex gap-2">
        <div className="h-7 w-7 rounded-full bg-gray-400 flex-shrink-0 flex items-center justify-center text-white text-[9px] font-bold">YB</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-semibold">Your Business</span>
            <span className="text-[9px] text-muted-foreground">@yourbiz · 1m</span>
          </div>
          <p className="text-[10px] leading-relaxed line-clamp-4 mt-0.5">{content || "Your post content..."}</p>
          <div className="flex items-center gap-4 mt-1.5">
            <MessageCircle className="h-3 w-3 text-muted-foreground" />
            <Repeat2 className="h-3 w-3 text-muted-foreground" />
            <Heart className="h-3 w-3 text-muted-foreground" />
            <Share2 className="h-3 w-3 text-muted-foreground" />
          </div>
          {charCount > 280 && (
            <p className="text-[9px] text-destructive mt-1">⚠ {charCount}/280 characters</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PlatformPreview({ platform, content, hashtags, imageUrl }: Props) {
  const cfg = getPlatformConfig(platform);
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${cfg?.color ?? "bg-muted"}`}>{platform}</span>
      </div>
      {platform === "Instagram" && <InstagramPreview content={content} hashtags={hashtags} imageUrl={imageUrl} />}
      {platform === "Facebook" && <FacebookPreview content={content} imageUrl={imageUrl} />}
      {platform === "LinkedIn" && <LinkedInPreview content={content} />}
      {(platform === "Twitter" || platform === "X") && <TwitterPreview content={content} />}
      {!["Instagram", "Facebook", "LinkedIn", "Twitter", "X"].includes(platform) && (
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] line-clamp-3">{content || "Your post content..."}</p>
        </div>
      )}
    </div>
  );
}
