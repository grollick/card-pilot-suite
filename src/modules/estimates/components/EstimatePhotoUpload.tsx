import { useRef, useState } from "react";
import { Camera, X, Loader2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useEstimatePhotos,
  useUploadEstimatePhoto,
  useDeleteEstimatePhoto,
  getEstimatePhotoUrl,
  type EstimatePhoto,
} from "@/hooks/useEstimatePhotos";

interface Props {
  estimateId: string;
  lineItemId?: string | null;
  compact?: boolean;
}

export default function EstimatePhotoUpload({ estimateId, lineItemId, compact }: Props) {
  const { data: allPhotos = [] } = useEstimatePhotos(estimateId);
  const upload = useUploadEstimatePhoto();
  const remove = useDeleteEstimatePhoto();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const photos = allPhotos.filter((p) =>
    lineItemId ? p.line_item_id === lineItemId : !p.line_item_id
  );

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      upload.mutate({ estimateId, lineItemId: lineItemId ?? null, file });
    });
  };

  const handleRemove = (photo: EstimatePhoto) => {
    remove.mutate({ id: photo.id, filePath: photo.file_path, estimateId });
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {photos.map((p) => (
          <div key={p.id} className="relative group">
            <img
              src={getEstimatePhotoUrl(p.file_path)}
              alt={p.file_name}
              className="h-8 w-8 rounded object-cover border border-border cursor-pointer"
              onClick={() => setPreview(getEstimatePhotoUrl(p.file_path))}
            />
            <button
              onClick={() => handleRemove(p)}
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 border border-dashed border-border"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
        >
          {upload.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Camera className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {preview && (
          <div
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setPreview(null)}
          >
            <img src={preview} alt="Preview" className="max-h-[80vh] max-w-[90vw] rounded-lg" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ImagePlus className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Job Site Photos</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {photos.map((p) => (
          <div key={p.id} className="relative group">
            <img
              src={getEstimatePhotoUrl(p.file_path)}
              alt={p.file_name}
              className="h-20 w-20 rounded-lg object-cover border border-border cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
              onClick={() => setPreview(getEstimatePhotoUrl(p.file_path))}
            />
            <button
              onClick={() => handleRemove(p)}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          className="h-20 w-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {upload.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Camera className="h-5 w-5" />
              <span className="text-[10px]">Add Photo</span>
            </>
          )}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {preview && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <img src={preview} alt="Preview" className="max-h-[80vh] max-w-[90vw] rounded-lg" />
        </div>
      )}
    </div>
  );
}
